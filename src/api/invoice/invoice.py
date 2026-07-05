"""
src/api/invoice/invoice_routes.py

Updated to support the same detailed structure as estimates:
- estimate_type, rooms_json, materials_json, price_breakdown_json, extras_json
- create_invoice() now accepts all of these
- update_invoice() now accepts all of these
- Fixed: removed manual updated_at=datetime.utcnow() on InvoiceItem insert —
  the real fix is the nullable=True on the model column (see model patch)
"""

from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from api.models import db, Invoice, InvoiceItem, InvoiceStatus, Contractor, Customer, Job, User
from api.routes import api
from api.utils import APIException
from datetime import datetime, timedelta
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
import os


def get_current_contractor_id():
    user_id = get_jwt_identity()
    user = User.query.filter_by(id=user_id).first()
    if not user:
        raise APIException('User not found', status_code=404)
    contractor = Contractor.query.filter_by(user_id=user_id).first()
    if not contractor:
        raise APIException('Contractor not found', status_code=404)
    return contractor.id


def _api_exc_message(e):
    for attr in ("message", "description"):
        if hasattr(e, attr):
            return getattr(e, attr)
    return str(e)


def _apply_period_filter(q, year, month):
    if year and year != "all":
        q = q.filter(db.extract("year", Invoice.issue_date) == int(year))
    if month and month != "all":
        q = q.filter(db.extract("month", Invoice.issue_date) == int(month))
    return q


def _apply_sort(q, sort_by):
    sorts = {
        "newest":      Invoice.create_at.desc(),
        "oldest":      Invoice.create_at.asc(),
        "amount_desc": Invoice.total_amount.desc(),
        "amount_asc":  Invoice.total_amount.asc(),
        "due_soon":    Invoice.due_date.asc(),
    }
    return q.order_by(sorts.get(sort_by, Invoice.create_at.desc()))

@api.route('/invoices', methods=['GET'])
@jwt_required()
def get_invoices():
    try:
        contractor_id = get_current_contractor_id()

        status   = request.args.get('status', 'all')
        search   = request.args.get('search', '')
        year     = request.args.get('year', 'all')
        month    = request.args.get('month', 'all')
        sort_by  = request.args.get('sort', 'newest')
        page     = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 200, type=int)

        q = Invoice.query.filter_by(contractor_id=contractor_id)

        if status and status != 'all':
            try:
                q = q.filter(Invoice.status == InvoiceStatus(status))
            except ValueError:
                pass

        q = _apply_period_filter(q, year, month)

        if search:
            q = q.join(Customer, Invoice.customer_id == Customer.id, isouter=True).filter(
                db.cast(Invoice.invoice_number, db.String).ilike(f'%{search}%') |
                Customer.name.ilike(f'%{search}%') |
                Customer.email.ilike(f'%{search}%')
            )

        q = _apply_sort(q, sort_by)
        pagination = q.paginate(page=page, per_page=per_page, error_out=False)

        return jsonify({
            'invoices':     [i.serialize() for i in pagination.items],
            'total':        pagination.total,
            'pages':        pagination.pages,
            'current_page': page,
        }), 200
    except APIException as e:
        return jsonify({'error': _api_exc_message(e)}), e.status_code
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/invoices/stats', methods=['GET'])
@jwt_required()
def get_invoice_stats():
    try:
        contractor_id = get_current_contractor_id()
        year  = request.args.get('year', 'all')
        month = request.args.get('month', 'all')

        q = Invoice.query.filter_by(contractor_id=contractor_id)
        q = _apply_period_filter(q, year, month)
        invoices = q.all()

        def total(lst): return sum(float(i.total_amount or 0) for i in lst)
        def by_status(s): return [i for i in invoices if (i.status.value if isinstance(i.status, InvoiceStatus) else i.status) == s]

        paid    = by_status('paid')
        sent    = by_status('sent')
        overdue = by_status('overdue')
        draft   = by_status('draft')

        return jsonify({
            'total_paid':        total(paid),
            'total_outstanding': total(sent),
            'total_overdue':     total(overdue),
            'total_draft':       total(draft),
            'count_paid':        len(paid),
            'count_sent':        len(sent),
            'count_overdue':     len(overdue),
            'count_draft':       len(draft),
            'count_total':       len(invoices),
        }), 200
    except APIException as e:
        return jsonify({'error': _api_exc_message(e)}), e.status_code
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api.route('/invoices/<int:invoice_id>', methods=['GET'])
@jwt_required()
def get_invoice(invoice_id):
    try:
        contractor_id = get_current_contractor_id()
        inv = Invoice.query.filter_by(id=invoice_id, contractor_id=contractor_id).first()
        if not inv:
            return jsonify({'error': 'Invoice not found'}), 404
        return jsonify({'invoice': inv.serialize()}), 200
    except APIException as e:
        return jsonify({'error': _api_exc_message(e)}), e.status_code
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# CREATE — now accepts full detailed breakdown (rooms, materials, extras)
# ─────────────────────────────────────────────────────────────────────────────
@api.route('/invoices', methods=['POST'])
@jwt_required()
def create_invoice():
    try:
        contractor_id = get_current_contractor_id()
        contractor = Contractor.query.get(contractor_id)
        data = request.get_json()

        if not data:
            return jsonify({'error': 'No data provided'}), 400

        required = ['customer_id', 'job_id']
        missing = [f for f in required if not data.get(f)]
        if missing:
            return jsonify({'error': f'Missing required fields: {", ".join(missing)}'}), 400

        customer = db.session.get(Customer, data['customer_id'])
        if not customer or customer.contractor_id != contractor_id:
            return jsonify({'error': 'Customer not found or unauthorized'}), 404

        job = db.session.get(Job, data['job_id'])
        if not job or job.contractor_id != contractor_id:
            return jsonify({'error': 'Job not found or unauthorized'}), 404

        items = data.get('items', [])

        # If a detailed price_breakdown_json was generated (from PriceCalculatorModal),
        # subtotal/tax/total are usually passed explicitly. Otherwise fall back to items.
        if data.get('subtotal') is not None:
            subtotal = float(data['subtotal'])
        elif items:
            subtotal = sum(float(it.get('quantity', 1)) * float(it.get('unit_price', 0)) for it in items)
        else:
            subtotal = 0.0

        if subtotal <= 0 and not items:
            return jsonify({'error': 'Invoice must have either line items or a subtotal from the breakdown'}), 400

        if data.get('tax') is not None:
            tax_amount = float(data['tax'])
        elif data.get('apply_tax', True):
            tax_rate = float(contractor.tax_rate or 0)
            tax_amount = round(subtotal * (tax_rate / 100), 2)
        else:
            tax_amount = 0

        total = float(data['total_amount']) if data.get('total_amount') is not None else round(subtotal + tax_amount, 2)

        due_date = datetime.utcnow() + timedelta(days=30)
        if data.get('due_date'):
            try:
                due_date = datetime.fromisoformat(data['due_date'])
            except ValueError:
                pass

        last = Invoice.query.filter_by(contractor_id=contractor_id).order_by(Invoice.invoice_number.desc()).first()
        next_number = (last.invoice_number + 1) if last else 1001

        inv = Invoice(
            contractor_id          = contractor_id,
            customer_id             = customer.id,
            job_id                  = job.id,
            invoice_number          = next_number,
            issue_date              = datetime.utcnow(),
            subtotal                = subtotal,
            tax                     = tax_amount,
            total_amount            = total,
            status                  = InvoiceStatus.draft,
            due_date                = due_date,
            notes                   = data.get('notes', ''),
            payment_link            = data.get('payment_link', ''),
            estimate_type           = data.get('estimate_type'),
            materials_json          = data.get('materials_json'),
            price_breakdown_json    = data.get('price_breakdown_json'),
            rooms_json              = data.get('rooms_json'),
            extras_json             = data.get('extras_json'),
        )
        db.session.add(inv)
        db.session.flush()

        for item in items:
            db.session.add(InvoiceItem(
                invoice_id  = inv.id,
                description = item.get('description', 'Service'),
                quantity    = int(item.get('quantity', 1)),
                unit_price  = float(item.get('unit_price', 0)),
            ))

        db.session.commit()
        return jsonify({'msg': 'Invoice created', 'invoice': inv.serialize()}), 201

    except APIException as e:
        db.session.rollback()
        return jsonify({'error': _api_exc_message(e)}), e.status_code
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# UPDATE — supports replacing breakdown fields + line items
# ─────────────────────────────────────────────────────────────────────────────
@api.route('/invoices/<int:invoice_id>', methods=['PUT'])
@jwt_required()
def update_invoice(invoice_id):
    try:
        contractor_id = get_current_contractor_id()
        inv = Invoice.query.filter_by(id=invoice_id, contractor_id=contractor_id).first()
        if not inv:
            return jsonify({'error': 'Invoice not found'}), 404

        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        str_fields = ['notes', 'payment_link', 'estimate_type',
                      'materials_json', 'price_breakdown_json',
                      'rooms_json', 'extras_json']
        for field in str_fields:
            if field in data:
                setattr(inv, field, data[field])

        if 'due_date' in data and data['due_date']:
            inv.due_date = datetime.fromisoformat(data['due_date'])
        if 'subtotal' in data:
            inv.subtotal = float(data['subtotal'])
        if 'tax' in data:
            inv.tax = float(data['tax'])
        if 'total_amount' in data:
            inv.total_amount = float(data['total_amount'])

        # Replace line items entirely if "items" provided
        if 'items' in data:
            InvoiceItem.query.filter_by(invoice_id=inv.id).delete()
            for it in data['items']:
                db.session.add(InvoiceItem(
                    invoice_id  = inv.id,
                    description = it.get('description', 'Service'),
                    quantity    = int(it.get('quantity', 1)),
                    unit_price  = float(it.get('unit_price', 0)),
                ))

        db.session.commit()
        return jsonify({'msg': 'Invoice updated', 'invoice': inv.serialize()}), 200

    except APIException as e:
        db.session.rollback()
        return jsonify({'error': _api_exc_message(e)}), e.status_code
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# STATUS PATCH
# ─────────────────────────────────────────────────────────────────────────────
@api.route('/invoices/<int:invoice_id>/status', methods=['PATCH'])
@jwt_required()
def update_invoice_status(invoice_id):
    try:
        contractor_id = get_current_contractor_id()
        inv = Invoice.query.filter_by(id=invoice_id, contractor_id=contractor_id).first()
        if not inv:
            return jsonify({'error': 'Invoice not found'}), 404

        data = request.get_json()
        status = data.get('status')
        if not status:
            return jsonify({'error': 'No status provided'}), 400

        try:
            inv.status = InvoiceStatus(status)
        except ValueError:
            return jsonify({'error': f'Invalid status: {status}'}), 400

        if inv.status == InvoiceStatus.paid:
            inv.paid_at = datetime.utcnow()
        if inv.status == InvoiceStatus.sent and not inv.sent_at:
            inv.sent_at = datetime.utcnow()

        db.session.commit()
        return jsonify({'msg': 'Invoice status updated', 'invoice': inv.serialize()}), 200

    except APIException as e:
        db.session.rollback()
        return jsonify({'error': _api_exc_message(e)}), e.status_code
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# DELETE
# ─────────────────────────────────────────────────────────────────────────────
@api.route('/invoices/<int:invoice_id>', methods=['DELETE'])
@jwt_required()
def delete_invoice(invoice_id):
    try:
        contractor_id = get_current_contractor_id()
        inv = Invoice.query.filter_by(id=invoice_id, contractor_id=contractor_id).first()
        if not inv:
            return jsonify({'error': 'Invoice not found'}), 404

        db.session.delete(inv)
        db.session.commit()
        return jsonify({'msg': 'Invoice deleted'}), 200

    except APIException as e:
        db.session.rollback()
        return jsonify({'error': _api_exc_message(e)}), e.status_code
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# SEND EMAIL
# ─────────────────────────────────────────────────────────────────────────────
@api.route('/invoices/<int:invoice_id>/send', methods=['POST'])
@jwt_required()
def send_invoice_email(invoice_id):
    try:
        contractor_id = get_current_contractor_id()
        inv = Invoice.query.filter_by(id=invoice_id, contractor_id=contractor_id).first()
        if not inv:
            return jsonify({'error': 'Invoice not found'}), 404

        customer   = inv.invoice_customer
        contractor = inv.invoice_contractor
        if not customer:
            return jsonify({'error': 'Customer not found'}), 404
        if not customer.email:
            return jsonify({'error': 'Customer has no email on file'}), 400

        rows = "".join([
            f"<tr><td style='padding:8px 12px;border-bottom:1px solid #f1f5f9'>{it.description}</td>"
            f"<td style='padding:8px 12px;text-align:center;border-bottom:1px solid #f1f5f9'>{it.quantity}</td>"
            f"<td style='padding:8px 12px;text-align:right;border-bottom:1px solid #f1f5f9'>${float(it.unit_price):.2f}</td>"
            f"<td style='padding:8px 12px;text-align:right;border-bottom:1px solid #f1f5f9;font-weight:700'>${float(it.row_total):.2f}</td></tr>"
            for it in inv.invoice_items
        ])

        biz_name = (contractor.business_name or (contractor.user.name if contractor.user else "")) if contractor else "Your Contractor"
        html = f"""
        <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;background:#fff;">
          <div style="background:#0f2340;padding:28px 28px 20px;border-radius:12px 12px 0 0">
            <h1 style="color:#fff;margin:0;font-size:22px">Invoice #{inv.invoice_number}</h1>
            <p style="color:#94a3b8;margin:6px 0 0;font-size:13px">from {biz_name}</p>
          </div>
          <div style="padding:28px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px">
            <p style="color:#374151;font-size:14px">Hi {customer.name},</p>
            <p style="color:#64748b;font-size:13px">Please find your invoice details below. Payment is due by <strong>{inv.due_date.strftime('%B %d, %Y') if inv.due_date else 'upon receipt'}</strong>.</p>
            <table style="width:100%;border-collapse:collapse;margin:20px 0;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
              <thead><tr style="background:#f8fafc">
                <th style="padding:10px 12px;text-align:left;font-size:11px;color:#94a3b8;text-transform:uppercase">Description</th>
                <th style="padding:10px 12px;text-align:center;font-size:11px;color:#94a3b8;text-transform:uppercase">Qty</th>
                <th style="padding:10px 12px;text-align:right;font-size:11px;color:#94a3b8;text-transform:uppercase">Price</th>
                <th style="padding:10px 12px;text-align:right;font-size:11px;color:#94a3b8;text-transform:uppercase">Total</th>
              </tr></thead>
              <tbody>{rows}</tbody>
            </table>
            <div style="text-align:right;padding:12px 0;border-top:2px solid #1e293b">
              <span style="font-size:11px;color:#94a3b8;text-transform:uppercase;margin-right:16px">Total Due</span>
              <span style="font-size:22px;font-weight:900;color:#1e293b">${float(inv.total_amount):.2f}</span>
            </div>
            {f'<p style="margin-top:16px;padding:12px;background:#f8fafc;border-radius:8px;color:#64748b;font-size:13px"><strong>Notes:</strong> {inv.notes}</p>' if inv.notes else ''}
            <p style="margin-top:20px;color:#94a3b8;font-size:12px;text-align:center">
              Questions? Contact us at {(contractor.business_email or (contractor.user.email if contractor.user else '')) if contractor else ''}
            </p>
          </div>
        </div>"""

        if os.environ.get("SENDGRID_API_KEY"):
            sg = SendGridAPIClient(os.getenv('SENDGRID_API_KEY'))
            sg.send(Mail(
                from_email   = os.getenv('MAIL_FROM'),
                to_emails    = customer.email,
                subject      = f"Invoice #{inv.invoice_number} – ${float(inv.total_amount):.2f} due from {biz_name}",
                html_content = html,
            ))
        else:
            from flask_mail import Mail as FlaskMail, Message
            from flask import current_app
            mail = FlaskMail(current_app)
            msg = Message(f"Invoice #{inv.invoice_number}", sender=os.getenv('MAIL_FROM'), recipients=[customer.email])
            msg.html = html
            mail.send(msg)

        inv.status = InvoiceStatus.sent
        if not inv.sent_at:
            inv.sent_at = datetime.utcnow()
        db.session.commit()
        return jsonify({'msg': 'Invoice sent', 'invoice': inv.serialize()}), 200

    except APIException as e:
        db.session.rollback()
        return jsonify({'error': _api_exc_message(e)}), e.status_code
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
import os, base64
from flask import request, jsonify
from flask_cors import CORS
from flask_jwt_extended import jwt_required, get_jwt_identity
from api.models import db, Contractor, EstimateRequest

from api.routes import api

CORS(api)
# ── SendGrid sender (preferred) ───────────────────────────────────────────────
def _send_via_sendgrid(to_email, from_email, subject, html_body, pdf_bytes, filename):
    from sendgrid import SendGridAPIClient
    from sendgrid.helpers.mail import (
        Mail, Attachment, FileContent, FileName, FileType, Disposition
    )
    message = Mail(
        from_email=from_email,
        to_emails=to_email,
        subject=subject,
        html_content=html_body,
    )
    attachment = Attachment(
        FileContent(base64.b64encode(pdf_bytes).decode()),
        FileName(filename),
        FileType("application/pdf"),
        Disposition("attachment"),
    )
    message.attachment = attachment
    client = SendGridAPIClient(os.environ.get("SENDGRID_API_KEY"))
    client.send(message)


# ── Fallback: SMTP via Flask-Mail ─────────────────────────────────────────────
def _send_via_smtp(to_email, from_email, subject, html_body, pdf_bytes, filename):
    from flask_mail import Mail, Message
    from flask import current_app
    mail = Mail(current_app)
    msg  = Message(subject, sender=from_email, recipients=[to_email])
    msg.html = html_body
    msg.attach(filename, "application/pdf", pdf_bytes)
    mail.send(msg)

# ── Email HTML template ───────────────────────────────────────────────────────
def _build_email_html(estimate, contractor):
    name    = estimate.customer_name or "Client"
    biz     = contractor.business_name or "Your Contractor"
    phone   = contractor.phone or ""
    email   = contractor.business_email or ""
    quoted  = f"${float(estimate.quoted_amount):,.2f}" if estimate.quoted_amount else ""
    t_type  = (estimate.estimate_type or "").replace("_", " ").title() if estimate.estimate_type else "Work"

    quoted_block = f"""
    <div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:12px;
                padding:24px;text-align:center;margin:24px 0;">
      <p style="margin:0 0 4px;color:#15803d;font-size:13px;font-weight:600;letter-spacing:.05em;">
        TOTAL ESTIMATE
      </p>
      <p style="margin:0;font-size:36px;font-weight:700;color:#15803d;">{quoted}</p>
    </div>
    """ if quoted else ""

    return f"""
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background:#f5f5f5;font-family:system-ui,-apple-system,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td align="center" style="padding:40px 16px;">
          <table width="600" cellpadding="0" cellspacing="0"
            style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">

            <!-- header -->
            <tr>
              <td style="background:#1a1a1a;padding:28px 32px;">
                <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">{biz}</h1>
                <p style="margin:6px 0 0;color:#9ca3af;font-size:13px;">
                  {phone}{"&nbsp;&nbsp;·&nbsp;&nbsp;" + email if email else ""}
                </p>
              </td>
            </tr>

            <!-- body -->
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 16px;font-size:16px;color:#111;">Hi {name},</p>
                <p style="margin:0 0 16px;font-size:14px;color:#374151;line-height:1.6;">
                  Please find attached your <strong>{t_type} estimate</strong>.
                  The full breakdown is in the PDF — no hidden costs, everything is itemized clearly.
                </p>

                {quoted_block}

                <p style="margin:0 0 24px;font-size:14px;color:#374151;line-height:1.6;">
                  If you have any questions or want to move forward, please contact us directly.
                </p>

                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background:#1a1a1a;border-radius:8px;padding:12px 24px;">
                      <a href="tel:{phone}" style="color:#fff;text-decoration:none;font-size:14px;font-weight:600;">
                        📞 Call us: {phone}
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- footer -->
            <tr>
              <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 32px;">
                <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                  This estimate is valid for 30 days · {biz}
                </p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
    """

@api.route("/estimates/<int:estimate_id>/send-email", methods=["POST"])
@jwt_required()
def send_estimate_email(estimate_id):
    """
    Receives a base64-encoded PDF from the React frontend and emails it
    to the client.

    Body:
    {
      "recipient_email": "client@example.com",
      "pdf_base64": "<base64 string>",
      "filename": "estimate-42.pdf"
    }
    """
    try:
        user_id    = get_jwt_identity()
        contractor = Contractor.query.filter_by(user_id=user_id).first()
        if not contractor:
            return jsonify({"error": "Contractor not found"}), 404

        estimate = EstimateRequest.query.filter_by(
            id=estimate_id, contractor_id=contractor.id
        ).first()
        if not estimate:
            return jsonify({"error": "Estimate not found"}), 404

        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        recipient = data.get("recipient_email") or estimate.customer_email
        if not recipient:
            return jsonify({"error": "recipient_email is required"}), 400

        pdf_base64 = data.get("pdf_base64")
        filename   = data.get("filename", f"estimate-{estimate_id}.pdf")

        if not pdf_base64:
            return jsonify({"error": "pdf_base64 is required"}), 400

        pdf_bytes = base64.b64decode(pdf_base64)

        from_email = os.environ.get("MAIL_FROM", "noreply@example.com")
        biz_name   = contractor.business_name or "Your Contractor"
        subject    = f"{biz_name} — Your Estimate #{estimate_id}"
        html_body  = _build_email_html(estimate, contractor)

        # Try SendGrid first, fall back to Flask-Mail SMTP
        if os.environ.get("SENDGRID_API_KEY"):
            _send_via_sendgrid(recipient, from_email, subject, html_body, pdf_bytes, filename)
        else:
            _send_via_smtp(recipient, from_email, subject, html_body, pdf_bytes, filename)

        return jsonify({
            "message": f"Estimate sent to {recipient}",
            "recipient": recipient,
        }), 200

    except Exception as e:
        return jsonify({"error": f"Failed to send email: {str(e)}"}), 500
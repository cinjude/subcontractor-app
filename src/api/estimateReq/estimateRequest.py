import cloudinary
import cloudinary.uploader
import os
from flask import request, jsonify
from flask_cors import CORS
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import IntegrityError
from sqlalchemy import or_, and_, func, case
from datetime import datetime, timedelta
from api.models import (
    db, User, Contractor, Customer, Services,
    EstimateRequest, EstimateRoom, EstimatePhoto,
    EstimateStatus, EstimateType,
    PaintSurfaceCondition, PaintType, PaintFinish, PaintCoats,
    FlooringMaterial, FlooringCurrentState, FlooringPattern, SubfloorCondition,
    InvoiceItem, Invoice, InvoiceStatus, Job, JobStatus, JobPriority, ContractorRates
)
from api.utils import APIException

from api.routes import api

cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)

CORS(api)

@api.route('/estimate-requests/test', methods=['GET'])
def test_estimate_requests():
    """Test endpoint to verify estimate requests routes are working"""
    return jsonify({
        'message': 'Estimate requests routes are working!',
        'endpoints': [
            'GET /api/estimate-requests',
            'POST /api/estimate-requests',
            'GET /api/estimate-requests/<id>',
            'PUT /api/estimate-requests/<id>',
            'DELETE /api/estimate-requests/<id>',
            'GET /api/estimate-requests/categories'
        ]
    }), 200

def get_current_contractor_id():
    user_id = get_jwt_identity()
    user = User.query.filter_by(id=user_id).first()
    if not user:
        raise APIException('User not found', status_code=404)
    
    contractor = Contractor.query.filter_by(user_id=user_id).first()
    if not contractor:
        raise APIException('Contractor not found', status_code=404)
    
    return contractor.id

def _parse_estimate_fields(data, estimate):
    
    str_fields = [
        'customer_name', 'customer_email', 'customer_phone',
        'customer_address', 'description', 'budget_range',
        'desired_colors', 'repairs_detail', 'contractor_notes',
        'floor_leveling_mode', 'price_breakdown_json'
    ]
    for f in str_fields:
        if f in data:
            setattr(estimate, f, data[f])
 
    int_fields = [
        'door_count', 'window_count', 'transition_strips', 'stair_count',
        'furniture_rooms', 'furniture_heavy', 'floor_leveling_bags', 'travel_miles'
    ]
    for f in int_fields:
        if f in data:
            setattr(estimate, f, int(data[f]) if data[f] is not None else 0)
 
    bool_fields = [
        'include_ceiling', 'include_trim', 'include_doors',
        'client_provides_paint', 'repairs_needed',
        'include_removal', 'include_baseboards', 'include_stairs',
        'moisture_barrier', 'floor_leveling', 'heavy_demo', 'use_flat_travel'
    ]
    if 'floor_leveling_mode' in data:
        estimate.floor_leveling_mode = data['floor_leveling_mode']
    if 'price_breakdown_json' in data:
        estimate.price_breakdown_json = data['price_breakdown_json']

    for f in bool_fields:
        if f in data:
            setattr(estimate, f, bool(data[f]))

    enum_map = {
        'estimate_type'          : EstimateType,
        'status'                 : EstimateStatus,
        'paint_surface_condition': PaintSurfaceCondition,
        'paint_coats'            : PaintCoats,
        'paint_type'             : PaintType,
        'paint_finish'           : PaintFinish,
        'flooring_material'      : FlooringMaterial,
        'flooring_current'       : FlooringCurrentState,
        'flooring_pattern'       : FlooringPattern,
        'subfloor_condition'     : SubfloorCondition,
    }
    for field, EnumClass in enum_map.items():
        if field in data and data[field]:
            try:
                setattr(estimate, field, EnumClass(data[field]))
            except ValueError:
                pass   
 
    if 'total_sqft' in data and data['total_sqft'] is not None:
        estimate.total_sqft = float(data['total_sqft'])
 
    if 'quoted_amount' in data and data['quoted_amount'] is not None:
        estimate.quoted_amount = float(data['quoted_amount'])
 
    if 'service_id' in data:
        estimate.service_id = data['service_id']
 
    if 'customer_id' in data:
        estimate.customer_id = data['customer_id']
 
    if 'preferred_date' in data and data['preferred_date']:
        try:
            estimate.preferred_date = datetime.fromisoformat(data['preferred_date'])
        except ValueError:
            pass
 
    return estimate

@api.route('/estimates', methods=['GET'])
@jwt_required()
def get_all_estimates():
    try:
        contractor_id = get_current_contractor_id()
        contractor = Contractor.query.filter_by(id=contractor_id).first()
        if not contractor:
            return jsonify({'error': 'Contractor not found'}), 404
 
        status   = request.args.get('status', 'all')
        est_type = request.args.get('type',   'all')
        search   = request.args.get('search', '')
        page     = request.args.get('page',     1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
 
        q = EstimateRequest.query.filter_by(contractor_id=contractor.id)
 
        if status != 'all':
            try:
                q = q.filter(EstimateRequest.status == EstimateStatus(status))
            except ValueError:
                pass
 
        if est_type != 'all':
            try:
                q = q.filter(EstimateRequest.estimate_type == EstimateType(est_type))
            except ValueError:
                pass
 
        if search:
            term = f'%{search}%'
            q = q.filter(
                EstimateRequest.customer_name.ilike(term)  |
                EstimateRequest.customer_email.ilike(term) |
                EstimateRequest.customer_address.ilike(term)
            )
 
        pagination = q.order_by(EstimateRequest.create_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
 
        return jsonify({
            'estimates'   : [e.serialize() for e in pagination.items],
            'total'       : pagination.total,
            'pages'       : pagination.pages,
            'current_page': page,
        }), 200
 
    except Exception as e:
        return jsonify({'error': f'Failed to fetch estimates: {str(e)}'}), 500

@api.route('/estimates/stats', methods=['GET'])
@jwt_required()
def get_estimate_stats():
    try:
        contractor_id = get_current_contractor_id()

        row = db.session.query(
            func.count().label('total'),
            func.sum(case((EstimateRequest.status == EstimateStatus.new, 1), else_=0)).label('new'),
            func.sum(case((EstimateRequest.status == EstimateStatus.rejected, 1), else_=0)).label('rejected'),
            func.sum(case((EstimateRequest.status == EstimateStatus.converted, 1), else_=0)).label('converted'),
            func.sum(case((EstimateRequest.estimate_type == EstimateType.painting, 1), else_=0)).label('painting'),
            func.sum(case((EstimateRequest.estimate_type == EstimateType.flooring, 1), else_=0)).label('flooring'),
            func.coalesce(func.sum(EstimateRequest.quoted_amount), 0).label('total_quoted'),
        ).filter(EstimateRequest.contractor_id == contractor_id).one()
        
        return jsonify({
            'total': row.total or 0,
            'new': int(row.new or 0),
            'rejected': int(row.rejected or 0),
            'converted': int(row.converted or 0),
            'painting': int(row.painting or 0),
            'flooring': int(row.flooring or 0),
            'total_quoted': float(row.total_quoted or 0),
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to fetch estimate stats: {str(e)}'}), 500

@api.route('/estimates/<int:estimate_id>', methods=['GET'])
@jwt_required()
def get_single_estimate(estimate_id):
    try:
        contractor_id = get_current_contractor_id()

        estimate = EstimateRequest.query.filter_by(
            id=estimate_id,
            contractor_id=contractor_id
        ).first()
        
        if not estimate:
            return jsonify({'error': 'Estimate not found'}), 404
        
        return jsonify({
            'msg': 'Estimate retrieved successfully',
            'estimate': estimate.serialize()
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch estimate: {str(e)}'}), 500

@api.route('/estimates/create', methods=['POST'])
@jwt_required()
def create_estimate():
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'No data provided'}), 400

        contractor_id = get_current_contractor_id()
        contractor = Contractor.query.filter_by(id=contractor_id).first()
        if not contractor:
            return jsonify({'error': 'Contractor not found'}), 404

        required_fields = ['customer_name', 'customer_email', 'customer_phone', 'estimate_type']
        missing = [f for f in required_fields if not data.get(f)]
        if missing:
            return jsonify({'error': f'Missing required fields: {", ".join(missing)}'}), 400

        if data.get('customer_id'):
            customer = db.session.get(Customer, data['customer_id'])
            if not customer or customer.contractor_id != contractor_id:
                return jsonify({'error': 'Customer not found or unauthorized'}), 404

        estimate = EstimateRequest(
            contractor_id=contractor_id,
            status=EstimateStatus.new
        )

        estimate = _parse_estimate_fields(data, estimate)
        
        db.session.add(estimate)
        db.session.flush()

        rooms_data = data.get('rooms', [])
        for room_data in rooms_data:
            room =  EstimateRoom(
                estimate_id=estimate.id,
                name=room_data.get('name', 'Room'),
                length_ft=room_data.get('length_ft'),
                width_ft=room_data.get('width_ft'),
                height_ft=room_data.get('height_ft'),
                notes=room_data.get('notes'),   
            )
            db.session.add(room)

        db.session.commit()
        
        return jsonify({
            'msg': 'Estimate created successfully',
            'estimate': estimate.serialize()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create estimate: {str(e)}'}), 500

@api.route('/estimates/<int:estimate_id>', methods=['DELETE'])
@jwt_required()
def delete_estimate(estimate_id):
    try:
        contractor_id = get_current_contractor_id()
        estimate=EstimateRequest.query.filter_by(id=estimate_id, contractor_id=contractor_id).first()

        if not estimate:
            return jsonify({'error': 'Estimate not found or unauthorized'}), 404

        db.session.delete(estimate)
        db.session.commit()
        
        return jsonify({'msg': 'Estimate deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete estimate: {str(e)}'}), 500

@api.route('/estimates/<int:estimate_id>', methods=['PUT'])
@jwt_required()
def update_estimate(estimate_id):
    try:
        contractor_id = get_current_contractor_id()

        estimate = EstimateRequest.query.filter_by(id=estimate_id, contractor_id=contractor_id).first()

        if not estimate:
            return jsonify({'error': 'Estimate not found or unauthorized'}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        estimate = _parse_estimate_fields(data, estimate)
        
        db.session.commit()
        
        return jsonify({
            'msg': 'Estimate updated successfully',
            'estimate': estimate.serialize()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update estimate: {str(e)}'}), 500

@api.route('/estimates/<int:estimate_id>/status', methods=['PATCH'])
@jwt_required()
def update_estimate_status(estimate_id):
    try:
        contractor_id = get_current_contractor_id()
        estimate = EstimateRequest.query.filter_by(id=estimate_id, contractor_id=contractor_id).first()

        if not estimate:
            return jsonify({'error': 'Estimate not found or unauthorized'}), 404

        data = request.get_json()
        new_status = data['status']

        if not new_status:
            return jsonify({'error': 'No status provided'}), 400

        try:
            estimate.status = EstimateStatus(new_status)
        except ValueError:
            return jsonify({'error': f'Invalid status: {new_status}. Valid: new, converted, rejected '}), 400

        if 'quoted_amount' in data and data['quoted_amount'] is not None:
            estimate.quoted_amount = float(data['quoted_amount'])
        if 'contractor_notes' in data:
            estimate.contractor_notes = data['contractor_notes']
        
        db.session.commit()
        
        return jsonify({
            'msg': 'Estimate status updated successfully',
            'estimate': estimate.serialize()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update estimate status: {str(e)}'}), 500

@api.route('/estimates/<int:estimate_id>/rooms', methods=['POST'])
@jwt_required()
def add_room(estimate_id):
    try:
        contractor_id=get_current_contractor_id()
        estimate = EstimateRequest.query.filter_by(id=estimate_id, contractor_id=contractor_id).first()

        if not estimate:
            return jsonify({'error': 'Estimate not found or unauthorized'}), 404

        data = request.get_json()
        if not data or not data.get('name'):
            return jsonify({'error': 'Room name is required'}), 400
        
        room = EstimateRoom(
            estimate_id=estimate_id,
            name=data['name'],
            length_ft =data.get("length_ft"),
            width_ft  =data.get("width_ft"),
            height_ft =data.get("height_ft"),
            notes     =data.get("notes"),
        )
        db.session.add(room)
        db.session.commit()
        
        return jsonify({
            'msg': 'Room added successfully',
            'room': room.serialize(),
            'total_sqft': estimate.computed_sqft
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to add room: {str(e)}'}), 500

@api.route('/estimates/<int:estimate_id>/rooms/<int:room_id>', methods=['PUT'])
@jwt_required()
def update_room(estimate_id, room_id):
    try:
        contractor_id=get_current_contractor_id()
        estimate = EstimateRequest.query.filter_by(id=estimate_id, contractor_id=contractor_id).first()
        if not estimate:
            return jsonify({'error': 'Estimate not found or unauthorized'}), 404
        
        room = EstimateRoom.query.filter_by(id=room_id, estimate_id=estimate_id).first()
        if not room:
            return jsonify({'error': 'Room not found or unauthorized'}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        if data.get('name'):
            room.name = data['name']
        if data.get('length_ft') is not None:
            room.length_ft = float(data['length_ft']) if data['length_ft'] else None
        if data.get('width_ft') is not None:
            room.width_ft = float(data['width_ft']) if data['width_ft'] else None
        if data.get('height_ft') is not None:
            room.height_ft = float(data['height_ft']) if data['height_ft'] else None
        if data.get('notes'):
            room.notes = data['notes']
        
        db.session.commit()
        
        return jsonify({
            'msg': 'Room updated successfully',
            'room': room.serialize(),
            'total_sqft': estimate.computed_sqft
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update room: {str(e)}'}), 500

@api.route('/estimates/<int:estimate_id>/rooms/<int:room_id>', methods=['DELETE'])
@jwt_required()
def delete_room(estimate_id, room_id):
    try:
        contractor_id = get_current_contractor_id()
        estimate = EstimateRequest.query.filter_by(id=estimate_id, contractor_id=contractor_id).first()
        if not estimate:
            return jsonify({'error': 'Estimate not found or unauthorized'}), 404

        room = EstimateRoom.query.filter_by(id=room_id, estimate_id=estimate_id).first()
        if not room:
            return jsonify({'error': 'Room not found'}), 404

        db.session.delete(room)
        db.session.commit()
        return jsonify({'msg': 'Room deleted', 'total_sqft': estimate.computed_sqft}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete room: {str(e)}'}), 500

@api.route('/estimates/<int:estimate_id>/photos', methods=['POST'])
@jwt_required()
def add_photo(estimate_id):
    try:
        contractor_id=get_current_contractor_id()

        estimate = EstimateRequest.query.filter_by(id=estimate_id, contractor_id=contractor_id).first()
        if not estimate:
            return jsonify({'error': 'Estimate not found or unauthorized'}), 404
        
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not file.content_type.startswith('image/'):
            return jsonify({'error': 'File must be an image'}), 400

        result = cloudinary.uploader.upload(
            file,
            folder=f'estimates/{estimate_id}/photos',
            resource_type='image'
        )

        photo = EstimatePhoto(
            estimate_id=estimate_id,
            image_url=result['secure_url'],
            caption=request.form.get('caption', ''),
            uploaded_by='contractor'
        )
        db.session.add(photo)
        db.session.commit()
        
        return jsonify({
            'msg': 'Photo uploaded successfully',
            'photo': photo.serialize()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to upload photo: {str(e)}'}), 500
        
@api.route('/estimates/<int:estimate_id>/photos/<int:photo_id>', methods=['DELETE'])
@jwt_required()
def delete_photo(estimate_id, photo_id):
    try:
        contractor_id = get_current_contractor_id()
        estimate = EstimateRequest.query.filter_by(id=estimate_id, contractor_id=contractor_id).first()

        if not estimate:
            return jsonify({"error": "Estimate not found or unauthorized"}), 404

        photo = EstimatePhoto.query.filter_by(id=photo_id, estimate_id=estimate_id).first()

        if not photo:
            return jsonify({"error": "Photo not found or unauthorized"}), 404
        
        db.session.delete(photo)
        db.session.commit()
        
        return jsonify({"msg": "Photo deleted successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to delete photo: {str(e)}"}), 500

@api.route('/estimates/<int:estimate_id>/convert-to-job', methods=['POST'])
@jwt_required()
def convert_estimate_to_job(estimate_id):
    try:
        contractor_id=get_current_contractor_id()
        estimate = EstimateRequest.query.filter_by(id=estimate_id, contractor_id=contractor_id).first()

        if not estimate:
            return jsonify({'error': 'Estimate not found or unauthorized'}), 404

        if estimate.quoted_amount is None:
            return jsonify({
            'error': 'Cannot convert: estimate has no quoted amount. Set a price first.'}), 400
            
        data = request.get_json(silent=True) or {}
        type_label =(estimate.estimate_type.value
                    if hasattr(estimate.estimate_type, 'value')
                    else str(estimate.estimate_type))

        job_title = data.get('job_name') or f'{type_label.title()} - {estimate.customer_name}'
        crew = data.get('crew', '')

        start_date = None
        if data.get('start_date'):
            try:
                start_date=datetime.fromisoformat(data['start_date'])
            except ValueError:
                pass

        customer = None
        if estimate.customer_id:
            customer = db.session.get(Customer, estimate.customer_id)           
        else:
            customer = Customer.query.filter_by(contractor_id=contractor_id, email=estimate.customer_email).first()

        if not customer:
            customer = Customer(
                contractor_id=contractor_id,
                name=estimate.customer_name,
                email=estimate.customer_email,
                phone=estimate.customer_phone or '',
                address=estimate.customer_address or '',
                city='',
                state='',
                zip_code='',
                )
        db.session.add(customer)
        db.session.flush()    

        notes_parts = []
        if estimate.description:
            notes_parts.append(estimate.description)
        if crew:
            notes_parts.append(f'Crew: {crew}')
        if estimate.contractor_notes:
            notes_parts.append(f'Quote notes: {estimate.contractor_notes}')
        combined_notes = "\n".join(notes_parts) if notes_parts else "Converted from estimate"

        job = Job(
            contractor_id = contractor_id,
            customer_id   = customer.id,
            service_id    = estimate.service_id,         
            title         = job_title,
            description   = combined_notes,
            status        = JobStatus.PENDING,
            priority      = JobPriority.MEDIUM,
            location      = estimate.customer_address,
            budget        = estimate.quoted_amount,       
            schedule_date = start_date or datetime.utcnow(),
            start_date    = start_date,
            estimate_total= estimate.quoted_amount,
            categories    = type_label,                  
            notes         = combined_notes
            )
        db.session.add(job)
        db.session.flush()

        estimate.status = EstimateStatus.converted

        db.session.commit()
        return jsonify({

            'msg'     : 'Estimate successfully converted to job',
            'job_id'  : job.id,
            'job'     : job.serialize(),
            'estimate': estimate.serialize(),}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to convert estimate to job: {str(e)}'}), 500

@api.route('/estimates/<int:estimate_id>/convert-to-invoice', methods=['POST'])
@jwt_required()
def convert_estimate_to_invoice(estimate_id):
    try:
        contractor_id = get_current_contractor_id()

        # BUG 1 FIXED: Estimate → EstimateRequest  (wrong model name)
        estimate = EstimateRequest.query.filter_by(
            id=estimate_id,
            contractor_id=contractor_id
        ).first()

        if not estimate:
            return jsonify({'error': 'Estimate not found or access denied'}), 404

        if estimate.quoted_amount is None:
            return jsonify({'error': 'Cannot invoice: estimate has no quoted amount'}), 400

        if estimate.status == EstimateStatus.converted:
            return jsonify({'error': 'Estimate is already converted'}), 400

        data = request.get_json(silent=True) or {}

        # BUG 2 FIXED: timedelta was used but never imported — add this import
        from datetime import timedelta
        due_date = datetime.utcnow() + timedelta(days=30)
        if data.get('due_date'):
            try:
                due_date = datetime.fromisoformat(data['due_date'])
            except ValueError:
                pass

        # Find or create customer
        customer = None
        if estimate.customer_id:
            customer = db.session.get(Customer, estimate.customer_id)
        else:
            customer = Customer.query.filter_by(
                contractor_id=contractor_id,
                email=estimate.customer_email
            ).first()

        if not customer:
            customer = Customer(
                contractor_id=contractor_id,
                name=estimate.customer_name,
                email=estimate.customer_email,
                phone=estimate.customer_phone or '',
                address=estimate.customer_address or '',
                city='',
                state='',
                zip_code='',
            )
            db.session.add(customer)
            db.session.flush()

        # BUG 3 FIXED: estimate.estimate_type.value() — .value is a property, not a method
        type_label = (
            estimate.estimate_type.value
            if hasattr(estimate.estimate_type, 'value')
            else str(estimate.estimate_type)
        )

        # BUG 4 FIXED: two errors in the Job creation
        #   service.id → estimate.service_id  (service variable doesn't exist)
        #   f'{type_label.title() - {...}}' → f'{type_label.title()} — {estimate.customer_name}'
        #   (the f-string had a math operation inside it — syntax error)
        job = Job(
            contractor_id=contractor_id,
            customer_id=customer.id,
            service_id=estimate.service_id,
            title=f'{type_label.title()} — {estimate.customer_name}',
            description=estimate.description or 'Converted from estimate',
            status=JobStatus.PENDING,
            priority=JobPriority.MEDIUM,
            location=estimate.customer_address,
            budget=estimate.quoted_amount,
            schedule_date=datetime.utcnow(),
            estimate_total=estimate.quoted_amount,
            categories=type_label,
            notes=estimate.contractor_notes or '',
        )
        db.session.add(job)
        db.session.flush()

        # Generate next invoice number for this contractor
        from sqlalchemy import func as sqlfunc
        last_num = db.session.query(
            sqlfunc.max(Invoice.invoice_number)
        ).filter_by(contractor_id=contractor_id).scalar() or 0
        next_num = last_num + 1

        # Calculate tax
        # BUG 5 FIXED: contractor_req → contractor_rec (typo — variable name mismatch)
        contractor_rec = Contractor.query.get(contractor_id)
        tax_rate   = float(contractor_rec.tax_rate or 0)
        subtotal   = float(estimate.quoted_amount)
        tax_amount = round(subtotal * (tax_rate / 100), 2)
        total      = round(subtotal + tax_amount, 2)

        invoice = Invoice(
            contractor_id=contractor_id,
            customer_id=customer.id,
            job_id=job.id,
            invoice_number=next_num,
            issue_date=datetime.utcnow(),
            due_date=due_date,
            subtotal=subtotal,
            tax=tax_amount,
            total_amount=total,
            status=InvoiceStatus.draft,
            payment_link='',
            notes=estimate.contractor_notes or '',
        )
        db.session.add(invoice)
        db.session.flush()

        item = InvoiceItem(
            invoice_id=invoice.id,
            description=(
                f'{type_label.title()} — {int(estimate.computed_sqft)} sq ft'
                if estimate.computed_sqft else type_label.title()
            ),
            quantity=1,
            unit_price=subtotal,
            updated_at=datetime.utcnow(),
        )
        db.session.add(item)

        estimate.status = EstimateStatus.converted

        db.session.commit()

        return jsonify({
            'msg': 'Estimate converted to job and invoice created',
            'job_id': job.id,
            'invoice_id': invoice.id,
            'invoice_number': next_num,
            'estimate': estimate.serialize(),
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error converting estimate to invoice: {str(e)}'}), 500

@api.route('/contractor/rates', methods=['GET'])
@jwt_required()
def get_contractor_rates():
    try:
        contractor_id = get_current_contractor_id()
 
        rates = ContractorRates.query.filter_by(contractor_id=contractor_id).first()
 
        if not rates:
            rates = ContractorRates(contractor_id=contractor_id)
            db.session.add(rates)
            db.session.commit()
 
        return jsonify({'rates': rates.serialize()}), 200
 
    except Exception as e:
        return jsonify({'error': f'Failed to fetch rates: {str(e)}'}), 500

@api.route('/contractor/rates', methods=['PUT'])
@jwt_required()
def update_contractor_rates():
    try:
        contractor_id = get_current_contractor_id()
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
 
        rates = ContractorRates.query.filter_by(contractor_id=contractor_id).first()
        if not rates:
            rates = ContractorRates(contractor_id=contractor_id)
            db.session.add(rates)
 
        all_fields = [
            'paint_base_per_sqft', 'paint_extra_coat_sqft', 'paint_ceiling_sqft',
            'paint_trim_sqft', 'paint_door_each', 'paint_window_each',
            'paint_repair_surcharge', 'paint_color_change_pct', 'paint_dark_to_light_pct',
            'paint_removal_per_sqft', 'paint_baseboard_lft', 'paint_stair_each',
            'floor_hardwood_sqft', 'floor_engineered_sqft', 'floor_laminate_sqft',
            'floor_vinyl_sqft', 'floor_tile_ceramic_sqft', 'floor_tile_porcelain_sqft',
            'floor_carpet_sqft', 'floor_concrete_sqft',
            'floor_removal_sqft', 'floor_baseboard_lft', 'floor_stair_each',
            'floor_transition_each', 'floor_diagonal_pct', 'floor_herringbone_pct',
            'minimum_job_fee', 'travel_fee_per_mile', 'travel_fee_flat',
            'furniture_moving_room', 'furniture_moving_heavy',
            'moisture_barrier_sqft', 'floor_leveling_sqft',
            'floor_leveling_bag', 'heavy_demo_sqft',
            'backsplash_tile_sqft', 'shower_tile_sqft', 'shower_pan_each',
        ]
 
        for field in all_fields:
            if field in data and data[field] is not None:
                setattr(rates, field, float(data[field]))
 
        db.session.commit()
        return jsonify({'msg': 'Rates updated successfully', 'rates': rates.serialize()}), 200
 
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update rates: {str(e)}'}), 500
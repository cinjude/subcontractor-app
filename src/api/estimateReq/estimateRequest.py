import cloudinary
import cloudinary.uploader
import os
from flask import request, jsonify
from flask_cors import CORS
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import IntegrityError
from sqlalchemy import or_, and_, func, case
from datetime import datetime
from api.models import (
    db, User, Contractor, Customer, Services,
    EstimateRequest, EstimateRoom, EstimatePhoto,
    EstimateStatus, EstimateType,
    PaintSurfaceCondition, PaintType, PaintFinish, PaintCoats,
    FlooringMaterial, FlooringCurrentState, FlooringPattern, SubfloorCondition,
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
    ]
    for f in str_fields:
        if f in data:
            setattr(estimate, f, data[f])
 
    int_fields = ['door_count', 'window_count', 'transition_strips', 'stair_count']
    for f in int_fields:
        if f in data:
            setattr(estimate, f, int(data[f]) if data[f] is not None else 0)
 
    bool_fields = [
        'include_ceiling', 'include_trim', 'include_doors',
        'client_provides_paint', 'repairs_needed',
        'include_removal', 'include_baseboards', 'include_stairs',
    ]
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

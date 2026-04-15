
from flask import request, jsonify
from flask_cors import CORS
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import IntegrityError
from sqlalchemy import or_, and_, func
from datetime import datetime

from api.models import db, Services, ServiceMaterial,Contractor, User
from api.utils import APIException

from api.routes import api

# Allow CORS requests
CORS(api)

def get_current_contractor_id():
    user_id = get_jwt_identity()
    user = User.query.filter_by(id=user_id).first()
    if not user:
        raise APIException('User not found', status_code=404)
    
    contractor = Contractor.query.filter_by(user_id=user_id).first()
    if not contractor:
        raise APIException('Contractor not found', status_code=404)
    
    return contractor.id

@api.route('/services/create-with-materials', methods=['POST'])
@jwt_required()
def create_service_with_materials():
    try:
        body = request.get_json(silent=True)
        print("Body:", body)

        if body is None:
            return jsonify({'msg': 'you need to send something in body'}), 400
        
        required_fields = ['name', 'description']
        for field in required_fields:
            if field not in body:
                return jsonify({'msg': f'{field} is required'}), 400
        
        contractor_id = get_current_contractor_id()
        
        new_service = Services(
            contractor_id=contractor_id,
            name=body['name'].strip(),
            description=body.get('description', "").strip(),
            price=body.get('price', 0.00),
            duration=body.get('duration'),
            image=body.get('image'),
            materials_needed=body.get('materials_needed'),
            estimate_hours=body.get('estimate_hours'),
            base_cost=body.get('base_cost'),
            is_deleted=body.get('is_deleted', False),
            is_active=body.get('is_active', True)
        )
        db.session.add(new_service)

        db.session.flush()

        materials = body.get('materials', [])
        created_materials = []

        for mat in materials:
            if not mat.get('name'):
                continue

            new_material = ServiceMaterial(
                service_id=new_service.id,
                name=mat['name'].strip(),
                quantity=mat.get('quantity', 0),
                unit_cost=mat.get('unit_cost', 0.00)
            )
            db.session.add(new_material)
            created_materials.append(new_material)

        db.session.commit()
        
        return jsonify({
            'msg': 'Service create successfully',
            'service': new_service.serialize(),
            'materials': [m.serialize() for m in created_materials]
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'msg': str(e)}), 500


@api.route('/service/<int:service_id>/materials', methods=['POST'])
@jwt_required()
def add_material_to_service(service_id):
    try:
        body = request.get_json(silent=True)
        if body is None:
            return jsonify({'msg': 'you need to send something in body'}), 400

        contractor_id = get_current_contractor_id()

        service = Services.query.filter_by(id=service_id, contractor_id=contractor_id).first()
        if not service:
            return jsonify({'msg': 'Service not found or unauthorized'}), 404
        
        if 'name' not in body:
            return jsonify({'msg': 'name is required'}), 400
        
        new_material = ServiceMaterial(
            service_id=service_id,
            name=body['name'].strip(),
            quantity=body.get('quantity', 0),
            unit_cost=body.get('unit_cost', 0.00)
        )
        db.session.add(new_material)
        db.session.commit()
        
        return jsonify({
            'msg': 'Material added successfully',
            'material': new_material.serialize()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'msg': str(e)}), 500

@api.route('/service/create', methods=['POST'])
@jwt_required()
def create_service():
    try:
        contractor_id = get_current_contractor_id()
        
        body = request.get_json(silent=True)
        if body is None:
            return jsonify({'msg': 'you need to send something in body'}), 400

        required_fields = ['name']
        for field in required_fields:
            if field not in body:
                return jsonify({'msg': f'{field} is required'}), 400
        
        new_service = Services(
            contractor_id=contractor_id,
            name=body['name'].strip(),
            description=body.get('description', "").strip()
        )
        db.session.add(new_service)
        db.session.commit()
        
        return jsonify({
            'msg': 'Service created successfully',
            'service': new_service.serialize()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'msg': str(e)}), 500

@api.route('/services', methods=['GEt'])
@jwt_required()
def get_all_services():
    try:
        contractor_id = get_current_contractor_id()

        search = request.args.get('search', '').strip().lower()
        is_active = request.args.get('is_active', None)

        query = Services.query.filter_by(contractor_id=contractor_id, 
        is_deleted=False)

        if search:
            search_term = f'%{search}%'
            query = query.filter(
                or_(
                    Services.name.ilike(search_term),
                    Services.description.ilike(search_term)
                )
            )
        if is_active is not None:
            is_active_bool = is_active.lower() == 'true'
            query = query.filter(Services.is_active == is_active_bool)
        
        services = query.order_by(Services.id.desc()).all()

        return jsonify({
            'msg': 'Services retrieved successfully',
            'services': [service.serialize() for service in services]
        }), 200
    
    except APIException as e:
        raise e
    except Exception as e:
        return jsonify({'msg': str(e)}), 500
        
@api.route('/services/<int:service_id>', methods=['GET'])
@jwt_required()
def get_services_by_id(service_id):
    try:
        contractor_id = get_current_contractor_id()

        service = Services.query.filter_by(
            id=service_id,
            contractor_id=contractor_id,
            is_deleted=False
        ).first()

        if not service:
            return jsonify({'msg': 'Service not found'}), 400

        service_data = service.serialize()
        # service_data['materials'] = [m.serialize() for m in service.material_service]

        return jsonify({
            'msg': 'Service retrieved successfully',
            'service': service_data
        }), 200
    
    except APIException as e:
        raise e
    except Exception as e:
        return jsonify({'msg': f'Failed to fetch service: {str(e)}'}), 500

@api.route('/services/stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    try:
        contractor_id = get_current_contractor_id()
 
        total_services = Services.query.filter_by(contractor_id=contractor_id).count()
        active_services = Services.query.filter_by(contractor_id=contractor_id, is_active=True).count()

        avg_price = db.session.query(func.avg(Services.price)).filter_by(contractor_id=contractor_id).scalar() or 0

        materials_count = db.session.query(func.count(ServiceMaterial.id))\
            .join(Services)\
            .filter(Services.contractor_id == contractor_id).scalar() or 0

        return jsonify({
            "total_services": total_services,
            "active_services": active_services,
            "avg_price": round(float(avg_price), 2),
            "materials_tracked": materials_count
        })
        
    except APIException as e:
        raise e
    except Exception as e:
        return jsonify({'msg': str(e)}), 500
        
@api.route('/services/<int:service_id>/full-update', methods=['PUT'])
@jwt_required()
def full_update_service(service_id):
    try:
        contractor_id = get_current_contractor_id()
        body = request.get_json()

        if body is None:
            return jsonify({'msg': 'Need to send something in the body'}), 400

        service = Services.query.filter_by(
            id=service_id,
            contractor_id=contractor_id,
            is_deleted=False
        ).first()

        if not service:
            return jsonify({'msg': 'Service not found'}), 404

        service.name = body.get('name', service.name)
        service.description = body.get('description', service.description)
        service.price = body.get('price', service.price)
        service.duration = body.get('duration', service.duration)
        service.base_cost = body.get('base_cost', service.base_cost)
        service.materials_needed = body.get('materials_needed', service.materials_needed)
        service.estimate_hours = body.get('estimate_hours', service.estimate_hours)
        service.is_active = body.get('is_active', service.is_active)

        # materials = body.get('materials', [])

        ServiceMaterial.query.filter_by(service_id=service_id).delete()

        for mat in body.get('materials', []):
            new_mat=ServiceMaterial(
                service_id=service_id,
                name=mat.get('name'),
                quantity=mat.get('quantity', 0),
                unit_cost=mat.get('unit_cost', 0)    
            )
            db.session.add(new_mat)

        db.session.commit()
        
        return jsonify({
            'msg': 'Service updated successfully',
            'service': service.serialize()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'msg': str(e)}), 500    

@api.route('/delete/services/<int:service_id>', methods=['DELETE'])
@jwt_required()
def delete_service(service_id):
    try:
        contractor_id = get_current_contractor_id()

        service = Services.query.filter_by(
            id=service_id,
            contractor_id=contractor_id,
            is_deleted=False
            ).first()

        if not service:
            return jsonify({'msg': 'Service not found or unauthorizeds'}), 404

        db.session.delete(service)
        db.session.commit()
        
        return jsonify({'msg': 'Service deleted successfully'}), 200    

    except Exception as e:
        db.session.rollback()
        return jsonify({'msg': str(e)}), 500    

        

            



        


        
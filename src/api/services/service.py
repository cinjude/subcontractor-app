
from flask import request, jsonify
from flask_cors import CORS
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import IntegrityError
from sqlalchemy import or_, and_
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
        
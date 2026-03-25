"""
Customer API Endpoints
Complete CRUD operations and additional functionality for customer management
"""
from flask import request, jsonify
from flask_cors import CORS
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import IntegrityError
from sqlalchemy import or_, and_
from datetime import datetime

from api.models import db, Customer, Contractor, User
from api.utils import APIException

# Import app to use app.route
from api.routes import api

# Allow CORS requests
CORS(api)


# Helper function to get contractor_id from JWT token
def get_current_contractor_id():
    """Get contractor ID from current JWT token"""
    user_id = get_jwt_identity()
    user = User.query.filter_by(id=user_id).first()
    if not user:
        raise APIException('User not found', status_code=404)
    
    contractor = Contractor.query.filter_by(user_id=user_id).first()
    if not contractor:
        raise APIException('Contractor not found', status_code=404)
    
    return contractor.id


@api.route('/customers', methods=['GET'])
@jwt_required()
def get_all_customers():
    """Get all customers for current contractor"""
    try:
        contractor_id = get_current_contractor_id()

        search = request.args.get('search', '').strip().lower()

        query = Customer.query.filter_by(contractor_id=contractor_id)

        if search:
            search_term = f'%{search}%'
            query = query.filter(
                or_(
                    Customer.name.ilike(search_term),
                    Customer.email.ilike(search_term),
                    Customer.phone.ilike(search_term)
                )
            )
        
        customers = query.order_by(Customer.create_at.desc()).all()

        return jsonify([customer.serialize() for customer in customers]),200
        
    except APIException as e:
        raise e
    except Exception as e:
        return jsonify({'error': f'Failed to fetch customers: {str(e)}'}), 500


@api.route('/customers/create', methods=['POST'])
@jwt_required()
def create_customer():
    try:
        contractor_id = get_current_contractor_id()
        data = request.get_json()
        
        required_fields = ['name', 'email', 'address', 'city', 'state', 'zip_code']
        for field in required_fields:
            if not data.get(field) or str(data.get(field)).strip() == '':
                return jsonify({'error': f'{field} is required'}), 400
        
        existing_customer = Customer.query.filter_by(
             email=data['email'].strip().lower(),
             contractor_id=contractor_id
        ).first()
           
        
        if existing_customer:
            return jsonify({'error': 'A customer with this email already exists'}), 400

        new_customer = Customer(
            contractor_id=contractor_id,
            name=data['name'].strip(),
            email=data['email'].strip().lower(),
            address=data['address'].strip(),
            city=data['city'].strip(),
            state=data['state'].strip(),
            zip_code=data['zip_code'].strip(),
            phone=data.get('phone', '').strip(),
            address2=data.get('address2', '').strip(),
            note=data.get('note', '').strip()
        )
        
        db.session.add(new_customer)
        db.session.commit()

        print(new_customer)
        
        return jsonify({
            'msg': 'Customer created successfully',
            'customer': new_customer.serialize(),
        }), 201
        
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'Email already exists for this contractor'}), 400
    except APIException as e:
        raise e
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create customer: {str(e)}'}), 500


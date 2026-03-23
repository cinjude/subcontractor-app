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
    email = get_jwt_identity()
    user = User.query.filter_by(email=email).first()
    if not user:
        raise APIException('User not found', status_code=404)
    
    contractor = Contractor.query.filter_by(user_id=user.id).first()
    if not contractor:
        raise APIException('Contractor not found', status_code=404)
    
    return contractor.id


@api.route('/customers', methods=['GET'])
@jwt_required()
def get_all_customers():
    """Get all customers for the current contractor"""
    try:
        contractor_id = get_current_contractor_id()
        
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        search = request.args.get('search', '').strip()
        state = request.args.get('state', '').strip()
        
        # Build query
        query = Customer.query.filter_by(contractor_id=contractor_id)
        
        # Apply search filter
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    Customer.name.ilike(search_term),
                    Customer.email.ilike(search_term),
                    Customer.phone.ilike(search_term),
                    Customer.address.ilike(search_term),
                    Customer.city.ilike(search_term)
                )
            )
        
        # Apply state filter
        if state:
            query = query.filter(Customer.state.ilike(f"%{state}%"))
        
        # Order by creation date (newest first)
        query = query.order_by(Customer.create_at.desc())
        
        # Paginate
        pagination = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        customers = []
        for customer in pagination.items:
            customers.append({
                'id': customer.id,
                'name': customer.name,
                'email': customer.email,
                'phone': customer.phone,
                'address': customer.address,
                'city': customer.city,
                'state': customer.state,
                'zip_code': customer.zip_code,
                'note': customer.note,
                'created_at': customer.create_at.isoformat() if customer.create_at else None,
                'updated_at': customer.updated_at.isoformat() if customer.updated_at else None
            })
        
        return jsonify({
            'customers': customers,
            'pagination': {
                'page': pagination.page,
                'per_page': pagination.per_page,
                'total': pagination.total,
                'pages': pagination.pages,
                'has_next': pagination.has_next,
                'has_prev': pagination.has_prev
            }
        }), 200
        
    except APIException as e:
        raise e
    except Exception as e:
        return jsonify({'error': f'Failed to fetch customers: {str(e)}'}), 500


@api.route('/customers/<int:customer_id>', methods=['GET'])
@jwt_required()
def get_customer(customer_id):
    """Get a specific customer by ID"""
    try:
        contractor_id = get_current_contractor_id()
        
        customer = Customer.query.filter(
            and_(
                Customer.id == customer_id,
                Customer.contractor_id == contractor_id
            )
        ).first()
        
        if not customer:
            return jsonify({'error': 'Customer not found'}), 404
        
        return jsonify({
            'id': customer.id,
            'name': customer.name,
            'email': customer.email,
            'phone': customer.phone,
            'address': customer.address,
            'city': customer.city,
            'state': customer.state,
            'zip_code': customer.zip_code,
            'note': customer.note,
            'created_at': customer.create_at.isoformat() if customer.create_at else None,
            'updated_at': customer.updated_at.isoformat() if customer.updated_at else None
        }), 200
        
    except APIException as e:
        raise e
    except Exception as e:
        return jsonify({'error': f'Failed to fetch customer: {str(e)}'}), 500


@api.route('/customers', methods=['POST'])
@jwt_required()
def create_customer():
    """Create a new customer"""
    try:
        contractor_id = get_current_contractor_id()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'email', 'address', 'city', 'state', 'zip_code']
        for field in required_fields:
            if not data.get(field) or str(data.get(field)).strip() == '':
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if email already exists for this contractor
        existing_customer = Customer.query.filter(
            and_(
                Customer.email == data['email'].strip().lower(),
                Customer.contractor_id == contractor_id
            )
        ).first()
        
        if existing_customer:
            return jsonify({'error': 'A customer with this email already exists'}), 400
        
        # Create new customer
        customer = Customer(
            contractor_id=contractor_id,
            name=data['name'].strip(),
            email=data['email'].strip().lower(),
            address=data['address'].strip(),
            city=data['city'].strip(),
            state=data['state'].strip(),
            zip_code=data['zip_code'].strip(),
            phone=data.get('phone', '').strip(),
            note=data.get('note', '').strip()
        )
        
        db.session.add(customer)
        db.session.commit()
        
        return jsonify({
            'id': customer.id,
            'name': customer.name,
            'email': customer.email,
            'phone': customer.phone,
            'address': customer.address,
            'city': customer.city,
            'state': customer.state,
            'zip_code': customer.zip_code,
            'note': customer.note,
            'created_at': customer.create_at.isoformat() if customer.create_at else None,
            'updated_at': customer.updated_at.isoformat() if customer.updated_at else None
        }), 201
        
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'Email already exists for this contractor'}), 400
    except APIException as e:
        raise e
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create customer: {str(e)}'}), 500


@api.route('/customers/<int:customer_id>', methods=['PUT'])
@jwt_required()
def update_customer(customer_id):
    """Update an existing customer"""
    try:
        contractor_id = get_current_contractor_id()
        
        customer = Customer.query.filter(
            and_(
                Customer.id == customer_id,
                Customer.contractor_id == contractor_id
            )
        ).first()
        
        if not customer:
            return jsonify({'error': 'Customer not found'}), 404
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'email', 'address', 'city', 'state', 'zip_code']
        for field in required_fields:
            if field in data and (not data.get(field) or str(data.get(field)).strip() == ''):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if email is being changed and if it conflicts with existing customer
        if 'email' in data and data['email'].strip().lower() != customer.email:
            existing_customer = Customer.query.filter(
                and_(
                    Customer.email == data['email'].strip().lower(),
                    Customer.contractor_id == contractor_id,
                    Customer.id != customer_id
                )
            ).first()
            
            if existing_customer:
                return jsonify({'error': 'A customer with this email already exists'}), 400
        
        # Update customer fields
        if 'name' in data:
            customer.name = data['name'].strip()
        if 'email' in data:
            customer.email = data['email'].strip().lower()
        if 'address' in data:
            customer.address = data['address'].strip()
        if 'city' in data:
            customer.city = data['city'].strip()
        if 'state' in data:
            customer.state = data['state'].strip()
        if 'zip_code' in data:
            customer.zip_code = data['zip_code'].strip()
        if 'phone' in data:
            customer.phone = data['phone'].strip()
        if 'note' in data:
            customer.note = data['note'].strip()
        
        db.session.commit()
        
        return jsonify({
            'id': customer.id,
            'name': customer.name,
            'email': customer.email,
            'phone': customer.phone,
            'address': customer.address,
            'city': customer.city,
            'state': customer.state,
            'zip_code': customer.zip_code,
            'note': customer.note,
            'created_at': customer.create_at.isoformat() if customer.create_at else None,
            'updated_at': customer.updated_at.isoformat() if customer.updated_at else None
        }), 200
        
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'Email already exists for this contractor'}), 400
    except APIException as e:
        raise e
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update customer: {str(e)}'}), 500


@api.route('/customers/<int:customer_id>', methods=['DELETE'])
@jwt_required()
def delete_customer(customer_id):
    """Delete a customer (soft delete by checking dependencies)"""
    try:
        contractor_id = get_current_contractor_id()
        
        customer = Customer.query.filter(
            and_(
                Customer.id == customer_id,
                Customer.contractor_id == contractor_id
            )
        ).first()
        
        if not customer:
            return jsonify({'error': 'Customer not found'}), 404
        
        # Check if customer has associated jobs or invoices
        from api.models import Job, Invoice
        
        jobs_count = Job.query.filter_by(customer_id=customer_id).count()
        invoices_count = Invoice.query.filter_by(customer_id=customer_id).count()
        
        if jobs_count > 0 or invoices_count > 0:
            return jsonify({
                'error': 'Cannot delete customer with associated jobs or invoices',
                'jobs_count': jobs_count,
                'invoices_count': invoices_count
            }), 400
        
        # Delete the customer
        db.session.delete(customer)
        db.session.commit()
        
        return jsonify({'message': 'Customer deleted successfully'}), 200
        
    except APIException as e:
        raise e
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete customer: {str(e)}'}), 500


@api.route('/customers/search', methods=['GET'])
@jwt_required()
def search_customers():
    """Search customers with advanced filters"""
    try:
        contractor_id = get_current_contractor_id()
        
        # Get query parameters
        query_text = request.args.get('q', '').strip()
        city = request.args.get('city', '').strip()
        state = request.args.get('state', '').strip()
        limit = min(request.args.get('limit', 10, type=int), 50)
        
        if not query_text and not city and not state:
            return jsonify({'error': 'At least one search parameter is required'}), 400
        
        # Build query
        query = Customer.query.filter_by(contractor_id=contractor_id)
        
        # Apply text search
        if query_text:
            search_term = f"%{query_text}%"
            query = query.filter(
                or_(
                    Customer.name.ilike(search_term),
                    Customer.email.ilike(search_term),
                    Customer.phone.ilike(search_term)
                )
            )
        
        # Apply city filter
        if city:
            query = query.filter(Customer.city.ilike(f"%{city}%"))
        
        # Apply state filter
        if state:
            query = query.filter(Customer.state.ilike(f"%{state}%"))
        
        # Limit results and order
        customers = query.order_by(Customer.name).limit(limit).all()
        
        results = []
        for customer in customers:
            results.append({
                'id': customer.id,
                'name': customer.name,
                'email': customer.email,
                'phone': customer.phone,
                'city': customer.city,
                'state': customer.state,
                'full_address': f"{customer.address}, {customer.city}, {customer.state} {customer.zip_code}"
            })
        
        return jsonify({
            'customers': results,
            'count': len(results)
        }), 200
        
    except APIException as e:
        raise e
    except Exception as e:
        return jsonify({'error': f'Search failed: {str(e)}'}), 500


@api.route('/customers/stats', methods=['GET'])
@jwt_required()
def get_customer_stats():
    """Get customer statistics for the current contractor"""
    try:
        contractor_id = get_current_contractor_id()
        
        # Total customers
        total_customers = Customer.query.filter_by(contractor_id=contractor_id).count()
        
        # Customers by state
        customers_by_state = db.session.query(
            Customer.state,
            db.func.count(Customer.id).label('count')
        ).filter_by(contractor_id=contractor_id).group_by(Customer.state).all()
        
        # Recent customers (last 30 days)
        from datetime import datetime, timedelta
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_customers = Customer.query.filter(
            and_(
                Customer.contractor_id == contractor_id,
                Customer.create_at >= thirty_days_ago
            )
        ).count()
        
        return jsonify({
            'total_customers': total_customers,
            'recent_customers': recent_customers,
            'customers_by_state': [
                {'state': state, 'count': count} 
                for state, count in customers_by_state
            ]
        }), 200
        
    except APIException as e:
        raise e
    except Exception as e:
        return jsonify({'error': f'Failed to get stats: {str(e)}'}), 500


@api.route('/customers/<int:customer_id>/jobs', methods=['GET'])
@jwt_required()
def get_customer_jobs(customer_id):
    """Get all jobs for a specific customer"""
    try:
        contractor_id = get_current_contractor_id()
        
        # Verify customer belongs to contractor
        customer = Customer.query.filter(
            and_(
                Customer.id == customer_id,
                Customer.contractor_id == contractor_id
            )
        ).first()
        
        if not customer:
            return jsonify({'error': 'Customer not found'}), 404
        
        # Get customer's jobs
        from api.models import Job
        jobs = Job.query.filter(
            and_(
                Job.customer_id == customer_id,
                Job.contractor_id == contractor_id,
                Job.is_deleted == False
            )
        ).order_by(Job.create_at.desc()).all()
        
        jobs_data = []
        for job in jobs:
            jobs_data.append({
                'id': job.id,
                'title': job.title,
                'status': job.status.value if job.status else None,
                'priority': job.priority.value if job.priority else None,
                'budget': float(job.budget) if job.budget else None,
                'created_at': job.create_at.isoformat() if job.create_at else None,
                'start_date': job.start_date.isoformat() if job.start_date else None,
                'end_date': job.end_date.isoformat() if job.end_date else None
            })
        
        return jsonify({
            'customer': {
                'id': customer.id,
                'name': customer.name,
                'email': customer.email
            },
            'jobs': jobs_data,
            'total_jobs': len(jobs_data)
        }), 200
        
    except APIException as e:
        raise e
    except Exception as e:
        return jsonify({'error': f'Failed to fetch customer jobs: {str(e)}'}), 500
"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
import cloudinary
import cloudinary.uploader
import os
from flask import Flask, request, jsonify, url_for, Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from api.models import db, User, Job, JobStatus, JobPriority, JobDocument, Customer, Services, Contractor, JobTimeline
from api.utils import generate_sitemap, APIException
from flask_cors import CORS
from datetime import datetime, timedelta
from sqlalchemy import func, case

cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)

api = Blueprint('api', __name__)

from api.customer.customer import * 
from api.services.service import *
from api.estimateReq.estimateRequest import *
from api.portfolioProject.portfolio import *
CORS(api, origins=[
    "http://localhost:3000",
    "https://subcontractor-app.vercel.app",  
    "https://*.vercel.app",
])


@api.route('/hello', methods=['POST', 'GET'])
def handle_hello():

    response_body = {
        "message": "Hello! I'm a message that came from the backend, check the network tab on the google inspector and you will see the GET request"
    }

    return jsonify(response_body), 200


@api.route('/jobs/test', methods=['GET'])
def test_jobs():
    """Test endpoint to verify jobs routes are working"""
    return jsonify({
        'message': 'Jobs routes are working!',
        'endpoints': [
            'GET /api/jobs',
            'POST /api/jobs',
            'GET /api/jobs/<id>',
            'PUT /api/jobs/<id>',
            'DELETE /api/jobs/<id>',
            'GET /api/jobs/categories'
        ]
    }), 200

@api.route('/jobs', methods=['GET'])
@jwt_required()
def get_all_jobs():
    """Get all jobs with optional filtering"""
    try:

        user_id = get_jwt_identity()
        contractor = Contractor.query.filter_by(user_id=user_id).first()
        if not contractor:
            return jsonify({'error': 'Contractor not found'}), 404
        
        status = request.args.get('status', 'all')
        priority = request.args.get('priority', 'all')
        search = request.args.get('search', '')
        category = request.args.get('category', 'all')
        date_range = request.args.get('dateRange', 'all')
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)

        query = Job.query.filter_by(contractor_id=contractor.id, is_deleted=False) 

        if status != 'all':
            try:
                query = query.filter(Job.status == JobStatus(status))
            except ValueError:
                pass
        
        if priority != 'all':
            try:
                query = query.filter(Job.priority == JobPriority(priority))
            except ValueError:
                pass
        
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                Job.title.ilike(search_term) |
                Job.description.ilike(search_term) |
                Job.location.ilike(search_term)
            )

        if category != 'all':
            query = query.filter(Job.categories.ilike(f'%{category}%'))
        
        now = datetime.utcnow()
        if date_range == 'today':
            query = query.filter(Job.create_at >= now.replace(hour=0, minute=0, second=0))
        elif date_range == 'week':
            query = query.filter(Job.create_at >= now - timedelta(days=7))
        elif date_range == 'month':
            query = query.filter(Job.create_at >= now - timedelta(days=30))
        elif date_range == 'quarter':
            query = query.filter(Job.create_at >= now - timedelta(days=90))
        elif date_range == 'year':
            query = query.filter(Job.create_at >= now - timedelta(days=365))

        pagination = query.order_by(Job.create_at.desc()).paginate(page=page, per_page=per_page, error_out=False)

        return jsonify({
            'jobs': [job.serialize() for job in pagination.items],
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch jobs: {str(e)}'}), 500

@api.route('/jobs/create', methods=['POST'])
@jwt_required()
def create_job():
    """Create a new job"""
    try:
        user_id=get_jwt_identity()

        contractor = Contractor.query.filter_by(user_id=user_id).first()
        if not contractor:
            return jsonify({'error': 'Contractor not found'}), 404
        
        current_contractor_id = contractor.id
        data = request.get_json()

        customer_id = data.get('customerId')
        service_id = data.get('serviceId')

        if customer_id:

            customer = db.session.get(Customer, customer_id)
            if not customer:
                return jsonify({'error': f'Customer {customer_id} not found'}), 404
            if customer.contractor_id != current_contractor_id:
                return jsonify({'error': 'Unauthorized'}), 403

        if service_id:
            service = db.session.get(Services, service_id)
            if not service:
                return jsonify({'error': f'Service {service_id} not found'}), 404
        
        new_job = Job(
            contractor_id=current_contractor_id,
            customer_id=data.get('customerId'),
            service_id=data.get('serviceId'),
            title=data.get('title', 'Sin título'),
            description=data.get('description', ''),
            location=data.get('location', ''),
            budget=data.get('budget', 0),
            estimate_total=data.get('estimateTotal', 0),
            actual_total=data.get('actualTotal', 0),
            start_date=datetime.fromisoformat(data['startDate']) if data.get('startDate') else None,
            end_date=datetime.fromisoformat(data['endDate']) if data.get('endDate') else None,
            status=JobStatus.PENDING,
            priority=JobPriority.MEDIUM,
            notes=data.get('notes', ''),
            categories=','.join(data.get('categories', [])) if isinstance(data.get('categories'), list) else '' 
        )
        
        db.session.add(new_job)
        db.session.flush()
        
        timeline_entry = JobTimeline(
            job_id=new_job.id,
            title='Job Created',
            description=f'Job "{new_job.title}" was created by {contractor.user.name}',
            type='system'
        )
        db.session.add(timeline_entry)

        db.session.commit()
        
        return jsonify({
            'msg': 'Job created successfully',
            'job':new_job.serialize(), 
            "customer": customer.name if customer_id else None 
        }),201
   
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create job: {str(e)}'}), 500

@api.route('/jobs/<int:job_id>', methods=['GET'])
@jwt_required()
def get_job(job_id):
    """Get a specific job"""
    try:
        user_id = get_jwt_identity()
        contractor = Contractor.query.filter_by(user_id=user_id).first()
        if not contractor:
            return jsonify({'error': 'Contractor not found'}), 404
        current_contractor_id = contractor.id
        
        job = Job.query.filter(
            Job.id == job_id,
            Job.contractor_id == current_contractor_id,
            Job.is_deleted == False
        ).first()
        
        if not job:
            return jsonify({'error': 'Job not found'}), 404
        
        return jsonify(job.serialize()), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch job: {str(e)}'}), 500

@api.route('/jobs/<int:job_id>', methods=['PUT'])
@jwt_required()
def update_job(job_id):
    """Update a job"""
    try:
        user_id = get_jwt_identity()
        contractor = Contractor.query.filter_by(user_id=user_id).first()
        if not contractor:
            return jsonify({'error': 'Contractor not found'}), 404
        current_contractor_id = contractor.id
        
        job = Job.query.filter(
            Job.id == job_id,
            Job.contractor_id == current_contractor_id,
            Job.is_deleted == False
        ).first()
        
        if not job:
            return jsonify({'error': 'Job not found'}), 404
        
        data = request.get_json()
        
        if 'description' in data:
            job.description = data['description']
        if 'location' in data:
            job.location = data['location']
        if 'budget' in data:
            job.budget = data['budget']
        if 'status' in data:
            try:
                job.status = JobStatus(data['status'])
            except ValueError:
                pass
        if 'priority' in data:
            try:
                job.priority = JobPriority(data['priority'])
            except ValueError:
                pass
        if 'startDate' in data and data['startDate']:
            job.start_date = datetime.fromisoformat(data['startDate'])
        if 'endDate' in data and data['endDate']:
            job.end_date = datetime.fromisoformat(data['endDate'])
        if 'categories' in data:
            job.categories = ','.join(data['categories'])
        if 'notes' in data:
            job.notes = data['notes']
        if 'progress' in data:
            job.progress = data['progress']

        if 'title' in data and data['title'] != job.title:
            old_title = job.title             
            job.title = data['title']          
            timeline_entry = JobTimeline(
                job_id=job.id,
                title='Title Update',
                description=f'Title changed from "{old_title}" to "{job.title}"',
                type='updated'
            )
            db.session.add(timeline_entry)
        elif 'title' in data:
            job.title = data['title']
        db.session.commit()
        
        return jsonify(job.serialize()), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update job: {str(e)}'}), 500

@api.route('/jobs/<int:job_id>', methods=['DELETE'])
@jwt_required()
def delete_job(job_id):
    """Soft delete a job"""
    try:

        user_id = get_jwt_identity()
        contractor = Contractor.query.filter_by(user_id=user_id).first()
        if not contractor:
            return jsonify({'error': 'Contractor not found'}), 404
        current_contractor_id = contractor.id

        job = Job.query.filter(Job.id == job_id,
            Job.contractor_id == current_contractor_id,
            Job.is_deleted == False
        ).first()
        
        if not job:
            return jsonify({'error': 'Job not found'}), 404
        
        job.is_deleted = True
        db.session.commit()
        
        return jsonify({'message': 'Job deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete job: {str(e)}'}), 500

@api.route('/jobs/<int:job_id>/status', methods=['PATCH'])
@jwt_required()
def update_job_status(job_id):
    """Update job status"""
    try:
        user_id = get_jwt_identity()
        contractor = Contractor.query.filter_by(user_id=user_id).first()
        if not contractor:
            return jsonify({'error': 'Contractor not found'}), 404
        current_contractor_id = contractor.id

        job = Job.query.filter(
            Job.id == job_id,
            Job.contractor_id == current_contractor_id,
            Job.is_deleted == False
        ).first()
        
        if not job:
            return jsonify({'error': 'Job not found'}), 404
        
        data = request.get_json()
        new_status = data.get('status')
        
        if new_status:
            try:
                job.status = JobStatus(new_status)
                db.session.commit()
            except ValueError:
                return jsonify({'error': f'Invalid status: {new_status}'}), 400
        
        return jsonify(job.serialize()), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update job status: {str(e)}'}), 500

@api.route('/jobs/stats', methods=['GET'])
@jwt_required()
def get_job_stats():
    """Get job statistics"""
    try:
        user_id = get_jwt_identity()
        contractor = Contractor.query.filter_by(user_id=user_id).first()
        provider_id = contractor.id

        contractor = Contractor.query.filter_by(user_id=user_id).first()
        if not contractor: 
            return jsonify({'error': 'Contractor not found'}), 404
        provider_id = contractor.id
        
        stats_query = db.session.query(
            func.count().label('total'),
            func.sum(case((Job.status == JobStatus.PENDING, 1), else_=0)).label('pending'),
            func.sum(case((Job.status == JobStatus.IN_PROGRESS, 1), else_=0)).label('in_progress'),
            func.sum(case((Job.status == JobStatus.COMPLETED, 1), else_=0)).label('completed'),
        ).filter(Job.contractor_id==provider_id, Job.is_deleted==False).one()

        return jsonify({
            'total': stats_query.total or 0,
            'pending': stats_query.pending or 0,
            'in_progress': stats_query.in_progress or 0,
            'completed': stats_query.completed or 0,
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch stats: {str(e)}'}), 500

@api.route('/jobs/categories', methods=['GET'])
@jwt_required()
def get_job_categories():
    """Get available job categories"""
    try:
        categories = [
            {'value': 'residential', 'label': 'Residential'},
            {'value': 'commercial', 'label': 'Commercial'},
            {'value': 'industrial', 'label': 'Industrial'},
            {'value': 'renovation', 'label': 'Renovation'},
            {'value': 'new_construction', 'label': 'New Construction'},
            {'value': 'remodeling', 'label': 'Remodeling'},
            {'value': 'plumbing', 'label': 'Plumbing'},
            {'value': 'electrical', 'label': 'Electrical'},
            {'value': 'hvac', 'label': 'HVAC'},
            {'value': 'roofing', 'label': 'Roofing'},
            {'value': 'painting', 'label': 'Painting'},
            {'value': 'flooring', 'label': 'Flooring'},
            {'value': 'landscaping', 'label': 'Landscaping'},
            {'value': 'concrete', 'label': 'Concrete'},
            {'value': 'carpentry', 'label': 'Carpentry'}
        ]
        
        return jsonify(categories), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch categories: {str(e)}'}), 500

@api.route('/jobs/<int:job_id>/documents', methods=['GET'])
@jwt_required()
def get_job_documents(job_id):
    """Get all documents for a job"""
    try:
        user_id = get_jwt_identity()
        contractor = Contractor.query.filter_by(user_id=user_id).first()
        if not contractor:
            return jsonify({'error': 'Contractor not found'}), 404
        current_contractor_id = contractor.id

        job = Job.query.filter(
            Job.id == job_id,
            Job.contractor_id == current_contractor_id,
            Job.is_deleted == False
        ).first()
        
        if not job:
            return jsonify({'error': 'Job not found'}), 404
        
        documents = JobDocument.query.filter_by(job_id=job_id).all()
        return jsonify([doc.to_dict() for doc in documents]), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch documents: {str(e)}'}), 500

@api.route('/jobs/<int:job_id>/documents', methods=['POST'])
@jwt_required()
def upload_job_document(job_id):
    """Upload a document for a job"""
    try:
        user_id = get_jwt_identity()
        contractor = Contractor.query.filter_by(user_id=user_id).first()
        if not contractor:
            return jsonify({'error': 'Contractor not found'}), 404
        current_contractor_id = contractor.id

        job = Job.query.filter(
            Job.id == job_id,
            Job.contractor_id == current_contractor_id,
            Job.is_deleted == False
        ).first()
        
        if not job:
            return jsonify({'error': 'Job not found'}), 404
        
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        is_pdf = file.content_type == 'application/pdf'
        is_image = file.content_type.startswith('image/')

        upload_result = cloudinary.uploader.upload(
            file,
            folder=f'jobs/{job_id}/documents',
            resource_type='auto',
            access_mode='public',
            type='upload',
        )
        file_url = upload_result['secure_url']

        document = JobDocument(
            job_id=job_id,
            name=file.filename,
            file_path=file_url,
            file_size=upload_result.get('bytes', 0),
            file_type=file.content_type,
            uploaded_by=contractor.id
        )
        
        db.session.add(document)
        db.session.commit()
        
        return jsonify(document.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to upload document: {str(e)}'}), 500

@api.route('/jobs/<int:job_id>/documents/<int:document_id>', methods=['DELETE'])
@jwt_required()
def delete_job_document(job_id, document_id):
    user_id = get_jwt_identity()
    contractor = Contractor.query.filter_by(user_id=user_id).first()
    if not contractor:
        return jsonify({'error': 'Contractor not found'}), 404

    job = Job.query.filter_by(id=job_id, contractor_id=contractor.id, is_deleted=False).first()
    if not job:
        return jsonify({'error': 'Job not found'}), 404

    document = JobDocument.query.filter_by(id=document_id, job_id=job_id).first()
    if not document:
        return jsonify({'error': 'Document not found'}), 404

    db.session.delete(document)
    db.session.commit()
    return jsonify({'message': 'Document deleted successfully'}), 200
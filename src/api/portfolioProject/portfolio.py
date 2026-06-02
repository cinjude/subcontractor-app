from flask import request, jsonify
from flask_cors import CORS
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import IntegrityError
from sqlalchemy import or_, and_, func
from datetime import datetime

from api.models import db, Contractor, User, PortfolioProject, PortfolioImage
from api.utils import APIException

from api.routes import api

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

@api.route('/portfolio/<string:slug>', methods=['GET'])
def get_public_portfolio(slug):
    """Public portfolio page — anyone can view this via the contractor's slug"""
    try:
        contractor = Contractor.query.filter_by(website_slug=slug).first()
        if not contractor:
            return jsonify({'error': 'Portfolio not found'}), 404

        user = User.query.get(contractor.user_id)
        projects = PortfolioProject.query.filter_by(
            provider_id=contractor.id
        ).order_by(PortfolioProject.create_at.desc()).all()

        return jsonify({
            'contractor': {
                'id'            : contractor.id,
                'business_name' : contractor.business_name or user.name,
                'description'   : contractor.description,
                'about'         : contractor.about,
                'phone'         : contractor.phone,
                'business_email': contractor.business_email,
                'address'       : contractor.address,
                'logo_image'    : contractor.logo_image,
                'cover_image'   : contractor.cover_image,
                'website_slug'  : contractor.website_slug,
                'payment_link'  : contractor.payment_link,
            },
            'projects': [
                {
                    'id'    : p.id,
                    'title' : p.title,
                    'create_at': p.create_at.isoformat() if p.create_at else None,
                    'images': [
                        {
                            'id'         : img.id,
                            'image_url'  : img.image_url,
                            'is_cover'   : img.is_cover,
                            'order_index': img.order_index,
                            # Convention: order_index < 0 = before photo, >= 0 = after photo
                            # order_index == -1 = before, order_index == 1 = after, 0 = general
                            'photo_type' : 'before' if img.order_index < 0 else ('after' if img.order_index > 0 else 'general'),
                        }
                        for img in sorted(p.image, key=lambda x: x.order_index)
                    ]
                }
                for p in projects
            ]
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api.route('/portfolio/<string:slug>/request-estimate', methods=['POST'])
def public_request_estimate(slug):
    """Client submits estimate request from the public portfolio page — no login needed"""
    try:
        contractor = Contractor.query.filter_by(website_slug=slug).first()
        if not contractor:
            return jsonify({'error': 'Contractor not found'}), 404

        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        required = ['customer_name', 'customer_email', 'customer_phone', 'estimate_type']
        missing = [f for f in required if not data.get(f)]
        if missing:
            return jsonify({'error': f'Missing: {", ".join(missing)}'}), 400

        estimate = EstimateRequest(
            contractor_id  = contractor.id,
            customer_name  = data['customer_name'],
            customer_email = data['customer_email'],
            customer_phone = data['customer_phone'],
            customer_address = data.get('customer_address', ''),
            estimate_type  = data['estimate_type'],
            description    = data.get('description', ''),
            budget_range   = data.get('budget_range', ''),
            status         = EstimateStatus.new,
        )
        db.session.add(estimate)
        db.session.commit()

        return jsonify({
            'msg'        : 'Estimate request submitted successfully! The contractor will contact you soon.',
            'estimate_id': estimate.id,
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ── PROTECTED endpoints (JWT required — contractor only) ──────────────────────

@api.route('/portfolio/projects', methods=['GET'])
@jwt_required()
def get_my_portfolio():
    """Get contractor's own portfolio projects for management dashboard"""
    try:
        contractor_id = get_current_contractor_id()
        projects = PortfolioProject.query.filter_by(
            provider_id=contractor_id
        ).order_by(PortfolioProject.create_at.desc()).all()

        return jsonify({
            'projects': [
                {
                    'id'    : p.id,
                    'title' : p.title,
                    'create_at': p.create_at.isoformat() if p.create_at else None,
                    'images': [
                        {
                            'id'         : img.id,
                            'image_url'  : img.image_url,
                            'is_cover'   : img.is_cover,
                            'order_index': img.order_index,
                            'photo_type' : 'before' if img.order_index < 0 else ('after' if img.order_index > 0 else 'general'),
                        }
                        for img in sorted(p.image, key=lambda x: x.order_index)
                    ]
                }
                for p in projects
            ]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api.route('/portfolio/projects', methods=['POST'])
@jwt_required()
def create_portfolio_project():
    """Create a new portfolio project"""
    try:
        contractor_id = get_current_contractor_id()
        data = request.get_json() or {}
        title = data.get('title', 'Untitled Project')

        project = PortfolioProject(provider_id=contractor_id, title=title)
        db.session.add(project)
        db.session.commit()

        return jsonify({'msg': 'Project created', 'project': {
            'id': project.id, 'title': project.title, 'images': []
        }}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@api.route('/portfolio/projects/<int:project_id>', methods=['PUT'])
@jwt_required()
def update_portfolio_project(project_id):
    """Rename a portfolio project"""
    try:
        contractor_id = get_current_contractor_id()
        project = PortfolioProject.query.filter_by(
            id=project_id, provider_id=contractor_id
        ).first()
        if not project:
            return jsonify({'error': 'Project not found'}), 404

        data = request.get_json() or {}
        if 'title' in data:
            project.title = data['title']
        db.session.commit()
        return jsonify({'msg': 'Project updated'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@api.route('/portfolio/projects/<int:project_id>', methods=['DELETE'])
@jwt_required()
def delete_portfolio_project(project_id):
    """Delete a portfolio project and all its images"""
    try:
        contractor_id = get_current_contractor_id()
        project = PortfolioProject.query.filter_by(
            id=project_id, provider_id=contractor_id
        ).first()
        if not project:
            return jsonify({'error': 'Project not found'}), 404

        db.session.delete(project)
        db.session.commit()
        return jsonify({'msg': 'Project deleted'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@api.route('/portfolio/projects/<int:project_id>/photos', methods=['POST'])
@jwt_required()
def upload_portfolio_photo(project_id):
    """Upload a photo to a portfolio project.
    Form field 'photo_type' = 'before' | 'after' | 'general'
    Convention: before → order_index = -1, after → order_index = 1, general → 0
    """
    try:
        contractor_id = get_current_contractor_id()
        project = PortfolioProject.query.filter_by(
            id=project_id, provider_id=contractor_id
        ).first()
        if not project:
            return jsonify({'error': 'Project not found'}), 404

        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        photo_type = request.form.get('photo_type', 'general')  # before | after | general

        # Map photo_type to order_index convention
        order_map = {'before': -1, 'after': 1, 'general': 0}
        order_index = order_map.get(photo_type, 0)

        result = cloudinary.uploader.upload(
            file,
            folder=f'portfolio/{contractor_id}/project_{project_id}',
            resource_type='image'
        )

        # First photo uploaded becomes cover
        is_cover = len(project.image) == 0

        img = PortfolioImage(
            portfolioproject_id=project_id,
            image_url=result['secure_url'],
            is_cover=is_cover,
            order_index=order_index,
        )
        db.session.add(img)
        db.session.commit()

        return jsonify({
            'msg'  : 'Photo uploaded',
            'image': {
                'id'         : img.id,
                'image_url'  : img.image_url,
                'is_cover'   : img.is_cover,
                'order_index': img.order_index,
                'photo_type' : photo_type,
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@api.route('/portfolio/projects/<int:project_id>/photos/<int:photo_id>', methods=['DELETE'])
@jwt_required()
def delete_portfolio_photo(project_id, photo_id):
    """Delete a photo from a portfolio project"""
    try:
        contractor_id = get_current_contractor_id()
        project = PortfolioProject.query.filter_by(
            id=project_id, provider_id=contractor_id
        ).first()
        if not project:
            return jsonify({'error': 'Project not found'}), 404

        img = PortfolioImage.query.filter_by(
            id=photo_id, portfolioproject_id=project_id
        ).first()
        if not img:
            return jsonify({'error': 'Photo not found'}), 404

        db.session.delete(img)
        db.session.commit()
        return jsonify({'msg': 'Photo deleted'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@api.route('/portfolio/projects/<int:project_id>/photos/<int:photo_id>/cover', methods=['PATCH'])
@jwt_required()
def set_cover_photo(project_id, photo_id):
    """Set a photo as the cover for a project"""
    try:
        contractor_id = get_current_contractor_id()
        project = PortfolioProject.query.filter_by(
            id=project_id, provider_id=contractor_id
        ).first()
        if not project:
            return jsonify({'error': 'Project not found'}), 404

        # Unset all covers for this project
        for img in project.image:
            img.is_cover = (img.id == photo_id)

        db.session.commit()
        return jsonify({'msg': 'Cover photo updated'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Also need to import PortfolioProject and PortfolioImage at the top:
# from api.models import (..., PortfolioProject, PortfolioImage)
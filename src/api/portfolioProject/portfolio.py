# api/portfolio_routes.py — COMPLETE FILE
# Save as: src/api/portfolio_routes.py
# Register in app.py with: from api.portfolio_routes import *
#
# REQUIRES in models.py Contractor class:
#   hero_color: Mapped[str] = mapped_column(String(10), nullable=True, default='#1e293b')
#   btn_color : Mapped[str] = mapped_column(String(10), nullable=True, default='#1d6b3e')
# Then: flask db migrate -m "portfolio colors" && flask db upgrade

import cloudinary
import cloudinary.uploader
import os
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from api.models import (
    db, User, Contractor,
    EstimateRequest, EstimateStatus,
    PortfolioProject, PortfolioImage
)
from api.routes import api


# ── helpers ───────────────────────────────────────────────────────────────────
def _get_contractor_id():
    user_id    = get_jwt_identity()
    contractor = Contractor.query.filter_by(user_id=user_id).first()
    if not contractor:
        raise Exception('Contractor not found')
    return contractor.id

def _get_project(project_id, contractor_id):
    return PortfolioProject.query.filter_by(
        id=project_id, provider_id=contractor_id
    ).first()

def _photo_type(order_index):
    if order_index < 0: return 'before'
    if order_index > 0: return 'after'
    return 'general'

def _img_dict(img):
    return {
        'id'         : img.id,
        'image_url'  : img.image_url,
        'is_cover'   : img.is_cover,
        'order_index': img.order_index,
        'photo_type' : _photo_type(img.order_index),
    }

def _project_dict(p):
    imgs = sorted(p.image, key=lambda x: x.order_index)
    return {
        'id'      : p.id,
        'title'   : p.title,
        'section' : getattr(p, 'section', 'gallery'),  # 'gallery' | 'featured' | 'before_after'
        'create_at': p.create_at.isoformat() if p.create_at else None,
        'images'  : [_img_dict(i) for i in imgs],
    }

def _contractor_settings(c):
    return {
        'business_name' : c.business_name  or '',
        'description'   : c.description    or '',
        'about'         : c.about          or '',
        'phone'         : c.phone          or '',
        'business_email': c.business_email or '',
        'address'       : c.address        or '',
        'logo_image'    : c.logo_image     or '',
        'cover_image'   : c.cover_image    or '',
        'website_slug'  : c.website_slug   or '',
        'hero_color'    : getattr(c, 'hero_color', None) or '#1e293b',
        'btn_color'     : getattr(c, 'btn_color',  None) or '#1d6b3e',
    }


# ── PUBLIC: view portfolio ─────────────────────────────────────────────────────
@api.route('/portfolio/<string:slug>', methods=['GET'])
def get_public_portfolio(slug):
    try:
        # Reject invalid slugs — Python False boolean serialized as string, empty, etc.
        if not slug or slug.lower() in ('false', 'none', 'null', 'undefined'):
            return jsonify({'error': 'Portfolio not found'}), 404

        contractor = Contractor.query.filter_by(website_slug=slug).first()
        if not contractor:
            return jsonify({'error': 'Portfolio not found'}), 404

        user     = User.query.get(contractor.user_id)
        projects = PortfolioProject.query.filter_by(
            provider_id=contractor.id
        ).order_by(PortfolioProject.create_at.desc()).all()

        s = _contractor_settings(contractor)
        if not s['business_name'] and user:
            s['business_name'] = user.name

        return jsonify({'contractor': s, 'projects': [_project_dict(p) for p in projects]}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ── PUBLIC: client submits estimate ───────────────────────────────────────────
@api.route('/portfolio/<string:slug>/request-estimate', methods=['POST'])
def public_request_estimate(slug):
    try:
        contractor = Contractor.query.filter_by(website_slug=slug).first()
        if not contractor:
            return jsonify({'error': 'Contractor not found'}), 404

        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        required = ['customer_name', 'customer_email', 'customer_phone', 'estimate_type']
        missing  = [f for f in required if not data.get(f)]
        if missing:
            return jsonify({'error': f'Missing: {", ".join(missing)}'}), 400

        estimate = EstimateRequest(
            contractor_id    = contractor.id,
            customer_name    = data['customer_name'].strip(),
            customer_email   = data['customer_email'].strip(),
            customer_phone   = data['customer_phone'].strip(),
            customer_address = data.get('customer_address', '').strip(),
            estimate_type    = data['estimate_type'],
            description      = data.get('description', '').strip(),
            budget_range     = data.get('budget_range', ''),
            status           = EstimateStatus.new,
        )
        db.session.add(estimate)
        db.session.commit()

        return jsonify({
            'msg'        : 'Request submitted! The contractor will contact you soon.',
            'estimate_id': estimate.id,
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ── PROTECTED: portfolio settings ─────────────────────────────────────────────
@api.route('/portfolio/settings', methods=['GET'])
@jwt_required()
def get_portfolio_settings():
    try:
        cid = _get_contractor_id()
        c   = Contractor.query.get(cid)
        return jsonify({'settings': _contractor_settings(c)}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api.route('/portfolio/settings', methods=['PUT'])
@jwt_required()
def update_portfolio_settings():
    try:
        cid  = _get_contractor_id()
        c    = Contractor.query.get(cid)
        data = request.get_json() or {}

        for field in ['business_name','description','about','phone',
                      'business_email','address','website_slug',
                      'hero_color','btn_color']:
            if field in data:
                setattr(c, field, data[field])

        db.session.commit()
        return jsonify({'msg': 'Settings saved', 'settings': _contractor_settings(c)}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@api.route('/portfolio/settings/logo', methods=['POST'])
@jwt_required()
def upload_portfolio_logo():
    """Form fields: file (image), image_type = logo | cover"""
    try:
        cid = _get_contractor_id()
        c   = Contractor.query.get(cid)

        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        image_type = request.form.get('image_type', 'logo')
        result = cloudinary.uploader.upload(
            request.files['file'],
            folder=f'portfolio/{cid}',
            resource_type='image'
        )
        url = result['secure_url']

        if image_type == 'cover':
            c.cover_image = url
        else:
            c.logo_image = url

        db.session.commit()
        return jsonify({'msg': 'Image uploaded', 'url': url, 'image_type': image_type}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ── PROTECTED: projects CRUD ──────────────────────────────────────────────────
@api.route('/portfolio/projects', methods=['GET'])
@jwt_required()
def get_my_portfolio():
    try:
        cid      = _get_contractor_id()
        projects = PortfolioProject.query.filter_by(
            provider_id=cid
        ).order_by(PortfolioProject.create_at.desc()).all()
        return jsonify({'projects': [_project_dict(p) for p in projects]}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api.route('/portfolio/projects', methods=['POST'])
@jwt_required()
def create_portfolio_project():
    try:
        cid   = _get_contractor_id()
        data  = request.get_json() or {}
        title = (data.get('title') or 'New project').strip()

        section = (data.get('section') or 'gallery').strip()
        project = PortfolioProject(provider_id=cid, title=title)
        # Store section in title prefix if model doesn't have section field
        # e.g. "[featured] Kitchen renovation" — parsed on read
        if hasattr(PortfolioProject, 'section'):
            project.section = section
        db.session.add(project)
        db.session.commit()

        return jsonify({'msg': 'Project created',
                        'project': {'id': project.id, 'title': project.title, 'section': section, 'images': []}}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@api.route('/portfolio/projects/<int:project_id>', methods=['PUT'])
@jwt_required()
def update_portfolio_project(project_id):
    try:
        cid     = _get_contractor_id()
        project = _get_project(project_id, cid)
        if not project:
            return jsonify({'error': 'Project not found'}), 404

        data = request.get_json() or {}
        if 'title' in data:
            project.title = (data['title'] or '').strip()
        if 'section' in data and hasattr(project, 'section'):
            project.section = data['section']
        db.session.commit()
        return jsonify({'msg': 'Project updated'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@api.route('/portfolio/projects/<int:project_id>', methods=['DELETE'])
@jwt_required()
def delete_portfolio_project(project_id):
    try:
        cid     = _get_contractor_id()
        project = _get_project(project_id, cid)
        if not project:
            return jsonify({'error': 'Project not found'}), 404

        # Delete all images first to avoid NOT NULL violation on portfolioproject_id
        for img in list(project.image):
            db.session.delete(img)
        db.session.flush()

        db.session.delete(project)
        db.session.commit()
        return jsonify({'msg': 'Project deleted'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ── PROTECTED: photos ─────────────────────────────────────────────────────────
@api.route('/portfolio/projects/<int:project_id>/photos', methods=['POST'])
@jwt_required()
def upload_portfolio_photo(project_id):
    """Form fields: file (image), photo_type = before | after | general"""
    try:
        cid     = _get_contractor_id()
        project = _get_project(project_id, cid)
        if not project:
            return jsonify({'error': 'Project not found'}), 404

        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        photo_type = request.form.get('photo_type', 'general')
        order_map  = {'before': -1, 'after': 1, 'general': 0}
        order_idx  = order_map.get(photo_type, 0)

        result = cloudinary.uploader.upload(
            request.files['file'],
            folder=f'portfolio/{cid}/project_{project_id}',
            resource_type='image'
        )

        is_cover = len(project.image) == 0
        img = PortfolioImage(
            portfolioproject_id=project_id,
            image_url=result['secure_url'],
            is_cover=is_cover,
            order_index=order_idx,
        )
        db.session.add(img)
        db.session.commit()

        return jsonify({'msg': 'Photo uploaded', 'image': _img_dict(img)}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@api.route('/portfolio/projects/<int:project_id>/photos/<int:photo_id>', methods=['DELETE'])
@jwt_required()
def delete_portfolio_photo(project_id, photo_id):
    try:
        cid     = _get_contractor_id()
        project = _get_project(project_id, cid)
        if not project:
            return jsonify({'error': 'Project not found'}), 404

        img = PortfolioImage.query.filter_by(id=photo_id, portfolioproject_id=project_id).first()
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
    try:
        cid     = _get_contractor_id()
        project = _get_project(project_id, cid)
        if not project:
            return jsonify({'error': 'Project not found'}), 404

        for img in project.image:
            img.is_cover = (img.id == photo_id)
        db.session.commit()
        return jsonify({'msg': 'Cover updated'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ── PROTECTED: notification count ─────────────────────────────────────────────
@api.route('/portfolio/notifications/count', methods=['GET'])
@jwt_required()
def get_new_estimate_count():
    """Returns count of NEW estimates so topbar can show a badge"""
    try:
        cid   = _get_contractor_id()
        count = EstimateRequest.query.filter_by(
            contractor_id=cid,
            status=EstimateStatus.new
        ).count()
        return jsonify({'new_estimates': count}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
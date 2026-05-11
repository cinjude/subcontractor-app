import cloudinary
import cloudinary.uploader
import os
from flask import request, jsonify
from flask_cors import CORS
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import IntegrityError
from sqlalchemy import or_, and_, func
from datetime import datetime

from api.models import db, EstimateRequest, Contractor, User
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


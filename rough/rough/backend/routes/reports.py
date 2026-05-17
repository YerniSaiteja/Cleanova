from flask import Blueprint, request, jsonify, current_app, url_for
from extensions import db
from flask_jwt_extended import jwt_required, get_jwt_identity
import json
from models import GarbageReport, User, EcoPointsLog, CitizenProfile
import os
from werkzeug.utils import secure_filename
import uuid
from PIL import Image
import exifread

reports_bp = Blueprint('reports', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def has_gps_data(image_path):
    """Check if image has GPS EXIF data"""
    try:
        with open(image_path, 'rb') as f:
            tags = exifread.process_file(f, details=False)
            # Check for GPS latitude and longitude
            if ('GPS GPSLatitude' in tags and 'GPS GPSLongitude' in tags and
                tags['GPS GPSLatitude'].values and tags['GPS GPSLongitude'].values):
                return True
        return False
    except Exception:
        return False

def get_current_user_role():
    """Helper to get current user role"""
    identity = json.loads(get_jwt_identity()) if get_jwt_identity() and isinstance(get_jwt_identity(), str) else get_jwt_identity()
    if not identity:
        return None
    user = User.query.get(identity.get('id'))
    return user.role if user else None

@reports_bp.route('', methods=['GET'])
@jwt_required(optional=True)
def get_reports():
    """Get all garbage reports (filtered by role)"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        status = request.args.get('status')
        user_id = request.args.get('user_id', type=int)
        
        query = GarbageReport.query
        
        # Citizens can only see their own reports
        role = get_current_user_role()
        if role == 'citizen':
            identity = json.loads(get_jwt_identity()) if get_jwt_identity() and isinstance(get_jwt_identity(), str) else get_jwt_identity()
            if identity:
                query = query.filter_by(user_id=identity.get('id'))
        elif role not in ['officer', 'worker', 'admin']:
            # Non-authenticated or invalid users see nothing
            query = query.filter_by(id=0)
        
        if status:
            query = query.filter_by(status=status)
        if user_id and role in ['officer', 'admin']:
            query = query.filter_by(user_id=user_id)
        
        reports = query.order_by(GarbageReport.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'reports': [report.to_dict() for report in reports.items],
            'total': reports.total,
            'pages': reports.pages,
            'current_page': page
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@reports_bp.route('', methods=['POST'])
@jwt_required()
def create_report():
    """Create a new garbage report (citizens only)"""
    try:
        identity = json.loads(get_jwt_identity()) if get_jwt_identity() and isinstance(get_jwt_identity(), str) else get_jwt_identity()
        user = User.query.get(identity.get('id'))
        
        if user.role != 'citizen':
            return jsonify({'error': 'Only citizens can create reports'}), 403
        
        # Check if json or multipart
        if request.is_json:
             data = request.get_json()
        else:
             data = request.form

        file = request.files.get('image')
        
        if not file and 'photo_url' not in data:
            return jsonify({'error': 'No image provided'}), 400
            
        photo_url = data.get('photo_url')

        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            # Make filename unique
            filename = f"{uuid.uuid4()}_{filename}"
            file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            # Create URL (assuming static setup)
            photo_url = f"/static/uploads/{filename}" # Simple relative path
            # Or full URL: url_for('static', filename=f'uploads/{filename}', _external=True)

        if not photo_url:
             return jsonify({'error': 'Failed to process image'}), 400

        required_fields = ['location_latitude', 'location_longitude']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        report = GarbageReport(
            user_id=user.id,
            photo_url=photo_url,
            location_latitude=float(data['location_latitude']),
            location_longitude=float(data['location_longitude']),
            address=data.get('location_address') or data.get('address'),
            description=data.get('description'),
            status='pending'
        )
        
        db.session.add(report)
        db.session.commit()
        
        return jsonify({
            'message': 'Report created successfully',
            'report': report.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@reports_bp.route('/<int:report_id>', methods=['GET'])
@jwt_required(optional=True)
def get_report(report_id):
    """Get a specific report"""
    try:
        report = GarbageReport.query.get(report_id)
        if not report:
            return jsonify({'error': 'Report not found'}), 404
        
        role = get_current_user_role()
        identity = json.loads(get_jwt_identity()) if get_jwt_identity() and isinstance(get_jwt_identity(), str) else get_jwt_identity()
        
        # Citizens can only see their own reports
        if role == 'citizen' and identity and report.user_id != identity.get('id'):
            return jsonify({'error': 'Access denied'}), 403
        
        return jsonify({'report': report.to_dict()}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@reports_bp.route('/<int:report_id>/verify', methods=['POST'])
@jwt_required()
def verify_report(report_id):
    """Verify a report and award points"""
    try:
        identity = json.loads(get_jwt_identity()) if get_jwt_identity() and isinstance(get_jwt_identity(), str) else get_jwt_identity()
        user = User.query.get(identity.get('id'))
        report = GarbageReport.query.get(report_id)
        
        if not report:
            return jsonify({'error': 'Report not found'}), 404
            
        if user.role != 'admin' and user.role != 'officer':
             return jsonify({'error': 'Access denied'}), 403

        data = request.get_json()
        status = data.get('status')
        
        if status == 'verified':
             report.status = 'verified'
             # Award points to citizen
             citizen_profile = CitizenProfile.query.filter_by(user_id=report.user_id).first()
             if citizen_profile:
                 points = 20
                 citizen_profile.total_eco_points += points
                 
                 # Log points
                 log = EcoPointsLog(
                     citizen_id=report.user_id,
                     report_id=report.id,
                     points_awarded=points,
                     reason="Report Verified"
                 )
                 db.session.add(log)
        elif status == 'rejected':
             report.status = 'rejected'
        
        db.session.commit()
        
        return jsonify({
             'message': f'Report {status} successfully',
             'report': report.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@reports_bp.route('/<int:report_id>', methods=['PUT'])
@jwt_required()
def update_report(report_id):
    """Update a report (only by owner or admin)"""
    try:
        identity = json.loads(get_jwt_identity()) if get_jwt_identity() and isinstance(get_jwt_identity(), str) else get_jwt_identity()
        user = User.query.get(identity.get('id'))
        report = GarbageReport.query.get(report_id)
        
        if not report:
            return jsonify({'error': 'Report not found'}), 404
        
        # Only owner or admin can update
        if user.role != 'admin' and report.user_id != user.id:
            return jsonify({'error': 'Access denied'}), 403
        
        # Can only update pending reports
        if report.status != 'pending' and user.role != 'admin':
            return jsonify({'error': 'Cannot update report after verification'}), 400
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        if 'description' in data:
            report.description = data['description']
        if 'address' in data:
            report.address = data['address']
        if 'photo_url' in data:
            report.photo_url = data['photo_url']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Report updated successfully',
            'report': report.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@reports_bp.route('/<int:report_id>', methods=['DELETE'])
@jwt_required()
def delete_report(report_id):
    """Delete a report (only by owner or admin)"""
    try:
        identity = json.loads(get_jwt_identity()) if get_jwt_identity() and isinstance(get_jwt_identity(), str) else get_jwt_identity()
        user = User.query.get(identity.get('id'))
        report = GarbageReport.query.get(report_id)
        
        if not report:
            return jsonify({'error': 'Report not found'}), 404
        
        # Only owner or admin can delete
        if user.role != 'admin' and report.user_id != user.id:
            return jsonify({'error': 'Access denied'}), 403
        
        db.session.delete(report)
        db.session.commit()
        
        return jsonify({'message': 'Report deleted successfully'}), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


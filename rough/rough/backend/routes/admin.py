from flask import Blueprint, request, jsonify
from extensions import db, bcrypt
from flask_jwt_extended import jwt_required, get_jwt_identity
import json
from werkzeug.utils import secure_filename
import os
import uuid
from flask import current_app
from datetime import datetime
from models import User, CitizenProfile, OfficerProfile, WorkerProfile, GarbageReport, Assignment, CleaningUpdate, EcoPointsLog

admin_bp = Blueprint('admin', __name__)

def is_admin():
    """Helper function to check if current user is admin"""
    identity = json.loads(get_jwt_identity()) if get_jwt_identity() and isinstance(get_jwt_identity(), str) else get_jwt_identity()
    user = User.query.get(identity.get('id'))
    return user and user.role == 'admin'

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def get_all_users():
    """Get all users with filtering (admin only)"""
    try:
        if not is_admin():
            return jsonify({'error': 'Admin access required'}), 403
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        role = request.args.get('role')
        
        query = User.query
        if role:
            query = query.filter_by(role=role)
        
        users = query.paginate(page=page, per_page=per_page, error_out=False)
        
        users_list = []
        for user in users.items:
            user_dict = user.to_dict()
            if user.role == 'citizen' and user.citizen_profile:
                user_dict['profile'] = user.citizen_profile.to_dict()
            elif user.role == 'officer' and user.officer_profile:
                user_dict['profile'] = user.officer_profile.to_dict()
            elif user.role == 'worker' and user.worker_profile:
                user_dict['profile'] = user.worker_profile.to_dict()
            users_list.append(user_dict)
        
        return jsonify({
            'users': users_list,
            'total': users.total,
            'pages': users.pages,
            'current_page': page
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/users/create', methods=['POST'])
@jwt_required()
def create_user():
    """Create a new user (admin only)"""
    try:
        if not is_admin():
            return jsonify({'error': 'Admin access required'}), 403
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        required_fields = ['username', 'email', 'password', 'full_name', 'role']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if user already exists
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already exists'}), 400
        
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already exists'}), 400
        
        # Create new user
        user = User(
            username=data['username'],
            email=data['email'],
            password_hash=bcrypt.generate_password_hash(data['password']).decode('utf-8'),
            full_name=data['full_name'],
            phone=data.get('phone'),
            role=data['role']
        )
        
        db.session.add(user)
        db.session.flush()
        
        # Create profile based on role
        if data['role'] == 'citizen':
            profile = CitizenProfile(
                user_id=user.id,
                address=data.get('address'),
                city=data.get('city'),
                state=data.get('state'),
                pincode=data.get('pincode')
            )
            db.session.add(profile)
        elif data['role'] == 'officer':
            profile = OfficerProfile(
                user_id=user.id,
                zone=data.get('zone', ''),
                designation=data.get('designation'),
                department=data.get('department'),
                employee_id=data.get('employee_id')
            )
            db.session.add(profile)
        elif data['role'] == 'worker':
            profile = WorkerProfile(
                user_id=user.id,
                zone=data.get('zone', ''),
                designation=data.get('designation'),
                employee_id=data.get('employee_id'),
                vehicle_number=data.get('vehicle_number')
            )
            db.session.add(profile)
        
        db.session.commit()
        
        user_dict = user.to_dict()
        if hasattr(user, 'citizen_profile') and user.citizen_profile:
            user_dict['profile'] = user.citizen_profile.to_dict()
        elif hasattr(user, 'officer_profile') and user.officer_profile:
            user_dict['profile'] = user.officer_profile.to_dict()
        elif hasattr(user, 'worker_profile') and user.worker_profile:
            user_dict['profile'] = user.worker_profile.to_dict()
        
        return jsonify({
            'message': 'User created successfully',
            'user': user_dict
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    """Get admin dashboard statistics"""
    try:
        if not is_admin():
            return jsonify({'error': 'Admin access required'}), 403
        
        from models import GarbageReport, Verification, Assignment, RedemptionRequest
        
        total_users = User.query.count()
        citizens = User.query.filter_by(role='citizen').count()
        officers = User.query.filter_by(role='officer').count()
        workers = User.query.filter_by(role='worker').count()
        
        total_reports = GarbageReport.query.count()
        pending_reports = GarbageReport.query.filter_by(status='pending').count()
        verified_reports = GarbageReport.query.filter_by(status='verified').count()
        cleaned_reports = GarbageReport.query.filter_by(status='cleaned').count()
        
        total_assignments = Assignment.query.count()
        active_assignments = Assignment.query.filter_by(status='in_progress').count()
        
        total_redemptions = RedemptionRequest.query.count()
        pending_redemptions = RedemptionRequest.query.filter_by(status='pending').count()
        
        return jsonify({
            'users': {
                'total': total_users,
                'citizens': citizens,
                'officers': officers,
                'workers': workers
            },
            'reports': {
                'total': total_reports,
                'pending': pending_reports,
                'verified': verified_reports,
                'cleaned': cleaned_reports
            },
            'assignments': {
                'total': total_assignments,
                'active': active_assignments
            },
            'redemptions': {
                'total': total_redemptions,
                'pending': pending_redemptions
            }
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/resolved-cases', methods=['GET'])
@jwt_required()
def get_resolved_cases():
    """Get all resolved (cleaned) cases"""
    try:
        if not is_admin():
            return jsonify({'error': 'Admin access required'}), 403
        
        # Get all reports with status 'cleaned'
        cleaned_reports = GarbageReport.query.filter_by(status='cleaned').order_by(GarbageReport.updated_at.desc()).all()
        
        result = []
        for report in cleaned_reports:
            # Find the cleaning update
            update = CleaningUpdate.query.filter_by(report_id=report.id).order_by(CleaningUpdate.updated_at.desc()).first()
            
            clean_image = update.after_photo_url if update else None
            remarks = update.completion_remarks if update else None
            resolved_by = update.worker.full_name if update and update.worker else "Unknown"
            
            report_dict = report.to_dict()
            report_dict['clean_image'] = clean_image
            report_dict['resolution_remarks'] = remarks
            report_dict['resolved_by'] = resolved_by
            result.append(report_dict)
            
        return jsonify({'resolved_cases': result}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/reports/<int:report_id>/resolve', methods=['POST'])
@jwt_required()
def resolve_report(report_id):
    """Resolve a report by uploading a cleaned image"""
    try:
        if not is_admin():
            return jsonify({'error': 'Admin access required'}), 403
            
        if 'image' not in request.files:
            return jsonify({'error': 'No image provided'}), 400
            
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
            
        report = GarbageReport.query.get_or_404(report_id)
        
        # Save image
        filename = secure_filename(file.filename)
        unique_filename = f"cleaned_{uuid.uuid4()}_{filename}"
        
        # Ensure uploads folder exists
        upload_folder = current_app.config['UPLOAD_FOLDER']
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)
            
        file_path = os.path.join(upload_folder, unique_filename)
        file.save(file_path)
        
        # Create URL
        # Assuming static serving from root
        image_url = f"/static/uploads/{unique_filename}"
        
        identity = json.loads(get_jwt_identity()) if get_jwt_identity() and isinstance(get_jwt_identity(), str) else get_jwt_identity()
        admin_id = identity.get('id')
        
        remarks = request.form.get('remarks', 'Resolved by Admin')
        
        update = CleaningUpdate(
            report_id=report.id,
            worker_id=admin_id, 
            after_photo_url=image_url,
            completion_remarks=remarks
        )
        
        db.session.add(update)
        report.status = 'cleaned'
        report.updated_at = datetime.utcnow()
        
        # Award 50 points to citizen for having their report resolved
        citizen_profile = CitizenProfile.query.filter_by(user_id=report.user_id).first()
        if citizen_profile:
            points = 50
            citizen_profile.total_eco_points += points
            
            # Log points
            log = EcoPointsLog(
                citizen_id=report.user_id,
                report_id=report.id,
                points_awarded=points,
                reason="Report Cleaned/Resolved"
            )
            db.session.add(log)
        
        db.session.commit()
        
        return jsonify({'message': 'Report resolved successfully', 'data': update.to_dict()}), 200
        
    except Exception as e:
        db.session.rollback()
        print(e)
        return jsonify({'error': str(e)}), 500

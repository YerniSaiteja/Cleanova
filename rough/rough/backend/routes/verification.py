from flask import Blueprint, request, jsonify
from extensions import db
from flask_jwt_extended import jwt_required, get_jwt_identity
import json
from models import Verification, GarbageReport, User, EcoPointsLog, CitizenProfile

verification_bp = Blueprint('verification', __name__)

@verification_bp.route('/report/<int:report_id>', methods=['POST'])
@jwt_required()
def verify_report(report_id):
    """Verify a garbage report (officers only)"""
    try:
        identity = json.loads(get_jwt_identity()) if get_jwt_identity() and isinstance(get_jwt_identity(), str) else get_jwt_identity()
        user = User.query.get(identity.get('id'))
        
        if user.role != 'officer' and user.role != 'admin':
            return jsonify({'error': 'Only officers can verify reports'}), 403
        
        report = GarbageReport.query.get(report_id)
        if not report:
            return jsonify({'error': 'Report not found'}), 404
        
        if report.status != 'pending':
            return jsonify({'error': 'Report already verified'}), 400
        
        data = request.get_json()
        if not data or 'is_verified' not in data:
            return jsonify({'error': 'is_verified field is required'}), 400
        
        is_verified = data['is_verified']
        remarks = data.get('remarks', '')
        
        # Create verification record
        verification = Verification(
            report_id=report_id,
            officer_id=user.id,
            is_verified=is_verified,
            remarks=remarks
        )
        
        # Update report status
        if is_verified:
            report.status = 'verified'
            # Award eco-points to citizen
            points_awarded = 10  # Default points for verified report
            eco_log = EcoPointsLog(
                citizen_id=report.user_id,
                report_id=report_id,
                points_awarded=points_awarded,
                reason='Verified garbage report'
            )
            db.session.add(eco_log)
            
            # Update citizen's total points
            citizen_profile = CitizenProfile.query.filter_by(user_id=report.user_id).first()
            if citizen_profile:
                citizen_profile.total_eco_points += points_awarded
        else:
            report.status = 'rejected'
        
        db.session.add(verification)
        db.session.commit()
        
        return jsonify({
            'message': 'Report verified successfully',
            'verification': verification.to_dict(),
            'report': report.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@verification_bp.route('/report/<int:report_id>', methods=['GET'])
@jwt_required()
def get_verification(report_id):
    """Get verification details for a report"""
    try:
        verification = Verification.query.filter_by(report_id=report_id).first()
        if not verification:
            return jsonify({'error': 'Verification not found'}), 404
        
        return jsonify({'verification': verification.to_dict()}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@verification_bp.route('', methods=['GET'])
@jwt_required()
def get_verifications():
    """Get all verifications (officers and admins only)"""
    try:
        identity = json.loads(get_jwt_identity()) if get_jwt_identity() and isinstance(get_jwt_identity(), str) else get_jwt_identity()
        user = User.query.get(identity.get('id'))
        
        if user.role not in ['officer', 'admin']:
            return jsonify({'error': 'Access denied'}), 403
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        query = Verification.query
        
        # Officers can only see their own verifications
        if user.role == 'officer':
            query = query.filter_by(officer_id=user.id)
        
        verifications = query.order_by(Verification.verified_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'verifications': [v.to_dict() for v in verifications.items],
            'total': verifications.total,
            'pages': verifications.pages,
            'current_page': page
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


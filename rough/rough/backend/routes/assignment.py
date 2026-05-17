from flask import Blueprint, request, jsonify
from extensions import db
from flask_jwt_extended import jwt_required, get_jwt_identity
import json
from models import Assignment, GarbageReport, User, CleaningUpdate
from datetime import datetime

assignment_bp = Blueprint('assignment', __name__)

@assignment_bp.route('/report/<int:report_id>', methods=['POST'])
@jwt_required()
def assign_report(report_id):
    """Assign a verified report to a worker (officers/admins only)"""
    try:
        identity = json.loads(get_jwt_identity()) if get_jwt_identity() and isinstance(get_jwt_identity(), str) else get_jwt_identity()
        user = User.query.get(identity.get('id'))
        
        if user.role not in ['officer', 'admin']:
            return jsonify({'error': 'Only officers and admins can assign reports'}), 403
        
        report = GarbageReport.query.get(report_id)
        if not report:
            return jsonify({'error': 'Report not found'}), 404
        
        if report.status != 'verified':
            return jsonify({'error': 'Only verified reports can be assigned'}), 400
        
        if report.assignment:
            return jsonify({'error': 'Report already assigned'}), 400
        
        data = request.get_json()
        if not data or 'worker_id' not in data:
            return jsonify({'error': 'worker_id is required'}), 400
        
        worker = User.query.get(data['worker_id'])
        if not worker or worker.role != 'worker':
            return jsonify({'error': 'Invalid worker'}), 400
        
        assignment = Assignment(
            report_id=report_id,
            worker_id=worker.id,
            assigned_by=user.id,
            status='assigned'
        )
        
        report.status = 'assigned'
        
        db.session.add(assignment)
        db.session.commit()
        
        return jsonify({
            'message': 'Report assigned successfully',
            'assignment': assignment.to_dict(),
            'report': report.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@assignment_bp.route('/<int:assignment_id>/update', methods=['PUT'])
@jwt_required()
def update_assignment(assignment_id):
    """Update assignment status (workers can update their own assignments)"""
    try:
        identity = json.loads(get_jwt_identity()) if get_jwt_identity() and isinstance(get_jwt_identity(), str) else get_jwt_identity()
        user = User.query.get(identity.get('id'))
        
        assignment = Assignment.query.get(assignment_id)
        if not assignment:
            return jsonify({'error': 'Assignment not found'}), 404
        
        # Workers can only update their own assignments
        if user.role == 'worker' and assignment.worker_id != user.id:
            return jsonify({'error': 'Access denied'}), 403
        
        # Admins and officers can update any assignment
        if user.role not in ['worker', 'officer', 'admin']:
            return jsonify({'error': 'Access denied'}), 403
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        if 'status' in data:
            assignment.status = data['status']
            if data['status'] == 'completed':
                assignment.completed_at = datetime.utcnow()
                assignment.report.status = 'cleaned'
        
        db.session.commit()
        
        return jsonify({
            'message': 'Assignment updated successfully',
            'assignment': assignment.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@assignment_bp.route('/report/<int:report_id>/cleaning-update', methods=['POST'])
@jwt_required()
def add_cleaning_update(report_id):
    """Add cleaning update with after photo (workers only)"""
    try:
        identity = json.loads(get_jwt_identity()) if get_jwt_identity() and isinstance(get_jwt_identity(), str) else get_jwt_identity()
        user = User.query.get(identity.get('id'))
        
        if user.role != 'worker':
            return jsonify({'error': 'Only workers can add cleaning updates'}), 403
        
        report = GarbageReport.query.get(report_id)
        if not report:
            return jsonify({'error': 'Report not found'}), 404
        
        if not report.assignment or report.assignment.worker_id != user.id:
            return jsonify({'error': 'You are not assigned to this report'}), 403
        
        data = request.get_json()
        if not data or 'after_photo_url' not in data:
            return jsonify({'error': 'after_photo_url is required'}), 400
        
        cleaning_update = CleaningUpdate(
            report_id=report_id,
            worker_id=user.id,
            after_photo_url=data['after_photo_url'],
            completion_remarks=data.get('completion_remarks', '')
        )
        
        # Update assignment status
        assignment = report.assignment
        assignment.status = 'completed'
        assignment.completed_at = datetime.utcnow()
        report.status = 'cleaned'
        
        db.session.add(cleaning_update)
        db.session.commit()
        
        return jsonify({
            'message': 'Cleaning update added successfully',
            'cleaning_update': cleaning_update.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@assignment_bp.route('', methods=['GET'])
@jwt_required()
def get_assignments():
    """Get all assignments (filtered by role)"""
    try:
        identity = json.loads(get_jwt_identity()) if get_jwt_identity() and isinstance(get_jwt_identity(), str) else get_jwt_identity()
        user = User.query.get(identity.get('id'))
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        status = request.args.get('status')
        
        query = Assignment.query
        
        # Workers can only see their own assignments
        if user.role == 'worker':
            query = query.filter_by(worker_id=user.id)
        elif user.role not in ['officer', 'admin']:
            return jsonify({'error': 'Access denied'}), 403
        
        if status:
            query = query.filter_by(status=status)
        
        assignments = query.order_by(Assignment.assigned_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'assignments': [a.to_dict() for a in assignments.items],
            'total': assignments.total,
            'pages': assignments.pages,
            'current_page': page
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


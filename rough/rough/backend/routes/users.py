from flask import Blueprint, request, jsonify
from extensions import db, bcrypt
from flask_jwt_extended import jwt_required, get_jwt_identity
import json
from models import User

user_bp = Blueprint('users', __name__)

def is_admin():
    """Helper function to check if current user is admin"""
    identity = json.loads(get_jwt_identity()) if get_jwt_identity() and isinstance(get_jwt_identity(), str) else get_jwt_identity()
    user = User.query.get(identity.get('id'))
    return user and user.role == 'admin'

@user_bp.route('', methods=['GET'])
@jwt_required()
def get_users():
    """Get all users (admin only)"""
    try:
        if not is_admin():
            return jsonify({'error': 'Admin access required'}), 403
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        users = User.query.paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'users': [user.to_dict() for user in users.items],
            'total': users.total,
            'pages': users.pages,
            'current_page': page
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@user_bp.route('/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    """Get a specific user"""
    try:
        identity = json.loads(get_jwt_identity()) if get_jwt_identity() and isinstance(get_jwt_identity(), str) else get_jwt_identity()
        user_role = identity.get('role')
        current_user_id = identity.get('id')
        
        # Users can only view their own profile unless they're admin
        if user_role != 'admin' and current_user_id != user_id:
            return jsonify({'error': 'Access denied'}), 403
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({'user': user.to_dict()}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@user_bp.route('/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    """Update a user profile"""
    try:
        identity = json.loads(get_jwt_identity()) if get_jwt_identity() and isinstance(get_jwt_identity(), str) else get_jwt_identity()
        user_role = identity.get('role')
        current_user_id = identity.get('id')
        
        # Users can only update their own profile unless they're admin
        if user_role != 'admin' and current_user_id != user_id:
            return jsonify({'error': 'Access denied'}), 403
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Update fields
        if 'full_name' in data:
            user.full_name = data['full_name']
        if 'phone' in data:
            user.phone = data['phone']
        if 'password' in data and (user_role == 'admin' or current_user_id == user_id):
            user.password_hash = bcrypt.generate_password_hash(data['password']).decode('utf-8')
        if 'is_active' in data and user_role == 'admin':
            user.is_active = data['is_active']
        
        db.session.commit()
        
        return jsonify({
            'message': 'User updated successfully',
            'user': user.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@user_bp.route('/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    """Delete a user (admin only)"""
    try:
        if not is_admin():
            return jsonify({'error': 'Admin access required'}), 403
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({'message': 'User deleted successfully'}), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


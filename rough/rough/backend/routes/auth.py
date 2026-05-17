from flask import Blueprint, request, jsonify
from extensions import db, bcrypt
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import json
from models import User, CitizenProfile, OfficerProfile, WorkerProfile
from datetime import datetime

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new citizen user"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = ['username', 'email', 'password', 'full_name']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if user already exists
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already exists'}), 400
        
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already exists'}), 400
        
        # Create new user (default role is citizen)
        user = User(
            username=data['username'],
            email=data['email'],
            password_hash=bcrypt.generate_password_hash(data['password']).decode('utf-8'),
            full_name=data['full_name'],
            phone=data.get('phone'),
            role=data.get('role', 'citizen')
        )
        
        db.session.add(user)
        db.session.flush()  # Get user.id
        
        # Create citizen profile if role is citizen
        if user.role == 'citizen':
            profile = CitizenProfile(
                user_id=user.id,
                address=data.get('address'),
                city=data.get('city'),
                state=data.get('state'),
                pincode=data.get('pincode')
            )
            db.session.add(profile)
        
        db.session.commit()
        
        # Generate access token
        import json
        access_token = create_access_token(identity=json.dumps({'id': user.id, 'role': user.role}))
        
        user_dict = user.to_dict()
        if user.role == 'citizen' and user.citizen_profile:
            user_dict['profile'] = user.citizen_profile.to_dict()
        
        return jsonify({
            'message': 'User registered successfully',
            'user': user_dict,
            'access_token': access_token
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """Login for all users (citizens, officers, workers, admins)"""
    try:
        data = request.get_json()
        
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password are required'}), 400
        
        user = User.query.filter_by(email=data['email']).first()
        
        if not user or not bcrypt.check_password_hash(user.password_hash, data['password']):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        if not user.is_active:
            return jsonify({'error': 'Account is deactivated'}), 403
        
        # Generate access token
        import json
        access_token = create_access_token(identity=json.dumps({'id': user.id, 'role': user.role}))
        
        user_dict = user.to_dict()
        # Include profile based on role
        if user.role == 'citizen' and user.citizen_profile:
            user_dict['profile'] = user.citizen_profile.to_dict()
        elif user.role == 'officer' and user.officer_profile:
            user_dict['profile'] = user.officer_profile.to_dict()
        elif user.role == 'worker' and user.worker_profile:
            user_dict['profile'] = user.worker_profile.to_dict()
        
        return jsonify({
            'message': 'Login successful',
            'user': user_dict,
            'access_token': access_token
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current authenticated user with profile"""
    try:
        identity = json.loads(get_jwt_identity()) if get_jwt_identity() and isinstance(get_jwt_identity(), str) else get_jwt_identity()
        user_id = identity.get('id')
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user_dict = user.to_dict()
        # Include profile based on role
        if user.role == 'citizen' and user.citizen_profile:
            user_dict['profile'] = user.citizen_profile.to_dict()
        elif user.role == 'officer' and user.officer_profile:
            user_dict['profile'] = user.officer_profile.to_dict()
        elif user.role == 'worker' and user.worker_profile:
            user_dict['profile'] = user.worker_profile.to_dict()
        
        return jsonify({'user': user_dict}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

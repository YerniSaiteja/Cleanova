from flask import Blueprint, request, jsonify
from extensions import db
from flask_jwt_extended import jwt_required, get_jwt_identity
import json
from models import Reward, RedemptionRequest, User, CitizenProfile
import uuid
from datetime import datetime

rewards_bp = Blueprint('rewards', __name__)

@rewards_bp.route('', methods=['GET'])
def get_rewards():
    """Get all available rewards (public endpoint)"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        available_only = request.args.get('available_only', 'true').lower() == 'true'
        
        query = Reward.query
        
        if available_only:
            query = query.filter_by(is_available=True)
        
        rewards = query.order_by(Reward.points_required.asc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'rewards': [reward.to_dict() for reward in rewards.items],
            'total': rewards.total,
            'pages': rewards.pages,
            'current_page': page
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@rewards_bp.route('', methods=['POST'])
@jwt_required()
def create_reward():
    """Create a new reward (admin only)"""
    try:
        identity = json.loads(get_jwt_identity()) if get_jwt_identity() and isinstance(get_jwt_identity(), str) else get_jwt_identity()
        user = User.query.get(identity.get('id'))
        
        if user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        required_fields = ['name', 'points_required']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        reward = Reward(
            name=data['name'],
            description=data.get('description'),
            points_required=data['points_required'],
            image_url=data.get('image_url'),
            stock_quantity=data.get('stock_quantity', 0),
            is_available=data.get('is_available', True)
        )
        
        db.session.add(reward)
        db.session.commit()
        
        return jsonify({
            'message': 'Reward created successfully',
            'reward': reward.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@rewards_bp.route('/<int:reward_id>', methods=['GET'])
def get_reward(reward_id):
    """Get a specific reward"""
    try:
        reward = Reward.query.get(reward_id)
        if not reward:
            return jsonify({'error': 'Reward not found'}), 404
        
        return jsonify({'reward': reward.to_dict()}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@rewards_bp.route('/<int:reward_id>', methods=['PUT'])
@jwt_required()
def update_reward(reward_id):
    """Update a reward (admin only)"""
    try:
        identity = json.loads(get_jwt_identity()) if get_jwt_identity() and isinstance(get_jwt_identity(), str) else get_jwt_identity()
        user = User.query.get(identity.get('id'))
        
        if user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        reward = Reward.query.get(reward_id)
        if not reward:
            return jsonify({'error': 'Reward not found'}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        if 'name' in data:
            reward.name = data['name']
        if 'description' in data:
            reward.description = data['description']
        if 'points_required' in data:
            reward.points_required = data['points_required']
        if 'image_url' in data:
            reward.image_url = data['image_url']
        if 'stock_quantity' in data:
            reward.stock_quantity = data['stock_quantity']
        if 'is_available' in data:
            reward.is_available = data['is_available']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Reward updated successfully',
            'reward': reward.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@rewards_bp.route('/redeem', methods=['POST'])
@jwt_required()
def redeem_reward():
    """Redeem a reward (citizens only)"""
    try:
        identity = json.loads(get_jwt_identity()) if get_jwt_identity() and isinstance(get_jwt_identity(), str) else get_jwt_identity()
        user = User.query.get(identity.get('id'))
        
        if user.role != 'citizen':
            return jsonify({'error': 'Only citizens can redeem rewards'}), 403
        
        data = request.get_json()
        if not data or 'reward_id' not in data:
            return jsonify({'error': 'reward_id is required'}), 400
        
        reward = Reward.query.get(data['reward_id'])
        if not reward:
            return jsonify({'error': 'Reward not found'}), 404
        
        if not reward.is_available:
            return jsonify({'error': 'Reward is not available'}), 400
        
        if reward.stock_quantity <= 0:
            return jsonify({'error': 'Reward is out of stock'}), 400
        
        citizen_profile = CitizenProfile.query.filter_by(user_id=user.id).first()
        if not citizen_profile:
            return jsonify({'error': 'Citizen profile not found'}), 404
        
        if citizen_profile.total_eco_points < reward.points_required:
            return jsonify({'error': 'Insufficient eco-points'}), 400
        
        # Generate redemption code
        code = f"RED-{uuid.uuid4().hex[:8].upper()}"
        
        # Create redemption request
        redemption = RedemptionRequest(
            citizen_id=user.id,
            reward_id=reward.id,
            redemption_code=code,
            points_used=reward.points_required,
            status='pending',
            delivery_address=data.get('delivery_address'),
            delivery_contact=data.get('delivery_contact')
        )
        
        # Deduct points
        citizen_profile.total_eco_points -= reward.points_required
        
        # Reduce stock
        reward.stock_quantity -= 1
        if reward.stock_quantity <= 0:
            reward.is_available = False
        
        db.session.add(redemption)
        db.session.commit()
        
        return jsonify({
            'message': 'Redemption request created successfully',
            'redemption': redemption.to_dict(),
            'remaining_points': citizen_profile.total_eco_points
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@rewards_bp.route('/redemptions', methods=['GET'])
@jwt_required()
def get_redemptions():
    """Get redemption requests (filtered by role)"""
    try:
        identity = json.loads(get_jwt_identity()) if get_jwt_identity() and isinstance(get_jwt_identity(), str) else get_jwt_identity()
        user = User.query.get(identity.get('id'))
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        status = request.args.get('status')
        
        query = RedemptionRequest.query
        
        # Citizens can only see their own redemptions
        if user.role == 'citizen':
            query = query.filter_by(citizen_id=user.id)
        elif user.role not in ['admin', 'officer']:
            return jsonify({'error': 'Access denied'}), 403
        
        if status:
            query = query.filter_by(status=status)
        
        redemptions = query.order_by(RedemptionRequest.requested_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'redemptions': [r.to_dict() for r in redemptions.items],
            'total': redemptions.total,
            'pages': redemptions.pages,
            'current_page': page
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@rewards_bp.route('/redemptions/<int:redemption_id>/update', methods=['PUT'])
@jwt_required()
def update_redemption(redemption_id):
    """Update redemption request status (admin/officer only)"""
    try:
        identity = json.loads(get_jwt_identity()) if get_jwt_identity() and isinstance(get_jwt_identity(), str) else get_jwt_identity()
        user = User.query.get(identity.get('id'))
        
        if user.role not in ['admin', 'officer']:
            return jsonify({'error': 'Access denied'}), 403
        
        redemption = RedemptionRequest.query.get(redemption_id)
        if not redemption:
            return jsonify({'error': 'Redemption request not found'}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        if 'status' in data:
            redemption.status = data['status']
            if data['status'] in ['approved', 'rejected']:
                redemption.processed_at = datetime.utcnow()
            if data['status'] == 'delivered':
                redemption.delivered_at = datetime.utcnow()
        
        if 'delivery_remarks' in data:
            redemption.delivery_remarks = data['delivery_remarks']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Redemption request updated successfully',
            'redemption': redemption.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@rewards_bp.route('/points/history', methods=['GET'])
@jwt_required()
def get_points_history():
    """Get eco-points history for current citizen"""
    try:
        identity = json.loads(get_jwt_identity()) if get_jwt_identity() and isinstance(get_jwt_identity(), str) else get_jwt_identity()
        user = User.query.get(identity.get('id'))
        
        if user.role != 'citizen':
            return jsonify({'error': 'Only citizens can view points history'}), 403
        
        from models import EcoPointsLog
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        logs = EcoPointsLog.query.filter_by(citizen_id=user.id).order_by(
            EcoPointsLog.created_at.desc()
        ).paginate(page=page, per_page=per_page, error_out=False)
        
        citizen_profile = CitizenProfile.query.filter_by(user_id=user.id).first()
        
        return jsonify({
            'total_points': citizen_profile.total_eco_points if citizen_profile else 0,
            'history': [log.to_dict() for log in logs.items],
            'total': logs.total,
            'pages': logs.pages,
            'current_page': page
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


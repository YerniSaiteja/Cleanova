from flask import Flask, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import os
from extensions import db, bcrypt, jwt

from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Ensure upload directory exists
UPLOAD_FOLDER = os.path.join(app.root_path, 'static', 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

# Initialize extensions with app
db.init_app(app)
bcrypt.init_app(app)
jwt.init_app(app)

# Import models and routes
from models import (
    User, CitizenProfile, OfficerProfile, WorkerProfile,
    GarbageReport, Verification, Assignment, CleaningUpdate,
    EcoPointsLog, Reward, RedemptionRequest
)
from routes.auth import auth_bp
from routes.users import user_bp
from routes.admin import admin_bp
from routes.reports import reports_bp
from routes.verification import verification_bp
from routes.assignment import assignment_bp
from routes.rewards import rewards_bp

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(user_bp, url_prefix='/api/users')
app.register_blueprint(admin_bp, url_prefix='/api/admin')
app.register_blueprint(reports_bp, url_prefix='/api/reports')
app.register_blueprint(verification_bp, url_prefix='/api/verification')
app.register_blueprint(assignment_bp, url_prefix='/api/assignments')
app.register_blueprint(rewards_bp, url_prefix='/api/rewards')

@app.route('/')
def index():
    return jsonify({
        'message': 'Flask Backend API',
        'version': '1.0.0',
        'endpoints': {
            'auth': '/api/auth',
            'users': '/api/users',
            'admin': '/api/admin',
            'reports': '/api/reports',
            'verification': '/api/verification',
            'assignments': '/api/assignments',
            'rewards': '/api/rewards'
        }
    })

@app.route('/api/health')
def health():
    return jsonify({'status': 'healthy', 'timestamp': datetime.utcnow().isoformat()})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        # Create default admin if it doesn't exist
        if not User.query.filter_by(email='admin@example.com').first():
            admin = User(
                username='admin',
                email='admin@example.com',
                password_hash=bcrypt.generate_password_hash('admin123').decode('utf-8'),
                full_name='System Administrator',
                role='admin'
            )
            db.session.add(admin)
            db.session.commit()
            print('Default admin created: admin@example.com / admin123')
            
        # Create default rewards if none exist
        if Reward.query.count() == 0:
            rewards_data = [
                Reward(name="Indoor Plant", description="A beautiful indoor plant to purify your air.", points_required=20, image_url="https://images.unsplash.com/photo-1459156212016-c812468e2115?auto=format&fit=crop&q=80&w=500", stock_quantity=50),
                Reward(name="Recycling Dustbin", description="Separate your waste efficiently with this bin.", points_required=40, image_url="https://images.unsplash.com/photo-1595278069441-2cf29f5405cd?auto=format&fit=crop&q=80&w=500", stock_quantity=30),
                Reward(name="Jute Bag Set", description="Eco-friendly reusable bags for shopping.", points_required=60, image_url="https://images.unsplash.com/photo-1596460658428-1b203c9eb9d5?auto=format&fit=crop&q=80&w=500", stock_quantity=100)
            ]
            db.session.bulk_save_objects(rewards_data)
            db.session.commit()
            print('Default rewards created')
    
    app.run(debug=True, host='0.0.0.0', port=5000)


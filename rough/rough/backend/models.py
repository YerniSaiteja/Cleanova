from extensions import db
from datetime import datetime

class User(db.Model):
    """Base User model for all system users (citizens, officers, workers, admins)"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(200), nullable=False)
    phone = db.Column(db.String(20))
    role = db.Column(db.String(50), nullable=False, index=True)  # citizen, officer, worker, admin
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    citizen_profile = db.relationship('CitizenProfile', backref='user', uselist=False, cascade='all, delete-orphan')
    officer_profile = db.relationship('OfficerProfile', backref='user', uselist=False, cascade='all, delete-orphan')
    worker_profile = db.relationship('WorkerProfile', backref='user', uselist=False, cascade='all, delete-orphan')
    garbage_reports = db.relationship('GarbageReport', backref='reporter', lazy=True, cascade='all, delete-orphan')
    verifications = db.relationship('Verification', backref='officer', lazy=True, foreign_keys='Verification.officer_id')
    assignments = db.relationship('Assignment', backref='worker', lazy=True, foreign_keys='Assignment.worker_id')
    assignments_assigned = db.relationship('Assignment', backref='assigned_by_user', lazy=True, foreign_keys='Assignment.assigned_by')
    eco_points_logs = db.relationship('EcoPointsLog', backref='citizen', lazy=True)
    redemption_requests = db.relationship('RedemptionRequest', backref='citizen', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'full_name': self.full_name,
            'phone': self.phone,
            'role': self.role,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<User {self.username} ({self.role})>'


class CitizenProfile(db.Model):
    """Citizen Profile with additional details and eco-points"""
    __tablename__ = 'citizen_profiles'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=False)
    address = db.Column(db.Text)
    city = db.Column(db.String(100))
    state = db.Column(db.String(100))
    pincode = db.Column(db.String(10))
    total_eco_points = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'address': self.address,
            'city': self.city,
            'state': self.state,
            'pincode': self.pincode,
            'total_eco_points': self.total_eco_points,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<CitizenProfile {self.user_id}>'


class OfficerProfile(db.Model):
    """Officer Profile with zone details and role information"""
    __tablename__ = 'officer_profiles'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=False)
    zone = db.Column(db.String(100), nullable=False)
    designation = db.Column(db.String(100))  # e.g., "Municipal Officer", "Senior Officer"
    department = db.Column(db.String(100))
    employee_id = db.Column(db.String(50), unique=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'zone': self.zone,
            'designation': self.designation,
            'department': self.department,
            'employee_id': self.employee_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<OfficerProfile {self.user_id} - Zone: {self.zone}>'


class WorkerProfile(db.Model):
    """Worker Profile with zone details and assignment information"""
    __tablename__ = 'worker_profiles'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=False)
    zone = db.Column(db.String(100), nullable=False)
    designation = db.Column(db.String(100))  # e.g., "Cleaning Worker", "Supervisor"
    employee_id = db.Column(db.String(50), unique=True)
    vehicle_number = db.Column(db.String(50))  # Vehicle assigned for cleaning
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'zone': self.zone,
            'designation': self.designation,
            'employee_id': self.employee_id,
            'vehicle_number': self.vehicle_number,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<WorkerProfile {self.user_id} - Zone: {self.zone}>'


class GarbageReport(db.Model):
    """Garbage Reports with photos, location, and description"""
    __tablename__ = 'garbage_reports'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    photo_url = db.Column(db.String(500), nullable=False)  # Path/URL to uploaded photo
    location_latitude = db.Column(db.Float, nullable=False)
    location_longitude = db.Column(db.Float, nullable=False)
    address = db.Column(db.Text)
    description = db.Column(db.Text)
    status = db.Column(db.String(50), default='pending', index=True)  # pending, verified, rejected, assigned, cleaned
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    verification = db.relationship('Verification', backref='report', uselist=False, cascade='all, delete-orphan')
    assignment = db.relationship('Assignment', backref='report', uselist=False, cascade='all, delete-orphan')
    cleaning_updates = db.relationship('CleaningUpdate', backref='report', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        clean_image = None
        if self.cleaning_updates:
            # Sort by updated_at or just take the last one since it's likely appended
            clean_image = self.cleaning_updates[-1].after_photo_url
            
        return {
            'id': self.id,
            'user_id': self.user_id,
            'reporter_name': self.reporter.full_name if self.reporter else None,
            'photo_url': self.photo_url,
            'clean_image': clean_image,
            'location_latitude': self.location_latitude,
            'location_longitude': self.location_longitude,
            'address': self.address,
            'description': self.description,
            'status': self.status,
            'verification': self.verification.to_dict() if self.verification else None,
            'assignment': self.assignment.to_dict() if self.assignment else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<GarbageReport {self.id} - Status: {self.status}>'


class Verification(db.Model):
    """Verification table for officer review of reports"""
    __tablename__ = 'verifications'
    
    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.Integer, db.ForeignKey('garbage_reports.id'), unique=True, nullable=False)
    officer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    is_verified = db.Column(db.Boolean, nullable=False)  # True = genuine, False = fake
    remarks = db.Column(db.Text)
    verified_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'report_id': self.report_id,
            'officer_id': self.officer_id,
            'officer_name': self.officer.full_name if self.officer else None,
            'is_verified': self.is_verified,
            'remarks': self.remarks,
            'verified_at': self.verified_at.isoformat() if self.verified_at else None
        }
    
    def __repr__(self):
        return f'<Verification {self.id} - Verified: {self.is_verified}>'


class Assignment(db.Model):
    """Assignment table for assigning reports to workers"""
    __tablename__ = 'assignments'
    
    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.Integer, db.ForeignKey('garbage_reports.id'), unique=True, nullable=False)
    worker_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    assigned_by = db.Column(db.Integer, db.ForeignKey('users.id'))  # Officer/admin who assigned
    status = db.Column(db.String(50), default='assigned', index=True)  # assigned, in_progress, completed
    assigned_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    
    def to_dict(self):
        return {
            'id': self.id,
            'report_id': self.report_id,
            'worker_id': self.worker_id,
            'worker_name': self.worker.full_name if self.worker else None,
            'assigned_by': self.assigned_by,
            'status': self.status,
            'assigned_at': self.assigned_at.isoformat() if self.assigned_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }
    
    def __repr__(self):
        return f'<Assignment {self.id} - Status: {self.status}>'


class CleaningUpdate(db.Model):
    """Cleaning Updates with after-cleaning photos and completion remarks"""
    __tablename__ = 'cleaning_updates'
    
    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.Integer, db.ForeignKey('garbage_reports.id'), nullable=False)
    worker_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    after_photo_url = db.Column(db.String(500), nullable=False)  # Path/URL to after-cleaning photo
    completion_remarks = db.Column(db.Text)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    worker = db.relationship('User', foreign_keys=[worker_id])
    
    def to_dict(self):
        return {
            'id': self.id,
            'report_id': self.report_id,
            'worker_id': self.worker_id,
            'worker_name': self.worker.full_name if self.worker else None,
            'after_photo_url': self.after_photo_url,
            'completion_remarks': self.completion_remarks,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<CleaningUpdate {self.id} for Report {self.report_id}>'


class EcoPointsLog(db.Model):
    """Eco-Points Log for tracking points awarded to citizens"""
    __tablename__ = 'eco_points_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    citizen_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    report_id = db.Column(db.Integer, db.ForeignKey('garbage_reports.id'), nullable=False)
    points_awarded = db.Column(db.Integer, nullable=False)
    reason = db.Column(db.String(200))  # e.g., "Verified garbage report"
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'citizen_id': self.citizen_id,
            'report_id': self.report_id,
            'points_awarded': self.points_awarded,
            'reason': self.reason,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<EcoPointsLog {self.id} - {self.points_awarded} points>'


class Reward(db.Model):
    """Rewards table for available eco-friendly gifts"""
    __tablename__ = 'rewards'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    points_required = db.Column(db.Integer, nullable=False)
    image_url = db.Column(db.String(500))
    stock_quantity = db.Column(db.Integer, default=0)
    is_available = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    redemption_requests = db.relationship('RedemptionRequest', backref='reward', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'points_required': self.points_required,
            'image_url': self.image_url,
            'stock_quantity': self.stock_quantity,
            'is_available': self.is_available,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<Reward {self.name} - {self.points_required} points>'


class RedemptionRequest(db.Model):
    """Redemption Requests for tracking reward redemptions"""
    __tablename__ = 'redemption_requests'
    
    id = db.Column(db.Integer, primary_key=True)
    citizen_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    reward_id = db.Column(db.Integer, db.ForeignKey('rewards.id'), nullable=False)
    redemption_code = db.Column(db.String(20), unique=True, nullable=False)
    points_used = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(50), default='pending', index=True)  # pending, approved, rejected, delivered
    delivery_address = db.Column(db.Text)
    delivery_contact = db.Column(db.String(20))
    delivery_remarks = db.Column(db.Text)
    requested_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    processed_at = db.Column(db.DateTime)
    delivered_at = db.Column(db.DateTime)
    
    def to_dict(self):
        return {
            'id': self.id,
            'citizen_id': self.citizen_id,
            'citizen_name': self.citizen.full_name if self.citizen else None,
            'citizen_name': self.citizen.full_name if self.citizen else None,
            'reward_id': self.reward_id,
            'reward_name': self.reward.name if self.reward else None,
            'redemption_code': self.redemption_code,
            'points_used': self.points_used,
            'status': self.status,
            'delivery_address': self.delivery_address,
            'delivery_contact': self.delivery_contact,
            'delivery_remarks': self.delivery_remarks,
            'requested_at': self.requested_at.isoformat() if self.requested_at else None,
            'processed_at': self.processed_at.isoformat() if self.processed_at else None,
            'delivered_at': self.delivered_at.isoformat() if self.delivered_at else None
        }
    
    def __repr__(self):
        return f'<RedemptionRequest {self.id} - Status: {self.status}>'

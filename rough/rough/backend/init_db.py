from app import app
from extensions import db, bcrypt
from models import (
    User, CitizenProfile, OfficerProfile, WorkerProfile,
    GarbageReport, Verification, Assignment, CleaningUpdate,
    EcoPointsLog, Reward, RedemptionRequest
)

def init_db():
    """Initialize the database with sample data for waste management system"""
    with app.app_context():
        # Drop all tables (use with caution in production!)
        db.drop_all()
        
        # Create all tables
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
            print('✓ Default admin created: admin@example.com / admin123')
        
        # Create sample citizens
        if not User.query.filter_by(email='citizen1@example.com').first():
            citizen1 = User(
                username='citizen1',
                email='citizen1@example.com',
                password_hash=bcrypt.generate_password_hash('citizen123').decode('utf-8'),
                full_name='John Doe',
                phone='1234567890',
                role='citizen'
            )
            db.session.add(citizen1)
            db.session.flush()
            
            profile1 = CitizenProfile(
                user_id=citizen1.id,
                address='123 Main Street',
                city='Mumbai',
                state='Maharashtra',
                pincode='400001',
                total_eco_points=50
            )
            db.session.add(profile1)
            print('✓ Sample citizen created: citizen1@example.com / citizen123')
        
        # Create sample officer
        if not User.query.filter_by(email='officer1@example.com').first():
            officer1 = User(
                username='officer1',
                email='officer1@example.com',
                password_hash=bcrypt.generate_password_hash('officer123').decode('utf-8'),
                full_name='Jane Smith',
                phone='9876543210',
                role='officer'
            )
            db.session.add(officer1)
            db.session.flush()
            
            officer_profile = OfficerProfile(
                user_id=officer1.id,
                zone='Zone A',
                designation='Municipal Officer',
                department='Waste Management',
                employee_id='EMP001'
            )
            db.session.add(officer_profile)
            print('✓ Sample officer created: officer1@example.com / officer123')
        
        # Create sample worker
        if not User.query.filter_by(email='worker1@example.com').first():
            worker1 = User(
                username='worker1',
                email='worker1@example.com',
                password_hash=bcrypt.generate_password_hash('worker123').decode('utf-8'),
                full_name='Raj Kumar',
                phone='5555555555',
                role='worker'
            )
            db.session.add(worker1)
            db.session.flush()
            
            worker_profile = WorkerProfile(
                user_id=worker1.id,
                zone='Zone A',
                designation='Cleaning Worker',
                employee_id='WRK001',
                vehicle_number='MH-01-AB-1234'
            )
            db.session.add(worker_profile)
            print('✓ Sample worker created: worker1@example.com / worker123')
        
        # Create sample rewards
        rewards_data = [
            {
                'name': 'Eco-Friendly Dustbin', 
                'description': 'Durable and recyclable dustbin for your home.', 
                'points_required': 40, 
                'stock_quantity': 50,
                'image_url': 'https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&q=80&w=1000'
            },
            {
                'name': 'Indoor Plant', 
                'description': 'Air-purifying indoor plant to freshen up your space.', 
                'points_required': 80, 
                'stock_quantity': 50,
                'image_url': 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&q=80&w=1000'
            },
            {
                'name': 'Jute Shopping Bag', 
                'description': 'Stylish and reusable jute bag for daily shopping.', 
                'points_required': 100, 
                'stock_quantity': 100,
                'image_url': 'https://images.unsplash.com/photo-1615707739501-443b7132a76f?auto=format&fit=crop&q=80&w=1000'
            }
        ]
        
        for reward_data in rewards_data:
            if not Reward.query.filter_by(name=reward_data['name']).first():
                reward = Reward(**reward_data)
                db.session.add(reward)
                print(f'✓ Reward created: {reward_data["name"]}')
        
        db.session.commit()
        print('\n✓ Database initialized successfully!')
        print('\nSample Accounts:')
        print('  Admin: admin@example.com / admin123')
        print('  Citizen: citizen1@example.com / citizen123')
        print('  Officer: officer1@example.com / officer123')
        print('  Worker: worker1@example.com / worker123')

if __name__ == '__main__':
    init_db()

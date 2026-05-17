from app import app
from extensions import db, bcrypt
from models import User

with app.app_context():
    # Find existing admin
    admin = User.query.filter_by(email='admin@example.com').first()
    
    if admin:
        print(f"Found admin user: {admin.username}")
        # Reset password
        admin.password_hash = bcrypt.generate_password_hash('admin123').decode('utf-8')
        db.session.commit()
        print("Admin password reset to 'admin123'")
    else:
        print("Admin user not found. Creating new one.")
        admin = User(
            username='admin',
            email='admin@example.com',
            password_hash=bcrypt.generate_password_hash('admin123').decode('utf-8'),
            full_name='System Administrator',
            role='admin'
        )
        db.session.add(admin)
        db.session.commit()
        print("Admin user created: admin@example.com / admin123")

    # Verify
    user = User.query.filter_by(email='admin@example.com').first()
    if user and bcrypt.check_password_hash(user.password_hash, 'admin123'):
        print("VERIFICATION SUCCESSFUL: Password is correct.")
    else:
        print("VERIFICATION FAILED")

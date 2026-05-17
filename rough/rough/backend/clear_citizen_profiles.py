from app import app
from extensions import db
from models import CitizenProfile

with app.app_context():
    try:
        # Delete all rows from citizen_profiles
        num_deleted = db.session.query(CitizenProfile).delete()
        db.session.commit()
        print(f"Successfully deleted {num_deleted} records from citizen_profiles table.")
    except Exception as e:
        db.session.rollback()
        print(f"Error clearing table: {e}")

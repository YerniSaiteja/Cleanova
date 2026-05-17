"""Extensions module to avoid circular imports"""
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager

# Initialize extensions (will be initialized with app in app.py)
db = SQLAlchemy()
bcrypt = Bcrypt()
jwt = JWTManager()


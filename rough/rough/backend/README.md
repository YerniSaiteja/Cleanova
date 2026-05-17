# Flask Backend with SQLite Database

A Flask REST API backend with SQLite database supporting User and Admin authentication and management.

## Features

- **User Management**: Registration, login, profile management
- **Admin Management**: Admin creation, authentication, and management
- **Post System**: Create, read, update, delete posts with categories
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Different permissions for users and admins

## Database Models

- **User**: Regular users with profile information
- **Admin**: Administrators with role-based access
- **Post**: User-generated content
- **Category**: Categories for organizing posts

## Setup

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Initialize the database**:
   ```bash
   python init_db.py
   ```

3. **Run the application**:
   ```bash
   python app.py
   ```

The server will start on `http://localhost:5000`

## Default Admin Credentials

- **Email**: admin@example.com
- **Password**: admin123

⚠️ **Change these credentials in production!**

## API Endpoints

### Authentication (`/api/auth`)

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login
- `POST /api/auth/admin/login` - Admin login
- `GET /api/auth/me` - Get current authenticated user (requires JWT token)

### Users (`/api/users`)

- `GET /api/users` - Get all users (admin only)
- `GET /api/users/<id>` - Get a specific user
- `PUT /api/users/<id>` - Update a user
- `DELETE /api/users/<id>` - Delete a user (admin only)

### Admins (`/api/admin`)

- `GET /api/admin` - Get all admins (admin only)
- `POST /api/admin/create` - Create a new admin (admin only)
- `GET /api/admin/<id>` - Get a specific admin
- `PUT /api/admin/<id>` - Update an admin
- `DELETE /api/admin/<id>` - Delete an admin
- `GET /api/admin/stats` - Get dashboard statistics (admin only)

### Posts (`/api/posts`)

- `GET /api/posts` - Get all posts (published only for non-admins)
- `POST /api/posts` - Create a new post (users only)
- `GET /api/posts/<id>` - Get a specific post
- `PUT /api/posts/<id>` - Update a post
- `DELETE /api/posts/<id>` - Delete a post
- `GET /api/posts/categories` - Get all categories
- `POST /api/posts/categories` - Create a new category (admin only)

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your_token_here>
```

## Example API Usage

### Register a User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "password123",
    "full_name": "John Doe"
  }'
```

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Create a Post (with JWT token)

```bash
curl -X POST http://localhost:5000/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "title": "My First Post",
    "content": "This is the content of my post",
    "category_id": 1,
    "is_published": true
  }'
```

## Project Structure

```
backend/
├── app.py              # Main Flask application
├── models.py           # Database models
├── routes/             # Route blueprints
│   ├── __init__.py
│   ├── auth.py         # Authentication routes
│   ├── users.py        # User management routes
│   ├── admin.py        # Admin management routes
│   └── posts.py        # Post management routes
├── init_db.py          # Database initialization script
├── requirements.txt    # Python dependencies
└── database.db         # SQLite database (created automatically)
```

## Environment Variables

You can set these environment variables for production:

- `SECRET_KEY`: Flask secret key
- `JWT_SECRET_KEY`: JWT token secret key

## Notes

- The database file (`database.db`) will be created automatically when you run the app
- In production, use a more secure database like PostgreSQL
- Change default admin credentials before deploying
- Use environment variables for sensitive configuration


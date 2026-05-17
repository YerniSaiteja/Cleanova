import requests
import json

# 1. Login to get token
login_data = {
    "email": "admin@example.com",
    "password": "admin123"
}
response = requests.post('http://127.0.0.1:5000/api/auth/login', json=login_data)
print("Login:", response.status_code, response.text)
token = response.json().get('access_token')

# 2. Register a citizen
register_data = {
    "email": "testcit@example.com",
    "password": "pass",
    "full_name": "Test Cit",
    "username": "testcit"
}
response = requests.post('http://127.0.0.1:5000/api/auth/register', json=register_data)
print("Register:", response.status_code, response.text)

if response.status_code == 201:
    token = response.json().get('access_token')
elif response.status_code == 400 and 'already exists' in response.text:
    login_data_cit = {
        "email": "testcit@example.com",
        "password": "pass"
    }
    response = requests.post('http://127.0.0.1:5000/api/auth/login', json=login_data_cit)
    token = response.json().get('access_token')

# 3. Submit a report
headers = {
    'Authorization': f'Bearer {token}'
}
# We need to simulate a file upload
files = {
    'image': ('test.jpg', b'dummy content', 'image/jpeg')
}
data = {
    'location_latitude': 12.34,
    'location_longitude': 56.78
}
response = requests.post('http://127.0.0.1:5000/api/reports', headers=headers, files=files, data=data)
print("Submit Report:", response.status_code, response.text)

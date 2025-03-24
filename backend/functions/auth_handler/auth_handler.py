import json
import os
import boto3
import base64
import hmac
import hashlib
import time
import uuid
from urllib.parse import parse_qs

# In a real application, you would use Cognito
# For simplicity, we're using a basic auth mechanism

# These would be stored in environment variables or a secure parameter store
USERS = {
    "demo@example.com": {
        "password_hash": "5f4dcc3b5aa765d61d8327deb882cf99",  # 'password' in MD5
        "user_id": "user-123"
    }
}

def lambda_handler(event, context):
    """
    Simple authentication handler
    """
    try:
        body = json.loads(event.get('body', '{}'))
        
        # Check if this is a login or registration request
        if body.get('action') == 'login':
            return handle_login(body)
        elif body.get('action') == 'register':
            return handle_register(body)
        else:
            return {
                'statusCode': 400,
                'headers': get_cors_headers(),
                'body': json.dumps({'message': 'Invalid action specified'})
            }
    except Exception as e:
        print(f"Error in auth_handler: {str(e)}")
        return {
            'statusCode': 500,
            'headers': get_cors_headers(),
            'body': json.dumps({'message': 'Internal server error'})
        }

def handle_login(body):
    """
    Handle login requests
    """
    email = body.get('email', '').lower()
    password = body.get('password', '')
    
    if not email or not password:
        return {
            'statusCode': 400,
            'headers': get_cors_headers(),
            'body': json.dumps({'message': 'Email and password are required'})
        }
    
    user = USERS.get(email)
    if not user:
        return {
            'statusCode': 401,
            'headers': get_cors_headers(),
            'body': json.dumps({'message': 'Invalid credentials'})
        }
    
    # In a real app, you would use a proper password hashing mechanism
    password_hash = hashlib.md5(password.encode()).hexdigest()
    if password_hash != user['password_hash']:
        return {
            'statusCode': 401,
            'headers': get_cors_headers(),
            'body': json.dumps({'message': 'Invalid credentials'})
        }
    
    # Generate a simple token (in a real app, use JWT or other secure token mechanism)
    token = generate_token(user['user_id'])
    
    return {
        'statusCode': 200,
        'headers': get_cors_headers(),
        'body': json.dumps({
            'token': token,
            'userId': user['user_id'],
            'email': email
        })
    }

def handle_register(body):
    """
    Handle registration requests
    """
    email = body.get('email', '').lower()
    password = body.get('password', '')
    
    if not email or not password:
        return {
            'statusCode': 400,
            'headers': get_cors_headers(),
            'body': json.dumps({'message': 'Email and password are required'})
        }
    
    if email in USERS:
        return {
            'statusCode': 409,
            'headers': get_cors_headers(),
            'body': json.dumps({'message': 'User already exists'})
        }
    
    # In a real app, you would store this in DynamoDB or another database
    # and use a proper password hashing mechanism
    user_id = f"user-{uuid.uuid4()}"
    password_hash = hashlib.md5(password.encode()).hexdigest()
    
    USERS[email] = {
        'password_hash': password_hash,
        'user_id': user_id
    }
    
    token = generate_token(user_id)
    
    return {
        'statusCode': 201,
        'headers': get_cors_headers(),
        'body': json.dumps({
            'token': token,
            'userId': user_id,
            'email': email
        })
    }

def generate_token(user_id):
    """
    Generate a simple authentication token
    In a real app, use JWT or another secure token mechanism
    """
    timestamp = int(time.time())
    token_data = f"{user_id}:{timestamp}"
    # This would use a proper secret key in a real application
    signature = hmac.new(
        "SECRET_KEY".encode(),
        token_data.encode(),
        hashlib.sha256
    ).hexdigest()
    
    token = base64.b64encode(f"{token_data}:{signature}".encode()).decode()
    return token

def get_cors_headers():
    """
    Return CORS headers for all responses
    """
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'OPTIONS,POST',
        'Content-Type': 'application/json'
    }
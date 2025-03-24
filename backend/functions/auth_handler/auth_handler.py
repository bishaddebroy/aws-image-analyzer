import json
import os
import boto3
import time
from botocore.exceptions import ClientError

# Initialize Cognito client
cognito = boto3.client('cognito-idp')
USER_POOL_ID = os.environ.get('USER_POOL_ID')
CLIENT_ID = os.environ.get('CLIENT_ID')

def lambda_handler(event, context):
    """
    Authentication handler using Cognito
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
    Handle login requests using Cognito
    """
    email = body.get('email', '').lower()
    password = body.get('password', '')
    
    if not email or not password:
        return {
            'statusCode': 400,
            'headers': get_cors_headers(),
            'body': json.dumps({'message': 'Email and password are required'})
        }
    
    try:
        # Authenticate with Cognito
        response = cognito.initiate_auth(
            ClientId=CLIENT_ID,
            AuthFlow='USER_PASSWORD_AUTH',
            AuthParameters={
                'USERNAME': email,
                'PASSWORD': password
            }
        )
        
        # Extract tokens
        id_token = response['AuthenticationResult']['IdToken']
        access_token = response['AuthenticationResult']['AccessToken']
        refresh_token = response['AuthenticationResult']['RefreshToken']
        expires_in = response['AuthenticationResult']['ExpiresIn']
        
        # Get user attributes
        user_info = cognito.get_user(
            AccessToken=access_token
        )
        
        # Extract user ID from Cognito sub
        user_id = None
        for attr in user_info['UserAttributes']:
            if attr['Name'] == 'sub':
                user_id = attr['Value']
                break
        
        return {
            'statusCode': 200,
            'headers': get_cors_headers(),
            'body': json.dumps({
                'token': id_token,  # For backward compatibility
                'idToken': id_token,
                'accessToken': access_token,
                'refreshToken': refresh_token,
                'expiresIn': expires_in,
                'userId': user_id,
                'email': email
            })
        }
    except cognito.exceptions.NotAuthorizedException:
        return {
            'statusCode': 401,
            'headers': get_cors_headers(),
            'body': json.dumps({'message': 'Invalid credentials'})
        }
    except cognito.exceptions.UserNotFoundException:
        return {
            'statusCode': 401,
            'headers': get_cors_headers(),
            'body': json.dumps({'message': 'User not found'})
        }
    except Exception as e:
        print(f"Error during login: {str(e)}")
        return {
            'statusCode': 500,
            'headers': get_cors_headers(),
            'body': json.dumps({'message': 'Error during login'})
        }

def handle_register(body):
    """
    Handle registration requests using Cognito
    """
    email = body.get('email', '').lower()
    password = body.get('password', '')
    
    if not email or not password:
        return {
            'statusCode': 400,
            'headers': get_cors_headers(),
            'body': json.dumps({'message': 'Email and password are required'})
        }
    
    try:
        # Check if this is the demo account (for backward compatibility)
        if email == 'demo@example.com':
            return {
                'statusCode': 409,
                'headers': get_cors_headers(),
                'body': json.dumps({'message': 'This email is reserved for demo purposes. Please use a different email.'})
            }
        
        # Register user with Cognito
        response = cognito.sign_up(
            ClientId=CLIENT_ID,
            Username=email,
            Password=password,
            UserAttributes=[
                {
                    'Name': 'email',
                    'Value': email
                }
            ]
        )
        
        # Auto-confirm the user (for the demo app)
        # In a real app, you might want email verification
        cognito.admin_confirm_sign_up(
            UserPoolId=USER_POOL_ID,
            Username=email
        )
        
        # Login the user to get tokens
        login_response = cognito.initiate_auth(
            ClientId=CLIENT_ID,
            AuthFlow='USER_PASSWORD_AUTH',
            AuthParameters={
                'USERNAME': email,
                'PASSWORD': password
            }
        )
        
        # Extract tokens
        id_token = login_response['AuthenticationResult']['IdToken']
        access_token = login_response['AuthenticationResult']['AccessToken']
        refresh_token = login_response['AuthenticationResult']['RefreshToken']
        expires_in = login_response['AuthenticationResult']['ExpiresIn']
        
        # Get user attributes
        user_info = cognito.get_user(
            AccessToken=access_token
        )
        
        # Extract user ID from Cognito sub
        user_id = None
        for attr in user_info['UserAttributes']:
            if attr['Name'] == 'sub':
                user_id = attr['Value']
                break
        
        return {
            'statusCode': 201,
            'headers': get_cors_headers(),
            'body': json.dumps({
                'token': id_token,  # For backward compatibility
                'idToken': id_token,
                'accessToken': access_token,
                'refreshToken': refresh_token,
                'expiresIn': expires_in,
                'userId': user_id,
                'email': email
            })
        }
    except cognito.exceptions.UsernameExistsException:
        return {
            'statusCode': 409,
            'headers': get_cors_headers(),
            'body': json.dumps({'message': 'User already exists'})
        }
    except Exception as e:
        print(f"Error during registration: {str(e)}")
        return {
            'statusCode': 500,
            'headers': get_cors_headers(),
            'body': json.dumps({'message': 'Error during registration'})
        }

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
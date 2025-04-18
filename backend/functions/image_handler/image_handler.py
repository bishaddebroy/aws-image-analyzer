import json
import os
import boto3
import uuid
import time
import base64
from urllib.parse import unquote

# Initialize AWS clients
s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

# Get environment variables
RESULTS_TABLE = os.environ.get('RESULTS_TABLE')
IMAGE_BUCKET = os.environ.get('IMAGE_BUCKET')

def lambda_handler(event, context):
    """
    Handle CRUD operations for images
    """
    try:
        # Get HTTP method and path
        http_method = event.get('httpMethod', '')
        path = event.get('path', '')
        
        # Parse user ID from JWT token
        user_id = get_user_id(event)
        if not user_id:
            return {
                'statusCode': 401,
                'headers': get_cors_headers(),
                'body': json.dumps({'message': 'Unauthorized'})
            }
        
        # Route the request to the appropriate handler
        if http_method == 'GET' and path.endswith('/images'):
            return list_images(user_id)
        elif http_method == 'GET' and '/images/' in path and not path.endswith('/results'):
            image_id = event['pathParameters']['imageId']
            return get_image(user_id, image_id)
        elif http_method == 'DELETE' and '/images/' in path:
            image_id = event['pathParameters']['imageId']
            return delete_image(user_id, image_id)
        elif http_method == 'POST' and path.endswith('/upload-url'):
            return generate_presigned_url(user_id, event)
        elif http_method == 'GET' and path.endswith('/results'):
            image_id = event['pathParameters']['imageId']
            return get_image_results(user_id, image_id)
        else:
            return {
                'statusCode': 400,
                'headers': get_cors_headers(),
                'body': json.dumps({'message': 'Invalid request'})
            }
    except Exception as e:
        print(f"Error in image_handler: {str(e)}")
        return {
            'statusCode': 500,
            'headers': get_cors_headers(),
            'body': json.dumps({'message': 'Internal server error'})
        }

def list_images(user_id):
    """
    List all images for a user with robust error handling
    """
    try:
        print(f"Listing images for user: {user_id}")
        table = dynamodb.Table(RESULTS_TABLE)
        
        # Query DynamoDB for all images belonging to the user
        try:
            response = table.query(
                KeyConditionExpression="userId = :uid",
                ExpressionAttributeValues={
                    ":uid": user_id
                }
            )
            items = response.get('Items', [])
            print(f"Found {len(items)} items in DynamoDB for user {user_id}")
        except Exception as db_error:
            print(f"DynamoDB query error: {str(db_error)}")
            # Return empty list instead of failing
            return {
                'statusCode': 200,
                'headers': get_cors_headers(),
                'body': json.dumps({'images': []})
            }
        
        # Format the response
        images = []
        for item in items:
            try:
                # Add S3 URL for each image
                image_key = item.get('imageKey')
                if not image_key:
                    print(f"Item missing imageKey, skipping: {item}")
                    continue
                
                try:
                    image_url = s3.generate_presigned_url(
                        'get_object',
                        Params={
                            'Bucket': IMAGE_BUCKET,
                            'Key': image_key  # Make sure this is 'Key', not 'Name'
                        },
                        ExpiresIn=3600
                    )
                except Exception as url_error:
                    print(f"Error generating presigned URL: {str(url_error)}")
                    # Use a placeholder URL instead of failing
                    image_url = "#"
                
                images.append({
                    'imageId': item.get('imageId'),
                    'imageUrl': image_url,
                    'createdAt': item.get('createdAt', 0),
                    'status': item.get('status', 'pending'),
                    'fileName': item.get('fileName', 'unknown')
                })
            except Exception as item_error:
                print(f"Error processing image: {str(item_error)}")
                # Continue with other images
                continue
        
        # Sort images by creation date, newest first
        images.sort(key=lambda x: x.get('createdAt', 0), reverse=True)
        
        print(f"Returning {len(images)} images")
        return {
            'statusCode': 200,
            'headers': get_cors_headers(),
            'body': json.dumps({'images': images})
        }
    except Exception as e:
        print(f"Unexpected error in list_images: {str(e)}")
        # Always return 200 with empty list
        return {
            'statusCode': 200,
            'headers': get_cors_headers(),
            'body': json.dumps({'images': []})
        }

def get_image(user_id, image_id):
    """
    Get details for a specific image
    """
    table = dynamodb.Table(RESULTS_TABLE)
    
    # Get image details from DynamoDB
    response = table.get_item(
        Key={
            'userId': user_id,
            'imageId': image_id
        }
    )
    
    item = response.get('Item')
    if not item:
        return {
            'statusCode': 404,
            'headers': get_cors_headers(),
            'body': json.dumps({'message': 'Image not found'})
        }
    
    # Generate a pre-signed URL for the image
    image_key = item.get('imageKey')
    image_url = s3.generate_presigned_url(
        'get_object',
        Params={
            'Bucket': IMAGE_BUCKET,
            'Key': image_key
        },
        ExpiresIn=3600
    )
    
    # Format the response
    image_details = {
        'imageId': item.get('imageId'),
        'imageUrl': image_url,
        'createdAt': item.get('createdAt'),
        'status': item.get('status'),
        'fileName': item.get('fileName', 'unknown')
    }
    
    return {
        'statusCode': 200,
        'headers': get_cors_headers(),
        'body': json.dumps(image_details)
    }

def delete_image(user_id, image_id):
    """
    Delete an image and its analysis results
    """
    table = dynamodb.Table(RESULTS_TABLE)
    
    # First, get the image details to find the S3 key
    response = table.get_item(
        Key={
            'userId': user_id,
            'imageId': image_id
        }
    )
    
    item = response.get('Item')
    if not item:
        return {
            'statusCode': 404,
            'headers': get_cors_headers(),
            'body': json.dumps({'message': 'Image not found'})
        }
    
    # Delete the image from S3
    image_key = item.get('imageKey')
    s3.delete_object(
        Bucket=IMAGE_BUCKET,
        Key=image_key
    )
    
    # Delete the record from DynamoDB
    table.delete_item(
        Key={
            'userId': user_id,
            'imageId': image_id
        }
    )
    
    return {
        'statusCode': 200,
        'headers': get_cors_headers(),
        'body': json.dumps({'message': 'Image deleted successfully'})
    }

def generate_presigned_url(user_id, event):
    """
    Generate a pre-signed URL for uploading an image to S3
    """
    try:
        body = json.loads(event.get('body', '{}'))
        file_name = body.get('fileName', '')
        
        if not file_name:
            return {
                'statusCode': 400,
                'headers': get_cors_headers(),
                'body': json.dumps({'message': 'fileName is required'})
            }
        
        # Generate a unique image ID and S3 key
        image_id = str(uuid.uuid4())
        file_extension = os.path.splitext(file_name)[1].lower()
        
        # For security, restrict to image file types
        allowed_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp']
        if file_extension not in allowed_extensions:
            return {
                'statusCode': 400,
                'headers': get_cors_headers(),
                'body': json.dumps({'message': 'Invalid file type'})
            }
        
        # Create S3 key with user ID and image ID to ensure uniqueness
        s3_key = f"{user_id}/{image_id}{file_extension}"
        
        # Generate a pre-signed URL for uploading
        presigned_url = s3.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': IMAGE_BUCKET,
                'Key': s3_key,
                'ContentType': f"image/{file_extension[1:]}"
            },
            ExpiresIn=300  # URL expires in 5 minutes
        )
        
        # Create a record in DynamoDB
        table = dynamodb.Table(RESULTS_TABLE)
        timestamp = int(time.time())
        
        table.put_item(
            Item={
                'userId': user_id,
                'imageId': image_id,
                'imageKey': s3_key,
                'fileName': file_name,
                'createdAt': timestamp,
                'status': 'pending',
                'results': {}
            }
        )
        
        return {
            'statusCode': 200,
            'headers': get_cors_headers(),
            'body': json.dumps({
                'uploadUrl': presigned_url,
                'imageId': image_id,
                'imageKey': s3_key
            })
        }
    except Exception as e:
        print(f"Error generating presigned URL: {str(e)}")
        return {
            'statusCode': 500,
            'headers': get_cors_headers(),
            'body': json.dumps({'message': 'Error generating upload URL'})
        }

def get_image_results(user_id, image_id):
    """
    Get analysis results for a specific image
    """
    table = dynamodb.Table(RESULTS_TABLE)
    
    # Get image details from DynamoDB
    response = table.get_item(
        Key={
            'userId': user_id,
            'imageId': image_id
        }
    )
    
    item = response.get('Item')
    if not item:
        return {
            'statusCode': 404,
            'headers': get_cors_headers(),
            'body': json.dumps({'message': 'Image not found'})
        }
    
    # Generate a pre-signed URL for the image
    image_key = item.get('imageKey')
    image_url = s3.generate_presigned_url(
        'get_object',
        Params={
            'Bucket': IMAGE_BUCKET,
            'Key': image_key
        },
        ExpiresIn=3600
    )
    
    # Format the response
    results = {
        'imageId': item.get('imageId'),
        'imageUrl': image_url,
        'createdAt': item.get('createdAt'),
        'status': item.get('status'),
        'fileName': item.get('fileName', 'unknown'),
        'results': item.get('results', {})
    }
    
    return {
        'statusCode': 200,
        'headers': get_cors_headers(),
        'body': json.dumps(results)
    }

def get_user_id(event):
    """
    Extract user ID from Cognito JWT token or query parameter
    """
    # For backwards compatibility and testing, still allow query parameter
    query_params = event.get('queryStringParameters') or {}
    user_id = query_params.get('userId')
    if user_id:
        return user_id
    
    # Get the Authorization header
    headers = event.get('headers') or {}
    auth_header = headers.get('Authorization') or headers.get('authorization')
    
    if not auth_header:
        return None
    
    try:
        # Remove 'Bearer ' prefix if present
        if auth_header.startswith('Bearer '):
            auth_header = auth_header[7:]

        # Parse JWT token (simplified, in a real app use proper JWT library)
        # This assumes the Authorization header contains the JWT directly
        # In a real production app, you would verify the JWT signature
        token_parts = auth_header.split('.')
        if len(token_parts) != 3:
            return None
        
        # Decode the payload
        payload_b64 = token_parts[1]
        # Add padding if needed
        payload_b64 += '=' * ((4 - len(payload_b64) % 4) % 4)
        # Convert to standard base64
        payload_b64 = payload_b64.replace('-', '+').replace('_', '/')
        
        # Decode and parse JSON
        payload = json.loads(base64.b64decode(payload_b64).decode('utf-8'))
        
        # Extract sub (user ID) from token
        return payload.get('sub')
    except Exception as e:
        print(f"Error parsing token: {str(e)}")
        return None

def get_cors_headers():
    """
    Return CORS headers for all responses
    """
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'OPTIONS,GET,POST,DELETE',
        'Content-Type': 'application/json'
    }
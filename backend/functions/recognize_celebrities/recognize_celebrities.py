import json
import os
import boto3
import time

# Initialize AWS clients
s3 = boto3.client('s3')
rekognition = boto3.client('rekognition')

# Get environment variables
IMAGE_BUCKET = os.environ.get('IMAGE_BUCKET')

def lambda_handler(event, context):
    """
    Recognize celebrities in an image using Amazon Rekognition
    """
    try:
        # Get the image key from the event
        image_key = event.get('imageKey')
        if not image_key:
            raise ValueError("No image key provided")
        
        print(f"Recognizing celebrities for image: {image_key}")
        
        # Call Rekognition to recognize celebrities
        response = rekognition.recognize_celebrities(
            Image={
                'S3Object': {
                    'Bucket': IMAGE_BUCKET,
                    'Name': image_key
                }
            }
        )
        
        # Process and format the results
        celebrities = []
        for celebrity in response.get('CelebrityFaces', []):
            celebrity_info = {
                'name': celebrity.get('Name'),
                'confidence': round(celebrity.get('MatchConfidence'), 2),
                'boundingBox': celebrity.get('Face', {}).get('BoundingBox', {})
            }
            
            # Add URLs if available
            urls = celebrity.get('Urls', [])
            if urls:
                celebrity_info['urls'] = urls
            
            celebrities.append(celebrity_info)
        
        # Get information about unrecognized faces
        unrecognized_faces = []
        for face in response.get('UnrecognizedFaces', []):
            unrecognized_faces.append({
                'boundingBox': face.get('BoundingBox', {}),
                'confidence': round(face.get('Confidence', 0), 2)
            })
        
        # Sort celebrities by confidence
        celebrities.sort(key=lambda x: x.get('confidence', 0), reverse=True)
        
        result = {
            'timestamp': int(time.time()),
            'celebrityCount': len(celebrities),
            'celebrities': celebrities,
            'unrecognizedFaces': unrecognized_faces
        }
        
        print(f"Recognized {len(celebrities)} celebrities")
        
        return {
            'imageKey': image_key,
            'userId': event.get('userId'),
            'celebrities': result
        }
    except Exception as e:
        print(f"Error recognizing celebrities: {str(e)}")
        raise
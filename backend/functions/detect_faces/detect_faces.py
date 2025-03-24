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
    Detect and analyze faces in an image using Amazon Rekognition
    """
    try:
        # Get the image key from the event
        image_key = event.get('imageKey')
        if not image_key:
            raise ValueError("No image key provided")
        
        print(f"Detecting faces for image: {image_key}")
        
        # Call Rekognition to detect faces
        response = rekognition.detect_faces(
            Image={
                'S3Object': {
                    'Bucket': IMAGE_BUCKET,
                    'Name': image_key
                }
            },
            Attributes=['ALL']  # Get all face attributes
        )
        
        # Process and format the results
        faces = []
        for face in response.get('FaceDetails', []):
            # Extract main face properties
            face_info = {
                'confidence': round(face.get('Confidence'), 2),
                'boundingBox': face.get('BoundingBox', {}),
                'ageRange': face.get('AgeRange', {}),
                'gender': {
                    'value': face.get('Gender', {}).get('Value'),
                    'confidence': round(face.get('Gender', {}).get('Confidence', 0), 2)
                },
                'emotions': []
            }
            
            # Extract emotion information
            emotions = face.get('Emotions', [])
            for emotion in emotions:
                if emotion.get('Confidence') > 10:  # Only include emotions with reasonable confidence
                    face_info['emotions'].append({
                        'type': emotion.get('Type'),
                        'confidence': round(emotion.get('Confidence'), 2)
                    })
            
            # Sort emotions by confidence
            face_info['emotions'].sort(key=lambda x: x.get('confidence', 0), reverse=True)
            
            # Extract facial features (smile, eyeglasses, beard, etc.)
            for feature in ['Smile', 'Eyeglasses', 'Sunglasses', 'Beard', 'Mustache', 'EyesOpen', 'MouthOpen']:
                if feature in face:
                    face_info[feature.lower()] = {
                        'value': face.get(feature, {}).get('Value', False),
                        'confidence': round(face.get(feature, {}).get('Confidence', 0), 2)
                    }
            
            # Extract quality information
            if 'Quality' in face:
                face_info['quality'] = {
                    'brightness': round(face.get('Quality', {}).get('Brightness', 0), 2),
                    'sharpness': round(face.get('Quality', {}).get('Sharpness', 0), 2)
                }
            
            # Extract pose information
            if 'Pose' in face:
                face_info['pose'] = {
                    'roll': round(face.get('Pose', {}).get('Roll', 0), 2),
                    'yaw': round(face.get('Pose', {}).get('Yaw', 0), 2),
                    'pitch': round(face.get('Pose', {}).get('Pitch', 0), 2)
                }
            
            faces.append(face_info)
        
        # Sort faces by confidence
        faces.sort(key=lambda x: x.get('confidence', 0), reverse=True)
        
        result = {
            'timestamp': int(time.time()),
            'faceCount': len(faces),
            'faces': faces
        }
        
        print(f"Detected {len(faces)} faces")
        
        return {
            'imageKey': image_key,
            'userId': event.get('userId'),
            'faces': result
        }
    except Exception as e:
        print(f"Error detecting faces: {str(e)}")
        raise
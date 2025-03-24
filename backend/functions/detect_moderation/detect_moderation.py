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
    Detect moderation labels in an image using Amazon Rekognition
    """
    try:
        # Get the image key from the event
        image_key = event.get('imageKey')
        if not image_key:
            raise ValueError("No image key provided")
        
        print(f"Detecting moderation labels for image: {image_key}")
        
        # Call Rekognition to detect moderation labels
        response = rekognition.detect_moderation_labels(
            Image={
                'S3Object': {
                    'Bucket': IMAGE_BUCKET,
                    'Name': image_key
                }
            },
            MinConfidence=50  # Only return labels with at least 50% confidence
        )
        
        # Process and format the results
        moderation_labels = []
        for label in response.get('ModerationLabels', []):
            label_info = {
                'name': label.get('Name'),
                'parentName': label.get('ParentName'),
                'confidence': round(label.get('Confidence'), 2)
            }
            moderation_labels.append(label_info)
        
        # Sort labels by confidence (highest first)
        moderation_labels.sort(key=lambda x: x.get('confidence', 0), reverse=True)
        
        # Determine overall safety rating
        is_safe = len(moderation_labels) == 0
        
        result = {
            'timestamp': int(time.time()),
            'isSafe': is_safe,
            'moderationLabels': moderation_labels
        }
        
        print(f"Detected {len(moderation_labels)} moderation labels")
        
        return {
            'imageKey': image_key,
            'userId': event.get('userId'),
            'moderation': result
        }
    except Exception as e:
        print(f"Error detecting moderation labels: {str(e)}")
        raise
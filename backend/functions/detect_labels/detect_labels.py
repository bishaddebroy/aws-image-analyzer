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
    Detect labels (objects and scenes) in an image using Amazon Rekognition
    """
    try:
        # Get the image key from the event
        image_key = event.get('imageKey')
        if not image_key:
            raise ValueError("No image key provided")
        
        print(f"Detecting labels for image: {image_key}")
        
        # Call Rekognition to detect labels
        response = rekognition.detect_labels(
            Image={
                'S3Object': {
                    'Bucket': IMAGE_BUCKET,
                    'Name': image_key
                }
            },
            MaxLabels=50,
            MinConfidence=70  # Only return labels with at least 70% confidence
        )
        
        # Process and format the results
        labels = []
        for label in response.get('Labels', []):
            label_info = {
                'name': label.get('Name'),
                'confidence': round(label.get('Confidence'), 2),
                'parents': [parent.get('Name') for parent in label.get('Parents', [])]
            }
            
            # Add bounding boxes if available
            instances = label.get('Instances', [])
            if instances:
                label_info['instances'] = []
                for instance in instances:
                    box = instance.get('BoundingBox', {})
                    label_info['instances'].append({
                        'confidence': round(instance.get('Confidence'), 2),
                        'boundingBox': {
                            'width': box.get('Width'),
                            'height': box.get('Height'),
                            'left': box.get('Left'),
                            'top': box.get('Top')
                        }
                    })
            
            labels.append(label_info)
        
        # Sort labels by confidence (highest first)
        labels.sort(key=lambda x: x.get('confidence', 0), reverse=True)
        
        result = {
            'timestamp': int(time.time()),
            'labels': labels
        }
        
        print(f"Detected {len(labels)} labels")
        
        return {
            'imageKey': image_key,
            'userId': event.get('userId'),
            'labels': result
        }
    except Exception as e:
        print(f"Error detecting labels: {str(e)}")
        raise
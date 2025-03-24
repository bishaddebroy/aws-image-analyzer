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
    Detect and extract text from an image using Amazon Rekognition
    """
    try:
        # Get the image key from the event
        image_key = event.get('imageKey')
        if not image_key:
            raise ValueError("No image key provided")
        
        print(f"Detecting text for image: {image_key}")
        
        # Call Rekognition to detect text
        response = rekognition.detect_text(
            Image={
                'S3Object': {
                    'Bucket': IMAGE_BUCKET,
                    'Name': image_key
                }
            }
        )
        
        # Process and format the results
        text_detections = []
        
        # Extract text detections, separating words and lines
        lines = []
        words = []
        
        for detection in response.get('TextDetections', []):
            detection_info = {
                'detectedText': detection.get('DetectedText'),
                'confidence': round(detection.get('Confidence'), 2),
                'boundingBox': detection.get('Geometry', {}).get('BoundingBox', {})
            }
            
            # Separate lines and words
            if detection.get('Type') == 'LINE':
                lines.append(detection_info)
            elif detection.get('Type') == 'WORD':
                words.append(detection_info)
        
        # Sort by confidence
        lines.sort(key=lambda x: x.get('confidence', 0), reverse=True)
        words.sort(key=lambda x: x.get('confidence', 0), reverse=True)
        
        # Combine all text lines
        combined_text = ' '.join([line.get('detectedText', '') for line in lines])
        
        result = {
            'timestamp': int(time.time()),
            'hasText': len(lines) > 0,
            'combinedText': combined_text,
            'lines': lines,
            'words': words
        }
        
        print(f"Detected {len(lines)} text lines and {len(words)} words")
        
        return {
            'imageKey': image_key,
            'userId': event.get('userId'),
            'text': result
        }
    except Exception as e:
        print(f"Error detecting text: {str(e)}")
        raise
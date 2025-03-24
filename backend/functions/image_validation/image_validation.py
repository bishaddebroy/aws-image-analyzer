import json
import os
import time

def lambda_handler(event, context):
    """
    Lightweight validation of image parameters before processing
    """
    try:
        # Get the image key from the event
        image_key = event.get('imageKey')
        user_id = event.get('userId')
        
        print(f"Validating image: {image_key}")
        
        if not image_key or not user_id:
            return {
                'imageKey': image_key,
                'userId': user_id,
                'valid': False,
                'validationMessage': 'Missing required parameters'
            }
        
        # Simple validation - check file extension
        valid_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp']
        file_extension = os.path.splitext(image_key)[1].lower()
        is_valid = file_extension in valid_extensions
        
        result = {
            'imageKey': image_key,
            'userId': user_id,
            'valid': is_valid,
            'timestamp': int(time.time()),
            'validationMessage': 'Image appears valid' if is_valid else 'Invalid image format'
        }
        
        print(f"Validation result: {result}")
        return result
        
    except Exception as e:
        print(f"Error validating image: {str(e)}")
        return {
            'imageKey': event.get('imageKey', ''),
            'userId': event.get('userId', ''),
            'valid': False,
            'timestamp': int(time.time()),
            'validationMessage': f'Error during validation: {str(e)}'
        }
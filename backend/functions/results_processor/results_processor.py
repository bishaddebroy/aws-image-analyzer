import decimal
import json
import os
import boto3
import time

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')

# Get environment variables
RESULTS_TABLE = os.environ.get('RESULTS_TABLE')

def convert_floats_to_decimals(obj):
    """Convert all floating point numbers to Decimal for DynamoDB"""
    if isinstance(obj, float):
        return decimal.Decimal(str(obj))
    elif isinstance(obj, dict):
        return {k: convert_floats_to_decimals(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_floats_to_decimals(i) for i in obj]
    else:
        return obj

def lambda_handler(event, context):
    """
    Aggregate and store results from all image analysis steps
    """
    try:
        # Get user ID and image ID from the event
        user_id = event.get('userId')
        image_id = event.get('imageId')
        image_key = event.get('imageKey')
        
        if not user_id or not image_key:
            raise ValueError("Missing required parameters (userId or imageKey)")
        
        # Extract the image ID from the key if not provided explicitly
        if not image_id:
            key_parts = image_key.split('/')
            if len(key_parts) >= 2:
                image_id = os.path.splitext(key_parts[1])[0]
            else:
                raise ValueError("Could not determine image ID from key")
        
        print(f"Processing results for image: {image_id}")
        
        # Extract results from each analysis step
        results = {}
        
        # Check for label detection results
        if 'labels' in event:
            results['labels'] = event['labels'].get('labels', {})
        
        # Check for moderation analysis results
        if 'moderation' in event:
            results['moderation'] = event['moderation'].get('moderation', {})
        
        # Check for face detection results
        if 'faces' in event:
            results['faces'] = event['faces'].get('faces', {})
        
        # Check for celebrity recognition results
        if 'celebrities' in event:
            results['celebrities'] = event['celebrities'].get('celebrities', {})
        
        # Check for text detection results
        if 'text' in event:
            results['text'] = event['text'].get('text', {})
        
        # Summarize the results
        summary = generate_summary(results)
        results['summary'] = summary
        
        # Store results in DynamoDB
        table = dynamodb.Table(RESULTS_TABLE)

        # Convert all float values to Decimal for DynamoDB
        results_for_dynamo = convert_floats_to_decimals(results)
        
        response = table.update_item(
            Key={
                'userId': user_id,
                'imageId': image_id
            },
            UpdateExpression="SET #results = :results, #status = :status, #updatedAt = :updatedAt",
            ExpressionAttributeNames={
                '#results': 'results',
                '#status': 'status',
                '#updatedAt': 'updatedAt'
            },
            ExpressionAttributeValues={
                ':results': results_for_dynamo,
                ':status': 'completed',
                ':updatedAt': int(time.time())
            },
            ReturnValues="UPDATED_NEW"
        )
        
        print(f"Stored results for image {image_id}: {response}")
        
        return {
            'userId': user_id,
            'imageId': image_id,
            'imageKey': image_key,
            'status': 'completed',
            'summary': summary
        }
    except Exception as e:
        print(f"Error processing results: {str(e)}")
        
        # Update status to 'failed' in DynamoDB if possible
        try:
            if user_id and image_id:
                table = dynamodb.Table(RESULTS_TABLE)
                table.update_item(
                    Key={
                        'userId': user_id,
                        'imageId': image_id
                    },
                    UpdateExpression="SET #status = :status, #error = :error, #updatedAt = :updatedAt",
                    ExpressionAttributeNames={
                        '#status': 'status',
                        '#error': 'error',
                        '#updatedAt': 'updatedAt'
                    },
                    ExpressionAttributeValues={
                        ':status': 'failed',
                        ':error': str(e),
                        ':updatedAt': int(time.time())
                    }
                )
        except Exception as update_error:
            print(f"Error updating failure status: {str(update_error)}")
        
        raise

def generate_summary(results):
    """
    Generate a summary of the analysis results
    """
    summary = {}
    
    # Summarize labels
    if 'labels' in results:
        labels_data = results['labels']
        top_labels = []
        
        if 'labels' in labels_data and isinstance(labels_data['labels'], list):
            # Get top 5 labels
            for label in labels_data['labels'][:5]:
                top_labels.append({
                    'name': label.get('name'),
                    'confidence': label.get('confidence')
                })
        
        summary['topLabels'] = top_labels
    
    # Summarize moderation
    if 'moderation' in results:
        moderation_data = results['moderation']
        summary['isSafe'] = moderation_data.get('isSafe', True)
        
        if not summary['isSafe'] and 'moderationLabels' in moderation_data:
            summary['moderationIssues'] = []
            for label in moderation_data['moderationLabels'][:3]:  # Top 3 moderation issues
                summary['moderationIssues'].append({
                    'name': label.get('name'),
                    'confidence': label.get('confidence')
                })
    
    # Summarize faces
    if 'faces' in results:
        faces_data = results['faces']
        summary['faceCount'] = faces_data.get('faceCount', 0)
        
        if summary['faceCount'] > 0 and 'faces' in faces_data:
            # Get main emotion of primary face
            primary_face = faces_data['faces'][0]
            emotions = primary_face.get('emotions', [])
            
            if emotions:
                summary['primaryEmotion'] = emotions[0].get('type')
            
            # Include age range of primary face
            if 'ageRange' in primary_face:
                summary['ageRange'] = primary_face['ageRange']
    
    # Summarize celebrities
    if 'celebrities' in results:
        celebrities_data = results['celebrities']
        summary['celebrityCount'] = celebrities_data.get('celebrityCount', 0)
        
        if summary['celebrityCount'] > 0 and 'celebrities' in celebrities_data:
            summary['recognizedCelebrities'] = []
            for celebrity in celebrities_data['celebrities'][:3]:  # Top 3 celebrities
                summary['recognizedCelebrities'].append({
                    'name': celebrity.get('name'),
                    'confidence': celebrity.get('confidence')
                })
    
    # Summarize text
    if 'text' in results:
        text_data = results['text']
        summary['hasText'] = text_data.get('hasText', False)
        
        if summary['hasText']:
            # Include a snippet of the text (first 100 characters)
            combined_text = text_data.get('combinedText', '')
            if combined_text:
                summary['textSnippet'] = combined_text[:100] + ('...' if len(combined_text) > 100 else '')
    
    return summary
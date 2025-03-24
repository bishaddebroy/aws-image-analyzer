import json
import os
import boto3
import urllib.parse
import time

# Initialize AWS clients
s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
step_functions = boto3.client('stepfunctions')

# Get environment variables
RESULTS_TABLE = os.environ.get('RESULTS_TABLE')
# STATE_MACHINE_ARN will be set by the custom resource post-deployment

def lambda_handler(event, context):
    """
    Triggered by S3 upload event, starts the image processing workflow
    """
    try:
        # Get the S3 bucket and key from the event
        bucket = event['Records'][0]['s3']['bucket']['name']
        key = urllib.parse.unquote_plus(event['Records'][0]['s3']['object']['key'])
        
        print(f"Processing new image upload: {bucket}/{key}")
        
        # Extract user ID and image ID from the key
        # Key format is: {userId}/{imageId}.{extension}
        key_parts = key.split('/')
        if len(key_parts) < 2:
            print(f"Invalid key format: {key}")
            return {
                'statusCode': 400,
                'body': json.dumps({'message': 'Invalid key format'})
            }
        
        user_id = key_parts[0]
        image_id = os.path.splitext(key_parts[1])[0]
        
        # Update DynamoDB status to 'processing'
        update_image_status(user_id, image_id, 'processing')
        
        # Get STATE_MACHINE_ARN - it might be updated post-deployment
        state_machine_arn = os.environ.get('STATE_MACHINE_ARN')
        if not state_machine_arn:
            print("STATE_MACHINE_ARN environment variable not set. Using placeholder value.")
            # Just update status, don't try to process 
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'Image received, but processing not yet available',
                    'userId': user_id,
                    'imageId': image_id,
                    'imageKey': key
                })
            }
        
        # Start the Step Functions workflow
        response = step_functions.start_execution(
            stateMachineArn=state_machine_arn,
            name=f"image-processing-{image_id}-{int(time.time())}",
            input=json.dumps({
                'userId': user_id,
                'imageId': image_id,
                'imageKey': key,
                'bucket': bucket
            })
        )
        
        print(f"Started Step Functions execution: {response['executionArn']}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Image processing started',
                'executionArn': response['executionArn']
            })
        }
    except Exception as e:
        print(f"Error in workflow_trigger: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'message': 'Error starting image processing'})
        }

def update_image_status(user_id, image_id, status):
    """
    Update the image status in DynamoDB
    """
    try:
        table = dynamodb.Table(RESULTS_TABLE)
        
        response = table.update_item(
            Key={
                'userId': user_id,
                'imageId': image_id
            },
            UpdateExpression="SET #status = :status",
            ExpressionAttributeNames={
                '#status': 'status'
            },
            ExpressionAttributeValues={
                ':status': status
            },
            ReturnValues="UPDATED_NEW"
        )
        
        print(f"Updated status to '{status}' for image {image_id}: {response}")
        return True
    except Exception as e:
        print(f"Error updating image status: {str(e)}")
        return False
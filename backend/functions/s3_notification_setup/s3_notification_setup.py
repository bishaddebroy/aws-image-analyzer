import boto3
import cfnresponse
import os
import json

def lambda_handler(event, context):
    """
    Custom resource handler to set up S3 notifications and update Lambda environment
    """
    # Initialize clients
    s3 = boto3.client('s3')
    lambda_client = boto3.client('lambda')
    
    # Get resource properties
    props = event.get('ResourceProperties', {})
    bucket_name = props.get('BucketName')
    function_arn = props.get('FunctionArn')
    state_machine_arn = props.get('StateMachineArn')
    
    try:
        # Handle Create/Update events
        if event['RequestType'] in ['Create', 'Update']:
            # 1. Update workflow trigger function environment
            lambda_client.update_function_configuration(
                FunctionName=function_arn,
                Environment={
                    'Variables': {
                        'STATE_MACHINE_ARN': state_machine_arn,
                        'RESULTS_TABLE': os.environ.get('RESULTS_TABLE', '')
                    }
                }
            )
            
            # 2. Configure S3 bucket notification
            s3.put_bucket_notification_configuration(
                Bucket=bucket_name,
                NotificationConfiguration={
                    'LambdaFunctionConfigurations': [
                        {
                            'Events': ['s3:ObjectCreated:*'],
                            'LambdaFunctionArn': function_arn
                        }
                    ]
                }
            )
            
            cfnresponse.send(event, context, cfnresponse.SUCCESS, {
                'Message': f'Successfully configured notifications for bucket {bucket_name}'
            })
        
        # Handle Delete events
        elif event['RequestType'] == 'Delete':
            # Remove bucket notification
            try:
                s3.put_bucket_notification_configuration(
                    Bucket=bucket_name,
                    NotificationConfiguration={}
                )
            except Exception as e:
                print(f"Error removing notification (bucket may already be deleted): {str(e)}")
            
            cfnresponse.send(event, context, cfnresponse.SUCCESS, {
                'Message': f'Successfully removed notifications for bucket {bucket_name}'
            })
    
    except Exception as e:
        print(f"Error: {str(e)}")
        cfnresponse.send(event, context, cfnresponse.FAILED, {
            'Message': f'Error configuring notifications: {str(e)}'
        })
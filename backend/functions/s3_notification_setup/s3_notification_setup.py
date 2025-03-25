import boto3
import cfnresponse
import os
import json
import time

def lambda_handler(event, context):
    """
    Custom resource handler to set up S3 notifications and update Lambda environment
    """
    print(f"Custom resource event received: {json.dumps(event)}")
    
    # Initialize clients
    s3 = boto3.client('s3')
    lambda_client = boto3.client('lambda')
    
    # Get resource properties
    props = event.get('ResourceProperties', {})
    bucket_name = props.get('BucketName')
    function_arn = props.get('FunctionArn')
    state_machine_arn = props.get('StateMachineArn')
    
    print(f"Properties: bucket={bucket_name}, function={function_arn}, stateMachine={state_machine_arn}")
    
    # Always send a response, even in case of failure
    try:
        # Handle Create/Update events
        if event['RequestType'] in ['Create', 'Update']:
            print("Processing Create/Update request")
            
            try:
                # Add small delay to ensure other resources are fully available
                print("Waiting briefly for resources to be fully available...")
                time.sleep(5)
                
                # 1. Update workflow trigger function environment
                print(f"Updating Lambda function environment: {function_arn}")
                lambda_client.update_function_configuration(
                    FunctionName=function_arn,
                    Environment={
                        'Variables': {
                            'STATE_MACHINE_ARN': state_machine_arn,
                            'RESULTS_TABLE': os.environ.get('RESULTS_TABLE', '')
                        }
                    }
                )
                print("Lambda function environment updated successfully")
                
                # 2. Configure S3 bucket notification
                print(f"Configuring S3 bucket notification for bucket: {bucket_name}")
                
                # Get Lambda name from ARN to add permission
                lambda_name = function_arn.split(':')[-1]
                
                # Add Lambda permission for S3 to invoke it
                try:
                    print(f"Adding permission for S3 to invoke Lambda: {lambda_name}")
                    lambda_client.add_permission(
                        FunctionName=lambda_name,
                        StatementId=f'S3InvokeFunction-{int(time.time())}',
                        Action='lambda:InvokeFunction',
                        Principal='s3.amazonaws.com',
                        SourceArn=f'arn:aws:s3:::{bucket_name}'
                    )
                    print("Lambda permission added successfully")
                except lambda_client.exceptions.ResourceConflictException:
                    print("Lambda permission already exists - continuing")
                except Exception as perm_error:
                    print(f"Error adding Lambda permission: {str(perm_error)}")
                
                # Configure S3 notification
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
                print("S3 bucket notification configured successfully")
                
                response_data = {
                    'Message': f'Successfully configured notifications for bucket {bucket_name}',
                    'BucketName': bucket_name,
                    'LambdaFunction': function_arn
                }
                print(f"Sending SUCCESS response: {json.dumps(response_data)}")
                cfnresponse.send(event, context, cfnresponse.SUCCESS, response_data)
                return
                
            except Exception as setup_error:
                error_message = str(setup_error)
                print(f"Error during setup: {error_message}")
                cfnresponse.send(event, context, cfnresponse.FAILED, {
                    'Message': f'Error configuring resources: {error_message}'
                })
                return
                
        # Handle Delete events
        elif event['RequestType'] == 'Delete':
            print("Processing Delete request")
            try:
                # Clean up S3 notification configuration
                print(f"Removing S3 notification configuration from bucket: {bucket_name}")
                s3.put_bucket_notification_configuration(
                    Bucket=bucket_name,
                    NotificationConfiguration={}
                )
                print("S3 notification configuration removed successfully")
            except Exception as delete_error:
                print(f"Error removing S3 notification (continuing anyway): {str(delete_error)}")
            
            # Always send success for Delete operations
            print("Sending SUCCESS response for Delete")
            cfnresponse.send(event, context, cfnresponse.SUCCESS, {
                'Message': f'Successfully processed delete request for bucket {bucket_name}'
            })
            return
            
    except Exception as outer_error:
        error_message = str(outer_error)
        print(f"Outer exception: {error_message}")
        # Make one last attempt to send a response
        try:
            cfnresponse.send(event, context, cfnresponse.FAILED, {
                'Message': f'Failed: {error_message}'
            })
        except Exception as response_error:
            print(f"Failed to send response: {str(response_error)}")
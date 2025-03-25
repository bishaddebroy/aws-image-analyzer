# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

import json
import urllib.request
import logging

# Setup logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

SUCCESS = "SUCCESS"
FAILED = "FAILED"

def send(event, context, responseStatus, responseData, physicalResourceId=None, noEcho=False, reason=None):
    """
    Send a response to CloudFormation regarding the success or failure of a custom resource deployment
    """
    responseUrl = event['ResponseURL']

    logger.info(f"ResponseURL: {responseUrl}")

    responseBody = {
        'Status': responseStatus,
        'Reason': reason or (f'See the details in CloudWatch Log Stream: {context.log_stream_name}'),
        'PhysicalResourceId': physicalResourceId or context.log_stream_name,
        'StackId': event['StackId'],
        'RequestId': event['RequestId'],
        'LogicalResourceId': event['LogicalResourceId'],
        'NoEcho': noEcho,
        'Data': responseData
    }

    json_response = json.dumps(responseBody)
    logger.info(f"Response body: {json_response}")
    
    headers = {
        'Content-Type': 'application/json',
        'Content-Length': str(len(json_response))
    }

    try:
        req = urllib.request.Request(responseUrl, json_response.encode('utf-8'), headers, method='PUT')
        with urllib.request.urlopen(req) as response:
            logger.info(f"Status code: {response.getcode()}")
            logger.info(f"Response: {response.read().decode('utf-8')}")
        logger.info("CloudFormation successfully sent response")
        return True
    except Exception as e:
        logger.error(f"send(..) failed executing request: {str(e)}")
        return False
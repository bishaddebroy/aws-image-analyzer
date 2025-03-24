# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

import json
import urllib.request

SUCCESS = "SUCCESS"
FAILED = "FAILED"

def send(event, context, responseStatus, responseData, physicalResourceId=None, noEcho=False, reason=None):
    responseUrl = event['ResponseURL']

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
    headers = {
        'Content-Type': '',
        'Content-Length': str(len(json_response))
    }

    try:
        req = urllib.request.Request(responseUrl, json_response.encode('utf-8'), headers)
        with urllib.request.urlopen(req) as response:
            print(f"Status code: {response.getcode()}")
            return True
    except Exception as e:
        print(f"send(..) failed executing request: {str(e)}")
        return False
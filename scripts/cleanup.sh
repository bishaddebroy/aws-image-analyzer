#!/bin/bash
# Cleanup script for Image Recognition App

# Set variables
STACK_NAME="image-recognition-app"
REGION="us-east-1"  # Set to your AWS Academy region
S3_BUCKET="${STACK_NAME}-deployment-$(aws sts get-caller-identity --query Account --output text)"
EC2_KEY_NAME="${STACK_NAME}-key"

echo "Starting cleanup of $STACK_NAME resources..."

# Get S3 image bucket name from CloudFormation outputs
IMAGE_BUCKET=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='ImageBucketName'].OutputValue" --output text)

if [ -n "$IMAGE_BUCKET" ]; then
  # Empty S3 image bucket (required before deletion)
  echo "Emptying S3 image bucket: $IMAGE_BUCKET"
  aws s3 rm s3://$IMAGE_BUCKET --recursive
fi

# Empty deployment bucket
echo "Emptying deployment bucket: $S3_BUCKET"
aws s3 rm s3://$S3_BUCKET --recursive

# Delete CloudFormation stack
echo "Deleting CloudFormation stack: $STACK_NAME"
aws cloudformation delete-stack --stack-name $STACK_NAME

# Wait for stack deletion to complete
echo "Waiting for stack deletion to complete..."
aws cloudformation wait stack-delete-complete --stack-name $STACK_NAME

# Delete S3 buckets
echo "Deleting S3 buckets..."
if [ -n "$IMAGE_BUCKET" ]; then
  aws s3 rb s3://$IMAGE_BUCKET --force || true
fi
aws s3 rb s3://$S3_BUCKET --force || true

# Delete EC2 key pair
echo "Deleting EC2 key pair: $EC2_KEY_NAME"
aws ec2 delete-key-pair --key-name $EC2_KEY_NAME || true
rm -f ~/.ssh/$EC2_KEY_NAME.pem

# Clean up local directories
echo "Cleaning up local build artifacts..."
rm -rf backend/layers/common_dependencies/python
rm -f backend/cloudformation/packaged-template.yaml

echo "Cleanup completed successfully!"
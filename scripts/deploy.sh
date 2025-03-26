#!/bin/bash
# Complete deployment script for Image Recognition App with Cognito Auth

# Set variables
STACK_NAME="image-recognition-app"
REGION="us-east-1"  # Set to your AWS Academy region
S3_BUCKET="${STACK_NAME}-deployment-$(aws sts get-caller-identity --query Account --output text)"
EC2_KEY_NAME="${STACK_NAME}-key"

echo "Starting deployment of $STACK_NAME..."

# Create S3 bucket for deployment artifacts if it doesn't exist
echo "Creating S3 bucket for deployment..."
aws s3 mb s3://$S3_BUCKET --region $REGION || true

# Upload EC2 user data script to S3
echo "Uploading EC2 user data script..."
aws s3 cp backend/user_data/ec2_setup.sh s3://$S3_BUCKET/ec2_setup.sh

# Install dependencies for Lambda layer
echo "Installing Lambda layer dependencies..."
mkdir -p backend/layers/common_dependencies/python
pip install -r backend/requirements.txt -t backend/layers/common_dependencies/python --upgrade

# Create or update EC2 key pair
echo "Creating EC2 key pair..."
aws ec2 describe-key-pairs --key-names $EC2_KEY_NAME > /dev/null 2>&1
if [ $? -ne 0 ]; then
  mkdir -p ~/.ssh
  chmod 700 ~/.ssh
  aws ec2 create-key-pair --key-name $EC2_KEY_NAME --query "KeyMaterial" --output text > ~/.ssh/$EC2_KEY_NAME.pem
  chmod 400 ~/.ssh/$EC2_KEY_NAME.pem
  echo "Created new key pair: $EC2_KEY_NAME"
else
  echo "Key pair $EC2_KEY_NAME already exists"
fi

# Package CloudFormation template
echo "Packaging CloudFormation template..."
aws cloudformation package \
  --template-file backend/cloudformation/template.yaml \
  --s3-bucket $S3_BUCKET \
  --output-template-file backend/cloudformation/packaged-template.yaml

# Deploy CloudFormation stack
echo "Deploying CloudFormation stack..."
aws cloudformation deploy \
  --template-file backend/cloudformation/packaged-template.yaml \
  --stack-name $STACK_NAME \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    EnvStage=dev \
    AppName=$STACK_NAME \
    KeyPairName=$EC2_KEY_NAME \
    UserDataBucket=$S3_BUCKET \
    UserDataKey=ec2_setup.sh

if [ $? -ne 0 ]; then
  echo "CloudFormation deployment failed. Exiting."
  exit 1
fi

# Wait for deployment to complete
echo "Waiting for stack deployment to complete..."
aws cloudformation wait stack-create-complete --stack-name $STACK_NAME || \
aws cloudformation wait stack-update-complete --stack-name $STACK_NAME

# Get outputs from CloudFormation
echo "Getting stack outputs..."
API_URL=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='ApiEndpoint'].OutputValue" --output text)
EC2_PUBLIC_IP=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='EC2PublicIP'].OutputValue" --output text)
USER_POOL_ID=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='UserPoolId'].OutputValue" --output text)
USER_POOL_CLIENT_ID=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='UserPoolClientId'].OutputValue" --output text)

# Update frontend configuration with API endpoint and Cognito details
echo "Updating frontend configuration..."
cat > frontend/src/utils/config.js << EOF
// Auto-generated configuration file - DO NOT EDIT MANUALLY
export const config = {
  API_ENDPOINT: "$API_URL",
  REGION: "$REGION",
  COGNITO: {
    USER_POOL_ID: "$USER_POOL_ID",
    APP_CLIENT_ID: "$USER_POOL_CLIENT_ID"
  },
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  SUPPORTED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/bmp'],
  POLLING_INTERVAL: 3000
};
EOF

# Create a demo user if it doesn't exist
echo "Creating demo user in Cognito..."
aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username demo@example.com \
  --temporary-password Password123! \
  --message-action SUPPRESS \
  --user-attributes Name=email,Value=demo@example.com Name=email_verified,Value=true \
  > /dev/null 2>&1 || true

# Set permanent password for the demo user
echo "Setting password for demo user..."
aws cognito-idp admin-set-user-password \
  --user-pool-id $USER_POOL_ID \
  --username demo@example.com \
  --password password \
  --permanent \
  > /dev/null 2>&1 || true

# Build React frontend
echo "Building frontend..."
cd frontend
npm install
npm run build
cd ..

# Wait for EC2 instance to be ready
echo "Waiting for EC2 instance to be ready..."
sleep 60  # Wait a minute for EC2 to initialize

# Deploy frontend to EC2 instance
echo "Deploying frontend to EC2..."
scp -i ~/.ssh/$EC2_KEY_NAME.pem -r -o StrictHostKeyChecking=no frontend/build/* ec2-user@$EC2_PUBLIC_IP:/var/www/html/

echo "Deployment completed successfully!"
echo "API URL: $API_URL"
echo "Website URL: http://$EC2_PUBLIC_IP"
echo "Cognito User Pool ID: $USER_POOL_ID"
echo "Cognito App Client ID: $USER_POOL_CLIENT_ID"
echo ""
echo "Demo account:"
echo "Email: demo@example.com"
echo "Password: password"
# Image Recognition App

A serverless application that lets users upload and analyze images using AWS Rekognition. The application provides detailed information about objects, scenes, faces, celebrities, text, and content moderation in images.

## Architecture

This project uses a modern serverless cloud architecture with the following AWS services:

- **Compute**:
  - AWS Lambda (for image processing)
  - Amazon EC2 (for web hosting)

- **Storage**:
  - Amazon S3 (for image storage)

- **Networking**:
  - Amazon API Gateway (for REST API)

- **Database**:
  - Amazon DynamoDB (for storing analysis results)

- **Application Integration**:
  - AWS Step Functions (for orchestrating the image processing workflow)

- **Management and Governance**:
  - Amazon CloudWatch (for monitoring and logging)

The architecture follows a serverless pattern where images are processed in parallel using multiple Lambda functions orchestrated by a Step Functions workflow.

## Features

- **Object and Scene Detection**: Identify objects, activities, and scenes in images
- **Face Analysis**: Detect faces and analyze attributes like age, gender, emotions, and more
- **Celebrity Recognition**: Identify celebrities and public figures
- **Text Extraction**: Extract and read text that appears in images
- **Content Moderation**: Automatically detect inappropriate content
- **Secure Authentication**: User authentication system to protect images and results
- **Image Gallery**: Browse and manage your analyzed images
- **Detailed Analysis**: View comprehensive analysis results with intuitive visualization

## Prerequisites

- AWS Academy Learner Lab account
- AWS CLI installed and configured with your lab credentials
- Python 3.9 or higher
- Node.js 14 or higher
- npm 6 or higher

## Deployment

The project uses Infrastructure as Code (IaC) with AWS CloudFormation for deployment.

1. Clone the repository:
   ```
   git clone <repository-url>
   cd image-recognition-app
   ```

2. Set up your AWS credentials for the Learner Lab:
   ```
   aws configure
   ```

3. Run the deployment script:
   ```
   chmod +x scripts/deploy.sh
   ./scripts/deploy.sh
   ```

The script will:
- Create necessary S3 buckets
- Install Lambda dependencies
- Create an EC2 key pair
- Package and deploy the CloudFormation template
- Build and deploy the React frontend
- Output the application URL

## Project Structure

- `backend/` - Backend code and infrastructure
  - `cloudformation/` - CloudFormation templates
  - `functions/` - Lambda functions
  - `layers/` - Lambda layers
  - `step_functions/` - Step Functions workflow definition
  - `user_data/` - EC2 user data scripts

- `frontend/` - React frontend application
  - `public/` - Static assets
  - `src/` - Source code
    - `components/` - React components
    - `pages/` - Page components
    - `services/` - API and authentication services
    - `utils/` - Utility functions

- `scripts/` - Deployment and cleanup scripts

## Lambda Functions

1. **Auth Handler** - Handles user authentication
2. **Image Handler** - Manages image CRUD operations
3. **Workflow Trigger** - Initiates Step Functions workflow when an image is uploaded
4. **Detect Labels** - Identifies objects and scenes in images
5. **Detect Moderation** - Checks for inappropriate content
6. **Detect Faces** - Analyzes faces in images
7. **Recognize Celebrities** - Identifies celebrities
8. **Detect Text** - Extracts text from images
9. **Results Processor** - Aggregates and stores analysis results

## Step Functions Workflow

The image processing workflow runs five parallel tasks:
1. Label Detection
2. Moderation Analysis
3. Face Analysis
4. Celebrity Recognition
5. Text Detection

After all parallel tasks complete, the Results Processor combines the outputs and updates the database.

## Cleanup

To remove all resources created by this project, run the cleanup script:

```
chmod +x scripts/cleanup.sh
./scripts/cleanup.sh
```

This will delete:
- CloudFormation stack
- S3 buckets
- EC2 key pair
- All associated resources

## CSCI4145/5409 Advanced Topics in Cloud Computing

This project was developed as the Term Project for CSCI4145/5409 Advanced Topics in Cloud Computing at Dalhousie University.

## License

This project is a course assignment and is not licensed for commercial use.
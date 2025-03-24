// Configuration settings for the application
// This file will be updated by the deployment script with the actual API endpoint

export const config = {
    // API endpoint from CloudFormation output
    // This will be replaced during deployment
    API_ENDPOINT: 'https://placeholder-api-id.execute-api.us-east-1.amazonaws.com/dev',
    
    // Default region
    REGION: 'us-east-1',
    
    // Maximum file size for uploads (in bytes)
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    
    // Supported file types
    SUPPORTED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/bmp'],
    
    // Polling interval for processing status (in milliseconds)
    POLLING_INTERVAL: 3000
  };
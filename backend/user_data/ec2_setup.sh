#!/bin/bash
# EC2 setup script for web server

# Update system packages
yum update -y

# Install Apache web server and other dependencies
yum install -y httpd git nodejs npm

# Start and enable Apache
systemctl start httpd
systemctl enable httpd

# Create web directory if it doesn't exist
mkdir -p /var/www/html

# Set permissions
chown -R ec2-user:ec2-user /var/www/html
chmod -R 755 /var/www/html

# Create a placeholder index.html until the real app is deployed
cat > /var/www/html/index.html << EOF
<!DOCTYPE html>
<html>
<head>
  <title>Image Recognition App</title>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      text-align: center; 
      margin-top: 50px; 
      background-color: #f5f5f5;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background-color: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .loader { 
      border: 16px solid #f3f3f3; 
      border-top: 16px solid #3498db; 
      border-radius: 50%; 
      width: 120px; 
      height: 120px; 
      animation: spin 2s linear infinite; 
      margin: 30px auto; 
    }
    @keyframes spin { 
      0% { transform: rotate(0deg); } 
      100% { transform: rotate(360deg); } 
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Image Recognition App</h1>
    <p>Deployment in progress...</p>
    <div class="loader"></div>
    <p>The application will be available shortly.</p>
  </div>
</body>
</html>
EOF

# After creating index.html in UserData
chown ec2-user:ec2-user /var/www/html/index.html

# Log completion
echo "EC2 setup complete - $(date)" >> /var/log/ec2-setup.log
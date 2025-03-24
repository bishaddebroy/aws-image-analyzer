import React from 'react';

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h4>Image Recognition App</h4>
            <p>
              A cloud-based application for analyzing images using 
              AWS Rekognition and other AWS services.
            </p>
          </div>
          
          <div className="footer-section">
            <h4>Technologies</h4>
            <ul className="tech-list">
              <li>AWS Lambda</li>
              <li>Amazon S3</li>
              <li>DynamoDB</li>
              <li>API Gateway</li>
              <li>Step Functions</li>
              <li>Amazon Rekognition</li>
              <li>React</li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>University Project</h4>
            <p>
              Built for CSCI4145/5409 Advanced Topics in Cloud Computing
              at Dalhousie University.
            </p>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p className="copyright">
            &copy; {new Date().getFullYear()} Image Recognition App
          </p>
          <p className="disclaimer">
            This is a course project and not a commercial application.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
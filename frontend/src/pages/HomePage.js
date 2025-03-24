import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ImageUploader from '../components/Images/ImageUploader';
import { uploadImage } from '../services/api';

const HomePage = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const navigate = useNavigate();

  const handleUpload = async (file) => {
    if (!file) return;
    
    setIsUploading(true);
    setUploadError(null);
    
    try {
      const imageId = await uploadImage(file);
      
      // Navigate to the gallery page after successful upload
      navigate('/gallery');
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error.message || 'Error uploading image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="home-page">
      <div className="hero-section">
        <h1>Image Recognition App</h1>
        <p className="subtitle">
          Upload an image to analyze it with AWS Rekognition
        </p>
        
        <div className="features-list">
          <div className="feature">
            <i className="feature-icon">🏷️</i>
            <h3>Object Detection</h3>
            <p>Identify objects, scenes, and activities in your images</p>
          </div>
          
          <div className="feature">
            <i className="feature-icon">😀</i>
            <h3>Face Analysis</h3>
            <p>Detect faces and analyze age, emotions, and features</p>
          </div>
          
          <div className="feature">
            <i className="feature-icon">⭐</i>
            <h3>Celebrity Recognition</h3>
            <p>Identify celebrities and public figures in your photos</p>
          </div>
          
          <div className="feature">
            <i className="feature-icon">📝</i>
            <h3>Text Extraction</h3>
            <p>Extract and read text that appears in your images</p>
          </div>
          
          <div className="feature">
            <i className="feature-icon">🛡️</i>
            <h3>Content Moderation</h3>
            <p>Automatically detect inappropriate content</p>
          </div>
        </div>
      </div>
      
      <div className="upload-section">
        <h2>Upload an Image</h2>
        <ImageUploader onUpload={handleUpload} isUploading={isUploading} />
        
        {uploadError && (
          <div className="error-message">
            {uploadError}
          </div>
        )}
        
        <div className="upload-help">
          <h3>Supported Image Types</h3>
          <p>You can upload JPEG, PNG, GIF, and BMP files up to 5MB.</p>
          
          <h3>Privacy Note</h3>
          <p>
            Your images are analyzed securely in the cloud and are only 
            accessible to you. See our privacy policy for more details.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
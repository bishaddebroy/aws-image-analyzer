import React, { useState, useRef } from 'react';
import { config } from '../../utils/config';
import Loader from '../Common/Loader';

const ImageUploader = ({ onUpload, isUploading }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState(null);
  
  const fileInputRef = useRef(null);
  
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };
  
  const handleChange = (e) => {
    e.preventDefault();
    
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };
  
  const handleFile = (file) => {
    // Reset error state
    setError(null);
    
    // Validate file type
    if (!config.SUPPORTED_FILE_TYPES.includes(file.type)) {
      setError('Unsupported file type. Please upload a JPEG, PNG, GIF, or BMP image.');
      return;
    }
    
    // Validate file size
    if (file.size > config.MAX_FILE_SIZE) {
      setError(`File is too large. Maximum size is ${config.MAX_FILE_SIZE / (1024 * 1024)}MB.`);
      return;
    }
    
    // Set the selected file
    setSelectedFile(file);
    
    // Create a preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };
  
  const handleUploadClick = () => {
    if (selectedFile) {
      onUpload(selectedFile);
    }
  };
  
  const handleBrowseClick = () => {
    fileInputRef.current.click();
  };
  
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <div className="image-uploader">
      {!selectedFile ? (
        <div 
          className={`upload-area ${dragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          <input 
            ref={fileInputRef}
            type="file" 
            accept="image/jpeg,image/png,image/gif,image/bmp"
            onChange={handleChange}
            className="file-input"
          />
          
          <div className="upload-prompt">
            <div className="upload-icon">📁</div>
            <h3>Drag & drop an image here</h3>
            <p>or</p>
            <button 
              className="browse-button"
              onClick={handleBrowseClick}
            >
              Browse files
            </button>
            <p className="file-types">
              Supported formats: JPEG, PNG, GIF, BMP (max {config.MAX_FILE_SIZE / (1024 * 1024)}MB)
            </p>
          </div>
        </div>
      ) : (
        <div className="file-preview">
          <div className="preview-header">
            <h3>Selected Image</h3>
            <button 
              className="remove-button"
              onClick={handleRemoveFile}
              disabled={isUploading}
            >
              &times;
            </button>
          </div>
          
          <div className="preview-image-container">
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="preview-image" 
            />
          </div>
          
          <div className="file-info">
            <p className="file-name">{selectedFile.name}</p>
            <p className="file-size">{(selectedFile.size / 1024).toFixed(1)} KB</p>
          </div>
          
          <button 
            className="upload-button"
            onClick={handleUploadClick}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader size="small" />
                <span>Uploading...</span>
              </>
            ) : (
              <span>Upload & Analyze</span>
            )}
          </button>
        </div>
      )}
      
      {error && (
        <div className="upload-error">
          {error}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
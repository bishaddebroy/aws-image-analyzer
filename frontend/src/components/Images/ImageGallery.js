import React from 'react';
import { Link } from 'react-router-dom';
import Loader from '../Common/Loader';

const ImageGallery = ({ images, onDelete, deleteInProgress }) => {
  // Format timestamp to readable date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };
  
  // Get status label and class
  const getStatusInfo = (status) => {
    switch(status) {
      case 'pending':
        return { label: 'Pending', className: 'status-pending' };
      case 'processing':
        return { label: 'Processing', className: 'status-processing' };
      case 'completed':
        return { label: 'Completed', className: 'status-completed' };
      case 'failed':
        return { label: 'Failed', className: 'status-failed' };
      default:
        return { label: status, className: '' };
    }
  };
  
  return (
    <div className="image-gallery">
      <div className="gallery-grid">
        {images.map((image) => {
          const statusInfo = getStatusInfo(image.status);
          
          return (
            <div className="gallery-item" key={image.imageId}>
              <div className="image-card">
                <div className="image-container">
                  <img 
                    src={image.imageUrl} 
                    alt={image.fileName || 'Image'} 
                    className="gallery-image"
                  />
                  <div className={`status-badge ${statusInfo.className}`}>
                    {statusInfo.label}
                  </div>
                </div>
                
                <div className="image-details">
                  <h3 className="image-name">
                    {image.fileName 
                      ? (image.fileName.length > 20 
                          ? image.fileName.substring(0, 17) + '...' 
                          : image.fileName)
                      : 'Unnamed Image'
                    }
                  </h3>
                  <p className="image-date">{formatDate(image.createdAt)}</p>
                </div>
                
                <div className="image-actions">
                  {image.status === 'processing' || image.status === 'pending' ? (
                    <div className="processing-indicator">
                      <Loader size="tiny" />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <>
                      <Link 
                        to={`/analysis/${image.imageId}`} 
                        className="view-button"
                      >
                        View Analysis
                      </Link>
                      
                      <button 
                        className="delete-button"
                        onClick={() => onDelete(image.imageId)}
                        disabled={deleteInProgress}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ImageGallery;
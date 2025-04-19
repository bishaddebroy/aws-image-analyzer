import React, { useState, useEffect, useRef } from 'react';
import { config } from '../utils/config';
import { Link } from 'react-router-dom';
import ImageGallery from '../components/Images/ImageGallery';
import Loader from '../components/Common/Loader';
import ErrorDisplay from '../components/Common/ErrorDisplay';
import { getImages, deleteImage } from '../services/api';

const GalleryPage = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef(null);

  // Initial load of images
  useEffect(() => {
    loadImages();
  }, []);

  // Polling mechanism that correctly handles image status changes
  useEffect(() => {
    // Function to check image status and manage polling
    const checkAndUpdatePolling = () => {
      // Check if any images are still processing
      const hasProcessingImages = images.some(img => 
        img.status === 'pending' || img.status === 'processing'
      );
      
      console.log("Checking images:", hasProcessingImages ? "Some processing" : "None processing");
      
      // Clear any existing interval
      if (intervalRef.current) {
        console.log("Clearing existing polling interval");
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      // Set up new interval if needed
      if (hasProcessingImages) {
        console.log("Starting/continuing polling for processing images");
        
        intervalRef.current = setInterval(() => {
          console.log("Polling for updates");
          loadImages(true); // Pass true to indicate this is a poll
        }, config.POLLING_INTERVAL || 3000);
        
        if (!isPolling) setIsPolling(true);
      } else if (isPolling) {
        console.log("Stopping polling - no processing images");
        setIsPolling(false);
      }
    };
    
    // Run immediately and whenever images change
    checkAndUpdatePolling();
    
    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        console.log("Clearing polling interval on unmount");
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [images, isPolling]); // Both dependencies are needed

  // Load images with polling awareness
  const loadImages = async (isPoll = false) => {
    // Only show loading indicator for initial load, not for polling
    if (!isPoll) {
      console.log("Loading images for the first time");
      setLoading(true);
    } else {
      console.log("Polling for image updates");
    }
    
    setError(null);
    
    try {
      const imageData = await getImages();
      console.log("Loaded images:", imageData.map(img => `${img.imageId}: ${img.status}`));
      setImages(imageData);
    } catch (err) {
      console.error('Error loading images:', err);
      // Only show errors for initial loads, not polling failures
      if (!isPoll) {
        setError('Failed to load your images. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('Are you sure you want to delete this image?')) {
      return;
    }
    
    setDeleteInProgress(true);
    
    try {
      await deleteImage(imageId);
      setImages(images.filter(img => img.imageId !== imageId));
    } catch (err) {
      console.error('Error deleting image:', err);
      setError('Failed to delete the image. Please try again.');
    } finally {
      setDeleteInProgress(false);
    }
  };

  if (loading) {
    return <Loader message="Loading your images..." />;
  }

  return (
    <div className="gallery-page">
      <div className="gallery-header">
        <h1>Your Image Gallery</h1>
        <Link to="/" className="upload-button">Upload New Image</Link>
      </div>
      
      {error && <ErrorDisplay message={error} />}
      
      {images.length === 0 ? (
        <div className="empty-gallery">
          <h2>No images found</h2>
          <p>Upload some images to get started with analysis!</p>
          <Link to="/" className="button primary-button">Upload an Image</Link>
        </div>
      ) : (
        <ImageGallery 
          images={images} 
          onDelete={handleDeleteImage}
          deleteInProgress={deleteInProgress}
        />
      )}
      
      <div className="gallery-help">
        <h3>Image Analysis Status</h3>
        <div className="status-legend">
          <div className="status-item">
            <span className="status-indicator pending"></span>
            <span>Pending: Image is queued for analysis</span>
          </div>
          <div className="status-item">
            <span className="status-indicator processing"></span>
            <span>Processing: Analysis in progress</span>
          </div>
          <div className="status-item">
            <span className="status-indicator completed"></span>
            <span>Completed: Analysis finished</span>
          </div>
          <div className="status-item">
            <span className="status-indicator failed"></span>
            <span>Failed: Analysis encountered an error</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GalleryPage;
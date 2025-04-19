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

  useEffect(() => {
    loadImages();
  }, []);

  // Fixed polling mechanism
  useEffect(() => {
    // Check if any images are still processing
    const hasProcessingImages = images.some(img => 
      img.status === 'pending' || img.status === 'processing'
    );
    
    // Always clear existing interval first to prevent memory leaks
    if (intervalRef.current) {
      console.log("Clearing existing polling interval");
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (hasProcessingImages && !isPolling) {
      console.log("Starting polling for processing images");
      setIsPolling(true);
      intervalRef.current = setInterval(() => {
        console.log("Polling for updates");
        loadImages();
      }, config.POLLING_INTERVAL || 3000);
    } else if (!hasProcessingImages && isPolling) {
      console.log("Stopping polling - no processing images");
      setIsPolling(false);
    }
    
    // Clean up on unmount
    return () => {
      if (intervalRef.current) {
        console.log("Clearing polling interval on unmount");
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [images]);

  const loadImages = async () => {
    //if (loading && isPolling) return; // Prevent concurrent requests

    // Only show loading indicator for initial load, not for polling
    if (!isPolling) {
      console.log("Loading images for the first time");
      setLoading(true);
    }
    console.log("Loading images...");
    setError(null);
    
    try {
      const imageData = await getImages();
      console.log("Loaded images:", imageData.map(img => `${img.imageId}: ${img.status}`));
      setImages(imageData);
    } catch (err) {
      console.error('Error loading images:', err);
      setError('Failed to load your images. Please try again later.');
    } finally {
      console.log("Finished loading images");
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
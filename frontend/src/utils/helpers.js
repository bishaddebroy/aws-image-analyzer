/**
 * Helper functions for the Image Recognition App
 */

/**
 * Format a timestamp to a readable date/time
 * @param {number} timestamp - Unix timestamp in seconds
 * @param {boolean} includeTime - Whether to include time in the formatted string
 * @returns {string} Formatted date/time string
 */
export const formatDate = (timestamp, includeTime = true) => {
    if (!timestamp) return 'Unknown date';
    
    const date = new Date(timestamp * 1000);
    
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...(includeTime && {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
    
    return date.toLocaleString(undefined, options);
  };
  
  /**
   * Get a color based on confidence level
   * @param {number} confidence - Confidence percentage (0-100)
   * @returns {string} CSS color value
   */
  export const getConfidenceColor = (confidence) => {
    if (confidence >= 90) return '#2ecc71'; // High confidence - green
    if (confidence >= 70) return '#27ae60'; // Good confidence - darker green
    if (confidence >= 50) return '#f39c12'; // Medium confidence - yellow
    return '#e74c3c'; // Low confidence - red
  };
  
  /**
   * Truncate text to a maximum length with ellipsis
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated text
   */
  export const truncateText = (text, maxLength = 100) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };
  
  /**
   * Format file size to human-readable string
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted file size
   */
  export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  /**
   * Get a status object with label and CSS class
   * @param {string} status - Status string ('pending', 'processing', 'completed', 'failed')
   * @returns {Object} Object with label and className properties
   */
  export const getStatusInfo = (status) => {
    switch(status) {
      case 'pending':
        return { 
          label: 'Pending', 
          className: 'status-pending',
          icon: '⏳'
        };
      case 'processing':
        return { 
          label: 'Processing', 
          className: 'status-processing',
          icon: '⚙️'
        };
      case 'completed':
        return { 
          label: 'Completed', 
          className: 'status-completed',
          icon: '✓'
        };
      case 'failed':
        return { 
          label: 'Failed', 
          className: 'status-failed',
          icon: '⚠️'
        };
      default:
        return { 
          label: status || 'Unknown', 
          className: '',
          icon: '❓'
        };
    }
  };
  
  /**
   * Validate file type against list of allowed types
   * @param {File} file - File object to validate
   * @param {Array} allowedTypes - Array of allowed MIME types
   * @returns {boolean} Whether the file type is allowed
   */
  export const validateFileType = (file, allowedTypes) => {
    return allowedTypes.includes(file.type);
  };
  
  /**
   * Validate file size against maximum size
   * @param {File} file - File object to validate
   * @param {number} maxSize - Maximum file size in bytes
   * @returns {boolean} Whether the file size is allowed
   */
  export const validateFileSize = (file, maxSize) => {
    return file.size <= maxSize;
  };
  
  /**
   * Get a readable error message for invalid files
   * @param {File} file - File object to validate
   * @param {Array} allowedTypes - Array of allowed MIME types
   * @param {number} maxSize - Maximum file size in bytes
   * @returns {string|null} Error message or null if file is valid
   */
  export const getFileValidationError = (file, allowedTypes, maxSize) => {
    if (!validateFileType(file, allowedTypes)) {
      return `File type "${file.type}" is not supported. Please upload ${allowedTypes.map(t => t.split('/')[1]).join(', ')}.`;
    }
    
    if (!validateFileSize(file, maxSize)) {
      return `File size (${formatFileSize(file.size)}) exceeds the maximum allowed (${formatFileSize(maxSize)}).`;
    }
    
    return null;
  };
  
  /**
   * Debounce a function to limit how often it can be called
   * @param {Function} func - Function to debounce
   * @param {number} wait - Time to wait in milliseconds
   * @returns {Function} Debounced function
   */
  export const debounce = (func, wait = 300) => {
    let timeout;
    
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };
  
  /**
   * Parse JWT token to get payload
   * @param {string} token - JWT token
   * @returns {Object|null} Decoded token payload or null if invalid
   */
  export const parseJwt = (token) => {
    if (!token) return null;
    
    try {
      // For demo purposes, this is a simplified JWT parser
      // In production, use a proper JWT library
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error parsing JWT:', error);
      return null;
    }
  };
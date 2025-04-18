import { config } from '../utils/config';

// Base API URL from config
const API_URL = config.API_ENDPOINT;

/**
 * Make an API request with proper authentication and error handling
 */
const apiRequest = async (endpoint, options = {}) => {
  // Get authentication token from local storage (use idToken for Cognito)
  const idToken = localStorage.getItem('idToken');
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
    }
  };
  
  const requestOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  };
  
  try {
    const response = await fetch(`${API_URL}${endpoint}`, requestOptions);
    
    if (!response.ok) {
      // Try to parse error message from response if possible
      try {
        const errorData = await response.json();
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
      } catch (err) {
        throw new Error(`Request failed with status ${response.status}`);
      }
    }
    
    // For no-content responses
    if (response.status === 204) {
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

/**
 * Authentication functions
 */
export const login = async (email, password) => {
  const data = await apiRequest('/auth', {
    method: 'POST',
    body: JSON.stringify({
      action: 'login',
      email,
      password
    })
  });
  
  return data;
};

export const register = async (email, password) => {
  const data = await apiRequest('/auth', {
    method: 'POST',
    body: JSON.stringify({
      action: 'register',
      email,
      password
    })
  });
  
  return data;
};

/**
 * Image related functions
 */
export const uploadImage = async (file) => {
  // Step 1: Get a pre-signed URL
  const urlResponse = await apiRequest('/images/upload-url', {
    method: 'POST',
    body: JSON.stringify({
      fileName: file.name
    })
  });
  
  // Step 2: Upload the file directly to S3 using the pre-signed URL
  const uploadResponse = await fetch(urlResponse.uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type
    }
  });
  
  if (!uploadResponse.ok) {
    throw new Error('Failed to upload image to storage');
  }
  
  return urlResponse.imageId;
};

export const getImages = async () => {
  const response = await apiRequest('/images');
  return response.images || [];
};

export const getImageResults = async (imageId) => {
  const response = await apiRequest(`/images/${imageId}/results`);
  return response;
};

export const deleteImage = async (imageId) => {
  await apiRequest(`/images/${imageId}`, {
    method: 'DELETE'
  });
  return true;
};
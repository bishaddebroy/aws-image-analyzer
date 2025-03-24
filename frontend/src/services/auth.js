import { config } from '../utils/config';
import { login as apiLogin } from './api';

/**
 * Check if the user is currently authenticated
 */
export const checkAuthStatus = async () => {
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  
  if (!token || !userId) {
    return { isAuthenticated: false, user: null };
  }
  
  // In a real app, you would validate the token against your API
  // For this demo, we'll simply check if the token exists
  
  return {
    isAuthenticated: true,
    user: {
      userId,
      email: localStorage.getItem('email') || 'User'
    }
  };
};

/**
 * Log in the user
 */
export const login = async (email, password) => {
  try {
    const userData = await apiLogin(email, password);
    
    if (userData.email) {
      localStorage.setItem('email', userData.email);
    }
    
    return userData;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Log out the user
 */
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  localStorage.removeItem('email');
  
  return true;
};
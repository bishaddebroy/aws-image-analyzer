import { config } from '../utils/config';
import { login as apiLogin, register as apiRegister } from './api';

/**
 * Parse JWT token to get payload
 */
const parseJwt = (token) => {
  if (!token) return null;
  
  try {
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

/**
 * Check if the user is currently authenticated
 */
export const checkAuthStatus = async () => {
  const idToken = localStorage.getItem('idToken');
  const userId = localStorage.getItem('userId');
  
  if (!idToken || !userId) {
    return { isAuthenticated: false, user: null };
  }
  
  // Check if token is expired
  try {
    const tokenPayload = parseJwt(idToken);
    if (!tokenPayload) {
      throw new Error('Invalid token');
    }
    
    // Check token expiration (exp is in seconds since epoch)
    const currentTime = Math.floor(Date.now() / 1000);
    if (tokenPayload.exp && tokenPayload.exp < currentTime) {
      // Token expired
      console.log('Token expired, logging out');
      logout();
      return { isAuthenticated: false, user: null };
    }
    
    return {
      isAuthenticated: true,
      user: {
        userId,
        email: localStorage.getItem('email') || tokenPayload.email || 'User'
      }
    };
  } catch (error) {
    console.error('Token validation error:', error);
    return { isAuthenticated: false, user: null };
  }
};

/**
 * Log in the user
 */
export const login = async (email, password) => {
  try {
    const userData = await apiLogin(email, password);
    
    // Store auth data in local storage
    localStorage.setItem('idToken', userData.idToken || userData.token);
    localStorage.setItem('accessToken', userData.accessToken || '');
    localStorage.setItem('refreshToken', userData.refreshToken || '');
    localStorage.setItem('userId', userData.userId);
    localStorage.setItem('email', userData.email);
    
    return userData;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Register a new user
 */
export const register = async (email, password) => {
  try {
    const userData = await apiRegister(email, password);
    
    // Store auth data in local storage
    localStorage.setItem('idToken', userData.idToken || userData.token);
    localStorage.setItem('accessToken', userData.accessToken || '');
    localStorage.setItem('refreshToken', userData.refreshToken || '');
    localStorage.setItem('userId', userData.userId);
    localStorage.setItem('email', userData.email);
    
    return userData;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

/**
 * Log out the user
 */
export const logout = () => {
  localStorage.removeItem('idToken');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userId');
  localStorage.removeItem('email');
  
  return true;
};
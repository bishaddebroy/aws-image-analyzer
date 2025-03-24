import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { login } from '../../services/auth';
import Loader from '../Common/Loader';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Simple validation
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const userData = await login(email, password);
      onLogin(userData);
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Log In</h2>
        
        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              placeholder="Your email address"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              placeholder="Your password"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="auth-button"
            disabled={isLoading}
          >
            {isLoading ? <Loader size="small" /> : 'Log In'}
          </button>
        </form>
        
        <p className="auth-alternate">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
        
        <div className="auth-info">
          <h4>Demo Credentials</h4>
          <p>For testing purposes, you can use:</p>
          <ul>
            <li>Email: demo@example.com</li>
            <li>Password: password</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Login;
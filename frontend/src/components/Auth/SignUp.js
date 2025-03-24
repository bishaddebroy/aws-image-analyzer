import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { register } from '../services/api';
import Loader from '../Common/Loader';

const SignUp = ({ onSignUp }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Simple validation
    if (!email || !password || !confirmPassword) {
      setError('Please fill out all fields.');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const userData = await register(email, password);
      onSignUp(userData);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Create Account</h2>
        
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
              placeholder="Create a password"
              required
              minLength={6}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              placeholder="Confirm your password"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="auth-button"
            disabled={isLoading}
          >
            {isLoading ? <Loader size="small" /> : 'Sign Up'}
          </button>
        </form>
        
        <p className="auth-alternate">
          Already have an account? <Link to="/login">Log In</Link>
        </p>
        
        <div className="auth-info">
          <p>
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
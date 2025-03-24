import React from 'react';

const Loader = ({ message, size = 'medium' }) => {
  const sizeClass = {
    'tiny': 'loader-tiny',
    'small': 'loader-small',
    'medium': 'loader-medium',
    'large': 'loader-large'
  }[size] || 'loader-medium';
  
  return (
    <div className="loader-container">
      <div className={`loader ${sizeClass}`}>
        <div className="loader-spinner"></div>
      </div>
      {message && <p className="loader-message">{message}</p>}
    </div>
  );
};

export default Loader;
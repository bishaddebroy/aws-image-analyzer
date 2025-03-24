import React from 'react';

const ErrorDisplay = ({ message, onRetry }) => {
  return (
    <div className="error-display">
      <div className="error-icon">⚠️</div>
      <div className="error-message">{message}</div>
      {onRetry && (
        <button 
          className="retry-button"
          onClick={onRetry}
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorDisplay;
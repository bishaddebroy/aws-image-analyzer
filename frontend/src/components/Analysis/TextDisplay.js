import React, { useState } from 'react';

const TextDisplay = ({ textData }) => {
  const [viewMode, setViewMode] = useState('lines'); // 'lines' or 'words'
  
  if (!textData || !textData.hasText) {
    return (
      <div className="text-empty">
        <p>No text was detected in this image.</p>
      </div>
    );
  }
  
  const { combinedText, lines, words } = textData;
  
  return (
    <div className="text-display">
      <div className="text-summary">
        <h4>Detected Text</h4>
        <div className="view-selector">
          <button
            className={`view-button ${viewMode === 'lines' ? 'active' : ''}`}
            onClick={() => setViewMode('lines')}
          >
            View by Lines
          </button>
          <button
            className={`view-button ${viewMode === 'words' ? 'active' : ''}`}
            onClick={() => setViewMode('words')}
          >
            View by Words
          </button>
        </div>
      </div>
      
      <div className="combined-text">
        <h4>Complete Text</h4>
        <div className="text-content">
          {combinedText || 'No combined text available'}
        </div>
      </div>
      
      <div className="text-details">
        {viewMode === 'lines' ? (
          <div className="text-lines">
            <h4>Text Lines ({lines.length})</h4>
            {lines.length > 0 ? (
              <ul className="lines-list">
                {lines.map((line, index) => (
                  <li key={index} className="text-line">
                    <div className="line-content">
                      <span className="line-number">{index + 1}.</span>
                      <span className="line-text">{line.detectedText}</span>
                    </div>
                    <div className="line-confidence">
                      Confidence: {line.confidence}%
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No text lines detected</p>
            )}
          </div>
        ) : (
          <div className="text-words">
            <h4>Individual Words ({words.length})</h4>
            {words.length > 0 ? (
              <div className="words-cloud">
                {words.map((word, index) => {
                  // Calculate font size based on confidence
                  const fontSize = Math.max(
                    1, 
                    Math.min(2.5, word.confidence / 40)
                  );
                  
                  return (
                    <span 
                      key={index} 
                      className="word-item"
                      style={{ 
                        fontSize: `${fontSize}rem`,
                        opacity: word.confidence / 100
                      }}
                      title={`Confidence: ${word.confidence}%`}
                    >
                      {word.detectedText}
                    </span>
                  );
                })}
              </div>
            ) : (
              <p>No individual words detected</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TextDisplay;
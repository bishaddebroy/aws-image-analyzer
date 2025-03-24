import React from 'react';

const ModerationLabels = ({ moderationData }) => {
  if (!moderationData) {
    return (
      <div className="moderation-empty">
        <p>No moderation data available for this image.</p>
      </div>
    );
  }
  
  const { isSafe, moderationLabels } = moderationData;
  
  // Group moderation labels by parent category
  const groupedLabels = {};
  
  if (moderationLabels && moderationLabels.length > 0) {
    moderationLabels.forEach(label => {
      const parentName = label.parentName || 'Other';
      
      if (!groupedLabels[parentName]) {
        groupedLabels[parentName] = [];
      }
      
      groupedLabels[parentName].push(label);
    });
  }
  
  return (
    <div className="moderation-labels">
      <div className="safety-summary">
        <h4>Content Safety Analysis</h4>
        
        {isSafe ? (
          <div className="safe-content">
            <div className="safety-icon safe">✓</div>
            <p>This image appears to be safe. No potentially inappropriate content was detected.</p>
          </div>
        ) : (
          <div className="unsafe-content">
            <div className="safety-icon unsafe">!</div>
            <p>
              This image may contain potentially sensitive content.
              The categories below indicate what type of content was detected.
            </p>
          </div>
        )}
      </div>
      
      {!isSafe && moderationLabels && moderationLabels.length > 0 && (
        <div className="moderation-details">
          <h4>Detected Content Categories</h4>
          
          <div className="categories-list">
            {Object.entries(groupedLabels).map(([category, labels]) => (
              <div className="category-group" key={category}>
                <h5 className="category-name">{category}</h5>
                
                <ul className="category-labels">
                  {labels.map((label, index) => (
                    <li key={index} className="moderation-label">
                      <div className="label-name">{label.name}</div>
                      <div className="label-confidence">
                        <div 
                          className="confidence-bar"
                          style={{ width: `${label.confidence}%` }}
                        ></div>
                        <div className="confidence-value">{label.confidence}%</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="moderation-disclaimer">
            <h5>Important Note</h5>
            <p>
              This analysis is based on automated detection and may not be 100% accurate.
              The system may flag content that resembles sensitive material even if it's not.
              Please use your own judgment when interpreting these results.
            </p>
          </div>
        </div>
      )}
      
      {isSafe && (
        <div className="moderation-info">
          <h5>What We Check For</h5>
          <p>
            Our content moderation system analyzes images for potentially sensitive 
            content in the following categories:
          </p>
          <ul className="categories-checked">
            <li>Explicit or suggestive content</li>
            <li>Violence and graphic content</li>
            <li>Drugs, alcohol, tobacco, and gambling</li>
            <li>Hate symbols and gestures</li>
            <li>Other potentially sensitive material</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ModerationLabels;
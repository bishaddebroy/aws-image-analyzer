import React, { useState } from 'react';

const FacesAnalysis = ({ facesData, celebritiesData }) => {
  const [selectedFace, setSelectedFace] = useState(0); // Index of selected face
  
  if (!facesData || !facesData.faces || facesData.faces.length === 0) {
    return (
      <div className="faces-empty">
        <p>No faces were detected in this image.</p>
      </div>
    );
  }
  
  const { faces, faceCount } = facesData;
  const celebrities = celebritiesData?.celebrities || { celebrities: [] };
  
  // Get celebrity name for a face if it exists
  const getCelebrityForFace = (faceIndex) => {
    if (!celebrities || !celebrities.celebrities || celebrities.celebrities.length === 0) {
      return null;
    }
    
    const face = faces[faceIndex];
    if (!face || !face.boundingBox) return null;
    
    // Find a celebrity with a similar bounding box (this is a simple approximation)
    // In a real app, you would match faces using a more sophisticated approach
    for (const celebrity of celebrities.celebrities) {
      if (isSimilarBoundingBox(face.boundingBox, celebrity.boundingBox)) {
        return celebrity;
      }
    }
    
    return null;
  };
  
  // Simple function to check if two bounding boxes likely represent the same face
  const isSimilarBoundingBox = (box1, box2) => {
    // Check if the center points are close to each other
    const center1 = {
      x: box1.left + box1.width/2,
      y: box1.top + box1.height/2
    };
    
    const center2 = {
      x: box2.left + box2.width/2,
      y: box2.top + box2.height/2
    };
    
    const distance = Math.sqrt(
      Math.pow(center1.x - center2.x, 2) + 
      Math.pow(center1.y - center2.y, 2)
    );
    
    // If the centers are within 10% of the image dimensions, consider them the same face
    return distance < 0.1;
  };
  
  // Get selected face data
  const face = faces[selectedFace];
  const celebrity = getCelebrityForFace(selectedFace);
  
  // Format pose data for display
  const formatPose = (pose) => {
    if (!pose) return null;
    
    const { roll, yaw, pitch } = pose;
    let rollDesc = "straight";
    let yawDesc = "looking forward";
    let pitchDesc = "level";
    
    if (roll < -10) rollDesc = "tilted left";
    else if (roll > 10) rollDesc = "tilted right";
    
    if (yaw < -10) yawDesc = "facing left";
    else if (yaw > 10) yawDesc = "facing right";
    
    if (pitch < -10) pitchDesc = "looking down";
    else if (pitch > 10) pitchDesc = "looking up";
    
    return `${rollDesc}, ${yawDesc}, ${pitchDesc}`;
  };
  
  return (
    <div className="faces-analysis">
      <div className="faces-summary">
        <h4>Detected {faceCount} {faceCount === 1 ? 'face' : 'faces'}</h4>
        
        {faceCount > 1 && (
          <div className="face-selector">
            <p>Select a face to view details:</p>
            <div className="face-buttons">
              {faces.map((face, index) => (
                <button
                  key={index}
                  className={`face-button ${selectedFace === index ? 'selected' : ''}`}
                  onClick={() => setSelectedFace(index)}
                >
                  Face {index + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="face-details">
        <div className="face-card">
          <h4>Face Details</h4>
          
          {celebrity && (
            <div className="celebrity-match">
              <h5>Celebrity Match!</h5>
              <p className="celebrity-name">{celebrity.name}</p>
              <p className="match-confidence">Match confidence: {celebrity.confidence}%</p>
              {celebrity.urls && celebrity.urls.length > 0 && (
                <div className="celebrity-links">
                  <p>Related links:</p>
                  <ul>
                    {celebrity.urls.map((url, index) => (
                      <li key={index}>
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          {url.replace(/^https?:\/\//, '').substring(0, 30)}...
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          
          <div className="face-attributes">
            <div className="attribute-group">
              <h5>Age</h5>
              <p>Estimated age range: {face.ageRange.Low} - {face.ageRange.High} years</p>
            </div>
            
            <div className="attribute-group">
              <h5>Gender</h5>
              <p>{face.gender.value} (Confidence: {face.gender.confidence}%)</p>
            </div>
            
            <div className="attribute-group">
              <h5>Emotions</h5>
              {face.emotions.length > 0 ? (
                <ul className="emotions-list">
                  {face.emotions.map((emotion, index) => (
                    <li key={index} className="emotion-item">
                      <span className="emotion-type">{emotion.type}:</span>
                      <span className="emotion-confidence">{emotion.confidence}%</span>
                      <div 
                        className="emotion-bar" 
                        style={{ width: `${emotion.confidence}%` }}
                      ></div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No strong emotions detected</p>
              )}
            </div>
            
            <div className="attribute-group">
              <h5>Features</h5>
              <ul className="features-list">
                {face.smile && (
                  <li>
                    Smiling: {face.smile.value ? 'Yes' : 'No'} 
                    ({face.smile.confidence}%)
                  </li>
                )}
                {face.eyeglasses && (
                  <li>
                    Eyeglasses: {face.eyeglasses.value ? 'Yes' : 'No'} 
                    ({face.eyeglasses.confidence}%)
                  </li>
                )}
                {face.sunglasses && (
                  <li>
                    Sunglasses: {face.sunglasses.value ? 'Yes' : 'No'} 
                    ({face.sunglasses.confidence}%)
                  </li>
                )}
                {face.beard && (
                  <li>
                    Beard: {face.beard.value ? 'Yes' : 'No'} 
                    ({face.beard.confidence}%)
                  </li>
                )}
                {face.mustache && (
                  <li>
                    Mustache: {face.mustache.value ? 'Yes' : 'No'} 
                    ({face.mustache.confidence}%)
                  </li>
                )}
                {face.eyesopen && (
                  <li>
                    Eyes Open: {face.eyesopen.value ? 'Yes' : 'No'} 
                    ({face.eyesopen.confidence}%)
                  </li>
                )}
                {face.mouthopen && (
                  <li>
                    Mouth Open: {face.mouthopen.value ? 'Yes' : 'No'} 
                    ({face.mouthopen.confidence}%)
                  </li>
                )}
              </ul>
            </div>
            
            {face.pose && (
              <div className="attribute-group">
                <h5>Pose</h5>
                <p>{formatPose(face.pose)}</p>
                <ul className="pose-details">
                  <li>Roll: {face.pose.roll.toFixed(1)}°</li>
                  <li>Yaw: {face.pose.yaw.toFixed(1)}°</li>
                  <li>Pitch: {face.pose.pitch.toFixed(1)}°</li>
                </ul>
              </div>
            )}
            
            {face.quality && (
              <div className="attribute-group">
                <h5>Image Quality</h5>
                <ul>
                  <li>Brightness: {face.quality.brightness.toFixed(2)}</li>
                  <li>Sharpness: {face.quality.sharpness.toFixed(2)}</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacesAnalysis;
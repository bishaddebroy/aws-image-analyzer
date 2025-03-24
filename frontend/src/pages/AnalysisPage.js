import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Loader from '../components/Common/Loader';
import ErrorDisplay from '../components/Common/ErrorDisplay';
import LabelsList from '../components/Analysis/LabelsList';
import FacesAnalysis from '../components/Analysis/FacesAnalysis';
import TextDisplay from '../components/Analysis/TextDisplay';
import ModerationLabels from '../components/Analysis/ModerationLabels';
import { getImageResults } from '../services/api';

const AnalysisPage = () => {
  const { imageId } = useParams();
  const [imageData, setImageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    loadImageResults();
    
    // Poll for results if the image is still processing
    let interval;
    if (imageData && imageData.status === 'processing') {
      interval = setInterval(loadImageResults, 5000); // Check every 5 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [imageId, imageData?.status]);

  const loadImageResults = async () => {
    if (!imageId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const results = await getImageResults(imageId);
      setImageData(results);
    } catch (err) {
      console.error('Error loading image results:', err);
      setError('Failed to load analysis results. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !imageData) {
    return <Loader message="Loading analysis results..." />;
  }

  if (error) {
    return (
      <div className="analysis-page">
        <ErrorDisplay message={error} />
        <Link to="/gallery" className="back-button">Back to Gallery</Link>
      </div>
    );
  }

  if (!imageData) {
    return (
      <div className="analysis-page">
        <ErrorDisplay message="Image not found" />
        <Link to="/gallery" className="back-button">Back to Gallery</Link>
      </div>
    );
  }

  const { imageUrl, fileName, status, results } = imageData;

  return (
    <div className="analysis-page">
      <div className="analysis-header">
        <h1>Image Analysis</h1>
        <Link to="/gallery" className="back-button">Back to Gallery</Link>
      </div>
      
      <div className="analysis-content">
        <div className="image-preview">
          <h2>{fileName || 'Image'}</h2>
          <img src={imageUrl} alt={fileName || 'Analyzed image'} />
          <div className={`status-badge ${status}`}>
            {status === 'pending' && 'Pending Analysis'}
            {status === 'processing' && 'Analysis in Progress...'}
            {status === 'completed' && 'Analysis Complete'}
            {status === 'failed' && 'Analysis Failed'}
          </div>
          
          {status === 'processing' && (
            <div className="processing-indicator">
              <Loader size="small" />
              <p>Processing your image. This may take a minute...</p>
            </div>
          )}
        </div>
        
        {status === 'completed' && (
          <div className="analysis-results">
            <div className="tabs">
              <button 
                className={`tab ${activeTab === 'summary' ? 'active' : ''}`}
                onClick={() => setActiveTab('summary')}
              >
                Summary
              </button>
              <button 
                className={`tab ${activeTab === 'objects' ? 'active' : ''}`}
                onClick={() => setActiveTab('objects')}
              >
                Objects & Scenes
              </button>
              <button 
                className={`tab ${activeTab === 'faces' ? 'active' : ''}`}
                onClick={() => setActiveTab('faces')}
              >
                Faces & People
              </button>
              <button 
                className={`tab ${activeTab === 'text' ? 'active' : ''}`}
                onClick={() => setActiveTab('text')}
              >
                Text
              </button>
              <button 
                className={`tab ${activeTab === 'moderation' ? 'active' : ''}`}
                onClick={() => setActiveTab('moderation')}
              >
                Moderation
              </button>
            </div>
            
            <div className="tab-content">
              {activeTab === 'summary' && (
                <div className="summary-tab">
                  <h3>Analysis Summary</h3>
                  
                  {results.summary && (
                    <div className="summary-cards">
                      <div className="summary-card">
                        <h4>What's in this image?</h4>
                        {results.summary.topLabels && results.summary.topLabels.length > 0 ? (
                          <ul className="summary-list">
                            {results.summary.topLabels.map((label, index) => (
                              <li key={index}>
                                {label.name} ({label.confidence}%)
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p>No objects detected</p>
                        )}
                      </div>
                      
                      <div className="summary-card">
                        <h4>People</h4>
                        {results.summary.faceCount > 0 ? (
                          <>
                            <p>{results.summary.faceCount} face(s) detected</p>
                            {results.summary.primaryEmotion && (
                              <p>Main emotion: {results.summary.primaryEmotion}</p>
                            )}
                            {results.summary.ageRange && (
                              <p>Age range: {results.summary.ageRange.Low} - {results.summary.ageRange.High} years</p>
                            )}
                            {results.summary.recognizedCelebrities && results.summary.recognizedCelebrities.length > 0 && (
                              <>
                                <p>Recognized celebrities:</p>
                                <ul className="summary-list">
                                  {results.summary.recognizedCelebrities.map((celeb, index) => (
                                    <li key={index}>{celeb.name}</li>
                                  ))}
                                </ul>
                              </>
                            )}
                          </>
                        ) : (
                          <p>No faces detected</p>
                        )}
                      </div>
                      
                      {results.summary.hasText && (
                        <div className="summary-card">
                          <h4>Text in Image</h4>
                          {results.summary.textSnippet ? (
                            <p className="text-snippet">{results.summary.textSnippet}</p>
                          ) : (
                            <p>Text detected (see Text tab)</p>
                          )}
                        </div>
                      )}
                      
                      <div className="summary-card">
                        <h4>Content Safety</h4>
                        {results.summary.isSafe ? (
                          <p className="safe-content">No unsafe content detected</p>
                        ) : (
                          <>
                            <p className="unsafe-content">Potentially unsafe content detected:</p>
                            <ul className="summary-list">
                              {results.summary.moderationIssues && results.summary.moderationIssues.map((issue, index) => (
                                <li key={index}>{issue.name} ({issue.confidence}%)</li>
                              ))}
                            </ul>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'objects' && (
                <div className="objects-tab">
                  <h3>Objects & Scenes</h3>
                  {results.labels ? (
                    <LabelsList labels={results.labels.labels || []} />
                  ) : (
                    <p>No object data available</p>
                  )}
                </div>
              )}
              
              {activeTab === 'faces' && (
                <div className="faces-tab">
                  <h3>Faces & People</h3>
                  <div className="faces-content">
                    {results.faces && results.faces.faces ? (
                      <FacesAnalysis 
                        facesData={results.faces} 
                        celebritiesData={results.celebrities}
                      />
                    ) : (
                      <p>No face data available</p>
                    )}
                  </div>
                </div>
              )}
              
              {activeTab === 'text' && (
                <div className="text-tab">
                  <h3>Text Detection</h3>
                  {results.text ? (
                    <TextDisplay textData={results.text} />
                  ) : (
                    <p>No text data available</p>
                  )}
                </div>
              )}
              
              {activeTab === 'moderation' && (
                <div className="moderation-tab">
                  <h3>Content Moderation</h3>
                  {results.moderation ? (
                    <ModerationLabels moderationData={results.moderation} />
                  ) : (
                    <p>No moderation data available</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        
        {status === 'failed' && (
          <div className="analysis-error">
            <h3>Analysis Failed</h3>
            <p>Sorry, we couldn't analyze this image. This could be due to:</p>
            <ul>
              <li>Unsupported image format</li>
              <li>Image too large or too small</li>
              <li>Service unavailable</li>
            </ul>
            <p>Please try again with a different image.</p>
            <Link to="/" className="button primary-button">Upload Another Image</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisPage;
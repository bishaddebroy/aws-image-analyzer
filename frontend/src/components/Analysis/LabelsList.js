import React, { useState } from 'react';

const LabelsList = ({ labels }) => {
  const [expandedLabels, setExpandedLabels] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [confidenceFilter, setConfidenceFilter] = useState(0);
  
  // Toggle expanded state for a label
  const toggleExpand = (labelName) => {
    setExpandedLabels(prev => ({
      ...prev,
      [labelName]: !prev[labelName]
    }));
  };
  
  // Filter labels based on search term and confidence filter
  const filteredLabels = labels.filter(label => {
    const matchesSearch = label.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesConfidence = label.confidence >= confidenceFilter;
    return matchesSearch && matchesConfidence;
  });
  
  // Group labels by parent categories
  const groupedLabels = {};
  filteredLabels.forEach(label => {
    const parents = label.parents || [];
    if (parents.length === 0) {
      // Top-level category
      if (!groupedLabels['Main Categories']) {
        groupedLabels['Main Categories'] = [];
      }
      groupedLabels['Main Categories'].push(label);
    } else {
      // Group by first parent
      const parent = parents[0];
      if (!groupedLabels[parent]) {
        groupedLabels[parent] = [];
      }
      groupedLabels[parent].push(label);
    }
  });
  
  return (
    <div className="labels-list">
      <div className="filters">
        <div className="search-filter">
          <input
            type="text"
            placeholder="Search objects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="confidence-filter">
          <label>
            Min. Confidence: {confidenceFilter}%
            <input
              type="range"
              min="0"
              max="100"
              value={confidenceFilter}
              onChange={(e) => setConfidenceFilter(Number(e.target.value))}
              className="confidence-slider"
            />
          </label>
        </div>
      </div>
      
      {filteredLabels.length === 0 ? (
        <div className="no-labels">
          <p>No objects or scenes match your filters.</p>
        </div>
      ) : (
        <>
          <div className="labels-count">
            <p>Found {filteredLabels.length} objects/scenes in this image</p>
          </div>
          
          <div className="labels-categories">
            {Object.entries(groupedLabels).map(([category, categoryLabels]) => (
              <div className="label-category" key={category}>
                <h4 className="category-title">{category}</h4>
                
                <div className="category-labels">
                  {categoryLabels.map((label) => (
                    <div 
                      className="label-item" 
                      key={label.name}
                    >
                      <div 
                        className="label-header"
                        onClick={() => toggleExpand(label.name)}
                      >
                        <span className="label-name">{label.name}</span>
                        <span className="label-confidence">
                          {label.confidence}%
                        </span>
                        {label.instances && label.instances.length > 0 && (
                          <span className="expand-icon">
                            {expandedLabels[label.name] ? '▼' : '►'}
                          </span>
                        )}
                      </div>
                      
                      {expandedLabels[label.name] && label.instances && label.instances.length > 0 && (
                        <div className="label-instances">
                          <p>{label.instances.length} instances found:</p>
                          <ul className="instances-list">
                            {label.instances.map((instance, index) => (
                              <li key={index}>
                                Instance {index + 1} (Confidence: {instance.confidence}%)
                                <div className="bounding-box-info">
                                  Position: Left {Math.round(instance.boundingBox.left * 100)}%, 
                                  Top {Math.round(instance.boundingBox.top * 100)}%
                                </div>
                                <div className="bounding-box-info">
                                  Size: Width {Math.round(instance.boundingBox.width * 100)}%, 
                                  Height {Math.round(instance.boundingBox.height * 100)}%
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LabelsList;
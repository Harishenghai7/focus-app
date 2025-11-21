/**
 * AudienceSelector Component
 * Select who can see your post (privacy settings)
 */

import React, { useState } from 'react';
import './AudienceSelector.css';

const AudienceSelector = ({ value = 'public', onChange, onClose }) => {
  const audiences = [
    {
      id: 'public',
      icon: '🌍',
      title: 'Public',
      description: 'Anyone on or off Focusly',
      color: '#10b981'
    },
    {
      id: 'followers',
      icon: '👥',
      title: 'Followers',
      description: 'Your followers on Focusly',
      color: '#3b82f6'
    },
    {
      id: 'close_friends',
      icon: '⭐',
      title: 'Close Friends',
      description: 'Only your close friends',
      color: '#8b5cf6'
    },
    {
      id: 'private',
      icon: '🔒',
      title: 'Only Me',
      description: 'Only you can see this',
      color: '#ef4444'
    }
  ];

  const [selected, setSelected] = useState(value);

  const handleSelect = (audienceId) => {
    setSelected(audienceId);
    onChange(audienceId);
  };

  const handleDone = () => {
    onClose();
  };

  const selectedAudience = audiences.find(a => a.id === selected);

  return (
    <div className="audience-selector">
      <div className="audience-selector-header">
        <h3>Audience</h3>
        <button
          className="audience-selector-close"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="audience-selector-subtitle">
        Choose who can see this post
      </div>

      {/* Audience Options */}
      <div className="audience-options">
        {audiences.map((audience) => (
          <button
            key={audience.id}
            className={`audience-option ${selected === audience.id ? 'selected' : ''}`}
            onClick={() => handleSelect(audience.id)}
            style={{
              '--audience-color': audience.color
            }}
          >
            <div className="audience-option-icon-wrapper">
              <span className="audience-option-icon">{audience.icon}</span>
              {selected === audience.id && (
                <div className="audience-option-check">✓</div>
              )}
            </div>
            <div className="audience-option-content">
              <div className="audience-option-title">{audience.title}</div>
              <div className="audience-option-description">
                {audience.description}
              </div>
            </div>
            <div className={`audience-option-radio ${selected === audience.id ? 'checked' : ''}`}>
              {selected === audience.id && <div className="audience-option-radio-dot"></div>}
            </div>
          </button>
        ))}
      </div>

      {/* Additional Options for Close Friends */}
      {selected === 'close_friends' && (
        <div className="audience-additional">
          <div className="audience-additional-banner">
            <span className="audience-additional-icon">💡</span>
            <div>
              <div className="audience-additional-title">Manage Close Friends</div>
              <div className="audience-additional-text">
                Add or remove people from your close friends list
              </div>
            </div>
            <button className="audience-additional-button">
              Manage
            </button>
          </div>
        </div>
      )}

      {/* Selected Preview */}
      <div className="audience-selected-preview">
        <div className="audience-selected-icon" style={{ background: selectedAudience?.color }}>
          {selectedAudience?.icon}
        </div>
        <div className="audience-selected-info">
          <div className="audience-selected-title">
            Your post will be visible to
          </div>
          <div className="audience-selected-description">
            {selectedAudience?.description}
          </div>
        </div>
      </div>

      {/* Done Button */}
      <div className="audience-selector-footer">
        <button
          className="audience-selector-done"
          onClick={handleDone}
        >
          Done
        </button>
      </div>
    </div>
  );
};

export default AudienceSelector;

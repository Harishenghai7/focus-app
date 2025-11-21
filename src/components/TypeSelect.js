import React from 'react';
import './TypeSelect.css';

const TYPE_OPTIONS = [
  {
    id: 'post',
    name: 'Post',
    icon: '📸',
    emoji: '✨',
    description: 'Share photos & videos',
    color: '#FFD600',
    features: ['Up to 10 images', 'Videos & Reels', 'Carousel posts']
  },
  {
    id: 'boltz',
    name: 'Boltz',
    icon: '⚡',
    emoji: '🎵',
    description: 'Short video with music',
    color: '#8B7FD7',
    features: ['15-60 seconds', 'Add music', 'Quick & fun']
  },
  {
    id: 'flash',
    name: 'Flash',
    icon: '🔥',
    emoji: '💫',
    description: '24-hour story',
    color: '#EE7BFA',
    features: ['Disappears in 24h', 'Quick share', 'Casual moments']
  }
];

const TypeSelect = ({ selectedType, onTypeSelect }) => {
  return (
    <div className="type-select-container" role="radiogroup" aria-label="Select post type">
      <div className="type-select-header">
        <h2>What would you like to create?</h2>
        <p>Choose the type of content you want to share</p>
      </div>

      <div className="type-options-grid">
        {TYPE_OPTIONS.map((type) => {
          const isSelected = selectedType === type.id;
          
          return (
            <button
              key={type.id}
              className={`type-option-card ${isSelected ? 'selected' : ''}`}
              onClick={() => onTypeSelect(type.id)}
              role="radio"
              aria-checked={isSelected}
              aria-label={`Select ${type.name}: ${type.description}`}
              style={{ '--type-color': type.color }}
            >
              <div className="type-card-glow" />
              
              <div className="type-card-header">
                <div className="type-icon">{type.icon}</div>
                <div className="type-emoji">{type.emoji}</div>
              </div>

              <div className="type-card-content">
                <h3>{type.name}</h3>
                <p>{type.description}</p>
              </div>

              <ul className="type-features">
                {type.features.map((feature, index) => (
                  <li key={index}>
                    <span className="feature-dot">•</span>
                    {feature}
                  </li>
                ))}
              </ul>

              {isSelected && (
                <div className="selected-indicator">
                  <span className="check-icon">✓</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TypeSelect;

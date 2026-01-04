import React from 'react';
import PropTypes from 'prop-types';
import './RadioGroup.css';

/**
 * RadioGroup - Radio button group component
 * Features:
 * - Multiple radio options
 * - Icon support
 * - Accessible keyboard navigation
 * - Disabled state
 * 
 * @param {string} name - Radio group name
 * @param {Array} options - Array of {id, label, icon?} objects
 * @param {string} value - Selected value
 * @param {Function} onChange - Change handler
 * @param {boolean} disabled - Disabled state
 */
const RadioGroup = ({ name, options, value, onChange, disabled = false }) => {
  const handleChange = (optionId) => {
    if (!disabled) {
      onChange(optionId);
    }
  };

  const handleKeyDown = (e, optionId) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleChange(optionId);
    }
  };

  return (
    <div className="radio-group" role="radiogroup" aria-label={name}>
      {options.map((option) => {
        const isSelected = value === option.id;
        
        return (
          <label
            key={option.id}
            className={`radio-option ${isSelected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
            htmlFor={`${name}-${option.id}`}
          >
            <input
              type="radio"
              id={`${name}-${option.id}`}
              name={name}
              value={option.id}
              checked={isSelected}
              onChange={() => handleChange(option.id)}
              onKeyDown={(e) => handleKeyDown(e, option.id)}
              disabled={disabled}
              className="radio-input"
              aria-checked={isSelected}
            />
            <span className="radio-indicator">
              <span className="radio-dot"></span>
            </span>
            <span className="radio-content">
              {option.icon && <span className="radio-icon">{option.icon}</span>}
              <span className="radio-label">{option.label}</span>
            </span>
          </label>
        );
      })}
    </div>
  );
};

RadioGroup.propTypes = {
  name: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.string
    })
  ).isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

export default React.memo(RadioGroup);

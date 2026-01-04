import React from 'react';
import { motion } from 'framer-motion';
import './StatCard.css';

/**
 * StatCard Component
 * Displays a single statistic with icon, value, label, and optional change indicator
 */
const StatCard = ({ 
  icon, 
  label, 
  value, 
  change, 
  trend, 
  onClick,
  className = '',
  color = 'primary'
}) => {
  const getTrendIcon = () => {
    if (!trend) return null;
    return trend === 'up' ? '📈' : trend === 'down' ? '📉' : '➡️';
  };

  const getTrendClass = () => {
    if (!trend) return '';
    return trend === 'up' ? 'trend-up' : trend === 'down' ? 'trend-down' : 'trend-neutral';
  };

  return (
    <motion.div 
      className={`stat-card ${className} stat-card-${color}`}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="stat-card-content">
        <div className="stat-card-icon">
          {icon}
        </div>
        
        <div className="stat-card-info">
          <div className="stat-card-value">
            {value}
          </div>
          <div className="stat-card-label">
            {label}
          </div>
        </div>

        {(change !== undefined || trend) && (
          <div className={`stat-card-change ${getTrendClass()}`}>
            {getTrendIcon()}
            {change !== undefined && (
              <span className="change-value">
                {change > 0 ? '+' : ''}{change}%
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StatCard;

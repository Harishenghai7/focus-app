// src/components/EmptyState.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './EmptyState.css';

const EmptyState = ({ 
  icon = '👋', 
  title = 'Welcome to Focus!',
  message = 'Follow people to see their posts here',
  actionLabel = 'Explore',
  actionPath = '/explore'
}) => {
  const navigate = useNavigate();

  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h2 className="empty-state-title">{title}</h2>
      <p className="empty-state-message">{message}</p>
      <button 
        className="empty-state-button"
        onClick={() => navigate(actionPath)}
      >
        {actionLabel}
      </button>
    </div>
  );
};

export default EmptyState;

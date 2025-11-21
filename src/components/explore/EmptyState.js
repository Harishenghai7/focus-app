import React from 'react';
import './EmptyState.css';

const EmptyState = ({ category, hasSearch }) => {
  const getEmptyStateContent = () => {
    if (hasSearch) {
      return {
        icon: (
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M11 8v6M8 11h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ),
        title: 'No results found',
        description: 'Try adjusting your search or exploring different categories.',
        actionText: 'Clear Search'
      };
    }

    switch (category) {
      case 'People':
        return {
          icon: (
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <path
                d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
            </svg>
          ),
          title: 'No suggested people',
          description: 'Check back later for new user suggestions.',
          actionText: null
        };
      case 'Photos':
        return {
          icon: (
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
              <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
              <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ),
          title: 'No photos found',
          description: 'Try exploring other categories or check back later.',
          actionText: 'View All'
        };
      case 'Videos':
        return {
          icon: (
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <path
                d="M23 7l-7 5 7 5V7z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <rect x="1" y="5" width="15" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
            </svg>
          ),
          title: 'No videos found',
          description: 'Try exploring other categories or check back later.',
          actionText: 'View All'
        };
      case 'Boltz':
        return {
          icon: (
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <path
                d="M13 2L3 14h8l-2 8 10-12h-8l2-8z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ),
          title: 'No Boltz found',
          description: 'Short-form videos will appear here when available.',
          actionText: 'View All'
        };
      case 'Flash':
        return {
          icon: (
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ),
          title: 'No Flash stories',
          description: 'Flash stories will appear here when available.',
          actionText: 'View All'
        };
      default:
        return {
          icon: (
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
              <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
              <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
              <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
            </svg>
          ),
          title: 'No posts yet',
          description: 'Check back later for new content to explore.',
          actionText: null
        };
    }
  };

  const content = getEmptyStateContent();

  return (
    <div className="empty-state" role="status">
      <div className="empty-state-content">
        <div className="empty-state-icon" aria-hidden="true">
          {content.icon}
        </div>
        
        <h2 className="empty-state-title">{content.title}</h2>
        
        <p className="empty-state-description">{content.description}</p>
        
        {content.actionText && (
          <button className="empty-state-action-btn" type="button">
            {content.actionText}
          </button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;

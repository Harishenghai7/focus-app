// src/components/FlashStories.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './FlashStories.css';

const FlashStories = ({ stories = [], currentUser, onAddStory }) => {
  const navigate = useNavigate();

  const handleStoryClick = (userId) => {
    navigate(`/flash/${userId}`);
  };

  return (
    <div className="flash-stories-container">
      <div className="flash-stories-scroll">
        {/* Your Story - Always First */}
        <div 
          className="flash-story flash-add-story" 
          onClick={onAddStory || (() => navigate('/create'))}
          role="button"
          tabIndex={0}
        >
          <div className="flash-story-avatar-wrapper">
            <img
              src={currentUser?.avatar_url || '/default-avatar.png'}
              alt="Your story"
              className="flash-story-avatar"
            />
            <div className="flash-add-icon">+</div>
          </div>
          <span className="flash-story-name">Your Story</span>
        </div>

        {/* Other Users' Stories */}
        {stories.map((story) => (
          <div
            key={story.id}
            className="flash-story"
            onClick={() => handleStoryClick(story.user_id)}
            role="button"
            tabIndex={0}
          >
            <div className={`flash-story-ring ${story.viewed ? 'viewed' : 'unviewed'}`}>
              <img
                src={story.users?.avatar_url || '/default-avatar.png'}
                alt={story.users?.username || 'User'}
                className="flash-story-avatar"
              />
            </div>
            <span className="flash-story-name">
              {story.users?.username || 'User'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FlashStories;

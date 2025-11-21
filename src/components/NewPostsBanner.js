// src/components/NewPostsBanner.js
import React from 'react';
import './NewPostsBanner.css';

const NewPostsBanner = ({ onClick }) => {
  return (
    <button className="new-posts-banner" onClick={onClick}>
      <span className="new-posts-icon">✨</span>
      <span className="new-posts-text">New posts available</span>
      <span className="new-posts-icon">✨</span>
    </button>
  );
};

export default NewPostsBanner;

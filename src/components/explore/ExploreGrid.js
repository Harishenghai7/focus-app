import React from 'react';
import ExploreTile from './ExploreTile';
import './ExploreGrid.css';

const ExploreGrid = ({ posts, onPostClick, currentUserId }) => {
  if (!posts || posts.length === 0) {
    return null;
  }

  return (
    <div 
      className="explore-grid"
      role="feed"
      aria-label="Explore posts"
    >
      {posts.map((post, index) => (
        <ExploreTile
          key={post.id}
          post={post}
          onClick={() => onPostClick(post)}
          currentUserId={currentUserId}
          index={index}
        />
      ))}
    </div>
  );
};

export default ExploreGrid;

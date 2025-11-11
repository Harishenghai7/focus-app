import React, { useState } from 'react';

export const LikeButton = ({ postId, initialLikes = 0, onLike }) => {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(initialLikes);

  const handleLike = () => {
    setLiked(!liked);
    setLikes(prev => liked ? prev - 1 : prev + 1);
    onLike?.(postId, !liked);
  };

  return (
    <button 
      onClick={handleLike}
      className={`like-button ${liked ? 'liked' : ''}`}
      data-testid="like-button"
    >
      ❤️ {likes}
    </button>
  );
};

export const CommentButton = ({ postId, onComment }) => {
  return (
    <button 
      onClick={() => onComment?.(postId)}
      className="comment-button"
      data-testid="comment-button"
    >
      💬 Comment
    </button>
  );
};
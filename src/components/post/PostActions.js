import React from 'react';

const PostActions = ({ likes = 0, comments = 0 }) => {
  return (
    <div className="post-actions">
      <span>❤️ {likes}</span>
      <span>💬 {comments}</span>
    </div>
  );
};

export default PostActions;

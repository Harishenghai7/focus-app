import React from 'react';

const PostHeader = ({ user, createdAt }) => {
  return (
    <div className="post-header">
      <img
        src={user?.avatar_url || '/avatar.png'}
        alt="avatar"
        className="post-avatar"
      />

      <div className="post-user-info">
        <strong>{user?.full_name || user?.username}</strong>
        <span className="post-time">
          {new Date(createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
};

export default PostHeader;

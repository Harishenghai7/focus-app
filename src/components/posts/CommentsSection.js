import React from 'react';
import CommentsDrawer from '../post/CommentsDrawer';

const CommentsSection = ({ postId, onClose = () => {} }) => (
    <CommentsDrawer targetId={postId} targetType="post" onClose={onClose} />
);

export default CommentsSection;

import React from 'react';
import CommentsDrawer from '../post/CommentsDrawer';

const CommentsSection = ({ targetId, targetType = 'post', onClose = () => {} }) => (
    <CommentsDrawer targetId={targetId} targetType={targetType} onClose={onClose} />
);

export default CommentsSection;

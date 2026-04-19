import React from 'react';
import PostDetailModal from '../modals/PostDetailModal';

const BoltzDetailModal = ({ isOpen, onClose, boltz }) => {
    if (!isOpen || !boltz) return null;

    const normalizedBoltz = {
        ...boltz,
        type: 'boltz',
        media_url: boltz.media_url || boltz.video_url || boltz.media?.[0]?.url || boltz.thumbnail_url || null,
    };

    return <PostDetailModal post={normalizedBoltz} onClose={onClose} />;
};

export default BoltzDetailModal;


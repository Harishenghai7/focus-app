import React from 'react';
import styles from './AttachmentMenu.module.css';

const AttachmentMenu = ({
    onClose,
    onPhotoClick,
    onVideoClick,
    onCameraClick,
    onDocumentClick,
    onAudioClick,
    onLocationClick,
    onPollClick,
    onEventClick,
    onVideoNoteClick,
    onStickerClick,
    onGifClick,
    isGroup = false
}) => {
    const menuItems = [
        {
            id: 'camera',
            icon: '📷',
            label: 'Camera',
            color: '#ef4444',
            onClick: onCameraClick
        },
        {
            id: 'photos',
            icon: '🖼️',
            label: 'Photos & Videos',
            color: '#8b5cf6',
            onClick: onPhotoClick
        },
        {
            id: 'document',
            icon: '📄',
            label: 'Document',
            color: '#3b82f6',
            onClick: onDocumentClick
        },
        {
            id: 'audio',
            icon: '🎵',
            label: 'Audio',
            color: '#f59e0b',
            onClick: onAudioClick
        },
        {
            id: 'location',
            icon: '📍',
            label: 'Location',
            color: '#10b981',
            onClick: onLocationClick
        },
        {
            id: 'poll',
            icon: '📊',
            label: 'Poll',
            color: '#6366f1',
            onClick: onPollClick,
            groupOnly: true
        },
        {
            id: 'event',
            icon: '📅',
            label: 'Event',
            color: '#ec4899',
            onClick: onEventClick,
            groupOnly: true
        },
        {
            id: 'videonote',
            icon: '🎥',
            label: 'Video Note',
            color: '#14b8a6',
            onClick: onVideoNoteClick
        },
        {
            id: 'sticker',
            icon: '😊',
            label: 'Sticker',
            color: '#f97316',
            onClick: onStickerClick
        },
        {
            id: 'gif',
            icon: 'GIF',
            label: 'GIF',
            color: '#a855f7',
            onClick: onGifClick
        }
    ];

    const visibleItems = menuItems.filter(item => !item.groupOnly || isGroup);

    const handleItemClick = (item) => {
        item.onClick?.();
        onClose();
    };

    return (
        <>
            <div className={styles.overlay} onClick={onClose} />
            <div className={styles.menu}>
                <div className={styles.grid}>
                    {visibleItems.map((item, index) => (
                        <button
                            key={item.id}
                            className={styles.item}
                            onClick={() => handleItemClick(item)}
                            style={{
                                animationDelay: `${index * 0.03}s`,
                                '--item-color': item.color
                            }}
                        >
                            <div className={styles.iconWrapper}>
                                <span className={styles.icon}>{item.icon}</span>
                            </div>
                            <span className={styles.label}>{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
};

export default AttachmentMenu;

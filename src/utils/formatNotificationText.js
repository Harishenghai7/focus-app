import React from 'react';

export const formatNotificationText = (notification) => {
    if (!notification) return null;

    const actorName = notification.actor?.username || 'Someone';
    const contentType = notification.content_type || 'post';

    switch (notification.type) {
        case 'like':
            return (
                <>
                    <strong>{actorName}</strong> liked your {contentType}
                </>
            );

        case 'comment':
            const commentText = notification.metadata?.comment_text;
            return (
                <>
                    <strong>{actorName}</strong> commented on your {contentType}
                    {commentText && (
                        <>
                            : "<span className="comment-preview">{truncateText(commentText, 50)}</span>"
                        </>
                    )}
                </>
            );

        case 'mention':
            return (
                <>
                    <strong>{actorName}</strong> mentioned you in a {contentType}
                </>
            );

        case 'follow':
            return (
                <>
                    <strong>{actorName}</strong> started following you
                </>
            );

        case 'boltz':
            return (
                <>
                    <strong>{actorName}</strong> posted a new Boltz
                </>
            );

        case 'message_request':
            return (
                <>
                    <strong>{actorName}</strong> sent you a message request
                </>
            );

        case 'system':
            return notification.text || 'System notification';

        default:
            return notification.text || 'You have a new notification';
    }
};

export const getNotificationIcon = (type) => {
    switch (type) {
        case 'like':
            return 'Heart';
        case 'comment':
            return 'MessageCircle';
        case 'mention':
            return 'AtSign';
        case 'follow':
            return 'UserPlus';
        case 'boltz':
            return 'Zap';
        case 'message_request':
            return 'Mail';
        case 'system':
            return 'Bell';
        default:
            return 'Bell';
    }
};

export const getNotificationColor = (type) => {
    switch (type) {
        case 'like':
            return '#ff4d6d';
        case 'comment':
            return '#4dabf7';
        case 'mention':
            return '#ffd43b';
        case 'follow':
            return '#51cf66';
        case 'boltz':
            return '#a78bfa';
        case 'message_request':
            return '#ff6b6b';
        case 'system':
            return '#868e96';
        default:
            return '#a78bfa';
    }
};

const truncateText = (text, maxLength) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

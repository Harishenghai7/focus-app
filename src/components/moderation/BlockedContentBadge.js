import React from 'react';

const BlockedContentBadge = ({ reason, style }) => {
    return (
        <div style={{
            backgroundColor: '#ffeaa7',
            color: '#d63031',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            ...style
        }}>
            <span>⚠️</span>
            <span>Hidden: {reason || 'Content Violation'}</span>
        </div>
    );
};

export default BlockedContentBadge;

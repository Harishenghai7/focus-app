// ═══════════════════════════════════════════════════════════════════════
// 🔐 SOVEREIGN INBOX PANE - Glassmorphism Inbox Interface
// Floating Cards with Sovereign Pulse
// ═══════════════════════════════════════════════════════════════════════

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import styles from './SovereignWhisper.module.css';

// Icons
const Icons = {
    search: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
        </svg>
    ),
    newMessage: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
    ),
    shield: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
    ),
    lock: () => (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    ),
    unread: () => (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="6" />
        </svg>
    )
};

// Trust Shield Indicator for Inbox
const TrustShieldIndicator = () => (
    <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '16px',
        height: '16px',
        background: 'linear-gradient(135deg, #FFD700, #FFA000)',
        borderRadius: '50%',
        boxShadow: '0 0 8px rgba(255, 215, 0, 0.4)'
    }}>
        <Icons.shield />
    </div>
);

// Single Thread Item Component
const ThreadItem = ({ chat, isActive, onClick, currentUserId }) => {
    const hasUnread = chat.unreadCount > 0;
    const isOnline = chat.user?.is_online;

    // Format the last message time
    const formatLastMessageTime = (timestamp) => {
        if (!timestamp) return '';
        try {
            return formatDistanceToNow(new Date(timestamp), { addSuffix: false });
        } catch {
            return '';
        }
    };

    return (
        <div
            onClick={() => onClick(chat.id)}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                margin: '4px 8px',
                background: isActive 
                    ? 'rgba(126, 87, 194, 0.15)' 
                    : hasUnread 
                        ? 'rgba(126, 87, 194, 0.08)' 
                        : 'rgba(126, 87, 194, 0.03)',
                backdropFilter: 'blur(25px)',
                borderRadius: '16px',
                border: isActive 
                    ? '1px solid rgba(126, 87, 194, 0.4)' 
                    : hasUnread
                        ? '1px solid rgba(126, 87, 194, 0.3)'
                        : '1px solid rgba(126, 87, 194, 0.1)',
                boxShadow: isActive 
                    ? '0 4px 20px rgba(126, 87, 194, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)' 
                    : hasUnread
                        ? '0 2px 12px rgba(126, 87, 194, 0.15)'
                        : '0 2px 8px rgba(0, 0, 0, 0.1)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(126, 87, 194, 0.1)';
                e.currentTarget.style.transform = 'translateX(4px)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = isActive 
                    ? 'rgba(126, 87, 194, 0.15)' 
                    : hasUnread 
                        ? 'rgba(126, 87, 194, 0.08)' 
                        : 'rgba(126, 87, 194, 0.03)';
                e.currentTarget.style.transform = 'translateX(0)';
            }}
        >
            {/* Sovereign Pulse for new messages */}
            {hasUnread && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '4px',
                    transform: 'translateY(-50%)',
                    width: '3px',
                    height: '40px',
                    background: 'linear-gradient(180deg, #7E57C2, #B39DDB, #7E57C2)',
                    borderRadius: '2px',
                    boxShadow: '0 0 12px rgba(126, 87, 194, 0.8)',
                    animation: 'pulseGlow 2s ease-in-out infinite'
                }} />
            )}

            {/* Avatar Container */}
            <div style={{ position: 'relative' }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: chat.user?.avatar_url 
                        ? `url(${chat.user.avatar_url}) center/cover` 
                        : 'linear-gradient(135deg, #7E57C2, #512DA8)',
                    border: isOnline 
                        ? '2px solid #00E676' 
                        : '2px solid rgba(126, 87, 194, 0.3)',
                    boxShadow: isOnline 
                        ? '0 0 12px rgba(0, 230, 118, 0.4)' 
                        : '0 2px 8px rgba(0, 0, 0, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: 600,
                    color: 'white'
                }}>
                    {!chat.user?.avatar_url && (chat.user?.username?.[0] || '?').toUpperCase()}
                </div>
                
                {/* Online indicator */}
                {isOnline && (
                    <div style={{
                        position: 'absolute',
                        bottom: '2px',
                        right: '2px',
                        width: '12px',
                        height: '12px',
                        background: '#00E676',
                        borderRadius: '50%',
                        border: '2px solid #0D0D0D',
                        boxShadow: '0 0 8px rgba(0, 230, 118, 0.6)'
                    }} />
                )}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '4px'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        <span style={{
                            fontSize: '15px',
                            fontWeight: hasUnread ? 600 : 500,
                            color: '#E8E8F0',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}>
                            {chat.user?.username || 'Unknown'}
                        </span>
                        <TrustShieldIndicator />
                    </div>
                    
                    <span style={{
                        fontSize: '12px',
                        color: hasUnread ? '#B39DDB' : 'rgba(232, 232, 240, 0.5)',
                        fontWeight: hasUnread ? 500 : 400,
                        flexShrink: 0
                    }}>
                        {formatLastMessageTime(chat.last_message_time)}
                    </span>
                </div>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px'
                }}>
                    <p style={{
                        fontSize: '13px',
                        color: hasUnread ? 'rgba(232, 232, 240, 0.9)' : 'rgba(232, 232, 240, 0.6)',
                        fontWeight: hasUnread ? 500 : 400,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        flex: 1,
                        margin: 0
                    }}>
                        {chat.last_message || 'No messages yet'}
                    </p>

                    {/* Unread count badge */}
                    {hasUnread && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: '20px',
                            height: '20px',
                            padding: '0 6px',
                            background: 'linear-gradient(135deg, #7E57C2, #512DA8)',
                            borderRadius: '10px',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: 'white',
                            boxShadow: '0 2px 8px rgba(126, 87, 194, 0.4)'
                        }}>
                            {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Main Inbox Pane Component
const SovereignInboxPane = ({
    chats,
    activeChatId,
    onChatSelect,
    onNewMessage,
    currentUserId,
    loading
}) => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            background: 'linear-gradient(180deg, #0D0D0D 0%, #1A1A2E 100%)',
            position: 'relative'
        }}>
            {/* Ambient glow */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '200px',
                background: 'radial-gradient(ellipse at 50% 0%, rgba(126, 87, 194, 0.1) 0%, transparent 70%)',
                pointerEvents: 'none',
                zIndex: 0
            }} />

            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid rgba(126, 87, 194, 0.15)',
                position: 'relative',
                zIndex: 1
            }}>
                <h1 style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: '#E8E8F0',
                    margin: 0,
                    letterSpacing: '-0.5px'
                }}>
                    Messages
                </h1>
                
                <button
                    onClick={onNewMessage}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '40px',
                        height: '40px',
                        background: 'linear-gradient(135deg, #7E57C2, #512DA8)',
                        border: 'none',
                        borderRadius: '50%',
                        color: 'white',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(126, 87, 194, 0.4)',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(126, 87, 194, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(126, 87, 194, 0.4)';
                    }}
                >
                    <Icons.newMessage />
                </button>
            </div>

            {/* Search Bar */}
            <div style={{
                padding: '12px 16px',
                position: 'relative',
                zIndex: 1
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 14px',
                    background: 'rgba(126, 87, 194, 0.05)',
                    backdropFilter: 'blur(25px)',
                    borderRadius: '24px',
                    border: '1px solid rgba(126, 87, 194, 0.2)'
                }}>
                    <Icons.search />
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        style={{
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            color: '#E8E8F0',
                            fontSize: '14px'
                        }}
                    />
                </div>
            </div>

            {/* Chat List */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '4px 0',
                position: 'relative',
                zIndex: 1,
                scrollbarWidth: 'thin',
                scrollbarColor: '#512DA8 transparent'
            }}>
                {loading ? (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '40px 20px',
                        gap: '16px'
                    }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            border: '3px solid rgba(126, 87, 194, 0.2)',
                            borderTopColor: '#7E57C2',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }} />
                        <span style={{ color: 'rgba(232, 232, 240, 0.5)', fontSize: '14px' }}>
                            Loading conversations...
                        </span>
                    </div>
                ) : chats.length === 0 ? (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '60px 20px',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            marginBottom: '16px',
                            opacity: 0.3,
                            color: '#B39DDB'
                        }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                        </div>
                        <p style={{
                            fontSize: '16px',
                            color: '#E8E8F0',
                            marginBottom: '8px'
                        }}>
                            No messages yet
                        </p>
                        <p style={{
                            fontSize: '14px',
                            color: 'rgba(232, 232, 240, 0.5)'
                        }}>
                            Start a secure conversation with someone
                        </p>
                    </div>
                ) : (
                    chats.map(chat => (
                        <ThreadItem
                            key={chat.id}
                            chat={chat}
                            isActive={chat.id === activeChatId}
                            onClick={onChatSelect}
                            currentUserId={currentUserId}
                        />
                    ))
                )}
            </div>

            {/* Encryption Footer */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '12px',
                borderTop: '1px solid rgba(126, 87, 194, 0.1)',
                fontSize: '12px',
                color: 'rgba(232, 232, 240, 0.4)',
                position: 'relative',
                zIndex: 1
            }}>
                <Icons.lock />
                <span>End-to-End Encrypted</span>
            </div>
        </div>
    );
};

// Add keyframes for animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    @keyframes pulseGlow {
        0%, 100% { opacity: 1; box-shadow: 0 0 12px rgba(126, 87, 194, 0.8); }
        50% { opacity: 0.6; box-shadow: 0 0 20px rgba(126, 87, 194, 0.4); }
    }
`;
document.head.appendChild(styleSheet);

export default SovereignInboxPane;

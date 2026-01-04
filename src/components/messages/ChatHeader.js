import React, { useState, useRef, useEffect } from 'react';
import Avatar from '../shared/Avatar';
import { formatTimeAgo } from '../../utils/formatTimeAgo';
import styles from './ChatHeader.module.css';

const ChatHeader = ({
    user,
    onBack,
    onCall,
    onVideoCall,
    onInfo,
    onSearch,
    onShowPinned,
    onSchedule,
    onDisappearingMessages,
    onReadReceipts,
    onPINLock
}) => {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);

    const getOnlineStatus = () => {
        if (user?.is_online) return 'Online';
        if (user?.last_seen) return `Active ${formatTimeAgo(user.last_seen)}`;
        return 'Offline';
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };

        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMenu]);

    const handleMenuItemClick = (callback) => {
        setShowMenu(false);
        callback?.();
    };

    return (
        <div className={styles.chatHeader}>
            <div className={styles.leftSection}>
                {onBack && (
                    <button className={styles.backButton} onClick={onBack} aria-label="Back to inbox">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                )}

                <div className={styles.userInfo} onClick={onInfo}>
                    <Avatar
                        src={user?.avatar_url}
                        alt={user?.full_name || user?.username}
                        size="md"
                    />
                    <div className={styles.userDetails}>
                        <div className={styles.userName}>
                            <span className={styles.name}>{user?.full_name || user?.username}</span>
                            {user?.is_verified && (
                                <svg className={styles.verifiedBadge} width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M8 0L9.79611 2.33689L12.7023 2.47023L12.1803 5.34164L14 7.5L12.1803 9.65836L12.7023 12.5298L9.79611 12.6631L8 15L6.20389 12.6631L3.29772 12.5298L3.81967 9.65836L2 7.5L3.81967 5.34164L3.29772 2.47023L6.20389 2.33689L8 0Z" fill="var(--primary-lavender)" />
                                    <path d="M6 8L7.5 9.5L10.5 6.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            )}
                        </div>
                        <span className={`${styles.status} ${user?.is_online ? styles.online : ''}`}>
                            {getOnlineStatus()}
                        </span>
                    </div>
                </div>
            </div>

            <div className={styles.actions}>
                {/* Audio Call */}
                <button
                    className={styles.actionButton}
                    onClick={onCall}
                    aria-label="Voice call"
                    title="Voice call"
                >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M18.3 14.9c-1.2-1.2-2.4-1.2-3.6 0-.8.8-1.4 1.4-2.2 2.2-.2.2-.4.2-.6.1-1.2-.6-2.4-1.4-3.6-2.4-1.6-1.4-3-3-4.2-4.8-.6-.9-1.2-1.8-1.6-2.8-.1-.2 0-.4.2-.6.8-.8 1.4-1.6 2.2-2.4 1.2-1.2 1.2-2.4 0-3.6L3.7.4C2.5-.8 1.3-.8.1.4c-.8.8-1.4 1.6-2.2 2.4C-2.5 3.2-2.7 3.8-2.6 4.6c.2 1.4.6 2.6 1.2 3.8 1.2 2.4 2.8 4.6 4.8 6.6 2.4 2.4 5.2 4.2 8.4 5.4 1.2.4 2.4.6 3.6.4.6-.1 1-.4 1.4-.8.8-.8 1.6-1.6 2.4-2.4 1.2-1.2 1.2-2.4 0-3.6l-1.9-1.9z" fill="currentColor" />
                    </svg>
                </button>

                {/* Video Call */}
                <button
                    className={styles.actionButton}
                    onClick={onVideoCall}
                    aria-label="Video call"
                    title="Video call"
                >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M19 5l-6 4.5L19 14V5zM12 4H2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1z" fill="currentColor" />
                    </svg>
                </button>

                {/* Search - DISABLED FOR LAUNCH
                {onSearch && (
                    <button
                        className={styles.actionButton}
                        onClick={onSearch}
                        aria-label="Search messages"
                        title="Search messages"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                )}
                */}

                {/* Three-Dot Menu - DISABLED FOR LAUNCH
                <div className={styles.menuContainer} ref={menuRef}>
                    <button
                        className={`${styles.actionButton} ${showMenu ? styles.active : ''}`}
                        onClick={() => setShowMenu(!showMenu)}
                        aria-label="More options"
                        title="More options"
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <circle cx="10" cy="3" r="2" fill="currentColor" />
                            <circle cx="10" cy="10" r="2" fill="currentColor" />
                            <circle cx="10" cy="17" r="2" fill="currentColor" />
                        </svg>
                    </button>

                    {showMenu && (
                        <div className={styles.menu}>
                            {onInfo && (
                                <button
                                    className={styles.menuItem}
                                    onClick={() => handleMenuItemClick(onInfo)}
                                >
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                        <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" />
                                        <path d="M10 14v-4M10 6h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                    <span>Contact Info</span>
                                </button>
                            )}

                            {onShowPinned && (
                                <button
                                    className={styles.menuItem}
                                    onClick={() => handleMenuItemClick(onShowPinned)}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M16 12V4H17V2H7V4H8V12L6 14V16H11.2V22H12.8V16H18V14L16 12Z" />
                                    </svg>
                                    <span>Pinned Messages</span>
                                </button>
                            )}

                            {onSchedule && (
                                <button
                                    className={styles.menuItem}
                                    onClick={() => handleMenuItemClick(onSchedule)}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                                        <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                    <span>Schedule Message</span>
                                </button>
                            )}

                            <div className={styles.menuDivider} />

                            {onDisappearingMessages && (
                                <button
                                    className={styles.menuItem}
                                    onClick={() => handleMenuItemClick(onDisappearingMessages)}
                                >
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
                                        <path d="M10 5v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                    <span>Disappearing Messages</span>
                                </button>
                            )}

                            {onReadReceipts && (
                                <button
                                    className={styles.menuItem}
                                    onClick={() => handleMenuItemClick(onReadReceipts)}
                                >
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                        <path d="M5 10l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <span>Read Receipts</span>
                                </button>
                            )}

                            {onPINLock && (
                                <button
                                    className={styles.menuItem}
                                    onClick={() => handleMenuItemClick(onPINLock)}
                                >
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                        <rect x="5" y="9" width="10" height="9" rx="2" stroke="currentColor" strokeWidth="2" />
                                        <path d="M7 9V6a3 3 0 0 1 6 0v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                    <span>Lock Chat</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
                */}
            </div>
        </div>
    );
};

export default ChatHeader;

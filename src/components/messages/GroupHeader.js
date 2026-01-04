import React, { useState } from 'react';
import styles from './GroupHeader.module.css';

const GroupHeader = ({
    group,
    members = [],
    onBack,
    onCall,
    onVideoCall,
    onGroupInfo,
    onAddMembers,
    onLeaveGroup
}) => {
    const [showMenu, setShowMenu] = useState(false);

    const displayMembers = members.slice(0, 3);
    const remainingCount = members.length - 3;

    return (
        <div className={styles.groupHeader}>
            <div className={styles.leftSection}>
                {onBack && (
                    <button className={styles.backButton} onClick={onBack}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                )}

                <div className={styles.groupAvatars}>
                    {displayMembers.map((member, index) => (
                        <div
                            key={member.id}
                            className={styles.memberAvatar}
                            style={{ zIndex: displayMembers.length - index }}
                        >
                            {member.avatar_url ? (
                                <img src={member.avatar_url} alt={member.username} />
                            ) : (
                                <div className={styles.avatarPlaceholder}>
                                    {member.username?.[0]?.toUpperCase()}
                                </div>
                            )}
                        </div>
                    ))}
                    {remainingCount > 0 && (
                        <div className={styles.memberAvatar} style={{ zIndex: 0 }}>
                            <div className={styles.avatarPlaceholder}>
                                +{remainingCount}
                            </div>
                        </div>
                    )}
                </div>

                <div className={styles.groupInfo} onClick={onGroupInfo}>
                    <h3 className={styles.groupName}>{group?.name || 'Group Chat'}</h3>
                    <p className={styles.memberCount}>
                        {members.length} {members.length === 1 ? 'member' : 'members'}
                    </p>
                </div>
            </div>

            <div className={styles.actions}>
                {onCall && (
                    <button
                        className={styles.actionButton}
                        onClick={onCall}
                        title="Voice call"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="2" />
                        </svg>
                    </button>
                )}

                {onVideoCall && (
                    <button
                        className={styles.actionButton}
                        onClick={onVideoCall}
                        title="Video call"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M23 7l-7 5 7 5V7z" fill="currentColor" />
                            <rect x="1" y="5" width="15" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
                        </svg>
                    </button>
                )}

                <div className={styles.menuContainer}>
                    <button
                        className={styles.actionButton}
                        onClick={() => setShowMenu(!showMenu)}
                        title="More options"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="5" r="1.5" fill="currentColor" />
                            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                            <circle cx="12" cy="19" r="1.5" fill="currentColor" />
                        </svg>
                    </button>

                    {showMenu && (
                        <div className={styles.menu}>
                            <button className={styles.menuItem} onClick={() => {
                                onGroupInfo();
                                setShowMenu(false);
                            }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                                    <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                                <span>Group Info</span>
                            </button>

                            {onAddMembers && (
                                <button className={styles.menuItem} onClick={() => {
                                    onAddMembers();
                                    setShowMenu(false);
                                }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                        <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M8.5 11a4 4 0 100-8 4 4 0 000 8zM20 8v6M23 11h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                    <span>Add Members</span>
                                </button>
                            )}

                            {onLeaveGroup && (
                                <button className={`${styles.menuItem} ${styles.danger}`} onClick={() => {
                                    if (window.confirm('Are you sure you want to leave this group?')) {
                                        onLeaveGroup();
                                    }
                                    setShowMenu(false);
                                }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <span>Leave Group</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GroupHeader;

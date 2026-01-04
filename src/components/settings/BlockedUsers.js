import React, { useState } from 'react';
import Button from '../ui/Button';
import LoadingSkeleton from '../shared/LoadingSkeleton';
import { useBlockedUsers } from '../../hooks/useBlockedUsers';
import { focusToast } from '../../utils/focusToast';
import styles from './BlockedUsers.module.css';

const BlockedUsers = () => {
    const { blockedUsers, loading, unblockUser } = useBlockedUsers();
    const [unblocking, setUnblocking] = useState(null);

    const handleUnblock = async (userId, username) => {
        setUnblocking(userId);
        try {
            const result = await unblockUser(userId);
            if (result.success) {
                focusToast.success(`Unblocked @${username}`);
            } else {
                focusToast.error('Failed to unblock user');
            }
        } catch (error) {
            console.error('Error unblocking user:', error);
            focusToast.error('Failed to unblock user');
        } finally {
            setUnblocking(null);
        }
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <h3 className={styles.title}>Blocked Users</h3>
                <LoadingSkeleton count={2} height={60} />
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <h3 className={styles.title}>Blocked Users</h3>
            <p className={styles.description}>
                Manage users you've blocked from interacting with you
            </p>
            {blockedUsers.length === 0 ? (
                <div className={styles.emptyState}>
                    <span className={styles.emptyIcon}>🚫</span>
                    <p className={styles.emptyText}>No blocked users</p>
                </div>
            ) : (
                <div className={styles.userList}>
                    {blockedUsers.map((blocked) => (
                        <div key={blocked.blocked_id} className={styles.userItem}>
                            <div className={styles.userInfo}>
                                <div className={styles.avatar}>
                                    {blocked.blocked?.avatar_url ? (
                                        <img src={blocked.blocked.avatar_url} alt={blocked.blocked.username} />
                                    ) : (
                                        <span>{blocked.blocked?.username?.[0]?.toUpperCase() || '?'}</span>
                                    )}
                                </div>
                                <div className={styles.userDetails}>
                                    <span className={styles.username}>@{blocked.blocked?.username || 'Unknown'}</span>
                                    {blocked.blocked?.full_name && (
                                        <span className={styles.fullName}>{blocked.blocked.full_name}</span>
                                    )}
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUnblock(blocked.blocked_id, blocked.blocked?.username)}
                                loading={unblocking === blocked.blocked_id}
                            >
                                Unblock
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default BlockedUsers;

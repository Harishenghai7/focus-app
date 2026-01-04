import React from 'react';
import styles from './SuggestedUsers.module.css';
import SuggestedUserCard from './SuggestedUserCard';
import useSuggestedUsers from '../../hooks/useSuggestedUsers';
import LoadingSkeleton from '../shared/LoadingSkeleton';

const SuggestedUsers = () => {
    const { users: suggestedUsers, loading } = useSuggestedUsers();

    if (loading) {
        return (
            <div className={styles.container}>
                <LoadingSkeleton count={3} height={60} className="mb-2" />
            </div>
        );
    }

    if (suggestedUsers.length === 0) return null;

    return (
        <div className={styles.container}>
            <h3 className={styles.title}>Suggested for you</h3>
            <div className={styles.list}>
                {suggestedUsers.map(user => (
                    <SuggestedUserCard key={user.id} user={user} />
                ))}
            </div>
        </div>
    );
};

export default SuggestedUsers;

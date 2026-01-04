import React from 'react';
import styles from './SuggestedAccountsRow.module.css';
import SuggestedUserCard from './SuggestedUserCard';

const SuggestedAccountsRow = ({ users }) => {
    if (!users || users.length === 0) return null;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3>Suggested for you</h3>
                <button className={styles.seeAll}>See All</button>
            </div>
            <div className={styles.scrollArea}>
                {users.map(user => (
                    <SuggestedUserCard key={user.id} user={user} />
                ))}
            </div>
        </div>
    );
};

export default SuggestedAccountsRow;

// PeopleGrid - Display users in Explore People tab
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatNumber } from '../../utils/formatNumber';
import styles from './PeopleGrid.module.css';

const PeopleGrid = ({ people }) => {
    const navigate = useNavigate();

    if (!people || people.length === 0) {
        return (
            <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>👥</div>
                <h3>No users found</h3>
                <p>Check back later for suggested users</p>
            </div>
        );
    }

    return (
        <div className={styles.grid}>
            {people.map(person => (
                <div
                    key={person.id}
                    className={styles.card}
                    onClick={() => navigate(`/profile/${person.username}`)}
                >
                    <img
                        src={person.avatar_url || '/default-avatar.png'}
                        alt={person.username}
                        className={styles.avatar}
                    />
                    <div className={styles.info}>
                        <div className={styles.nameRow}>
                            <span className={styles.username}>{person.username}</span>
                            {person.verified && <span className={styles.verified}>✓</span>}
                        </div>
                        {person.full_name && (
                            <div className={styles.fullName}>{person.full_name}</div>
                        )}
                        {person.bio && (
                            <div className={styles.bio}>{person.bio}</div>
                        )}
                        <div className={styles.stats}>
                            {formatNumber(person.followers_count || 0)} followers
                        </div>
                    </div>
                    <button className={styles.followBtn}>Follow</button>
                </div>
            ))}
        </div>
    );
};

export default PeopleGrid;

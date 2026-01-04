import React, { useState } from 'react';
import styles from './SuggestedUser.module.css';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import Icon from '../ui/Icon';

const SuggestedUser = ({ user, onFollow, onDismiss }) => {
    const [followed, setFollowed] = useState(false);

    const handleFollow = (e) => {
        e.stopPropagation();
        setFollowed(true);
        onFollow(user.id);
    };

    return (
        <div className={styles.card}>
            <button className={styles.dismiss} onClick={onDismiss}>
                <Icon name="X" size={16} />
            </button>

            <div className={styles.content}>
                <Avatar src={user.avatar_url} size="lg" />
                <div className={styles.info}>
                    <h4 className={styles.username}>
                        {user.username}
                        {user.verified && <Icon name="Verified" size={14} className={styles.verified} />}
                    </h4>
                    <span className={styles.subtitle}>Suggested for you</span>
                </div>

                <Button
                    variant={followed ? "secondary" : "primary"}
                    size="sm"
                    onClick={handleFollow}
                    className={styles.followBtn}
                >
                    {followed ? 'Following' : 'Follow'}
                </Button>
            </div>
        </div>
    );
};

export default SuggestedUser;

import React from 'react';
import styles from './NewPostsBanner.module.css';
import Button from '../ui/Button';
import Icon from '../ui/Icon';

const NewPostsBanner = ({ count, onClick }) => {
    if (count === 0) return null;

    return (
        <div className={styles.bannerContainer}>
            <Button variant="primary" size="sm" onClick={onClick} className={styles.bannerBtn}>
                <Icon name="ArrowUp" size={16} />
                {count} New Posts
            </Button>
        </div>
    );
};

export default NewPostsBanner;

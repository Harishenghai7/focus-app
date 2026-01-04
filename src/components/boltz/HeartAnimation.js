import React from 'react';
import styles from './HeartAnimation.module.css';
import { Heart } from 'lucide-react';

const HeartAnimation = () => {
    return (
        <div className={styles.container}>
            <Heart size={120} fill="#FF0000" color="#FF0000" />
        </div>
    );
};

export default HeartAnimation;

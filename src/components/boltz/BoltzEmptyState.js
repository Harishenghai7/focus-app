import React from 'react';
import styles from './BoltzEmptyState.module.css';
import { Video } from 'lucide-react';
import Button from '../shared/Button';
import { useNavigate } from 'react-router-dom';

const BoltzEmptyState = () => {
    const navigate = useNavigate();

    return (
        <div className={styles.container}>
            <Video size={64} className={styles.icon} />
            <h2 className={styles.title}>No Boltz Yet</h2>
            <p className={styles.description}>
                Be the first to create a Boltz!
            </p>
            <Button onClick={() => navigate('/create')}>
                Create Boltz
            </Button>
        </div>
    );
};

export default BoltzEmptyState;

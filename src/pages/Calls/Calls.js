import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './Calls.module.css';
import MainLayout from '../../components/layout/MainLayout';
import Icon from '../../components/ui/Icon';

const Calls = () => {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const t = setTimeout(() => setLoading(false), 400);
        return () => clearTimeout(t);
    }, []);

    return (
        <MainLayout>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Calls</h1>
                    <Link to="/messages" className={styles.messagesLink}>
                        <Icon name="MessageCircle" size={16} />
                        Messages
                    </Link>
                </div>

                {loading ? (
                    <div className={styles.loaderContainer}>
                        <div className={styles.pulse} aria-hidden />
                        <p className={styles.loaderText}>Loading call history…</p>
                    </div>
                ) : (
                    <div className={styles.empty}>
                        <div className={styles.emptyIcon} aria-hidden>
                            <Icon name="Phone" size={40} />
                        </div>
                        <h2 className={styles.emptyTitle}>No call log yet</h2>
                        <p className={styles.emptyText}>
                            Audio and video calls you start from Messages will appear here once we
                            wire call metadata to this screen.
                        </p>
                        <Link to="/messages" className={styles.cta}>
                            Open Messages
                        </Link>
                    </div>
                )}
            </div>
        </MainLayout>
    );
};

export default Calls;

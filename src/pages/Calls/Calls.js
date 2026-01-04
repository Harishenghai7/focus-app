import React, { useState, useEffect } from 'react';
import styles from './Calls.module.css';
import MainLayout from '../../components/layout/MainLayout';
import Avatar from '../../components/ui/Avatar';
import Icon from '../../components/ui/Icon';
import Button from '../../components/ui/Button';
import Loader from '../../components/ui/Loader';

// Mock data
const MOCK_CALLS = [
    {
        id: 1,
        user: { username: 'alex_design', avatar_url: 'https://via.placeholder.com/150' },
        type: 'video',
        direction: 'incoming',
        status: 'missed',
        time: 'Today, 10:30 AM',
    },
    {
        id: 2,
        user: { username: 'sarah_j', avatar_url: 'https://via.placeholder.com/150' },
        type: 'audio',
        direction: 'outgoing',
        status: 'completed',
        time: 'Yesterday, 4:15 PM',
        duration: '5m 23s',
    },
    {
        id: 3,
        user: { username: 'mike_photo', avatar_url: 'https://via.placeholder.com/150' },
        type: 'video',
        direction: 'incoming',
        status: 'completed',
        time: 'Mon, 9:00 AM',
        duration: '12m 45s',
    },
];

const Calls = () => {
    const [calls, setCalls] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate API call
        setTimeout(() => {
            setCalls(MOCK_CALLS);
            setLoading(false);
        }, 800);
    }, []);

    const getIcon = (call) => {
        if (call.direction === 'incoming') {
            return call.status === 'missed'
                ? <Icon name="PhoneMissed" size={16} color="var(--error)" />
                : <Icon name="PhoneIncoming" size={16} color="var(--success)" />;
        }
        return <Icon name="PhoneOutgoing" size={16} color="var(--text-secondary)" />;
    };

    return (
        <MainLayout>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Calls</h1>
                    <Button variant="primary" size="sm" icon={<Icon name="Phone" size={16} />}>
                        New Call
                    </Button>
                </div>

                {loading ? (
                    <div className={styles.loaderContainer}>
                        <Loader size="lg" />
                    </div>
                ) : (
                    <div className={styles.list}>
                        {calls.map(call => (
                            <div key={call.id} className={styles.item}>
                                <Avatar src={call.user.avatar_url} size="md" />

                                <div className={styles.info}>
                                    <span className={styles.username}>{call.user.username}</span>
                                    <div className={styles.meta}>
                                        {getIcon(call)}
                                        <span className={styles.time}>
                                            {call.time}
                                            {call.duration && ` • ${call.duration}`}
                                        </span>
                                    </div>
                                </div>

                                <Button variant="ghost" icon={<Icon name={call.type === 'video' ? 'Video' : 'Phone'} size={20} />} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </MainLayout>
    );
};

export default Calls;

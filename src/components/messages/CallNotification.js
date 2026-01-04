import React from 'react';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import styles from './CallNotification.module.css';

const CallNotification = ({ call, onAnswer, onDecline }) => {
    if (!call) return null;

    const callerName = call.caller?.full_name || call.caller?.username || 'Unknown';
    const isVideo = call.type === 'video';

    return (
        <div className={styles.overlay}>
            <div className={styles.notification}>
                <div className={styles.header}>
                    <Icon
                        name={isVideo ? "Video" : "Phone"}
                        size={24}
                        className={styles.callIcon}
                    />
                    <h3 className={styles.title}>
                        {isVideo ? 'Incoming Video Call' : 'Incoming Call'}
                    </h3>
                </div>

                <div className={styles.caller}>
                    <Avatar
                        src={call.caller?.avatar_url}
                        alt={callerName}
                        size="xl"
                    />
                    <h2 className={styles.callerName}>{callerName}</h2>
                    <p className={styles.callerUsername}>@{call.caller?.username}</p>
                </div>

                <div className={styles.actions}>
                    <Button
                        variant="danger"
                        size="lg"
                        icon={<Icon name="PhoneOff" size={24} />}
                        onClick={() => onDecline(call.id)}
                        className={styles.declineButton}
                    >
                        Decline
                    </Button>
                    <Button
                        variant="success"
                        size="lg"
                        icon={<Icon name={isVideo ? "Video" : "Phone"} size={24} />}
                        onClick={() => onAnswer(call.id)}
                        className={styles.answerButton}
                    >
                        Answer
                    </Button>
                </div>

                <p className={styles.hint}>
                    {isVideo ? 'Video call will start when you answer' : 'Call will start when you answer'}
                </p>
            </div>
        </div>
    );
};

export default CallNotification;

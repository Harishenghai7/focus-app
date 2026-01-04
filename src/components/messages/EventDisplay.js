import React from 'react';
import { useGroupEvents } from '../../hooks/useGroupEvents';
import { useAuth } from '../../hooks/useAuth';
import styles from './EventDisplay.module.css';

const EventDisplay = ({ message }) => {
    const { user } = useAuth();
    const { rsvpEvent, getEventSummary, getUserRSVP, formatEventDate } = useGroupEvents(message.group_id);

    const eventData = message.event_data;
    const summary = getEventSummary(eventData);
    const userResponse = getUserRSVP(eventData, user?.id);

    const handleRSVP = async (response) => {
        await rsvpEvent(message.id, user?.id, response);
    };

    return (
        <div className={styles.event}>
            <div className={styles.header}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <div>
                    <div className={styles.title}>{eventData.title}</div>
                    <div className={styles.date}>
                        {formatEventDate(eventData.date, eventData.time)}
                    </div>
                </div>
            </div>

            {eventData.description && (
                <div className={styles.description}>{eventData.description}</div>
            )}

            {eventData.location && (
                <div className={styles.location}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M8 2a4 4 0 0 1 4 4c0 3-4 8-4 8s-4-5-4-8a4 4 0 0 1 4-4z"
                            stroke="currentColor" strokeWidth="1.5" />
                        <circle cx="8" cy="6" r="1.5" fill="currentColor" />
                    </svg>
                    <span>{eventData.location}</span>
                </div>
            )}

            <div className={styles.rsvpButtons}>
                <button
                    className={`${styles.rsvpButton} ${userResponse === 'going' ? styles.active : ''}`}
                    onClick={() => handleRSVP('going')}
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M13 5L6 12 3 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Going ({summary.going})
                </button>
                <button
                    className={`${styles.rsvpButton} ${userResponse === 'maybe' ? styles.active : ''}`}
                    onClick={() => handleRSVP('maybe')}
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M8 4v4M8 11h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Maybe ({summary.maybe})
                </button>
                <button
                    className={`${styles.rsvpButton} ${userResponse === 'not_going' ? styles.active : ''}`}
                    onClick={() => handleRSVP('not_going')}
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Can't Go ({summary.not_going})
                </button>
            </div>

            <div className={styles.summary}>
                {summary.total} {summary.total === 1 ? 'response' : 'responses'}
            </div>
        </div>
    );
};

export default EventDisplay;

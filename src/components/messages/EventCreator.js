import React, { useState } from 'react';
import { useGroupEvents } from '../../hooks/useGroupEvents';
import { useAuth } from '../../hooks/useAuth';
import Button from '../ui/Button';
import styles from './EventCreator.module.css';

const EventCreator = ({ groupId, onClose, onSuccess }) => {
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [location, setLocation] = useState('');
    const { loading, createEvent } = useGroupEvents(groupId);

    const handleCreate = async () => {
        if (title && date) {
            const event = await createEvent({
                title,
                description,
                date,
                time,
                location
            }, user?.id);

            if (event) {
                onSuccess?.();
                onClose();
            }
        }
    };

    const isValid = title.trim().length > 0 && date.length > 0;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>Create Event</h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                <div className={styles.content}>
                    <div className={styles.field}>
                        <label>Event Title *</label>
                        <input
                            type="text"
                            placeholder="Team Meeting, Birthday Party, etc."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            maxLength={100}
                            autoFocus
                        />
                    </div>

                    <div className={styles.field}>
                        <label>Description</label>
                        <textarea
                            placeholder="Add event details..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            maxLength={500}
                            rows={3}
                        />
                    </div>

                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label>Date *</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>

                        <div className={styles.field}>
                            <label>Time</label>
                            <input
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label>Location</label>
                        <input
                            type="text"
                            placeholder="Add a location"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            maxLength={200}
                        />
                    </div>
                </div>

                <div className={styles.footer}>
                    <Button variant="secondary" onClick={onClose} fullWidth>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleCreate}
                        disabled={!isValid || loading}
                        loading={loading}
                        fullWidth
                    >
                        Create Event
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default EventCreator;

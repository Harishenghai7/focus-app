import React, { useState, useEffect } from 'react';
import { useLocationSharing } from '../../hooks/useLocationSharing';
import Button from '../ui/Button';
import styles from './LocationPicker.module.css';

const LocationPicker = ({ onClose, onShare }) => {
    const [isLive, setIsLive] = useState(false);
    const { sharing, currentLocation, getCurrentLocation, getMapLink } = useLocationSharing();
    const [location, setLocation] = useState(null);

    useEffect(() => {
        loadLocation();
    }, []);

    const loadLocation = async () => {
        try {
            const loc = await getCurrentLocation();
            setLocation(loc);
        } catch (error) {
            console.error('Error getting location:', error);
        }
    };

    const handleShare = () => {
        onShare?.(location, isLive);
        onClose();
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>Share Location</h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                <div className={styles.content}>
                    {location ? (
                        <>
                            <div className={styles.map}>
                                <iframe
                                    src={`https://maps.google.com/maps?q=${location.latitude},${location.longitude}&z=15&output=embed`}
                                    width="100%"
                                    height="300"
                                    frameBorder="0"
                                    style={{ border: 0, borderRadius: '12px' }}
                                    allowFullScreen
                                />
                            </div>

                            <div className={styles.info}>
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M10 2a6 6 0 0 1 6 6c0 4-6 10-6 10S4 12 4 8a6 6 0 0 1 6-6z"
                                        stroke="currentColor" strokeWidth="2" />
                                    <circle cx="10" cy="8" r="2" fill="currentColor" />
                                </svg>
                                <div>
                                    <div className={styles.coords}>
                                        {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                                    </div>
                                    <div className={styles.accuracy}>
                                        Accuracy: ±{Math.round(location.accuracy)}m
                                    </div>
                                </div>
                            </div>

                            <label className={styles.liveToggle}>
                                <input
                                    type="checkbox"
                                    checked={isLive}
                                    onChange={(e) => setIsLive(e.target.checked)}
                                />
                                <span>Share live location (1 hour)</span>
                            </label>
                        </>
                    ) : (
                        <div className={styles.loading}>
                            <div className={styles.spinner}></div>
                            <p>Getting your location...</p>
                        </div>
                    )}
                </div>

                <div className={styles.footer}>
                    <Button variant="secondary" onClick={onClose} fullWidth>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleShare}
                        disabled={!location || sharing}
                        loading={sharing}
                        fullWidth
                    >
                        Share Location
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default LocationPicker;

/**
 * Panic Button Component
 * Emergency button for teens to quickly notify guardians
 */

import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import styles from './PanicButton.module.css';

const PanicButton = ({ teenId, className = '' }) => {
    const [activated, setActivated] = useState(false);
    const [loading, setLoading] = useState(false);

    const handlePanicPress = async () => {
        setLoading(true);

        try {
            // Log panic button press
            const { error } = await supabase
                .from('panic_button_logs')
                .insert({
                    user_id: teenId,
                    location: window.location.pathname,
                    timestamp: new Date().toISOString()
                });

            if (error) throw error;

            // Create critical alert for guardians
            const { data: guardians } = await supabase
                .from('guardian_relationships')
                .select('guardian_id')
                .eq('teen_id', teenId)
                .eq('status', 'active');

            if (guardians && guardians.length > 0) {
                // Create critical alert for each guardian
                for (const guardian of guardians) {
                    await supabase.from('safety_alerts').insert({
                        teen_id: teenId,
                        alert_type: 'panic_button',
                        severity: 'critical',
                        title: '🆘 Panic Button Activated',
                        description: 'Teen has activated the emergency panic button. Please check on them immediately.',
                        status: 'new'
                    });
                }
            }

            setActivated(true);

            // Show success message
            setTimeout(() => {
                setActivated(false);
            }, 5000);
        } catch (error) {
            console.error('Error activating panic button:', error);
            alert('Failed to activate panic button. Please try again or contact support.');
        } finally {
            setLoading(false);
        }
    };

    if (activated) {
        return (
            <div className={`${styles.panicButton} ${styles.activated} ${className}`}>
                <div className={styles.activatedIcon}>✓</div>
                <div className={styles.activatedText}>
                    <h3>Help is on the way</h3>
                    <p>Your guardian has been notified</p>
                </div>
            </div>
        );
    }

    return (
        <button
            onClick={handlePanicPress}
            disabled={loading}
            className={`${styles.panicButton} ${className}`}
            aria-label="Emergency panic button"
        >
            <span className={styles.panicIcon}>🆘</span>
            <span className={styles.panicText}>{loading ? 'Activating...' : 'Emergency'}</span>
        </button>
    );
};

export default PanicButton;

import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { focusToast } from '../../utils/focusToast';
import styles from './NotificationActions.module.css';
import Button from '../shared/Button';

const NotificationActions = ({ notification, onActionComplete }) => {
    const [loading, setLoading] = useState(false);

    const handleFollowBack = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Check if already following
            const { data: existingFollow } = await supabase
                .from('follows')
                .select('id')
                .eq('follower_id', user.id)
                .eq('following_id', notification.actor_id)
                .single();

            if (existingFollow) {
                focusToast.info('Already following');
                return;
            }

            // Follow back
            const { error } = await supabase
                .from('follows')
                .insert({
                    follower_id: user.id,
                    following_id: notification.actor_id
                });

            if (error) throw error;

            focusToast.success(`Following ${notification.actor?.username || 'user'}`);
            onActionComplete?.();
        } catch (err) {
            console.error('Error following back:', err);
            focusToast.error('Failed to follow');
        } finally {
            setLoading(false);
        }
    };

    const handleMute = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Mute user (add to muted_users or similar table)
            const { error } = await supabase
                .from('muted_users')
                .insert({
                    user_id: user.id,
                    muted_user_id: notification.actor_id
                });

            if (error) throw error;

            focusToast.success('User muted');
            onActionComplete?.();
        } catch (err) {
            console.error('Error muting user:', err);
            focusToast.error('Failed to mute');
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptRequest = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Accept message request - update notification or message request status
            const { error } = await supabase
                .from('message_requests')
                .update({ status: 'accepted' })
                .eq('sender_id', notification.actor_id)
                .eq('receiver_id', user.id);

            if (error) throw error;

            focusToast.success('Request accepted');
            onActionComplete?.();
        } catch (err) {
            console.error('Error accepting request:', err);
            focusToast.error('Failed to accept request');
        } finally {
            setLoading(false);
        }
    };

    const handleDeclineRequest = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Decline message request
            const { error } = await supabase
                .from('message_requests')
                .update({ status: 'declined' })
                .eq('sender_id', notification.actor_id)
                .eq('receiver_id', user.id);

            if (error) throw error;

            focusToast.success('Request declined');
            onActionComplete?.();
        } catch (err) {
            console.error('Error declining request:', err);
            focusToast.error('Failed to decline request');
        } finally {
            setLoading(false);
        }
    };

    if (notification.type === 'follow') {
        return (
            <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
                <Button
                    variant="primary"
                    size="sm"
                    onClick={handleFollowBack}
                    loading={loading}
                >
                    Follow Back
                </Button>
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleMute}
                    loading={loading}
                >
                    Mute
                </Button>
            </div>
        );
    }

    if (notification.type === 'message_request') {
        return (
            <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
                <Button
                    variant="primary"
                    size="sm"
                    onClick={handleAcceptRequest}
                    loading={loading}
                >
                    Accept
                </Button>
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleDeclineRequest}
                    loading={loading}
                >
                    Decline
                </Button>
            </div>
        );
    }

    return null;
};

export default NotificationActions;

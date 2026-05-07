import React from 'react';
import { toast } from 'react-toastify';
import { supabase } from '../../lib/supabase';
import styles from './FlashOptionsModal.module.css';

const FlashOptionsModal = ({ flash, isOwn, onClose, onReport }) => {
    const handleReport = () => {
        if (onReport) onReport();
    };

    const handleCopyLink = async () => {
        try {
            const url = `${window.location.origin}/flash/${flash?.id}`;
            await navigator.clipboard.writeText(url);
            toast.success('Link copied to clipboard!');
        } catch (error) {
            console.error('Error copying link:', error);
            toast.error('Failed to copy link');
        }
        onClose();
    };

    const handleBlock = async () => {
        if (window.confirm('Are you sure you want to block this user? You will no longer see their content.')) {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                const targetUserId = flash?.user_id || flash?.profiles?.id || flash?.user?.id;
                if (user && targetUserId) {
                    await supabase
                        .from('blocked_users')
                        .insert({
                            user_id: user.id,
                            blocked_user_id: targetUserId,
                            created_at: new Date().toISOString()
                        });
                    toast.success('User blocked successfully');
                }
            } catch (error) {
                console.error('Error blocking user:', error);
                toast.error('Failed to block user');
            }
        }
        onClose();
    };

    const handleCloseReport = () => {
        setShowReportModal(false);
        onClose();
    };

    return (
        <>
            <div className={styles.overlay} onClick={onClose}>
                <div className={styles.menu} onClick={(e) => e.stopPropagation()}>
                    {isOwn ? (
                        <>
                            <button className={styles.cancel} onClick={onClose}>Cancel</button>
                        </>
                    ) : (
                        <>
                            <button className={styles.option} onClick={handleReport}>Report</button>
                            <button className={styles.option} onClick={handleCopyLink}>Copy Link</button>
                            <button className={styles.option} onClick={handleBlock}>Block User</button>
                            <button className={styles.cancel} onClick={onClose}>Cancel</button>
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default FlashOptionsModal;

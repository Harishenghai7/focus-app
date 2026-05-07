import React, { useState } from 'react';
import BoltzOptionsMenu from '../boltz/BoltzOptionsMenu';
import ReportModal from '../report/ReportModal';
import { toast } from 'react-toastify';
import { supabase } from '../../lib/supabase';
import styles from './BoltzOptionsModal.module.css'; // Assuming styles exist or reuse existing

const BoltzOptionsModal = ({ boltzId, boltzData, isOwn, onClose }) => {
    const [showReportModal, setShowReportModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editCaption, setEditCaption] = useState(boltzData?.caption || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleReport = () => {
        setShowReportModal(true);
    };

    const handleNotInterested = async () => {
        try {
            // Mark content as not interested (could be stored in user preferences)
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase
                    .from('user_preferences')
                    .upsert({
                        user_id: user.id,
                        hidden_boltz: supabase.raw(`array_append(COALESCE(hidden_boltz, ARRAY[]::text[]), '${boltzId}')`)
                    });
                toast.success('Marked as not interested');
            }
        } catch (error) {
            console.error('Error marking not interested:', error);
            toast.error('Failed to update preferences');
        }
        onClose();
    };

    const handleCopyLink = async () => {
        try {
            const url = `${window.location.origin}/boltz/${boltzId}`;
            await navigator.clipboard.writeText(url);
            toast.success('Link copied to clipboard!');
        } catch (error) {
            console.error('Error copying link:', error);
            toast.error('Failed to copy link');
        }
        onClose();
    };

    const handleDownload = async () => {
        try {
            if (boltzData?.video_url) {
                // Create a temporary anchor element to trigger download
                const link = document.createElement('a');
                link.href = boltzData.video_url;
                link.download = `boltz_${boltzId}.mp4`;
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success('Download started!');
            } else {
                toast.error('Video URL not available');
            }
        } catch (error) {
            console.error('Error downloading:', error);
            toast.error('Failed to download video');
        }
        onClose();
    };

    const handleBlock = async () => {
        if (window.confirm('Are you sure you want to block this user? You will no longer see their content.')) {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user && boltzData?.user_id) {
                    await supabase
                        .from('blocked_users')
                        .insert({
                            user_id: user.id,
                            blocked_user_id: boltzData.user_id,
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

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this Boltz?')) {
            try {
                const { error } = await supabase
                    .from('boltz')
                    .update({ deleted_at: new Date().toISOString() })
                    .eq('id', boltzId);

                if (error) throw error;

                toast.success('Boltz deleted successfully');
                window.location.reload();
            } catch (error) {
                console.error('Error deleting boltz:', error);
                toast.error('Failed to delete Boltz');
            }
        }
        onClose();
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleSaveEdit = async () => {
        setIsSaving(true);
        try {
            // Update without .select() to avoid RLS timeout issues
            const updatePromise = supabase
                .from('boltz')
                .update({ caption: editCaption })
                .eq('id', boltzId);

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Update timeout - request took too long')), 10000)
            );

            const { error } = await Promise.race([updatePromise, timeoutPromise]);

            if (error) throw error;
            const { data: verifyData } = await supabase
                .from('boltz')
                .select('caption')
                .eq('id', boltzId)
                .single();

            if (verifyData && verifyData.caption === editCaption) {
                toast.success('Boltz updated successfully');
            } else {
                toast.success('Boltz updated');
            }

            setTimeout(() => {
                window.location.reload();
            }, 500);
        } catch (error) {
            console.error('Error updating boltz:', error);
            toast.error(`Failed to update Boltz: ${error.message}`);
            setIsSaving(false);
        }
    };

    const handleArchive = async () => {
        try {
            const { error } = await supabase
                .from('boltz')
                .update({ is_archived: true })
                .eq('id', boltzId);

            if (error) throw error;
            toast.success('Boltz archived');
            window.location.reload();
        } catch (error) {
            console.error('Error archiving boltz:', error);
            toast.error('Failed to archive Boltz (Feature might not be supported)');
        }
        onClose();
    };

    const handleHideLikes = async () => {
        try {
            const newStatus = !boltzData?.likes_hidden;
            const { error } = await supabase
                .from('boltz')
                .update({ likes_hidden: newStatus })
                .eq('id', boltzId);

            if (error) throw error;
            toast.success(`Like count ${newStatus ? 'hidden' : 'visible'}`);
            window.location.reload();
        } catch (error) {
            console.error('Error updating like visibility:', error);
            toast.error('Failed to update setting');
        }
        onClose();
    };

    const handleTurnOffCommenting = async () => {
        try {
            const newStatus = !boltzData?.comments_disabled;
            const { error } = await supabase
                .from('boltz')
                .update({ comments_disabled: newStatus })
                .eq('id', boltzId);

            if (error) throw error;
            toast.success(`Commenting ${newStatus ? 'disabled' : 'enabled'}`);
            window.location.reload();
        } catch (error) {
            console.error('Error updating commenting status:', error);
            toast.error('Failed to update setting (Feature might not be supported)');
        }
        onClose();
    };

    const handleCloseReport = () => {
        setShowReportModal(false);
        onClose();
    };

    return (
        <>
            {!isEditing ? (
                <BoltzOptionsMenu
                    isOwn={isOwn}
                    onReport={handleReport}
                    onNotInterested={handleNotInterested}
                    onCopyLink={handleCopyLink}
                    onDownload={handleDownload}
                    onBlock={handleBlock}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    onArchive={handleArchive}
                    onHideLikes={handleHideLikes}
                    onTurnOffCommenting={handleTurnOffCommenting}
                    onClose={onClose}
                />
            ) : (
                <div className={styles.editOverlay} onClick={onClose}>
                    <div className={styles.editModal} onClick={e => e.stopPropagation()}>
                        <h3 className={styles.editTitle}>Edit Boltz</h3>
                        <textarea
                            className={styles.editTextarea}
                            value={editCaption}
                            onChange={(e) => setEditCaption(e.target.value)}
                            placeholder="Write a caption..."
                        />
                        <div className={styles.editActions}>
                            <button
                                className={styles.cancelBtn}
                                onClick={() => setIsEditing(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className={styles.saveBtn}
                                onClick={handleSaveEdit}
                                disabled={isSaving}
                            >
                                {isSaving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showReportModal && (
                <ReportModal
                    isOpen={showReportModal}
                    onClose={handleCloseReport}
                    contentData={{
                        contentId: boltzId,
                        userId: boltzData?.user_id,
                        type: 'boltz'
                    }}
                />
            )}
        </>
    );
};

export default BoltzOptionsModal;

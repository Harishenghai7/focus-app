import React, { useState, useEffect } from 'react';
import BoltzOptionsMenu from '../boltz/BoltzOptionsMenu';
import ReportModal from '../report/ReportModal';
import { toast } from 'react-toastify';
import { updatePostCaption, updatePost } from '../../utils/supabaseRest';
import { supabase } from '../../lib/supabase';
import styles from './PostOptionsModal.module.css';

const PostOptionsModal = ({ postId, postData, isOwn, onClose, onUpdate }) => {
    const [showReportModal, setShowReportModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editCaption, setEditCaption] = useState(postData?.caption || '');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (postData?.caption) {
            setEditCaption(postData.caption);
        }
    }, [postData]);

    const handleReport = () => {
        setShowReportModal(true);
    };

    const handleNotInterested = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase
                    .from('user_preferences')
                    .upsert({
                        user_id: user.id,
                        hidden_posts: supabase.raw(`array_append(COALESCE(hidden_posts, ARRAY[]::text[]), '${postId}')`)
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
            const url = `${window.location.origin}/post/${postId}`;
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
                if (user && postData?.user_id) {
                    await supabase
                        .from('blocked_users')
                        .insert({
                            user_id: user.id,
                            blocked_user_id: postData.user_id,
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
        if (window.confirm('Are you sure you want to delete this post?')) {
            try {
                await updatePost(postId, { deleted_at: new Date().toISOString() });
                toast.success('Post deleted successfully');
                window.location.reload();
            } catch (error) {
                console.error('Error deleting post:', error);
                toast.error('Failed to delete post');
            }
        }
        onClose();
    };

    const handleCloseReport = () => {
        setShowReportModal(false);
        onClose();
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleSaveEdit = async () => {
        setIsSaving(true);

        try {
            console.log('📡 Updating caption via REST API...');
            console.log('Post ID:', postId);
            console.log('New Caption:', editCaption);

            // Use REST API - much faster and more reliable!
            await updatePostCaption(postId, editCaption);

            console.log('✅ Caption updated successfully!');
            toast.success('Caption updated successfully!');

            // Notify parent component to update the post
            if (onUpdate) {
                onUpdate({ ...postData, caption: editCaption });
            }

            // Close the edit modal
            setIsEditing(false);
            setIsSaving(false);

            // Close the options modal
            onClose();

        } catch (error) {
            console.error('❌ Error updating post:', error);
            toast.error(`Failed: ${error.message}`);
            setIsSaving(false);
        }
    };

    const handleArchive = async () => {
        try {
            await updatePost(postId, { is_archived: true });
            toast.success('Post archived');

            // Update local state
            if (onUpdate) {
                onUpdate({ ...postData, is_archived: true });
            }

            onClose();
        } catch (error) {
            console.error('Error archiving post:', error);
            toast.error('Failed to archive post');
        }
    };

    const handleHideLikes = async () => {
        try {
            const newStatus = !postData?.likes_hidden;
            await updatePost(postId, { likes_hidden: newStatus });
            toast.success(`Like count ${newStatus ? 'hidden' : 'visible'}`);

            // Update local state
            if (onUpdate) {
                onUpdate({ ...postData, likes_hidden: newStatus });
            }

            onClose();
        } catch (error) {
            console.error('Error updating like visibility:', error);
            toast.error('Failed to update setting');
        }
    };

    const handleTurnOffCommenting = async () => {
        try {
            const newStatus = !postData?.comments_disabled;
            await updatePost(postId, { comments_disabled: newStatus });
            toast.success(`Commenting ${newStatus ? 'disabled' : 'enabled'}`);

            // Update local state
            if (onUpdate) {
                onUpdate({ ...postData, comments_disabled: newStatus });
            }

            onClose();
        } catch (error) {
            console.error('Error updating commenting status:', error);
            toast.error('Failed to update setting');
        }
    };

    return (
        <>
            {!isEditing ? (
                <BoltzOptionsMenu
                    isOwn={isOwn}
                    onReport={handleReport}
                    onNotInterested={handleNotInterested}
                    onCopyLink={handleCopyLink}
                    onBlock={handleBlock}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    onArchive={handleArchive}
                    onHideLikes={handleHideLikes}
                    onTurnOffCommenting={handleTurnOffCommenting}
                    onClose={onClose}
                    type="post"
                />
            ) : (
                <div className={styles.editOverlay} onClick={onClose}>
                    <div className={styles.editModal} onClick={e => e.stopPropagation()}>
                        <h3 className={styles.editTitle}>Edit Post</h3>
                        <textarea
                            className={styles.editTextarea}
                            value={editCaption}
                            onChange={(e) => setEditCaption(e.target.value)}
                            placeholder="Write a caption..."
                            autoFocus
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
                        contentId: postId,
                        userId: postData?.user_id,
                        type: 'post'
                    }}
                />
            )}
        </>
    );
};

export default PostOptionsModal;

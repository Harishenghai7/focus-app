import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useToxicityScanner } from '../../hooks/useToxicityScanner';
import styles from './SovereignCommentSheet.module.css';

const SovereignCommentSheet = ({ isOpen, onClose, targetId, targetType }) => {
    const { user } = useAuth();
    const { scanText, isScanning, canProceed, indicatorProps } = useToxicityScanner();
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && targetId) {
            fetchComments();
        }
    }, [isOpen, targetId, targetType]);

    useEffect(() => {
        scanText(newComment);
    }, [newComment, scanText]);

    const fetchComments = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('comments')
                .select('*, user:profiles(id, username, full_name, avatar_url)')
                .eq('target_id', targetId)
                .eq('target_type', targetType)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            setComments(data || []);
        } catch (error) {
            console.error('Error fetching comments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || submitting || !canProceed) return;

        setSubmitting(true);
        try {
            const { data, error } = await supabase
                .from('comments')
                .insert({
                    target_id: targetId,
                    target_type: targetType,
                    content: newComment.trim()
                })
                .select('*, user:profiles(id, username, full_name, avatar_url)')
                .single();

            if (error) throw error;
            setComments([data, ...comments]);
            setNewComment('');
        } catch (error) {
            console.error('Error submitting comment:', error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        className={styles.backdrop}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    <motion.div
                        className={styles.sheet}
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    >
                        <div className={styles.header}>
                            <h3>Comments</h3>
                            <button className={styles.closeBtn} onClick={onClose}>×</button>
                        </div>

                        <div className={styles.content}>
                            {loading ? (
                                <div className={styles.loading}>Loading comments...</div>
                            ) : (
                                <div className={styles.commentsList}>
                                    {comments.length === 0 ? (
                                        <div className={styles.empty}>No comments yet. Be the first!</div>
                                    ) : (
                                        comments.map((comment) => (
                                            <div key={comment.id} className={styles.comment}>
                                                <img
                                                    src={comment.user?.avatar_url || '/default-avatar.png'}
                                                    alt={comment.user?.username}
                                                    className={styles.avatar}
                                                />
                                                <div className={styles.commentBody}>
                                                    <div className={styles.commentHeader}>
                                                        <span className={styles.username}>
                                                            {comment.user?.username || 'User'}
                                                        </span>
                                                        <span className={styles.timestamp}>
                                                            {new Date(comment.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p className={styles.commentText}>{comment.content}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        <form className={styles.inputArea} onSubmit={handleSubmit}>
                            <input
                                type="text"
                                placeholder="Add a comment..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                disabled={submitting}
                                className={styles.input}
                                style={indicatorProps?.borderColor ? { borderColor: indicatorProps.borderColor } : undefined}
                            />
                            {indicatorProps && (
                                <div className={styles.toxicityIndicator}>
                                    {indicatorProps.message}
                                </div>
                            )}
                            <button
                                type="submit"
                                disabled={!newComment.trim() || submitting || !canProceed}
                                className={`${styles.submitBtn} ${!canProceed ? styles.warning : ''}`}
                            >
                                {submitting ? '...' : 'Post'}
                            </button>
                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default SovereignCommentSheet;

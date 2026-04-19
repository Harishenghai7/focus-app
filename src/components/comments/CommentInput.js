// CommentInput Component - Smart input with @mentions
import React, { useState, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import styles from './CommentInput.module.css';

const CommentInput = ({ onSubmit, placeholder = "Add a comment...", replyingTo = null, onCancelReply }) => {
    const { user, profile } = useAuth();
    const [text, setText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const inputRef = useRef(null);

    const MAX_LENGTH = 2200;

    const handleSubmit = async (e) => {
        e?.preventDefault();

        if (!text.trim() || isSubmitting) return;

        setIsSubmitting(true);

        try {
            await onSubmit(text.trim());
            setText('');
            if (onCancelReply) onCancelReply();
        } catch (error) {
            console.error('Error submitting comment:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const remainingChars = MAX_LENGTH - text.length;
    const isNearLimit = remainingChars < 100;

    return (
        <div className={styles.container}>
            {replyingTo && (
                <div className={styles.replyingTo}>
                    <span>Replying to @{replyingTo.username}</span>
                    <button onClick={onCancelReply} className={styles.cancelReply}>
                        ✕
                    </button>
                </div>
            )}

            <div className={styles.inputWrapper}>
                {(profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture) && (
                    <img
                        src={profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture}
                        alt={profile?.username || user?.email || 'user'}
                        className={styles.avatar}
                    />
                )}

                <div className={styles.inputContainer}>
                    <textarea
                        ref={inputRef}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        className={styles.input}
                        maxLength={MAX_LENGTH}
                        rows={1}
                        disabled={isSubmitting}
                    />

                    {isNearLimit && (
                        <span className={`${styles.charCount} ${remainingChars < 20 ? styles.warning : ''}`}>
                            {remainingChars}
                        </span>
                    )}
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={!text.trim() || isSubmitting}
                    className={styles.submitButton}
                >
                    {isSubmitting ? (
                        <span className={styles.spinner}>⏳</span>
                    ) : (
                        <span>Post</span>
                    )}
                </button>
            </div>
        </div>
    );
};

export default CommentInput;

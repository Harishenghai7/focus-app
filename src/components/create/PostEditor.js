import React from 'react';
import styles from './PostEditor.module.css';
import Avatar from '../ui/Avatar';
import { useAuth } from '../../hooks/useAuth';

const PostEditor = ({ caption, setCaption }) => {
    const { user } = useAuth();

    return (
        <div className={styles.editor}>
            <div className={styles.userInfo}>
                <Avatar src={user?.user_metadata?.avatar_url} size="sm" />
                <span className={styles.username}>{user?.user_metadata?.username}</span>
            </div>

            <textarea
                className={styles.textarea}
                placeholder="Write a caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={2200}
            />

            <div className={styles.footer}>
                <span className={styles.charCount}>{caption.length}/2200</span>
            </div>
        </div>
    );
};

export default PostEditor;

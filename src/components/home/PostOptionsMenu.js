import React from 'react';
import styles from './PostOptionsMenu.module.css';
import Icon from '../ui/Icon';
import { useClickOutside } from '../../hooks/useClickOutside';

const PostOptionsMenu = ({ isOpen, onClose, isOwnPost, onEdit, onDelete, onReport }) => {
    const ref = useClickOutside(onClose);

    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div ref={ref} className={styles.menu}>
                {isOwnPost ? (
                    <>
                        <button className={`${styles.item} ${styles.danger}`} onClick={onDelete}>
                            <Icon name="Trash2" size={18} />
                            Delete
                        </button>
                        <button className={styles.item} onClick={onEdit}>
                            <Icon name="Edit" size={18} />
                            Edit
                        </button>
                        <button className={styles.item} onClick={onClose}>
                            <Icon name="MessageSquareOff" size={18} />
                            Turn off commenting
                        </button>
                    </>
                ) : (
                    <>
                        <button className={`${styles.item} ${styles.danger}`} onClick={onReport}>
                            <Icon name="Flag" size={18} />
                            Report
                        </button>
                        <button className={styles.item} onClick={onClose}>
                            <Icon name="EyeOff" size={18} />
                            Not interested
                        </button>
                        <button className={styles.item} onClick={onClose}>
                            <Icon name="UserX" size={18} />
                            Unfollow
                        </button>
                    </>
                )}
                <button className={styles.item} onClick={onClose}>
                    <Icon name="Link" size={18} />
                    Copy link
                </button>
                <button className={`${styles.item} ${styles.cancel}`} onClick={onClose}>
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default PostOptionsMenu;

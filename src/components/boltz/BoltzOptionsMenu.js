import React from 'react';
import styles from './BoltzOptionsMenu.module.css';

const BoltzOptionsMenu = ({
    isOwn,
    onReport,
    onNotInterested,
    onCopyLink,
    onDownload,
    onBlock,
    onDelete,
    onEdit,
    onArchive,
    onHideLikes,
    onTurnOffCommenting,
    onAnalytics,
    onPrivacy,
    onClose
}) => {
    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.menu} onClick={(e) => e.stopPropagation()}>
                {isOwn ? (
                    <>
                        {onEdit && <button className={styles.option} onClick={onEdit}>Edit</button>}
                        {onDelete && <button className={styles.option} onClick={onDelete}>Delete</button>}
                        {onArchive && <button className={styles.option} onClick={onArchive}>Archive</button>}
                        {onHideLikes && <button className={styles.option} onClick={onHideLikes}>Hide like count</button>}
                        {onTurnOffCommenting && <button className={styles.option} onClick={onTurnOffCommenting}>Turn off commenting</button>}
                        {onAnalytics && <button className={styles.option} onClick={onAnalytics}>Analytics</button>}
                        {onPrivacy && <button className={styles.option} onClick={onPrivacy}>Privacy Settings</button>}
                    </>
                ) : (
                    <>
                        <button className={styles.option} onClick={onReport}>Report</button>
                        <button className={styles.option} onClick={onNotInterested}>Not Interested</button>
                        <button className={styles.option} onClick={onCopyLink}>Copy Link</button>
                        {onDownload && <button className={styles.option} onClick={onDownload}>Download</button>}
                        <button className={styles.option} onClick={onBlock}>Block User</button>
                    </>
                )}
                <button className={styles.cancel} onClick={onClose}>Cancel</button>
            </div>
        </div>
    );
};

export default BoltzOptionsMenu;

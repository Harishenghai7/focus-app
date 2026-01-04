import React from 'react';
import styles from './BoltzShareModal.module.css';
import { useShare } from '../../hooks/useShare';
import { X, Copy, Share2 } from 'lucide-react';

const BoltzShareModal = ({ boltzId, onClose }) => {
    const { copyLink, shareExternal, shareNative } = useShare();

    const handleCopyLink = async () => {
        const success = await copyLink(boltzId);
        if (success) {
            alert('Link copied!');
            onClose();
        }
    };

    const handleNativeShare = async () => {
        const success = await shareNative(boltzId);
        if (!success) {
            // Fallback to copy link
            handleCopyLink();
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h3>Share</h3>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className={styles.options}>
                    <button className={styles.option} onClick={handleNativeShare}>
                        <Share2 size={24} />
                        <span>Share</span>
                    </button>
                    <button className={styles.option} onClick={handleCopyLink}>
                        <Copy size={24} />
                        <span>Copy Link</span>
                    </button>
                    <button className={styles.option} onClick={() => shareExternal(boltzId, 'twitter')}>
                        <span>🐦</span>
                        <span>Twitter</span>
                    </button>
                    <button className={styles.option} onClick={() => shareExternal(boltzId, 'whatsapp')}>
                        <span>💬</span>
                        <span>WhatsApp</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BoltzShareModal;

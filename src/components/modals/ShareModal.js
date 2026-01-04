import React, { useState } from 'react';
import styles from './ShareModal.module.css';
import { useShare } from '../../hooks/useShare';
import { X, Copy, Share2, Link, MessageCircle, Twitter, Facebook, Mail } from 'lucide-react';
import { toast } from 'react-toastify';

const ShareModal = ({ item, type = 'post', onClose }) => {
    const { copyLink, shareExternal, shareNative } = useShare();
    const [copying, setCopying] = useState(false);

    if (!item) return null;

    const contentId = item.id;
    const shareUrl = `${window.location.origin}/${type === 'boltz' ? 'boltz' : 'p'}/${contentId}`;

    const handleCopyLink = async () => {
        setCopying(true);
        try {
            await navigator.clipboard.writeText(shareUrl);
            toast.success('Link copied to clipboard!');
            setTimeout(onClose, 500);
        } catch (err) {
            console.error('Failed to copy:', err);
            toast.error('Failed to copy link');
        } finally {
            setCopying(false);
        }
    };

    const handleNativeShare = async () => {
        const success = await shareNative(contentId, type, item.caption || item.description);
        if (success) onClose();
    };

    const handleExternalShare = (platform) => {
        shareExternal(contentId, platform, type);
        onClose();
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h3>Share to...</h3>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className={styles.preview}>
                    {item.media_url || item.thumbnail_url ? (
                        <img
                            src={item.thumbnail_url || item.media_url || item.media_urls?.[0]}
                            alt="Preview"
                            className={styles.previewImage}
                        />
                    ) : (
                        <div className={styles.previewPlaceholder}>
                            <Share2 size={32} />
                        </div>
                    )}
                    <div className={styles.previewInfo}>
                        <p className={styles.previewCaption}>
                            {item.caption || item.description || 'Check out this post!'}
                        </p>
                        <p className={styles.previewUrl}>{shareUrl}</p>
                    </div>
                </div>

                <div className={styles.grid}>
                    <button className={styles.shareBtn} onClick={handleCopyLink}>
                        <div className={styles.iconWrapper} style={{ background: '#f3f4f6', color: '#374151' }}>
                            {copying ? <Link size={24} /> : <Copy size={24} />}
                        </div>
                        <span>{copying ? 'Copied!' : 'Copy Link'}</span>
                    </button>

                    {navigator.share && (
                        <button className={styles.shareBtn} onClick={handleNativeShare}>
                            <div className={styles.iconWrapper} style={{ background: '#f3f4f6', color: '#374151' }}>
                                <Share2 size={24} />
                            </div>
                            <span>Share via...</span>
                        </button>
                    )}

                    <button className={styles.shareBtn} onClick={() => handleExternalShare('whatsapp')}>
                        <div className={styles.iconWrapper} style={{ background: '#25D366', color: 'white' }}>
                            <MessageCircle size={24} />
                        </div>
                        <span>WhatsApp</span>
                    </button>

                    <button className={styles.shareBtn} onClick={() => handleExternalShare('twitter')}>
                        <div className={styles.iconWrapper} style={{ background: '#1DA1F2', color: 'white' }}>
                            <Twitter size={24} />
                        </div>
                        <span>Twitter</span>
                    </button>

                    <button className={styles.shareBtn} onClick={() => handleExternalShare('facebook')}>
                        <div className={styles.iconWrapper} style={{ background: '#1877F2', color: 'white' }}>
                            <Facebook size={24} />
                        </div>
                        <span>Facebook</span>
                    </button>

                    <button className={styles.shareBtn} onClick={() => handleExternalShare('email')}>
                        <div className={styles.iconWrapper} style={{ background: '#EA4335', color: 'white' }}>
                            <Mail size={24} />
                        </div>
                        <span>Email</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShareModal;

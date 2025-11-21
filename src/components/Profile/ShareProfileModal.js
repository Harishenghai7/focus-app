import React, { useState } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import QRCode from 'qrcode';
import './ShareProfileModal.css';

const ShareProfileModal = ({ profile, onClose }) => {
  const [qrCode, setQrCode] = useState('');
  const [copied, setCopied] = useState(false);

  const profileUrl = `${window.location.origin}/profile/${profile.username}`;

  React.useEffect(() => {
    QRCode.toDataURL(profileUrl, { width: 200, margin: 2 })
      .then(setQrCode)
      .catch(console.error);
  }, [profileUrl]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async (platform) => {
    const shareData = {
      title: `${profile.full_name || profile.username}'s Profile`,
      text: `Check out ${profile.username} on Focus`,
      url: profileUrl
    };

    if (platform === 'native' && navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      const urls = {
        twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(profileUrl)}&text=${encodeURIComponent(shareData.text)}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`,
        whatsapp: `https://wa.me/?text=${encodeURIComponent(shareData.text + ' ' + profileUrl)}`
      };
      if (urls[platform]) {
        window.open(urls[platform], '_blank', 'width=600,height=400');
      }
    }
  };

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="share-profile-modal"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Share Profile</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="modal-body">
          {/* QR Code */}
          {qrCode && (
            <div className="qr-section">
              <img src={qrCode} alt="Profile QR Code" className="qr-code" />
              <p className="qr-description">Scan to view profile</p>
            </div>
          )}

          {/* Copy Link */}
          <div className="share-option">
            <button className="share-btn copy-btn" onClick={handleCopyLink}>
              <span className="share-icon">🔗</span>
              <span className="share-label">{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>

          {/* Social Share */}
          <div className="share-options">
            {navigator.share && (
              <button className="share-btn" onClick={() => handleShare('native')}>
                <span className="share-icon">📤</span>
                <span className="share-label">Share</span>
              </button>
            )}
            <button className="share-btn" onClick={() => handleShare('twitter')}>
              <span className="share-icon">🐦</span>
              <span className="share-label">Twitter</span>
            </button>
            <button className="share-btn" onClick={() => handleShare('facebook')}>
              <span className="share-icon">👍</span>
              <span className="share-label">Facebook</span>
            </button>
            <button className="share-btn" onClick={() => handleShare('whatsapp')}>
              <span className="share-icon">💬</span>
              <span className="share-label">WhatsApp</span>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

ShareProfileModal.propTypes = {
  profile: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired
};

export default ShareProfileModal;

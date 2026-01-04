import React, { useState } from 'react';
import QRCode from 'qrcode.react';

const ShareModal = ({ boltz, onClose }) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/boltz/${boltz.id}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = (platform) => {
    const text = `Check out this Boltz by @${boltz.user.username}`;
    let url = '';

    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(text + ' ' + shareUrl)}`;
        break;
      case 'telegram':
        url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;
        break;
      case 'reddit':
        url = `https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(text)}`;
        break;
      case 'email':
        url = `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(shareUrl)}`;
        break;
      default:
        return;
    }

    window.open(url, '_blank', 'width=600,height=400');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Boltz by @${boltz.user.username}`,
          text: boltz.caption || 'Check out this Boltz!',
          url: shareUrl
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      }
    }
  };

  return (
    <div 
      className="share-modal-overlay"
      onClick={(e) => e.target.className === 'share-modal-overlay' && onClose()}
      role="dialog"
      aria-labelledby="share-modal-title"
      aria-modal="true"
    >
      <div className="share-modal">
        {/* Header */}
        <div className="share-modal-header">
          <h2 id="share-modal-title">Share Boltz</h2>
          <button
            className="share-modal-close"
            onClick={onClose}
            aria-label="Close share modal"
          >
            <svg viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
              />
            </svg>
          </button>
        </div>

        <div className="share-modal-body">
          {/* QR Code */}
          <div className="share-qr-section">
            <div className="share-qr-container">
              <QRCode
                value={shareUrl}
                size={160}
                level="M"
                includeMargin={true}
                bgColor="#ffffff"
                fgColor="#000000"
              />
            </div>
            <p className="share-qr-label">Scan to view</p>
          </div>

          {/* Copy Link */}
          <div className="share-link-section">
            <div className="share-link-container">
              <input
                type="text"
                className="share-link-input"
                value={shareUrl}
                readOnly
                aria-label="Share link"
              />
              <button
                className={`share-copy-btn ${copied ? 'copied' : ''}`}
                onClick={handleCopyLink}
                aria-label={copied ? 'Link copied' : 'Copy link'}
              >
                {copied ? (
                  <>
                    <svg viewBox="0 0 24 24">
                      <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24">
                      <path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                    </svg>
                    Copy Link
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Native Share (Mobile) */}
          {navigator.share && (
            <button
              className="share-option native-share"
              onClick={handleNativeShare}
            >
              <div className="share-option-icon">
                <svg viewBox="0 0 24 24">
                  <path fill="currentColor" d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
                </svg>
              </div>
              <span>Share via...</span>
            </button>
          )}

          {/* Social Platforms */}
          <div className="share-options">
            <button
              className="share-option twitter"
              onClick={() => handleShare('twitter')}
              aria-label="Share on Twitter"
            >
              <div className="share-option-icon">
                <svg viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.46 6c-.85.38-1.75.64-2.7.75.97-.58 1.72-1.5 2.07-2.6-.91.54-1.92.93-2.99 1.14-.86-.92-2.08-1.49-3.44-1.49-2.6 0-4.72 2.12-4.72 4.72 0 .37.04.73.12 1.07-3.92-.2-7.4-2.08-9.73-4.94-.41.7-.64 1.5-.64 2.36 0 1.64.83 3.08 2.1 3.93-.77-.02-1.5-.24-2.13-.59v.06c0 2.29 1.63 4.2 3.79 4.64-.4.11-.82.17-1.25.17-.31 0-.61-.03-.9-.08.61 1.9 2.38 3.28 4.48 3.32-1.64 1.29-3.71 2.06-5.96 2.06-.39 0-.77-.02-1.15-.07 2.13 1.37 4.66 2.17 7.38 2.17 8.85 0 13.68-7.33 13.68-13.68 0-.21 0-.42-.01-.63.94-.68 1.76-1.53 2.41-2.5z"/>
                </svg>
              </div>
              <span>Twitter</span>
            </button>

            <button
              className="share-option facebook"
              onClick={() => handleShare('facebook')}
              aria-label="Share on Facebook"
            >
              <div className="share-option-icon">
                <svg viewBox="0 0 24 24">
                  <path fill="currentColor" d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0 0 22 12.06C22 6.53 17.5 2.04 12 2.04Z"/>
                </svg>
              </div>
              <span>Facebook</span>
            </button>

            <button
              className="share-option whatsapp"
              onClick={() => handleShare('whatsapp')}
              aria-label="Share on WhatsApp"
            >
              <div className="share-option-icon">
                <svg viewBox="0 0 24 24">
                  <path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </div>
              <span>WhatsApp</span>
            </button>

            <button
              className="share-option telegram"
              onClick={() => handleShare('telegram')}
              aria-label="Share on Telegram"
            >
              <div className="share-option-icon">
                <svg viewBox="0 0 24 24">
                  <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                </svg>
              </div>
              <span>Telegram</span>
            </button>

            <button
              className="share-option reddit"
              onClick={() => handleShare('reddit')}
              aria-label="Share on Reddit"
            >
              <div className="share-option-icon">
                <svg viewBox="0 0 24 24">
                  <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5.38 11.38c-.05 1.44-1.01 2.75-2.63 3.59-1.63.85-3.77.85-5.4 0-1.62-.84-2.58-2.15-2.63-3.59 0-.08 0-.15.02-.22.02-.16.09-.31.19-.43.1-.11.23-.2.37-.24.14-.04.29-.04.43 0 .14.04.27.11.37.22.1.11.17.24.2.39.01.04.01.08.01.12.03.77.61 1.46 1.54 1.92 1 .49 2.23.49 3.23 0 .93-.46 1.51-1.15 1.54-1.92 0-.04 0-.08.01-.12.03-.15.1-.28.2-.39.1-.11.23-.18.37-.22.14-.04.29-.04.43 0 .14.04.27.13.37.24.1.12.17.27.19.43.02.07.02.15.02.22z"/>
                </svg>
              </div>
              <span>Reddit</span>
            </button>

            <button
              className="share-option email"
              onClick={() => handleShare('email')}
              aria-label="Share via Email"
            >
              <div className="share-option-icon">
                <svg viewBox="0 0 24 24">
                  <path fill="currentColor" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
              </div>
              <span>Email</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;

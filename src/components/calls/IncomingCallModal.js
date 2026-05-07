import React from 'react';
import { Phone, PhoneOff, Video, ShieldCheck, ShieldAlert } from 'lucide-react';
import styles from './IncomingCallModal.module.css';

const IncomingCallModal = ({
    caller,
    callType,
    onAccept,
    onReject
}) => {
    // Trust Shield gating
    const trustScore = typeof caller?.trust_score === 'number' ? caller.trust_score : null;
    const isVerified = !!caller?.is_verified || (trustScore !== null && trustScore >= 70);
    const isExternal = !isVerified;


    const handleAccept = (e) => {


        e.stopPropagation();
        e.preventDefault();

        if (onAccept) {
            onAccept();

        } else {
            console.error('❌ onAccept is undefined!');
        }
    };

    const handleDecline = (e) => {


        e.stopPropagation();
        e.preventDefault();

        if (onReject) {
            onReject();

        } else {
            console.error('❌ onReject is undefined!');
        }
    };

    // Avatar URL drives the immersive blurred backdrop ("caller's frequency aura")
    const auraStyle = caller?.avatar_url
        ? { backgroundImage: `url(${caller.avatar_url})` }
        : undefined;

    return (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Incoming call">
            {/* Immersive blurred caller aura */}
            <div className={styles.aura} style={auraStyle} aria-hidden />
            <div className={styles.scrim} aria-hidden />

            <div className={styles.modal}>
                {/* "Incoming Frequency" label */}
                <div className={styles.frequencyLabel}>
                    <span className={styles.dot} />
                    Incoming Frequency
                </div>

                {/* Caller info */}
                <div className={styles.callerInfo}>
                    <div className={styles.avatarWrapper}>
                        {/* Sovereign Pulse — concentric ripples behind avatar */}
                        <span className={`${styles.pulse} ${styles.pulse1}`} aria-hidden />
                        <span className={`${styles.pulse} ${styles.pulse2}`} aria-hidden />
                        <span className={`${styles.pulse} ${styles.pulse3}`} aria-hidden />

                        <div className={styles.avatar}>
                            {caller?.avatar_url ? (
                                <img src={caller.avatar_url} alt={caller.username || 'Caller'} />
                            ) : (
                                <div className={styles.avatarPlaceholder}>
                                    {caller?.username?.[0]?.toUpperCase() || '?'}
                                </div>
                            )}
                            {isVerified && (
                                <span className={styles.shieldBadge} title="Trust Shield verified">
                                    <ShieldCheck size={14} />
                                </span>
                            )}
                        </div>
                    </div>

                    <h2 className={styles.callerName}>
                        {caller?.full_name || caller?.username || 'Unknown Caller'}
                    </h2>

                    <p className={styles.callType}>
                        {callType === 'video' ? (
                            <><Video size={16} /> Video Call</>
                        ) : (
                            <><Phone size={16} /> Voice Call</>
                        )}
                    </p>

                    {/* Trust banner */}
                    {isExternal ? (
                        <div className={`${styles.trustBanner} ${styles.trustBannerWarn}`}>
                            <ShieldAlert size={16} />
                            <span>Caution: External Frequency — caller is not Trust Shield verified.</span>
                        </div>
                    ) : (
                        <div className={`${styles.trustBanner} ${styles.trustBannerVerified}`}>
                            <ShieldCheck size={16} />
                            <span>
                                Sovereign Verified
                                {trustScore !== null ? ` · Trust ${Math.round(trustScore)}` : ''}
                            </span>
                        </div>
                    )}
                </div>

                {/* Action buttons */}
                <div className={styles.actions}>
                    <button
                        className={`${styles.actionBtn} ${styles.reject}`}
                        onClick={handleDecline}
                        type="button"
                        aria-label="Decline call"
                    >
                        <PhoneOff size={24} />
                        <span>Decline</span>
                    </button>
                    <button
                        className={`${styles.actionBtn} ${styles.accept}`}
                        onClick={handleAccept}
                        type="button"
                        aria-label="Accept call"
                    >
                        <Phone size={24} />
                        <span>Accept</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default IncomingCallModal;

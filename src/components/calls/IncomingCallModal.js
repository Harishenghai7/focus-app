import React from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import styles from './IncomingCallModal.module.css';

const IncomingCallModal = ({
    caller,
    callType,
    onAccept,
    onReject
}) => {
    console.log('🎨 IncomingCallModal rendering with:', { caller, callType });

    const handleAccept = (e) => {
        console.log('🟢🟢🟢 ACCEPT BUTTON CLICKED IN MODAL 🟢🟢🟢');
        console.log('🟢 Event:', e);
        e.stopPropagation();
        e.preventDefault();
        console.log('🟢 Calling onAccept...');
        if (onAccept) {
            onAccept();
            console.log('🟢 onAccept called successfully!');
        } else {
            console.error('❌ onAccept is undefined!');
        }
    };

    const handleDecline = (e) => {
        console.log('🔴🔴🔴 DECLINE BUTTON CLICKED IN MODAL 🔴🔴🔴');
        console.log('🔴 Event:', e);
        e.stopPropagation();
        e.preventDefault();
        console.log('🔴 Calling onReject...');
        if (onReject) {
            onReject();
            console.log('🔴 onReject called successfully!');
        } else {
            console.error('❌ onReject is undefined!');
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                {/* Caller info */}
                <div className={styles.callerInfo}>
                    <div className={styles.avatar}>
                        {caller?.avatar_url ? (
                            <img src={caller.avatar_url} alt={caller.username} />
                        ) : (
                            <div className={styles.avatarPlaceholder}>
                                {caller?.username?.[0]?.toUpperCase()}
                            </div>
                        )}
                    </div>
                    <h2>{caller?.full_name || caller?.username}</h2>
                    <p className={styles.callType}>
                        {callType === 'video' ? (
                            <>
                                <Video size={16} />
                                Video Call
                            </>
                        ) : (
                            <>
                                <Phone size={16} />
                                Voice Call
                            </>
                        )}
                    </p>
                </div>

                {/* Ringing animation */}
                <div className={styles.ringingAnimation}>
                    <div className={styles.ripple}></div>
                    <div className={styles.ripple}></div>
                    <div className={styles.ripple}></div>
                </div>

                {/* Action buttons */}
                <div className={styles.actions}>
                    <button
                        className={`${styles.actionBtn} ${styles.reject}`}
                        onClick={handleDecline}
                        type="button"
                    >
                        <PhoneOff size={24} />
                        <span>Decline</span>
                    </button>
                    <button
                        className={`${styles.actionBtn} ${styles.accept}`}
                        onClick={handleAccept}
                        type="button"
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

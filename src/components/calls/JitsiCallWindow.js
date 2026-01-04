import React, { useEffect } from 'react';
import styles from './JitsiCallWindow.module.css';

/**
 * Jitsi Call Window Component
 * Displays the Jitsi Meet interface
 */
const JitsiCallWindow = ({ roomName, displayName, onEndCall, audioOnly = true }) => {
    useEffect(() => {
        console.log('🎥 JitsiCallWindow mounted', { roomName, displayName });

        // Load Jitsi API
        const script = document.createElement('script');
        script.src = 'https://meet.jit.si/external_api.js';
        script.async = true;

        script.onload = () => {
            console.log('✅ Jitsi API loaded');

            const domain = 'meet.jit.si';
            const options = {
                roomName: roomName,
                width: '100%',
                height: '100%',
                parentNode: document.getElementById('jitsi-meet-container'),
                userInfo: {
                    displayName: displayName
                },
                configOverwrite: {
                    startWithAudioMuted: false,
                    startWithVideoMuted: audioOnly,
                    prejoinPageEnabled: false,
                    disableDeepLinking: true,
                    enableWelcomePage: false
                },
                interfaceConfigOverwrite: {
                    TOOLBAR_BUTTONS: [
                        'microphone',
                        'camera',
                        'hangup',
                        'chat',
                        'desktop',
                        'settings',
                        'raisehand',
                        'videoquality',
                        'filmstrip',
                        'tileview'
                    ],
                    SHOW_JITSI_WATERMARK: false,
                    SHOW_WATERMARK_FOR_GUESTS: false,
                    SHOW_BRAND_WATERMARK: false,
                    SHOW_POWERED_BY: false,
                    MOBILE_APP_PROMO: false,
                    DISABLE_JOIN_LEAVE_NOTIFICATIONS: true
                }
            };

            const api = new window.JitsiMeetExternalAPI(domain, options);

            // Event listeners
            api.addEventListener('videoConferenceJoined', () => {
                console.log('✅ Joined Jitsi conference');
            });

            api.addEventListener('videoConferenceLeft', () => {
                console.log('📴 Left Jitsi conference');
                if (onEndCall) onEndCall();
            });

            api.addEventListener('readyToClose', () => {
                console.log('🚪 Jitsi ready to close');
                if (onEndCall) onEndCall();
            });

            // Cleanup
            return () => {
                console.log('🧹 Cleaning up Jitsi');
                api.dispose();
            };
        };

        document.head.appendChild(script);

        return () => {
            // Remove script on unmount
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        };
    }, [roomName, displayName, audioOnly, onEndCall]);

    return (
        <div className={styles.jitsiWindow}>
            <div id="jitsi-meet-container" className={styles.jitsiContainer}></div>
        </div>
    );
};

export default JitsiCallWindow;

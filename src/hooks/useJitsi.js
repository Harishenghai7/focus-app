import { useState, useCallback } from 'react';

/**
 * Simple hook for Jitsi Meet integration
 * Uses Jitsi's FREE public servers - no setup required!
 */
export const useJitsi = () => {
    const [isInCall, setIsInCall] = useState(false);
    const [jitsiApi, setJitsiApi] = useState(null);

    // Start a Jitsi call
    const startJitsiCall = useCallback((roomName, displayName, audioOnly = true) => {


        // Jitsi configuration
        const domain = 'meet.jit.si'; // Free public Jitsi server
        const options = {
            roomName: roomName,
            width: '100%',
            height: '100%',
            parentNode: document.getElementById('jitsi-container'),
            userInfo: {
                displayName: displayName
            },
            configOverwrite: {
                startWithAudioMuted: false,
                startWithVideoMuted: audioOnly,
                prejoinPageEnabled: false,
                disableDeepLinking: true
            },
            interfaceConfigOverwrite: {
                TOOLBAR_BUTTONS: [
                    'microphone',
                    'camera',
                    'hangup',
                    'chat',
                    'settings',
                    'raisehand',
                    'videoquality',
                    'filmstrip',
                    'tileview',
                    'download',
                    'help'
                ],
                SHOW_JITSI_WATERMARK: false,
                SHOW_WATERMARK_FOR_GUESTS: false,
                SHOW_BRAND_WATERMARK: false,
                BRAND_WATERMARK_LINK: '',
                SHOW_POWERED_BY: false,
                MOBILE_APP_PROMO: false
            }
        };

        // Load Jitsi API
        const script = document.createElement('script');
        script.src = 'https://meet.jit.si/external_api.js';
        script.async = true;
        script.onload = () => {


            // Initialize Jitsi
            const api = new window.JitsiMeetExternalAPI(domain, options);

            // Event listeners
            api.addEventListener('videoConferenceJoined', () => {

                setIsInCall(true);
            });

            api.addEventListener('videoConferenceLeft', () => {

                setIsInCall(false);
                api.dispose();
                setJitsiApi(null);
            });

            api.addEventListener('readyToClose', () => {

                api.dispose();
                setJitsiApi(null);
                setIsInCall(false);
            });

            setJitsiApi(api);
        };

        document.head.appendChild(script);
    }, []);

    // End the call
    const endJitsiCall = useCallback(() => {


        if (jitsiApi) {
            jitsiApi.executeCommand('hangup');
            jitsiApi.dispose();
            setJitsiApi(null);
        }

        setIsInCall(false);
    }, [jitsiApi]);

    // Toggle audio
    const toggleAudio = useCallback(() => {
        if (jitsiApi) {
            jitsiApi.executeCommand('toggleAudio');
        }
    }, [jitsiApi]);

    // Toggle video
    const toggleVideo = useCallback(() => {
        if (jitsiApi) {
            jitsiApi.executeCommand('toggleVideo');
        }
    }, [jitsiApi]);

    return {
        isInCall,
        startJitsiCall,
        endJitsiCall,
        toggleAudio,
        toggleVideo,
        jitsiApi
    };
};

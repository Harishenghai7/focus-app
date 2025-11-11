import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import WebRTCService from '../utils/webrtcService';
import CallSignalingService from '../utils/callSignaling';
import IncomingCallModal from '../components/IncomingCallModal';
import ActiveCallModal from '../components/ActiveCallModal';
import './Call.css';

export default function Call({ user, userProfile }) {
  const navigate = useNavigate();
  const { userId: targetUserId } = useParams();
  const [searchParams] = useSearchParams();
  const callType = searchParams.get('type') || 'video';

  const [loading, setLoading] = useState(false);
  const [targetUser, setTargetUser] = useState(null);
  const [currentCall, setCurrentCall] = useState(null);
  const [callStatus, setCallStatus] = useState('idle'); // idle, calling, ringing, connected, ended
  const [error, setError] = useState(null);
  
  const webrtcServiceRef = useRef(null);
  const signalingServiceRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);

  // Initialize services
  useEffect(() => {
    webrtcServiceRef.current = new WebRTCService();
    signalingServiceRef.current = new CallSignalingService();

    return () => {
      cleanup();
    };
  }, []);

  // Fetch target user info
  useEffect(() => {
    if (targetUserId && user) {
      fetchTargetUser();
    }
  }, [targetUserId, user]);

  const fetchTargetUser = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .eq('id', targetUserId)
        .single();

      if (error) throw error;
      setTargetUser(data);
      
      // Automatically initiate call
      initiateCall(data);
    } catch (error) {
      setError('User not found');
      setTimeout(() => navigate('/calls'), 2000);
    } finally {
      setLoading(false);
    }
  };

  // Initiate outgoing call
  const initiateCall = async (receiver) => {
    try {
      setCallStatus('calling');
      const webrtc = webrtcServiceRef.current;
      const signaling = signalingServiceRef.current;

      // Create call record in database
      const call = await signaling.createCall(receiver.id, callType);
      setCurrentCall({ ...call, receiver, currentUserId: user.id });

      // Initialize WebRTC
      webrtc.isInitiator = true;
      webrtc.initializePeerConnection();

      // Get user media
      const constraints = {
        audio: true,
        video: callType === 'video',
      };
      const stream = await webrtc.getUserMedia(constraints);
      localStreamRef.current = stream;

      // Add stream to peer connection
      webrtc.addLocalStreamToPeer();

      // Setup callbacks
      webrtc.onRemoteStream((remoteStream) => {
        remoteStreamRef.current = remoteStream;
        setCallStatus('connected');
      });

      webrtc.onConnectionStateChange((state) => {
        if (state === 'connected') {
          setCallStatus('connected');
        } else if (state === 'failed' || state === 'disconnected') {
          handleCallEnd('failed');
        }
      });

      webrtc.onIceCandidate((candidate) => {
        signaling.sendIceCandidate(call.id, candidate);
      });

      // Create and send offer
      const offer = await webrtc.createOffer();
      await signaling.sendOffer(call.id, offer);

      // Subscribe to signaling
      signaling.subscribeToCall(call.id);

      // Handle answer
      signaling.onAnswer(async (answer) => {
        await webrtc.setRemoteDescription(answer);
      });

      // Handle ICE candidates
      signaling.onIceCandidate((candidate) => {
        webrtc.addIceCandidate(candidate);
      });

      // Handle call end
      signaling.onCallEnd((status) => {
        handleCallEnd(status);
      });

    } catch (error) {
      setError(error.message);
      setCallStatus('failed');
      setTimeout(() => navigate('/calls'), 2000);
    }
  };

  // Handle call end
  const handleCallEnd = async (status = 'completed') => {
    try {
      const signaling = signalingServiceRef.current;
      
      if (currentCall?.id) {
        await signaling.endCall(currentCall.id);
      }

      cleanup();
      setCallStatus('ended');
      
      setTimeout(() => {
        navigate('/calls');
      }, 1000);
    } catch (error) {
      cleanup();
      navigate('/calls');
    }
  };

  // Toggle audio
  const handleToggleAudio = () => {
    const webrtc = webrtcServiceRef.current;
    return webrtc.toggleAudio();
  };

  // Toggle video
  const handleToggleVideo = () => {
    const webrtc = webrtcServiceRef.current;
    return webrtc.toggleVideo();
  };

  // Switch camera
  const handleSwitchCamera = async () => {
    const webrtc = webrtcServiceRef.current;
    await webrtc.switchCamera();
  };

  // Cleanup
  const cleanup = () => {
    const webrtc = webrtcServiceRef.current;
    const signaling = signalingServiceRef.current;

    if (webrtc) {
      webrtc.close();
    }

    if (signaling) {
      signaling.cleanup();
    }

    localStreamRef.current = null;
    remoteStreamRef.current = null;
  };

  if (loading) {
    return (
      <div className="call-loading">
        <div className="spinner"></div>
        <p>Connecting...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="call-error">
        <h2>Call Failed</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/calls')}>Back to Calls</button>
      </div>
    );
  }

  return (
    <>
      {currentCall && callStatus !== 'idle' && (
        <ActiveCallModal
          call={currentCall}
          localStream={localStreamRef.current}
          remoteStream={remoteStreamRef.current}
          callStatus={callStatus}
          onEndCall={handleCallEnd}
          onToggleAudio={handleToggleAudio}
          onToggleVideo={handleToggleVideo}
          onSwitchCamera={handleSwitchCamera}
        />
      )}
    </>
  );
}

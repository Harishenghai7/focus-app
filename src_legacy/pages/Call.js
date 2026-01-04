import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { components, hooks, utils } from '@/importMap';
import './Call.css';

export default function Call({ user, userProfile }) {
  const navigate = useNavigate();
  const { userId: targetUserId } = useParams();
  const [searchParams] = useSearchParams();
  const callType = searchParams.get('type') || 'video';

  const [loading, setLoading] = useState(false);
  const [targetUser, setTargetUser] = useState(null);
  const [currentCall, setCurrentCall] = useState(null);
  const [callStatus, setCallStatus] = useState('idle'); // idle, calling, ringing, connected, ended, reconnecting
  const [error, setError] = useState(null);
  const [connectionQuality, setConnectionQuality] = useState('good'); // excellent, good, poor
  const [callDuration, setCallDuration] = useState(0);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(callType === 'video');
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [networkStats, setNetworkStats] = useState({ bitrate: 0, packetLoss: 0, latency: 0 });
  
  const webrtcServiceRef = useRef(null);
  const signalingServiceRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const callTimerRef = useRef(null);
  const statsIntervalRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const isCleaningUpRef = useRef(false);
  const maxReconnectAttempts = 3;

  // Initialize services
  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    webrtcServiceRef.current = new utils.WebRTCService();
    signalingServiceRef.current = new utils.CallSignalingService();

    return () => {
      cleanup();
    };
  }, [user, navigate]);

  // Fetch target user info
  useEffect(() => {
    if (targetUserId && user && !targetUser) {
      fetchTargetUser();
    }
  }, [targetUserId, user]);

  // Start call timer
  useEffect(() => {
    if (callStatus === 'connected') {
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

      // Start monitoring network stats
      startNetworkMonitoring();
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
      stopNetworkMonitoring();
    }

    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
      stopNetworkMonitoring();
    };
  }, [callStatus]);

  // Fetch target user
  const fetchTargetUser = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, is_verified')
        .eq('id', targetUserId)
        .single();

      if (error) throw error;
      
      if (!data) {
        throw new Error('User not found');
      }

      setTargetUser(data);
      
      // Check if user is online before initiating call
      const { data: presenceData } = await supabase
        .from('user_presence')
        .select('is_online')
        .eq('user_id', targetUserId)
        .single();

      // Automatically initiate call
      await initiateCall(data);
    } catch (err) {
      console.error('Error fetching target user:', err);
      setError(err.message || 'User not found');
      setTimeout(() => navigate('/calls'), 2000);
    } finally {
      setLoading(false);
    }
  };

  // Initiate outgoing call
  const initiateCall = async (receiver) => {
    try {
      setCallStatus('calling');
      setError(null);
      
      const webrtc = webrtcServiceRef.current;
      const signaling = signalingServiceRef.current;

      if (!webrtc || !signaling) {
        throw new Error('Services not initialized');
      }

      // Create call record in database
      const call = await signaling.createCall(receiver.id, callType, user.id);
      setCurrentCall({ 
        ...call, 
        receiver, 
        caller: userProfile,
        currentUserId: user.id,
        type: callType
      });

      // Initialize WebRTC
      webrtc.isInitiator = true;
      await webrtc.initializePeerConnection();

      // Get user media with enhanced constraints
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        },
        video: callType === 'video' ? {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 },
          facingMode: 'user'
        } : false
      };

      const stream = await webrtc.getUserMedia(constraints);
      localStreamRef.current = stream;
      setIsAudioEnabled(true);
      setIsVideoEnabled(callType === 'video');

      // Add stream to peer connection
      await webrtc.addLocalStreamToPeer(stream);

      // Setup enhanced callbacks
      webrtc.onRemoteStream((remoteStream) => {
        console.log('✅ Received remote stream');
        remoteStreamRef.current = remoteStream;
        setCallStatus('connected');
        setReconnectAttempts(0);
      });

      webrtc.onConnectionStateChange((state) => {
        console.log('🔄 Connection state:', state);
        
        if (state === 'connected') {
          setCallStatus('connected');
          setReconnectAttempts(0);
          setError(null);
        } else if (state === 'connecting' || state === 'checking') {
          if (callStatus === 'connected') {
            setCallStatus('reconnecting');
          }
        } else if (state === 'failed') {
          handleConnectionFailure();
        } else if (state === 'disconnected') {
          if (callStatus === 'connected') {
            attemptReconnection();
          } else {
            handleCallEnd('disconnected');
          }
        } else if (state === 'closed') {
          handleCallEnd('ended');
        }
      });

      webrtc.onConnectionQuality((quality, stats) => {
        setConnectionQuality(quality);
        setNetworkStats(stats);
      });

      webrtc.onError((error) => {
        console.error('❌ WebRTC Error:', error);
        setError(error.message);
      });

      webrtc.onIceCandidate((candidates) => {
        console.log('🧊 Sending ICE candidates:', candidates.length);
        signaling.sendIceCandidate(call.id, candidates);
      });

      // Create and send offer
      const offer = await webrtc.createOffer();
      await signaling.sendOffer(call.id, offer);

      // Subscribe to signaling
      signaling.subscribeToCall(call.id);

      // Handle answer
      signaling.onAnswer(async (answer) => {
        console.log('Received answer');
        await webrtc.setRemoteDescription(answer);
      });

      // Handle ICE candidates
      signaling.onIceCandidate((candidate) => {
        webrtc.addIceCandidate(candidate);
      });

      // Handle call end
      signaling.onCallEnd((status) => {
        console.log('Call ended by remote:', status);
        handleCallEnd(status);
      });

      // Handle call rejected
      signaling.onCallRejected(() => {
        setError('Call declined');
        handleCallEnd('declined');
      });

      // Set timeout for no answer
      const callTimeout = setTimeout(() => {
        if (callStatus === 'calling') {
          setError('No answer');
          handleCallEnd('missed');
        }
      }, 60000); // 60 seconds timeout

      return () => clearTimeout(callTimeout);

    } catch (err) {
      console.error('Error initiating call:', err);
      setError(err.message || 'Failed to start call');
      setCallStatus('failed');
      
      // Create notification for failed call
      if (receiver?.id) {
        await supabase.from('notifications').insert({
          user_id: receiver.id,
          actor_id: user.id,
          type: 'call_missed',
          text: 'tried to call you',
          content_type: callType,
          reference_id: currentCall?.id
        }).catch(console.error);
      }
      
      setTimeout(() => navigate('/calls'), 2000);
    }
  };

  // Attempt reconnection
  const attemptReconnection = useCallback(() => {
    if (reconnectAttempts >= maxReconnectAttempts) {
      setError('Connection lost');
      handleCallEnd('failed');
      return;
    }

    setCallStatus('reconnecting');
    setReconnectAttempts(prev => prev + 1);

    reconnectTimeoutRef.current = setTimeout(async () => {
      try {
        const webrtc = webrtcServiceRef.current;
        if (webrtc) {
          await webrtc.restartIce();
        }
      } catch (err) {
        console.error('Reconnection failed:', err);
        handleCallEnd('failed');
      }
    }, 2000);
  }, [reconnectAttempts]);

  // Handle connection failure
  const handleConnectionFailure = () => {
    if (reconnectAttempts < maxReconnectAttempts) {
      attemptReconnection();
    } else {
      setError('Connection failed');
      handleCallEnd('failed');
    }
  };

  // Update connection quality based on ICE state
  const updateConnectionQuality = (iceState) => {
    switch (iceState) {
      case 'connected':
      case 'completed':
        setConnectionQuality('excellent');
        break;
      case 'checking':
        setConnectionQuality('good');
        break;
      case 'disconnected':
      case 'failed':
        setConnectionQuality('poor');
        break;
      default:
        setConnectionQuality('good');
    }
  };

  // Start network monitoring
  const startNetworkMonitoring = () => {
    const webrtc = webrtcServiceRef.current;
    if (!webrtc) return;

    statsIntervalRef.current = setInterval(async () => {
      try {
        const stats = await webrtc.getConnectionStats();
        if (stats) {
          setNetworkStats({
            bitrate: stats.bitrate || 0,
            packetLoss: stats.packetLoss || 0,
            latency: stats.roundTripTime || 0
          });

          // Update quality based on stats
          if (stats.packetLoss > 10 || stats.roundTripTime > 300) {
            setConnectionQuality('poor');
          } else if (stats.packetLoss > 5 || stats.roundTripTime > 150) {
            setConnectionQuality('good');
          } else {
            setConnectionQuality('excellent');
          }
        }
      } catch (err) {
        console.error('Error getting stats:', err);
      }
    }, 2000);
  };

  // Stop network monitoring
  const stopNetworkMonitoring = () => {
    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current);
      statsIntervalRef.current = null;
    }
  };

  // Handle call end
  const handleCallEnd = async (status = 'completed') => {
    if (isCleaningUpRef.current) return;
    isCleaningUpRef.current = true;

    try {
      const signaling = signalingServiceRef.current;
      
      if (currentCall?.id && signaling) {
        await signaling.endCall(currentCall.id, status, callDuration);
      }

      // Create notification for the other user
      if (targetUser?.id && status !== 'declined') {
        await supabase.from('notifications').insert({
          user_id: targetUser.id,
          actor_id: user.id,
          type: status === 'missed' ? 'call_missed' : 'call',
          text: status === 'missed' ? 'missed your call' : `${callType} call - ${formatDuration(callDuration)}`,
          content_type: callType,
          reference_id: currentCall?.id
        }).catch(console.error);
      }

      cleanup();
      setCallStatus('ended');
      
      setTimeout(() => {
        navigate('/calls');
      }, 1500);
    } catch (err) {
      console.error('Error ending call:', err);
      cleanup();
      navigate('/calls');
    } finally {
      isCleaningUpRef.current = false;
    }
  };

  // Toggle audio
  const handleToggleAudio = useCallback(() => {
    const webrtc = webrtcServiceRef.current;
    if (!webrtc) return false;
    
    const enabled = webrtc.toggleAudio();
    setIsAudioEnabled(enabled);
    return enabled;
  }, []);

  // Toggle video
  const handleToggleVideo = useCallback(() => {
    const webrtc = webrtcServiceRef.current;
    if (!webrtc) return false;
    
    const enabled = webrtc.toggleVideo();
    setIsVideoEnabled(enabled);
    return enabled;
  }, []);

  // Switch camera (front/back)
  const handleSwitchCamera = useCallback(async () => {
    try {
      const webrtc = webrtcServiceRef.current;
      if (!webrtc) return;
      
      await webrtc.switchCamera();
    } catch (err) {
      console.error('Error switching camera:', err);
      setError('Failed to switch camera');
      setTimeout(() => setError(null), 3000);
    }
  }, []);

  // Toggle speaker
  const handleToggleSpeaker = useCallback(() => {
    setIsSpeakerOn(prev => !prev);
    // In a real app, this would set the audio output device
    return !isSpeakerOn;
  }, [isSpeakerOn]);

  // Format duration
  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup resources
  const cleanup = () => {
    console.log('Cleaning up call resources');

    // Clear timers
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    stopNetworkMonitoring();

    // Close WebRTC
    const webrtc = webrtcServiceRef.current;
    if (webrtc) {
      webrtc.close();
    }

    // Cleanup signaling
    const signaling = signalingServiceRef.current;
    if (signaling) {
      signaling.cleanup();
    }

    // Stop media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach(track => track.stop());
      remoteStreamRef.current = null;
    }

    // Reset state
    setCallDuration(0);
    setReconnectAttempts(0);
    setNetworkStats({ bitrate: 0, packetLoss: 0, latency: 0 });
  };

  // Loading state
  if (loading) {
    return (
      <div className="call-loading" role="status" aria-live="polite">
        <div className="spinner-large" aria-hidden="true"></div>
        <p>Connecting to {targetUser?.full_name || 'user'}...</p>
        <div className="loading-animation">
          <div className="pulse-ring"></div>
          <div className="pulse-ring delay-1"></div>
          <div className="pulse-ring delay-2"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && callStatus !== 'reconnecting') {
    return (
      <div className="call-error" role="alert">
        <div className="error-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
        </div>
        <h2>Call {callStatus === 'failed' ? 'Failed' : 'Ended'}</h2>
        <p>{error}</p>
        <button 
          className="btn-primary"
          onClick={() => navigate('/calls')}
          aria-label="Back to calls"
        >
          Back to Calls
        </button>
      </div>
    );
  }

  return (
    <>
      {currentCall && callStatus !== 'idle' && (
        <components.ActiveCallModal
          call={currentCall}
          localStream={localStreamRef.current}
          remoteStream={remoteStreamRef.current}
          callStatus={callStatus}
          callDuration={callDuration}
          connectionQuality={connectionQuality}
          networkStats={networkStats}
          isAudioEnabled={isAudioEnabled}
          isVideoEnabled={isVideoEnabled}
          isSpeakerOn={isSpeakerOn}
          reconnectAttempts={reconnectAttempts}
          maxReconnectAttempts={maxReconnectAttempts}
          onEndCall={handleCallEnd}
          onToggleAudio={handleToggleAudio}
          onToggleVideo={handleToggleVideo}
          onSwitchCamera={handleSwitchCamera}
          onToggleSpeaker={handleToggleSpeaker}
        />
      )}
    </>
  );
}

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useWebRTCStream Hook
 * Manages WebRTC connections for live streaming
 * Supports both broadcaster and viewer modes
 */
export function useWebRTCStream(streamId) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [viewersList, setViewersList] = useState([]);
  const [error, setError] = useState(null);
  
  const peerConnectionRef = useRef(null);
  const dataChannelRef = useRef(null);
  const localStreamRef = useRef(null);

  // WebRTC configuration with STUN/TURN servers
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      }
    ],
    iceCandidatePoolSize: 10
  };

  // Initialize peer connection
  const initializePeerConnection = useCallback(() => {
    try {
      const pc = new RTCPeerConnection(rtcConfig);

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          // Send ICE candidate to signaling server
          console.log('New ICE candidate:', event.candidate);
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', pc.iceConnectionState);
        if (pc.iceConnectionState === 'connected') {
          setIsConnected(true);
          setError(null);
        } else if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
          setIsConnected(false);
          setError('Connection lost. Reconnecting...');
        }
      };

      pc.ontrack = (event) => {
        console.log('Received remote track:', event.streams[0]);
        setRemoteStream(event.streams[0]);
      };

      peerConnectionRef.current = pc;
      return pc;
    } catch (err) {
      console.error('Error initializing peer connection:', err);
      setError('Failed to initialize connection');
      return null;
    }
  }, []);

  // Start broadcast (broadcaster)
  const startBroadcast = useCallback(async (constraints = { video: true, audio: true }) => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      localStreamRef.current = stream;

      // Initialize peer connection
      const pc = initializePeerConnection();
      if (!pc) throw new Error('Failed to create peer connection');

      // Add local stream tracks to peer connection
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Create data channel for chat/metadata
      const dataChannel = pc.createDataChannel('streamData');
      dataChannel.onopen = () => console.log('Data channel opened');
      dataChannel.onclose = () => console.log('Data channel closed');
      dataChannelRef.current = dataChannel;

      console.log('Broadcast started successfully');
      return stream;
    } catch (err) {
      console.error('Error starting broadcast:', err);
      setError(err.message || 'Failed to start broadcast');
      throw err;
    }
  }, [initializePeerConnection]);

  // Join stream (viewer)
  const joinStream = useCallback(async () => {
    try {
      // Initialize peer connection
      const pc = initializePeerConnection();
      if (!pc) throw new Error('Failed to create peer connection');

      // Listen for data channel
      pc.ondatachannel = (event) => {
        const dataChannel = event.channel;
        dataChannel.onmessage = (e) => {
          console.log('Received data:', e.data);
          // Handle incoming data (chat messages, viewer updates, etc.)
        };
        dataChannelRef.current = dataChannel;
      };

      console.log('Joined stream successfully');
    } catch (err) {
      console.error('Error joining stream:', err);
      setError(err.message || 'Failed to join stream');
      throw err;
    }
  }, [initializePeerConnection]);

  // End broadcast
  const endBroadcast = useCallback(() => {
    try {
      // Stop all tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
        setLocalStream(null);
        localStreamRef.current = null;
      }

      // Close peer connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      // Close data channel
      if (dataChannelRef.current) {
        dataChannelRef.current.close();
        dataChannelRef.current = null;
      }

      setIsConnected(false);
      setRemoteStream(null);
      console.log('Broadcast ended');
    } catch (err) {
      console.error('Error ending broadcast:', err);
    }
  }, []);

  // Send data message through data channel
  const sendDataMessage = useCallback((message) => {
    try {
      if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
        dataChannelRef.current.send(JSON.stringify(message));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error sending data message:', err);
      return false;
    }
  }, []);

  // Toggle video track
  const toggleVideo = useCallback((enabled) => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = enabled;
      }
    }
  }, []);

  // Toggle audio track
  const toggleAudio = useCallback((enabled) => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = enabled;
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endBroadcast();
    };
  }, [endBroadcast]);

  return {
    localStream,
    remoteStream,
    isConnected,
    viewersList,
    error,
    startBroadcast,
    joinStream,
    endBroadcast,
    sendDataMessage,
    toggleVideo,
    toggleAudio
  };
}

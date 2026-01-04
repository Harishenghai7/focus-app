import { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';

export function useWebRTCCall() {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [peer, setPeer] = useState(null);
  const [currentCall, setCurrentCall] = useState(null);
  const [callStatus, setCallStatus] = useState('idle');
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const retryCount = useRef(0);

  useEffect(() => {
    // Initialize PeerJS
    const peerInstance = new Peer();
    setPeer(peerInstance);

    peerInstance.on('open', (id) => {

    });

    peerInstance.on('call', (call) => {
      setCurrentCall(call);
      // Handle incoming call
    });

    peerInstance.on('error', (error) => {

    });

    return () => {
      if (peerInstance) {
        peerInstance.destroy();
      }
    };
  }, []);

  const startCall = async (userId, isVideo = true) => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideo,
        audio: true
      });
      
      setLocalStream(stream);
      setIsVideoOff(!isVideo);

      // Create call
      const call = peer.call(userId, stream);
      setCurrentCall(call);

      call.on('stream', (remoteStream) => {
        setRemoteStream(remoteStream);
        setIsConnected(true);
        setCallStatus('connected');
        retryCount.current = 0;
      });

      call.on('close', () => {
        setRemoteStream(null);
        setIsConnected(false);
        setCurrentCall(null);
        setCallStatus('ended');
      });

      call.on('error', (err) => {
        if (retryCount.current < 3) {
          retryCount.current++;
          setCallStatus('reconnecting');
          setTimeout(() => startCall(userId, !isVideoOff), 2000);
        } else {
          setCallStatus('failed');
          endCall();
        }
      });

    } catch (error) {

    }
  };

  const answerCall = async () => {
    if (!currentCall) return;

    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      setLocalStream(stream);
      setIsVideoOff(false);

      // Answer call
      currentCall.answer(stream);

      currentCall.on('stream', (remoteStream) => {
        setRemoteStream(remoteStream);
        setIsConnected(true);
        setCallStatus('connected');
        retryCount.current = 0;
      });

      currentCall.on('close', () => {
        setRemoteStream(null);
        setIsConnected(false);
        setCurrentCall(null);
        setCallStatus('ended');
      });

      currentCall.on('error', (err) => {
        if (retryCount.current < 3) {
          retryCount.current++;
          setCallStatus('reconnecting');
        } else {
          setCallStatus('failed');
          endCall();
        }
      });

    } catch (error) {

    }
  };

  const rejectCall = () => {
    if (currentCall) {
      currentCall.close();
      setCurrentCall(null);
    }
  };

  const endCall = () => {
    if (currentCall) {
      currentCall.close();
      setCurrentCall(null);
    }
    
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    setRemoteStream(null);
    setIsConnected(false);
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  return {
    localStream,
    remoteStream,
    isConnected,
    isMuted,
    isVideoOff,
    callStatus,
    startCall,
    endCall,
    toggleMute,
    toggleVideo,
    answerCall,
    rejectCall
  };
}
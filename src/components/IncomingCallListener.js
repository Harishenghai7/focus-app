import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import CallSignalingService from '../utils/callSignaling';
import IncomingCallModal from './IncomingCallModal';

export default function IncomingCallListener({ user }) {
  const [incomingCall, setIncomingCall] = useState(null);
  const signalingServiceRef = useRef(null);
  const channelRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.id) return;

    // Initialize signaling service
    signalingServiceRef.current = new CallSignalingService();
    const signaling = signalingServiceRef.current;

    // Listen for incoming calls
    const channel = signaling.listenForIncomingCalls(user.id, (call) => {
      // Only show modal if call is in ringing state
      if (call.status === 'ringing') {
        setIncomingCall(call);
      }
    });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
      if (signalingServiceRef.current) {
        signalingServiceRef.current.cleanup();
      }
    };
  }, [user?.id]);

  const handleAccept = async () => {
    if (!incomingCall) return;

    try {
      const signaling = signalingServiceRef.current;
      await signaling.acceptCall(incomingCall.id);
      
      // Navigate to call page
      navigate(`/call/${incomingCall.caller.id}?type=${incomingCall.call_type}&incoming=true&callId=${incomingCall.id}`);
      
      setIncomingCall(null);
    } catch (error) {
      setIncomingCall(null);
    }
  };

  const handleDecline = async () => {
    if (!incomingCall) return;

    try {
      const signaling = signalingServiceRef.current;
      await signaling.declineCall(incomingCall.id);
      
      setIncomingCall(null);
    } catch (error) {
      setIncomingCall(null);
    }
  };

  return (
    <IncomingCallModal
      call={incomingCall}
      onAccept={handleAccept}
      onDecline={handleDecline}
    />
  );
}

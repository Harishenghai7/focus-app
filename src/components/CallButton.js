import React, { useState, useEffect, useRef } from "react";
import SimplePeer from "simple-peer";
import { supabase } from "../supabaseClient";

export default function CallButton({ myUserId, otherUserId, callType = "video" }) {
  const [calling, setCalling] = useState(false);
  const [inCall, setInCall] = useState(false);

  const peerRef = useRef();
  const localStreamRef = useRef();
  const callChannel = useRef();

  useEffect(() => {
    // Get user media depending on callType
    async function startStream() {
      const constraints = callType === "video" ? { video: true, audio: true } : { video: false, audio: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
    }
    startStream();
  }, [callType]);

  // Set up Supabase Realtime channel for simple signaling
  useEffect(() => {
    if (!myUserId || !otherUserId) return;
    callChannel.current = supabase.channel(`call-${otherUserId}`);

    callChannel.current.on('broadcast', { event: 'signal' }, ({ payload }) => {
      if (peerRef.current) {
        peerRef.current.signal(payload.signal);
      }
    }).subscribe();

    return () => {
      if (callChannel.current) {
        supabase.removeChannel(callChannel.current);
      }
      if (peerRef.current) {
        peerRef.current.destroy();
      }
    }
  }, [myUserId, otherUserId]);

  const placeCall = () => {
    if (!localStreamRef.current) {
      alert("Please allow access to your camera and microphone");
      return;
    }
    setCalling(true);
    const peer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream: localStreamRef.current,
    });
    peerRef.current = peer;

    peer.on('signal', async signal => {
      // Send signal payload to callee's Supabase realtime channel
      await supabase.channel(`call-${otherUserId}`).send({
        type: 'broadcast',
        event: 'signal',
        payload: { from: myUserId, signal }
      });
    });

    peer.on('connect', () => {
      setInCall(true);
      setCalling(false);
    });

    peer.on('stream', stream => {
      // Handle remote stream: attach to video element or play audio
      // e.g., setRemoteStream(stream);
    });

    peer.on('close', () => {
      setInCall(false);
      setCalling(false);
      peerRef.current = null;
    });

    peer.on('error', () => {
      alert("Error in connection");
      setCalling(false);
    });
  };

  return (
    <button
      className="btn-call"
      disabled={calling || inCall}
      onClick={placeCall}
      aria-label={`${callType} call`}
    >
      {calling ? "Calling..." : inCall ? "In Call" : `Call ${callType}`}
    </button>
  );
}

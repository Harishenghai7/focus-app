import { useState, useEffect, useRef } from "react";
import Peer from "peerjs";
import { createCall, subscribeToIncomingCalls, answerCall, endCall } from "../hooks/supabaseCallHelpers";

export default function useCall(userId, onIncomingCallNotify) {
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const callRef = useRef(null);

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callStatus, setCallStatus] = useState("loading");
  const [incomingCall, setIncomingCall] = useState(null);

  useEffect(() => {
    let ignore = false;
    async function initMediaPeer() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (ignore) return;
        setLocalStream(stream);
        localStreamRef.current = stream;

        const peer = new Peer(userId, { secure: true });
        peerRef.current = peer;

        peer.on("open", () => setCallStatus("ready"));

        peer.on("call", (call) => {
          setIncomingCall(call);
          setCallStatus("incoming-call");
          call.answer(stream);

          call.on("stream", remoteStream => {
            setRemoteStream(remoteStream);
            setCallStatus("in-call");
          });

          call.on("close", () => {
            setCallStatus("ended");
            cleanupCall();
          });
        });

        const unsubscribe = subscribeToIncomingCalls(userId, (callData) => {
          onIncomingCallNotify(callData);
        });

        return () => {
          unsubscribe();
        };
      } catch (e) {
        console.error("Media error", e);
        setCallStatus("error");
      }
    }
    initMediaPeer();

    return () => {
      ignore = true;
      cleanupCall();
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
      }
    };
  }, [userId]);

  const makeCall = (calleeId) => {
    if (!peerRef.current || !localStreamRef.current) return false;
    setCallStatus("outgoing-call");
    let call = peerRef.current.call(calleeId, localStreamRef.current);
    callRef.current = call;

    call.on("stream", (remoteStream) => {
      setRemoteStream(remoteStream);
      setCallStatus("in-call");
    });

    call.on("close", () => {
      setCallStatus("ended");
      cleanupCall();
    });

    return true;
  };

  const acceptIncomingCall = () => {
    if (incomingCall) {
      setCallStatus("in-call");
      setIncomingCall(null);
    }
  };

  const rejectIncomingCall = () => {
    if (incomingCall) {
      incomingCall.close();
      setIncomingCall(null);
      setCallStatus("ready");
    }
  };

  const endCall = () => {
    if (callRef.current) callRef.current.close();
    cleanupCall();
    setCallStatus("ended");
  };

  const cleanupCall = () => {
    if (callRef.current) {
      callRef.current.close();
      callRef.current = null;
    }
    setRemoteStream(null);
  };

  const toggleMute = () => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach(track => (track.enabled = !track.enabled));
  };

  return {
    localStream,
    remoteStream,
    incomingCall,
    callStatus,
    makeCall,
    acceptIncomingCall,
    rejectIncomingCall,
    endCall,
    toggleMute,
  };
}

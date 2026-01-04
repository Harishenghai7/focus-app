/**
 * usePeerConnection Hook
 * @hook
 * @param {Object} config - Peer connection configuration
 * @returns {Object} { peer, error, close }
 * @example
 * const { peer, error } = usePeerConnection(config);
 */
import { useEffect, useRef, useState } from "react";
import Peer from "peerjs";
import { supabase } from "../supabaseClient";

export function usePeerConnection(config) {
  const [peer, setPeer] = useState(null);
  const [error, setError] = useState(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const callRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callStatus, setCallStatus] = useState("initializing");
  const [incomingCall, setIncomingCall] = useState(null);

  useEffect(() => {
    let ignore = false;

    async function setup() {
      try {
        const media = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (ignore) return;
        setLocalStream(media);
        localStreamRef.current = media;

        peerRef.current = new Peer(config.userId, { secure: true });
        setPeer(peerRef.current);

        peerRef.current.on("open", () => setCallStatus("ready"));

        peerRef.current.on("call", (call) => {
          setIncomingCall(call);
          setCallStatus("incoming");
          call.answer(media);
          call.on("stream", (stream) => {
            setRemoteStream(stream);
            setCallStatus("in-call");
          });
          call.on("close", () => {
            setCallStatus("ended");
            cleanup();
          });
        });

      } catch (e) {
        setError(e);
        setCallStatus("error");
      }
    }

    setup();

    return () => {
      ignore = true;
      cleanup();
    };
  }, [config]);

  const startCall = (remotePeerId) => {
    if (!peerRef.current || !localStreamRef.current) return false;
    const call = peerRef.current.call(remotePeerId, localStreamRef.current);
    callRef.current = call;

    call.on("stream", (stream) => {
      setRemoteStream(stream);
      setCallStatus("in-call");
    });

    call.on("close", () => {
      setCallStatus("ended");
      cleanup();
    });

    setCallStatus("outgoing");
    return true;
  };

  const answerCall = () => {
    if (!incomingCall) return;
    setCallStatus("in-call");
    setIncomingCall(null);
  };

  const endCall = () => {
    if (callRef.current) callRef.current.close();
    cleanup();
    setCallStatus("ended");
  };

  const cleanup = () => {
    if (callRef.current) {
      callRef.current.close();
      callRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    setIncomingCall(null);
  };

  const toggleMute = () => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach(t => t.enabled = !t.enabled);
  };

  return {
    localStream,
    remoteStream,
    callStatus,
    startCall,
    answerCall,
    endCall,
    incomingCall,
    toggleMute,
    error
  };
}

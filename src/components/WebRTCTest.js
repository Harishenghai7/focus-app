import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import WebRTCService from '../utils/webrtcService';
import CallSignalingService from '../utils/callSignaling';
import { supabase } from '../supabaseClient';
import './WebRTCTest.css';

export default function WebRTCTest({ user, userProfile }) {
  const [testStatus, setTestStatus] = useState('idle');
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [connectionState, setConnectionState] = useState('new');
  const [iceConnectionState, setIceConnectionState] = useState('new');
  const [connectionQuality, setConnectionQuality] = useState('unknown');
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);
  const [testUsers, setTestUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [callType, setCallType] = useState('video');

  const webrtcService = useRef(null);
  const signalingService = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    // Initialize services
    webrtcService.current = new WebRTCService();
    signalingService.current = new CallSignalingService();

    // Fetch test users (other users for testing)
    fetchTestUsers();

    return () => {
      cleanup();
    };
  }, []);

  // Update video elements when streams change
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [{
      id: Date.now(),
      timestamp,
      message,
      type
    }, ...prev.slice(0, 49)]); // Keep only last 50 logs
  };

  const fetchTestUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .neq('id', user?.id)
        .limit(10);

      if (error) throw error;
      setTestUsers(data || []);
    } catch (err) {
      console.error('Error fetching test users:', err);
      addLog(`Failed to fetch test users: ${err.message}`, 'error');
    }
  };

  const testMediaAccess = async () => {
    try {
      setTestStatus('testing-media');
      setError(null);
      addLog('🎥 Testing media access...', 'info');

      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: callType === 'video' ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        } : false
      };

      const stream = await webrtcService.current.getUserMedia(constraints);
      setLocalStream(stream);
      addLog(`✅ Media access successful - Audio: ${stream.getAudioTracks().length}, Video: ${stream.getVideoTracks().length}`, 'success');
      setTestStatus('media-ready');
    } catch (err) {
      setError(err.message);
      addLog(`❌ Media access failed: ${err.message}`, 'error');
      setTestStatus('error');
    }
  };

  const testPeerConnection = async () => {
    try {
      setTestStatus('testing-peer');
      addLog('🔄 Testing peer connection initialization...', 'info');

      webrtcService.current.isInitiator = true;
      
      // Setup callbacks
      webrtcService.current.onConnectionStateChange((state) => {
        setConnectionState(state);
        addLog(`🔄 Connection state: ${state}`, state === 'connected' ? 'success' : 'info');
      });

      webrtcService.current.onConnectionQuality((quality, stats) => {
        setConnectionQuality(quality);
        addLog(`📊 Connection quality: ${quality} (${JSON.stringify(stats)})`, 'info');
      });

      webrtcService.current.onError((error) => {
        addLog(`❌ WebRTC Error: ${error.message}`, 'error');
      });

      webrtcService.current.onRemoteStream((stream) => {
        setRemoteStream(stream);
        addLog('📹 Remote stream received', 'success');
      });

      await webrtcService.current.initializePeerConnection();
      addLog('✅ Peer connection initialized', 'success');

      if (localStream) {
        await webrtcService.current.addLocalStreamToPeer();
        addLog('✅ Local stream added to peer connection', 'success');
      }

      setTestStatus('peer-ready');
    } catch (err) {
      setError(err.message);
      addLog(`❌ Peer connection failed: ${err.message}`, 'error');
      setTestStatus('error');
    }
  };

  const testFullCall = async () => {
    if (!selectedUser) {
      setError('Please select a user to call');
      return;
    }

    try {
      setTestStatus('calling');
      addLog(`📞 Initiating ${callType} call to ${selectedUser.username}...`, 'info');

      // Create call record
      const call = await signalingService.current.createCall(selectedUser.id, callType);
      addLog(`✅ Call record created: ${call.id}`, 'success');

      // Setup signaling callbacks
      signalingService.current.onAnswer(async (answer) => {
        addLog('📥 Received answer', 'info');
        await webrtcService.current.setRemoteDescription(answer);
      });

      signalingService.current.onIceCandidate(async (candidate) => {
        addLog('🧊 Received ICE candidate', 'info');
        await webrtcService.current.addIceCandidate(candidate);
      });

      // Setup WebRTC callbacks for full call
      webrtcService.current.onIceCandidate((candidates) => {
        addLog(`🧊 Sending ${candidates.length} ICE candidates`, 'info');
        signalingService.current.sendIceCandidate(call.id, candidates);
      });

      // Create and send offer
      const offer = await webrtcService.current.createOffer();
      await signalingService.current.sendOffer(call.id, offer);
      addLog('📤 Offer sent', 'success');

      // Subscribe to signaling
      signalingService.current.subscribeToCall(call.id);
      addLog('🔔 Subscribed to call signaling', 'info');

      setTestStatus('waiting-answer');
    } catch (err) {
      setError(err.message);
      addLog(`❌ Call initiation failed: ${err.message}`, 'error');
      setTestStatus('error');
    }
  };

  const cleanup = () => {
    if (webrtcService.current) {
      webrtcService.current.cleanup();
    }
    if (signalingService.current) {
      signalingService.current.cleanup();
    }
    setLocalStream(null);
    setRemoteStream(null);
    setTestStatus('idle');
    addLog('🧹 Cleaned up resources', 'info');
  };

  return (
    <div className="webrtc-test">
      <div className="test-header">
        <h2>🧪 WebRTC Call Testing Suite</h2>
        <p>Test the enhanced WebRTC calling functionality step by step</p>
      </div>

      <div className="test-grid">
        {/* Control Panel */}
        <div className="test-controls">
          <h3>Controls</h3>
          
          <div className="test-section">
            <label>Call Type:</label>
            <select 
              value={callType} 
              onChange={(e) => setCallType(e.target.value)}
              disabled={testStatus !== 'idle'}
            >
              <option value="audio">Audio Only</option>
              <option value="video">Video Call</option>
            </select>
          </div>

          <div className="test-section">
            <label>Test User:</label>
            <select 
              value={selectedUser?.id || ''} 
              onChange={(e) => {
                const user = testUsers.find(u => u.id === e.target.value);
                setSelectedUser(user);
              }}
              disabled={testStatus !== 'idle'}
            >
              <option value="">Select a user...</option>
              {(testUsers || []).map(user => (
                <option key={user.id} value={user.id}>
                  {user.full_name} (@{user.username})
                </option>
              ))}
            </select>
          </div>

          <div className="test-buttons">
            <button 
              onClick={testMediaAccess}
              disabled={testStatus === 'testing-media'}
              className={testStatus === 'media-ready' ? 'success' : ''}
            >
              {testStatus === 'testing-media' ? '⏳ Testing...' : '1. Test Media Access'}
            </button>

            <button 
              onClick={testPeerConnection}
              disabled={testStatus !== 'media-ready'}
              className={testStatus === 'peer-ready' ? 'success' : ''}
            >
              2. Test Peer Connection
            </button>

            <button 
              onClick={testFullCall}
              disabled={testStatus !== 'peer-ready' || !selectedUser}
              className={testStatus === 'calling' ? 'calling' : ''}
            >
              {testStatus === 'calling' ? '📞 Calling...' : '3. Test Full Call'}
            </button>

            <button onClick={cleanup} className="cleanup">
              🧹 Cleanup
            </button>
          </div>

          {error && (
            <div className="error-message">
              ❌ {error}
            </div>
          )}
        </div>

        {/* Status Panel */}
        <div className="test-status">
          <h3>Status</h3>
          <div className="status-grid">
            <div className="status-item">
              <label>Test Status:</label>
              <span className={`status ${testStatus}`}>{testStatus}</span>
            </div>
            <div className="status-item">
              <label>Connection:</label>
              <span className={`status ${connectionState}`}>{connectionState}</span>
            </div>
            <div className="status-item">
              <label>Quality:</label>
              <span className={`status ${connectionQuality}`}>{connectionQuality}</span>
            </div>
          </div>
        </div>

        {/* Video Panel */}
        <div className="video-panel">
          <h3>Video Streams</h3>
          <div className="video-container">
            <div className="video-item">
              <label>Local Video:</label>
              <video 
                ref={localVideoRef}
                autoPlay 
                muted 
                playsInline
                className="test-video local"
              />
            </div>
            <div className="video-item">
              <label>Remote Video:</label>
              <video 
                ref={remoteVideoRef}
                autoPlay 
                playsInline
                className="test-video remote"
              />
            </div>
          </div>
        </div>

        {/* Logs Panel */}
        <div className="test-logs">
          <h3>Test Logs</h3>
          <div className="logs-container">
            {(logs || []).map(log => (
              <div key={log.id} className={`log-entry ${log.type}`}>
                <span className="log-time">{log.timestamp}</span>
                <span className="log-message">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

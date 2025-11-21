/**
 * WebRTC Service for Audio/Video Calls
 * Handles peer connections, ICE candidates, and media streams
 */

import { supabase } from '../supabaseClient';

// Enhanced STUN/TURN server configuration
const ICE_SERVERS = {
  iceServers: [
    // Google's public STUN servers
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    
    // Additional STUN servers for better connectivity
    { urls: 'stun:stunserver.org' },
    { urls: 'stun:stun.softjoys.com' },
    
    // Free TURN servers (with credentials)
    {
      urls: 'turn:a.relay.metered.ca:80',
      username: 'f1c9b90e35af38a4ecafc748',
      credential: 'FiGQ8HklJM1WYqKs'
    },
    {
      urls: 'turn:a.relay.metered.ca:80?transport=tcp',
      username: 'f1c9b90e35af38a4ecafc748',
      credential: 'FiGQ8HklJM1WYqKs'
    },
    {
      urls: 'turns:a.relay.metered.ca:443',
      username: 'f1c9b90e35af38a4ecafc748',
      credential: 'FiGQ8HklJM1WYqKs'
    }
  ],
  iceCandidatePoolSize: 10,
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require'
};

class WebRTCService {
  constructor() {
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.dataChannel = null;
    this.callId = null;
    this.isInitiator = false;
    this.onRemoteStreamCallback = null;
    this.onConnectionStateChangeCallback = null;
    this.onIceCandidateCallback = null;
    this.onConnectionQualityCallback = null;
    this.onErrorCallback = null;
    this.connectionQuality = 'good';
    this.isConnected = false;
    this.iceCandidates = [];
    this.connectionAttempts = 0;
    this.maxConnectionAttempts = 3;
    this.statsInterval = null;
  }

  /**
   * Initialize peer connection with ICE servers
   */
  async initializePeerConnection() {
    try {
      console.log('🔄 Initializing peer connection...');
      this.peerConnection = new RTCPeerConnection(ICE_SERVERS);
      this.connectionAttempts++;

      // Handle ICE candidates with batching
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('🧊 ICE candidate generated:', event.candidate.type);
          this.iceCandidates.push(event.candidate);
          
          // Batch ICE candidates to reduce signaling overhead
          setTimeout(() => {
            if (this.onIceCandidateCallback && this.iceCandidates.length > 0) {
              this.onIceCandidateCallback(this.iceCandidates.splice(0));
            }
          }, 100);
        } else {
          console.log('✅ ICE candidate gathering complete');
        }
      };

      // Enhanced connection state handling
      this.peerConnection.onconnectionstatechange = () => {
        const state = this.peerConnection.connectionState;
        console.log('🔄 Connection state changed:', state);
        
        this.isConnected = state === 'connected';
        
        if (state === 'connected') {
          this.connectionAttempts = 0;
          this.startConnectionQualityMonitoring();
        } else if (state === 'failed' || state === 'closed') {
          this.stopConnectionQualityMonitoring();
        }
        
        if (this.onConnectionStateChangeCallback) {
          this.onConnectionStateChangeCallback(state);
        }
      };

      // Handle ICE connection state changes
      this.peerConnection.oniceconnectionstatechange = () => {
        const iceState = this.peerConnection.iceConnectionState;
        console.log('🧊 ICE connection state:', iceState);
        
        if (iceState === 'failed' && this.connectionAttempts < this.maxConnectionAttempts) {
          console.log('⚠️ ICE connection failed, attempting restart...');
          this.restartIce();
        }
      };

      // Handle ICE gathering state
      this.peerConnection.onicegatheringstatechange = () => {
        console.log('🧊 ICE gathering state:', this.peerConnection.iceGatheringState);
      };

      // Enhanced remote stream handling
      this.peerConnection.ontrack = (event) => {
        console.log('📹 Remote track received:', event.track.kind);
        
        if (!this.remoteStream) {
          this.remoteStream = new MediaStream();
        }
        
        // Ensure we don't add duplicate tracks
        const existingTrack = this.remoteStream.getTracks().find(
          track => track.id === event.track.id
        );
        
        if (!existingTrack) {
          this.remoteStream.addTrack(event.track);
          
          if (this.onRemoteStreamCallback) {
            this.onRemoteStreamCallback(this.remoteStream);
          }
        }
      };

      // Create data channel for signaling
      if (this.isInitiator) {
        this.dataChannel = this.peerConnection.createDataChannel('signaling', {
          ordered: true
        });
        this.setupDataChannel();
      } else {
        this.peerConnection.ondatachannel = (event) => {
          this.dataChannel = event.channel;
          this.setupDataChannel();
        };
      }

      console.log('✅ Peer connection initialized successfully');
      return this.peerConnection;
    } catch (error) {
      console.error('❌ Failed to initialize peer connection:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback(error);
      }
      throw error;
    }
  }

  /**
   * Setup data channel for additional signaling
   */
  setupDataChannel() {
    if (!this.dataChannel) return;

    this.dataChannel.onopen = () => {
    };

    this.dataChannel.onclose = () => {
    };

    this.dataChannel.onmessage = (event) => {
    };
  }

  /**
   * Get user media (audio/video)
   * @param {Object} constraints - Media constraints
   * @returns {Promise<MediaStream>}
   */
  async getUserMedia(constraints = { audio: true, video: true }) {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      return this.localStream;
    } catch (error) {
      throw new Error(`Failed to access camera/microphone: ${error.message}`);
    }
  }

  /**
   * Add local stream to peer connection
   */
  addLocalStreamToPeer() {
    if (!this.localStream || !this.peerConnection) {
      throw new Error('Local stream or peer connection not initialized');
    }

    this.localStream.getTracks().forEach((track) => {
      this.peerConnection.addTrack(track, this.localStream);
    });
  }

  /**
   * Create and send offer
   * @returns {Promise<RTCSessionDescriptionInit>}
   */
  async createOffer() {
    try {
      if (!this.peerConnection) {
        throw new Error('Peer connection not initialized');
      }
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      await this.peerConnection.setLocalDescription(offer);
      return offer;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create and send answer
   * @returns {Promise<RTCSessionDescriptionInit>}
   */
  async createAnswer() {
    try {
      if (!this.peerConnection) {
        throw new Error('Peer connection not initialized');
      }
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      return answer;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Set remote description
   * @param {RTCSessionDescriptionInit} description
   */
  async setRemoteDescription(description) {
    try {
      if (!this.peerConnection) {
        throw new Error('Peer connection not initialized');
      }
      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(description)
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Add ICE candidate
   * @param {RTCIceCandidateInit} candidate
   */
  async addIceCandidate(candidate) {
    try {
      if (!this.peerConnection) {
        throw new Error('Peer connection not initialized');
      }

      if (candidate) {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      // Don't throw - ICE candidates can fail without breaking the connection
    }
  }

  /**
   * Toggle audio mute
   * @returns {boolean} New mute state
   */
  toggleAudio() {
    if (!this.localStream) return false;

    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      return !audioTrack.enabled;
    }
    return false;
  }

  /**
   * Toggle video
   * @returns {boolean} New video state
   */
  toggleVideo() {
    if (!this.localStream) return false;

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      return !videoTrack.enabled;
    }
    return false;
  }

  /**
   * Switch camera (front/back) on mobile
   */
  async switchCamera() {
    if (!this.localStream) return;

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (!videoTrack) return;

    try {
      // Get current facing mode
      const currentFacingMode = videoTrack.getSettings().facingMode;
      const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';

      // Stop current track
      videoTrack.stop();

      // Get new stream with different facing mode
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacingMode },
        audio: false,
      });

      const newVideoTrack = newStream.getVideoTracks()[0];

      // Replace track in peer connection
      const sender = this.peerConnection
        .getSenders()
        .find((s) => s.track && s.track.kind === 'video');

      if (sender) {
        await sender.replaceTrack(newVideoTrack);
      }

      // Replace track in local stream
      this.localStream.removeTrack(videoTrack);
      this.localStream.addTrack(newVideoTrack);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get connection statistics
   * @returns {Promise<Object>}
   */
  async getStats() {
    if (!this.peerConnection) return null;

    try {
      const stats = await this.peerConnection.getStats();
      const statsReport = {};

      stats.forEach((report) => {
        if (report.type === 'inbound-rtp' || report.type === 'outbound-rtp') {
          statsReport[report.type] = report;
        }
      });

      return statsReport;
    } catch (error) {
      return null;
    }
  }

  /**
   * Close connection and cleanup
   */
  close() {
    // Stop all tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        track.stop();
      });
      this.localStream = null;
    }

    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach((track) => {
        track.stop();
      });
      this.remoteStream = null;
    }

    // Close data channel
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Reset callbacks
    this.onRemoteStreamCallback = null;
    this.onConnectionStateChangeCallback = null;
    this.onIceCandidateCallback = null;
  }

  /**
   * Set callback for remote stream
   * @param {Function} callback
   */
  onRemoteStream(callback) {
    this.onRemoteStreamCallback = callback;
  }

  /**
   * Set callback for connection state changes
   * @param {Function} callback
   */
  onConnectionStateChange(callback) {
    this.onConnectionStateChangeCallback = callback;
  }

  /**
   * Set callback for ICE candidates
   * @param {Function} callback
   */
  onIceCandidate(callback) {
    this.onIceCandidateCallback = callback;
  }

  /**
   * Set callback for connection quality updates
   * @param {Function} callback
   */
  onConnectionQuality(callback) {
    this.onConnectionQualityCallback = callback;
  }

  /**
   * Set callback for errors
   * @param {Function} callback
   */
  onError(callback) {
    this.onErrorCallback = callback;
  }

  /**
   * Start monitoring connection quality
   */
  startConnectionQualityMonitoring() {
    if (this.statsInterval) return;

    this.statsInterval = setInterval(async () => {
      try {
        const stats = await this.getStats();
        if (stats) {
          this.analyzeConnectionQuality(stats);
        }
      } catch (error) {
        console.error('Error getting connection stats:', error);
      }
    }, 2000);
  }

  /**
   * Stop monitoring connection quality
   */
  stopConnectionQualityMonitoring() {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }
  }

  /**
   * Analyze connection quality from stats
   * @param {Object} stats - Connection statistics
   */
  analyzeConnectionQuality(stats) {
    let quality = 'excellent';
    
    if (stats.packetLoss > 5 || stats.latency > 300) {
      quality = 'poor';
    } else if (stats.packetLoss > 2 || stats.latency > 150) {
      quality = 'good';
    }

    if (quality !== this.connectionQuality) {
      this.connectionQuality = quality;
      if (this.onConnectionQualityCallback) {
        this.onConnectionQualityCallback(quality, stats);
      }
    }
  }

  /**
   * Restart ICE connection
   */
  async restartIce() {
    if (!this.peerConnection) return;

    try {
      console.log('🔄 Restarting ICE connection...');
      await this.peerConnection.restartIce();
    } catch (error) {
      console.error('❌ Failed to restart ICE:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback(error);
      }
    }
  }

  /**
   * Clean up all resources
   */
  cleanup() {
    console.log('🧹 Cleaning up WebRTC resources...');
    
    this.stopConnectionQualityMonitoring();
    
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop();
      });
      this.localStream = null;
    }

    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => {
        track.stop();
      });
      this.remoteStream = null;
    }

    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.isConnected = false;
    this.connectionAttempts = 0;
    this.iceCandidates = [];
  }
}

export default WebRTCService;
export { WebRTCService };

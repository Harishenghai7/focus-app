/**
 * Call Signaling Service
 * Handles WebRTC signaling via Supabase Realtime
 */

import { supabase } from '../supabaseClient';

class CallSignalingService {
  constructor() {
    this.callChannel = null;
    this.currentCallId = null;
    this.onOfferCallback = null;
    this.onAnswerCallback = null;
    this.onIceCandidateCallback = null;
    this.onCallEndCallback = null;
  }

  /**
   * Create a new call in the database
   * @param {string} receiverId - UUID of the receiver
   * @param {string} callType - 'audio' or 'video'
   * @returns {Promise<Object>} Call record
   */
  async createCall(receiverId, callType = 'video') {
    try {
      const { data: call, error } = await supabase
        .from('calls')
        .insert({
          receiver_id: receiverId,
          call_type: callType,
          status: 'initiated',
        })
        .select()
        .single();

      if (error) throw error;

      this.currentCallId = call.id;
      return call;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update call status
   * @param {string} callId - Call UUID
   * @param {string} status - New status
   * @param {Object} additionalData - Additional fields to update
   */
  async updateCallStatus(callId, status, additionalData = {}) {
    try {
      const updateData = {
        status,
        ...additionalData,
      };

      // Add timestamps based on status
      if (status === 'active' && !additionalData.answered_at) {
        updateData.answered_at = new Date().toISOString();
      } else if (['completed', 'missed', 'declined', 'failed'].includes(status)) {
        updateData.ended_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('calls')
        .update(updateData)
        .eq('id', callId);

      if (error) throw error;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send WebRTC offer
   * @param {string} callId - Call UUID
   * @param {RTCSessionDescriptionInit} offer - SDP offer
   */
  async sendOffer(callId, offer) {
    try {
      const { error } = await supabase
        .from('call_signaling')
        .insert({
          call_id: callId,
          signal_type: 'offer',
          signal_data: offer,
        });

      if (error) throw error;

      // Update call status to ringing
      await this.updateCallStatus(callId, 'ringing');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send WebRTC answer
   * @param {string} callId - Call UUID
   * @param {RTCSessionDescriptionInit} answer - SDP answer
   */
  async sendAnswer(callId, answer) {
    try {
      const { error } = await supabase
        .from('call_signaling')
        .insert({
          call_id: callId,
          signal_type: 'answer',
          signal_data: answer,
        });

      if (error) throw error;

      // Update call status to active
      await this.updateCallStatus(callId, 'active');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send ICE candidate
   * @param {string} callId - Call UUID
   * @param {RTCIceCandidateInit} candidate - ICE candidate
   */
  async sendIceCandidate(callId, candidate) {
    try {
      const { error } = await supabase
        .from('call_signaling')
        .insert({
          call_id: callId,
          signal_type: 'ice-candidate',
          signal_data: candidate,
        });

      if (error) throw error;
    } catch (error) {
      // Don't throw - ICE candidates can fail without breaking the call
    }
  }

  /**
   * Subscribe to call signaling channel
   * @param {string} callId - Call UUID
   */
  subscribeToCall(callId) {
    if (this.callChannel) {
      this.unsubscribe();
    }
    this.callChannel = supabase
      .channel(`call:${callId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_signaling',
          filter: `call_id=eq.${callId}`,
        },
        (payload) => {
          this.handleSignalingMessage(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'calls',
          filter: `id=eq.${callId}`,
        },
        (payload) => {
          this.handleCallUpdate(payload.new);
        }
      )
      .subscribe((status) => {
      });

    this.currentCallId = callId;
  }

  /**
   * Handle incoming signaling message
   * @param {Object} message - Signaling message
   */
  handleSignalingMessage(message) {
    switch (message.signal_type) {
      case 'offer':
        if (this.onOfferCallback) {
          this.onOfferCallback(message.signal_data);
        }
        break;

      case 'answer':
        if (this.onAnswerCallback) {
          this.onAnswerCallback(message.signal_data);
        }
        break;

      case 'ice-candidate':
        if (this.onIceCandidateCallback) {
          this.onIceCandidateCallback(message.signal_data);
        }
        break;

      default:
    }
  }

  /**
   * Handle call status update
   * @param {Object} call - Updated call record
   */
  handleCallUpdate(call) {
    if (['completed', 'declined', 'failed', 'missed'].includes(call.status)) {
      if (this.onCallEndCallback) {
        this.onCallEndCallback(call.status);
      }
    }
  }

  /**
   * Accept incoming call
   * @param {string} callId - Call UUID
   */
  async acceptCall(callId) {
    try {
      await this.updateCallStatus(callId, 'active', {
        answered_at: new Date().toISOString(),
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Decline incoming call
   * @param {string} callId - Call UUID
   */
  async declineCall(callId) {
    try {
      await this.updateCallStatus(callId, 'declined');
    } catch (error) {
      throw error;
    }
  }

  /**
   * End active call
   * @param {string} callId - Call UUID
   */
  async endCall(callId) {
    try {
      await this.updateCallStatus(callId, 'completed');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Mark call as missed
   * @param {string} callId - Call UUID
   */
  async markCallAsMissed(callId) {
    try {
      await this.updateCallStatus(callId, 'missed');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get call details
   * @param {string} callId - Call UUID
   * @returns {Promise<Object>} Call record
   */
  async getCall(callId) {
    try {
      const { data: call, error } = await supabase
        .from('calls')
        .select(`
          *,
          caller:caller_id(id, username, full_name, avatar_url),
          receiver:receiver_id(id, username, full_name, avatar_url)
        `)
        .eq('id', callId)
        .single();

      if (error) throw error;

      return call;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Listen for incoming calls
   * @param {string} userId - Current user UUID
   * @param {Function} callback - Callback for incoming calls
   */
  listenForIncomingCalls(userId, callback) {
    const channel = supabase
      .channel(`incoming-calls:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'calls',
          filter: `receiver_id=eq.${userId}`,
        },
        async (payload) => {
          // Get full call details with user info
          const call = await this.getCall(payload.new.id);
          callback(call);
        }
      )
      .subscribe();

    return channel;
  }

  /**
   * Unsubscribe from call signaling
   */
  unsubscribe() {
    if (this.callChannel) {
      supabase.removeChannel(this.callChannel);
      this.callChannel = null;
      this.currentCallId = null;
    }
  }

  /**
   * Set callback for offer
   * @param {Function} callback
   */
  onOffer(callback) {
    this.onOfferCallback = callback;
  }

  /**
   * Set callback for answer
   * @param {Function} callback
   */
  onAnswer(callback) {
    this.onAnswerCallback = callback;
  }

  /**
   * Set callback for ICE candidate
   * @param {Function} callback
   */
  onIceCandidate(callback) {
    this.onIceCandidateCallback = callback;
  }

  /**
   * Set callback for call end
   * @param {Function} callback
   */
  onCallEnd(callback) {
    this.onCallEndCallback = callback;
  }

  /**
   * Cleanup
   */
  cleanup() {
    this.unsubscribe();
    this.onOfferCallback = null;
    this.onAnswerCallback = null;
    this.onIceCandidateCallback = null;
    this.onCallEndCallback = null;
    this.currentCallId = null;
  }
}

export default CallSignalingService;

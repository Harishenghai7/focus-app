import { supabase } from "../supabaseClient";

// Create a new call row with offer and caller ICE candidates.
export async function createCall(callerId, calleeId, offer, callerCandidates) {
  const { data, error } = await supabase.from("calls").insert([
    {
      caller_id: callerId,
      callee_id: calleeId,
      offer,
      caller_candidates: callerCandidates,
      status: "calling",
    },
  ]).select().single();

  if (error) throw error;
  return data;
}

// Listen to new incoming call offers for a callee.
export function subscribeToIncomingCalls(calleeId, onCall) {
  try {
    if (!supabase?.channel) {
      console.warn('Supabase channel not available');
      return () => {};
    }
    
    const channel = supabase
      .channel(`calls-for-user-${calleeId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "calls", filter: `callee_id=eq.${calleeId}` },
        (payload) => onCall(payload.new)
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (error) {
        console.warn('Error removing channel:', error);
      }
    };
  } catch (error) {
    console.warn('Error subscribing to calls:', error);
    return () => {};
  }
}

// Update a call with answer and callee ICE candidates.
export async function answerCall(callId, answer, calleeCandidates) {
  const { data, error } = await supabase
    .from("calls")
    .update({
      answer,
      callee_candidates: calleeCandidates,
      status: "accepted",
      updated_at: new Date().toISOString(),
    })
    .eq("id", callId);

  if (error) throw error;
  return data;
}

// End or reject a call.
export async function endCall(callId) {
  const { data, error } = await supabase
    .from("calls")
    .update({
      status: "ended",
      updated_at: new Date().toISOString(),
    })
    .eq("id", callId);

  if (error) throw error;
  return data;
}

// Subscribe to call updates for a given call id.
export function subscribeToCallUpdates(callId, onUpdate) {
  try {
    if (!supabase?.channel) {
      console.warn('Supabase channel not available');
      return () => {};
    }
    
    const channel = supabase
      .channel(`call-updates-${callId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "calls", filter: `id=eq.${callId}` },
        (payload) => onUpdate(payload.new)
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (error) {
        console.warn('Error removing channel:', error);
      }
    };
  } catch (error) {
    console.warn('Error subscribing to call updates:', error);
    return () => {};
  }
}

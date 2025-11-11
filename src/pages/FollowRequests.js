import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './FollowRequests.css';

export default function FollowRequests({ user }) {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequests, setSelectedRequests] = useState(new Set());
  const [processing, setProcessing] = useState({});
  const [bulkProcessing, setBulkProcessing] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchFollowRequests();
    }
  }, [user?.id]);

  const fetchFollowRequests = async () => {
    try {
      setLoading(true);
      
      // Fetch pending follow requests
      const { data, error } = await supabase
        .from('follows')
        .select(`
          id,
          follower_id,
          created_at,
          follower:profiles!follows_follower_id_fkey(
            id,
            username,
            full_name,
            avatar_url,
            verified
          )
        `)
        .eq('following_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRequests(data || []);
    } catch (error) {
      console.error("Error fetching follow requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId, followerId) => {
    try {
      setProcessing(prev => ({ ...prev, [requestId]: 'approving' }));

      // Update follow status to active
      const { error } = await supabase
        .from('follows')
        .update({ status: 'active' })
        .eq('id', requestId);

      if (error) throw error;

      // Update follower count
      await updateFollowerCounts(followerId, user.id, 'increment');

      // Remove from requests list
      setRequests(prev => prev.filter(req => req.id !== requestId));

      // Create notification
      await supabase.from('notifications').insert({
        user_id: followerId,
        type: 'follow',
        from_user_id: user.id,
        content: 'accepted your follow request',
        read: false
      });

    } catch (error) {
      console.error("Error approving request:", error);
      alert("Failed to approve request");
    } finally {
      setProcessing(prev => {
        const newState = { ...prev };
        delete newState[requestId];
        return newState;
      });
    }
  };

  const handleReject = async (requestId) => {
    try {
      setProcessing(prev => ({ ...prev, [requestId]: 'rejecting' }));

      // Delete the follow request
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      // Remove from requests list
      setRequests(prev => prev.filter(req => req.id !== requestId));

    } catch (error) {
      console.error("Error rejecting request:", error);
      alert("Failed to reject request");
    } finally {
      setProcessing(prev => {
        const newState = { ...prev };
        delete newState[requestId];
        return newState;
      });
    }
  };

  const updateFollowerCounts = async (followerId, followingId, action) => {
    const increment = action === 'increment' ? 1 : -1;

    // Update follower count for the user being followed
    await supabase.rpc('increment_follower_count', {
      user_id: followingId,
      increment_by: increment
    }).catch(() => {
      // Fallback if RPC doesn't exist
      supabase.from('profiles')
        .update({ followers_count: supabase.raw(`followers_count + ${increment}`) })
        .eq('id', followingId);
    });

    // Update following count for the follower
    await supabase.rpc('increment_following_count', {
      user_id: followerId,
      increment_by: increment
    }).catch(() => {
      // Fallback if RPC doesn't exist
      supabase.from('profiles')
        .update({ following_count: supabase.raw(`following_count + ${increment}`) })
        .eq('id', followerId);
    });
  };

  const toggleSelectRequest = (requestId) => {
    setSelectedRequests(prev => {
      const newSet = new Set(prev);
      if (newSet.has(requestId)) {
        newSet.delete(requestId);
      } else {
        newSet.add(requestId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedRequests.size === requests.length) {
      setSelectedRequests(new Set());
    } else {
      setSelectedRequests(new Set(requests.map(r => r.id)));
    }
  };

  const handleBulkApprove = async () => {
    if (selectedRequests.size === 0) return;
    
    if (!window.confirm(`Approve ${selectedRequests.size} follow request(s)?`)) return;

    try {
      setBulkProcessing(true);

      // Convert selected requests to array
      const selectedIds = Array.from(selectedRequests);
      
      // Update all selected requests to active status
      const { error: updateError } = await supabase
        .from('follows')
        .update({ status: 'active' })
        .in('id', selectedIds);

      if (updateError) throw updateError;

      // Update follower counts for each approved request
      const approvedRequests = requests.filter(r => selectedIds.includes(r.id));
      for (const request of approvedRequests) {
        await updateFollowerCounts(request.follower_id, user.id, 'increment');
        
        // Create notification for each approved request
        await supabase.from('notifications').insert({
          user_id: request.follower_id,
          type: 'follow',
          actor_id: user.id,
          text: 'accepted your follow request',
          is_read: false
        });
      }

      // Remove approved requests from list
      setRequests(prev => prev.filter(req => !selectedIds.includes(req.id)));
      setSelectedRequests(new Set());

    } catch (error) {
      console.error("Error bulk approving requests:", error);
      alert("Failed to approve some requests");
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedRequests.size === 0) return;
    
    if (!window.confirm(`Reject ${selectedRequests.size} follow request(s)?`)) return;

    try {
      setBulkProcessing(true);

      // Convert selected requests to array
      const selectedIds = Array.from(selectedRequests);
      
      // Delete all selected requests
      const { error } = await supabase
        .from('follows')
        .delete()
        .in('id', selectedIds);

      if (error) throw error;

      // Remove rejected requests from list
      setRequests(prev => prev.filter(req => !selectedIds.includes(req.id)));
      setSelectedRequests(new Set());

    } catch (error) {
      console.error("Error bulk rejecting requests:", error);
      alert("Failed to reject some requests");
    } finally {
      setBulkProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="page page-follow-requests">
        <div className="page-inner">
          <div className="page-header">
            <button className="btn-back" onClick={() => navigate(-1)}>
              ← Back
            </button>
            <h1>Follow Requests</h1>
          </div>
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading requests...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="page page-follow-requests"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="page-inner">
        <div className="page-header">
          <button className="btn-back" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <h1>Follow Requests</h1>
          {requests.length > 0 && (
            <span className="requests-count">{requests.length}</span>
          )}
        </div>

        {requests.length > 0 && (
          <div className="bulk-actions-bar">
            <div className="select-all-container">
              <input
                type="checkbox"
                id="select-all"
                checked={selectedRequests.size === requests.length && requests.length > 0}
                onChange={toggleSelectAll}
                className="select-checkbox"
              />
              <label htmlFor="select-all">
                {selectedRequests.size > 0 
                  ? `${selectedRequests.size} selected` 
                  : 'Select all'}
              </label>
            </div>

            {selectedRequests.size > 0 && (
              <div className="bulk-actions">
                <button
                  className="btn-bulk-approve"
                  onClick={handleBulkApprove}
                  disabled={bulkProcessing}
                >
                  {bulkProcessing ? 'Processing...' : `Approve (${selectedRequests.size})`}
                </button>
                <button
                  className="btn-bulk-reject"
                  onClick={handleBulkReject}
                  disabled={bulkProcessing}
                >
                  {bulkProcessing ? 'Processing...' : `Reject (${selectedRequests.size})`}
                </button>
              </div>
            )}
          </div>
        )}

        <div className="follow-requests-content">
          {requests.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <h2>No Pending Requests</h2>
              <p>You don't have any follow requests at the moment.</p>
            </div>
          ) : (
            <div className="requests-list">
              <AnimatePresence>
                {requests.map((request) => (
                  <motion.div
                    key={request.id}
                    className={`request-card ${selectedRequests.has(request.id) ? 'selected' : ''}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="request-checkbox-container">
                      <input
                        type="checkbox"
                        checked={selectedRequests.has(request.id)}
                        onChange={() => toggleSelectRequest(request.id)}
                        className="select-checkbox"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    <div 
                      className="request-user"
                      onClick={() => navigate(`/profile/${request.follower.username}`)}
                    >
                      <img
                        src={request.follower.avatar_url || "/default-avatar.png"}
                        alt={request.follower.username}
                        className="request-avatar"
                      />
                      <div className="request-info">
                        <div className="request-username">
                          {request.follower.username}
                          {request.follower.verified && <span className="verified-badge">✓</span>}
                        </div>
                        <div className="request-fullname">{request.follower.full_name}</div>
                        <div className="request-time">
                          {new Date(request.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: new Date(request.created_at).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="request-actions">
                      <button
                        className="btn-approve"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApprove(request.id, request.follower_id);
                        }}
                        disabled={processing[request.id]}
                      >
                        {processing[request.id] === 'approving' ? 'Approving...' : 'Approve'}
                      </button>
                      <button
                        className="btn-reject"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReject(request.id);
                        }}
                        disabled={processing[request.id]}
                      >
                        {processing[request.id] === 'rejecting' ? 'Rejecting...' : 'Reject'}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

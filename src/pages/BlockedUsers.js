import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import "./BlockedUsers.css";

export default function BlockedUsers({ user }) {
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unblocking, setUnblocking] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.id) {
      fetchBlockedUsers();
    }
  }, [user?.id]);

  const fetchBlockedUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch blocked users
      const { data, error } = await supabase
        .from('blocked_users')
        .select(`
          id,
          blocked_id,
          created_at,
          blocked:profiles!blocked_users_blocked_id_fkey(
            id,
            username,
            full_name,
            avatar_url,
            verified
          )
        `)
        .eq('blocker_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setBlockedUsers(data || []);
    } catch (error) {
      console.error("Error fetching blocked users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (blockId, blockedUserId) => {
    if (!window.confirm("Are you sure you want to unblock this user?")) {
      return;
    }

    try {
      setUnblocking(prev => ({ ...prev, [blockId]: true }));

      // Delete the block record
      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('id', blockId);

      if (error) throw error;

      // Remove from blocked users list
      setBlockedUsers(prev => prev.filter(block => block.id !== blockId));

    } catch (error) {
      console.error("Error unblocking user:", error);
      alert("Failed to unblock user");
    } finally {
      setUnblocking(prev => {
        const newState = { ...prev };
        delete newState[blockId];
        return newState;
      });
    }
  };

  if (loading) {
    return (
      <div className="page page-blocked-users">
        <div className="page-inner">
          <div className="page-header">
            <button className="btn-back" onClick={() => navigate(-1)}>
              ← Back
            </button>
            <h1>Blocked Users</h1>
          </div>
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading blocked users...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="page page-blocked-users"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="page-inner">
        <div className="page-header">
          <button className="btn-back" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <h1>Blocked Users</h1>
        </div>

        <div className="blocked-users-info">
          <p>
            Blocked users cannot see your posts, stories, or profile. 
            They also cannot send you messages or follow you.
          </p>
        </div>

        <div className="blocked-users-content">
          {blockedUsers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🚫</div>
              <h2>No Blocked Users</h2>
              <p>You haven't blocked anyone yet.</p>
            </div>
          ) : (
            <div className="blocked-users-list">
              {blockedUsers.map((block) => (
                <motion.div
                  key={block.id}
                  className="blocked-user-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                >
                  <div className="blocked-user-info">
                    <img
                      src={block.blocked.avatar_url || "/default-avatar.png"}
                      alt={block.blocked.username}
                      className="blocked-user-avatar"
                    />
                    <div className="blocked-user-details">
                      <div className="blocked-user-username">
                        {block.blocked.username}
                        {block.blocked.verified && <span className="verified-badge">✓</span>}
                      </div>
                      <div className="blocked-user-fullname">{block.blocked.full_name}</div>
                      <div className="blocked-user-time">
                        Blocked {new Date(block.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <button
                    className="btn-unblock"
                    onClick={() => handleUnblock(block.id, block.blocked_id)}
                    disabled={unblocking[block.id]}
                  >
                    {unblocking[block.id] ? 'Unblocking...' : 'Unblock'}
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

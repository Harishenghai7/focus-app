import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import { triggerHaptic } from "../utils/haptics";
import { notifyFollow, notifyFollowRequest, deleteNotification } from "../utils/notificationService";
import "./FollowButton.css";

export default function FollowButton({ myUserId, profileUserId, isPrivate = false }) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [followStatus, setFollowStatus] = useState(null); // 'pending', 'active', or null
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!myUserId || !profileUserId || myUserId === profileUserId) return;
    const checkFollowing = async () => {
      const { data, error } = await supabase
        .from("follows")
        .select("id, status")
        .eq("follower_id", myUserId)
        .eq("following_id", profileUserId)
        .single();
      
      if (!error && data) {
        setFollowStatus(data.status);
        setIsFollowing(data.status === 'active');
      } else {
        setFollowStatus(null);
        setIsFollowing(false);
      }
    };
    checkFollowing();
  }, [myUserId, profileUserId]);

  const toggleFollow = async () => {
    if (!myUserId || !profileUserId || myUserId === profileUserId) return;
    
    setLoading(true);
    const wasFollowing = isFollowing;
    const wasStatus = followStatus;
    
    // Trigger haptic feedback
    triggerHaptic('light');
    
    // Optimistic update
    if (wasFollowing || wasStatus === 'pending') {
      setIsFollowing(false);
      setFollowStatus(null);
    } else {
      const newStatus = isPrivate ? 'pending' : 'active';
      setFollowStatus(newStatus);
      setIsFollowing(newStatus === 'active');
    }
    
    try {
      if (wasFollowing || wasStatus === 'pending') {
        // Unfollow or cancel request
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", myUserId)
          .eq("following_id", profileUserId);
        if (error) throw error;

        // Delete follow notification
        const notificationType = wasStatus === 'pending' ? 'follow_request' : 'follow';
        await deleteNotification(profileUserId, myUserId, notificationType);
      } else {
        // Follow
        const newStatus = isPrivate ? 'pending' : 'active';
        const { data, error } = await supabase
          .from("follows")
          .insert({
            follower_id: myUserId,
            following_id: profileUserId,
            status: newStatus
          })
          .select()
          .single();
        if (error) throw error;
        
        // Create notification
        if (newStatus === 'pending') {
          await notifyFollowRequest(profileUserId, myUserId, data.id);
        } else {
          await notifyFollow(profileUserId, myUserId);
        }
        
        // Show success animation for active follows
        if (newStatus === 'active') {
          setShowSuccess(true);
          triggerHaptic('success');
          setTimeout(() => setShowSuccess(false), 1500);
        }
      }
    } catch (err) {
      console.error("Follow/unfollow error:", err);
      // Revert optimistic update
      setIsFollowing(wasFollowing);
      setFollowStatus(wasStatus);
      triggerHaptic('error');
      alert("Failed to " + (wasFollowing ? "unfollow" : "follow") + ". Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Don't show button if viewing own profile
  if (!myUserId || !profileUserId || myUserId === profileUserId) {
    return null;
  }

  const getButtonText = () => {
    if (loading) return "";
    if (followStatus === 'pending') return "Requested";
    if (isFollowing) return "Following";
    return "Follow";
  };

  const getButtonClass = () => {
    if (followStatus === 'pending') return "follow-btn-pending";
    if (isFollowing) return "follow-btn-following";
    return "follow-btn-follow";
  };

  return (
    <motion.button 
      onClick={toggleFollow} 
      disabled={loading} 
      className={`follow-btn ${getButtonClass()}`}
      whileHover={{ scale: loading ? 1 : 1.05 }}
      whileTap={{ scale: loading ? 1 : 0.95 }}
      transition={{ 
        type: "spring", 
        stiffness: 400, 
        damping: 17 
      }}
    >
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="follow-btn-content"
          >
            <div className="follow-btn-spinner" />
          </motion.div>
        ) : (
          <motion.div
            key="text"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="follow-btn-content"
          >
            {getButtonText()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success checkmark animation */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            className="follow-btn-success"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 500, 
              damping: 15 
            }}
          >
            ✓
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

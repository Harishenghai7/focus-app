import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createRingtone, sendCallPushNotification } from '../utils/callNotifications';
import './IncomingCallModal.css';

export default function IncomingCallModal({ call, onAccept, onDecline }) {
  const ringtoneRef = useRef(null);

  useEffect(() => {
    if (call) {
      // Create and play ringtone
      ringtoneRef.current = createRingtone();
      ringtoneRef.current.play();

      // Send push notification
      sendCallPushNotification(call.caller, call.call_type);

      // Auto-decline after 30 seconds
      const timeout = setTimeout(() => {
        onDecline();
      }, 30000);

      return () => {
        if (ringtoneRef.current) {
          ringtoneRef.current.stop();
        }
        clearTimeout(timeout);
      };
    }
  }, [call, onDecline]);

  if (!call) return null;

  const caller = call.caller;
  const isVideo = call.call_type === 'video';

  return (
    <AnimatePresence>
      <motion.div
        className="incoming-call-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="incoming-call-modal"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
        >
          <div className="incoming-call-header">
            <h2>Incoming {isVideo ? 'Video' : 'Audio'} Call</h2>
          </div>

          <div className="incoming-call-body">
            <div className="caller-avatar-container">
              <motion.img
                src={caller?.avatar_url || `https://ui-avatars.com/api/?name=${caller?.username}&size=200`}
                alt={caller?.username}
                className="caller-avatar"
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <motion.div
                className="pulse-ring"
                animate={{
                  scale: [1, 1.5],
                  opacity: [0.5, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeOut',
                }}
              />
            </div>

            <h3 className="caller-name">{caller?.full_name || caller?.username}</h3>
            <p className="caller-username">@{caller?.username}</p>
            <p className="call-type-label">
              {isVideo ? (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z"/>
                  </svg>
                  Video Call
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6.62,10.79C8.06,13.62 10.38,15.94 13.21,17.38L15.41,15.18C15.69,14.9 16.08,14.82 16.43,14.93C17.55,15.3 18.75,15.5 20,15.5A1,1 0 0,1 21,16.5V20A1,1 0 0,1 20,21A17,17 0 0,1 3,4A1,1 0 0,1 4,3H7.5A1,1 0 0,1 8.5,4C8.5,5.25 8.7,6.45 9.07,7.57C9.18,7.92 9.1,8.31 8.82,8.59L6.62,10.79Z"/>
                  </svg>
                  Audio Call
                </>
              )}
            </p>
          </div>

          <div className="incoming-call-actions">
            <motion.button
              className="call-action-btn decline-btn"
              onClick={onDecline}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/>
              </svg>
              <span>Decline</span>
            </motion.button>

            <motion.button
              className="call-action-btn accept-btn"
              onClick={onAccept}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
              </svg>
              <span>Accept</span>
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * LifeBreakNudge.js
 * =================
 * After 45 minutes of continuous Boltz, Focusly appears
 * in "concerned" mode and suggests a real-world activity.
 * 5-minute mandatory cooldown before continuing.
 *
 * H2 Innovative — Teen Care
 */

import React, { useState, useEffect } from 'react';
import FocuslyLion from '../focusly-ai/FocuslyLion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import styles from './LifeBreakNudge.module.css';

const ACTIVITIES = [
  { emoji: '🚶', title: 'Go for a walk', desc: '10 minutes of walking refreshes your mind more than 1 hour of scrolling.' },
  { emoji: '📞', title: 'Call a friend', desc: 'Real connection > digital connection. Someone misses your voice.' },
  { emoji: '💧', title: 'Drink water & stretch', desc: 'Hydrate. Your body has been still for 45 minutes.' },
  { emoji: '📚', title: 'Read for 15 minutes', desc: 'Your focus improves by 23% after reading. Invest in your brain.' },
  { emoji: '🧘', title: 'Take 5 deep breaths', desc: 'Reset your nervous system. Breathe in for 4, hold for 7, out for 8.' },
  { emoji: '✏️', title: 'Write in a journal', desc: 'Reflect on your day. Words on paper clear mental fog.' },
  { emoji: '🎵', title: 'Listen to one full song', desc: 'No skipping. Just be present in the music for 3 minutes.' },
  { emoji: '🌿', title: 'Step outside', desc: 'Sunlight and fresh air reset your focus chemicals instantly.' },
];

// Pick a random activity
const getRandomActivity = () => ACTIVITIES[Math.floor(Math.random() * ACTIVITIES.length)];

const COOLDOWN_MINUTES = 5;

const LifeBreakNudge = ({ isVisible, onDismiss, sessionMinutes = 45 }) => {
  const { user } = useAuth();
  const [activity] = useState(getRandomActivity);
  const [cooldown, setCooldown] = useState(COOLDOWN_MINUTES * 60); // seconds
  const [accepted, setAccepted] = useState(false);
  const [animIn, setAnimIn] = useState(false);

  useEffect(() => {
    if (isVisible) setTimeout(() => setAnimIn(true), 50);
  }, [isVisible]);

  // Cooldown timer
  useEffect(() => {
    if (!isVisible || accepted) return;
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible, accepted, cooldown]);

  const formatCooldown = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `0:${String(s).padStart(2, '0')}`;
  };

  const handleAccept = async () => {
    setAccepted(true);
    // Log break taken
    if (user?.id) {
      await supabase.from('life_break_logs').insert({
        user_id: user.id,
        break_taken: true,
        activity_chosen: activity.title,
        duration_before_break: sessionMinutes,
      });
    }
    setTimeout(() => onDismiss?.(), 2000);
  };

  const handleSnooze = async () => {
    // Snooze for 15 more minutes — log it
    if (user?.id) {
      await supabase.from('life_break_logs').insert({
        user_id: user.id,
        break_taken: false,
        activity_chosen: 'snoozed',
        duration_before_break: sessionMinutes,
        snooze_count: 1,
      });
    }
    onDismiss?.('snooze');
  };

  if (!isVisible) return null;

  return (
    <div className={`${styles.overlay} ${animIn ? styles.overlayVisible : ''}`}>
      <div className={`${styles.card} ${animIn ? styles.cardVisible : ''}`}>

        {/* Focusly in concerned/guardian mode */}
        <div className={styles.lionWrap}>
          <FocuslyLion emotion="sad" gesture="concerned" className={styles.lion} />
          <div className={styles.heartBeat}>💜</div>
        </div>

        <div className={styles.badge}>⏰ 45-Minute Life Break</div>

        <h2 className={styles.title}>
          {accepted ? '🌟 Enjoy Your Break!' : 'Hey! Step away for a moment.'}
        </h2>

        {!accepted ? (
          <>
            <p className={styles.subtitle}>
              You've been on Boltz for <strong>{sessionMinutes} minutes</strong>.
              Focusly cares about your real life too.
            </p>

            {/* Activity card */}
            <div className={styles.activityCard}>
              <div className={styles.activityEmoji}>{activity.emoji}</div>
              <div className={styles.activityContent}>
                <strong className={styles.activityTitle}>{activity.title}</strong>
                <p className={styles.activityDesc}>{activity.desc}</p>
              </div>
            </div>

            {/* Cooldown */}
            {cooldown > 0 && (
              <div className={styles.cooldownBox}>
                <div className={styles.cooldownRing}>
                  <svg viewBox="0 0 44 44" className={styles.cooldownSvg}>
                    <circle cx="22" cy="22" r="18" className={styles.cooldownTrack} />
                    <circle
                      cx="22" cy="22" r="18"
                      className={styles.cooldownProgress}
                      strokeDasharray={`${((1 - cooldown / (COOLDOWN_MINUTES * 60)) * 113).toFixed(1)} 113`}
                    />
                  </svg>
                  <span className={styles.cooldownTime}>{formatCooldown(cooldown)}</span>
                </div>
                <p className={styles.cooldownText}>Take a breath. Continue in {formatCooldown(cooldown)}</p>
              </div>
            )}

            <div className={styles.actions}>
              <button
                className={styles.acceptBtn}
                onClick={handleAccept}
              >
                {activity.emoji} I'll Take a Break!
              </button>
              <button
                className={styles.snoozeBtn}
                onClick={handleSnooze}
                disabled={cooldown > 0}
              >
                {cooldown > 0 ? `Please wait ${formatCooldown(cooldown)}` : 'Remind me in 15 mins'}
              </button>
            </div>
          </>
        ) : (
          <div className={styles.acceptedState}>
            <p>Amazing! Focusly is proud of you. 🦁</p>
            <p className={styles.acceptedSub}>Your real-world moments matter most. See you when you're back!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LifeBreakNudge;

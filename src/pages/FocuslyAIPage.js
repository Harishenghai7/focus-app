/**
 * FocuslyAIPage.js
 * ================
 * 🦁 FOCUSLY AI — Transformer-Powered Companion
 *
 * Left: Greeting + Focusly lion + mood badge + voice + AI status
 * Right: Chat panel with header, messages, suggestions, input
 *
 * Powered by @xenova/transformers — real AI, 100% in-browser.
 * H2 Sovereign Design System.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Send, Volume2, VolumeX, Sparkles } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import FocuslyLion from '../components/focusly/FocuslyLion';
import { useFocusly } from '../context/FocuslyContext';
import { useFocuslyVoice } from '../hooks/useFocuslyVoice';
import { useFocuslyEmotion } from '../hooks/useFocuslyEmotion';
import useFocuslyMemory from '../hooks/useFocuslyMemory';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import { processMessage, getModelStatus } from '../utils/FocuslyBrain';
import { useAuth } from '../context/AuthContext';
import styles from './FocuslyAIPage.module.css';

// ── Suggestion sets ──
const SUGGESTIONS = {
  default: [
    "💪 Motivate me",
    "🧠 Productivity tips",
    "😌 Help me relax",
    "🎯 Set a focus goal",
  ],
  morning: [
    "☀️ Morning routine",
    "📋 Plan my day",
    "💪 Motivate me",
    "🧘 Mindful start",
  ],
  night: [
    "🌙 Wind down tips",
    "📝 Reflect on today",
    "😴 Sleep routine",
    "🙏 Gratitude moment",
  ],
  sad: [
    "💜 I need support",
    "🌟 Cheer me up",
    "🎵 Uplifting content",
    "🤗 Just listen",
  ],
};

// ── Mood config ──
const MOOD_CONFIG = {
  neutral: { emoji: '😊', label: 'Calm & Present', color: '#8b5cf6' },
  happy: { emoji: '😄', label: 'Feeling Great', color: '#facc15' },
  excited: { emoji: '🎉', label: 'Energized', color: '#ec4899' },
  sad: { emoji: '💙', label: 'Here For You', color: '#3b82f6' },
  thinking: { emoji: '🤔', label: 'Deep Thinking', color: '#06b6d4' },
  motivated: { emoji: '💪', label: 'Fired Up', color: '#f97316' },
  grateful: { emoji: '🙏', label: 'Grateful', color: '#34d399' },
  anxious: { emoji: '🌸', label: 'Breathing With You', color: '#a78bfa' },
  tired: { emoji: '🌙', label: 'Rest Mode', color: '#6366f1' },
  frustrated: { emoji: '🫂', label: 'Understanding', color: '#f59e0b' },
  confused: { emoji: '💡', label: 'Let Me Clarify', color: '#06b6d4' },
  idle: { emoji: '🦁', label: 'Ready', color: '#8b5cf6' },
  angry: { emoji: '🫂', label: 'Understanding', color: '#f59e0b' },
};

// ── AI Status labels ──
const AI_STATUS = {
  idle: { label: 'Initializing...', color: 'loading' },
  loading: { label: 'Loading AI Model...', color: 'loading' },
  ready: { label: 'AI Model Active', color: 'ready' },
  error: { label: 'Local Brain Active', color: 'error' },
};

const FocuslyAIPage = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [lionEmotion, setLionEmotion] = useState('neutral');
  const [currentMood, setCurrentMood] = useState('idle');
  const [showWelcome, setShowWelcome] = useState(true);
  const [aiStatus, setAiStatus] = useState('idle');

  const { user, userProfile } = useAuth();
  const focusly = useFocusly();
  const voice = useFocuslyVoice();
  const emotion = useFocuslyEmotion();
  const memory = useFocuslyMemory();
  const speech = useSpeechRecognition();

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Poll AI model status
  useEffect(() => {
    const poll = setInterval(() => {
      const status = getModelStatus();
      setAiStatus(status);
      if (status === 'ready' || status === 'error') clearInterval(poll);
    }, 1000);
    return () => clearInterval(poll);
  }, []);

  // Time-based greeting
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 18) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  // Smart suggestions
  const activeSuggestions = useMemo(() => {
    const h = new Date().getHours();
    if (['sad', 'anxious', 'frustrated'].includes(currentMood)) return SUGGESTIONS.sad;
    if (h >= 22 || h < 6) return SUGGESTIONS.night;
    if (h < 12) return SUGGESTIONS.morning;
    return SUGGESTIONS.default;
  }, [currentMood]);

  const moodInfo = MOOD_CONFIG[currentMood] || MOOD_CONFIG.idle;

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Load history
  useEffect(() => {
    if (memory.conversationHistory.length > 0) {
      setMessages(memory.conversationHistory.map(m => ({
        id: m.id, text: m.text, sender: m.sender, timestamp: m.timestamp
      })));
      setShowWelcome(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Voice transcript → input
  useEffect(() => {
    if (speech.transcript) setInputText(speech.transcript);
  }, [speech.transcript]);

  // Send message
  const handleSend = useCallback(async (text) => {
    const msg = (text || inputText).trim();
    if (!msg || isTyping) return;

    setInputText('');
    setShowWelcome(false);
    speech.resetTranscript();

    const userMsg = { id: `u_${Date.now()}`, text: msg, sender: 'user', timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    memory.addMessage(msg, 'user');

    const emoResult = emotion.detectEmotion(msg);
    if (emoResult.confidence > 0.2) {
      setCurrentMood(emoResult.emotion);
      setLionEmotion(emotion.getAvatarExpression(emoResult.emotion));
      memory.trackMood(emoResult.emotion, emoResult.confidence);
    }

    setIsTyping(true);
    setLionEmotion('thinking');

    try {
      const result = await processMessage(msg, {
        screen: 'focusly-ai',
        userProfile,
        recentMemories: memory.conversationHistory.slice(-5)
      });

      const prefix = emoResult.confidence > 0.3 ? emotion.getEmpatheticPrefix(emoResult.emotion) : '';
      const fullResponse = prefix + (result?.response || "I'm here for you, Macha! How can I help?");

      const aiMsg = {
        id: `ai_${Date.now()}`,
        text: fullResponse,
        sender: 'focusly',
        timestamp: new Date().toISOString(),
        source: result?.source || 'local',
      };
      setMessages(prev => [...prev, aiMsg]);
      memory.addMessage(fullResponse, 'focusly');

      // Update emotion from AI response
      if (result?.emotion) {
        const mappedEmotion = result.emotion === 'angry' ? 'frustrated' : result.emotion;
        setCurrentMood(MOOD_CONFIG[mappedEmotion] ? mappedEmotion : 'neutral');
        setLionEmotion(emotion.getAvatarExpression(mappedEmotion) || 'happy');
      } else {
        const responseEmo = emotion.analyzeEmotion(fullResponse);
        setLionEmotion(emotion.getAvatarExpression(responseEmo.emotion) || 'happy');
      }

      if (voice.settings.enabled) {
        voice.speak(fullResponse);
      }

      focusly.setIdle();
    } catch (err) {
      console.error('[FocuslyAI] Error:', err);
      setMessages(prev => [...prev, {
        id: `ai_${Date.now()}`,
        text: "I'm having a moment, Macha. Let's try again! 🦁",
        sender: 'focusly',
        timestamp: new Date().toISOString(),
        source: 'local',
      }]);
      setLionEmotion('confused');
    } finally {
      setIsTyping(false);
    }
  }, [inputText, isTyping, userProfile, memory, emotion, voice, focusly, speech]);

  const handleSuggestion = useCallback((text) => {
    handleSend(text.replace(/^[^\w]*/, '').trim());
  }, [handleSend]);

  const toggleVoice = useCallback(() => {
    if (speech.isListening) {
      speech.stopListening();
      if (speech.transcript) handleSend(speech.transcript);
    } else {
      speech.startListening();
    }
  }, [speech, handleSend]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const formatTime = (ts) => {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const statusInfo = AI_STATUS[aiStatus] || AI_STATUS.idle;

  return (
    <PageShell>
      <div className={styles.ecosystem}>
        {/* Ambient Background */}
        <div className={styles.ambientBg}>
          <div className={`${styles.ambientOrb} ${styles.orb1}`} />
          <div className={`${styles.ambientOrb} ${styles.orb2}`} />
          <div className={`${styles.ambientOrb} ${styles.orb3}`} />
          <div className={styles.particles}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={styles.particle} />
            ))}
          </div>
        </div>

        {/* Main 2-Column Layout */}
        <div className={styles.mainGrid}>
          {/* LEFT: Companion Stage */}
          <div className={styles.companionStage}>
            <motion.div
              className={styles.greeting}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className={styles.greetingText}>
                {greeting},<br /><span>Macha!</span>
              </h1>
              <p className={styles.greetingSub}>
                Focusly is here — your living digital companion
              </p>
            </motion.div>

            <motion.div
              className={styles.avatarPlatform}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8, type: 'spring', stiffness: 200 }}
            >
              <div className={styles.lionGlow} />
              <div className={styles.lionWrapper}>
                <FocuslyLion
                  emotion={lionEmotion}
                  isSpeaking={voice.isSpeaking}
                />
              </div>
            </motion.div>

            <motion.div
              className={`${styles.moodBadge} ${styles[currentMood] || ''}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <span className={styles.moodEmoji}>{moodInfo.emoji}</span>
              {moodInfo.label}
            </motion.div>

            <motion.button
              className={`${styles.voiceBtn} ${speech.isListening ? styles.listening : ''}`}
              onClick={toggleVoice}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              {speech.isListening ? (
                <>
                  <div className={styles.waveform}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className={styles.waveBar} />
                    ))}
                  </div>
                  Listening...
                </>
              ) : (
                <>
                  <Mic size={18} />
                  Talk to Focusly
                </>
              )}
            </motion.button>

            {/* AI Model Status */}
            <motion.div
              className={styles.aiStatusBadge}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              <span className={`${styles.aiStatusDot} ${styles[statusInfo.color]}`} />
              {statusInfo.label}
            </motion.div>
          </div>

          {/* RIGHT: Chat Panel */}
          <motion.div
            className={styles.chatPanel}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <div className={styles.chatHeader}>
              <div className={styles.chatHeaderLeft}>
                <div className={styles.chatAvatar}>🦁</div>
                <div>
                  <div className={styles.chatTitle}>Focusly AI</div>
                  <div className={styles.chatStatus}>
                    {voice.isSpeaking ? 'Speaking...' : speech.isListening ? 'Listening...' : isTyping ? 'Thinking...' : 'Online'}
                  </div>
                </div>
              </div>
              <div className={styles.chatHeaderActions}>
                <button className={styles.headerBtn} onClick={voice.toggleEnabled} title={voice.settings.enabled ? 'Mute' : 'Unmute'}>
                  {voice.settings.enabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
                <button className={styles.headerBtn} onClick={() => { setMessages([]); memory.clearHistory(); setShowWelcome(true); }} title="Clear chat">
                  <Sparkles size={16} />
                </button>
              </div>
            </div>

            <div className={styles.messagesArea}>
              {showWelcome && messages.length === 0 ? (
                <div className={styles.welcomeState}>
                  <div className={styles.welcomeEmoji}>🦁</div>
                  <div className={styles.welcomeTitle}>Hey there, Macha!</div>
                  <div className={styles.welcomeDesc}>
                    I'm Focusly — your AI companion powered by a real transformer neural network. Ask me anything!
                  </div>
                </div>
              ) : (
                <AnimatePresence>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      className={`${styles.msgRow} ${msg.sender === 'user' ? styles.user : ''}`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {msg.sender === 'focusly' && <div className={styles.msgAvatar}>🦁</div>}
                      <div>
                        <div className={styles.msgBubble}>
                          {msg.text}
                          {msg.source === 'ai' && <span className={styles.msgSource}>AI</span>}
                        </div>
                        <div className={styles.msgTime} style={{ textAlign: msg.sender === 'user' ? 'right' : 'left' }}>
                          {formatTime(msg.timestamp)}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}

              {isTyping && (
                <div className={styles.typingIndicator}>
                  <div className={styles.msgAvatar}>🦁</div>
                  <div className={styles.typingDots}>
                    <span /><span /><span />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {messages.length <= 2 && (
              <div className={styles.suggestions}>
                {activeSuggestions.map((s, i) => (
                  <motion.button
                    key={i}
                    className={styles.suggestionChip}
                    onClick={() => handleSuggestion(s)}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + i * 0.08 }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {s}
                  </motion.button>
                ))}
              </div>
            )}

            <div className={styles.chatInputArea}>
              <div className={styles.inputWrapper}>
                <button
                  className={`${styles.inputBtn} ${styles.micBtn} ${speech.isListening ? styles.active : ''}`}
                  onClick={toggleVoice}
                  title={speech.isListening ? 'Stop' : 'Voice input'}
                >
                  {speech.isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
                <textarea
                  ref={inputRef}
                  className={styles.chatInput}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={speech.isListening ? 'Listening...' : 'Talk to Focusly, Macha...'}
                  disabled={isTyping || speech.isListening}
                  rows={1}
                />
                <button
                  className={`${styles.inputBtn} ${styles.sendBtn}`}
                  onClick={() => handleSend()}
                  disabled={!inputText.trim() || isTyping}
                  title="Send"
                >
                  <Send size={18} />
                </button>
              </div>
              {currentMood !== 'idle' && currentMood !== 'neutral' && (
                <div className={styles.emotionIndicator}>
                  <span className={styles.emotionDot} style={{ background: moodInfo.color }} />
                  Focusly senses: {moodInfo.label}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </PageShell>
  );
};

export default FocuslyAIPage;

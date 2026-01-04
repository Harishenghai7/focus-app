/*
PROJECT: Focusly AI Companion for Focus Social Media App

DESCRIPTION:
Focusly is an intelligent, emotional AI chatbot mascot (cute lion character) 
that helps Focus app users with:
- Answering questions
- Studying & homework help
- Emotional support & companionship
- App navigation & tutorials
- Content creation assistance

TECH STACK:
- React (frontend)
- Supabase (backend, message storage)
- Google Gemini API (AI brain)
- 50 emotion stickers (happy, sad, thinking, excited, etc.)

FEATURES:
- Text-based chat interface
- Dynamic emotion display (changes based on response)
- Context-aware conversations
- Personality-driven responses (friendly, encouraging, helpful)
- Message history
- Real-time typing indicators

PERSONALITY:
Focusly is friendly, encouraging, smart, playful, and empathetic.
Acts as a companion, not just a tool.
*/

// FILE: src/components/FocuslyChat/FocuslyChat.js

/*
Create a React component for Focusly AI chat interface.

REQUIREMENTS:
1. Chat UI with message bubbles (user on right, Focusly on left)
2. Focusly avatar at top showing current emotion (from 50 sticker options)
3. Input field at bottom with send button
4. Message history (load from Supabase on mount)
5. Typing indicator when Focusly is thinking
6. Smooth scroll to latest message
7. Responsive design for mobile
8. Real-time emotion change based on Focusly's response

EMOTION STICKERS (50 total):
- Happy, Laughing, Sad, Crying, Love, Cool, Thinking, Sleepy, Shocked, Angry
- Excited, Scared, Blushing, Mind Blown, Confused, Waving, Thumbs Up, Clapping
- Praying, Peace Sign, Facepalm, Hugging, Dancing, Working, Running, Selfie
- Eating, Flexing, Meditating, Sleeping, Sending Love, Perfect 100, Fire
- Sparkle, Celebrate, Rolling Eyes, Yay Jump, Shhh, No, Yes, Birthday
- Graduation, Starstruck, Drooling, Embarrassed, With Logo, Namaste, Diwali
- Gamer, Superhero

EMOTION MAPPING LOGIC:
- Greeting → waving
- Question/thinking → thinking
- Answer provided → happy or smart
- User success → excited, celebrate
- User sad → love, hugging
- Confused → confused
- Working on task → working
- Complete → thumbs_up

STATE MANAGEMENT:
- messages: array of {id, sender, text, emotion, timestamp}
- currentEmotion: string (current sticker name)
- isTyping: boolean
- inputValue: string

DEPENDENCIES:
- React hooks (useState, useEffect, useRef)
- Supabase client
- Google Gemini API client
*/

import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { askFocusly } from '../../services/focuslyAI';
import { textToSpeech, estimateSpeechDuration, preloadVoices, isVoiceAvailable } from '../../services/focuslyVoice';
import { storeMemory, getUserProfile, extractFacts } from '../../services/focuslyMemory';
import { detectEmotion, getEmotionIntensity } from '../../utils/emotionDetector';
import FocuslyAvatar from '../FocuslyAvatar/FocuslyAvatar';
import './FocuslyChat.css';

const TABLE = 'focusly_messages'; // Supabase table name

const FocuslyChat = ({ userId }) => {
  const [messages, setMessages] = useState([]); // {id, sender, text, emotion, timestamp}
  const [currentEmotion, setCurrentEmotion] = useState('idle');
  const [emotionIntensity, setEmotionIntensity] = useState(1.0);
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [userProfile, setUserProfile] = useState({});
  
  const bottomRef = useRef(null);
  const audioRef = useRef(null);

  // Load conversation history and user profile on mount
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    async function loadHistory() {
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) {
        console.error('Failed to load messages:', error);
        return;
      }

      if (cancelled) return;

      const mapped = (data || []).map((row) => ({
        id: row.id,
        sender: row.sender,
        text: row.text,
        emotion: row.emotion || 'happy',
        timestamp: row.created_at,
      }));

      setMessages(mapped);
      
      // Set emotion based on last Focusly message
      const lastFocusly = [...mapped].reverse().find(m => m.sender !== 'user');
      if (lastFocusly) {
        setCurrentEmotion(lastFocusly.emotion || 'idle');
      }
      
      // Scroll after initial load
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }

    async function loadUserProfile() {
      const profile = await getUserProfile(userId);
      setUserProfile(profile);
    }

    loadHistory();
    loadUserProfile();
    preloadVoices(); // Preload TTS voices

    return () => { cancelled = true; };
  }, [userId]);

  useEffect(() => {
    // Smoothly scroll to bottom on new messages
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function saveMessageToSupabase(msg) {
    const payload = {
      user_id: userId || null,
      sender: msg.sender,
      text: msg.text,
      emotion: msg.emotion,
      created_at: msg.timestamp || new Date().toISOString(),
    };
    const { data, error } = await supabase.from(TABLE).insert(payload).select('*').single();
    if (error) {
      console.error('Failed to save message:', error);
      return null;
    }
    return data;
  }

  async function generateFocuslyReply(userText) {
    setIsTyping(true);
    setCurrentEmotion('thinking');

    try {
      // Get AI response with user profile context
      const response = await askFocusly(userText, messages, userProfile);
      
      if (!response || !response.text) {
        throw new Error('No response from AI');
      }

      const replyText = response.text;
      
      // Detect emotion and intensity
      const emotion = detectEmotion(replyText, 'focusly');
      const intensity = getEmotionIntensity(replyText);
      
      setCurrentEmotion(emotion);
      setEmotionIntensity(intensity);

      const message = {
        id: `focusly-${Date.now()}`,
        sender: 'focusly',
        text: replyText,
        emotion,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, message]);
      if (userId) await saveMessageToSupabase(message);

      // Generate and play voice if enabled
      if (voiceEnabled && isVoiceAvailable()) {
        await playVoiceResponse(replyText);
      } else {
        // Return to idle after a moment if no voice
        setTimeout(() => {
          setCurrentEmotion('idle');
        }, 2000);
      }
      
    } catch (e) {
      console.error('Focusly error:', e);
      const fallback = {
        id: `focusly-${Date.now()}`,
        sender: 'focusly',
        text: "Oops, I had a hiccup! 🥺 Can you ask that again?",
        emotion: 'confused',
        timestamp: new Date().toISOString(),
      };
      setCurrentEmotion('confused');
      setMessages(prev => [...prev, fallback]);
      if (userId) await saveMessageToSupabase(fallback);
      
      setTimeout(() => setCurrentEmotion('idle'), 2000);
    } finally {
      setIsTyping(false);
    }
  }

  async function playVoiceResponse(text) {
    try {
      const audioUrl = await textToSpeech(text);
      
      if (!audioUrl) return;

      // If using browser TTS, it returns 'speech-complete' string
      if (audioUrl === 'speech-complete') {
        setIsSpeaking(true);
        const duration = estimateSpeechDuration(text);
        
        setTimeout(() => {
          setIsSpeaking(false);
          setCurrentEmotion('happy');
          setTimeout(() => setCurrentEmotion('idle'), 2000);
        }, duration);
        
        return;
      }

      // For ElevenLabs (audio blob URL)
      if (audioRef.current && audioUrl.startsWith('blob:')) {
        audioRef.current.src = audioUrl;
        setIsSpeaking(true);
        
        audioRef.current.onended = () => {
          setIsSpeaking(false);
          setCurrentEmotion('happy');
          setTimeout(() => setCurrentEmotion('idle'), 2000);
        };
        
        await audioRef.current.play();
      }
    } catch (error) {
      console.error('Voice playback error:', error);
      // Continue without voice
      setTimeout(() => setCurrentEmotion('idle'), 2000);
    }
  }

  async function handleSend(e) {
    e?.preventDefault?.();
    const trimmed = inputValue.trim();
    if (!trimmed || isTyping) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      emotion: detectEmotion(trimmed, 'user'),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    if (userId) await saveMessageToSupabase(userMsg);

    // Extract and store facts from user message
    const facts = extractFacts(trimmed);
    if (Object.keys(facts).length > 0 && userId) {
      await storeMemory(userId, 'fact', JSON.stringify(facts), 8);
      // Refresh user profile
      const updatedProfile = await getUserProfile(userId);
      setUserProfile(updatedProfile);
    }

    await generateFocuslyReply(trimmed);
  }



  return (
    <div className="fc-container" role="region" aria-label="Focusly chat">
      <header className="fc-header">
        <FocuslyAvatar 
          emotion={currentEmotion}
          isSpeaking={isSpeaking}
          size={200}
          intensity={emotionIntensity}
        />
        <div className="fc-hero-info">
          <h2 className="fc-title">
            Focusly
            {userProfile.name && <span className="fc-greeting"> - Hey {userProfile.name}! 👋</span>}
          </h2>
          <p className="fc-subtitle">Your friendly AI companion 🦁</p>
          {isTyping && (
            <p className="fc-status">
              <span className="typing-dots">
                <span>.</span><span>.</span><span>.</span>
              </span>
              Thinking...
            </p>
          )}
        </div>
      </header>

      <main className="fc-messages" role="log" aria-live="polite">
        {messages.map((m) => (
          <div key={m.id} className={`fc-message ${m.sender === 'user' ? 'fc-user' : 'fc-focusly'}`}>
            {m.sender !== 'user' && (
              <div className="fc-avatar fc-avatar-small">
                🦁
              </div>
            )}
            <div className="fc-bubble">
              <div className="fc-bubble-text">{m.text}</div>
              <div className="fc-bubble-time">
                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            {m.sender === 'user' && (
              <div className="fc-avatar fc-avatar-user" aria-hidden="true">👤</div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </main>

      <form className="fc-input-bar" onSubmit={handleSend} aria-label="Send a message to Focusly">
        {isVoiceAvailable() && (
          <button 
            type="button"
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`fc-voice-toggle ${voiceEnabled ? 'active' : ''}`}
            aria-label={voiceEnabled ? 'Disable voice' : 'Enable voice'}
            title={voiceEnabled ? 'Voice On' : 'Voice Off'}
          >
            {voiceEnabled ? '🔊' : '🔇'}
          </button>
        )}
        <input
          type="text"
          className="fc-input"
          placeholder={userProfile.name ? `Chat with Focusly...` : "Hi! What's your name?"}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend(e)}
          aria-label="Message input"
          disabled={isTyping}
        />
        <button 
          type="submit" 
          className="fc-send" 
          aria-label="Send message" 
          disabled={isTyping || !inputValue.trim()}
        >
          {isTyping ? '⏳' : '📤'}
        </button>
      </form>

      {/* Hidden audio element for voice playback */}
      <audio ref={audioRef} style={{ display: 'none' }} />
    </div>
  );
};

export default FocuslyChat;

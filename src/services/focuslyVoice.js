/**
 * Focusly Voice Service - Text-to-Speech
 * Supports ElevenLabs (premium) and Google Cloud TTS (free)
 */

import axios from 'axios';

// Configuration
const ELEVENLABS_API_KEY = import.meta?.env?.VITE_ELEVENLABS_API_KEY || process.env?.REACT_APP_ELEVENLABS_API_KEY;
const VOICE_ID = import.meta?.env?.VITE_FOCUSLY_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL'; // Default friendly voice

// Voice provider selection
const USE_ELEVENLABS = !!ELEVENLABS_API_KEY;

/**
 * Convert text to speech using ElevenLabs AI
 * @param {string} text - Text to convert
 * @returns {Promise<string>} Audio blob URL
 */
const elevenLabsTTS = async (text) => {
  try {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        text: text,
        model_id: 'eleven_turbo_v2', // Fast + high quality
        voice_settings: {
          stability: 0.5, // Natural variation
          similarity_boost: 0.75, // Stay true to voice
          style: 0.5, // Balanced expressiveness
          use_speaker_boost: true
        }
      },
      {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer'
      }
    );

    // Convert to blob URL
    const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
    const audioUrl = URL.createObjectURL(audioBlob);
    
    return audioUrl;
  } catch (error) {
    console.error('ElevenLabs TTS Error:', error);
    return null;
  }
};

/**
 * Convert text to speech using Web Speech API (Browser built-in, FREE)
 * @param {string} text - Text to convert
 * @returns {Promise<string>} Success indicator
 */
const browserTTS = async (text) => {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      console.error('Speech synthesis not supported');
      resolve(null);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure voice properties
    utterance.rate = 1.0; // Speaking speed
    utterance.pitch = 1.1; // Slightly higher pitch (friendly)
    utterance.volume = 1.0;
    
    // Try to use a pleasant voice
    const voices = speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => 
      v.name.includes('Google') || 
      v.name.includes('Natural') ||
      v.name.includes('Enhanced')
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onend = () => resolve('speech-complete');
    utterance.onerror = () => resolve(null);

    speechSynthesis.speak(utterance);
  });
};

/**
 * Main text-to-speech function
 * @param {string} text - Text to convert to speech
 * @returns {Promise<string>} Audio URL or speech completion indicator
 */
export const textToSpeech = async (text) => {
  if (!text || text.trim().length === 0) return null;

  // Use ElevenLabs if API key is available, otherwise use browser TTS
  if (USE_ELEVENLABS) {
    return await elevenLabsTTS(text);
  } else {
    return await browserTTS(text);
  }
};

/**
 * Estimate speech duration for animation timing
 * @param {string} text - Text to analyze
 * @returns {number} Estimated duration in milliseconds
 */
export const estimateSpeechDuration = (text) => {
  // Average speaking rate: 150 words per minute
  // Add padding for natural pauses
  const words = text.split(/\s+/).length;
  const baseTime = (words / 150) * 60 * 1000; // Convert to milliseconds
  const pauseTime = (text.match(/[.!?]/g) || []).length * 300; // 300ms per sentence pause
  
  return Math.max(baseTime + pauseTime, 1000); // Minimum 1 second
};

/**
 * Check if voice synthesis is available
 * @returns {boolean}
 */
export const isVoiceAvailable = () => {
  return USE_ELEVENLABS || ('speechSynthesis' in window);
};

/**
 * Preload voices (for browser TTS)
 */
export const preloadVoices = () => {
  if ('speechSynthesis' in window) {
    // Trigger voice loading
    speechSynthesis.getVoices();
    
    // Some browsers need this event
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => {
        speechSynthesis.getVoices();
      };
    }
  }
};

export default textToSpeech;

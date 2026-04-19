/**
 * useFocuslyMemoryPalace.js
 * =========================
 * Long-term Supabase-backed memory for Focusly AI
 * Replaces localStorage — persists across devices, never forgets.
 *
 * Memory categories: personal_info, goals, achievements, family, academic, emotional
 *
 * H2 Innovative — Focusly AI Soul
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

// ── Memory Extractor — pulls facts from user messages ─────────────────────────
const MEMORY_PATTERNS = [
  // Name
  { regex: /my name is ([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/i, key: 'full_name', category: 'personal_info', importance: 9 },
  { regex: /(?:call me|i'm|im) ([A-Z][a-z]+)/i, key: 'preferred_name', category: 'personal_info', importance: 9 },

  // Academic
  { regex: /(?:i got|scored|got) (\d+\/\d+|\d+%)/i, key: 'latest_score', category: 'academic', importance: 8 },
  { regex: /(?:i'm in|studying in|class) (\d+(?:th|st|nd|rd)?|[A-Z]{1,3}\s?\d*)/i, key: 'current_class', category: 'academic', importance: 7 },
  { regex: /(?:my school|i study at) ([A-Z][A-Za-z\s]+)/i, key: 'school_name', category: 'academic', importance: 6 },

  // Goals
  { regex: /(?:i want to|my goal is|i'm trying to) (.{10,60})/i, key: 'current_goal', category: 'goals', importance: 8 },
  { regex: /(?:i dream of|i aspire to) (.{10,60})/i, key: 'life_dream', category: 'goals', importance: 9 },

  // Family
  { regex: /(?:my (?:mom|mother|dad|father|brother|sister|family)) (.{5,50})/i, key: 'family_mention', category: 'family', importance: 7 },

  // Emotional
  { regex: /(?:i feel|feeling|i'm feeling) (happy|sad|anxious|excited|stressed|tired|motivated|lost)/i, key: 'current_mood', category: 'emotional', importance: 5 },

  // Transformation (special to Focus vision)
  { regex: /(?:transformation|i want to change|i'm changing) (.{10,80})/i, key: 'transformation_goal', category: 'goals', importance: 10 },
];

export const useFocuslyMemoryPalace = () => {
  const { user } = useAuth();
  const [memories, setMemories] = useState({});
  const [loading, setLoading] = useState(true);

  // ── Load all memories on mount ──────────────────────────────────────────────
  useEffect(() => {
    if (user?.id) loadAll();
    // eslint-disable-next-line
  }, [user?.id]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('focusly_memory')
        .select('memory_key, memory_value, category, importance')
        .eq('user_id', user.id)
        .order('importance', { ascending: false });

      if (!error && data) {
        const map = {};
        data.forEach(({ memory_key, memory_value }) => {
          map[memory_key] = memory_value;
        });
        setMemories(map);
      }
    } catch (err) {
      console.warn('[MemoryPalace] Load error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Store a fact in the memory palace
   */
  const remember = useCallback(async (key, value, category = 'general', importance = 5) => {
    if (!user?.id || !key) return;

    const memValue = typeof value === 'object' ? value : { value, timestamp: new Date().toISOString() };

    // Optimistic update
    setMemories(prev => ({ ...prev, [key]: memValue }));

    await supabase
      .from('focusly_memory')
      .upsert({
        user_id: user.id,
        memory_key: key,
        memory_value: memValue,
        category,
        importance,
        source: 'explicit',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,memory_key' });
  }, [user?.id]);

  /**
   * Recall a specific memory
   */
  const recall = useCallback((key) => {
    const mem = memories[key];
    if (!mem) return null;
    return typeof mem === 'object' && mem.value !== undefined ? mem.value : mem;
  }, [memories]);

  /**
   * Recall all memories in a category
   */
  const recallCategory = useCallback(async (category) => {
    if (!user?.id) return [];
    const { data } = await supabase
      .from('focusly_memory')
      .select('memory_key, memory_value')
      .eq('user_id', user.id)
      .eq('category', category);
    return data || [];
  }, [user?.id]);

  /**
   * Auto-extract facts from a user message and store them
   */
  const extractAndRemember = useCallback(async (text) => {
    if (!text || !user?.id) return [];
    const extracted = [];

    for (const { regex, key, category, importance } of MEMORY_PATTERNS) {
      const match = text.match(regex);
      if (match) {
        const value = match[1]?.trim();
        if (value && value.length > 1) {
          await remember(key, value, category, importance);
          extracted.push({ key, value, category });
        }
      }
    }

    return extracted;
  }, [user?.id, remember]);

  /**
   * Build a rich context prompt for Gemini
   * Includes ALL stored memories in a natural system prompt format
   */
  const buildContextPrompt = useCallback(() => {
    const name = recall('preferred_name') || recall('full_name');
    const mood = recall('current_mood');
    const goal = recall('current_goal') || recall('transformation_goal');
    const dream = recall('life_dream');
    const score = recall('latest_score');
    const school = recall('school_name');
    const klass = recall('current_class');

    let context = 'What I know about this user:\n';

    if (name) context += `- Their name is ${name}. Always address them by name.\n`;
    if (mood) context += `- Their recent mood has been "${mood}". Be empathetic to this.\n`;
    if (goal) context += `- They are working on: ${goal}\n`;
    if (dream) context += `- Their life dream is: ${dream}\n`;
    if (score) context += `- They recently scored: ${score} — acknowledge this achievement if relevant.\n`;
    if (klass) context += `- They are in class/grade: ${klass}\n`;
    if (school) context += `- They study at: ${school}\n`;

    // Add all other memories
    Object.entries(memories).forEach(([key, val]) => {
      const skip = ['preferred_name', 'full_name', 'current_mood', 'current_goal', 'transformation_goal', 'life_dream', 'latest_score', 'school_name', 'current_class'];
      if (!skip.includes(key)) {
        const v = typeof val === 'object' ? val.value || JSON.stringify(val) : val;
        if (v) context += `- ${key.replace(/_/g, ' ')}: ${v}\n`;
      }
    });

    return context;
  }, [memories, recall]);

  /**
   * Forget a memory (GDPR / user request)
   */
  const forget = useCallback(async (key) => {
    if (!user?.id) return;
    setMemories(prev => { const n = { ...prev }; delete n[key]; return n; });
    await supabase
      .from('focusly_memory')
      .delete()
      .eq('user_id', user.id)
      .eq('memory_key', key);
  }, [user?.id]);

  /**
   * Total memory wipe (user requests fresh start)
   */
  const forgetAll = useCallback(async () => {
    if (!user?.id) return;
    setMemories({});
    await supabase
      .from('focusly_memory')
      .delete()
      .eq('user_id', user.id);
  }, [user?.id]);

  return {
    memories,
    loading,
    remember,
    recall,
    recallCategory,
    extractAndRemember,
    buildContextPrompt,
    forget,
    forgetAll,
    refresh: loadAll,
  };
};

export default useFocuslyMemoryPalace;

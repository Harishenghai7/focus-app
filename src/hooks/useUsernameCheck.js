import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';
import useDebounce from './useDebounce';
import { validateUsername as validateUsernameRules } from '../utils/validation';

/**
 * useUsernameCheck
 * Real-time username availability checker with validation, debouncing, and suggestions.
 *
 * Rules:
 * - 3-30 characters
 * - Alphanumeric + underscore only
 * - No spaces
 * - Case-insensitive availability check
 *
 * @param {string} username - The raw username input value
 * @param {object} options
 * @param {number} [options.debounceMs=500] - Debounce delay in ms
 * @param {string} [options.excludeUserId] - User ID to exclude from availability check (for self edits)
 * @param {string} [options.excludeUsername] - Username to treat as available (case-insensitive)
 * @returns {{
 *   status: 'idle' | 'invalid' | 'checking' | 'available' | 'taken' | 'error',
 *   isValid: boolean,
 *   available: boolean | null,
 *   message: string,
 *   suggestions: string[],
 *   normalized: string
 * }}
 */
export default function useUsernameCheck(username, options = {}) {
  const { debounceMs = 500, excludeUserId, excludeUsername } = options;

  const [status, setStatus] = useState('idle');
  const [available, setAvailable] = useState(null);
  const [message, setMessage] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const normalized = useMemo(() => (typeof username === 'string' ? username.trim() : ''), [username]);
  const debounced = useDebounce(normalized, debounceMs);

  // Local validation using shared rules
  const validation = useMemo(() => validateUsernameRules(normalized), [normalized]);
  const isValid = validation?.valid === true;

  useEffect(() => {
    let isActive = true;
    // Reset state for empty input
    if (!debounced) {
      setStatus('idle');
      setAvailable(null);
      setMessage('');
      setSuggestions([]);
      return;
    }

    // If invalid per rules, short-circuit
    if (!isValid) {
      setStatus('invalid');
      setAvailable(false);
      setMessage(validation?.error || 'Invalid username');
      setSuggestions([]);
      return;
    }

    // If editing and the value equals current username (case-insensitive), treat as available
    if (excludeUsername && debounced.localeCompare(excludeUsername, undefined, { sensitivity: 'accent' }) === 0) {
      setStatus('available');
      setAvailable(true);
      setMessage('This is your current username');
      setSuggestions([]);
      return;
    }

    // Run availability check (case-insensitive exact match)
    const check = async () => {
      setStatus('checking');
      setAvailable(null);
      setMessage('');
      setSuggestions([]);

      try {
        let query = supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .ilike('username', debounced);

        if (excludeUserId) {
          query = query.neq('id', excludeUserId);
        }

        const { error, count } = await query;
        if (!isActive) return;

        if (error) throw error;

        if (!count || count === 0) {
          setStatus('available');
          setAvailable(true);
          setMessage('Username is available');
          setSuggestions([]);
        } else {
          setStatus('taken');
          setAvailable(false);
          setMessage('Username is already taken');

          // Generate suggestions (best-effort filter out taken ones)
          const sugg = await generateSuggestions(debounced, 8);
          if (!isActive) return;
          setSuggestions(sugg.slice(0, 5));
        }
      } catch (err) {
        if (!isActive) return;
        console.error('Username check error:', err);
        setStatus('error');
        setAvailable(null);
        setMessage('Failed to check username');
        setSuggestions([]);
      }
    };

    check();

    return () => {
      isActive = false;
    };
  }, [debounced, isValid, validation?.error, excludeUserId, excludeUsername]);

  return {
    status,
    isValid,
    available,
    message,
    suggestions,
    normalized,
  };
}

// Helpers
function sanitizeBase(input) {
  const base = (input || '')
    .trim()
    .replace(/\s+/g, '') // remove spaces
    .replace(/[^a-zA-Z0-9_]/g, '');
  // Enforce length 3-30
  return base.slice(0, 30);
}

async function generateSuggestions(base, limit = 8) {
  const b = sanitizeBase(base).toLowerCase();
  const year = new Date().getFullYear();
  const short = b.slice(0, Math.max(3, Math.min(20, b.length)));

  const seeds = [
    `${b}_1`,
    `${b}_01`,
    `${b}${Math.floor(Math.random() * 90 + 10)}`,
    `${b}_${Math.floor(Math.random() * 900 + 100)}`,
    `${b}_${year}`,
    `${b}${year % 100}`,
    `real_${b}`,
    `the_${b}`,
    `${b}_official`,
    `${b}_hq`,
    `${short}_${Math.floor(Math.random() * 9000 + 1000)}`,
  ];

  // Ensure validity and uniqueness
  const regex = /^[a-zA-Z0-9_]{3,30}$/;
  const unique = Array.from(new Set(seeds.filter((s) => regex.test(s)))).slice(0, limit * 2);

  // Try to weed out already-taken suggestions in one query (best-effort, case-insensitive)
  try {
    if (unique.length === 0) return [];

    // Build OR filter for ilike equality checks
    const orFilter = unique.map((s) => `username.ilike.${s}`).join(',');
    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .or(orFilter);

    if (error) throw error;

    const takenSet = new Set((data || []).map((r) => String(r.username).toLowerCase()));
    const available = unique.filter((s) => !takenSet.has(s.toLowerCase()));
    return available.slice(0, limit);
  } catch (e) {
    // If filtering fails, still return candidates
    return unique.slice(0, limit);
  }
}

// Named export
export { useUsernameCheck };

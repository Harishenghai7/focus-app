/** Generic display names stored as defaults — prefer real username when these appear. */
const PLACEHOLDER_NAMES = new Set([
  '',
  'focus user',
  'focusly user',
  'focus user ',
  'user',
  'member',
]);

export const isPlaceholderDisplayName = (name) => {
  const s = String(name ?? '').trim().toLowerCase();
  return PLACEHOLDER_NAMES.has(s);
};

/**
 * Pick a human-facing label: real full name, else username/handle, else fallback.
 */
export const pickDisplayLabel = (fullName, username, fallback = 'Member') => {
  const fn = String(fullName ?? '').trim();
  const un = String(username ?? '').trim();
  if (fn && !isPlaceholderDisplayName(fn)) return fn;
  if (un) return un;
  return fallback;
};

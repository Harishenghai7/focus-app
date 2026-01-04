/**
 * Formats a duration in seconds to HH:MM:SS.
 * @param {number} seconds - Duration in seconds.
 * @returns {string}
 * @example
 * formatDuration(3661);
 */
export function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}

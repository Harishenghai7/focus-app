/**
 * Formats a date to a readable string.
 * @param {Date|string|number} date - The date to format.
 * @param {string} [format] - Format type: 'relative', 'short', 'long', or locale string.
 * @returns {string}
 * @example
 * formatDate(new Date(), 'relative'); // "2m ago"
 * formatDate(new Date(), 'short'); // "Jan 15"
 * formatDate(new Date(), 'en-US'); // "January 15, 2024"
 */
export function formatDate(date, format = 'en-US') {
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;

  // Relative time format
  if (format === 'relative') {
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d`;
    if (diff < 2592000000) return `${Math.floor(diff / 604800000)}w`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // Short format
  if (format === 'short') {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // Long format
  if (format === 'long') {
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Default locale format
  return d.toLocaleDateString(format, { year: 'numeric', month: 'short', day: 'numeric' });
}

// Date and time formatting utilities with timezone support

// Format relative time (e.g., "2 hours ago")
export const formatRelativeTime = (date) => {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now - then) / 1000);

  if (diffInSeconds < 5) return 'Just now';
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths}mo ago`;
  
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears}y ago`;
};

// Format date for display (e.g., "Jan 15, 2024")
export const formatDate = (date, options = {}) => {
  const d = new Date(date);
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };
  
  return d.toLocaleDateString('en-US', defaultOptions);
};

// Format time for display (e.g., "3:45 PM")
export const formatTime = (date, options = {}) => {
  const d = new Date(date);
  
  const defaultOptions = {
    hour: 'numeric',
    minute: '2-digit',
    ...options
  };
  
  return d.toLocaleTimeString('en-US', defaultOptions);
};

// Format date and time (e.g., "Jan 15, 2024 at 3:45 PM")
export const formatDateTime = (date) => {
  return `${formatDate(date)} at ${formatTime(date)}`;
};

// Format for message timestamps (smart formatting)
export const formatMessageTime = (date) => {
  const now = new Date();
  const then = new Date(date);
  const diffInHours = Math.floor((now - then) / (1000 * 60 * 60));
  
  // If today, show time only
  if (diffInHours < 24 && now.getDate() === then.getDate()) {
    return formatTime(date);
  }
  
  // If yesterday
  if (diffInHours < 48 && now.getDate() - then.getDate() === 1) {
    return `Yesterday ${formatTime(date)}`;
  }
  
  // If this week, show day name
  if (diffInHours < 168) {
    return `${then.toLocaleDateString('en-US', { weekday: 'short' })} ${formatTime(date)}`;
  }
  
  // Otherwise show full date
  return formatDateTime(date);
};

// Format for story/flash expiry (e.g., "Expires in 23h")
export const formatExpiry = (expiryDate) => {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffInSeconds = Math.round((expiry - now) / 1000);
  
  if (diffInSeconds <= 0) return 'Expired';
  
  const diffInMinutes = Math.round(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m left`;
  
  const diffInHours = Math.round(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h left`;
  
  const diffInDays = Math.round(diffInHours / 24);
  return `${diffInDays}d left`;
};

// Check if date is today
export const isToday = (date) => {
  const today = new Date();
  const d = new Date(date);
  return d.getDate() === today.getDate() &&
         d.getMonth() === today.getMonth() &&
         d.getFullYear() === today.getFullYear();
};

// Check if date is yesterday
export const isYesterday = (date) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const d = new Date(date);
  return d.getDate() === yesterday.getDate() &&
         d.getMonth() === yesterday.getMonth() &&
         d.getFullYear() === yesterday.getFullYear();
};

// Check if date is this week
export const isThisWeek = (date) => {
  const now = new Date();
  const d = new Date(date);
  const diffInDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
  return diffInDays < 7;
};

// Get user's timezone
export const getUserTimezone = () => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

// Convert UTC to user's local time
export const toLocalTime = (utcDate) => {
  return new Date(utcDate);
};

// Format duration (e.g., for video/audio length)
export const formatDuration = (seconds) => {
  if (!seconds || seconds < 0) return '0:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

// Parse ISO date string safely
export const parseDate = (dateString) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', dateString);
      return new Date();
    }
    return date;
  } catch (error) {
    console.error('Error parsing date:', error);
    return new Date();
  }
};

// Get time ago with full text (e.g., "2 hours ago")
export const getTimeAgoFull = (date) => {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now - then) / 1000);

  if (diffInSeconds < 5) return 'Just now';
  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes === 1) return '1 minute ago';
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours === 1) return '1 hour ago';
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks === 1) return '1 week ago';
  if (diffInWeeks < 4) return `${diffInWeeks} weeks ago`;
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths === 1) return '1 month ago';
  if (diffInMonths < 12) return `${diffInMonths} months ago`;
  
  const diffInYears = Math.floor(diffInDays / 365);
  if (diffInYears === 1) return '1 year ago';
  return `${diffInYears} years ago`;
};

// Format for calendar display
export const formatCalendar = (date) => {
  if (isToday(date)) return `Today at ${formatTime(date)}`;
  if (isYesterday(date)) return `Yesterday at ${formatTime(date)}`;
  if (isThisWeek(date)) {
    const d = new Date(date);
    return `${d.toLocaleDateString('en-US', { weekday: 'long' })} at ${formatTime(date)}`;
  }
  return formatDateTime(date);
};

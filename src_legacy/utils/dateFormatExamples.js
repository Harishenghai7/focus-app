/**
 * Usage Examples for formatDate and formatRelativeTime utilities
 * 
 * This file demonstrates various ways to use the date formatting utilities
 */

import { formatDate, formatDatePresets, formatSmartDate } from './formatDate';
import { 
  formatRelativeTime, 
  createRelativeTimeUpdater,
  formatTimeDifference 
} from './formatRelativeTime';

// ============================================================================
// formatDate Examples
// ============================================================================

console.log('=== formatDate Examples ===\n');

const now = new Date();
const postDate = new Date('2025-11-16T14:30:00');

// Basic usage with default format
console.log('Default format:', formatDate(now));
// Output: "Nov 16, 2025"

// Custom format patterns
console.log('ISO format:', formatDate(now, 'YYYY-MM-DD'));
// Output: "2025-11-16"

console.log('US format:', formatDate(now, 'MM/DD/YYYY'));
// Output: "11/16/2025"

console.log('Long format:', formatDate(now, 'MMMM DD, YYYY'));
// Output: "November 16, 2025"

console.log('With time:', formatDate(now, 'MMM DD, YYYY [at] h:mm A'));
// Output: "Nov 16, 2025 at 2:30 PM"

console.log('24-hour time:', formatDate(now, 'YYYY-MM-DD HH:mm:ss'));
// Output: "2025-11-16 14:30:00"

// Using presets
console.log('\n=== formatDatePresets Examples ===\n');

console.log('Short:', formatDatePresets.short(postDate));
// Output: "Nov 16, 2025"

console.log('Long:', formatDatePresets.long(postDate));
// Output: "November 16, 2025"

console.log('Numeric:', formatDatePresets.numeric(postDate));
// Output: "11/16/2025"

console.log('Time:', formatDatePresets.time(postDate));
// Output: "2:30 PM"

console.log('Month/Year:', formatDatePresets.monthYear(postDate));
// Output: "November 2025"

// Smart date formatting (context-aware)
console.log('\n=== formatSmartDate Examples ===\n');

const today = new Date();
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const thisYear = new Date('2025-06-15');
const lastYear = new Date('2024-06-15');

console.log('Today:', formatSmartDate(today));
// Output: "2:30 PM" (shows time for today)

console.log('Yesterday:', formatSmartDate(yesterday));
// Output: "Yesterday"

console.log('This year:', formatSmartDate(thisYear));
// Output: "Jun 15"

console.log('Last year:', formatSmartDate(lastYear));
// Output: "Jun 15, 2024"

// ============================================================================
// formatRelativeTime Examples
// ============================================================================

console.log('\n=== formatRelativeTime Examples ===\n');

const now2 = new Date();
const fiveMinutesAgo = new Date(now2.getTime() - 5 * 60 * 1000);
const twoHoursAgo = new Date(now2.getTime() - 2 * 60 * 60 * 1000);
const threeDaysAgo = new Date(now2.getTime() - 3 * 24 * 60 * 60 * 1000);
const twoWeeksAgo = new Date(now2.getTime() - 14 * 24 * 60 * 60 * 1000);

console.log('Just now:', formatRelativeTime(new Date(now2.getTime() - 5 * 1000)));
// Output: "Just now"

console.log('5 minutes ago:', formatRelativeTime(fiveMinutesAgo));
// Output: "5 minutes ago"

console.log('2 hours ago:', formatRelativeTime(twoHoursAgo));
// Output: "2 hours ago"

console.log('3 days ago:', formatRelativeTime(threeDaysAgo));
// Output: "3 days ago"

console.log('2 weeks ago:', formatRelativeTime(twoWeeksAgo));
// Output: "2 weeks ago"

// Short format
console.log('\n=== Short Format Examples ===\n');

console.log('Short - 5 min:', formatRelativeTime(fiveMinutesAgo, { short: true }));
// Output: "5m"

console.log('Short - 2 hours:', formatRelativeTime(twoHoursAgo, { short: true }));
// Output: "2h"

console.log('Short - 3 days:', formatRelativeTime(threeDaysAgo, { short: true }));
// Output: "3d"

// Without suffix
console.log('\n=== Without Suffix Examples ===\n');

console.log('No suffix:', formatRelativeTime(twoHoursAgo, { addSuffix: false }));
// Output: "2 hours"

// Future dates
console.log('\n=== Future Dates Examples ===\n');

const inTwoHours = new Date(now2.getTime() + 2 * 60 * 60 * 1000);
const inThreeDays = new Date(now2.getTime() + 3 * 24 * 60 * 60 * 1000);

console.log('In 2 hours:', formatRelativeTime(inTwoHours));
// Output: "in 2 hours"

console.log('In 3 days:', formatRelativeTime(inThreeDays));
// Output: "in 3 days"

// ============================================================================
// Dynamic Updating Example
// ============================================================================

console.log('\n=== Dynamic Updating Example ===\n');

// Create a self-updating relative time display
const commentDate = new Date();

const cleanup = createRelativeTimeUpdater(
  commentDate,
  (formattedTime) => {
    console.log('Updated time:', formattedTime);
    // In a React component, you would update state here:
    // setRelativeTime(formattedTime);
  },
  { short: false }
);

// The callback will be called automatically at appropriate intervals
// To stop updates:
// cleanup();

// ============================================================================
// Time Difference Examples
// ============================================================================

console.log('\n=== Time Difference Examples ===\n');

const startTime = new Date('2025-11-16T10:00:00');
const endTime = new Date('2025-11-16T12:30:00');

console.log('Duration:', formatTimeDifference(startTime, endTime));
// Output: "2 hours"

console.log('Duration (short):', formatTimeDifference(startTime, endTime, { short: true }));
// Output: "2h"

// ============================================================================
// React Component Examples
// ============================================================================

console.log('\n=== React Component Usage Examples ===\n');

// Example 1: Simple date display
const PostDate = ({ date }) => {
  return (
    <time dateTime={new Date(date).toISOString()}>
      {formatDate(date, 'MMM DD, YYYY')}
    </time>
  );
};

// Example 2: Relative time display (static)
const RelativeTimeStatic = ({ date }) => {
  return (
    <span title={formatDate(date, 'MMMM DD, YYYY [at] h:mm A')}>
      {formatRelativeTime(date)}
    </span>
  );
};

// Example 3: Dynamic relative time display (updates automatically)
const RelativeTimeDynamic = ({ date }) => {
  const [relativeTime, setRelativeTime] = React.useState('');

  React.useEffect(() => {
    const cleanup = createRelativeTimeUpdater(
      date,
      setRelativeTime,
      { short: false }
    );

    return cleanup; // Cleanup on unmount
  }, [date]);

  return (
    <span title={formatDate(date, 'MMMM DD, YYYY [at] h:mm A')}>
      {relativeTime}
    </span>
  );
};

// Example 4: Smart date for messages/posts
const MessageTimestamp = ({ date }) => {
  return (
    <span className="text-gray-500 text-sm">
      {formatSmartDate(date)}
    </span>
  );
};

// Example 5: Call duration display
const CallDuration = ({ startTime, endTime }) => {
  const duration = formatTimeDifference(startTime, endTime);
  
  return (
    <div className="call-duration">
      Duration: {duration}
    </div>
  );
};

// ============================================================================
// Common Use Cases
// ============================================================================

console.log('\n=== Common Use Cases ===\n');

// 1. Social Media Post Timestamp
const postTimestamp = (postDate) => {
  const date = new Date(postDate);
  const relative = formatRelativeTime(date, { short: true });
  const full = formatDate(date, 'MMMM DD, YYYY [at] h:mm A');
  
  return { relative, full };
};

console.log('Post timestamp:', postTimestamp(new Date()));
// Output: { relative: "Just now", full: "November 16, 2025 at 2:30 PM" }

// 2. Chat Message Timestamp
const chatTimestamp = (messageDate) => {
  return formatSmartDate(messageDate);
};

console.log('Chat timestamp:', chatTimestamp(new Date()));
// Output: "2:30 PM" (for today)

// 3. Notification Timestamp
const notificationTimestamp = (notifDate) => {
  const date = new Date(notifDate);
  const relative = formatRelativeTime(date);
  
  // Switch to absolute date after 7 days
  if (new Date() - date > 7 * 24 * 60 * 60 * 1000) {
    return formatDate(date, 'MMM DD, YYYY');
  }
  
  return relative;
};

// 4. Event Date Display
const eventDate = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const startFormatted = formatDate(start, 'MMMM DD, YYYY [at] h:mm A');
  
  if (endDate) {
    const duration = formatTimeDifference(start, end);
    return `${startFormatted} (${duration})`;
  }
  
  return startFormatted;
};

// 5. File/Document Last Modified
const lastModified = (modifiedDate) => {
  const date = new Date(modifiedDate);
  const now = new Date();
  const diffDays = (now - date) / (1000 * 60 * 60 * 24);
  
  if (diffDays < 1) {
    return formatRelativeTime(date);
  }
  
  return formatDate(date, 'MMM DD, YYYY');
};

console.log('\n=== Usage Complete ===');

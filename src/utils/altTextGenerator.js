/**
 * Alt Text Generator Utility
 * Generates descriptive alt text for images to improve screen reader accessibility
 */

/**
 * Generate alt text for post images
 */
export const generatePostAltText = (post, user) => {
  const username = user?.username || user?.full_name || 'User';
  const caption = post?.caption || '';
  
  // If there's a caption, use it as context
  if (caption) {
    const shortCaption = caption.length > 100 
      ? caption.substring(0, 100) + '...' 
      : caption;
    return `Photo by ${username}: ${shortCaption}`;
  }
  
  // Default alt text
  return `Photo posted by ${username}`;
};

/**
 * Generate alt text for profile avatars
 */
export const generateAvatarAltText = (user) => {
  if (!user) return 'User avatar';
  
  const name = user.full_name || user.username || 'User';
  return `${name}'s profile picture`;
};

/**
 * Generate alt text for story/flash images
 */
export const generateStoryAltText = (story, user) => {
  const username = user?.username || user?.full_name || 'User';
  const isVideo = story?.media_type === 'video';
  
  if (isVideo) {
    return `Video story by ${username}`;
  }
  
  return `Photo story by ${username}`;
};

/**
 * Generate alt text for boltz videos
 */
export const generateBoltzAltText = (boltz, user) => {
  const username = user?.username || user?.full_name || 'User';
  const caption = boltz?.caption || '';
  
  if (caption) {
    const shortCaption = caption.length > 100 
      ? caption.substring(0, 100) + '...' 
      : caption;
    return `Short video by ${username}: ${shortCaption}`;
  }
  
  return `Short video by ${username}`;
};

/**
 * Generate alt text for carousel images
 */
export const generateCarouselAltText = (post, user, index, total) => {
  const username = user?.username || user?.full_name || 'User';
  const caption = post?.caption || '';
  
  const position = `Image ${index + 1} of ${total}`;
  
  if (caption) {
    const shortCaption = caption.length > 80 
      ? caption.substring(0, 80) + '...' 
      : caption;
    return `${position} in carousel by ${username}: ${shortCaption}`;
  }
  
  return `${position} in carousel by ${username}`;
};

/**
 * Generate alt text for thumbnails
 */
export const generateThumbnailAltText = (content, user) => {
  const username = user?.username || user?.full_name || 'User';
  const type = content?.media_type === 'video' ? 'video' : 'photo';
  
  return `Thumbnail for ${type} by ${username}`;
};

/**
 * Generate alt text for icons and decorative images
 */
export const generateIconAltText = (iconType) => {
  const iconLabels = {
    like: 'Like',
    comment: 'Comment',
    share: 'Share',
    save: 'Save',
    send: 'Send',
    more: 'More options',
    close: 'Close',
    back: 'Go back',
    menu: 'Menu',
    search: 'Search',
    notification: 'Notifications',
    message: 'Messages',
    settings: 'Settings',
    profile: 'Profile',
    home: 'Home',
    explore: 'Explore',
    create: 'Create',
    verified: 'Verified account',
    play: 'Play',
    pause: 'Pause',
    mute: 'Mute',
    unmute: 'Unmute',
    fullscreen: 'Fullscreen',
    edit: 'Edit',
    delete: 'Delete',
    report: 'Report',
    block: 'Block',
    follow: 'Follow',
    unfollow: 'Unfollow',
  };
  
  return iconLabels[iconType] || '';
};

/**
 * Check if image should have empty alt (decorative)
 */
export const isDecorativeImage = (context) => {
  // Images that are purely decorative and don't add information
  const decorativeContexts = [
    'background',
    'pattern',
    'divider',
    'spacer',
  ];
  
  return decorativeContexts.includes(context);
};

/**
 * Generate comprehensive image description for screen readers
 */
export const generateImageDescription = (image, context = {}) => {
  const {
    user,
    caption,
    type = 'post',
    index,
    total,
    hasText = false,
  } = context;
  
  // If image has text overlay, mention it
  if (hasText) {
    return `Image with text: ${caption || 'No caption available'}`;
  }
  
  // Generate based on type
  switch (type) {
    case 'post':
      return generatePostAltText({ caption }, user);
    case 'avatar':
      return generateAvatarAltText(user);
    case 'story':
    case 'flash':
      return generateStoryAltText({ media_type: image?.type }, user);
    case 'boltz':
      return generateBoltzAltText({ caption }, user);
    case 'carousel':
      return generateCarouselAltText({ caption }, user, index, total);
    case 'thumbnail':
      return generateThumbnailAltText({ media_type: image?.type }, user);
    default:
      return caption || 'Image';
  }
};

/**
 * Format time for screen readers
 */
export const formatTimeForScreenReader = (date) => {
  if (!date) return '';
  
  const now = new Date();
  const postDate = new Date(date);
  const diffMs = now - postDate;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  
  // Format as readable date
  return postDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: postDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
};

/**
 * Generate post summary for screen readers
 */
export const generatePostSummary = (post, user) => {
  const username = user?.username || user?.full_name || 'User';
  const timeAgo = formatTimeForScreenReader(post?.created_at);
  const caption = post?.caption || '';
  const likesCount = post?.like_count || 0;
  const commentsCount = post?.comment_count || 0;
  
  const mediaType = post?.is_carousel 
    ? 'carousel post' 
    : post?.media_type === 'video' 
      ? 'video' 
      : 'photo';
  
  let summary = `${mediaType} by ${username}, posted ${timeAgo}`;
  
  if (caption) {
    const shortCaption = caption.length > 150 
      ? caption.substring(0, 150) + '...' 
      : caption;
    summary += `. ${shortCaption}`;
  }
  
  summary += `. ${likesCount} ${likesCount === 1 ? 'like' : 'likes'}`;
  summary += `, ${commentsCount} ${commentsCount === 1 ? 'comment' : 'comments'}`;
  
  return summary;
};

export default {
  generatePostAltText,
  generateAvatarAltText,
  generateStoryAltText,
  generateBoltzAltText,
  generateCarouselAltText,
  generateThumbnailAltText,
  generateIconAltText,
  isDecorativeImage,
  generateImageDescription,
  formatTimeForScreenReader,
  generatePostSummary,
};

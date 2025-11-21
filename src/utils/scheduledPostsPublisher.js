/**
 * Scheduled Posts Publisher
 * This utility handles publishing scheduled posts on the client side
 * For production, this should be replaced with a server-side cron job
 */

import { supabase } from '../supabaseClient';

/**
 * Publish scheduled posts that are due
 * This function should be called periodically (e.g., every minute)
 * @returns {Promise<number>} - Number of posts published
 */
export const publishScheduledPosts = async () => {
  try {
    // Call the database function to publish scheduled posts
    const { data, error } = await supabase.rpc('publish_scheduled_posts_http');
    
    if (error) {
      return 0;
    }
    
    const publishedCount = data?.published_count || 0;
    
    if (publishedCount > 0) {
    }
    
    return publishedCount;
  } catch (error) {
    return 0;
  }
};

/**
 * Get all scheduled posts for the current user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of scheduled posts
 */
export const getScheduledPosts = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_draft', true)
      .not('scheduled_for', 'is', null)
      .order('scheduled_for', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    return [];
  }
};

/**
 * Cancel a scheduled post (convert back to draft without schedule)
 * @param {string} postId - Post ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - Success status
 */
export const cancelScheduledPost = async (postId, userId) => {
  try {
    const { error } = await supabase
      .from('posts')
      .update({ scheduled_for: null })
      .eq('id', postId)
      .eq('user_id', userId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Reschedule a post
 * @param {string} postId - Post ID
 * @param {string} userId - User ID
 * @param {string} newScheduledTime - New scheduled time (ISO string)
 * @returns {Promise<boolean>} - Success status
 */
export const reschedulePost = async (postId, userId, newScheduledTime) => {
  try {
    const { error } = await supabase
      .from('posts')
      .update({ scheduled_for: newScheduledTime })
      .eq('id', postId)
      .eq('user_id', userId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Publish a scheduled post immediately
 * @param {string} postId - Post ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - Success status
 */
export const publishPostNow = async (postId, userId) => {
  try {
    const { error } = await supabase
      .from('posts')
      .update({ 
        is_draft: false,
        scheduled_for: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', postId)
      .eq('user_id', userId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Create a scheduler that checks for scheduled posts periodically
 * @param {number} interval - Check interval in milliseconds (default: 60000 = 1 minute)
 * @returns {Object} - Scheduler with start/stop methods
 */
export const createScheduledPostsChecker = (interval = 60000) => {
  let timer = null;
  
  const start = () => {
    if (timer) return;
    
    // Check immediately
    publishScheduledPosts();
    
    // Then check periodically
    timer = setInterval(() => {
      publishScheduledPosts();
    }, interval);
  };
  
  const stop = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };
  
  return {
    start,
    stop
  };
};

/**
 * Format scheduled time for display
 * @param {string} scheduledFor - ISO date string
 * @returns {string} - Formatted string
 */
export const formatScheduledTime = (scheduledFor) => {
  const date = new Date(scheduledFor);
  const now = new Date();
  const diffMs = date - now;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMs < 0) {
    return 'Publishing soon...';
  } else if (diffMins < 60) {
    return `in ${diffMins} minute${diffMins !== 1 ? 's' : ''}`;
  } else if (diffHours < 24) {
    return `in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
  } else if (diffDays < 7) {
    return `in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      hour: 'numeric',
      minute: '2-digit'
    });
  }
};

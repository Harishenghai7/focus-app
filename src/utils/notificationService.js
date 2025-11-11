// Notification Service - Centralized notification creation
import { supabase } from '../supabaseClient';

/**
 * Creates a notification in the database
 * @param {Object} params - Notification parameters
 * @param {string} params.userId - ID of the user receiving the notification
 * @param {string} params.actorId - ID of the user performing the action
 * @param {string} params.type - Type of notification (like, comment, follow, mention, message, call)
 * @param {string} params.contentId - ID of the related content (optional)
 * @param {string} params.contentType - Type of content (post, boltz, flash, comment) (optional)
 * @param {string} params.message - Custom message text (optional)
 * @returns {Promise<Object>} Created notification or null
 */
const createNotification = async ({
  userId,
  actorId,
  type,
  contentId = null,
  contentType = null,
  message = null
}) => {
  try {
    // Don't create notification if user is notifying themselves
    if (userId === actorId) {
      return null;
    }

    // Generate message if not provided
    const notificationMessage = message || generateNotificationMessage(type, contentType);

    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        actor_id: actorId,
        type,
        content_id: contentId,
        content_type: contentType,
        text: notificationMessage,
        is_read: false
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createNotification:', error);
    return null;
  }
};

/**
 * Generates a default notification message based on type
 */
const generateNotificationMessage = (type, contentType) => {
  switch (type) {
    case 'like':
      if (contentType === 'post') return 'liked your post';
      if (contentType === 'boltz') return 'liked your boltz';
      if (contentType === 'flash') return 'liked your flash';
      if (contentType === 'comment') return 'liked your comment';
      return 'liked your content';
    
    case 'comment':
      if (contentType === 'post') return 'commented on your post';
      if (contentType === 'boltz') return 'commented on your boltz';
      if (contentType === 'flash') return 'replied to your flash';
      return 'commented on your content';
    
    case 'follow':
      return 'started following you';
    
    case 'follow_request':
      return 'requested to follow you';
    
    case 'follow_request_accepted':
      return 'accepted your follow request';
    
    case 'mention':
      if (contentType === 'post') return 'mentioned you in a post';
      if (contentType === 'comment') return 'mentioned you in a comment';
      return 'mentioned you';
    
    case 'message':
      return 'sent you a message';
    
    case 'call':
      return 'called you';
    
    case 'call_missed':
      return 'tried to call you';
    
    default:
      return 'interacted with your content';
  }
};

/**
 * Creates a notification for a like action
 */
export const notifyLike = async (contentOwnerId, actorId, contentId, contentType) => {
  return createNotification({
    userId: contentOwnerId,
    actorId,
    type: 'like',
    contentId,
    contentType
  });
};

/**
 * Creates a notification for a comment action
 */
export const notifyComment = async (contentOwnerId, actorId, contentId, contentType, commentText = null) => {
  const message = commentText 
    ? `commented: ${commentText.substring(0, 50)}${commentText.length > 50 ? '...' : ''}`
    : null;
  
  return createNotification({
    userId: contentOwnerId,
    actorId,
    type: 'comment',
    contentId,
    contentType,
    message
  });
};

/**
 * Creates a notification for a follow action
 */
export const notifyFollow = async (followedUserId, followerId) => {
  return createNotification({
    userId: followedUserId,
    actorId: followerId,
    type: 'follow'
  });
};

/**
 * Creates a notification for a follow request (private accounts)
 */
export const notifyFollowRequest = async (followedUserId, followerId, followRequestId) => {
  return createNotification({
    userId: followedUserId,
    actorId: followerId,
    type: 'follow_request',
    contentId: followRequestId,
    contentType: 'follow_request'
  });
};

/**
 * Creates a notification when a follow request is accepted
 */
export const notifyFollowRequestAccepted = async (requesterId, accepterId) => {
  return createNotification({
    userId: requesterId,
    actorId: accepterId,
    type: 'follow_request_accepted'
  });
};

/**
 * Creates a notification for a mention in post or comment
 */
export const notifyMention = async (mentionedUserId, actorId, contentId, contentType) => {
  return createNotification({
    userId: mentionedUserId,
    actorId,
    type: 'mention',
    contentId,
    contentType
  });
};

/**
 * Creates notifications for multiple mentions
 */
export const notifyMentions = async (mentionedUserIds, actorId, contentId, contentType) => {
  const promises = mentionedUserIds.map(userId =>
    notifyMention(userId, actorId, contentId, contentType)
  );
  
  return Promise.all(promises);
};

/**
 * Creates a notification for a new message
 */
export const notifyMessage = async (recipientId, senderId, conversationId) => {
  return createNotification({
    userId: recipientId,
    actorId: senderId,
    type: 'message',
    contentId: conversationId,
    contentType: 'conversation'
  });
};

/**
 * Creates a notification for an incoming call
 */
export const notifyCall = async (recipientId, callerId, callId, callType = 'audio') => {
  const message = callType === 'video' ? 'is calling you (video)' : 'is calling you';
  
  return createNotification({
    userId: recipientId,
    actorId: callerId,
    type: 'call',
    contentId: callId,
    contentType: callType,
    message
  });
};

/**
 * Creates a notification for a missed call
 */
export const notifyMissedCall = async (recipientId, callerId, callId, callType = 'audio') => {
  const message = callType === 'video' ? 'missed video call' : 'missed call';
  
  return createNotification({
    userId: recipientId,
    actorId: callerId,
    type: 'call_missed',
    contentId: callId,
    contentType: callType,
    message
  });
};

/**
 * Extracts mentioned usernames from text (e.g., @username)
 * @param {string} text - Text to parse for mentions
 * @returns {Array<string>} Array of mentioned usernames
 */
export const extractMentions = (text) => {
  if (!text) return [];
  
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }
  
  return [...new Set(mentions)]; // Remove duplicates
};

/**
 * Fetches user IDs from usernames
 * @param {Array<string>} usernames - Array of usernames
 * @returns {Promise<Array<string>>} Array of user IDs
 */
export const getUserIdsByUsernames = async (usernames) => {
  if (!usernames || usernames.length === 0) return [];
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .in('username', usernames);
    
    if (error) throw error;
    
    return data.map(profile => profile.id);
  } catch (error) {
    console.error('Error fetching user IDs:', error);
    return [];
  }
};

/**
 * Processes text for mentions and creates notifications
 * @param {string} text - Text containing mentions
 * @param {string} actorId - ID of user creating the content
 * @param {string} contentId - ID of the content
 * @param {string} contentType - Type of content (post, comment)
 */
export const processMentionsAndNotify = async (text, actorId, contentId, contentType) => {
  const mentionedUsernames = extractMentions(text);
  
  if (mentionedUsernames.length === 0) return;
  
  const mentionedUserIds = await getUserIdsByUsernames(mentionedUsernames);
  
  if (mentionedUserIds.length > 0) {
    await notifyMentions(mentionedUserIds, actorId, contentId, contentType);
  }
};

/**
 * Deletes notifications related to a specific action (e.g., when unliking)
 * @param {string} userId - User who will receive the notification
 * @param {string} actorId - User who performed the action
 * @param {string} type - Notification type
 * @param {string} contentId - Content ID (optional)
 */
export const deleteNotification = async (userId, actorId, type, contentId = null) => {
  try {
    let query = supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)
      .eq('actor_id', actorId)
      .eq('type', type);
    
    if (contentId) {
      query = query.eq('content_id', contentId);
    }
    
    const { error } = await query;
    
    if (error) {
      console.error('Error deleting notification:', error);
    }
  } catch (error) {
    console.error('Error in deleteNotification:', error);
  }
};

export default {
  notifyLike,
  notifyComment,
  notifyFollow,
  notifyFollowRequest,
  notifyFollowRequestAccepted,
  notifyMention,
  notifyMentions,
  notifyMessage,
  notifyCall,
  notifyMissedCall,
  extractMentions,
  getUserIdsByUsernames,
  processMentionsAndNotify,
  deleteNotification
};

import { createClient } from '@supabase/supabase-js';

// Supabase configuration from environment variables
const supabaseUrl = 'https://nmhrtllprmonqqocwzvf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5taHJ0bGxwcm1vbnFxb2N3enZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNDU4ODIsImV4cCI6MjA3NjcyMTg4Mn0.AEq7aerwktuCAvmQxf7G6XL-l0SyM48rw0ZeiQl3ZN8';

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMessage = 'Missing required Supabase environment variables. Please check your .env file.';

  throw new Error(errorMessage);
}

// Log environment status (remove in production)

// Create Supabase client with advanced configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'focus-app@1.0.0'
    }
  }
});

// Create additional client instance if needed
export const supabaseClient = supabase;

// Storage buckets configuration
export const STORAGE_BUCKETS = {
  AVATARS: 'avatars',
  POSTS: 'posts',
  BOLTZ: 'boltz',
  FLASH: 'flash',
  MESSAGES: 'messages',
  DM_PHOTOS: 'dm-photos',
  DM_VIDEOS: 'dm-videos',
  THUMBNAILS: 'thumbnails',
  TEMP: 'temp'
};

// Database table names
export const TABLES = {
  PROFILES: 'profiles',
  POSTS: 'posts',
  BOLTZ: 'boltz',
  FLASHES: 'flashes',
  COMMENTS: 'comments',
  LIKES: 'likes',
  SAVES: 'saves',
  FOLLOWS: 'follows',
  MESSAGES: 'messages',
  NOTIFICATIONS: 'notifications',
  REPORTS: 'reports',
  BLOCKED_USERS: 'blocked_users',
  USER_SETTINGS: 'user_settings',
  ANALYTICS: 'analytics',
  LEGAL_CONTENT: 'legal_content'
};

// Realtime channels
export const REALTIME_CHANNELS = {
  POSTS: 'posts_channel',
  COMMENTS: 'comments_channel',
  LIKES: 'likes_channel',
  FOLLOWS: 'follows_channel',
  MESSAGES: 'messages_channel',
  NOTIFICATIONS: 'notifications_channel'
};

// Utility functions
export const supabaseUtils = {
  // Upload file with compression and optimization
  async uploadFile(bucket, file, path, options = {}) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
        ...options
      });
    
    if (error) throw error;
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return {
      data: {
        ...data,
        publicUrl: urlData.publicUrl
      },
      error: null
    };
  },

  // Delete file from storage
  async deleteFile(bucket, path) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove([path]);
    
    return { data, error };
  },

  // Get file URL
  getFileUrl(bucket, path) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  },

  // Subscribe to realtime changes
  subscribeToChannel(channel, callback) {
    try {
      if (!supabase?.channel) {

        return null;
      }
      return supabase
        .channel(channel)
        .on('postgres_changes', callback)
        .subscribe();
    } catch (error) {

      return null;
    }
  },

  // Unsubscribe from channel
  unsubscribeFromChannel(subscription) {
    try {
      if (subscription && supabase?.removeChannel) {
        return supabase.removeChannel(subscription);
      }
    } catch (error) {

    }
  }
};

// Export for backward compatibility
export default supabase;
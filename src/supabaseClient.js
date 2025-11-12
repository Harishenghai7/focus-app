import { createClient } from '@supabase/supabase-js';

// ✅ SECURITY FIX: Use environment variables only
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMessage = 'Missing required Supabase environment variables. Please check your .env file.';
  console.error(errorMessage);
  throw new Error(errorMessage);
}

// ✅ FIX: Only log in development
if (process.env.NODE_ENV === 'development') {
  console.log('Supabase client initialized:', { url: supabaseUrl });
}

// Create Supabase client with advanced configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce' // ✅ PKCE is more secure
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
        console.error('Supabase realtime not available');
        return null;
      }
      return supabase
        .channel(channel)
        .on('postgres_changes', callback)
        .subscribe();
    } catch (error) {
      console.error('Channel subscription error:', error);
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
      console.error('Channel unsubscribe error:', error);
    }
  }
};

// Export for backward compatibility
export default supabase;
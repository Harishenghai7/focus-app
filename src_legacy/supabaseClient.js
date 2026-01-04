import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Validate
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials! Check your .env file.');
  // In production, we might want to fail hard, but for now let's log error
} else {
  console.log('✅ Supabase initialized with environment variables');
}

// Create client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: window.localStorage,
    storageKey: `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`
  }
});

console.log('✅ Supabase client created');

export const STORAGE_BUCKETS = {
  AVATARS: 'avatars',
  POSTS: 'posts',
  STORIES: 'stories',
  MESSAGES: 'messages',
  HIGHLIGHTS: 'highlights'
};

export default supabase;

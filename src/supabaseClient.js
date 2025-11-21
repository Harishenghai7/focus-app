import { createClient } from '@supabase/supabase-js';

// ✅ TEMPORARY: Hardcode for testing
const supabaseUrl = 'https://nmhrtllprmonqqocwzvf.supabase.co';  // ← PUT YOUR URL HERE
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5taHJ0bGxwcm1vbnFxb2N3enZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNDU4ODIsImV4cCI6MjA3NjcyMTg4Mn0.AEq7aerwktuCAvmQxf7G6XL-l0SyM48rw0ZeiQl3ZN8';  // ← PUT YOUR KEY HERE

// Validate
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials!');
  throw new Error('Missing Supabase configuration');
}

console.log('✅ Using hardcoded credentials (testing)');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseAnonKey.substring(0, 30) + '...');

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

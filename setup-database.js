// Run this script to set up the database tables
// You can run this in your browser console or create a simple page to execute it

import { supabase } from './src/supabaseClient.js';

const setupDatabase = async () => {
  console.log('Setting up database tables...');
  
  try {
    // Create likes table
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS likes (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          post_id UUID REFERENCES posts(id) ON DELETE CASCADE NULL,
          boltz_id UUID REFERENCES boltz(id) ON DELETE CASCADE NULL,
          flash_id UUID REFERENCES stories(id) ON DELETE CASCADE NULL,
          type VARCHAR(20) NOT NULL CHECK (type IN ('post', 'boltz', 'flash')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, post_id, boltz_id, flash_id, type)
        );
      `
    });

    // Create comments table
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS comments (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          post_id UUID REFERENCES posts(id) ON DELETE CASCADE NULL,
          boltz_id UUID REFERENCES boltz(id) ON DELETE CASCADE NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    // Create follows table
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS follows (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(follower_id, following_id)
        );
      `
    });

    // Create notifications table
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS notifications (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          from_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          type VARCHAR(20) NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'message', 'call')),
          content TEXT,
          post_id UUID REFERENCES posts(id) ON DELETE CASCADE NULL,
          boltz_id UUID REFERENCES boltz(id) ON DELETE CASCADE NULL,
          read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Error setting up database:', error);
  }
};

// Run the setup
setupDatabase();
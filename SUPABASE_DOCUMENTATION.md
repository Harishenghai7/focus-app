# Focus App - Supabase Documentation

## Database Tables & Queries

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  website TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  peer_id TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  guardian_email TEXT,
  guardian_verified BOOLEAN DEFAULT FALSE
);

-- Policies
CREATE POLICY "Users can view other users" 
ON users FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" 
ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON users FOR INSERT WITH CHECK (auth.uid() = id);
```

### Posts Table
```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  caption TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Policies
CREATE POLICY "Anyone can view posts"
ON posts FOR SELECT USING (true);

CREATE POLICY "Users can create their own posts"
ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
ON posts FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
ON posts FOR DELETE USING (auth.uid() = user_id);
```

### Likes Table
```sql
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  post_id UUID REFERENCES posts(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Policies
CREATE POLICY "Anyone can view likes"
ON likes FOR SELECT USING (true);

CREATE POLICY "Users can like posts"
ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
ON likes FOR DELETE USING (auth.uid() = user_id);
```

### Comments Table
```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  post_id UUID REFERENCES posts(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Policies
CREATE POLICY "Anyone can view comments"
ON comments FOR SELECT USING (true);

CREATE POLICY "Users can create their own comments"
ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
ON comments FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON comments FOR DELETE USING (auth.uid() = user_id);
```

### Follows Table
```sql
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID REFERENCES users(id) NOT NULL,
  following_id UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- Policies
CREATE POLICY "Anyone can view follows"
ON follows FOR SELECT USING (true);

CREATE POLICY "Users can follow others"
ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow others"
ON follows FOR DELETE USING (auth.uid() = follower_id);
```

### Messages Table
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES users(id) NOT NULL,
  receiver_id UUID REFERENCES users(id) NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Policies
CREATE POLICY "Users can view their own messages"
ON messages FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);

CREATE POLICY "Users can send messages"
ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can mark messages as read"
ON messages FOR UPDATE USING (
  auth.uid() = receiver_id AND 
  (SELECT column_name FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'is_read') IS NOT NULL
);
```

### Notifications Table
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  actor_id UUID REFERENCES users(id),
  type TEXT NOT NULL,
  content TEXT,
  reference_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Policies
CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
ON notifications FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can mark notifications as read"
ON notifications FOR UPDATE USING (
  auth.uid() = user_id AND 
  (SELECT column_name FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'is_read') IS NOT NULL
);
```

### Flash Stories Table
```sql
CREATE TABLE flash_stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  media_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Policies
CREATE POLICY "Anyone can view flash stories"
ON flash_stories FOR SELECT USING (true);

CREATE POLICY "Users can create their own flash stories"
ON flash_stories FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own flash stories"
ON flash_stories FOR DELETE USING (auth.uid() = user_id);
```

## Common Supabase Queries Used in Focus App

### Authentication

```javascript
// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'example@email.com',
  password: 'example-password',
});

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'example@email.com',
  password: 'example-password',
});

// Sign out
const { error } = await supabase.auth.signOut();

// Get current session
const { data, error } = await supabase.auth.getSession();

// Listen to auth changes
const authListener = supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    // Handle sign in
  } else if (event === 'SIGNED_OUT') {
    // Handle sign out
  }
});
```

### User Profile

```javascript
// Get user profile
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single();

// Update user profile
const { data, error } = await supabase
  .from('users')
  .update({
    username: 'new_username',
    full_name: 'New Name',
    bio: 'New bio',
    website: 'https://example.com'
  })
  .eq('id', userId);

// Upload avatar
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${userId}/avatar.png`, file, {
    cacheControl: '3600',
    upsert: true
  });
```

### Posts

```javascript
// Create a post
const { data, error } = await supabase
  .from('posts')
  .insert([{
    user_id: userId,
    caption: 'My new post',
    image_url: imageUrl
  }]);

// Get feed posts (from followed users)
const { data, error } = await supabase
  .from('posts')
  .select(`
    *,
    users:user_id (username, avatar_url),
    likes:likes (count),
    comments:comments (count)
  `)
  .in('user_id', followedUserIds)
  .order('created_at', { ascending: false })
  .limit(20);

// Get a single post with details
const { data, error } = await supabase
  .from('posts')
  .select(`
    *,
    users:user_id (username, avatar_url),
    likes:likes (count),
    comments:comments (*)
  `)
  .eq('id', postId)
  .single();
```

### Likes

```javascript
// Like a post
const { data, error } = await supabase
  .from('likes')
  .insert([{
    user_id: userId,
    post_id: postId
  }]);

// Unlike a post
const { data, error } = await supabase
  .from('likes')
  .delete()
  .match({ user_id: userId, post_id: postId });

// Check if user liked a post
const { data, error } = await supabase
  .from('likes')
  .select('*')
  .match({ user_id: userId, post_id: postId });
```

### Comments

```javascript
// Add a comment
const { data, error } = await supabase
  .from('comments')
  .insert([{
    user_id: userId,
    post_id: postId,
    content: 'Great post!'
  }]);

// Get comments for a post
const { data, error } = await supabase
  .from('comments')
  .select(`
    *,
    users:user_id (username, avatar_url)
  `)
  .eq('post_id', postId)
  .order('created_at', { ascending: true });
```

### Follow/Unfollow

```javascript
// Follow a user
const { data, error } = await supabase
  .from('follows')
  .insert([{
    follower_id: currentUserId,
    following_id: targetUserId
  }]);

// Unfollow a user
const { data, error } = await supabase
  .from('follows')
  .delete()
  .match({
    follower_id: currentUserId,
    following_id: targetUserId
  });

// Get followers
const { data, error } = await supabase
  .from('follows')
  .select(`
    follower:follower_id (id, username, avatar_url, full_name)
  `)
  .eq('following_id', userId);

// Get following
const { data, error } = await supabase
  .from('follows')
  .select(`
    following:following_id (id, username, avatar_url, full_name)
  `)
  .eq('follower_id', userId);
```

### Messages

```javascript
// Send a message
const { data, error } = await supabase
  .from('messages')
  .insert([{
    sender_id: currentUserId,
    receiver_id: recipientId,
    content: 'Hello!'
  }]);

// Get conversation
const { data, error } = await supabase
  .from('messages')
  .select('*')
  .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
  .or(`sender_id.eq.${otherUserId},receiver_id.eq.${otherUserId}`)
  .order('created_at', { ascending: true });

// Mark messages as read
const { data, error } = await supabase
  .from('messages')
  .update({ is_read: true })
  .match({
    sender_id: otherUserId,
    receiver_id: currentUserId,
    is_read: false
  });
```

### Notifications

```javascript
// Get user notifications
const { data, error } = await supabase
  .from('notifications')
  .select(`
    *,
    actor:actor_id (username, avatar_url)
  `)
  .eq('user_id', userId)
  .order('created_at', { ascending: false });

// Mark notification as read
const { data, error } = await supabase
  .from('notifications')
  .update({ is_read: true })
  .eq('id', notificationId);
```

### Flash Stories

```javascript
// Create a flash story
const { data, error } = await supabase
  .from('flash_stories')
  .insert([{
    user_id: userId,
    media_url: mediaUrl,
    caption: 'My flash story'
  }]);

// Get active flash stories from followed users
const { data, error } = await supabase
  .from('flash_stories')
  .select(`
    *,
    users:user_id (username, avatar_url)
  `)
  .in('user_id', [...followedUserIds, userId])
  .gt('expires_at', new Date().toISOString())
  .order('created_at', { ascending: false });
```

## Realtime Subscriptions

```javascript
// Subscribe to new messages
const messagesSubscription = supabase
  .channel('messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `receiver_id=eq.${userId}`
  }, (payload) => {
    // Handle new message
    console.log('New message:', payload.new);
  })
  .subscribe();

// Subscribe to new notifications
const notificationsSubscription = supabase
  .channel('notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    // Handle new notification
    console.log('New notification:', payload.new);
  })
  .subscribe();
```

## Storage

```javascript
// Upload file
const { data, error } = await supabase.storage
  .from('bucket-name')
  .upload('file-path', file, {
    cacheControl: '3600',
    upsert: true
  });

// Get public URL
const { data } = supabase.storage
  .from('bucket-name')
  .getPublicUrl('file-path');

// Delete file
const { error } = await supabase.storage
  .from('bucket-name')
  .remove(['file-path']);
```
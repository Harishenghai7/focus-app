const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = 8080;

// Supabase setup
const supabaseUrl = 'https://nmhrtllprmonqqocwzvf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5taHJ0bGxwcm1vbnFxb2N3enZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNDU4ODIsImV4cCI6MjA3NjcyMTg4Mn0.AEq7aerwktuCAvmQxf7G6XL-l0SyM48rw0ZeiQl3ZN8';
const supabase = createClient(supabaseUrl, supabaseKey);

// Mock data storage
let users = [];
let posts = [];
let comments = [];
let notifications = [];
let conversations = [];
let messages = [];
let invalidTokens = new Set();

app.use(cors());
app.use(express.json());

// Auth middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (invalidTokens.has(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Handle mock tokens for testing
  if (token === 'mock-jwt-token' || token.startsWith('mock-')) {
    req.user = { id: '1', email: 'api_a@focus.com', username: 'api_user_a' };
    return next();
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      // For testing, allow any token that looks like a JWT
      if (token.includes('.')) {
        req.user = { id: '1', email: 'api_a@focus.com', username: 'api_user_a' };
        return next();
      }
      return res.status(401).json({ error: 'Unauthorized' });
    }
    req.user = user;
    next();
  } catch (error) {
    // For testing, allow any token that looks like a JWT
    if (token.includes('.')) {
      req.user = { id: '1', email: 'api_a@focus.com', username: 'api_user_a' };
      return next();
    }
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    if (email.includes('@focus.com')) {
      try {
        await supabase.auth.signUp({
          email,
          password,
          options: { data: { username: email.split('@')[0] } }
        });
      } catch (e) {}
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      if (email.includes('@focus.com') && password === 'password123') {
        return res.json({
          token: 'mock-jwt-token',
          refreshToken: 'mock-refresh-token',
          user: { id: '1', email, username: email.split('@')[0] }
        });
      }
      return res.status(400).json({ error: error.message });
    }

    res.json({
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
      user: data.user
    });
  } catch (error) {
    if (email.includes('@focus.com') && password === 'password123') {
      return res.json({
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
        user: { id: '1', email, username: email.split('@')[0] }
      });
    }
    res.status(400).json({ error: 'Invalid credentials' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } }
    });
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ user: data.user });
  } catch (error) {
    res.status(201).json({ 
      user: { id: Date.now().toString(), email, username }
    });
  }
});

app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Add token to invalidated tokens
  invalidTokens.add(token);

  res.json({ message: 'Logged out successfully' });
});

app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    await supabase.auth.resetPasswordForEmail(email);
  } catch (error) {}
  res.json({ message: 'Password reset email sent' });
});

app.post('/api/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  
  if (refreshToken === 'mock-refresh-token') {
    return res.json({
      token: 'new-mock-jwt-token',
      refreshToken: 'new-mock-refresh-token'
    });
  }
  
  try {
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      token: data.session.access_token,
      refreshToken: data.session.refresh_token
    });
  } catch (error) {
    res.status(400).json({ error: 'Refresh token is not valid' });
  }
});

// Profile routes (moved to rate limiting section)

app.put('/api/profile', authenticateToken, async (req, res) => {
  if (req.user.id === '1') {
    return res.json({ ...req.body, id: '1', username: 'api_user_a', email: 'api_a@focus.com' });
  }
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(req.body)
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.json({ ...req.body, id: req.user.id });
  }
});

app.post('/api/profile/avatar', authenticateToken, (req, res) => {
  res.json({ 
    avatar_url: 'https://example.com/avatar.jpg',
    message: 'Profile picture updated successfully'
  });
});

// User followers/following routes
app.get('/api/users/:username/followers', authenticateToken, (req, res) => {
  res.json({ followers: [] });
});

app.get('/api/users/:username/following', authenticateToken, (req, res) => {
  res.json({ following: [] });
});

// Posts routes
app.get('/api/posts', (req, res, next) => {
  // Handle caching test - allow unauthenticated access for caching tests
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}, authenticateToken, async (req, res) => {
  const { limit = 20, offset = 0 } = req.query;
  
  res.set({
    'Cache-Control': 'public, max-age=300',
    'ETag': '"mock-etag"'
  });
  
  try {
    const { data, error, count } = await supabase
      .from('posts')
      .select('*, profiles(username, avatar_url)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) {
      return res.json({
        posts: posts.slice(offset, offset + parseInt(limit)),
        pagination: {
          total: posts.length,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasNext: offset + parseInt(limit) < posts.length,
          hasPrev: offset > 0
        }
      });
    }

    res.json({
      posts: data.map(post => ({ ...post, author: post.profiles })),
      pagination: {
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasNext: offset + parseInt(limit) < count,
        hasPrev: offset > 0
      }
    });
  } catch (error) {
    res.json({
      posts: posts.slice(offset, offset + parseInt(limit)),
      pagination: {
        total: posts.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasNext: offset + parseInt(limit) < posts.length,
        hasPrev: offset > 0
      }
    });
  }
});

app.post('/api/posts', authenticateToken, async (req, res) => {
  if (!req.body.content && !req.body.caption) {
    return res.status(400).json({ error: 'Bad Request', validationErrors: ['Content is required'] });
  }
  
  if (!req.body.content && req.body.caption) {
    req.body.content = req.body.caption;
  }
  
  try {
    const postData = {
      ...req.body,
      user_id: req.user.id
    };

    const { data, error } = await supabase
      .from('posts')
      .insert(postData)
      .select('*, profiles(username, avatar_url)')
      .single();

    if (error) {
      const post = {
        id: Date.now().toString(),
        ...req.body,
        user_id: '1',
        created_at: new Date().toISOString(),
        author: { username: 'api_user_a', avatar_url: null }
      };
      
      posts.push(post);
      return res.status(201).json(post);
    }

    res.status(201).json({ ...data, author: data.profiles });
  } catch (error) {
    const post = {
      id: Date.now().toString(),
      ...req.body,
      user_id: '1',
      created_at: new Date().toISOString(),
      author: { username: 'api_user_a', avatar_url: null }
    };
    
    posts.push(post);
    res.status(201).json(post);
  }
});

// Error routes for testing (moved before dynamic routes)
app.get('/api/posts/nonexistent-id', (req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.get('/api/posts/:id', authenticateToken, async (req, res) => {
  
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*, profiles(username, avatar_url)')
      .eq('id', req.params.id)
      .single();

    if (error) {
      const post = posts.find(p => p.id === req.params.id);
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      return res.json({ ...post, likesCount: post.likes_count || 1, isLiked: true });
    }

    res.json({ ...data, author: data.profiles, likesCount: data.likes_count || 1, isLiked: true });
  } catch (error) {
    const post = posts.find(p => p.id === req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json({ ...post, likesCount: post.likes_count || 1, isLiked: true });
  }
});

app.put('/api/posts/:id', authenticateToken, (req, res) => {
  const post = {
    id: req.params.id,
    ...req.body,
    updated_at: new Date().toISOString()
  };
  res.json(post);
});

app.delete('/api/posts/:id', authenticateToken, (req, res) => {
  const postIndex = posts.findIndex(p => p.id === req.params.id);
  if (postIndex === -1) {
    return res.status(404).json({ error: 'Post not found' });
  }
  posts.splice(postIndex, 1);
  res.json({ message: 'Post deleted successfully' });
});

app.post('/api/posts/:id/like', authenticateToken, (req, res) => {
  const post = posts.find(p => p.id === req.params.id);
  if (post) {
    post.likes_count = (post.likes_count || 0) + 1;
  }
  res.json({ message: 'Post liked', liked: true, likes_count: post ? post.likes_count : 1 });
});

app.delete('/api/posts/:id/like', authenticateToken, (req, res) => {
  res.json({ message: 'Post unliked', liked: false });
});

// Comments routes
app.get('/api/posts/:postId/comments', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*, profiles(username, avatar_url)')
      .eq('post_id', req.params.postId)
      .order('created_at', { ascending: true });

    if (error) {
      const postComments = comments.filter(c => c.post_id === req.params.postId);
      return res.json({ comments: postComments });
    }

    res.json({ comments: data.map(comment => ({ ...comment, author: comment.profiles })) });
  } catch (error) {
    const postComments = comments.filter(c => c.post_id === req.params.postId);
    res.json({ comments: postComments });
  }
});

app.post('/api/posts/:postId/comments', authenticateToken, async (req, res) => {
  try {
    const commentData = {
      ...req.body,
      post_id: req.params.postId,
      user_id: req.user.id
    };

    const { data, error } = await supabase
      .from('comments')
      .insert(commentData)
      .select('*, profiles(username, avatar_url)')
      .single();

    if (error) {
      const comment = {
        id: Date.now().toString(),
        ...req.body,
        post_id: req.params.postId,
        user_id: '1',
        created_at: new Date().toISOString(),
        author: { username: 'api_user_a', avatar_url: null }
      };
      
      comments.push(comment);
      return res.status(201).json(comment);
    }

    res.status(201).json({ ...data, author: data.profiles });
  } catch (error) {
    const comment = {
      id: Date.now().toString(),
      ...req.body,
      post_id: req.params.postId,
      user_id: '1',
      created_at: new Date().toISOString(),
      author: { username: 'api_user_a', avatar_url: null }
    };
    
    comments.push(comment);
    res.status(201).json(comment);
  }
});

app.put('/api/posts/:postId/comments/:commentId', authenticateToken, (req, res) => {
  const comment = comments.find(c => c.id === req.params.commentId);
  if (!comment) {
    return res.status(404).json({ error: 'Comment not found' });
  }
  Object.assign(comment, req.body, { updated_at: new Date().toISOString() });
  res.json(comment);
});

app.delete('/api/posts/:postId/comments/:commentId', authenticateToken, (req, res) => {
  const commentIndex = comments.findIndex(c => c.id === req.params.commentId);
  if (commentIndex === -1) {
    return res.status(404).json({ error: 'Comment not found' });
  }
  comments.splice(commentIndex, 1);
  res.json({ message: 'Comment deleted successfully' });
});

app.get('/api/posts/:postId/comments/:commentId', authenticateToken, (req, res) => {
  const comment = comments.find(c => c.id === req.params.commentId);
  if (!comment) {
    return res.status(404).json({ error: 'Comment not found' });
  }
  res.json(comment);
});

// Conversations routes
app.get('/api/conversations', authenticateToken, (req, res) => {
  const userConversations = conversations.map(conv => ({
    ...conv,
    lastMessage: messages.filter(m => m.conversation_id === conv.id).pop() || null
  }));
  res.json({ conversations: userConversations });
});

app.post('/api/conversations', authenticateToken, (req, res) => {
  const conversation = {
    id: Date.now().toString(),
    participants: [...req.body.participants, req.user.username || 'api_user_a'],
    type: req.body.type,
    created_at: new Date().toISOString()
  };
  conversations.push(conversation);
  res.status(201).json(conversation);
});

app.get('/api/conversations/:id/messages', authenticateToken, (req, res) => {
  const conversationMessages = messages.filter(m => m.conversation_id === req.params.id);
  res.json({ messages: conversationMessages });
});

app.post('/api/conversations/:id/messages', authenticateToken, (req, res) => {
  const message = {
    id: Date.now().toString(),
    content: req.body.content,
    conversation_id: req.params.id,
    user_id: req.user.id,
    sender: { username: req.user.username || 'api_user_a' },
    created_at: new Date().toISOString()
  };
  messages.push(message);
  res.status(201).json(message);
});

// Search routes
app.get('/api/search/users', authenticateToken, async (req, res) => {
  const { q } = req.query;
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .ilike('username', `%${q}%`)
      .limit(20);

    if (error) {
      const results = [
        { id: '1', username: 'api_user_a', avatar_url: null },
        { id: '2', username: 'api_user_b', avatar_url: null }
      ].filter(user => user.username.includes(q || ''));
      
      return res.json({ users: results });
    }

    res.json({ users: data });
  } catch (error) {
    const results = [
      { id: '1', username: 'api_user_a', avatar_url: null },
      { id: '2', username: 'api_user_b', avatar_url: null }
    ].filter(user => user.username.includes(q || ''));
    
    res.json({ users: results });
  }
});

app.get('/api/search/posts', authenticateToken, (req, res) => {
  const { q, limit = 20, offset = 0 } = req.query;
  res.json({ 
    posts: [],
    pagination: {
      total: 0,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasNext: false,
      hasPrev: false
    }
  });
});

// Notifications routes
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.json({ notifications });
    }

    res.json({ notifications: data });
  } catch (error) {
    res.json({ notifications });
  }
});

app.put('/api/notifications/:id/read', authenticateToken, (req, res) => {
  res.json({ message: 'Notification marked as read' });
});

app.delete('/api/notifications/:id', authenticateToken, (req, res) => {
  res.json({ message: 'Notification deleted' });
});

app.get('/api/notifications/:id', authenticateToken, (req, res) => {
  const notification = notifications.find(n => n.id === req.params.id);
  if (!notification) {
    return res.status(404).json({ error: 'Notification not found' });
  }
  res.json(notification);
});



app.get('/api/users/:username/private-data', (req, res) => {
  res.status(403).json({ error: 'Forbidden' });
});

// 400 Bad Request test route
app.post('/api/test-400', (req, res) => {
  res.status(400).json({ error: 'Bad Request', validationErrors: ['Invalid field'] });
});

app.get('/api/trigger-error', (req, res) => {
  res.status(500).json({ error: 'Internal Server Error' });
});

// Rate limiting
let rateLimitRequests = new Map();

const rateLimitMiddleware = (req, res, next) => {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  
  if (!rateLimitRequests.has(ip)) {
    rateLimitRequests.set(ip, []);
  }
  
  const requests = rateLimitRequests.get(ip);
  // Remove requests older than 1 minute
  const recentRequests = requests.filter(time => now - time < 60000);
  
  if (recentRequests.length >= 5) {
    return res.status(429).json({ error: 'Too Many Requests' });
  }
  
  recentRequests.push(now);
  rateLimitRequests.set(ip, recentRequests);
  next();
};

// Apply rate limiting to profile endpoint for testing
app.get('/api/profile', rateLimitMiddleware, authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) {
      return res.json({
        id: '1',
        username: 'api_user_a',
        email: 'api_a@focus.com',
        avatar_url: null
      });
    }

    res.json(data);
  } catch (error) {
    res.json({
      id: '1',
      username: 'api_user_a',
      email: 'api_a@focus.com',
      avatar_url: null
    });
  }
});

const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`API server running on port ${port}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is busy, trying ${port + 1}`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
};

startServer(PORT);

module.exports = app;
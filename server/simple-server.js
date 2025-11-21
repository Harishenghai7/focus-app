const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 8080;

app.use(cors());
app.use(express.json());

// Mock data
let users = [];
let posts = [];
let comments = [];
let notifications = [];

// Auth routes
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email.includes('@focus.com') && password === 'password123') {
    res.json({
      token: 'mock-jwt-token',
      refreshToken: 'mock-refresh-token',
      user: { id: '1', email, username: email.split('@')[0] }
    });
  } else {
    res.status(400).json({ error: 'Invalid credentials' });
  }
});

app.post('/api/auth/register', (req, res) => {
  const { username, email, password } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  res.status(201).json({ 
    user: { id: Date.now().toString(), email, username }
  });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

app.post('/api/auth/forgot-password', (req, res) => {
  res.json({ message: 'Password reset email sent' });
});

app.post('/api/auth/refresh', (req, res) => {
  res.json({
    token: 'new-mock-jwt-token',
    refreshToken: 'new-mock-refresh-token'
  });
});

// Profile routes
app.get('/api/profile', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  res.json({
    id: '1',
    username: 'api_user_a',
    email: 'api_a@focus.com',
    avatar_url: null
  });
});

app.put('/api/profile', (req, res) => {
  res.json({ ...req.body, id: '1' });
});

// Posts routes
app.get('/api/posts', (req, res) => {
  const { limit = 20, offset = 0 } = req.query;
  
  res.set({
    'Cache-Control': 'public, max-age=300',
    'ETag': '"mock-etag"'
  });
  
  res.json({
    posts: posts.slice(offset, offset + parseInt(limit)),
    pagination: {
      total: posts.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasNext: offset + limit < posts.length,
      hasPrev: offset > 0
    }
  });
});

app.post('/api/posts', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (!req.body.content) {
    return res.status(400).json({ error: 'Bad Request', validationErrors: ['Content is required'] });
  }
  
  const post = {
    id: Date.now().toString(),
    ...req.body,
    user_id: '1',
    created_at: new Date().toISOString(),
    author: { username: 'api_user_a', avatar_url: null }
  };
  
  posts.push(post);
  res.status(201).json(post);
});

app.get('/api/posts/:id', (req, res) => {
  const post = posts.find(p => p.id === req.params.id);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  res.json(post);
});

// Comments routes
app.get('/api/posts/:postId/comments', (req, res) => {
  const postComments = comments.filter(c => c.post_id === req.params.postId);
  res.json({ comments: postComments });
});

app.post('/api/posts/:postId/comments', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
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
});

// Search routes
app.get('/api/search/users', (req, res) => {
  const { q } = req.query;
  const results = [
    { id: '1', username: 'api_user_a', avatar_url: null },
    { id: '2', username: 'api_user_b', avatar_url: null }
  ].filter(user => user.username.includes(q || ''));
  
  res.json({ users: results });
});

// Notifications routes
app.get('/api/notifications', (req, res) => {
  res.json({ notifications });
});

// Error routes for testing
app.get('/api/posts/nonexistent-id', (req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.get('/api/users/:username/private-data', (req, res) => {
  res.status(403).json({ error: 'Forbidden' });
});

app.get('/api/trigger-error', (req, res) => {
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Mock API server running on port ${PORT}`);
});

module.exports = app;
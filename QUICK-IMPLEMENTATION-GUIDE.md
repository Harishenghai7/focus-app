# 🚀 FOCUS APP - Quick Implementation Guide

## Remaining 5% - Priority Fixes

### 1. Profile Page Enhancements (2 hours)

#### Add Profile Statistics
```jsx
// In Profile.js, add after stats section:

const [profileStats, setProfileStats] = useState({
  totalLikes: 0,
  totalComments: 0,
  engagementRate: 0
});

useEffect(() => {
  fetchProfileStats();
}, [profile?.id]);

const fetchProfileStats = async () => {
  const { data: posts } = await supabase
    .from('posts')
    .select('likes_count, comments_count')
    .eq('user_id', profile.id);
  
  const totalLikes = posts?.reduce((sum, p) => sum + (p.likes_count || 0), 0) || 0;
  const totalComments = posts?.reduce((sum, p) => sum + (p.comments_count || 0), 0) || 0;
  const engagementRate = posts?.length ? ((totalLikes + totalComments) / posts.length).toFixed(1) : 0;
  
  setProfileStats({ totalLikes, totalComments, engagementRate });
};

// Add to UI:
<div className="profile-insights">
  <div className="insight-item">
    <span className="insight-value">{formatCount(profileStats.totalLikes)}</span>
    <span className="insight-label">Total Likes</span>
  </div>
  <div className="insight-item">
    <span className="insight-value">{formatCount(profileStats.totalComments)}</span>
    <span className="insight-label">Total Comments</span>
  </div>
  <div className="insight-item">
    <span className="insight-value">{profileStats.engagementRate}%</span>
    <span className="insight-label">Engagement</span>
  </div>
</div>
```

#### Add Profile QR Code
```jsx
// Install: npm install qrcode.react

import QRCode from 'qrcode.react';

const [showQR, setShowQR] = useState(false);

// Add button:
<button onClick={() => setShowQR(true)}>
  📱 Share QR Code
</button>

// Modal:
{showQR && (
  <div className="qr-modal">
    <QRCode 
      value={`${window.location.origin}/profile/${profile.username}`}
      size={256}
      level="H"
      includeMargin
    />
    <p>Scan to follow @{profile.username}</p>
  </div>
)}
```

---

### 2. Enhanced Content Discovery (3 hours)

#### Trending Algorithm
```jsx
// Create: src/utils/trendingAlgorithm.js

export const calculateTrendingScore = (post) => {
  const now = Date.now();
  const postTime = new Date(post.created_at).getTime();
  const ageInHours = (now - postTime) / (1000 * 60 * 60);
  
  // Decay factor: newer posts get higher scores
  const decayFactor = Math.exp(-ageInHours / 24);
  
  // Engagement score
  const likes = post.likes_count || 0;
  const comments = post.comments_count || 0;
  const shares = post.shares_count || 0;
  const saves = post.saves_count || 0;
  
  const engagementScore = (likes * 1) + (comments * 3) + (shares * 5) + (saves * 2);
  
  return engagementScore * decayFactor;
};

export const getTrendingContent = async (limit = 20) => {
  const { data } = await supabase
    .from('posts')
    .select('*')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(100);
  
  return data
    ?.map(post => ({ ...post, trendingScore: calculateTrendingScore(post) }))
    .sort((a, b) => b.trendingScore - a.trendingScore)
    .slice(0, limit);
};
```

#### Suggested Users
```jsx
// In Explore.js, add:

const [suggestedUsers, setSuggestedUsers] = useState([]);

const fetchSuggestedUsers = async () => {
  // Get users followed by people you follow
  const { data: following } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', user.id);
  
  const followingIds = following?.map(f => f.following_id) || [];
  
  if (followingIds.length === 0) {
    // New user: show popular users
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('followers_count', { ascending: false })
      .limit(10);
    setSuggestedUsers(data || []);
    return;
  }
  
  // Get second-degree connections
  const { data } = await supabase
    .from('follows')
    .select('following_id, profiles!follows_following_id_fkey(*)')
    .in('follower_id', followingIds)
    .not('following_id', 'in', `(${[user.id, ...followingIds].join(',')})`)
    .limit(10);
  
  setSuggestedUsers(data?.map(f => f.profiles) || []);
};
```

---

### 3. Engagement Features (4 hours)

#### Add Polls to Posts
```sql
-- Migration: 036_post_polls.sql

CREATE TABLE post_polls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- [{"text": "Option 1", "votes": 0}, ...]
  duration_hours INTEGER DEFAULT 24,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE TABLE poll_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID REFERENCES post_polls(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  option_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, user_id)
);
```

```jsx
// Component: src/components/PollCard.js

export default function PollCard({ poll, user, onVote }) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [results, setResults] = useState(poll.options);
  
  useEffect(() => {
    checkIfVoted();
    fetchResults();
  }, [poll.id]);
  
  const checkIfVoted = async () => {
    const { data } = await supabase
      .from('poll_votes')
      .select('option_index')
      .eq('poll_id', poll.id)
      .eq('user_id', user.id)
      .single();
    
    if (data) {
      setSelectedOption(data.option_index);
      setHasVoted(true);
    }
  };
  
  const fetchResults = async () => {
    const { data } = await supabase
      .from('poll_votes')
      .select('option_index')
      .eq('poll_id', poll.id);
    
    const votes = data || [];
    const totalVotes = votes.length;
    
    const updatedOptions = poll.options.map((option, index) => ({
      ...option,
      votes: votes.filter(v => v.option_index === index).length,
      percentage: totalVotes ? ((votes.filter(v => v.option_index === index).length / totalVotes) * 100).toFixed(1) : 0
    }));
    
    setResults(updatedOptions);
  };
  
  const handleVote = async (optionIndex) => {
    if (hasVoted) return;
    
    await supabase.from('poll_votes').insert({
      poll_id: poll.id,
      user_id: user.id,
      option_index: optionIndex
    });
    
    setSelectedOption(optionIndex);
    setHasVoted(true);
    fetchResults();
    onVote?.();
  };
  
  const isExpired = new Date(poll.expires_at) < new Date();
  
  return (
    <div className="poll-card">
      <h4>{poll.question}</h4>
      <div className="poll-options">
        {results.map((option, index) => (
          <button
            key={index}
            className={`poll-option ${hasVoted ? 'voted' : ''} ${selectedOption === index ? 'selected' : ''}`}
            onClick={() => handleVote(index)}
            disabled={hasVoted || isExpired}
          >
            <span className="option-text">{option.text}</span>
            {hasVoted && (
              <>
                <div 
                  className="option-bar" 
                  style={{ width: `${option.percentage}%` }}
                />
                <span className="option-percentage">{option.percentage}%</span>
              </>
            )}
          </button>
        ))}
      </div>
      <div className="poll-footer">
        <span>{results.reduce((sum, o) => sum + o.votes, 0)} votes</span>
        <span>{isExpired ? 'Ended' : `${Math.ceil((new Date(poll.expires_at) - new Date()) / (1000 * 60 * 60))}h left`}</span>
      </div>
    </div>
  );
}
```

---

### 4. Analytics Dashboard (5 hours)

```jsx
// Create: src/pages/Analytics.js (already exists, enhance it)

const [analytics, setAnalytics] = useState({
  totalReach: 0,
  totalImpressions: 0,
  engagementRate: 0,
  followerGrowth: [],
  topPosts: [],
  demographics: {}
});

const fetchAnalytics = async () => {
  // Get all user's posts
  const { data: posts } = await supabase
    .from('posts')
    .select('*, likes_count, comments_count, shares_count, views_count')
    .eq('user_id', user.id)
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
  
  // Calculate metrics
  const totalReach = posts?.reduce((sum, p) => sum + (p.views_count || 0), 0) || 0;
  const totalEngagements = posts?.reduce((sum, p) => 
    sum + (p.likes_count || 0) + (p.comments_count || 0) + (p.shares_count || 0), 0) || 0;
  const engagementRate = totalReach ? ((totalEngagements / totalReach) * 100).toFixed(2) : 0;
  
  // Get follower growth (last 30 days)
  const { data: follows } = await supabase
    .from('follows')
    .select('created_at')
    .eq('following_id', user.id)
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at');
  
  const followerGrowth = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000);
    const count = follows?.filter(f => 
      new Date(f.created_at).toDateString() === date.toDateString()
    ).length || 0;
    return { date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), count };
  });
  
  // Top performing posts
  const topPosts = posts
    ?.sort((a, b) => (b.likes_count + b.comments_count) - (a.likes_count + a.comments_count))
    .slice(0, 5);
  
  setAnalytics({
    totalReach,
    totalImpressions: totalReach * 1.5, // Estimate
    engagementRate,
    followerGrowth,
    topPosts,
    demographics: {} // Implement based on available data
  });
};

// UI Components:
<div className="analytics-dashboard">
  <div className="analytics-header">
    <h1>Analytics</h1>
    <select onChange={(e) => setTimeRange(e.target.value)}>
      <option value="7">Last 7 days</option>
      <option value="30">Last 30 days</option>
      <option value="90">Last 90 days</option>
    </select>
  </div>
  
  <div className="analytics-cards">
    <div className="analytics-card">
      <div className="card-icon">👁️</div>
      <div className="card-content">
        <h3>{formatCount(analytics.totalReach)}</h3>
        <p>Total Reach</p>
      </div>
    </div>
    
    <div className="analytics-card">
      <div className="card-icon">📊</div>
      <div className="card-content">
        <h3>{formatCount(analytics.totalImpressions)}</h3>
        <p>Impressions</p>
      </div>
    </div>
    
    <div className="analytics-card">
      <div className="card-icon">💬</div>
      <div className="card-content">
        <h3>{analytics.engagementRate}%</h3>
        <p>Engagement Rate</p>
      </div>
    </div>
  </div>
  
  <div className="analytics-chart">
    <h2>Follower Growth</h2>
    <LineChart data={analytics.followerGrowth} />
  </div>
  
  <div className="top-posts">
    <h2>Top Performing Posts</h2>
    {analytics.topPosts.map(post => (
      <div key={post.id} className="top-post-item">
        <img src={post.image_url} alt="" />
        <div className="post-stats">
          <span>❤️ {post.likes_count}</span>
          <span>💬 {post.comments_count}</span>
          <span>📤 {post.shares_count}</span>
        </div>
      </div>
    ))}
  </div>
</div>
```

---

### 5. Advanced Messaging Features (3 hours)

#### Message Forwarding
```jsx
// In Messages.js, add:

const [forwardingMessage, setForwardingMessage] = useState(null);
const [forwardRecipients, setForwardRecipients] = useState([]);

const handleForward = async () => {
  for (const recipient of forwardRecipients) {
    await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: recipient.id,
      chat_id: [user.id, recipient.id].sort().join('_'),
      text: forwardingMessage.text,
      media_url: forwardingMessage.media_url,
      media_type: forwardingMessage.media_type,
      is_forwarded: true
    });
  }
  setForwardingMessage(null);
  setForwardRecipients([]);
  alert('Message forwarded!');
};
```

#### Message Search
```jsx
const [searchQuery, setSearchQuery] = useState('');
const [searchResults, setSearchResults] = useState([]);

const searchMessages = async (query) => {
  if (!query.trim()) {
    setSearchResults([]);
    return;
  }
  
  const { data } = await supabase
    .from('messages')
    .select('*, sender:sender_id(username, avatar_url)')
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .ilike('text', `%${query}%`)
    .order('created_at', { ascending: false })
    .limit(50);
  
  setSearchResults(data || []);
};
```

#### Disappearing Messages
```sql
-- Add to messages table:
ALTER TABLE messages ADD COLUMN disappear_after INTEGER; -- seconds
ALTER TABLE messages ADD COLUMN disappeared_at TIMESTAMPTZ;

-- Create function to auto-delete:
CREATE OR REPLACE FUNCTION delete_expired_messages()
RETURNS void AS $$
BEGIN
  UPDATE messages
  SET disappeared_at = NOW()
  WHERE disappear_after IS NOT NULL
    AND disappeared_at IS NULL
    AND created_at + (disappear_after || ' seconds')::INTERVAL < NOW();
END;
$$ LANGUAGE plpgsql;

-- Schedule with pg_cron or call from app
```

---

## 🎯 Priority Order

1. **Profile Enhancements** (2h) - Quick wins, high impact
2. **Content Discovery** (3h) - Improves user engagement
3. **Analytics Dashboard** (5h) - Valuable for creators
4. **Engagement Features** (4h) - Increases interaction
5. **Advanced Messaging** (3h) - Nice-to-have features

**Total Time: ~17 hours** to reach 100% completion

---

## 🚀 Quick Start

```bash
# 1. Apply profile enhancements
# Edit: src/pages/Profile.js
# Add: Profile statistics, QR code

# 2. Implement trending algorithm
# Create: src/utils/trendingAlgorithm.js
# Update: src/pages/Explore.js

# 3. Add polls
# Run migration: 036_post_polls.sql
# Create: src/components/PollCard.js

# 4. Enhance analytics
# Update: src/pages/Analytics.js
# Add charts library: npm install recharts

# 5. Add message features
# Update: src/pages/Messages.js
# Add forwarding, search, disappearing messages
```

---

## 📦 Required Packages

```bash
npm install qrcode.react recharts
```

---

## ✅ Testing Checklist

After implementing each feature:

- [ ] Test on desktop
- [ ] Test on mobile
- [ ] Test in dark mode
- [ ] Test with screen reader
- [ ] Test real-time updates
- [ ] Test error handling
- [ ] Test loading states
- [ ] Test empty states

---

## 🎉 You're Almost There!

With these implementations, Focus will be **100% production-ready** and competitive with major social platforms!

**Keep going - you're doing amazing!** 💪✨

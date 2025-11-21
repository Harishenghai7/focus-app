# 🪝 Trust Shield React Hook - Usage Examples

## 📦 **useTrustShield Hook**

The `useTrustShield` hook provides a simple interface to integrate Trust Shield throughout your React application.

---

## 🚀 **Basic Usage**

### **Simple Component Example**

```jsx
import React from 'react';
import { useTrustShield } from '../hooks/useTrustShield';
import { Box, Typography, Chip, LinearProgress, CircularProgress } from '@mui/material';
import { Shield, CheckCircle } from '@mui/icons-material';

function TrustScoreBadge() {
  const {
    trustScore,
    verificationLevel,
    isLoading,
    error
  } = useTrustShield();

  if (isLoading) {
    return <CircularProgress size={20} />;
  }

  if (error) {
    return <Typography color="error">Error loading trust score</Typography>;
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Shield color={trustScore >= 70 ? 'success' : 'warning'} />
      <Box>
        <Typography variant="body2">Trust Score: {trustScore}/100</Typography>
        <Chip 
          label={verificationLevel.toUpperCase()} 
          size="small"
          color={trustScore >= 70 ? 'success' : 'default'}
        />
      </Box>
    </Box>
  );
}

export default TrustScoreBadge;
```

---

## 🎯 **Permission Checking**

### **Create Post Button with Permission Check**

```jsx
import React, { useState } from 'react';
import { useTrustShield } from '../hooks/useTrustShield';
import { Button, Alert, CircularProgress } from '@mui/material';
import { Add } from '@mui/icons-material';

function CreatePostButton() {
  const { canPerform, isLoading } = useTrustShield();
  const [error, setError] = useState(null);
  const [checking, setChecking] = useState(false);

  const handleCreatePost = async () => {
    setChecking(true);
    setError(null);

    try {
      // Check permission before showing create dialog
      const permission = await canPerform('post');

      if (permission.allowed) {
        // Open create post dialog
        console.log('Can create post!');
        // openCreatePostDialog();
      } else {
        // Show error message
        setError(permission.reason);
        
        // If rate limited, show wait time
        if (permission.waitTime) {
          setError(`${permission.reason}. Try again in ${Math.ceil(permission.waitTime / 60)} minutes.`);
        }
      }
    } catch (err) {
      setError('Failed to check permissions');
    } finally {
      setChecking(false);
    }
  };

  return (
    <>
      <Button
        variant="contained"
        startIcon={checking ? <CircularProgress size={20} /> : <Add />}
        onClick={handleCreatePost}
        disabled={isLoading || checking}
      >
        Create Post
      </Button>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
    </>
  );
}

export default CreatePostButton;
```

---

## 🎨 **Profile Display with Badges**

### **User Profile Card with Trust Shield**

```jsx
import React from 'react';
import { useTrustShield } from '../hooks/useTrustShield';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Tooltip
} from '@mui/material';
import { Shield, Star, Email, Phone, CheckCircle } from '@mui/icons-material';

function UserProfileCard({ user }) {
  const {
    trustScore,
    verificationLevel,
    badges,
    isVerified,
    isTrusted,
    isLoading
  } = useTrustShield();

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Typography>Loading trust information...</Typography>
          <LinearProgress />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">{user.username}</Typography>
          {isTrusted && (
            <Tooltip title="Trusted User">
              <Star sx={{ ml: 1, color: 'gold' }} />
            </Tooltip>
          )}
        </Box>

        {/* Trust Score Display */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">Trust Score</Typography>
            <Typography variant="body2" fontWeight="bold">
              {trustScore}/100
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={trustScore}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: 'rgba(0,0,0,0.1)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                background: trustScore >= 70
                  ? 'linear-gradient(90deg, #4caf50 0%, #81c784 100%)'
                  : trustScore >= 40
                  ? 'linear-gradient(90deg, #ff9800 0%, #ffb74d 100%)'
                  : 'linear-gradient(90deg, #f44336 0%, #e57373 100%)'
              }
            }}
          />
        </Box>

        {/* Verification Level */}
        <Chip
          icon={<Shield />}
          label={verificationLevel.replace('_', ' ').toUpperCase()}
          color={isVerified ? 'success' : 'default'}
          size="small"
          sx={{ mb: 2 }}
        />

        {/* Badges */}
        {badges && badges.length > 0 && (
          <Box>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Badges Earned
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {badges.map((badge) => (
                <Tooltip key={badge.id} title={badge.name}>
                  <Chip
                    icon={<span>{badge.icon}</span>}
                    label={badge.name}
                    size="small"
                    variant="outlined"
                  />
                </Tooltip>
              ))}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default UserProfileCard;
```

---

## ⚡ **Rate Limit Display**

### **Action Rate Limit Indicator**

```jsx
import React, { useEffect, useState } from 'react';
import { useTrustShield } from '../hooks/useTrustShield';
import { Box, Typography, LinearProgress, Alert } from '@mui/material';

function RateLimitIndicator({ actionType = 'post' }) {
  const { canPerform, rateLimits } = useTrustShield();
  const [permission, setPermission] = useState(null);

  useEffect(() => {
    const checkLimit = async () => {
      const result = await canPerform(actionType);
      setPermission(result);
    };

    checkLimit();
    // Refresh every 60 seconds
    const interval = setInterval(checkLimit, 60000);
    return () => clearInterval(interval);
  }, [actionType, canPerform]);

  if (!permission) return null;

  const limit = permission.limit || 0;
  const remaining = permission.remaining || 0;
  const percentage = limit > 0 ? (remaining / limit) * 100 : 0;

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="caption" color="text.secondary">
          {actionType.charAt(0).toUpperCase() + actionType.slice(1)}s Per Hour
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {remaining}/{limit}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={percentage}
        color={percentage > 50 ? 'success' : percentage > 25 ? 'warning' : 'error'}
      />
      {percentage === 0 && permission.waitTime && (
        <Alert severity="warning" sx={{ mt: 1 }}>
          Rate limit reached. Try again in {Math.ceil(permission.waitTime / 60)} minutes.
        </Alert>
      )}
    </Box>
  );
}

export default RateLimitIndicator;
```

---

## 🔄 **Real-time Updates Example**

### **Live Trust Score Monitor**

```jsx
import React, { useEffect } from 'react';
import { useTrustShield } from '../hooks/useTrustShield';
import {
  Paper,
  Typography,
  Box,
  Chip,
  Button,
  CircularProgress
} from '@mui/material';
import { Refresh, TrendingUp, TrendingDown } from '@mui/icons-material';

function TrustScoreMonitor() {
  const {
    trustScore,
    verificationLevel,
    isLoading,
    refreshStatus,
    updateTrust
  } = useTrustShield();

  const [previousScore, setPreviousScore] = React.useState(trustScore);

  // Track score changes
  useEffect(() => {
    if (trustScore !== previousScore && previousScore !== 0) {
      console.log(`Trust score changed: ${previousScore} → ${trustScore}`);
    }
    setPreviousScore(trustScore);
  }, [trustScore, previousScore]);

  const scoreDelta = trustScore - previousScore;
  const hasIncreased = scoreDelta > 0;
  const hasDecreased = scoreDelta < 0;

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Trust Score Monitor</Typography>
        <Button
          startIcon={isLoading ? <CircularProgress size={16} /> : <Refresh />}
          onClick={refreshStatus}
          disabled={isLoading}
          size="small"
        >
          Refresh
        </Button>
      </Box>

      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Typography variant="h2" sx={{ fontWeight: 'bold' }}>
          {trustScore}
          <Typography component="span" variant="h5" color="text.secondary">
            /100
          </Typography>
        </Typography>

        {hasIncreased && (
          <Chip
            icon={<TrendingUp />}
            label={`+${scoreDelta} points`}
            color="success"
            size="small"
            sx={{ mt: 1 }}
          />
        )}

        {hasDecreased && (
          <Chip
            icon={<TrendingDown />}
            label={`${scoreDelta} points`}
            color="error"
            size="small"
            sx={{ mt: 1 }}
          />
        )}
      </Box>

      <Chip
        label={verificationLevel.toUpperCase()}
        color={trustScore >= 70 ? 'success' : trustScore >= 40 ? 'warning' : 'error'}
        sx={{ width: '100%' }}
      />

      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
        Updates automatically when changes occur
      </Typography>
    </Paper>
  );
}

export default TrustScoreMonitor;
```

---

## 🛡️ **Protected Component**

### **Wrap Components to Require Verification**

```jsx
import React from 'react';
import { useTrustShield } from '../hooks/useTrustShield';
import { Alert, Button, CircularProgress } from '@mui/material';
import { Shield } from '@mui/icons-material';

/**
 * Higher-order component to protect features based on trust level
 */
function withTrustShield(Component, options = {}) {
  const {
    minTrustScore = 50,
    requiredLevel = 'verified',
    fallback = null
  } = options;

  return function TrustShieldProtectedComponent(props) {
    const { trustScore, verificationLevel, isLoading, refreshStatus } = useTrustShield();

    if (isLoading) {
      return <CircularProgress />;
    }

    const meetsRequirements = 
      trustScore >= minTrustScore &&
      ['verified', 'trusted', 'highly_trusted'].includes(verificationLevel);

    if (!meetsRequirements) {
      return fallback || (
        <Alert
          severity="warning"
          icon={<Shield />}
          action={
            <Button color="inherit" size="small" onClick={refreshStatus}>
              Refresh
            </Button>
          }
        >
          This feature requires a trust score of at least {minTrustScore} and verification level "{requiredLevel}".
          <br />
          Current: {trustScore}/100 ({verificationLevel})
        </Alert>
      );
    }

    return <Component {...props} />;
  };
}

// Usage example
const ProtectedMessaging = withTrustShield(
  ({ recipientId }) => {
    return <div>Message interface here</div>;
  },
  {
    minTrustScore: 60,
    requiredLevel: 'verified',
    fallback: <Alert severity="error">Verified account required for messaging</Alert>
  }
);

export default withTrustShield;
```

---

## 🎯 **Context Provider Usage**

### **App-wide Trust Shield Provider**

```jsx
// App.js
import React from 'react';
import { TrustShieldProvider } from './hooks/useTrustShield';
import YourApp from './YourApp';

function App() {
  return (
    <TrustShieldProvider>
      <YourApp />
    </TrustShieldProvider>
  );
}

export default App;
```

```jsx
// SomeComponent.js
import React from 'react';
import { useTrustShieldContext } from './hooks/useTrustShield';

function SomeComponent() {
  // Access trust shield from context instead of hook
  const { trustScore, canPerform } = useTrustShieldContext();

  return (
    <div>
      Trust Score: {trustScore}
    </div>
  );
}
```

---

## 🔔 **Restriction Alerts**

### **Show Active Restrictions**

```jsx
import React from 'react';
import { useTrustShield } from '../hooks/useTrustShield';
import { Alert, AlertTitle, Box, Chip } from '@mui/material';
import { Warning, Error } from '@mui/icons-material';

function RestrictionsAlert() {
  const { restrictions, hasRestrictions, requiresReview } = useTrustShield();

  if (!hasRestrictions && !requiresReview) {
    return null;
  }

  return (
    <Box sx={{ mb: 2 }}>
      {requiresReview && (
        <Alert severity="error" icon={<Error />} sx={{ mb: 1 }}>
          <AlertTitle>Manual Review Required</AlertTitle>
          Your account has been flagged for review. Some features may be restricted.
        </Alert>
      )}

      {restrictions.posting_disabled && (
        <Alert severity="warning" icon={<Warning />} sx={{ mb: 1 }}>
          <AlertTitle>Posting Disabled</AlertTitle>
          {restrictions.reason || 'Your posting privileges have been temporarily restricted.'}
        </Alert>
      )}

      {restrictions.requires_captcha && (
        <Alert severity="info" sx={{ mb: 1 }}>
          Additional verification required for certain actions.
        </Alert>
      )}

      {restrictions.follow_limit && (
        <Alert severity="warning" sx={{ mb: 1 }}>
          Following is limited to {restrictions.follow_limit} per hour due to suspicious patterns.
        </Alert>
      )}
    </Box>
  );
}

export default RestrictionsAlert;
```

---

## 📊 **Complete Dashboard Example**

### **Trust Shield Dashboard Component**

```jsx
import React from 'react';
import { useTrustShield } from '../hooks/useTrustShield';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  CircularProgress
} from '@mui/material';
import {
  Shield,
  CheckCircle,
  Warning,
  TrendingUp,
  Refresh
} from '@mui/icons-material';

function TrustShieldDashboard() {
  const {
    trustScore,
    verificationLevel,
    badges,
    rateLimits,
    details,
    restrictions,
    isLoading,
    refreshStatus,
    isVerified,
    isTrusted,
    hasRestrictions
  } = useTrustShield();

  if (isLoading) {
    return (
      <Container>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">Trust Shield Dashboard</Typography>
        <Button startIcon={<Refresh />} onClick={refreshStatus}>
          Refresh
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Trust Score Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Trust Score
              </Typography>
              <Box sx={{ textAlign: 'center', my: 3 }}>
                <Typography variant="h2" sx={{ fontWeight: 'bold' }}>
                  {trustScore}
                  <Typography component="span" variant="h5" color="text.secondary">
                    /100
                  </Typography>
                </Typography>
                <Chip
                  label={verificationLevel.toUpperCase()}
                  color={isTrusted ? 'success' : isVerified ? 'primary' : 'default'}
                  sx={{ mt: 2 }}
                />
              </Box>
              <LinearProgress
                variant="determinate"
                value={trustScore}
                sx={{ height: 10, borderRadius: 5 }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Badges Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Badges Earned
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                {badges && badges.length > 0 ? (
                  badges.map((badge) => (
                    <Chip
                      key={badge.id}
                      icon={<span>{badge.icon}</span>}
                      label={badge.name}
                      variant="outlined"
                    />
                  ))
                ) : (
                  <Typography color="text.secondary">No badges earned yet</Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Verification Status */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Verification Status
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    {details.emailVerified ? (
                      <CheckCircle color="success" />
                    ) : (
                      <Warning color="warning" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary="Email Verification"
                    secondary={details.emailVerified ? 'Verified' : 'Not verified'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    {details.phoneVerified ? (
                      <CheckCircle color="success" />
                    ) : (
                      <Warning color="warning" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary="Phone Verification"
                    secondary={details.phoneVerified ? 'Verified' : 'Not verified'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    {details.captchaPassed ? (
                      <CheckCircle color="success" />
                    ) : (
                      <Warning color="warning" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary="Human Verification"
                    secondary={details.captchaPassed ? 'Verified' : 'Not completed'}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Rate Limits */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Rate Limits
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">Posts/Hour</Typography>
                  <Typography variant="h5">{rateLimits.posts_per_hour || 0}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">Comments/Hour</Typography>
                  <Typography variant="h5">{rateLimits.comments_per_hour || 0}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">Likes/Hour</Typography>
                  <Typography variant="h5">{rateLimits.likes_per_hour || 0}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">Follows/Hour</Typography>
                  <Typography variant="h5">{rateLimits.follows_per_hour || 0}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}

export default TrustShieldDashboard;
```

---

## 🎉 **Hook Features Summary**

✅ **Automatic Updates** - Real-time sync with database
✅ **Caching** - Optimized performance
✅ **Permission Checking** - Built-in action validation
✅ **Error Handling** - Graceful error states
✅ **Loading States** - UI feedback
✅ **Auto-refresh** - Keeps data fresh
✅ **Context Provider** - App-wide access
✅ **Type Safety** - Full JSDoc documentation
✅ **Convenience Helpers** - isVerified, isTrusted, etc.

---

**Ready to integrate Trust Shield throughout your app!** 🚀🛡️

# Focus App - Production Deployment Guide

## Overview
Instagram-level social media app with Posts, Boltz (short videos), Flash (stories), Messages, Calls, and real-time interactions.

## Tech Stack
- **Frontend**: React Native
- **Backend**: Supabase (Postgres, Auth, Storage, Realtime)
- **Video/Calls**: Agora SDK
- **Push Notifications**: Firebase Cloud Messaging
- **Media**: Supabase Storage + CDN

## Environment Variables

Create `.env` file:

```env
# Supabase
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Agora (Video/Audio Calls)
REACT_APP_AGORA_APP_ID=your-agora-app-id
AGORA_APP_CERTIFICATE=your-agora-certificate

# Firebase (Push Notifications)
REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVER_KEY=your-server-key

# Optional: Media CDN
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token

# Optional: Email
SMTP_HOST=smtp.brevo.com
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASS=your-password
```

## Database Setup

1. **Run Schema**:
```bash
# In Supabase SQL Editor
cat complete-schema.sql | pbcopy
# Paste and run in Supabase dashboard
```

2. **Run Triggers**:
```bash
# In Supabase SQL Editor
cat triggers-functions.sql | pbcopy
# Paste and run in Supabase dashboard
```

3. **Create Storage Buckets**:
```sql
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('posts', 'posts', false),
  ('boltz', 'boltz', false),
  ('flash', 'flash', false),
  ('chat_media', 'chat_media', false),
  ('thumbnails', 'thumbnails', false);
```

## Edge Functions Setup

Deploy Edge Functions to Supabase:

```bash
# Install Supabase CLI
npm install -g supabase

# Login and link project
supabase login
supabase link --project-ref your-project-ref

# Deploy functions
supabase functions deploy agora-token
supabase functions deploy thumbnail-generator
supabase functions deploy flash-cleanup
supabase functions deploy explore-scorer
```

## Agora Setup

1. **Create Agora Account**: https://console.agora.io
2. **Create Project**: Get App ID and Certificate
3. **Pricing**: ~$0.99/1000 minutes for video calls

**Minimal Configuration**:
- Enable Video Calling
- Enable Audio Calling  
- Set up token server (Edge Function)

## Firebase Setup

1. **Create Firebase Project**: https://console.firebase.google.com
2. **Enable FCM**: Cloud Messaging
3. **Get Server Key**: Project Settings > Cloud Messaging

**Minimal Configuration**:
- Enable Cloud Messaging
- Add Android/iOS apps
- Download config files

## Installation & Development

```bash
# Install dependencies
npm install

# Install additional packages for production
npm install @supabase/supabase-js
npm install react-native-agora
npm install @react-native-firebase/app
npm install @react-native-firebase/messaging
npm install react-native-video
npm install react-native-image-picker
npm install @react-native-async-storage/async-storage

# Start development
npm start
```

## Production Build

```bash
# Build for production
npm run build

# Android
cd android && ./gradlew assembleRelease

# iOS (requires Xcode)
cd ios && xcodebuild -workspace Focus.xcworkspace -scheme Focus -configuration Release
```

## Features Implemented

### ✅ Core Features
- [x] Posts (images with interactions)
- [x] Boltz (short videos with autoplay)
- [x] Flash (24h stories)
- [x] Messages (1:1 real-time chat)
- [x] Calls (audio/video via Agora)
- [x] Notifications (in-app + push)
- [x] Explore (trending content)

### ✅ Interactions
- [x] Like/Unlike (optimistic updates)
- [x] Comments (real-time)
- [x] Save/Unsave
- [x] Share (native + deep links)
- [x] Follow/Unfollow
- [x] Real-time counters

### ✅ Security & Performance
- [x] RLS policies on all tables
- [x] Signed URLs for media
- [x] Optimistic UI updates
- [x] Background upload queue
- [x] Error handling & rollback
- [x] Real-time subscriptions

### ✅ UI/UX Polish
- [x] Double-tap like animation
- [x] Heart pop effects
- [x] Loading skeletons
- [x] Smooth transitions
- [x] Light/Dark theme
- [x] Accessibility support

## Testing Checklist

### Database Security
- [ ] RLS prevents unauthorized access
- [ ] Users can only modify own content
- [ ] Followers-only content respects privacy

### Real-time Features
- [ ] Likes update across devices within 2s
- [ ] Comments appear instantly
- [ ] Messages deliver in real-time
- [ ] Notifications push correctly

### Media & Performance
- [ ] Images upload and display correctly
- [ ] Videos autoplay in Boltz feed
- [ ] Flash stories expire after 24h
- [ ] App maintains 60fps on mid-range devices

### Calls & Messaging
- [ ] Audio calls connect reliably
- [ ] Video calls work with camera toggle
- [ ] Messages sync across devices
- [ ] Push notifications arrive when app closed

### Offline & Error Handling
- [ ] Optimistic updates revert on failure
- [ ] Upload queue retries when online
- [ ] Error messages are user-friendly
- [ ] App doesn't crash on network issues

## Deployment

### Staging Environment
```bash
# Deploy to staging
supabase projects create focus-staging
supabase link --project-ref staging-ref
supabase db push
supabase functions deploy --project-ref staging-ref
```

### Production Environment
```bash
# Deploy to production
supabase projects create focus-production
supabase link --project-ref production-ref
supabase db push
supabase functions deploy --project-ref production-ref
```

### CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy Focus App
on:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: supabase functions deploy
```

## Monitoring & Analytics

### Error Tracking
```bash
# Install Sentry
npm install @sentry/react-native

# Configure in App.js
import * as Sentry from '@sentry/react-native';
Sentry.init({ dsn: 'your-sentry-dsn' });
```

### Analytics
```bash
# Install PostHog
npm install posthog-react-native

# Track events
posthog.capture('post_created', { type: 'image' });
posthog.capture('boltz_viewed', { duration: 15 });
```

## Cost Estimates (Monthly)

### Supabase
- **Free Tier**: 500MB DB, 1GB Storage, 2GB Bandwidth
- **Pro**: $25/month - 8GB DB, 100GB Storage, 250GB Bandwidth

### Agora
- **Video Calls**: $0.99/1000 minutes
- **Audio Calls**: $0.40/1000 minutes

### Firebase
- **FCM**: Free up to 200M messages/month
- **Hosting**: $0.026/GB

### Cloudflare (Optional)
- **CDN**: $20/month for 1TB bandwidth
- **Stream**: $1/1000 minutes stored

**Total Estimated Cost**: $50-100/month for 10K active users

## Support & Maintenance

### Regular Tasks
- Monitor error rates in Sentry
- Check database performance
- Update dependencies monthly
- Review and moderate reported content
- Backup database weekly

### Scaling Considerations
- Add read replicas for database
- Implement CDN for global media delivery
- Use Redis for session management
- Consider microservices for high load

## Legal & Compliance

### Required Pages
- Privacy Policy
- Terms of Service
- Community Guidelines
- DMCA Policy
- Contact Information

### Data Protection
- GDPR compliance for EU users
- CCPA compliance for CA users
- Data retention policies
- User data export/deletion

---

**Focus App** - Production-ready Instagram-level social media platform
Built with React Native + Supabase + Agora
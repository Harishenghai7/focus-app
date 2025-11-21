# FOCUS APP - PRODUCTION SETUP GUIDE

## Complete Production-Ready Social Media Platform

This guide will help you set up and deploy the FOCUS social media app to production.

## 📋 Prerequisites

- Node.js 16+ and npm
- Supabase account (free tier works)
- Git
- Domain name (optional, for production)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd focus-app
npm install
```

### 2. Set Up Supabase

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and anon key

2. **Run Database Schema**
   - Open Supabase Dashboard → SQL Editor
   - Run `PRODUCTION-COMPLETE-SCHEMA.sql` (this creates all tables, RLS policies, triggers, and indexes)

3. **Set Up Storage Buckets**
   - Go to Storage in Supabase Dashboard
   - Create these buckets (all public except messages):
     - `avatars` (public)
     - `posts` (public)
     - `boltz` (public)
     - `flash` (public)
     - `messages` (private)
     - `thumbnails` (public)

4. **Configure OAuth Providers**
   - Go to Authentication → Providers
   - Enable and configure:
     - Google (requires Google Cloud Console setup)
     - GitHub (requires GitHub OAuth App)
     - Microsoft/Azure (requires Azure AD App)
     - Twitter (requires Twitter Developer Account)
     - Discord (requires Discord Application)

### 3. Environment Variables

Create a `.env.local` file in the root:

```env
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_SUPABASE_SERVICE_KEY=your_service_role_key (optional, for admin operations)
REACT_APP_ENVIRONMENT=production
REACT_APP_VERSION=1.0.0

# OAuth Client IDs (optional, if using custom OAuth)
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
REACT_APP_GITHUB_CLIENT_ID=your_github_client_id
REACT_APP_MICROSOFT_CLIENT_ID=your_microsoft_client_id
REACT_APP_TWITTER_CLIENT_ID=your_twitter_client_id
REACT_APP_DISCORD_CLIENT_ID=your_discord_client_id
```

### 4. Start Development Server

```bash
npm start
```

Visit `http://localhost:3000`

## 📁 Project Structure

```
focus-app/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable React components
│   ├── pages/              # Page components
│   │   ├── Auth.js         # Login/Signup page
│   │   ├── Home.js         # Home feed
│   │   ├── Profile.js      # User profile
│   │   ├── Explore.js       # Explore/search
│   │   ├── Boltz.js        # Short videos feed
│   │   ├── Messages.js     # Direct messages
│   │   ├── Notifications.js # Notifications
│   │   ├── Calls.js        # Call history
│   │   ├── Settings.js     # Settings
│   │   └── ...
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions
│   ├── context/            # React context providers
│   ├── styles/             # CSS files
│   └── supabaseClient.js   # Supabase configuration
├── migrations/             # Database migrations
├── PRODUCTION-COMPLETE-SCHEMA.sql  # Complete database schema
└── package.json
```

## ✨ Features Implemented

### Authentication
- ✅ Email/password login and signup
- ✅ OAuth: Google, GitHub, Microsoft, Twitter, Discord
- ✅ Password reset
- ✅ Magic link authentication
- ✅ Two-factor authentication
- ✅ Age verification (13+)
- ✅ Guardian approval for users under 18
- ✅ Rate limiting
- ✅ Session management

### Home Feed
- ✅ Infinite scroll
- ✅ Stories bar
- ✅ Post cards with interactions
- ✅ Like, comment, share, save
- ✅ Carousel posts (multiple images/videos)
- ✅ Pull-to-refresh
- ✅ Real-time updates

### Profile
- ✅ Profile header with stats
- ✅ Posts grid
- ✅ Boltz grid
- ✅ Tagged posts
- ✅ Saved posts (own profile only)
- ✅ Story highlights
- ✅ Follow/unfollow
- ✅ Edit profile
- ✅ Privacy controls

### Explore
- ✅ Universal search
- ✅ Search results (users, posts, Boltz, hashtags)
- ✅ Trending content
- ✅ Category filters
- ✅ Hashtag pages

### Posts
- ✅ Create posts with multiple media
- ✅ Image/video upload
- ✅ Carousel support (up to 10 items)
- ✅ Caption with hashtags and mentions
- ✅ Location tagging
- ✅ Privacy settings
- ✅ Post detail view with comments

### Boltz (Short Videos)
- ✅ Vertical video feed
- ✅ Autoplay on scroll
- ✅ Swipe navigation
- ✅ Like, comment, share
- ✅ Sound/music support
- ✅ Create Boltz with camera/upload
- ✅ Video effects and filters

### Stories (Flash)
- ✅ 24-hour ephemeral content
- ✅ Story viewer
- ✅ Create stories
- ✅ Story highlights
- ✅ Close friends stories
- ✅ Story interactions

### Messaging
- ✅ Direct messages
- ✅ Group chats
- ✅ Real-time messaging
- ✅ Typing indicators
- ✅ Read receipts
- ✅ Media messages
- ✅ Voice messages
- ✅ Message reactions

### Calls
- ✅ Audio calls
- ✅ Video calls
- ✅ WebRTC integration
- ✅ Call history
- ✅ Incoming call handling

### Notifications
- ✅ Real-time notifications
- ✅ Notification types (likes, comments, follows, mentions, etc.)
- ✅ Notification preferences
- ✅ Mark as read

### Settings
- ✅ Account settings
- ✅ Privacy & security
- ✅ Notification preferences
- ✅ Content preferences
- ✅ Accessibility settings
- ✅ Account deletion

## 🔒 Security Features

- ✅ Row Level Security (RLS) on all tables
- ✅ Input validation and sanitization
- ✅ CSRF protection
- ✅ Rate limiting
- ✅ Secure file uploads
- ✅ Signed URLs for media
- ✅ Two-factor authentication
- ✅ Session management
- ✅ Blocked users system

## 🎨 UI/UX Features

- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Dark mode
- ✅ Accessibility (ARIA labels, keyboard navigation)
- ✅ Loading states
- ✅ Error handling
- ✅ Optimistic UI updates
- ✅ Smooth animations
- ✅ Progressive Web App (PWA)

## 🚢 Deployment

### Build for Production

```bash
npm run build
```

This creates an optimized `build/` folder.

### Deploy to Netlify

1. Connect your Git repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `build`
4. Add environment variables in Netlify dashboard
5. Deploy!

### Deploy to Vercel

1. Import your Git repository to Vercel
2. Vercel will auto-detect React
3. Add environment variables
4. Deploy!

### Deploy to Custom Server

1. Build the app: `npm run build`
2. Serve the `build/` folder with a web server (nginx, Apache, etc.)
3. Configure your server to serve `index.html` for all routes (SPA routing)

## 📊 Database Schema

The complete schema is in `PRODUCTION-COMPLETE-SCHEMA.sql`. It includes:

- **profiles** - User profiles
- **posts** - Posts with carousel support
- **boltz** - Short videos
- **flashes** - Stories
- **comments** - Comments with threading
- **likes** - Likes on posts, Boltz, comments
- **saves** - Saved/bookmarked content
- **follows** - Follow relationships
- **conversations** - Direct message conversations
- **messages** - Direct messages
- **group_conversations** - Group chats
- **group_messages** - Group chat messages
- **notifications** - User notifications
- **calls** - Call history
- **blocked_users** - Blocked users
- **close_friends** - Close friends lists
- **highlights** - Story highlights
- **hashtags** - Hashtags
- **mentions** - User mentions
- **reports** - Content reports
- **user_settings** - User preferences
- **search_history** - Search history

All tables have:
- Row Level Security (RLS) policies
- Proper indexes for performance
- Triggers for count updates
- Timestamps (created_at, updated_at)

## 🔧 Configuration

### Supabase Configuration

1. **Enable Realtime**
   - Go to Database → Replication
   - Enable replication for: messages, notifications, posts, comments, likes

2. **Set Up Edge Functions** (optional)
   - For push notifications
   - For image processing
   - For video transcoding

3. **Configure Email Templates**
   - Go to Authentication → Email Templates
   - Customize welcome, password reset, etc.

### App Configuration

Edit `src/config/` files:
- `constants.js` - App constants
- `features.js` - Feature flags
- `api.js` - API endpoints

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run E2E tests
npm run test:e2e

# Run all tests
npm run test:full
```

## 📱 Progressive Web App

The app is configured as a PWA. Users can:
1. Install it on their device
2. Use it offline (with cached content)
3. Receive push notifications

## 🌐 Browser Support

- Chrome 90+
- Safari 14+
- Firefox 88+
- Edge 90+

## 📈 Performance Optimization

- Code splitting by route
- Lazy loading of components
- Image lazy loading
- Infinite scroll pagination
- Virtual scrolling for long lists
- CDN caching for media
- Service worker for offline support

## 🐛 Troubleshooting

### Database Connection Issues
- Verify Supabase URL and keys in `.env.local`
- Check Supabase project is active
- Verify RLS policies are set correctly

### OAuth Not Working
- Verify OAuth providers are configured in Supabase
- Check redirect URLs match your domain
- Verify client IDs and secrets are correct

### Media Upload Issues
- Check storage buckets exist
- Verify bucket policies allow uploads
- Check file size limits

### Real-time Not Working
- Enable replication in Supabase
- Check WebSocket connection
- Verify Realtime is enabled for tables

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [React Router Documentation](https://reactrouter.com)

## 🆘 Support

For issues or questions:
1. Check the troubleshooting section
2. Review Supabase logs
3. Check browser console for errors
4. Review application logs

## 🎉 You're Ready!

Your FOCUS app is now set up and ready for production. Start by creating an account and exploring all the features!

---

**Version:** 1.0.0  
**Last Updated:** November 2025  
**Status:** Production Ready


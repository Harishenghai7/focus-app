# 🎯 FOCUS - Modern Social Media App

A seamless, modern social media application built with React and Supabase, featuring Instagram-class UI, real-time functionality, and production-ready code.

## ✨ Features

### 🔐 **Authentication**
- Secure login/signup with Supabase Auth
- Password reset functionality
- Smooth UI transitions and error handling
- Protected routes with authentication guards

### 🏠 **Home Feed**
- Instagram-style flash bar for ephemeral content
- Scrollable post feed with real-time updates
- Empty state handling with call-to-action
- Polished card layouts and animations

### ⚡ **Flash (Stories)**
- Full-screen immersive viewer
- Auto-play videos with progress indicators
- 24-hour expiration system
- Upload images and videos
- Swipe navigation between stories

### 🔍 **Explore & Discovery**
- Clean search functionality
- Tabbed interface (Users, Posts, Boltz)
- Grid layout for content discovery
- Real-time search with debouncing

### 🎬 **Boltz (Short Videos)**
- TikTok-style vertical video feed
- Full-screen video player
- Like, comment, and share functionality
- Keyboard navigation support
- Auto-play with mute controls

### 📞 **Real-time Calls**
- Audio and video calling with PeerJS
- Contact search and selection
- In-call controls (mute, camera toggle)
- Call status indicators
- Responsive video layout

### 👤 **User Profiles**
- Instagram-style profile layout
- Edit profile with avatar upload
- Tabbed content (Posts, Boltz, Flash, Saved)
- Follower/following counts
- Profile verification badges

### 🎨 **Theming**
- Dark/Light mode toggle
- Consistent design system
- Smooth theme transitions
- Persistent theme preferences

### 📱 **Mobile-First Design**
- Responsive layout for all screen sizes
- Touch-friendly interactions
- Optimized for mobile performance
- Progressive Web App ready

## 🛠 Tech Stack

- **Frontend**: React 19, React Router DOM
- **Backend**: Supabase (Auth, Database, Storage)
- **Styling**: CSS Custom Properties, CSS Grid/Flexbox
- **Real-time**: PeerJS for video/audio calls
- **Animations**: Framer Motion
- **Build Tool**: Create React App

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd focus-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Update `src/supabaseClient.js` with your project URL and anon key
   - Run the database migrations (see Database Schema section)

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 📊 Database Schema

### Tables Required

```sql
-- Users/Profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Posts table
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Flash/Stories table
CREATE TABLE flash (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  image_url TEXT,
  video_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Boltz (short videos) table
CREATE TABLE boltz (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Likes table
CREATE TABLE likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Boltz likes table
CREATE TABLE boltz_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  boltz_id UUID REFERENCES boltz(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, boltz_id)
);

-- Followers table
CREATE TABLE followers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);
```

### Storage Buckets

Create the following storage buckets in Supabase:

- `media` - For posts, flash, and boltz content
- `avatars` - For user profile pictures

## 🎨 Design System

### Color Palette

**Light Theme:**
- Primary: `#0095f6` (Instagram Blue)
- Accent: `#ff3040` (Focus Red)
- Background: `#fafafa`
- Surface: `#ffffff`
- Text Primary: `#262626`
- Text Secondary: `#8e8e8e`

**Dark Theme:**
- Primary: `#0095f6`
- Accent: `#ff3040`
- Background: `#000000`
- Surface: `#121212`
- Text Primary: `#ffffff`
- Text Secondary: `#a8a8a8`

### Typography
- Font Family: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto`
- Font Weights: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

### Spacing
- Base unit: `8px`
- Common values: `8px, 12px, 16px, 20px, 24px, 32px`

### Border Radius
- Small: `8px`
- Medium: `12px`
- Large: `16px`
- Full: `50%`

## 📱 Component Architecture

### Core Components
- `Header` - Top navigation with logo and actions
- `BottomNav` - Instagram-style bottom navigation
- `PostCard` - Individual post display component
- `ThemeContext` - Global theme management

### Pages
- `Auth` - Login/signup/password reset
- `Home` - Main feed with flash bar
- `Explore` - Search and discovery
- `Create` - Content creation interface
- `Boltz` - Short video feed
- `Flash` - Stories viewer and creator
- `Call` - Video/audio calling interface
- `Profile` - User profile display
- `Settings` - App preferences and account settings

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file:

```env
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase Configuration
Update `src/supabaseClient.js` with your Supabase credentials.

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel --prod
```

### Deploy to Netlify
1. Build the project: `npm run build`
2. Upload the `build` folder to Netlify
3. Set environment variables in Netlify dashboard

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Test Coverage
```bash
npm test -- --coverage
```

## 📈 Performance Optimizations

- **Code Splitting**: Automatic route-based splitting
- **Image Optimization**: WebP format support
- **Lazy Loading**: Components and images
- **Caching**: Service worker for offline support
- **Bundle Analysis**: Webpack bundle analyzer

## 🔒 Security Features

- **Authentication**: Supabase Auth with JWT tokens
- **Authorization**: Row Level Security (RLS) policies
- **Input Validation**: Client and server-side validation
- **XSS Protection**: Sanitized user inputs
- **CSRF Protection**: Built-in with Supabase

## 🐛 Troubleshooting

### Common Issues

1. **Supabase Connection Error**
   - Check your Supabase URL and anon key
   - Verify network connectivity
   - Check browser console for errors

2. **Video/Audio Call Issues**
   - Ensure HTTPS in production
   - Check browser permissions for camera/microphone
   - Verify PeerJS server configuration

3. **Theme Not Persisting**
   - Check localStorage permissions
   - Verify ThemeContext is properly wrapped

### Debug Mode
Set `localStorage.setItem('debug', 'true')` for additional logging.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Instagram** - UI/UX inspiration
- **TikTok** - Short video feed concept
- **Supabase** - Backend infrastructure
- **React Team** - Amazing framework
- **Framer Motion** - Smooth animations

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Join our Discord community

---

**Built with ❤️ for the future of social media**

*Focus - Where connections matter*
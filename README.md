# Focus - Social Media Platform

Focus is a modern, full-featured social media platform that combines photo sharing, short-form videos, ephemeral stories, messaging, and video calls into one seamless experience.

## ✨ Features

- **Posts**: Share photos and videos with carousel support (up to 10 items)
- **Boltz**: Create and watch short-form vertical videos
- **Flash Stories**: Share 24-hour ephemeral content with highlights
- **Direct Messaging**: One-on-one and group chats with voice messages
- **Audio/Video Calls**: Built-in WebRTC calling
- **Real-time Updates**: Instant notifications and live feed updates
- **Search & Discovery**: Find users, hashtags, and trending content
- **Privacy Controls**: Private accounts, blocking, close friends
- **Accessibility**: Full screen reader support and keyboard navigation
- **Dark Mode**: Beautiful light and dark themes
- **PWA**: Install as a progressive web app

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- Supabase account and project
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/focus-app.git
   cd focus-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   REACT_APP_SUPABASE_URL=your_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
   REACT_APP_GITHUB_CLIENT_ID=your_github_client_id
   ```

4. **Set up the database**
   
   Run the database migrations in your Supabase SQL editor:
   ```bash
   # Run migrations in order from migrations/ folder
   ```

5. **Start the development server**
   ```bash
   npm start
   ```
   
   Open [http://localhost:3000](http://localhost:3000) to view the app.

## 📚 Documentation

- **[User Guide](docs/USER_GUIDE.md)** - Complete guide for using Focus
- **[FAQ](docs/FAQ.md)** - Frequently asked questions
- **[Code Documentation](docs/CODE_DOCUMENTATION.md)** - Developer documentation
- **[Deployment Guide](docs/DEPLOYMENT_GUIDE.md)** - Production deployment instructions
- **[Video Tutorials](docs/VIDEO_TUTORIALS.md)** - Video tutorial library

## 🛠️ Development

### Available Scripts

#### `npm start`
Runs the app in development mode at [http://localhost:3000](http://localhost:3000).

#### `npm test`
Launches the test runner in interactive watch mode.

#### `npm run test:coverage`
Runs tests with coverage report.

#### `npm run build`
Builds the app for production to the `build` folder.

#### `npm run build:analyze`
Builds and analyzes the bundle size.

#### `npm run e2e`
Runs end-to-end tests with Playwright.

#### `npm run lint`
Runs ESLint to check code quality.

#### `npm run format`
Formats code with Prettier.

### Project Structure

```
focus-app/
├── public/              # Static assets
├── src/
│   ├── components/      # React components
│   ├── pages/           # Page components
│   ├── hooks/           # Custom React hooks
│   ├── utils/           # Utility functions
│   ├── context/         # React context providers
│   ├── styles/          # CSS and styling
│   └── __tests__/       # Test files
├── docs/                # Documentation
├── migrations/          # Database migrations
├── e2e/                 # End-to-end tests
└── scripts/             # Build scripts
```

## 🧪 Testing

Focus has comprehensive test coverage:

- **Unit Tests**: Testing utility functions and hooks
- **Integration Tests**: Testing component interactions
- **E2E Tests**: Testing complete user flows

Run tests:
```bash
# Unit and integration tests
npm test

# E2E tests
npm run e2e

# Coverage report
npm run test:coverage
```

## 🔒 Security

Focus implements multiple security layers:

- Row Level Security (RLS) policies on all database tables
- Input validation and sanitization
- CSRF protection
- Rate limiting
- Signed URLs for media files
- Two-factor authentication
- Session management

See [Security Documentation](docs/CODE_DOCUMENTATION.md#security) for details.

## 🎨 Customization

### Theming

Focus supports light and dark themes. Customize colors in `src/styles/theme.css`.

### Configuration

App configuration is in `src/config/`:
- `constants.js` - App constants
- `features.js` - Feature flags
- `api.js` - API endpoints

## 📱 Progressive Web App

Focus is a PWA and can be installed on mobile devices and desktops:

1. Open Focus in your browser
2. Click the install prompt or browser menu
3. Select "Install Focus" or "Add to Home Screen"

## 🌐 Browser Support

- Chrome 90+
- Safari 14+
- Firefox 88+
- Edge 90+

## 🚢 Deployment

See the [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) for detailed instructions.

Quick deploy options:
- **Netlify**: Connect your repo and deploy automatically
- **Vercel**: Import project and deploy with one click
- **Custom Server**: Build and serve the `build` folder

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with [React](https://react.dev)
- Backend powered by [Supabase](https://supabase.com)
- Icons from [Lucide React](https://lucide.dev)
- Animations with [Framer Motion](https://www.framer.com/motion/)

## 📞 Support

- **Documentation**: Check the [docs](docs/) folder
- **Issues**: Report bugs on [GitHub Issues](https://github.com/yourusername/focus-app/issues)
- **Email**: support@focus.app
- **Community**: Join our [Discord](https://discord.gg/focus)

## 🗺️ Roadmap

- [ ] Mobile apps (iOS and Android)
- [ ] Live streaming
- [ ] Advanced analytics
- [ ] Monetization features
- [ ] API for third-party integrations

## 📊 Status

- **Version**: 1.0.0
- **Status**: Production Ready
- **Last Updated**: November 2025

---

Made with ❤️ by the Focus Team

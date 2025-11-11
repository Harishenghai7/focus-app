# Focus Deployment Guide

This comprehensive guide covers deploying Focus to production environments, including setup, configuration, monitoring, and troubleshooting.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Frontend Deployment](#frontend-deployment)
5. [SSL/HTTPS Configuration](#sslhttps-configuration)
6. [Environment Variables](#environment-variables)
7. [Monitoring and Analytics](#monitoring-and-analytics)
8. [Backup and Recovery](#backup-and-recovery)
9. [Troubleshooting](#troubleshooting)
10. [Post-Deployment](#post-deployment)

---

## Pre-Deployment Checklist

Before deploying to production, ensure you've completed:

### Code Quality
- [ ] All tests passing (`npm test`)
- [ ] No console errors or warnings
- [ ] Code linted and formatted
- [ ] Bundle size optimized (< 5MB initial load)
- [ ] Lighthouse score > 90

### Security
- [ ] All environment variables secured
- [ ] RLS policies enabled on all tables
- [ ] Input validation implemented
- [ ] Rate limiting configured
- [ ] CSRF protection enabled
- [ ] Content Security Policy configured

### Features
- [ ] All critical features tested
- [ ] Error boundaries implemented
- [ ] Loading states added
- [ ] Offline functionality working
- [ ] Accessibility verified (WCAG 2.1 AA)

### Database
- [ ] All migrations applied
- [ ] Indexes created
- [ ] RLS policies tested
- [ ] Backup strategy in place
- [ ] Connection pooling configured

### Performance
- [ ] Images optimized
- [ ] Code splitting implemented
- [ ] Lazy loading configured
- [ ] Service worker registered
- [ ] CDN configured for static assets

---

## Environment Setup

### Production Environment Requirements

**Minimum Requirements**:
- Node.js 16+ (for build process)
- 2GB RAM
- 20GB storage
- SSL certificate
- Domain name

**Recommended**:
- Node.js 18+
- 4GB RAM
- 50GB storage
- CDN for media files
- Load balancer for high traffic

### Hosting Options

#### Option 1: Netlify (Recommended for Quick Deploy)

**Pros**: Easy setup, automatic deployments, free SSL, CDN included
**Cons**: Limited backend control

**Steps**:
1. Push code to GitHub/GitLab
2. Connect repository to Netlify
3. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `build`
4. Add environment variables
5. Deploy

#### Option 2: Vercel

**Pros**: Excellent performance, automatic deployments, free SSL
**Cons**: Limited customization

**Steps**:
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in project directory
3. Follow prompts to configure
4. Add environment variables in dashboard
5. Deploy with `vercel --prod`

#### Option 3: AWS (S3 + CloudFront)

**Pros**: Highly scalable, full control, cost-effective
**Cons**: More complex setup

**Steps**:
1. Create S3 bucket
2. Enable static website hosting
3. Build app: `npm run build`
4. Upload build folder to S3
5. Create CloudFront distribution
6. Configure SSL certificate
7. Point domain to CloudFront

#### Option 4: Custom Server (Nginx)

**Pros**: Full control, can host multiple apps
**Cons**: Requires server management

See [Custom Server Setup](#custom-server-setup) below.

---

## Database Setup

### Supabase Production Setup

1. **Create Production Project**
   ```
   - Go to https://app.supabase.com
   - Click "New Project"
   - Choose a strong database password
   - Select region closest to users
   - Wait for project to initialize
   ```

2. **Run Migrations**
   
   Execute all migration files in order from `migrations/` folder:
   ```sql
   -- In Supabase SQL Editor, run each migration file
   -- migrations/001_add_carousel_support.sql
   -- migrations/002_group_messaging.sql
   -- ... (continue with all migrations)
   ```

3. **Configure Storage Buckets**
   ```sql
   -- Create storage buckets
   INSERT INTO storage.buckets (id, name, public)
   VALUES 
     ('avatars', 'avatars', true),
     ('posts', 'posts', true),
     ('boltz', 'boltz', true),
     ('flashes', 'flashes', true),
     ('messages', 'messages', false);
   ```

4. **Set Up Storage Policies**
   ```sql
   -- Allow authenticated users to upload
   CREATE POLICY "Users can upload own content"
     ON storage.objects FOR INSERT
     WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);
   
   -- Allow public read for public buckets
   CREATE POLICY "Public content is viewable"
     ON storage.objects FOR SELECT
     USING (bucket_id IN ('avatars', 'posts', 'boltz', 'flashes'));
   ```

5. **Enable Realtime**
   ```sql
   -- Enable realtime for tables
   ALTER PUBLICATION supabase_realtime ADD TABLE posts;
   ALTER PUBLICATION supabase_realtime ADD TABLE comments;
   ALTER PUBLICATION supabase_realtime ADD TABLE likes;
   ALTER PUBLICATION supabase_realtime ADD TABLE messages;
   ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
   ```

6. **Configure Connection Pooling**
   
   In Supabase Dashboard:
   - Go to Settings → Database
   - Enable Connection Pooling
   - Use pooled connection string in production

7. **Set Up Scheduled Functions**
   
   For expired Flash stories and scheduled posts:
   ```sql
   -- Create cron job for expired flashes
   SELECT cron.schedule(
     'delete-expired-flashes',
     '0 * * * *', -- Every hour
     $$
     DELETE FROM flashes WHERE expires_at < NOW();
     $$
   );
   
   -- Create cron job for scheduled posts
   SELECT cron.schedule(
     'publish-scheduled-posts',
     '*/5 * * * *', -- Every 5 minutes
     $$
     UPDATE posts 
     SET is_draft = false 
     WHERE is_draft = true 
       AND scheduled_for <= NOW();
     $$
   );
   ```

### Database Backup Strategy

1. **Automatic Backups**
   - Supabase provides daily backups (retained for 7 days on free tier)
   - Upgrade to Pro for point-in-time recovery

2. **Manual Backups**
   ```bash
   # Export database
   pg_dump -h db.your-project.supabase.co \
     -U postgres \
     -d postgres \
     -f backup_$(date +%Y%m%d).sql
   ```

3. **Backup Schedule**
   - Daily automated backups
   - Weekly full backups stored off-site
   - Monthly archive backups

---

## Frontend Deployment

### Build Configuration

1. **Optimize Build**
   
   Update `package.json`:
   ```json
   {
     "scripts": {
       "build": "GENERATE_SOURCEMAP=false react-scripts build",
       "build:analyze": "npm run build && source-map-explorer 'build/static/js/*.js'"
     }
   }
   ```

2. **Environment-Specific Builds**
   
   Create `.env.production`:
   ```env
   REACT_APP_SUPABASE_URL=https://your-project.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your_production_anon_key
   REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
   REACT_APP_GITHUB_CLIENT_ID=your_github_client_id
   REACT_APP_ENVIRONMENT=production
   REACT_APP_API_URL=https://api.focus.app
   GENERATE_SOURCEMAP=false
   ```

3. **Build the App**
   ```bash
   npm run build
   ```
   
   This creates an optimized production build in the `build/` folder.

4. **Verify Build**
   ```bash
   # Serve locally to test
   npx serve -s build -p 3000
   ```

### Netlify Deployment

1. **netlify.toml Configuration**
   
   Create `netlify.toml` in project root:
   ```toml
   [build]
     command = "npm run build"
     publish = "build"
   
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   
   [[headers]]
     for = "/*"
     [headers.values]
       X-Frame-Options = "DENY"
       X-Content-Type-Options = "nosniff"
       X-XSS-Protection = "1; mode=block"
       Referrer-Policy = "strict-origin-when-cross-origin"
       Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co;"
   
   [[headers]]
     for = "/static/*"
     [headers.values]
       Cache-Control = "public, max-age=31536000, immutable"
   ```

2. **Deploy via CLI**
   ```bash
   # Install Netlify CLI
   npm install -g netlify-cli
   
   # Login
   netlify login
   
   # Deploy
   netlify deploy --prod
   ```

3. **Deploy via Git**
   - Push to GitHub
   - Connect repository in Netlify dashboard
   - Configure build settings
   - Deploy automatically on push

### Vercel Deployment

1. **vercel.json Configuration**
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": "build",
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ],
     "headers": [
       {
         "source": "/(.*)",
         "headers": [
           { "key": "X-Frame-Options", "value": "DENY" },
           { "key": "X-Content-Type-Options", "value": "nosniff" }
         ]
       }
     ]
   }
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

### Custom Server Setup

#### Using Nginx

1. **Install Nginx**
   ```bash
   sudo apt update
   sudo apt install nginx
   ```

2. **Configure Nginx**
   
   Create `/etc/nginx/sites-available/focus`:
   ```nginx
   server {
       listen 80;
       server_name focus.app www.focus.app;
       
       root /var/www/focus/build;
       index index.html;
       
       # Gzip compression
       gzip on;
       gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
       
       # Security headers
       add_header X-Frame-Options "DENY" always;
       add_header X-Content-Type-Options "nosniff" always;
       add_header X-XSS-Protection "1; mode=block" always;
       
       # Cache static assets
       location /static/ {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }
       
       # SPA routing
       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

3. **Enable Site**
   ```bash
   sudo ln -s /etc/nginx/sites-available/focus /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

4. **Deploy Build**
   ```bash
   # Build locally
   npm run build
   
   # Copy to server
   scp -r build/* user@server:/var/www/focus/build/
   ```

---

## SSL/HTTPS Configuration

### Using Let's Encrypt (Free)

1. **Install Certbot**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   ```

2. **Obtain Certificate**
   ```bash
   sudo certbot --nginx -d focus.app -d www.focus.app
   ```

3. **Auto-Renewal**
   ```bash
   # Test renewal
   sudo certbot renew --dry-run
   
   # Certbot automatically sets up cron job for renewal
   ```

### Using Cloudflare (Recommended)

1. Add domain to Cloudflare
2. Update nameservers
3. Enable "Full (strict)" SSL mode
4. Enable "Always Use HTTPS"
5. Configure page rules for caching

---

## Environment Variables

### Production Environment Variables

Create `.env.production`:

```env
# Supabase
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_production_anon_key

# OAuth
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
REACT_APP_GITHUB_CLIENT_ID=your_github_client_id

# App Configuration
REACT_APP_ENVIRONMENT=production
REACT_APP_APP_URL=https://focus.app
REACT_APP_API_URL=https://api.focus.app

# Feature Flags
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_ERROR_TRACKING=true
REACT_APP_ENABLE_PUSH_NOTIFICATIONS=true

# Build Configuration
GENERATE_SOURCEMAP=false
INLINE_RUNTIME_CHUNK=false

# Analytics (Optional)
REACT_APP_GA_TRACKING_ID=your_ga_id
REACT_APP_SENTRY_DSN=your_sentry_dsn

# WebRTC (Optional)
REACT_APP_STUN_SERVER=stun:stun.l.google.com:19302
REACT_APP_TURN_SERVER=turn:your-turn-server.com
REACT_APP_TURN_USERNAME=username
REACT_APP_TURN_CREDENTIAL=credential
```

### Securing Environment Variables

**Never commit `.env` files to version control!**

1. Add to `.gitignore`:
   ```
   .env
   .env.local
   .env.production
   .env.*.local
   ```

2. Use platform-specific secret management:
   - **Netlify**: Environment variables in dashboard
   - **Vercel**: Environment variables in project settings
   - **AWS**: AWS Secrets Manager
   - **Custom**: Use environment variables on server

---

## Monitoring and Analytics

### Error Tracking with Sentry

1. **Install Sentry**
   ```bash
   npm install @sentry/react
   ```

2. **Configure Sentry**
   
   In `src/index.js`:
   ```javascript
   import * as Sentry from "@sentry/react";
   
   if (process.env.REACT_APP_ENVIRONMENT === 'production') {
     Sentry.init({
       dsn: process.env.REACT_APP_SENTRY_DSN,
       environment: process.env.REACT_APP_ENVIRONMENT,
       tracesSampleRate: 0.1,
     });
   }
   ```

### Analytics with Google Analytics

1. **Install GA**
   ```bash
   npm install react-ga4
   ```

2. **Configure GA**
   
   In `src/utils/analytics.js`:
   ```javascript
   import ReactGA from 'react-ga4';
   
   export const initGA = () => {
     if (process.env.REACT_APP_GA_TRACKING_ID) {
       ReactGA.initialize(process.env.REACT_APP_GA_TRACKING_ID);
     }
   };
   
   export const logPageView = () => {
     ReactGA.send({ hitType: "pageview", page: window.location.pathname });
   };
   ```

### Performance Monitoring

1. **Web Vitals**
   
   Already configured in `src/reportWebVitals.js`

2. **Lighthouse CI**
   
   Add to CI/CD pipeline:
   ```yaml
   # .github/workflows/lighthouse.yml
   name: Lighthouse CI
   on: [push]
   jobs:
     lighthouse:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v2
         - name: Run Lighthouse CI
           uses: treosh/lighthouse-ci-action@v9
           with:
             urls: |
               https://focus.app
             uploadArtifacts: true
   ```

### Uptime Monitoring

Use services like:
- **UptimeRobot**: Free uptime monitoring
- **Pingdom**: Advanced monitoring
- **StatusCake**: Multi-location checks

---

## Backup and Recovery

### Database Backups

1. **Automated Backups**
   ```bash
   # Create backup script
   #!/bin/bash
   DATE=$(date +%Y%m%d_%H%M%S)
   pg_dump -h db.your-project.supabase.co \
     -U postgres \
     -d postgres \
     -f /backups/focus_$DATE.sql
   
   # Keep only last 30 days
   find /backups -name "focus_*.sql" -mtime +30 -delete
   ```

2. **Schedule with Cron**
   ```bash
   # Run daily at 2 AM
   0 2 * * * /path/to/backup-script.sh
   ```

### Media Backups

1. **Supabase Storage Backup**
   ```bash
   # Sync storage buckets to S3
   aws s3 sync supabase://your-project/storage s3://focus-backups/storage
   ```

2. **Automated Sync**
   - Set up daily sync to external storage
   - Use AWS S3, Google Cloud Storage, or Backblaze B2

### Disaster Recovery Plan

1. **Recovery Time Objective (RTO)**: 4 hours
2. **Recovery Point Objective (RPO)**: 24 hours

**Recovery Steps**:
1. Restore database from latest backup
2. Restore media files from backup
3. Deploy latest application build
4. Verify all services operational
5. Monitor for issues

---

## Troubleshooting

### Common Deployment Issues

#### Build Fails

**Issue**: `npm run build` fails

**Solutions**:
```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install

# Check for errors
npm run build 2>&1 | tee build.log

# Verify Node version
node --version  # Should be 16+
```

#### Environment Variables Not Working

**Issue**: App can't connect to Supabase

**Solutions**:
- Verify variables are prefixed with `REACT_APP_`
- Check variables are set in hosting platform
- Rebuild after changing variables
- Check browser console for actual values

#### Routing Not Working (404 on Refresh)

**Issue**: Page refresh returns 404

**Solutions**:
- Configure redirects in `netlify.toml` or `vercel.json`
- For Nginx, ensure `try_files` directive is set
- For S3, configure error document to `index.html`

#### CORS Errors

**Issue**: API requests blocked by CORS

**Solutions**:
- Configure CORS in Supabase dashboard
- Add allowed origins
- Check request headers

#### Slow Performance

**Issue**: App loads slowly

**Solutions**:
- Enable CDN
- Optimize images
- Enable gzip compression
- Check bundle size with `npm run build:analyze`
- Implement code splitting

#### Database Connection Issues

**Issue**: Can't connect to database

**Solutions**:
- Verify connection string
- Check IP whitelist in Supabase
- Use connection pooling
- Check database status

---

## Post-Deployment

### Verification Checklist

After deployment, verify:

- [ ] App loads correctly
- [ ] Authentication works
- [ ] Can create posts
- [ ] Can send messages
- [ ] Realtime updates working
- [ ] Images upload successfully
- [ ] Videos play correctly
- [ ] Notifications working
- [ ] Search functioning
- [ ] Mobile responsive
- [ ] SSL certificate valid
- [ ] No console errors
- [ ] Analytics tracking
- [ ] Error tracking working

### Smoke Tests

Run these manual tests:

1. **Authentication**
   - Sign up new account
   - Log in
   - Reset password
   - Log out

2. **Content Creation**
   - Create post with image
   - Create carousel post
   - Create Boltz video
   - Create Flash story

3. **Interactions**
   - Like post
   - Comment on post
   - Save post
   - Follow user

4. **Messaging**
   - Send direct message
   - Create group chat
   - Send voice message
   - Make video call

### Monitoring Setup

1. **Set Up Alerts**
   - Error rate > 1%
   - Response time > 3s
   - Uptime < 99.9%
   - Database connections > 80%

2. **Dashboard**
   - Create monitoring dashboard
   - Track key metrics
   - Set up weekly reports

3. **User Feedback**
   - Enable feedback form
   - Monitor support emails
   - Track user reports

### Rollback Plan

If issues occur:

1. **Immediate Rollback**
   ```bash
   # Netlify
   netlify rollback
   
   # Vercel
   vercel rollback
   
   # Custom
   # Deploy previous build
   ```

2. **Database Rollback**
   ```bash
   # Restore from backup
   psql -h db.your-project.supabase.co \
     -U postgres \
     -d postgres \
     -f backup_previous.sql
   ```

3. **Communication**
   - Notify users of issues
   - Post status updates
   - Provide ETA for fix

---

## Continuous Deployment

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
        env:
          REACT_APP_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          REACT_APP_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      
      - name: Deploy to Netlify
        uses: netlify/actions/cli@master
        with:
          args: deploy --prod
        env:
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
```

---

## Performance Optimization

### CDN Configuration

1. **Cloudflare**
   - Enable caching
   - Configure page rules
   - Enable Brotli compression
   - Use Polish for image optimization

2. **Cache Headers**
   ```nginx
   # Static assets
   location /static/ {
       expires 1y;
       add_header Cache-Control "public, immutable";
   }
   
   # HTML
   location / {
       expires -1;
       add_header Cache-Control "no-cache, no-store, must-revalidate";
   }
   ```

### Database Optimization

1. **Connection Pooling**
   - Use Supabase connection pooler
   - Configure max connections
   - Set connection timeout

2. **Query Optimization**
   - Add indexes for common queries
   - Use materialized views
   - Implement query caching

---

## Security Hardening

### Production Security Checklist

- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation on all forms
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF tokens implemented
- [ ] Secrets not in code
- [ ] Database backups encrypted
- [ ] Regular security audits

### Security Headers

```nginx
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co;" always;
```

---

## Support and Maintenance

### Regular Maintenance Tasks

**Daily**:
- Monitor error logs
- Check uptime
- Review user reports

**Weekly**:
- Review analytics
- Check performance metrics
- Update dependencies (security patches)

**Monthly**:
- Full security audit
- Performance optimization
- Database maintenance
- Backup verification

### Getting Help

- **Documentation**: Check this guide and other docs
- **Supabase Support**: https://supabase.com/support
- **Community**: Discord, GitHub Discussions
- **Professional Support**: Contact support@focus.app

---

*Last Updated: November 2025*

# Deployment Guide

This comprehensive guide covers deploying the Focus application to production.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Database Migrations](#database-migrations)
4. [Deployment Process](#deployment-process)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Rollback Procedure](#rollback-procedure)
7. [Monitoring](#monitoring)
8. [Troubleshooting](#troubleshooting)

## Pre-Deployment Checklist

Before deploying, ensure:

- [ ] All tests pass (`npm test`)
- [ ] Build completes successfully (`npm run build:prod`)
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] No uncommitted changes (or committed intentionally)
- [ ] Version number updated in `package.json`
- [ ] Release notes prepared
- [ ] Error tracking configured (Sentry)
- [ ] Analytics configured (GA4)
- [ ] SSL certificates valid
- [ ] Backup of current production database

## Environment Setup

### 1. Production Environment Variables

Create `.env.production`:

```bash
# Supabase
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key

# App Configuration
REACT_APP_ENV=production
REACT_APP_VERSION=0.1.0

# Error Tracking
REACT_APP_SENTRY_DSN=https://your-dsn@sentry.io/project-id

# Analytics
REACT_APP_ANALYTICS_ID=G-XXXXXXXXXX

# Build Configuration
GENERATE_SOURCEMAP=false
INLINE_RUNTIME_CHUNK=false
```

### 2. Verify Configuration

```bash
npm run check:env
```

## Database Migrations

### 1. Review Pending Migrations

```bash
npm run migrate:dry-run
```

This shows which migrations will be executed without actually running them.

### 2. Run Migrations

```bash
npm run migrate
```

### 3. Verify Migrations

Check Supabase dashboard to ensure:
- All tables created
- Indexes applied
- RLS policies active
- Functions deployed

## Deployment Process

### Automated Deployment (Recommended)

#### Using Netlify

```bash
# Deploy to Netlify
npm run deploy:netlify

# Or with options
npm run deploy:netlify -- --skip-tests --skip-tag
```

#### Using Vercel

```bash
# Deploy to Vercel
npm run deploy:vercel

# Or with options
npm run deploy:vercel -- --skip-tests --skip-tag
```

### Manual Deployment

#### Step 1: Pre-flight Checks

```bash
# Check environment
npm run check:env

# Run tests
npm test -- --run

# Check for uncommitted changes
git status
```

#### Step 2: Build Application

```bash
# Production build
npm run build:prod

# Analyze bundle size (optional)
npm run build:analyze
```

#### Step 3: Deploy

**Netlify:**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

**Vercel:**
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

#### Step 4: Create Release Tag

```bash
# Get version from package.json
VERSION=$(node -p "require('./package.json').version")

# Create and push tag
git tag -a v$VERSION -m "Release $VERSION"
git push origin v$VERSION
```

## Post-Deployment Verification

### 1. Smoke Tests

Visit your production URL and verify:

- [ ] Application loads without errors
- [ ] Login/signup works
- [ ] Home feed displays
- [ ] Post creation works
- [ ] Messaging works
- [ ] Profile loads correctly
- [ ] Settings accessible
- [ ] No console errors

### 2. Check Error Tracking

Open Sentry dashboard:
- [ ] No new errors
- [ ] Error rate normal
- [ ] Performance metrics acceptable

### 3. Check Analytics

Open GA4 dashboard:
- [ ] Events being tracked
- [ ] Page views recorded
- [ ] User sessions active

### 4. Performance Check

Run Lighthouse audit:
```bash
# Install Lighthouse
npm install -g lighthouse

# Run audit
lighthouse https://your-domain.com --view
```

Target scores:
- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90

### 5. Security Check

Test security headers:
```bash
curl -I https://your-domain.com
```

Verify headers:
- `Strict-Transport-Security`
- `X-Content-Type-Options`
- `X-Frame-Options`
- `X-XSS-Protection`

## Rollback Procedure

If issues are detected after deployment:

### Automated Rollback

```bash
# Rollback on Netlify
npm run rollback:netlify

# Rollback on Vercel
npm run rollback:vercel
```

The script will:
1. Show recent deployments
2. Ask which deployment to rollback to
3. Confirm the rollback
4. Execute the rollback

### Manual Rollback

**Netlify:**
```bash
# List deployments
netlify deploy:list

# Restore specific deployment
netlify deploy:restore <deployment-id>
```

**Vercel:**
```bash
# List deployments
vercel list

# Rollback to specific deployment
vercel rollback <deployment-url>
```

### Database Rollback

If database changes need to be reverted:

1. **Restore from backup:**
   ```bash
   # In Supabase dashboard:
   # Settings > Database > Backups > Restore
   ```

2. **Run rollback migration:**
   ```bash
   # If rollback migration exists
   npm run migrate -- --file migrations/XXX_rollback_feature.sql
   ```

## Monitoring

### Real-time Monitoring

**Error Tracking (Sentry):**
- Monitor error rate
- Check for new issues
- Review performance metrics
- Watch session replays

**Analytics (GA4):**
- Track active users
- Monitor conversion rates
- Check feature usage
- Review performance

**Supabase Dashboard:**
- Database performance
- API usage
- Storage usage
- Realtime connections

### Alerts

Set up alerts for:

1. **Error Rate:**
   - Alert when > 10 errors/minute
   - Alert on new error types

2. **Performance:**
   - Alert when response time > 3s
   - Alert when error rate > 5%

3. **Uptime:**
   - Alert when site is down
   - Alert on SSL certificate expiry

4. **Database:**
   - Alert on high CPU usage
   - Alert on connection pool exhaustion

## Troubleshooting

### Build Failures

**Issue:** Build fails with "out of memory"

**Solution:**
```bash
# Increase Node memory
NODE_OPTIONS=--max_old_space_size=4096 npm run build:prod
```

**Issue:** Build fails with missing dependencies

**Solution:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
npm run build:prod
```

### Deployment Failures

**Issue:** Deployment fails with "invalid environment variables"

**Solution:**
```bash
# Check environment variables
npm run check:env

# Update .env.production
# Redeploy
```

**Issue:** Deployment succeeds but site shows errors

**Solution:**
1. Check browser console for errors
2. Check Sentry for server errors
3. Verify environment variables in hosting platform
4. Check Supabase connection

### Database Issues

**Issue:** Migrations fail

**Solution:**
```bash
# Check migration syntax
# Run dry-run first
npm run migrate:dry-run

# Check Supabase logs
# Fix migration and retry
```

**Issue:** RLS policies blocking access

**Solution:**
1. Check Supabase logs
2. Verify user authentication
3. Review RLS policies
4. Test policies in SQL editor

### Performance Issues

**Issue:** Slow page loads

**Solution:**
1. Check bundle size: `npm run build:analyze`
2. Review Lighthouse report
3. Check CDN caching
4. Optimize images
5. Review database queries

**Issue:** High error rate

**Solution:**
1. Check Sentry dashboard
2. Identify error patterns
3. Review recent changes
4. Consider rollback if critical

## Best Practices

### 1. Deploy During Low Traffic

Schedule deployments during:
- Off-peak hours
- Weekdays (avoid Fridays)
- When team is available for monitoring

### 2. Gradual Rollout

For major changes:
1. Deploy to staging first
2. Test thoroughly
3. Deploy to production
4. Monitor closely
5. Gradually increase traffic

### 3. Communication

Before deployment:
- Notify team
- Update status page
- Prepare support team

After deployment:
- Announce completion
- Share release notes
- Monitor feedback

### 4. Documentation

Document:
- What was deployed
- When it was deployed
- Who deployed it
- Any issues encountered
- Rollback procedure used (if any)

### 5. Backup Strategy

Before deployment:
- Backup database
- Tag current version
- Document current state
- Prepare rollback plan

## Deployment Checklist

Use this checklist for each deployment:

### Pre-Deployment
- [ ] Tests passing
- [ ] Build successful
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Version updated
- [ ] Release notes prepared
- [ ] Team notified
- [ ] Backup created

### Deployment
- [ ] Pre-flight checks passed
- [ ] Migrations executed
- [ ] Application deployed
- [ ] Release tag created
- [ ] DNS updated (if needed)

### Post-Deployment
- [ ] Smoke tests passed
- [ ] Error tracking verified
- [ ] Analytics verified
- [ ] Performance acceptable
- [ ] Security headers present
- [ ] Team notified
- [ ] Documentation updated

### Monitoring (First 24 Hours)
- [ ] Error rate normal
- [ ] Performance metrics good
- [ ] User feedback positive
- [ ] No critical issues
- [ ] Analytics tracking correctly

## Support

For deployment issues:
1. Check this guide
2. Review platform documentation
3. Check error logs
4. Contact platform support
5. Escalate to team lead

## Resources

- [Netlify Documentation](https://docs.netlify.com/)
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Sentry Documentation](https://docs.sentry.io/)
- [GA4 Documentation](https://support.google.com/analytics/)

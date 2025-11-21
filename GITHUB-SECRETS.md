# GitHub Secrets Configuration

## Required Secrets for CI/CD

Go to your GitHub repository → Settings → Secrets and variables → Actions

### Add these secrets:

```
REACT_APP_SUPABASE_URL=https://nmhrtllprmonqqocwzvf.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
REACT_APP_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
NETLIFY_AUTH_TOKEN=your_netlify_token
VERCEL_TOKEN=your_vercel_token
```

### Optional Secrets:
```
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
REACT_APP_GITHUB_CLIENT_ID=your_github_client_id
```

## Setup Instructions:

1. **Sentry DSN**: Get from https://sentry.io → Project Settings → Client Keys
2. **Netlify Token**: Get from https://app.netlify.com → User settings → Applications
3. **Vercel Token**: Get from https://vercel.com → Settings → Tokens
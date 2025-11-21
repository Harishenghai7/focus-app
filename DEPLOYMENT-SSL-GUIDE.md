# HTTPS and SSL Configuration Guide

This guide covers setting up HTTPS and SSL certificates for the Focus application in production.

## Overview

The Focus application enforces HTTPS in production and uses secure cookies to protect user data. SSL/TLS certificates are automatically managed by the hosting platform (Netlify/Vercel).

## Automatic SSL (Recommended)

### Netlify

Netlify automatically provisions and renews SSL certificates for all sites:

1. **Custom Domain Setup:**
   ```bash
   # In Netlify dashboard:
   # 1. Go to Domain Settings
   # 2. Add custom domain
   # 3. Update DNS records as instructed
   # 4. SSL certificate will be auto-provisioned
   ```

2. **Force HTTPS:**
   - Already configured in `netlify.toml`
   - Automatic HTTP to HTTPS redirects
   - HSTS headers enabled

3. **Verify SSL:**
   ```bash
   # Check SSL certificate
   curl -I https://your-domain.com
   
   # Should see:
   # HTTP/2 200
   # strict-transport-security: max-age=31536000; includeSubDomains; preload
   ```

### Vercel

Vercel also provides automatic SSL:

1. **Custom Domain:**
   ```bash
   # In Vercel dashboard:
   # 1. Go to Project Settings > Domains
   # 2. Add domain
   # 3. Configure DNS
   # 4. SSL auto-provisioned
   ```

2. **HTTPS Enforcement:**
   - Automatic redirects from HTTP to HTTPS
   - Configured in `vercel.json`

## Security Headers

The following security headers are configured:

### Content Security Policy (CSP)
```
default-src 'self'
script-src 'self' 'unsafe-inline' 'unsafe-eval'
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com
img-src 'self' data: https: blob:
connect-src 'self' https://*.supabase.co wss://*.supabase.co
```

### Other Security Headers
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `X-XSS-Protection: 1; mode=block` - XSS protection
- `Strict-Transport-Security` - Forces HTTPS
- `Referrer-Policy: strict-origin-when-cross-origin` - Controls referrer info

## Secure Cookies

Cookies are configured with security flags in production:

```javascript
// Configured in src/config/security.js
{
  secure: true,        // Only sent over HTTPS
  sameSite: 'strict',  // CSRF protection
  httpOnly: false,     // Accessible to JS (for client-side auth)
  maxAge: 7 days
}
```

## HTTPS Enforcement

The application automatically redirects HTTP to HTTPS in production:

```javascript
// src/config/security.js
export const enforceHTTPS = () => {
  if (isProduction && window.location.protocol !== 'https:') {
    window.location.href = window.location.href.replace('http:', 'https:');
  }
};
```

## Testing SSL Configuration

### 1. SSL Labs Test
```bash
# Test SSL configuration
https://www.ssllabs.com/ssltest/analyze.html?d=your-domain.com
```

### 2. Security Headers Test
```bash
# Test security headers
https://securityheaders.com/?q=your-domain.com
```

### 3. Manual Testing
```bash
# Test HTTPS redirect
curl -I http://your-domain.com
# Should return 301/302 redirect to https://

# Test HSTS header
curl -I https://your-domain.com | grep -i strict-transport
# Should return: strict-transport-security: max-age=31536000

# Test secure cookies
# Open browser DevTools > Application > Cookies
# Verify 'Secure' and 'SameSite' flags are set
```

## Troubleshooting

### SSL Certificate Not Provisioning

**Netlify:**
```bash
# 1. Verify DNS records are correct
# 2. Wait up to 24 hours for DNS propagation
# 3. Check Netlify DNS settings
# 4. Contact Netlify support if issues persist
```

**Vercel:**
```bash
# 1. Verify domain configuration
# 2. Check DNS propagation: https://dnschecker.org
# 3. Regenerate certificate in Vercel dashboard
```

### Mixed Content Warnings

If you see mixed content warnings:

1. **Check External Resources:**
   ```javascript
   // Ensure all external resources use HTTPS
   // Bad: http://example.com/image.jpg
   // Good: https://example.com/image.jpg
   ```

2. **Update Supabase URLs:**
   ```bash
   # Verify .env.production has HTTPS URLs
   REACT_APP_SUPABASE_URL=https://your-project.supabase.co
   ```

3. **Check CSP:**
   ```javascript
   // Update CSP in public/index.html if needed
   // Add trusted domains to connect-src
   ```

### Cookie Not Being Set

1. **Check Domain:**
   ```javascript
   // Cookies must match domain
   // For subdomain.example.com, set domain=.example.com
   ```

2. **Verify HTTPS:**
   ```javascript
   // Secure cookies only work over HTTPS
   // Check window.location.protocol === 'https:'
   ```

3. **Check SameSite:**
   ```javascript
   // If using cross-origin requests, use 'none' with secure
   sameSite: 'none',
   secure: true
   ```

## Production Checklist

- [ ] Custom domain configured
- [ ] SSL certificate provisioned and valid
- [ ] HTTPS redirect working
- [ ] HSTS header present
- [ ] Security headers configured
- [ ] Secure cookies enabled
- [ ] CSP configured correctly
- [ ] No mixed content warnings
- [ ] SSL Labs grade A or higher
- [ ] Security headers score A or higher

## Additional Resources

- [Netlify SSL Documentation](https://docs.netlify.com/domains-https/https-ssl/)
- [Vercel SSL Documentation](https://vercel.com/docs/concepts/projects/custom-domains#ssl)
- [OWASP Secure Headers](https://owasp.org/www-project-secure-headers/)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [SSL Labs Best Practices](https://github.com/ssllabs/research/wiki/SSL-and-TLS-Deployment-Best-Practices)

## Support

For SSL/HTTPS issues:
1. Check hosting platform documentation
2. Verify DNS configuration
3. Test with SSL Labs and Security Headers
4. Contact hosting support if needed

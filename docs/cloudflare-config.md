# Cloudflare Configuration for Horropoly Payment System

## Overview
Cloudflare can enhance your payment system with:
- **DDoS Protection**: Protect against payment fraud attacks
- **SSL/TLS**: Secure HTTPS connections
- **Caching**: Improve performance for static assets
- **Rate Limiting**: Additional fraud prevention
- **Web Application Firewall (WAF)**: Block malicious requests

## Configuration Options

### Option 1: Cloudflare Pages (Recommended)
Deploy your frontend to Cloudflare Pages and backend to Render:

#### Frontend (Cloudflare Pages)
1. **Connect Repository**: Link your GitHub repo to Cloudflare Pages
2. **Build Settings**:
   - Build command: `npm run build` (if you have a build process)
   - Build output directory: `/` (or your build directory)
   - Root directory: `/` (if payment files are in root)

3. **Environment Variables** (if needed):
   ```
   BACKEND_URL=https://your-render-backend.onrender.com
   ```

4. **Custom Domain**: Connect your `horropoly.com` domain

#### Backend (Render)
- Keep your backend on Render as configured
- Update CORS to allow your Cloudflare Pages domain

### Option 2: Cloudflare Workers (Advanced)
Deploy the backend to Cloudflare Workers for better performance:

#### Worker Configuration
```javascript
// payment-worker.js
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // Handle payment verification
  if (url.pathname === '/api/verify-payment') {
    return handlePaymentVerification(request)
  }
  
  // Handle webhooks
  if (url.pathname === '/api/webhook') {
    return handleWebhook(request)
  }
  
  // Health check
  if (url.pathname === '/api/health') {
    return new Response(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      cloudflare: true
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  return new Response('Not Found', { status: 404 })
}

async function handlePaymentVerification(request) {
  // Implementation would go here
  // Note: Cloudflare Workers have limitations with Firebase Admin SDK
  // You might need to use Firebase REST API instead
}
```

### Option 3: Hybrid Setup (Best Performance)
- **Frontend**: Cloudflare Pages
- **Backend**: Render (for Firebase Admin SDK support)
- **CDN**: Cloudflare for static assets

## Cloudflare Settings

### 1. DNS Configuration
```
Type    Name                    Content
A       horropoly.com           [Your server IP]
CNAME   www.horropoly.com       horropoly.com
CNAME   api.horropoly.com       your-render-backend.onrender.com
```

### 2. SSL/TLS Settings
- **Encryption mode**: Full (strict)
- **Minimum TLS Version**: 1.2
- **Opportunistic Encryption**: On
- **TLS 1.3**: On

### 3. Security Settings
- **Security Level**: Medium
- **Browser Integrity Check**: On
- **Challenge Passage**: 30 minutes
- **Always Use HTTPS**: On

### 4. Rate Limiting Rules
Create rate limiting rules for payment endpoints:

#### Rule 1: Payment Verification Rate Limit
```
Field: URI Path
Operator: equals
Value: /api/verify-payment
Action: Rate Limit
Rate: 10 requests per minute per IP
```

#### Rule 2: Webhook Rate Limit
```
Field: URI Path
Operator: equals
Value: /api/webhook
Action: Rate Limit
Rate: 100 requests per minute per IP
```

### 5. Page Rules
Create page rules for optimal performance:

#### Rule 1: Cache Static Assets
```
URL: horropoly.com/assets/*
Settings:
- Cache Level: Cache Everything
- Edge Cache TTL: 4 hours
- Browser Cache TTL: 1 hour
```

#### Rule 2: Bypass Cache for API
```
URL: horropoly.com/api/*
Settings:
- Cache Level: Bypass
- Always Online: Off
```

## Updated Payment System for Cloudflare

### Frontend Configuration
Update your payment system to work with Cloudflare:

```javascript
// In payment-system.js
const BACKEND_URL = 'https://api.horropoly.com' // or your Render URL

async function verifyPayment(sessionId) {
  const response = await fetch(`${BACKEND_URL}/api/verify-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'CF-Connecting-IP': 'true', // Get real IP through Cloudflare
    },
    body: JSON.stringify({
      sessionId: sessionId,
      deviceFingerprint: deviceFingerprint
    })
  });
  
  return response.json();
}
```

### Backend CORS Update
Update your Render backend to allow Cloudflare domains:

```javascript
// In enhanced-payment-backend.js
app.use(cors({
  origin: [
    'https://horropoly.com',
    'https://www.horropoly.com',
    'https://*.pages.dev', // Cloudflare Pages
    'http://localhost:3000', // Development
  ],
  credentials: true
}));
```

## Performance Optimizations

### 1. Asset Optimization
- Enable **Auto Minify** for JavaScript, CSS, and HTML
- Enable **Brotli** compression
- Use **Polish** for image optimization

### 2. Caching Strategy
```
Static Assets (images, sounds, tokens):
- Cache Level: Cache Everything
- Edge Cache TTL: 24 hours
- Browser Cache TTL: 1 week

Game Files (HTML, JS):
- Cache Level: Cache Everything
- Edge Cache TTL: 1 hour
- Browser Cache TTL: 1 hour

API Endpoints:
- Cache Level: Bypass
- Always Online: Off
```

### 3. Security Headers
Add security headers in Cloudflare:

```
Content-Security-Policy: default-src 'self' https://api.stripe.com https://buy.stripe.com; script-src 'self' 'unsafe-inline' https://www.gstatic.com; style-src 'self' 'unsafe-inline';
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

## Monitoring and Analytics

### 1. Cloudflare Analytics
- Monitor traffic patterns
- Track payment-related requests
- Monitor for DDoS attacks

### 2. Error Tracking
- Set up error notifications
- Monitor failed payment attempts
- Track API response times

### 3. Security Monitoring
- Monitor blocked requests
- Track rate limiting events
- Monitor for suspicious activity

## Cost Considerations

### Cloudflare Free Plan
- **Bandwidth**: Unlimited
- **Requests**: Unlimited
- **DDoS Protection**: Included
- **SSL**: Included
- **Rate Limiting**: 1,000 requests/day

### Cloudflare Pro Plan ($20/month)
- **Rate Limiting**: 10,000 requests/day
- **WAF**: Included
- **Priority Support**: Included
- **Advanced Analytics**: Included

## Deployment Checklist

### Cloudflare Setup
- [ ] Add domain to Cloudflare
- [ ] Update DNS records
- [ ] Configure SSL/TLS
- [ ] Set up rate limiting rules
- [ ] Configure page rules
- [ ] Set security headers

### Frontend Deployment
- [ ] Deploy to Cloudflare Pages
- [ ] Configure custom domain
- [ ] Set environment variables
- [ ] Test payment flow

### Backend Configuration
- [ ] Update CORS settings
- [ ] Test API endpoints
- [ ] Configure webhooks
- [ ] Monitor logs

### Testing
- [ ] Test payment flow end-to-end
- [ ] Verify rate limiting works
- [ ] Check security headers
- [ ] Monitor performance

## Benefits of Cloudflare Integration

1. **Performance**: Global CDN for faster loading
2. **Security**: DDoS protection and WAF
3. **Reliability**: 99.9% uptime guarantee
4. **Cost**: Free tier covers most needs
5. **Analytics**: Built-in monitoring and insights
6. **Scalability**: Handles traffic spikes automatically

This setup gives you enterprise-level performance and security for your payment system while keeping costs low! 
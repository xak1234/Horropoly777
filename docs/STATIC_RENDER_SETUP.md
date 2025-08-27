# Static Render + Backend Payment System Setup

## Your Current Setup
- **Frontend**: Static site on Render (horropoly.com)
- **Backend**: Need to deploy as separate service
- **Domain**: horropoly.com (static site)

## 🚀 Deployment Strategy

### Option 1: Separate Backend Service (Recommended)
```
Frontend: Static site on Render (horropoly.com)
Backend: New Render service (horropoly-payment-backend.onrender.com)
CDN: Cloudflare (optional)
```

### Option 2: Cloudflare Workers Backend
```
Frontend: Static site on Render (horropoly.com)
Backend: Cloudflare Workers
CDN: Cloudflare
```

## 📋 Step-by-Step Deployment

### 1. Deploy Backend Service

#### Create New Render Service
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `horropoly-payment-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

#### Set Environment Variables
In the new backend service, add these variables:
```
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
NODE_ENV=production
```

#### Deploy and Get URL
- Click "Create Web Service"
- Wait for deployment
- Copy the URL: `https://horropoly-payment-backend.onrender.com`

### 2. Update Frontend Code

#### Add Payment System to Your Static Site
1. Copy `payment-system.js` to your static site
2. Update your `index.html` to include the payment system:

```html
<!-- Add this to your index.html -->
<script type="module">
  import { initializePaymentSystem } from './payment-system.js';
  
  // Initialize the payment system
  const paymentSystem = initializePaymentSystem();
  
  // Check if user has already paid
  const hasPaid = localStorage.getItem('multiplayerPaid') === 'true';
  
  if (!hasPaid) {
    // Show paywall
    paymentSystem.showPaywall();
  } else {
    // Show multiplayer content
    document.getElementById('multiplayer-content').style.display = 'block';
  }
</script>
```

#### Update Backend URL (if needed)
The payment system is already configured to use:
```javascript
const response = await fetch('https://horropoly-payment-backend.onrender.com/api/verify-payment', {
```

### 3. Configure Stripe Webhook
1. Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://horropoly-payment-backend.onrender.com/api/webhook`
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copy the webhook secret to your backend environment variables

### 4. Test the System
1. Visit your static site: `https://horropoly.com`
2. Try the payment flow
3. Check backend logs in Render dashboard
4. Verify payments in Firebase Console

## 🔧 Configuration Files

### Backend Files to Deploy
- `enhanced-payment-backend.js` - Main backend code
- `package.json` - Dependencies
- `render.yaml` - Render configuration (optional)

### Frontend Files to Add
- `payment-system.js` - Payment system
- Update your existing `index.html`

## 🌐 DNS Configuration

### Current Setup
```
horropoly.com → Static site on Render
```

### After Backend Deployment
```
horropoly.com → Static site on Render
horropoly-payment-backend.onrender.com → Backend service
```

## 🔒 Security Considerations

### CORS Configuration
The backend is already configured to allow:
- `https://horropoly.com`
- `https://www.horropoly.com`
- Cloudflare domains (if you add Cloudflare later)

### Environment Variables
- Keep all sensitive keys in Render environment variables
- Never commit API keys to your repository
- Use different keys for test and production

## 📊 Monitoring

### Backend Monitoring
- View logs in Render dashboard
- Monitor API response times
- Check for errors in payment processing

### Frontend Monitoring
- Check browser console for errors
- Monitor payment success rates
- Track device fingerprinting

## 🚨 Troubleshooting

### Common Issues

#### Backend Not Responding
1. Check Render service status
2. Verify environment variables
3. Check logs for errors
4. Test health endpoint: `https://horropoly-payment-backend.onrender.com/api/health`

#### CORS Errors
1. Verify CORS configuration in backend
2. Check that frontend URL is in allowed origins
3. Ensure HTTPS is used on both frontend and backend

#### Payment Failures
1. Check Stripe webhook configuration
2. Verify Firebase service account
3. Check backend logs for errors
4. Test with Stripe test mode first

### Debug Commands
```bash
# Test backend health
curl https://horropoly-payment-backend.onrender.com/api/health

# Test payment stats
curl https://horropoly-payment-backend.onrender.com/api/payment-stats
```

## 💰 Cost Breakdown

### Render Services
- **Static Site**: Free (horropoly.com)
- **Backend Service**: Free tier (750 hours/month)
- **Total**: $0/month

### Other Services
- **Stripe**: ~£0.14 per £1.99 payment
- **Firebase**: ~$1-2/month for 1000 payments

## 🎯 Success Indicators

✅ **System Working** if:
- Health check returns: `{"status":"ok","firebase":true,"stripe":true}`
- Payment completes successfully
- Payment appears in Firebase Console
- Multiplayer unlocks after payment
- Device fingerprinting works

## 🚀 Next Steps

1. **Deploy the backend service** to Render
2. **Add payment system** to your static site
3. **Configure Stripe webhook**
4. **Test the complete flow**
5. **Monitor and optimize**

---

**🎉 You're ready to go!** This setup gives you a secure payment system that works perfectly with your static Render site while keeping costs minimal. 
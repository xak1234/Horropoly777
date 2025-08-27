# Stripe Webhook Setup Guide

## 🎯 Overview
This guide will help you set up Stripe webhooks to automatically detect payments and generate unlock codes.

## 📋 Prerequisites
- Stripe account with API access
- Backend deployed on Render (or similar service)
- Stripe CLI (optional, for testing)

## 🔧 Step 1: Get Your Webhook Endpoint URL

Your webhook endpoint will be:
```
https://your-render-app.onrender.com/api/webhook
```

Replace `your-render-app` with your actual Render app name.

## 🔑 Step 2: Configure Stripe Webhook

### Option A: Using Stripe Dashboard (Recommended)

1. **Login to Stripe Dashboard**
   - Go to https://dashboard.stripe.com
   - Navigate to **Developers** → **Webhooks**

2. **Add Endpoint**
   - Click **Add endpoint**
   - Enter your webhook URL: `https://your-render-app.onrender.com/api/webhook`
   - Select events to listen for:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`

3. **Get Webhook Secret**
   - After creating the webhook, click on it
   - Go to **Signing secret**
   - Click **Reveal** and copy the secret

### Option B: Using Stripe CLI (For Testing)

```bash
# Install Stripe CLI
# Windows: Download from https://github.com/stripe/stripe-cli/releases
# Mac: brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to your local backend (for testing)
stripe listen --forward-to localhost:3001/api/webhook
```

## 🌍 Step 3: Set Environment Variables

Add these to your Render environment variables:

```bash
STRIPE_SECRET_KEY=sk_live_...  # Your Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_...  # Webhook signing secret from Step 2
ENCRYPTION_KEY=your-32-character-encryption-key-here
```

## 🧪 Step 4: Test the Webhook

### Test with Stripe CLI:
```bash
stripe trigger payment_intent.succeeded
```

### Test with Real Payment:
1. Make a test payment through your Stripe payment link
2. Check your backend logs for webhook events
3. Verify unlock code is generated

## 📊 Step 5: Monitor Webhook Events

### Check Webhook Status:
- Go to Stripe Dashboard → Developers → Webhooks
- Click on your webhook endpoint
- Check **Recent deliveries** for success/failure

### Backend Logs:
Your backend will log webhook events:
```
Webhook event received: payment_intent.succeeded
Payment succeeded: pi_1234567890abcdef
Generated unlock code ABC123 for payment pi_1234567890abcdef
```

## 🔍 Step 6: Troubleshooting

### Common Issues:

1. **Webhook Not Receiving Events**
   - Check webhook URL is correct
   - Verify webhook secret is set correctly
   - Check Render app is running

2. **Signature Verification Failed**
   - Ensure webhook secret matches Stripe dashboard
   - Check environment variable is set correctly

3. **Payment Not Detected**
   - Verify webhook events are being sent
   - Check backend logs for errors
   - Ensure payment was successful in Stripe

### Debug Commands:

```bash
# Check webhook status
curl -X GET https://your-render-app.onrender.com/health

# Check stored codes
curl -X GET https://your-render-app.onrender.com/api/codes

# Force save codes
curl -X POST https://your-render-app.onrender.com/api/force-save
```

## 🚀 Step 7: Production Deployment

1. **Update Webhook URL** to production URL
2. **Test with real payments** (small amounts)
3. **Monitor logs** for any issues
4. **Set up alerts** for webhook failures

## 📱 Frontend Integration

The frontend now includes:
- **Automatic polling** for payment status
- **Webhook-based detection** of payments
- **Fallback to manual verification**
- **Automatic multiplayer unlock** (codes hidden from customers)

## 🎉 Success Indicators

✅ Webhook receives `payment_intent.succeeded` events
✅ Unlock codes are generated automatically
✅ Frontend detects payments within 2-60 seconds
✅ Codes are encrypted and persisted
✅ Payment verification works reliably

## 📞 Support

If you encounter issues:
1. Check Stripe webhook dashboard for delivery status
2. Review backend logs for errors
3. Verify environment variables are set correctly
4. Test with Stripe CLI for local debugging  
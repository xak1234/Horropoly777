# Horropoly Payment Verification Setup Guide

## Overview
This system provides secure payment verification for Horropoly multiplayer access using Stripe and Firebase.

## Backend Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file with:
```
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
PORT=3001
```

### 3. Stripe Configuration
1. Go to your Stripe Dashboard
2. Get your Secret Key (starts with `sk_test_` or `sk_live_`)
3. Create a Webhook endpoint pointing to: `https://yourdomain.com/api/webhook`
4. Get the Webhook Secret (starts with `whsec_`)

### 4. Start the Server
```bash
npm start
```

## Frontend Integration

### 1. Update API URL
In `index.html`, update the API endpoint:
```javascript
const API_BASE_URL = 'https://your-backend-domain.com';
```

### 2. Firebase Configuration
Add your Firebase config in `index.html`:
```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};
```

## How It Works

### 1. Payment Flow
1. User clicks "Unlock Multiplayer"
2. Stripe payment page opens
3. User completes payment
4. Stripe webhook notifies backend
5. Backend verifies payment
6. QR code generated for unlock
7. User scans QR to unlock multiplayer

### 2. Security Features
- ✅ Real Stripe payment verification
- ✅ Webhook signature validation
- ✅ Firebase payment recording
- ✅ QR code device verification
- ✅ Session-based security
- ✅ No payment bypass possible

### 3. Production Checklist
- [ ] Deploy backend to production server
- [ ] Use production Stripe keys
- [ ] Configure production webhook URL
- [ ] Set up SSL certificates
- [ ] Test payment flow end-to-end
- [ ] Monitor webhook events
- [ ] Set up error logging

## API Endpoints

### POST /api/verify-payment
Verifies a Stripe session ID
```json
{
  "sessionId": "cs_test_..."
}
```

### POST /api/webhook
Receives Stripe webhook events
- `checkout.session.completed`
- `payment_intent.succeeded`

### GET /api/health
Health check endpoint

## Troubleshooting

### Common Issues
1. **Webhook not receiving events**: Check webhook URL and secret
2. **Payment verification failing**: Verify Stripe keys
3. **CORS errors**: Ensure backend allows frontend domain
4. **Firebase errors**: Check Firebase configuration

### Debug Mode
Enable debug logging by setting:
```javascript
const DEBUG = true;
```

## Security Notes
- Never expose Stripe secret keys in frontend code
- Always verify webhook signatures
- Use HTTPS in production
- Implement rate limiting
- Monitor for suspicious activity 
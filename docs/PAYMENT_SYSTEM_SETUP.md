# Enhanced Payment System Setup Guide

## Overview

This enhanced payment system for Horropoly includes:
- 🔒 **Fraud Prevention**: Device fingerprinting and usage tracking
- 💳 **Stripe Integration**: Secure payment processing
- 🔥 **Firebase Integration**: Payment and device tracking
- 🛡️ **Security Features**: Rate limiting, session validation, device limits

## Features

### Fraud Prevention
- **Device Fingerprinting**: Unique device identification using canvas, WebGL, audio, and hardware data
- **Device Limits**: Maximum 3 devices per payment
- **Session Validation**: Prevents reuse of payment sessions
- **Rate Limiting**: Prevents rapid payment attempts
- **Payment Verification**: Backend validation of Stripe payments

### Payment Flow
1. User clicks "Unlock Multiplayer - £1.99"
2. Device fingerprint is generated
3. Stripe payment window opens
4. Payment is processed securely
5. Backend verifies payment with fraud checks
6. Payment is recorded in Firebase
7. Multiplayer access is unlocked

## Setup Instructions

### 1. Frontend Integration

#### Add the Payment System to your HTML
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

#### Update your existing payment code
Replace the existing payment verification functions in `index.html` with calls to the new payment system:

```javascript
// Replace existing payment functions with:
const paymentSystem = initializePaymentSystem();

// For payment verification
const verified = await paymentSystem.verifyPayment(sessionId);

// For payment recording
const recorded = await paymentSystem.recordPayment(userId, paymentData);
```

### 2. Backend Setup

#### Install Dependencies
```bash
npm install
```

#### Environment Variables
Create a `.env` file with the following variables:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Firebase Configuration
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"horropoly",...}

# Server Configuration
NODE_ENV=production
PORT=3001
```

#### Firebase Service Account Setup
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Copy the entire JSON content to the `FIREBASE_SERVICE_ACCOUNT` environment variable

#### Stripe Webhook Setup
1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-domain.com/api/webhook`
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copy the webhook secret to `STRIPE_WEBHOOK_SECRET`

### 3. Deployment

#### Local Development
```bash
npm run dev
```

#### Production Deployment
```bash
npm start
```

#### Render.com Deployment
1. Connect your GitHub repository
2. Set build command: `npm install`
3. Set start command: `npm start`
4. Add environment variables in Render dashboard

## API Endpoints

### Payment Verification
```
POST /api/verify-payment
Content-Type: application/json

{
  "sessionId": "cs_test_...",
  "deviceFingerprint": {
    "hash": "abc123...",
    "timestamp": 1234567890,
    "userAgent": "...",
    "screen": "1920x1080",
    "timezone": "Europe/London"
  }
}
```

### Health Check
```
GET /api/health
```

### Payment Statistics (Admin)
```
GET /api/payment-stats
```

## Security Features

### Device Fingerprinting
The system generates unique device fingerprints using:
- Canvas fingerprinting
- WebGL renderer information
- Audio context fingerprinting
- Hardware capabilities
- Screen resolution and color depth
- Browser capabilities
- Timezone and language settings

### Fraud Prevention Checks
1. **Session Reuse Prevention**: Each Stripe session can only be used once
2. **Device Limits**: Maximum 3 devices per payment
3. **Rate Limiting**: Maximum 5 payments per hour per email
4. **Payment Validation**: Verifies amount (£1.99) and currency (GBP)
5. **Device Tracking**: Records all devices that use each payment

### Data Storage
All payment and device data is stored in Firebase Firestore:
- `payments` collection: Payment records
- `paymentDevices` collection: Device usage tracking
- `paymentSessions` collection: Session validation
- `failedPayments` collection: Failed payment attempts

## Monitoring and Analytics

### Payment Statistics
Access payment statistics via the `/api/payment-stats` endpoint:
```json
{
  "totalPayments": 150,
  "totalRevenue": "£298.50",
  "uniqueDevices": 420,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Firebase Console
Monitor payments and devices in Firebase Console:
- Go to Firestore Database
- View collections: `payments`, `paymentDevices`, `paymentSessions`
- Set up alerts for unusual activity

### Stripe Dashboard
Monitor payments in Stripe Dashboard:
- View successful payments
- Monitor failed payments
- Check webhook delivery status

## Troubleshooting

### Common Issues

#### Payment Verification Fails
1. Check Stripe secret key is correct
2. Verify webhook endpoint is accessible
3. Check Firebase service account permissions
4. Review server logs for errors

#### Device Fingerprinting Issues
1. Ensure browser supports required APIs
2. Check for ad blockers that might interfere
3. Verify canvas and WebGL are enabled

#### Firebase Connection Issues
1. Verify service account JSON is correct
2. Check Firebase project permissions
3. Ensure Firestore is enabled in Firebase Console

### Debug Mode
Enable debug logging by setting:
```env
NODE_ENV=development
DEBUG=payment-system:*
```

## Cost Considerations

### Stripe Fees
- £1.99 payment: ~£0.14 processing fee
- Net revenue per payment: ~£1.85

### Firebase Costs
- Firestore: ~$0.18 per 100,000 reads
- Storage: ~$0.026 per GB
- Estimated cost for 1000 payments: ~$1-2/month

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review server logs
3. Verify environment variables
4. Test with Stripe test mode first

## Security Best Practices

1. **Never expose API keys** in client-side code
2. **Use HTTPS** in production
3. **Validate all inputs** on both client and server
4. **Monitor for unusual activity** in Firebase Console
5. **Regularly review** payment and device logs
6. **Keep dependencies updated**
7. **Use environment variables** for sensitive data 
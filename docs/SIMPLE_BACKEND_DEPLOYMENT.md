# Simple Payment Backend Deployment Guide

## Overview
This is a simplified payment backend that works without Stripe API dependencies. It handles manual payment verification and generates unlock codes.

## Files Needed
- `simple-payment-backend.js` - Main backend server
- `package.json` - Dependencies and scripts

## Deployment Steps

### 1. Create Render Account
- Go to [render.com](https://render.com)
- Sign up for a free account

### 2. Connect Your Repository
- Click "New +" → "Web Service"
- Connect your GitHub repository
- Select the repository containing the backend files

### 3. Configure the Web Service

**Name:** `horropoly-payment-backend`

**Environment:** `Node`

**Build Command:** `npm install`

**Start Command:** `npm start`

**Plan:** Free (or paid for better performance)

### 4. Deploy
- Click "Create Web Service"
- Render will automatically deploy your backend
- The service will be available at: `https://horropoly-payment-backend.onrender.com`

## Testing the Backend

### Health Check
```bash
curl https://horropoly-payment-backend.onrender.com/api/health
```

### Manual Verification Test
```bash
curl -X POST https://horropoly-payment-backend.onrender.com/api/verify-payment \
  -H "Content-Type: application/json" \
  -d '{"paymentIntentId":"manual_verification_test"}'
```

### Test in Browser
Open `test-backend-simple.html` in your browser to test all endpoints.

## How It Works

### Manual Verification
1. User clicks "I've Completed Payment" button
2. Frontend sends request to `/api/verify-payment`
3. Backend generates unique 6-digit unlock code
4. Code is returned to frontend and displayed to user

### Unlock Code Verification
1. User enters 6-digit code
2. Frontend sends code and device ID to `/api/verify-unlock-code`
3. Backend verifies code and marks it as used
4. Multiplayer is unlocked for that device

## Security Features
- **One-time use codes** - Each code can only be used once
- **Device tracking** - Prevents code sharing between devices
- **Unique code generation** - No duplicate codes possible
- **Manual verification** - No dependency on external payment APIs

## Advantages
- ✅ **No Stripe API dependency** - Works without external APIs
- ✅ **Simple deployment** - Minimal dependencies
- ✅ **Reliable operation** - No external service failures
- ✅ **Easy testing** - Can test without real payments
- ✅ **Fast response** - No external API calls

## Usage Flow
1. User pays via Stripe payment link
2. User clicks "I've Completed Payment" button
3. Backend generates unlock code
4. User enters code to unlock multiplayer
5. Code is marked as used for that device

This simplified backend should work reliably and handle the payment verification without any external API dependencies! 
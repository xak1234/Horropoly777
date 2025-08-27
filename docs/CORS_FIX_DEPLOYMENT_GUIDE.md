# CORS Fix Deployment Guide

## Problem
Your payment backend on Render is experiencing CORS (Cross-Origin Resource Sharing) issues:
- `Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource`
- `CORS header 'Access-Control-Allow-Origin' missing`
- Status code: 500

## Root Cause
1. **Restrictive CORS Configuration**: The backend was blocking requests from certain origins
2. **500 Server Error**: The backend was returning 500 errors instead of proper CORS headers
3. **Missing Error Handling**: The create-checkout-session endpoint wasn't handling errors properly

## Solution

### Option 1: Deploy the Fixed Enhanced Backend (Recommended)

1. **Update your Render deployment** to use the fixed `enhanced-payment-backend.js`:
   - The file has been updated with better CORS handling
   - Added proper error handling for the create-checkout-session endpoint
   - More permissive CORS configuration for development and production

2. **Environment Variables** - Make sure these are set in Render:
   ```
   STRIPE_SECRET_KEY=sk_test_... (your Stripe secret key)
   STRIPE_WEBHOOK_SECRET=whsec_... (your webhook secret)
   FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...} (your Firebase service account JSON)
   NODE_ENV=production
   ```

3. **Deploy to Render**:
   ```bash
   # In your Render dashboard:
   # 1. Go to your payment backend service
   # 2. Update the source code with the fixed enhanced-payment-backend.js
   # 3. Redeploy the service
   ```

### Option 2: Use the Simple Payment Backend (Alternative)

If the enhanced backend continues to have issues, you can switch to the simpler version:

1. **Update your Render deployment** to use `simple-payment-backend.js`
2. **Environment Variables** for simple backend:
   ```
   STRIPE_SECRET_KEY=sk_test_... (your Stripe secret key)
   STRIPE_WEBHOOK_SECRET=whsec_... (your webhook secret)
   ENCRYPTION_KEY=your-32-character-encryption-key-here
   NODE_ENV=production
   ```

### Option 3: Quick Test with Local Development

To test the fix locally:

1. **Install dependencies**:
   ```bash
   npm install express cors stripe firebase-admin
   ```

2. **Set environment variables**:
   ```bash
   export STRIPE_SECRET_KEY=sk_test_...
   export STRIPE_WEBHOOK_SECRET=whsec_...
   export NODE_ENV=development
   ```

3. **Run the backend**:
   ```bash
   node enhanced-payment-backend.js
   ```

4. **Test the endpoint**:
   ```bash
   curl -X POST http://localhost:3001/api/create-checkout-session \
     -H "Content-Type: application/json" \
     -H "Origin: https://horropoly.com" \
     -d '{"userId":"test-user","deviceFingerprint":"test-device"}'
   ```

## Key Changes Made

### Enhanced Backend (`enhanced-payment-backend.js`)
1. **More Permissive CORS**: Added support for Render domains and development environments
2. **Better Error Handling**: Added proper validation and error messages
3. **Explicit CORS Headers**: Added CORS headers to all responses
4. **Preflight Request Handling**: Added explicit OPTIONS request handling

### Simple Backend (`simple-payment-backend.js`)
1. **Added Missing Endpoint**: Added the `/api/create-checkout-session` endpoint
2. **CORS Configuration**: Updated with the same permissive CORS settings
3. **Error Handling**: Added proper error handling for the new endpoint

## Testing the Fix

1. **Check the backend health**:
   ```
   GET https://horropoly-payment-backend.onrender.com/health
   ```

2. **Test CORS preflight**:
   ```bash
   curl -X OPTIONS https://horropoly-payment-backend.onrender.com/api/create-checkout-session \
     -H "Origin: https://horropoly.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type"
   ```

3. **Test the actual endpoint**:
   ```bash
   curl -X POST https://horropoly-payment-backend.onrender.com/api/create-checkout-session \
     -H "Content-Type: application/json" \
     -H "Origin: https://horropoly.com" \
     -d '{"userId":"test-user","deviceFingerprint":"test-device"}'
   ```

## Expected Response

After the fix, you should see:
- **200 OK** status code
- **Proper CORS headers** in the response
- **JSON response** with `sessionId` and `url` fields
- **No CORS errors** in the browser console

## Troubleshooting

### If you still get CORS errors:
1. **Check Render logs** for any server errors
2. **Verify environment variables** are set correctly
3. **Test with a simple curl request** to isolate the issue
4. **Check if the service is actually running** on Render

### If you get 500 errors:
1. **Check Stripe configuration** - ensure `STRIPE_SECRET_KEY` is valid
2. **Check Firebase configuration** - ensure `FIREBASE_SERVICE_ACCOUNT` is valid
3. **Check Render logs** for specific error messages

### If the service won't start:
1. **Check package.json** - ensure all dependencies are listed
2. **Check the main file** - ensure it's set correctly in Render
3. **Check environment variables** - ensure all required vars are set

## Next Steps

1. **Deploy the fixed backend** to Render
2. **Test the payment flow** from your frontend
3. **Monitor the logs** for any remaining issues
4. **Update your frontend** if needed to handle the new response format

The key issue was that your backend was returning 500 errors instead of proper CORS headers, which caused the browser to block the requests. The fixes ensure that:
- CORS headers are always sent
- Errors are handled gracefully
- The service responds properly to preflight requests 
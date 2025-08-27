#!/bin/bash

# Payment System Deployment Script for Horropoly
# This script sets up the payment system with your Firebase service account

echo "🚀 Setting up Horropoly Payment System"
echo "Firebase Service Account: firebase-adminsdk-fbsvc@horropoly.iam.gserviceaccount.com"

# Check if we're in the right directory
if [ ! -f "enhanced-payment-backend.js" ]; then
    echo "❌ Error: enhanced-payment-backend.js not found"
    echo "Please run this script from the project root directory"
    exit 1
fi

echo "✅ Found required files"

# Create environment variables file for Render
cat > render-env-vars.txt << 'EOF'
# Copy these environment variables to your Render backend service:

STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"horropoly","private_key_id":"YOUR_PRIVATE_KEY_ID","private_key":"-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-fbsvc@horropoly.iam.gserviceaccount.com","client_id":"YOUR_CLIENT_ID","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40horropoly.iam.gserviceaccount.com"}
NODE_ENV=production
PORT=3001
EOF

echo "📝 Created render-env-vars.txt with environment variables template"

# Create a simple integration guide
cat > INTEGRATION_GUIDE.md << 'EOF'
# Horropoly Payment System Integration Guide

## Quick Setup

### 1. Get Your Firebase Service Account Key
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your "horropoly" project
3. Go to Project Settings → Service Accounts
4. Click "Generate new private key"
5. Download the JSON file
6. Copy the entire JSON content

### 2. Deploy Backend to Render
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `horropoly-payment-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

### 3. Set Environment Variables
Copy the variables from `render-env-vars.txt` and replace:
- `YOUR_PRIVATE_KEY_ID` with your actual private key ID
- `YOUR_PRIVATE_KEY_HERE` with your actual private key
- `YOUR_CLIENT_ID` with your actual client ID
- `sk_test_your_stripe_secret_key_here` with your Stripe secret key
- `whsec_your_webhook_secret_here` with your Stripe webhook secret

### 4. Add Payment System to Your Static Site
1. Copy `payment-system.js` to your static site files
2. Add this to your `index.html`:

```html
<script type="module">
  import { initializePaymentSystem } from './payment-system.js';
  
  const paymentSystem = initializePaymentSystem();
  
  const hasPaid = localStorage.getItem('multiplayerPaid') === 'true';
  
  if (!hasPaid) {
    paymentSystem.showPaywall();
  } else {
    document.getElementById('multiplayer-content').style.display = 'block';
  }
</script>
```

### 5. Configure Stripe Webhook
1. Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://horropoly-payment-backend.onrender.com/api/webhook`
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`

### 6. Test the System
1. Visit your site: `https://horropoly.com`
2. Try the payment flow
3. Check backend logs in Render
4. Verify payments in Firebase Console

## Files to Deploy

### Backend (Render Service):
- `enhanced-payment-backend.js`
- `package.json`

### Frontend (Static Site):
- `payment-system.js`

## Testing Commands
```bash
# Test backend health
curl https://horropoly-payment-backend.onrender.com/api/health

# Test payment stats
curl https://horropoly-payment-backend.onrender.com/api/payment-stats
```

## Success Indicators
✅ Backend health check returns: `{"status":"ok","firebase":true,"stripe":true}`
✅ Payment completes successfully
✅ Payment appears in Firebase Console
✅ Multiplayer unlocks after payment
✅ Device fingerprinting works
EOF

echo "📝 Created INTEGRATION_GUIDE.md"

# Create a test script
cat > test-payment-system.js << 'EOF'
// Test script for the payment system
const https = require('https');

function testBackend(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function runTests() {
  const backendUrl = 'https://horropoly-payment-backend.onrender.com';
  
  console.log('🧪 Testing Payment System...\n');
  
  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const health = await testBackend(`${backendUrl}/api/health`);
    console.log('✅ Health check:', health);
    
    // Test payment stats
    console.log('\n2. Testing payment stats...');
    const stats = await testBackend(`${backendUrl}/api/payment-stats`);
    console.log('✅ Payment stats:', stats);
    
    console.log('\n🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure your backend is deployed and running');
  }
}

runTests();
EOF

echo "📝 Created test-payment-system.js"

echo ""
echo "🎉 Setup complete! Here's what you need to do:"
echo ""
echo "1. 📋 Follow the INTEGRATION_GUIDE.md step by step"
echo "2. 🔑 Get your Firebase service account key from Firebase Console"
echo "3. 🚀 Deploy the backend to Render"
echo "4. 🔧 Add payment-system.js to your static site"
echo "5. 🧪 Test with test-payment-system.js"
echo ""
echo "📁 Files created:"
echo "  - render-env-vars.txt (environment variables template)"
echo "  - INTEGRATION_GUIDE.md (step-by-step guide)"
echo "  - test-payment-system.js (test script)"
echo ""
echo "🔥 Your Firebase service account: firebase-adminsdk-fbsvc@horropoly.iam.gserviceaccount.com"
echo ""
echo "Good luck with your deployment! 🚀" 
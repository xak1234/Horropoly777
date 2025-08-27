#!/bin/bash

# Render.com Deployment Script for Horropoly Payment Backend
# This script helps deploy the enhanced payment system to Render

echo "🚀 Deploying Horropoly Enhanced Payment System to Render.com"

# Check if we're in the right directory
if [ ! -f "enhanced-payment-backend.js" ]; then
    echo "❌ Error: enhanced-payment-backend.js not found"
    echo "Please run this script from the project root directory"
    exit 1
fi

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found"
    exit 1
fi

echo "✅ Found required files"

# Create .env.example file for reference
cat > .env.example << EOF
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Firebase Configuration (JSON string)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"horropoly",...}

# Server Configuration
NODE_ENV=production
PORT=3001
EOF

echo "📝 Created .env.example file"

# Create render.yaml for Render.com deployment
cat > render.yaml << EOF
services:
  - type: web
    name: horropoly-payment-backend
    env: node
    plan: free
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3001
      - key: STRIPE_SECRET_KEY
        sync: false
      - key: STRIPE_WEBHOOK_SECRET
        sync: false
      - key: FIREBASE_SERVICE_ACCOUNT
        sync: false
EOF

echo "📝 Created render.yaml configuration"

# Create a simple health check script
cat > health-check.js << EOF
// Health check script for Render
const http = require('http');

const options = {
  hostname: process.env.RENDER_EXTERNAL_URL || 'localhost',
  port: process.env.PORT || 3001,
  path: '/api/health',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  console.log(\`Health check status: \${res.statusCode}\`);
  if (res.statusCode === 200) {
    console.log('✅ Backend is healthy');
    process.exit(0);
  } else {
    console.log('❌ Backend health check failed');
    process.exit(1);
  }
});

req.on('error', (err) => {
  console.error('❌ Health check error:', err.message);
  process.exit(1);
});

req.on('timeout', () => {
  console.error('❌ Health check timeout');
  req.destroy();
  process.exit(1);
});

req.end();
EOF

echo "📝 Created health check script"

# Create deployment instructions
cat > RENDER_DEPLOYMENT.md << EOF
# Render.com Deployment Guide

## Quick Deploy to Render

### 1. Connect to GitHub
1. Go to [Render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select the repository containing this payment system

### 2. Configure the Service
- **Name**: horropoly-payment-backend
- **Environment**: Node
- **Build Command**: \`npm install\`
- **Start Command**: \`npm start\`
- **Plan**: Free (or paid for better performance)

### 3. Set Environment Variables
In the Render dashboard, add these environment variables:

#### Required Variables:
- \`STRIPE_SECRET_KEY\`: Your Stripe secret key (sk_test_... or sk_live_...)
- \`STRIPE_WEBHOOK_SECRET\`: Your Stripe webhook secret (whsec_...)
- \`FIREBASE_SERVICE_ACCOUNT\`: Your Firebase service account JSON (as a string)

#### Optional Variables:
- \`NODE_ENV\`: production
- \`PORT\`: 3001 (Render will override this)

### 4. Deploy
Click "Create Web Service" and wait for deployment to complete.

### 5. Get Your Backend URL
After deployment, Render will provide a URL like:
\`https://horropoly-payment-backend.onrender.com\`

### 6. Update Frontend
Update your frontend code to use the new backend URL:

\`\`\`javascript
// In payment-system.js, update the API URL:
const response = await fetch('https://horropoly-payment-backend.onrender.com/api/verify-payment', {
  // ... rest of the code
});
\`\`\`

### 7. Configure Stripe Webhook
1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: \`https://horropoly-payment-backend.onrender.com/api/webhook\`
3. Select events:
   - \`checkout.session.completed\`
   - \`payment_intent.succeeded\`
   - \`payment_intent.payment_failed\`
4. Copy the webhook secret to your Render environment variables

## Testing the Deployment

### Health Check
Visit: \`https://your-backend-url.onrender.com/api/health\`

Expected response:
\`\`\`json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "firebase": true,
  "stripe": true
}
\`\`\`

### Payment Statistics
Visit: \`https://your-backend-url.onrender.com/api/payment-stats\`

## Troubleshooting

### Common Issues:
1. **Build fails**: Check that all dependencies are in package.json
2. **Environment variables**: Ensure all required variables are set
3. **Firebase connection**: Verify service account JSON is correct
4. **Stripe connection**: Check API keys are valid

### Logs:
View logs in Render dashboard under your service → "Logs"

## Cost
- **Free tier**: 750 hours/month (enough for most use cases)
- **Paid tier**: $7/month for unlimited usage
EOF

echo "📝 Created deployment guide"

echo ""
echo "🎉 Setup complete! Next steps:"
echo ""
echo "1. 📚 Read RENDER_DEPLOYMENT.md for detailed instructions"
echo "2. 🔑 Set up your environment variables in Render"
echo "3. 🚀 Deploy to Render.com"
echo "4. 🔗 Update your frontend to use the new backend URL"
echo "5. 🧪 Test the payment system"
echo ""
echo "📁 Files created:"
echo "  - .env.example (environment variables template)"
echo "  - render.yaml (Render configuration)"
echo "  - health-check.js (health check script)"
echo "  - RENDER_DEPLOYMENT.md (deployment guide)"
echo ""
echo "Good luck with your deployment! 🚀" 
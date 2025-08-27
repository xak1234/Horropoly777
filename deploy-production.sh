#!/bin/bash

# Production Deployment Script for Horropoly
echo "🚀 Starting production deployment..."

# Check if we're in the right directory
if [ ! -f "index.html" ]; then
    echo "❌ Error: index.html not found. Please run this script from the HorropolyX directory."
    exit 1
fi

# Create production build directory
echo "📁 Creating production build..."
rm -rf production-build
mkdir production-build

# Copy production files
echo "📋 Copying production files..."
cp index.html production-build/
cp game.html production-build/
cp gamestart.html production-build/
cp firebase-init.js production-build/
cp game.js production-build/
cp game_utils.js production-build/
cp lobby.js production-build/
cp rooms.js production-build/
cp restart.js production-build/
cp simpler_turns.js production-build/
cp panzoom.min.js production-build/
cp positions_updated.json production-build/

# Copy assets directory
echo "🎨 Copying assets..."
cp -r assets production-build/

# Copy backend files
echo "🔧 Copying backend files..."
cp payment-verification.js production-build/
cp package.json production-build/
cp package-lock.json production-build/

# Copy documentation
echo "📚 Copying documentation..."
cp README.md production-build/
cp RENDER_DEPLOYMENT.md production-build/
cp TESTING_GUIDE.md production-build/

# Create production configuration
echo "⚙️ Creating production configuration..."
cat > production-build/production-config.js << 'EOF'
// Production Configuration for Horropoly
export const PRODUCTION_CONFIG = {
  firebase: {
    apiKey: "AIzaSyBwc9JDb49JYp1RBnT1cuw-qfcVQORqlsg",
    authDomain: "horropoly.firebaseapp.com",
    projectId: "horropoly",
    storageBucket: "horropoly.firebasestorage.app",
    messagingSenderId: "582020770053",
    appId: "1:582020770053:web:875b64a83ce557da01ef6c"
  },
  api: {
    baseUrl: 'https://horropoly.com',
    verifyPaymentEndpoint: '/api/verify-payment'
  },
  stripe: {
    paymentUrl: 'https://buy.stripe.com/fZu7sLfBa4Ju7Uz0Kvfbq0j'
  },
  features: {
    debugMode: false,
    testMode: false,
    enableConsoleLogs: false
  }
};
EOF

# Create .gitignore for production
echo "🚫 Creating .gitignore..."
cat > production-build/.gitignore << 'EOF'
node_modules/
.env
*.log
.DS_Store
.vscode/
*.tmp
EOF

echo "✅ Production build created in 'production-build' directory"
echo ""
echo "📋 Next steps:"
echo "1. Upload the contents of 'production-build' to your web server"
echo "2. Deploy the backend (payment-verification.js) to your server"
echo "3. Set up environment variables on your server:"
echo "   - STRIPE_SECRET_KEY"
echo "   - STRIPE_WEBHOOK_SECRET"
echo "4. Configure your domain (horropoly.com) to point to your server"
echo "5. Test the payment system in production"
echo ""
echo "🌐 Production URL: https://horropoly.com"
echo "🔧 Backend URL: https://horropoly.com/api/verify-payment" 
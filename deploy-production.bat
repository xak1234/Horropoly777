@echo off
REM Production Deployment Script for Horropoly (Windows)

echo 🚀 Starting production deployment...

REM Check if we're in the right directory
if not exist "index.html" (
    echo ❌ Error: index.html not found. Please run this script from the HorropolyX directory.
    pause
    exit /b 1
)

REM Create production build directory
echo 📁 Creating production build...
if exist "production-build" rmdir /s /q production-build
mkdir production-build

REM Copy production files
echo 📋 Copying production files...
copy index.html production-build\
copy game.html production-build\
copy gamestart.html production-build\
copy firebase-init.js production-build\
copy game.js production-build\
copy game_utils.js production-build\
copy lobby.js production-build\
copy rooms.js production-build\
copy restart.js production-build\
copy simpler_turns.js production-build\
copy panzoom.min.js production-build\
copy positions_updated.json production-build\

REM Copy assets directory
echo 🎨 Copying assets...
xcopy assets production-build\assets /E /I /Y

REM Copy backend files
echo 🔧 Copying backend files...
copy payment-verification.js production-build\
if exist package.json copy package.json production-build\
if exist package-lock.json copy package-lock.json production-build\

REM Copy documentation
echo 📚 Copying documentation...
copy README.md production-build\
copy RENDER_DEPLOYMENT.md production-build\
copy TESTING_GUIDE.md production-build\

REM Create production configuration
echo ⚙️ Creating production configuration...
(
echo // Production Configuration for Horropoly
echo export const PRODUCTION_CONFIG = {
echo   firebase: {
echo     apiKey: "AIzaSyBwc9JDb49JYp1RBnT1cuw-qfcVQORqlsg",
echo     authDomain: "horropoly.firebaseapp.com",
echo     projectId: "horropoly",
echo     storageBucket: "horropoly.firebasestorage.app",
echo     messagingSenderId: "582020770053",
echo     appId: "1:582020770053:web:875b64a83ce557da01ef6c"
echo   },
echo   api: {
echo     baseUrl: 'https://horropoly.com',
echo     verifyPaymentEndpoint: '/api/verify-payment'
echo   },
echo   stripe: {
echo     paymentUrl: 'https://buy.stripe.com/fZu7sLfBa4Ju7Uz0Kvfbq0j'
echo   },
echo   features: {
echo     debugMode: false,
echo     testMode: false,
echo     enableConsoleLogs: false
echo   }
echo };
) > production-build\production-config.js

REM Create .gitignore for production
echo 🚫 Creating .gitignore...
(
echo node_modules/
echo .env
echo *.log
echo .DS_Store
echo .vscode/
echo *.tmp
) > production-build\.gitignore

echo ✅ Production build created in 'production-build' directory
echo.
echo 📋 Next steps:
echo 1. Upload the contents of 'production-build' to your web server
echo 2. Deploy the backend (payment-verification.js) to your server
echo 3. Set up environment variables on your server:
echo    - STRIPE_SECRET_KEY
echo    - STRIPE_WEBHOOK_SECRET
echo 4. Configure your domain (horropoly.com) to point to your server
echo 5. Test the payment system in production
echo.
echo 🌐 Production URL: https://horropoly.com
echo 🔧 Backend URL: https://horropoly.com/api/verify-payment
echo.
pause 
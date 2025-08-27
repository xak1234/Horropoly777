# Agent Configuration for Horropoly

## Build/Test Commands
- **Start dev server**: `npm run dev` or `node server.js` (port 8080)
- **Start payment backend**: `npm start` or `node enhanced-payment-backend.js`
- **Run single test**: Open test files like `test-*.html` in browser with dev server running
- **Deploy production**: `./deploy-production.sh` or `deploy-production.bat`
- **Test Firebase**: Open `test-firebase.html` with server running

## Architecture Overview
- **Frontend**: Vanilla JS game client with Canvas rendering, ES6 modules
- **Backend**: Express.js payment server with Stripe integration  
- **Database**: Firebase Firestore for multiplayer game state and room management
- **Static Server**: Node.js HTTP server for serving game files
- **External APIs**: Stripe payments, Firebase Auth/Firestore
- **Key Files**: `game.js` (core logic), `firebase-init.js` (database), `enhanced-payment-backend.js` (payments)

## Code Style
- **Imports**: ES6 modules with explicit file extensions (`.js`)
- **Variables**: camelCase, descriptive names (`currentPlayerIndex`, `isMultiplayerGame`)
- **Constants**: UPPER_SNAKE_CASE for configuration (`PORT`, `USERS_FILE`)
- **Functions**: camelCase, async/await pattern for Firebase operations
- **Error Handling**: Try-catch blocks with console logging, graceful fallbacks
- **HTML Tests**: Standalone files with embedded CSS/JS for isolated feature testing
- **Firebase**: Real-time listeners with cleanup, document references with proper error handling
z
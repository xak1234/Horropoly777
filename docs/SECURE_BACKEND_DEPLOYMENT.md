# 🚀 Secure Backend Deployment Guide

## 📋 Overview

This guide explains how to deploy the new secure Horropoly backend that implements the pure reducer pattern with authoritative game state management.

## 🏗️ Architecture

```
Client → HTTP Intent → Backend Reducer → Firestore State → Client Listener
```

### **Key Components**
- **Express Backend**: Processes game intents with pure reducers
- **Firestore State**: Authoritative game state (read-only for clients)
- **Firestore Log**: Immutable action history
- **Client Intent System**: Submits intents and listens to state

## 🛠️ Setup Instructions

### **1. Backend Setup**

```bash
# Create backend directory
mkdir horropoly-backend
cd horropoly-backend

# Copy files
cp ../secure-game-backend.js ./
cp ../package-backend.json ./package.json

# Install dependencies
npm install
```

### **2. Firebase Service Account**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your `horropoly` project
3. Go to **Project Settings** → **Service Accounts**
4. Click **Generate New Private Key**
5. Save the JSON file securely

### **3. Environment Variables**

Create `.env` file:
```bash
# Firebase Service Account (JSON as string)
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"horropoly",...}'

# Server Configuration
PORT=8080
NODE_ENV=production

# CORS Origins (comma-separated)
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### **4. Deploy Firestore Rules**

Update your `firestore.rules` (already done):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Game rooms collection - NEW SECURE ARCHITECTURE
    match /gameRooms/{roomId} {
      // Authoritative game state - backend only
      match /state {
        allow read: if true;     // clients read state
        allow write: if false;   // only backend writes
      }
      
      // Log - authoritative move history
      match /log/{actionId} {
        allow read: if true;     // clients can read history
        allow write: if false;   // backend only
      }
    }
  }
}
```

Deploy rules:
```bash
firebase deploy --only firestore:rules
```

## 🌐 Deployment Options

### **Option 1: Render (Recommended)**

1. **Create `render.yaml`**:
```yaml
services:
  - type: web
    name: horropoly-backend
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: FIREBASE_SERVICE_ACCOUNT
        sync: false
      - key: NODE_ENV
        value: production
```

2. **Deploy to Render**:
```bash
# Connect your GitHub repo to Render
# Or use Render CLI
render deploy
```

### **Option 2: Railway**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### **Option 3: Google Cloud Run**

1. **Create `Dockerfile`**:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 8080
CMD ["npm", "start"]
```

2. **Deploy**:
```bash
# Build and deploy
gcloud run deploy horropoly-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### **Option 4: Heroku**

```bash
# Create Heroku app
heroku create horropoly-backend

# Set environment variables
heroku config:set FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'

# Deploy
git push heroku main
```

## 🔧 Client Integration

### **1. Update Client Code**

Replace direct Firestore writes with intent system:

```javascript
// OLD: Direct Firestore write
await updateDoc(gameRoomRef, {
  diceValues: { die1: 3, die2: 5 },
  currentTurn: nextTurn
});

// NEW: Intent submission
import GameIntentSystem from './client-intent-system.js';

const intentSystem = new GameIntentSystem('https://your-backend.render.com');
intentSystem.initialize(db, roomId);

// Submit intent
await intentSystem.rollDice(playerId);
```

### **2. State Listening**

```javascript
// Listen to authoritative state
intentSystem.onStateUpdate = (gameState) => {
  // Update your game UI
  updateGameBoard(gameState);
  updatePlayerInfo(gameState.players);
  updateDiceDisplay(gameState.diceValues);
};
```

### **3. Error Handling**

```javascript
try {
  await intentSystem.purchaseProperty(playerId, propertyId, price);
} catch (error) {
  showErrorMessage(`Purchase failed: ${error.message}`);
}
```

## 🧪 Testing

### **1. Local Testing**

```bash
# Start backend locally
npm run dev

# Test endpoints
curl -X POST http://localhost:8080/games/TEST123/intent \
  -H "Content-Type: application/json" \
  -d '{"type":"ROLL_DICE","playerId":"user_123","payload":{}}'

# Check state
curl http://localhost:8080/games/TEST123/state
```

### **2. Integration Testing**

1. **Test with 2 players**:
   - Player 1 rolls dice
   - Player 2 sees state update
   - Player 1 purchases property
   - Player 2 sees ownership change

2. **Test error cases**:
   - Invalid intents
   - Insufficient funds
   - Out-of-turn actions

### **3. Load Testing**

```bash
# Install artillery
npm install -g artillery

# Create test config
cat > load-test.yml << EOF
config:
  target: 'https://your-backend.render.com'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "Roll dice"
    requests:
      - post:
          url: "/games/LOAD_TEST/intent"
          json:
            type: "ROLL_DICE"
            playerId: "user_{{ \$randomNumber() }}"
            payload: {}
EOF

# Run load test
artillery run load-test.yml
```

## 📊 Monitoring

### **1. Backend Logs**

```javascript
// Add structured logging
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'game.log' })
  ]
});

// Log intents
logger.info('Intent processed', {
  type: intent.type,
  playerId: intent.playerId,
  roomId: roomId,
  duration: Date.now() - startTime
});
```

### **2. Health Checks**

```bash
# Check backend health
curl https://your-backend.render.com/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "service": "horropoly-game-backend"
}
```

### **3. Firebase Monitoring**

- Monitor Firestore usage in Firebase Console
- Set up alerts for high read/write counts
- Track rule evaluation metrics

## 🔒 Security Considerations

### **1. Rate Limiting**

```javascript
import rateLimit from 'express-rate-limit';

const gameRateLimit = rateLimit({
  windowMs: 1000, // 1 second
  max: 10, // 10 requests per second per IP
  message: 'Too many game actions, please slow down'
});

app.use('/games', gameRateLimit);
```

### **2. Input Validation**

```javascript
import Joi from 'joi';

const intentSchema = Joi.object({
  type: Joi.string().valid('ROLL_DICE', 'PURCHASE_PROPERTY', ...).required(),
  playerId: Joi.string().required(),
  payload: Joi.object().required()
});

// Validate before processing
const { error } = intentSchema.validate(intent);
if (error) {
  return res.status(400).json({ error: error.details[0].message });
}
```

### **3. CORS Configuration**

```javascript
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
```

## 🚀 Go Live Checklist

- [ ] Backend deployed and accessible
- [ ] Firestore rules deployed
- [ ] Environment variables set
- [ ] Health check endpoint working
- [ ] Client code updated to use intent system
- [ ] Error handling implemented
- [ ] Monitoring and logging set up
- [ ] Load testing completed
- [ ] Security measures in place

## 🆘 Troubleshooting

### **Common Issues**

1. **"Permission denied" errors**
   - Check Firestore rules are deployed
   - Verify Firebase service account permissions

2. **CORS errors**
   - Update CORS_ORIGINS environment variable
   - Check client domain matches allowed origins

3. **Intent processing failures**
   - Check backend logs for detailed errors
   - Verify game state structure matches expectations

4. **State not updating**
   - Confirm client is listening to correct Firestore path
   - Check if backend is writing to state collection

### **Debug Commands**

```bash
# Check backend logs
heroku logs --tail -a horropoly-backend

# Test specific intent
curl -X POST https://your-backend.render.com/games/DEBUG/intent \
  -H "Content-Type: application/json" \
  -d '{"type":"ROLL_DICE","playerId":"debug_user","payload":{}}'

# Check Firestore state
# Use Firebase Console or client-side debugging
```

This secure architecture provides a solid foundation for cheat-proof multiplayer gaming while maintaining real-time responsiveness!

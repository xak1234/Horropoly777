# 🎮 Game.js Integration Guide - Multiplayer Sync Fix

## 📋 Overview

This guide shows how to modify your existing `game.js` to use the new secure multiplayer sync system. The key changes are:

1. **Stop direct Firestore writes** to `/gameRooms/`
2. **Use intent system** to send actions to backend
3. **Subscribe to authoritative state** from `/gameRooms/{roomId}/state/snapshot`
4. **Add optimistic UI** for responsive gameplay

## 🔄 Step-by-Step Integration

### **Step 1: Import the New System**

Add to the top of your `game.js`:

```javascript
import { 
  sendIntent, 
  subscribeToState, 
  HorropolyIntents, 
  OptimisticUIManager 
} from './client-multiplayer-sync.js';
```

### **Step 2: Replace Direct Firestore Writes**

#### **OLD: Direct writes to gameRoomRef**
```javascript
// ❌ OLD - Direct Firestore write
await updateDoc(gameRoomRef, {
  diceValues: { die1: die1Value, die2: die2Value },
  currentTurn: nextTurn,
  players: updatedPlayers
});
```

#### **NEW: Intent-based actions**
```javascript
// ✅ NEW - Intent submission
const intents = new HorropolyIntents(currentRoomId, currentPlayer.userId);

// Roll dice
await intents.rollDice(die1Value + die2Value);

// End turn
await intents.endTurn();
```

### **Step 3: Update State Subscription**

#### **OLD: Direct gameRoomRef subscription**
```javascript
// ❌ OLD - Direct subscription
subscribeToGameState((gameState) => {
  updateGameUI(gameState);
});
```

#### **NEW: Authoritative state subscription**
```javascript
// ✅ NEW - Authoritative state subscription
const uiManager = new OptimisticUIManager();

const unsubscribe = subscribeToState(db, currentRoomId, (authoritativeState) => {
  const displayState = uiManager.reconcileWithAuthoritativeState(authoritativeState);
  updateGameUI(displayState);
});
```

### **Step 4: Add Optimistic Updates**

#### **Dice Rolling with Optimistic UI**
```javascript
async function rollDice() {
  const intentId = `roll_${Date.now()}`;
  
  // Show rolling animation immediately
  uiManager.addPendingIntent(intentId, 
    { type: "ROLL", playerId: currentPlayer.userId }, 
    (state) => ({ ...state, _isRolling: true })
  );
  
  updateGameUI(uiManager.getCurrentDisplayState());
  
  try {
    // Actual dice roll happens in backend
    await intents.rollDice();
  } catch (error) {
    showErrorMessage(`Dice roll failed: ${error.message}`);
    uiManager.pendingIntents.delete(intentId);
  }
}
```

#### **Property Purchase with Optimistic UI**
```javascript
async function purchaseProperty(propertyId, price) {
  const intentId = `purchase_${Date.now()}`;
  
  // Show purchase immediately
  uiManager.addPendingIntent(intentId,
    { type: "PURCHASE_PROPERTY", playerId: currentPlayer.userId },
    (state) => {
      const player = state.players.find(p => p.userId === currentPlayer.userId);
      if (player && player.money >= price) {
        return {
          ...state,
          players: state.players.map(p => 
            p.userId === currentPlayer.userId 
              ? { ...p, money: p.money - price, properties: [...(p.properties || []), propertyId] }
              : p
          ),
          properties: {
            ...state.properties,
            [propertyId]: { ...state.properties[propertyId], owner: currentPlayer.userId }
          }
        };
      }
      return state;
    }
  );
  
  updateGameUI(uiManager.getCurrentDisplayState());
  
  try {
    await intents.purchaseProperty(propertyId, price);
  } catch (error) {
    showErrorMessage(`Purchase failed: ${error.message}`);
    uiManager.pendingIntents.delete(intentId);
    updateGameUI(uiManager.getCurrentDisplayState());
  }
}
```

## 🔧 Specific Function Updates

### **Update rollDiceForPlayer()**

```javascript
// OLD VERSION
async function rollDiceForPlayer() {
  // ... dice rolling logic ...
  
  await updateDoc(gameRoomRef, {
    diceValues: { die1: die1Value, die2: die2Value },
    [`players.${currentPlayerIndex}.position`]: newPosition,
    lastDiceRoll: { die1: die1Value, die2: die2Value, total: diceTotal }
  });
}

// NEW VERSION
async function rollDiceForPlayer() {
  if (!currentPlayer || !intents) return;
  
  try {
    // Backend handles dice rolling and position calculation
    await intents.rollDice();
  } catch (error) {
    console.error("Dice roll failed:", error);
    showErrorMessage("Dice roll failed. Please try again.");
  }
}
```

### **Update purchasePropertyForPlayer()**

```javascript
// OLD VERSION
async function purchasePropertyForPlayer(propertyId, price) {
  // ... validation logic ...
  
  await updateDoc(gameRoomRef, {
    [`players.${playerIndex}.money`]: newMoney,
    [`players.${playerIndex}.properties`]: updatedProperties,
    [`properties.${propertyId}.owner`]: playerId
  });
}

// NEW VERSION
async function purchasePropertyForPlayer(propertyId, price) {
  if (!currentPlayer || !intents) return;
  
  try {
    await intents.purchaseProperty(propertyId, price);
  } catch (error) {
    console.error("Purchase failed:", error);
    showErrorMessage(`Purchase failed: ${error.message}`);
  }
}
```

### **Update developProperty()**

```javascript
// OLD VERSION
async function developProperty(propertyId, developmentType) {
  // ... validation and cost calculation ...
  
  await updateDoc(gameRoomRef, {
    [`players.${playerIndex}.money`]: newMoney,
    [`properties.${propertyId}.graveyards`]: newGraveyards,
    [`properties.${propertyId}.hasCrypt`]: hasCrypt
  });
}

// NEW VERSION
async function developProperty(propertyId, developmentType) {
  if (!currentPlayer || !intents) return;
  
  try {
    await intents.developProperty(propertyId, developmentType);
  } catch (error) {
    console.error("Development failed:", error);
    showErrorMessage(`Development failed: ${error.message}`);
  }
}
```

### **Update endTurn()**

```javascript
// OLD VERSION
async function endTurn() {
  const nextTurn = (currentTurn + 1) % players.length;
  
  await updateDoc(gameRoomRef, {
    currentTurn: nextTurn,
    lastDiceRoll: null
  });
}

// NEW VERSION
async function endTurn() {
  if (!currentPlayer || !intents) return;
  
  try {
    await intents.endTurn();
  } catch (error) {
    console.error("End turn failed:", error);
    showErrorMessage("Failed to end turn. Please try again.");
  }
}
```

## 🎯 Complete Integration Example

Here's how to modify your main game initialization:

```javascript
// Global variables
let intents = null;
let uiManager = null;
let stateUnsubscribe = null;

// Initialize the new multiplayer system
async function initializeMultiplayerSync(roomId, playerId) {
  console.log("🔄 Initializing multiplayer sync system...");
  
  // Create intent system
  intents = new HorropolyIntents(roomId, playerId);
  
  // Create optimistic UI manager
  uiManager = new OptimisticUIManager();
  
  // Subscribe to authoritative state
  stateUnsubscribe = subscribeToState(db, roomId, (authoritativeState) => {
    console.log("📡 Received authoritative state:", authoritativeState);
    
    // Reconcile with optimistic updates
    const displayState = uiManager.reconcileWithAuthoritativeState(authoritativeState);
    
    // Update game UI
    updateGameFromState(displayState);
  });
  
  console.log("✅ Multiplayer sync system initialized");
}

// Update your existing updateGameFromState function
function updateGameFromState(gameState) {
  // Update players
  if (gameState.players) {
    players = gameState.players;
    updatePlayerTokens();
    updatePlayerInfo();
  }
  
  // Update dice
  if (gameState.diceValues) {
    updateDiceDisplay(gameState.diceValues);
  }
  
  // Update current turn
  if (gameState.currentTurn !== undefined) {
    currentTurn = gameState.currentTurn;
    updateTurnIndicator();
  }
  
  // Update properties
  if (gameState.properties) {
    updatePropertyOwnership(gameState.properties);
  }
  
  // Handle optimistic states
  if (gameState._isRolling) {
    showRollingAnimation();
  }
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  if (stateUnsubscribe) {
    stateUnsubscribe();
  }
});
```

## 🚨 Important Notes

### **1. Remove All Direct Firestore Writes**
Search your code for these patterns and replace them:
- `updateDoc(gameRoomRef, ...)`
- `setDoc(gameRoomRef, ...)`
- `updateGameState(...)`
- `syncCompleteGameState(...)`

### **2. Error Handling**
Always wrap intent calls in try-catch blocks:
```javascript
try {
  await intents.rollDice();
} catch (error) {
  console.error("Action failed:", error);
  showErrorMessage(error.message);
}
```

### **3. Authentication Setup**
Since the new rules require authentication, you'll need to set up Firebase Auth:

```javascript
import { getAuth, signInAnonymously } from "firebase/auth";

const auth = getAuth();
await signInAnonymously(auth);
```

### **4. Backend URL Configuration**
Update the backend URL in `client-multiplayer-sync.js`:
```javascript
const BACKEND_URL = 'https://your-horropoly-backend.onrender.com';
```

## 🧪 Testing Checklist

- [ ] Dice rolling works and updates all players
- [ ] Property purchases are validated and synced
- [ ] Property development works correctly
- [ ] Turn progression works smoothly
- [ ] Error messages show for invalid actions
- [ ] Optimistic UI provides immediate feedback
- [ ] Multiple players can play simultaneously
- [ ] Disconnection/reconnection works properly

This integration will give you a secure, cheat-proof multiplayer experience with responsive UI! 🎮

# 🏗️ New Firestore Structure - Secure Game Architecture

## 📋 Overview

The new Firestore structure implements a secure client-server architecture using an "inbox pattern" that prevents clients from directly modifying game state while maintaining real-time multiplayer functionality.

## 🎯 Architecture Principles

### **1. Separation of Concerns**
- **Clients**: Read game state, submit move intents
- **Backend**: Process intents, update authoritative state
- **Security**: Firestore rules enforce read-only state access

### **2. Data Flow**
```
Client Intent → Inbox → Backend Processing → State Update → Client Reads New State
```

## 🗂️ New Collection Structure

### **gameRooms/{roomId}/state**
**Purpose**: Authoritative game state (read-only for clients)

**Security Rules**:
```javascript
match /state {
  allow read: if true;     // clients can read
  allow write: if false;   // only backend writes
}
```

**Data Structure**:
```javascript
{
  players: [...],           // Current player states
  currentTurn: 0,          // Whose turn it is
  gameStarted: true,       // Game status
  properties: {...},       // Property ownership
  diceValues: {die1: 3, die2: 5},
  lastUpdated: "2024-01-01T12:00:00Z",
  version: 1               // For optimistic updates
}
```

### **gameRooms/{roomId}/inbox/{intentId}**
**Purpose**: Client move intents (write-only for clients)

**Security Rules**:
```javascript
match /inbox/{intentId} {
  allow create: if true;        // players submit moves
  allow update, delete: if false; // backend processes
  allow read: if true;          // optional read-back
}
```

**Intent Structure**:
```javascript
{
  type: "ROLL_DICE",           // Intent type
  playerId: "user_123",        // Who submitted
  timestamp: "2024-01-01T12:00:00Z",
  data: {                      // Intent-specific data
    // varies by intent type
  },
  processed: false             // Backend processing flag
}
```

### **gameRooms/{roomId}/log/{actionId}**
**Purpose**: Authoritative move history (read-only for clients)

**Security Rules**:
```javascript
match /log/{actionId} {
  allow read: if true;      // clients can read history
  allow write: if false;    // only backend writes
}
```

**Log Entry Structure**:
```javascript
{
  action: "DICE_ROLLED",
  playerId: "user_123",
  timestamp: "2024-01-01T12:00:00Z",
  data: {
    diceValues: {die1: 3, die2: 5},
    newPosition: 8
  },
  gameStateVersion: 1
}
```

## 🎮 Intent Types

### **Game Flow Intents**
```javascript
// Roll dice
{
  type: "ROLL_DICE",
  playerId: "user_123",
  data: {}
}

// Move player
{
  type: "MOVE_PLAYER",
  playerId: "user_123",
  data: {
    steps: 8,
    targetSquare: "property_1"
  }
}

// End turn
{
  type: "END_TURN",
  playerId: "user_123",
  data: {}
}
```

### **Property Intents**
```javascript
// Purchase property
{
  type: "PURCHASE_PROPERTY",
  playerId: "user_123",
  data: {
    propertyId: "t5",
    price: 1200
  }
}

// Develop property
{
  type: "DEVELOP_PROPERTY",
  playerId: "user_123",
  data: {
    propertyId: "t5",
    developmentType: "graveyard" // or "crypt"
  }
}
```

### **Special Action Intents**
```javascript
// Use steal card
{
  type: "USE_STEAL_CARD",
  playerId: "user_123",
  data: {
    targetPlayerId: "user_456",
    amount: 500
  }
}

// Pay rent
{
  type: "PAY_RENT",
  playerId: "user_123",
  data: {
    propertyId: "t5",
    amount: 150,
    ownerId: "user_456"
  }
}
```

## 🔄 Data Flow Examples

### **1. Player Rolls Dice**

**Step 1**: Client submits intent
```javascript
await addDoc(collection(db, `gameRooms/${roomId}/inbox`), {
  type: "ROLL_DICE",
  playerId: currentPlayer.userId,
  timestamp: new Date().toISOString(),
  data: {},
  processed: false
});
```

**Step 2**: Backend processes intent
```javascript
// Backend service detects new intent
const diceResult = rollDice();
const newPosition = calculateNewPosition(currentPlayer, diceResult);

// Update game state
await updateDoc(doc(db, `gameRooms/${roomId}/state`), {
  diceValues: diceResult,
  [`players.${playerIndex}.position`]: newPosition,
  lastUpdated: new Date().toISOString(),
  version: increment(1)
});

// Log the action
await addDoc(collection(db, `gameRooms/${roomId}/log`), {
  action: "DICE_ROLLED",
  playerId: currentPlayer.userId,
  timestamp: new Date().toISOString(),
  data: { diceResult, newPosition }
});

// Mark intent as processed
await deleteDoc(intentDoc.ref);
```

**Step 3**: Client receives state update
```javascript
// Client's onSnapshot listener receives updated state
onSnapshot(doc(db, `gameRooms/${roomId}/state`), (doc) => {
  const newState = doc.data();
  updateGameUI(newState);
});
```

## 🛠️ Implementation Plan

### **Phase 1: Backend Service**
1. Create backend service to process intents
2. Implement intent handlers for each action type
3. Set up real-time intent processing
4. Add error handling and validation

### **Phase 2: Client Updates**
1. Update client code to submit intents instead of direct writes
2. Modify game state listeners to read from `/state`
3. Add intent submission functions
4. Update UI to show pending states

### **Phase 3: Migration**
1. Migrate existing games to new structure
2. Test multiplayer functionality
3. Deploy new security rules
4. Monitor for issues

## 🔧 Backend Service Structure

```javascript
// backend-game-processor.js
class GameProcessor {
  constructor() {
    this.intentHandlers = {
      'ROLL_DICE': this.handleRollDice.bind(this),
      'PURCHASE_PROPERTY': this.handlePurchaseProperty.bind(this),
      'DEVELOP_PROPERTY': this.handleDevelopProperty.bind(this),
      // ... more handlers
    };
  }

  async processIntent(roomId, intent) {
    const handler = this.intentHandlers[intent.type];
    if (!handler) {
      throw new Error(`Unknown intent type: ${intent.type}`);
    }

    // Get current game state
    const stateDoc = await getDoc(doc(db, `gameRooms/${roomId}/state`));
    const gameState = stateDoc.data();

    // Process the intent
    const result = await handler(gameState, intent);

    // Update game state
    await this.updateGameState(roomId, result.stateUpdates);

    // Log the action
    await this.logAction(roomId, result.logEntry);

    return result;
  }

  async handleRollDice(gameState, intent) {
    const diceResult = this.rollDice();
    const player = gameState.players.find(p => p.userId === intent.playerId);
    const newPosition = this.calculateNewPosition(player, diceResult);

    return {
      stateUpdates: {
        diceValues: diceResult,
        [`players.${player.index}.position`]: newPosition,
        lastUpdated: new Date().toISOString()
      },
      logEntry: {
        action: "DICE_ROLLED",
        playerId: intent.playerId,
        data: { diceResult, newPosition }
      }
    };
  }
}
```

## 🎯 Benefits

### **Security**
- ✅ Clients cannot directly modify game state
- ✅ All moves are validated by backend
- ✅ Prevents cheating and state corruption
- ✅ Audit trail of all actions

### **Reliability**
- ✅ Authoritative game state
- ✅ Consistent game rules enforcement
- ✅ Better error handling
- ✅ State recovery capabilities

### **Scalability**
- ✅ Backend can handle complex game logic
- ✅ Easy to add new features
- ✅ Better performance monitoring
- ✅ Horizontal scaling potential

## 🚀 Next Steps

1. **Create the backend service** (`backend-game-processor.js`)
2. **Update client code** to use intent pattern
3. **Test the new architecture** with multiplayer games
4. **Deploy security rules** to Firebase
5. **Monitor and optimize** performance

## 📞 Migration Strategy

### **Gradual Migration**
1. Keep old structure working alongside new
2. New games use new structure
3. Existing games continue with old structure
4. Gradually migrate active games

### **Testing**
1. Test with 2-player games first
2. Test all game actions (dice, purchase, develop)
3. Test edge cases (disconnections, errors)
4. Load test with multiple concurrent games

This new structure provides a solid foundation for secure, scalable multiplayer gaming while maintaining the real-time experience your players expect.

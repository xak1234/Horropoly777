// client-intent-system.js - Client-side intent submission system
import { getFirestore, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

class GameIntentSystem {
  constructor(backendUrl = 'http://localhost:8080') {
    this.backendUrl = backendUrl;
    this.db = null;
    this.currentRoomId = null;
    this.stateListener = null;
    this.pendingIntents = new Map(); // Track pending intents for optimistic updates
  }

  // Initialize with Firebase DB for state listening
  initialize(db, roomId) {
    this.db = db;
    this.currentRoomId = roomId;
    this.setupStateListener();
  }

  // Set up listener for authoritative game state
  setupStateListener() {
    if (!this.db || !this.currentRoomId) return;

    const stateRef = doc(this.db, `gameRooms/${this.currentRoomId}/state/snapshot`);
    
    this.stateListener = onSnapshot(stateRef, (doc) => {
      if (doc.exists()) {
        const gameState = doc.data();
        this.onStateUpdate(gameState);
        
        // Clear any resolved pending intents
        this.reconcilePendingIntents(gameState);
      }
    }, (error) => {
      console.error("❌ Error listening to game state:", error);
      this.onStateError(error);
    });

    console.log("✅ State listener setup for room:", this.currentRoomId);
  }

  // Submit intent to backend
  async submitIntent(type, payload = {}, playerId) {
    if (!this.currentRoomId) {
      throw new Error("No active room");
    }

    const intent = {
      type,
      playerId,
      payload,
      clientTime: Date.now(),
      intentId: this.generateIntentId()
    };

    console.log(`📤 Submitting intent: ${type}`, intent);

    try {
      // Add to pending intents for optimistic updates
      this.pendingIntents.set(intent.intentId, {
        intent,
        timestamp: Date.now(),
        status: 'pending'
      });

      // Submit to backend
      const response = await fetch(`${this.backendUrl}/games/${this.currentRoomId}/intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(intent)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Intent submission failed');
      }

      const result = await response.json();
      
      // Mark as submitted
      if (this.pendingIntents.has(intent.intentId)) {
        this.pendingIntents.get(intent.intentId).status = 'submitted';
      }

      console.log(`✅ Intent submitted: ${type}`, result);
      return result;

    } catch (error) {
      console.error(`❌ Error submitting intent ${type}:`, error);
      
      // Mark as failed
      if (this.pendingIntents.has(intent.intentId)) {
        this.pendingIntents.get(intent.intentId).status = 'failed';
        this.pendingIntents.get(intent.intentId).error = error.message;
      }

      throw error;
    }
  }

  // Game action methods
  async rollDice(playerId) {
    return this.submitIntent('ROLL_DICE', {}, playerId);
  }

  async movePlayer(playerId, newPosition, targetSquare) {
    return this.submitIntent('MOVE_PLAYER', {
      newPosition,
      targetSquare
    }, playerId);
  }

  async purchaseProperty(playerId, propertyId, price) {
    return this.submitIntent('PURCHASE_PROPERTY', {
      propertyId,
      price
    }, playerId);
  }

  async developProperty(playerId, propertyId, developmentType) {
    return this.submitIntent('DEVELOP_PROPERTY', {
      propertyId,
      developmentType // 'graveyard' or 'crypt'
    }, playerId);
  }

  async payRent(playerId, propertyId, amount, ownerId) {
    return this.submitIntent('PAY_RENT', {
      propertyId,
      amount,
      ownerId
    }, playerId);
  }

  async useStealCard(playerId, targetPlayerId, amount) {
    return this.submitIntent('USE_STEAL_CARD', {
      targetPlayerId,
      amount
    }, playerId);
  }

  async endTurn(playerId) {
    return this.submitIntent('END_TURN', {}, playerId);
  }

  async startGame(playerId) {
    return this.submitIntent('START_GAME', {}, playerId);
  }

  async joinGame(playerId, playerName) {
    return this.submitIntent('JOIN_GAME', {
      playerName,
      userId: playerId
    }, playerId);
  }

  // Get current game state directly from backend
  async getCurrentState() {
    if (!this.currentRoomId) {
      throw new Error("No active room");
    }

    try {
      const response = await fetch(`${this.backendUrl}/games/${this.currentRoomId}/state`);
      
      if (!response.ok) {
        throw new Error('Failed to get game state');
      }

      return await response.json();
    } catch (error) {
      console.error("❌ Error getting current state:", error);
      throw error;
    }
  }

  // Get game log
  async getGameLog() {
    if (!this.currentRoomId) {
      throw new Error("No active room");
    }

    try {
      const response = await fetch(`${this.backendUrl}/games/${this.currentRoomId}/log`);
      
      if (!response.ok) {
        throw new Error('Failed to get game log');
      }

      return await response.json();
    } catch (error) {
      console.error("❌ Error getting game log:", error);
      throw error;
    }
  }

  // Optimistic update prediction
  predictStateAfterIntent(currentState, intent) {
    // Simple optimistic predictions for immediate UI feedback
    const predicted = structuredClone(currentState);

    switch (intent.type) {
      case 'ROLL_DICE':
        // Can't predict dice roll, just show "rolling" state
        predicted._rolling = true;
        break;

      case 'PURCHASE_PROPERTY':
        const player = predicted.players.find(p => p.userId === intent.playerId);
        if (player && player.money >= intent.payload.price) {
          player.money -= intent.payload.price;
          player.properties = player.properties || [];
          player.properties.push(intent.payload.propertyId);
          predicted.properties = predicted.properties || {};
          predicted.properties[intent.payload.propertyId] = {
            ...predicted.properties[intent.payload.propertyId],
            owner: player.userId
          };
        }
        break;

      case 'END_TURN':
        predicted.currentTurn = (predicted.currentTurn + 1) % predicted.players.length;
        break;

      // Add more predictions as needed
    }

    predicted._optimistic = true;
    predicted._pendingIntent = intent.type;
    return predicted;
  }

  // Reconcile pending intents with authoritative state
  reconcilePendingIntents(authoritativeState) {
    const now = Date.now();
    const timeout = 10000; // 10 seconds

    // Clean up old/resolved intents
    for (const [intentId, pendingIntent] of this.pendingIntents.entries()) {
      // Remove old intents
      if (now - pendingIntent.timestamp > timeout) {
        console.log(`🧹 Cleaning up old intent: ${pendingIntent.intent.type}`);
        this.pendingIntents.delete(intentId);
        continue;
      }

      // Check if intent was processed (version increased)
      if (authoritativeState.version > pendingIntent.lastKnownVersion) {
        console.log(`✅ Intent resolved: ${pendingIntent.intent.type}`);
        this.pendingIntents.delete(intentId);
      }
    }
  }

  // Generate unique intent ID
  generateIntentId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Event handlers (override these)
  onStateUpdate(gameState) {
    console.log("📡 Game state updated:", gameState.version);
    // Override this method to handle state updates in your game
  }

  onStateError(error) {
    console.error("📡 Game state error:", error);
    // Override this method to handle state errors
  }

  // Cleanup
  disconnect() {
    if (this.stateListener) {
      this.stateListener();
      this.stateListener = null;
    }
    this.pendingIntents.clear();
    console.log("🔌 Disconnected from game state");
  }
}

// Export for use
export default GameIntentSystem;

// Usage example:
/*
const intentSystem = new GameIntentSystem('http://localhost:8080');

// Initialize with Firebase DB and room ID
intentSystem.initialize(db, 'ROOM123');

// Override state update handler
intentSystem.onStateUpdate = (gameState) => {
  updateGameUI(gameState);
};

// Submit intents
await intentSystem.rollDice('user_123');
await intentSystem.purchaseProperty('user_123', 't5', 1200);
await intentSystem.endTurn('user_123');
*/

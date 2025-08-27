// client-multiplayer-sync.js - EXACT SPEC IMPLEMENTATION
import { doc, onSnapshot, addDoc, collection } from "firebase/firestore";

// Backend URL - update this to your Render deployment
const BACKEND_URL = process.env.BACKEND_URL || 'https://your-app.onrender.com';

// Send intent to backend - EXACT SPEC IMPLEMENTATION
export async function sendIntent(roomId, intent) {
  console.log(`📤 Sending intent: ${intent.type} to room ${roomId}`);
  
  try {
    const response = await fetch(`${BACKEND_URL}/games/${roomId}/intent`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify(intent)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Intent submission failed');
    }

    const result = await response.json();
    console.log(`✅ Intent sent successfully: ${intent.type}`);
    return result;

  } catch (error) {
    console.error(`❌ Error sending intent ${intent.type}:`, error);
    throw error;
  }
}

// Subscribe to authoritative state - EXACT SPEC IMPLEMENTATION
export function subscribeToState(db, roomId, callback) {
  console.log(`📡 Subscribing to authoritative state for room: ${roomId}`);
  
  const stateRef = doc(db, "gameRooms", roomId, "state", "snapshot");
  
  return onSnapshot(stateRef, (docSnap) => {
    if (docSnap.exists()) {
      const state = docSnap.data();
      console.log(`📡 Received authoritative state update - version: ${state.version}`);
      callback(state);
    } else {
      console.warn(`⚠️ No state document found for room: ${roomId}`);
      // Initialize empty state
      callback({
        players: [],
        version: 0,
        gameStarted: false,
        currentTurn: 0,
        properties: {},
        diceValues: { die1: 0, die2: 0 }
      });
    }
  }, (error) => {
    console.error("❌ Error in state subscription:", error);
    // Handle authentication errors
    if (error.code === 'permission-denied') {
      console.error("🔒 Permission denied - check Firebase Auth setup");
    }
  });
}

// Horropoly-specific intent helpers
export class HorropolyIntents {
  constructor(roomId, playerId) {
    this.roomId = roomId;
    this.playerId = playerId;
  }

  // Roll dice
  async rollDice(steps) {
    return sendIntent(this.roomId, {
      playerId: this.playerId,
      type: "ROLL",
      payload: { steps }
    });
  }

  // End turn
  async endTurn() {
    return sendIntent(this.roomId, {
      playerId: this.playerId,
      type: "END_TURN",
      payload: {}
    });
  }

  // Purchase property
  async purchaseProperty(propertyId, price) {
    return sendIntent(this.roomId, {
      playerId: this.playerId,
      type: "PURCHASE_PROPERTY",
      payload: { propertyId, price }
    });
  }

  // Develop property
  async developProperty(propertyId, developmentType) {
    return sendIntent(this.roomId, {
      playerId: this.playerId,
      type: "DEVELOP_PROPERTY",
      payload: { propertyId, developmentType }
    });
  }

  // Pay rent
  async payRent(propertyId, amount, ownerId) {
    return sendIntent(this.roomId, {
      playerId: this.playerId,
      type: "PAY_RENT",
      payload: { propertyId, amount, ownerId }
    });
  }

  // Use steal card
  async useStealCard(targetPlayerId, amount) {
    return sendIntent(this.roomId, {
      playerId: this.playerId,
      type: "USE_STEAL_CARD",
      payload: { targetPlayerId, amount }
    });
  }

  // Start game
  async startGame() {
    return sendIntent(this.roomId, {
      playerId: this.playerId,
      type: "START_GAME",
      payload: {}
    });
  }

  // Join game
  async joinGame(playerName) {
    return sendIntent(this.roomId, {
      playerId: this.playerId,
      type: "JOIN_GAME",
      payload: { playerName, userId: this.playerId }
    });
  }
}

// Optimistic UI Manager
export class OptimisticUIManager {
  constructor() {
    this.pendingIntents = new Map();
    this.authoritativeState = null;
    this.optimisticState = null;
  }

  // Add pending intent for optimistic update
  addPendingIntent(intentId, intent, optimisticUpdater) {
    this.pendingIntents.set(intentId, {
      intent,
      optimisticUpdater,
      timestamp: Date.now()
    });

    // Apply optimistic update
    if (this.authoritativeState && optimisticUpdater) {
      this.optimisticState = optimisticUpdater(structuredClone(this.authoritativeState));
    }
  }

  // Reconcile with authoritative state
  reconcileWithAuthoritativeState(newAuthoritativeState) {
    this.authoritativeState = newAuthoritativeState;
    
    // Clear resolved intents (version increased means they were processed)
    const currentVersion = newAuthoritativeState.version || 0;
    
    for (const [intentId, pendingIntent] of this.pendingIntents.entries()) {
      // If version increased since intent was sent, it's likely been processed
      if (currentVersion > (pendingIntent.lastKnownVersion || 0)) {
        this.pendingIntents.delete(intentId);
      }
    }

    // If no pending intents, use authoritative state
    if (this.pendingIntents.size === 0) {
      this.optimisticState = null;
      return newAuthoritativeState;
    }

    // Otherwise, reapply pending optimistic updates
    let state = structuredClone(newAuthoritativeState);
    for (const [, pendingIntent] of this.pendingIntents.entries()) {
      if (pendingIntent.optimisticUpdater) {
        state = pendingIntent.optimisticUpdater(state);
      }
    }
    
    this.optimisticState = state;
    return state;
  }

  // Get current display state (optimistic or authoritative)
  getCurrentDisplayState() {
    return this.optimisticState || this.authoritativeState;
  }

  // Clean up old pending intents
  cleanupOldIntents(maxAge = 10000) { // 10 seconds
    const now = Date.now();
    for (const [intentId, pendingIntent] of this.pendingIntents.entries()) {
      if (now - pendingIntent.timestamp > maxAge) {
        console.log(`🧹 Cleaning up old pending intent: ${pendingIntent.intent.type}`);
        this.pendingIntents.delete(intentId);
      }
    }
  }
}

// Example usage as per spec
export function exampleUsage(db, roomId, playerId) {
  // Create intent helper
  const intents = new HorropolyIntents(roomId, playerId);
  
  // Create optimistic UI manager
  const uiManager = new OptimisticUIManager();
  
  // Subscribe to authoritative state
  const unsubscribe = subscribeToState(db, roomId, (authoritativeState) => {
    console.log("Authoritative state:", authoritativeState);
    
    // Reconcile with optimistic updates
    const displayState = uiManager.reconcileWithAuthoritativeState(authoritativeState);
    
    // Update your game UI with display state
    updateGameUI(displayState);
  });

  // Example: Roll dice with optimistic update
  async function rollDiceOptimistically() {
    const intentId = `roll_${Date.now()}`;
    
    // Add optimistic update
    uiManager.addPendingIntent(intentId, 
      { type: "ROLL", playerId }, 
      (state) => {
        // Optimistic prediction: show rolling animation
        return { ...state, _isRolling: true };
      }
    );
    
    // Update UI immediately with optimistic state
    updateGameUI(uiManager.getCurrentDisplayState());
    
    try {
      // Send actual intent
      await intents.rollDice(6); // Example: rolled 6
    } catch (error) {
      console.error("Roll failed:", error);
      // Remove failed optimistic update
      uiManager.pendingIntents.delete(intentId);
    }
  }

  // Example: Purchase property with optimistic update
  async function purchasePropertyOptimistically(propertyId, price) {
    const intentId = `purchase_${Date.now()}`;
    
    uiManager.addPendingIntent(intentId,
      { type: "PURCHASE_PROPERTY", playerId, payload: { propertyId, price } },
      (state) => {
        const player = state.players.find(p => p.userId === playerId);
        if (player && player.money >= price) {
          return {
            ...state,
            players: state.players.map(p => 
              p.userId === playerId 
                ? { ...p, money: p.money - price, properties: [...(p.properties || []), propertyId] }
                : p
            ),
            properties: {
              ...state.properties,
              [propertyId]: { ...state.properties[propertyId], owner: playerId }
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
      console.error("Purchase failed:", error);
      uiManager.pendingIntents.delete(intentId);
      updateGameUI(uiManager.getCurrentDisplayState());
    }
  }

  return {
    intents,
    uiManager,
    unsubscribe,
    rollDiceOptimistically,
    purchasePropertyOptimistically
  };
}

// Placeholder for game UI update function
function updateGameUI(gameState) {
  console.log("🎮 Updating game UI with state:", gameState);
  // Implement your actual UI update logic here
}

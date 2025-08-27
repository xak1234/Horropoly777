// backend-game-processor.js - Secure Game State Processor
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  updateDoc, 
  addDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  onSnapshot,
  increment,
  serverTimestamp
} from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBwc9JDb49JYp1RBnT1cuw-qfcVQORqlsg",
  authDomain: "horropoly.firebaseapp.com",
  projectId: "horropoly",
  storageBucket: "horropoly.firebasestorage.app",
  messagingSenderId: "582020770053",
  appId: "1:582020770053:web:875b64a83ce557da01ef6c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

class GameProcessor {
  constructor() {
    this.intentHandlers = {
      'ROLL_DICE': this.handleRollDice.bind(this),
      'MOVE_PLAYER': this.handleMovePlayer.bind(this),
      'PURCHASE_PROPERTY': this.handlePurchaseProperty.bind(this),
      'DEVELOP_PROPERTY': this.handleDevelopProperty.bind(this),
      'PAY_RENT': this.handlePayRent.bind(this),
      'USE_STEAL_CARD': this.handleUseStealCard.bind(this),
      'END_TURN': this.handleEndTurn.bind(this),
      'START_GAME': this.handleStartGame.bind(this),
      'JOIN_GAME': this.handleJoinGame.bind(this)
    };

    this.activeRooms = new Set();
    console.log('🎮 GameProcessor initialized');
  }

  // Start processing intents for a room
  async startProcessingRoom(roomId) {
    if (this.activeRooms.has(roomId)) {
      console.log(`⚠️ Room ${roomId} already being processed`);
      return;
    }

    this.activeRooms.add(roomId);
    console.log(`🎮 Starting intent processing for room: ${roomId}`);

    // Listen for new intents
    const inboxRef = collection(db, `gameRooms/${roomId}/inbox`);
    const unsubscribe = onSnapshot(inboxRef, async (snapshot) => {
      for (const change of snapshot.docChanges()) {
        if (change.type === 'added') {
          const intent = { id: change.doc.id, ...change.doc.data() };
          if (!intent.processed) {
            await this.processIntent(roomId, intent);
          }
        }
      }
    });

    return unsubscribe;
  }

  // Process a single intent
  async processIntent(roomId, intent) {
    console.log(`🔄 Processing intent: ${intent.type} for room ${roomId}`);
    
    try {
      // Get current game state
      const stateDoc = await getDoc(doc(db, `gameRooms/${roomId}/state`));
      if (!stateDoc.exists()) {
        throw new Error(`Game state not found for room ${roomId}`);
      }

      const gameState = stateDoc.data();
      
      // Validate intent
      if (!this.validateIntent(gameState, intent)) {
        throw new Error(`Invalid intent: ${intent.type}`);
      }

      // Get handler
      const handler = this.intentHandlers[intent.type];
      if (!handler) {
        throw new Error(`Unknown intent type: ${intent.type}`);
      }

      // Process the intent
      const result = await handler(gameState, intent);

      // Update game state
      if (result.stateUpdates) {
        await this.updateGameState(roomId, result.stateUpdates);
      }

      // Log the action
      if (result.logEntry) {
        await this.logAction(roomId, result.logEntry);
      }

      // Mark intent as processed (delete it)
      await deleteDoc(doc(db, `gameRooms/${roomId}/inbox/${intent.id}`));

      console.log(`✅ Intent processed: ${intent.type}`);

    } catch (error) {
      console.error(`❌ Error processing intent ${intent.type}:`, error);
      
      // Log the error
      await this.logAction(roomId, {
        action: "INTENT_ERROR",
        intentType: intent.type,
        playerId: intent.playerId,
        error: error.message,
        timestamp: new Date().toISOString()
      });

      // Mark intent as processed (delete it to prevent retry loops)
      await deleteDoc(doc(db, `gameRooms/${roomId}/inbox/${intent.id}`));
    }
  }

  // Validate intent against current game state
  validateIntent(gameState, intent) {
    // Basic validation
    if (!intent.playerId || !intent.type || !intent.timestamp) {
      return false;
    }

    // Find player
    const player = gameState.players?.find(p => p.userId === intent.playerId);
    if (!player) {
      console.warn(`Player ${intent.playerId} not found in game`);
      return false;
    }

    // Game-specific validation
    switch (intent.type) {
      case 'ROLL_DICE':
        // Only current player can roll dice
        return gameState.currentTurn === gameState.players.indexOf(player);
      
      case 'PURCHASE_PROPERTY':
        // Player must have enough money and property must be available
        const property = gameState.properties?.[intent.data.propertyId];
        return property && !property.owner && player.money >= intent.data.price;
      
      default:
        return true; // Allow other intents for now
    }
  }

  // Intent Handlers
  async handleRollDice(gameState, intent) {
    const player = gameState.players.find(p => p.userId === intent.playerId);
    const playerIndex = gameState.players.indexOf(player);

    // Roll dice
    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;
    const total = die1 + die2;
    const isDoubles = die1 === die2;

    // Calculate new position
    const newPosition = (player.position + total) % 40; // Assuming 40 squares
    
    // Check for passing GO
    const passedGo = newPosition < player.position;
    const moneyChange = passedGo ? 2000 : 0; // GO money

    return {
      stateUpdates: {
        diceValues: { die1, die2 },
        lastDiceRoll: { die1, die2, total, isDoubles },
        [`players.${playerIndex}.position`]: newPosition,
        [`players.${playerIndex}.money`]: player.money + moneyChange,
        [`players.${playerIndex}.consecutiveDoubles`]: isDoubles ? (player.consecutiveDoubles || 0) + 1 : 0,
        lastUpdated: serverTimestamp(),
        version: increment(1)
      },
      logEntry: {
        action: "DICE_ROLLED",
        playerId: intent.playerId,
        data: { 
          diceValues: { die1, die2 }, 
          total,
          isDoubles,
          newPosition,
          passedGo,
          moneyEarned: moneyChange
        }
      }
    };
  }

  async handleMovePlayer(gameState, intent) {
    const player = gameState.players.find(p => p.userId === intent.playerId);
    const playerIndex = gameState.players.indexOf(player);

    return {
      stateUpdates: {
        [`players.${playerIndex}.position`]: intent.data.newPosition,
        [`players.${playerIndex}.currentSquare`]: intent.data.targetSquare,
        lastUpdated: serverTimestamp(),
        version: increment(1)
      },
      logEntry: {
        action: "PLAYER_MOVED",
        playerId: intent.playerId,
        data: {
          fromPosition: player.position,
          toPosition: intent.data.newPosition,
          targetSquare: intent.data.targetSquare
        }
      }
    };
  }

  async handlePurchaseProperty(gameState, intent) {
    const player = gameState.players.find(p => p.userId === intent.playerId);
    const playerIndex = gameState.players.indexOf(player);
    const propertyId = intent.data.propertyId;
    const price = intent.data.price;

    // Validate purchase
    if (player.money < price) {
      throw new Error('Insufficient funds');
    }

    if (gameState.properties[propertyId]?.owner) {
      throw new Error('Property already owned');
    }

    return {
      stateUpdates: {
        [`players.${playerIndex}.money`]: player.money - price,
        [`players.${playerIndex}.properties`]: [...(player.properties || []), propertyId],
        [`properties.${propertyId}.owner`]: player.userId,
        lastUpdated: serverTimestamp(),
        version: increment(1)
      },
      logEntry: {
        action: "PROPERTY_PURCHASED",
        playerId: intent.playerId,
        data: {
          propertyId,
          price,
          newBalance: player.money - price
        }
      }
    };
  }

  async handleDevelopProperty(gameState, intent) {
    const player = gameState.players.find(p => p.userId === intent.playerId);
    const playerIndex = gameState.players.indexOf(player);
    const propertyId = intent.data.propertyId;
    const developmentType = intent.data.developmentType; // 'graveyard' or 'crypt'

    // Validate ownership
    if (gameState.properties[propertyId]?.owner !== player.userId) {
      throw new Error('Player does not own this property');
    }

    const developmentCost = developmentType === 'crypt' ? 1000 : 500; // Example costs

    if (player.money < developmentCost) {
      throw new Error('Insufficient funds for development');
    }

    const currentGraveyards = gameState.properties[propertyId]?.graveyards || 0;
    const hasCrypt = gameState.properties[propertyId]?.hasCrypt || false;

    let updates = {};
    
    if (developmentType === 'graveyard' && currentGraveyards < 4) {
      updates[`properties.${propertyId}.graveyards`] = currentGraveyards + 1;
    } else if (developmentType === 'crypt' && currentGraveyards === 4 && !hasCrypt) {
      updates[`properties.${propertyId}.hasCrypt`] = true;
    } else {
      throw new Error('Invalid development');
    }

    return {
      stateUpdates: {
        [`players.${playerIndex}.money`]: player.money - developmentCost,
        ...updates,
        lastUpdated: serverTimestamp(),
        version: increment(1)
      },
      logEntry: {
        action: "PROPERTY_DEVELOPED",
        playerId: intent.playerId,
        data: {
          propertyId,
          developmentType,
          cost: developmentCost,
          newBalance: player.money - developmentCost
        }
      }
    };
  }

  async handlePayRent(gameState, intent) {
    const player = gameState.players.find(p => p.userId === intent.playerId);
    const owner = gameState.players.find(p => p.userId === intent.data.ownerId);
    const playerIndex = gameState.players.indexOf(player);
    const ownerIndex = gameState.players.indexOf(owner);
    const amount = intent.data.amount;

    return {
      stateUpdates: {
        [`players.${playerIndex}.money`]: player.money - amount,
        [`players.${ownerIndex}.money`]: owner.money + amount,
        lastUpdated: serverTimestamp(),
        version: increment(1)
      },
      logEntry: {
        action: "RENT_PAID",
        playerId: intent.playerId,
        data: {
          propertyId: intent.data.propertyId,
          amount,
          ownerId: intent.data.ownerId,
          payerNewBalance: player.money - amount,
          ownerNewBalance: owner.money + amount
        }
      }
    };
  }

  async handleUseStealCard(gameState, intent) {
    const player = gameState.players.find(p => p.userId === intent.playerId);
    const target = gameState.players.find(p => p.userId === intent.data.targetPlayerId);
    const playerIndex = gameState.players.indexOf(player);
    const targetIndex = gameState.players.indexOf(target);
    const amount = Math.min(intent.data.amount, target.money);

    return {
      stateUpdates: {
        [`players.${playerIndex}.money`]: player.money + amount,
        [`players.${playerIndex}.stealCards`]: (player.stealCards || 0) - 1,
        [`players.${targetIndex}.money`]: target.money - amount,
        lastUpdated: serverTimestamp(),
        version: increment(1)
      },
      logEntry: {
        action: "STEAL_CARD_USED",
        playerId: intent.playerId,
        data: {
          targetPlayerId: intent.data.targetPlayerId,
          amountStolen: amount,
          playerNewBalance: player.money + amount,
          targetNewBalance: target.money - amount
        }
      }
    };
  }

  async handleEndTurn(gameState, intent) {
    const currentTurn = gameState.currentTurn || 0;
    const nextTurn = (currentTurn + 1) % gameState.players.length;

    return {
      stateUpdates: {
        currentTurn: nextTurn,
        lastDiceRoll: null,
        lastUpdated: serverTimestamp(),
        version: increment(1)
      },
      logEntry: {
        action: "TURN_ENDED",
        playerId: intent.playerId,
        data: {
          nextPlayerId: gameState.players[nextTurn]?.userId
        }
      }
    };
  }

  async handleStartGame(gameState, intent) {
    return {
      stateUpdates: {
        gameStarted: true,
        gameStartedAt: serverTimestamp(),
        currentTurn: 0,
        lastUpdated: serverTimestamp(),
        version: increment(1)
      },
      logEntry: {
        action: "GAME_STARTED",
        playerId: intent.playerId,
        data: {
          playerCount: gameState.players?.length || 0
        }
      }
    };
  }

  async handleJoinGame(gameState, intent) {
    // This would be handled differently, as it involves adding to the players array
    // For now, we'll just log it
    return {
      logEntry: {
        action: "PLAYER_JOINED",
        playerId: intent.playerId,
        data: {
          playerName: intent.data.playerName
        }
      }
    };
  }

  // Update game state
  async updateGameState(roomId, updates) {
    const stateRef = doc(db, `gameRooms/${roomId}/state`);
    await updateDoc(stateRef, updates);
    console.log(`📝 Game state updated for room ${roomId}`);
  }

  // Log action
  async logAction(roomId, logEntry) {
    const logRef = collection(db, `gameRooms/${roomId}/log`);
    await addDoc(logRef, {
      ...logEntry,
      timestamp: logEntry.timestamp || serverTimestamp(),
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });
    console.log(`📋 Action logged: ${logEntry.action}`);
  }

  // Stop processing a room
  stopProcessingRoom(roomId) {
    this.activeRooms.delete(roomId);
    console.log(`🛑 Stopped processing room: ${roomId}`);
  }
}

// Export for use
export default GameProcessor;

// If running as a standalone service
if (typeof window === 'undefined') {
  const processor = new GameProcessor();
  
  // Start processing all active rooms
  // In a real deployment, you'd discover active rooms from the database
  console.log('🚀 Backend Game Processor started');
  
  // Example: Start processing a specific room
  // processor.startProcessingRoom('EXAMPLE_ROOM_ID');
}

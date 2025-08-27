import express from "express";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import crypto from "crypto";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors()); // Enable CORS for client requests

// Init Firebase Admin
initializeApp({ 
  credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}'))
});
const db = getFirestore();

function hashState(state) {
  return crypto.createHash("sha256").update(JSON.stringify(state)).digest("hex");
}

// Pure reducer for Horropoly game logic
function reduce(prevState, intent, actionId) {
  const next = structuredClone(prevState);

  switch (intent.type) {
    case "ROLL_DICE":
      return handleRollDice(next, intent, actionId);
    
    case "MOVE_PLAYER":
      return handleMovePlayer(next, intent, actionId);
    
    case "PURCHASE_PROPERTY":
      return handlePurchaseProperty(next, intent, actionId);
    
    case "DEVELOP_PROPERTY":
      return handleDevelopProperty(next, intent, actionId);
    
    case "PAY_RENT":
      return handlePayRent(next, intent, actionId);
    
    case "USE_STEAL_CARD":
      return handleUseStealCard(next, intent, actionId);
    
    case "END_TURN":
      return handleEndTurn(next, intent, actionId);
    
    case "START_GAME":
      return handleStartGame(next, intent, actionId);
    
    case "JOIN_GAME":
      return handleJoinGame(next, intent, actionId);

    default:
      console.warn(`Unknown intent type: ${intent.type}`);
      break;
  }

  // Always update metadata
  next.version = (prevState.version || 0) + 1;
  next.lastAppliedId = actionId;
  next.hash = hashState(next);
  next.lastUpdated = new Date().toISOString();
  return next;
}

// Game Logic Handlers
function handleRollDice(state, intent, actionId) {
  const player = state.players.find(p => p.userId === intent.playerId);
  if (!player) throw new Error("Player not found");

  const playerIndex = state.players.indexOf(player);
  
  // Validate it's player's turn
  if (state.currentTurn !== playerIndex) {
    throw new Error("Not player's turn");
  }

  // Roll dice
  const die1 = Math.floor(Math.random() * 6) + 1;
  const die2 = Math.floor(Math.random() * 6) + 1;
  const total = die1 + die2;
  const isDoubles = die1 === die2;

  // Calculate new position
  const oldPosition = player.position || 0;
  const newPosition = (oldPosition + total) % 40;
  
  // Check for passing GO
  const passedGo = newPosition < oldPosition;
  const goMoney = passedGo ? 2000 : 0;

  // Update player
  player.position = newPosition;
  player.money = (player.money || 16500) + goMoney;
  player.consecutiveDoubles = isDoubles ? (player.consecutiveDoubles || 0) + 1 : 0;

  // Update game state
  state.diceValues = { die1, die2 };
  state.lastDiceRoll = { die1, die2, total, isDoubles };
  state.lastRollWasDoubles = isDoubles;

  // Handle jail for 3 consecutive doubles
  if (player.consecutiveDoubles >= 3) {
    player.inJail = true;
    player.position = 10; // Jail position
    player.consecutiveDoubles = 0;
  }

  return state;
}

function handleMovePlayer(state, intent, actionId) {
  const player = state.players.find(p => p.userId === intent.playerId);
  if (!player) throw new Error("Player not found");

  player.position = intent.payload.newPosition;
  player.currentSquare = intent.payload.targetSquare;

  return state;
}

function handlePurchaseProperty(state, intent, actionId) {
  const player = state.players.find(p => p.userId === intent.playerId);
  if (!player) throw new Error("Player not found");

  const { propertyId, price } = intent.payload;
  
  // Validate purchase
  if (player.money < price) {
    throw new Error("Insufficient funds");
  }

  if (state.properties[propertyId]?.owner) {
    throw new Error("Property already owned");
  }

  // Execute purchase
  player.money -= price;
  player.properties = player.properties || [];
  player.properties.push(propertyId);

  state.properties = state.properties || {};
  state.properties[propertyId] = {
    ...state.properties[propertyId],
    owner: player.userId
  };

  return state;
}

function handleDevelopProperty(state, intent, actionId) {
  const player = state.players.find(p => p.userId === intent.playerId);
  if (!player) throw new Error("Player not found");

  const { propertyId, developmentType } = intent.payload;
  
  // Validate ownership
  if (state.properties[propertyId]?.owner !== player.userId) {
    throw new Error("Player does not own this property");
  }

  const developmentCost = developmentType === 'crypt' ? 1000 : 500;
  
  if (player.money < developmentCost) {
    throw new Error("Insufficient funds for development");
  }

  const property = state.properties[propertyId];
  const currentGraveyards = property.graveyards || 0;
  const hasCrypt = property.hasCrypt || false;

  // Validate development rules
  if (developmentType === 'graveyard' && currentGraveyards >= 4) {
    throw new Error("Maximum graveyards reached");
  }
  
  if (developmentType === 'crypt' && (currentGraveyards < 4 || hasCrypt)) {
    throw new Error("Cannot build crypt");
  }

  // Execute development
  player.money -= developmentCost;
  
  if (developmentType === 'graveyard') {
    property.graveyards = currentGraveyards + 1;
  } else if (developmentType === 'crypt') {
    property.hasCrypt = true;
  }

  return state;
}

function handlePayRent(state, intent, actionId) {
  const player = state.players.find(p => p.userId === intent.playerId);
  const owner = state.players.find(p => p.userId === intent.payload.ownerId);
  
  if (!player || !owner) throw new Error("Player or owner not found");

  const amount = intent.payload.amount;
  
  if (player.money < amount) {
    throw new Error("Insufficient funds to pay rent");
  }

  player.money -= amount;
  owner.money += amount;

  return state;
}

function handleUseStealCard(state, intent, actionId) {
  const player = state.players.find(p => p.userId === intent.playerId);
  const target = state.players.find(p => p.userId === intent.payload.targetPlayerId);
  
  if (!player || !target) throw new Error("Player or target not found");

  if ((player.stealCards || 0) <= 0) {
    throw new Error("No steal cards available");
  }

  const amount = Math.min(intent.payload.amount, target.money);
  
  player.money += amount;
  player.stealCards = (player.stealCards || 0) - 1;
  target.money -= amount;

  return state;
}

function handleEndTurn(state, intent, actionId) {
  const currentTurn = state.currentTurn || 0;
  state.currentTurn = (currentTurn + 1) % state.players.length;
  state.lastDiceRoll = null;
  state.diceValues = { die1: 0, die2: 0 };

  return state;
}

function handleStartGame(state, intent, actionId) {
  state.gameStarted = true;
  state.gameStartedAt = new Date().toISOString();
  state.currentTurn = 0;

  return state;
}

function handleJoinGame(state, intent, actionId) {
  const { playerName, userId } = intent.payload;
  
  // Check if player already exists
  if (state.players.find(p => p.userId === userId)) {
    return state; // Player already in game
  }

  // Add new player
  const newPlayer = {
    name: playerName,
    userId: userId,
    isHost: state.players.length === 0,
    position: 0,
    currentSquare: 'go',
    money: 16500,
    properties: [],
    isAI: false,
    bankrupt: false,
    tokenIndex: state.players.length,
    tokenImage: `assets/images/t${state.players.length + 1}.png`,
    inJail: false,
    jailTurns: 0,
    consecutiveDoubles: 0,
    stealCards: 0,
    goPassCount: 0
  };

  state.players.push(newPlayer);
  state.maxPlayers = state.maxPlayers || 4;

  return state;
}

// Main intent processing endpoint
app.post("/games/:roomId/intent", async (req, res) => {
  const { roomId } = req.params;
  const intent = req.body;

  console.log(`🎮 Processing intent: ${intent.type} for room ${roomId}`);

  try {
    const roomRef = db.collection("gameRooms").doc(roomId);
    const stateRef = roomRef.collection("state").doc("snapshot");
    const logRef = roomRef.collection("log");

    await db.runTransaction(async tx => {
      const snap = await tx.get(stateRef);
      const prevState = snap.exists ? snap.data() : {
        players: [],
        version: 0,
        gameStarted: false,
        currentTurn: 0,
        properties: {},
        diceValues: { die1: 0, die2: 0 }
      };

      const actionId = (prevState.lastAppliedId || 0) + 1;
      const nextState = reduce(prevState, intent, actionId);

      // Write new state
      tx.set(stateRef, nextState);

      // Append log entry
      tx.set(logRef.doc(String(actionId)), {
        actionId,
        intent,
        prevHash: prevState.hash || null,
        nextHash: nextState.hash,
        timestamp: new Date().toISOString()
      });
    });

    console.log(`✅ Intent processed: ${intent.type}`);
    res.json({ ok: true });

  } catch (error) {
    console.error(`❌ Error processing intent ${intent.type}:`, error);
    res.status(400).json({ 
      error: error.message,
      intent: intent.type 
    });
  }
});

// Get current game state
app.get("/games/:roomId/state", async (req, res) => {
  const { roomId } = req.params;

  try {
    const stateRef = db.collection("gameRooms").doc(roomId).collection("state").doc("snapshot");
    const snap = await stateRef.get();

    if (!snap.exists) {
      return res.status(404).json({ error: "Game not found" });
    }

    res.json(snap.data());
  } catch (error) {
    console.error("Error getting game state:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get game log
app.get("/games/:roomId/log", async (req, res) => {
  const { roomId } = req.params;

  try {
    const logRef = db.collection("gameRooms").doc(roomId).collection("log");
    const snapshot = await logRef.orderBy("actionId").get();

    const log = snapshot.docs.map(doc => doc.data());
    res.json(log);
  } catch (error) {
    console.error("Error getting game log:", error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    service: "horropoly-game-backend"
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Horropoly Game Backend running on port ${PORT}`);
  console.log(`📡 Ready to process game intents`);
});

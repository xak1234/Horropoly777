import express from "express";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import crypto from "crypto";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

// Initialize Firebase Admin
initializeApp({ 
  credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
});
const db = getFirestore();

function hashState(state) {
  return crypto.createHash("sha256").update(JSON.stringify(state)).digest("hex");
}

// Pure reducer for Horropoly game logic - EXACT SPEC IMPLEMENTATION
function reduce(prevState, intent, actionId) {
  const next = structuredClone(prevState);

  switch (intent.type) {
    case "ROLL":
      const steps = intent.payload.steps || 0;
      const player = next.players.find(p => p.userId === intent.playerId);
      if (player) {
        player.position = (player.position + steps) % 40;
        next.lastDiceRoll = steps;
      }
      break;

    case "END_TURN":
      next.currentTurn = (next.currentTurn + 1) % next.players.length;
      break;

    // Extended Horropoly-specific actions
    case "PURCHASE_PROPERTY":
      const purchasePlayer = next.players.find(p => p.userId === intent.playerId);
      const { propertyId, price } = intent.payload;
      
      if (purchasePlayer && purchasePlayer.money >= price) {
        // Check if property is available
        if (!next.properties[propertyId]?.owner) {
          purchasePlayer.money -= price;
          purchasePlayer.properties = purchasePlayer.properties || [];
          purchasePlayer.properties.push(propertyId);
          
          next.properties = next.properties || {};
          next.properties[propertyId] = {
            ...next.properties[propertyId],
            owner: purchasePlayer.userId
          };
        }
      }
      break;

    case "DEVELOP_PROPERTY":
      const devPlayer = next.players.find(p => p.userId === intent.playerId);
      const { propertyId: devPropertyId, developmentType } = intent.payload;
      
      if (devPlayer && next.properties[devPropertyId]?.owner === devPlayer.userId) {
        const developmentCost = developmentType === 'crypt' ? 1000 : 500;
        
        if (devPlayer.money >= developmentCost) {
          devPlayer.money -= developmentCost;
          
          const property = next.properties[devPropertyId];
          if (developmentType === 'graveyard' && (property.graveyards || 0) < 4) {
            property.graveyards = (property.graveyards || 0) + 1;
          } else if (developmentType === 'crypt' && (property.graveyards || 0) === 4 && !property.hasCrypt) {
            property.hasCrypt = true;
          }
        }
      }
      break;

    case "PAY_RENT":
      const payer = next.players.find(p => p.userId === intent.playerId);
      const receiver = next.players.find(p => p.userId === intent.payload.ownerId);
      const rentAmount = intent.payload.amount;
      
      if (payer && receiver && payer.money >= rentAmount) {
        payer.money -= rentAmount;
        receiver.money += rentAmount;
      }
      break;

    case "USE_STEAL_CARD":
      const stealer = next.players.find(p => p.userId === intent.playerId);
      const victim = next.players.find(p => p.userId === intent.payload.targetPlayerId);
      const stealAmount = intent.payload.amount;
      
      if (stealer && victim && (stealer.stealCards || 0) > 0) {
        const actualSteal = Math.min(stealAmount, victim.money);
        stealer.money += actualSteal;
        stealer.stealCards = (stealer.stealCards || 0) - 1;
        victim.money -= actualSteal;
      }
      break;

    case "START_GAME":
      next.gameStarted = true;
      next.gameStartedAt = new Date().toISOString();
      next.currentTurn = 0;
      break;

    case "JOIN_GAME":
      const { playerName, userId } = intent.payload;
      
      // Check if player already exists
      if (!next.players.find(p => p.userId === userId)) {
        const newPlayer = {
          name: playerName,
          userId: userId,
          isHost: next.players.length === 0,
          position: 0,
          currentSquare: 'go',
          money: 16500,
          properties: [],
          isAI: false,
          bankrupt: false,
          tokenIndex: next.players.length,
          tokenImage: `assets/images/t${next.players.length + 1}.png`,
          inJail: false,
          jailTurns: 0,
          consecutiveDoubles: 0,
          stealCards: 0,
          goPassCount: 0
        };
        
        next.players.push(newPlayer);
        next.maxPlayers = next.maxPlayers || 4;
      }
      break;

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

// Main intent processing endpoint - EXACT SPEC IMPLEMENTATION
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
        diceValues: { die1: 0, die2: 0 },
        lastDiceRoll: null
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

// Health check endpoints (both /health and /api/health for compatibility)
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    service: "horropoly-multiplayer-sync-backend",
    version: "1.0.0"
  });
});

app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    service: "horropoly-multiplayer-sync-backend",
    version: "1.0.0"
  });
});

// Room status endpoint for smart join system
app.get("/api/room/:collection/:roomId/status", async (req, res) => {
  const { collection, roomId } = req.params;
  
  try {
    const roomRef = db.collection(collection).doc(roomId);
    const snap = await roomRef.get();
    
    if (!snap.exists) {
      return res.status(404).json({ error: "Room not found" });
    }
    
    const roomData = snap.data();
    res.json({
      id: roomId,
      ...roomData,
      exists: true,
      collection: collection
    });
    
  } catch (error) {
    console.error(`Error getting room status for ${collection}/${roomId}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Get optimized joinable rooms
app.get("/api/rooms/joinable", async (req, res) => {
  try {
    const RECENT_MS = 1000 * 60 * 30; // 30 minutes
    const minTimestamp = new Date(Date.now() - RECENT_MS);
    
    // Query both collections for joinable rooms
    const collections = ['rooms', 'gameRooms'];
    const allRooms = [];
    
    for (const collectionName of collections) {
      const roomsRef = db.collection(collectionName);
      
      // Optimized query for recent, open, non-started rooms
      const query = roomsRef
        .where('gameStarted', '==', false)
        .where('isOpen', '==', true)
        .where('lastUpdated', '>=', minTimestamp.toISOString())
        .orderBy('lastUpdated', 'desc')
        .limit(20);
      
      const snapshot = await query.get();
      
      snapshot.forEach(doc => {
        const data = doc.data();
        const players = Array.isArray(data.players) ? data.players : [];
        
        // Only include rooms with capacity
        if (players.length < (data.maxPlayers || 2)) {
          allRooms.push({
            id: doc.id,
            collection: collectionName,
            ...data,
            playerCount: players.length
          });
        }
      });
    }
    
    // Sort by most recent
    allRooms.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
    
    res.json({
      rooms: allRooms.slice(0, 20), // Limit to 20 total
      totalFound: allRooms.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Error getting joinable rooms:", error);
    res.status(500).json({ error: error.message });
  }
});

// Preset room creation endpoints
app.post("/api/preset/solo", async (req, res) => {
  try {
    const { playerName, aiCount = 1 } = req.body;
    
    if (!playerName) {
      return res.status(400).json({ error: "Player name is required" });
    }
    
    const roomId = `solo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const roomData = {
      roomName: `${playerName}'s Solo Hunt`,
      players: [{
        name: playerName,
        displayName: playerName,
        userId: `player-${Date.now()}`,
        isHost: true
      }],
      maxPlayers: 1 + aiCount,
      gameStarted: false,
      isOpen: true,
      visibility: 'public',
      presetType: 'solo',
      aiCount: aiCount,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
    
    await db.collection('gameRooms').doc(roomId).set(roomData);
    
    console.log(`✅ Created solo preset room: ${roomId} for ${playerName}`);
    res.json({ ok: true, roomId, roomData });
    
  } catch (error) {
    console.error("Error creating solo preset:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/preset/duo", async (req, res) => {
  try {
    const { playerName, aiCount = 1 } = req.body;
    
    if (!playerName) {
      return res.status(400).json({ error: "Player name is required" });
    }
    
    const roomId = `duo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const roomData = {
      roomName: `${playerName}'s Duo Hunt`,
      players: [{
        name: playerName,
        displayName: playerName,
        userId: `player-${Date.now()}`,
        isHost: true
      }],
      maxPlayers: 2 + aiCount,
      gameStarted: false,
      isOpen: true,
      visibility: 'public',
      presetType: 'duo',
      aiCount: aiCount,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
    
    await db.collection('gameRooms').doc(roomId).set(roomData);
    
    console.log(`✅ Created duo preset room: ${roomId} for ${playerName}`);
    res.json({ ok: true, roomId, roomData });
    
  } catch (error) {
    console.error("Error creating duo preset:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/preset/swarm", async (req, res) => {
  try {
    const { playerName, aiCount = 3 } = req.body;
    
    if (!playerName) {
      return res.status(400).json({ error: "Player name is required" });
    }
    
    const roomId = `swarm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const roomData = {
      roomName: `${playerName}'s Zombie Swarm`,
      players: [{
        name: playerName,
        displayName: playerName,
        userId: `player-${Date.now()}`,
        isHost: true
      }],
      maxPlayers: 1 + aiCount,
      gameStarted: false,
      isOpen: true,
      visibility: 'public',
      presetType: 'swarm',
      aiCount: aiCount,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
    
    await db.collection('gameRooms').doc(roomId).set(roomData);
    
    console.log(`✅ Created swarm preset room: ${roomId} for ${playerName}`);
    res.json({ ok: true, roomId, roomData });
    
  } catch (error) {
    console.error("Error creating swarm preset:", error);
    res.status(500).json({ error: error.message });
  }
});

// Generic preset endpoint
app.post("/api/preset/:type", async (req, res) => {
  try {
    const { type } = req.params;
    const { playerName, aiCount = 1 } = req.body;
    
    if (!playerName) {
      return res.status(400).json({ error: "Player name is required" });
    }
    
    const presetNames = {
      'solo': 'Solo Zombie Hunt',
      'duo': 'Duo Zombie Hunt', 
      'swarm': 'Zombie Swarm',
      'nightmare': 'Nightmare Mode'
    };
    
    const roomId = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const roomData = {
      roomName: `${playerName}'s ${presetNames[type] || type}`,
      players: [{
        name: playerName,
        displayName: playerName,
        userId: `player-${Date.now()}`,
        isHost: true
      }],
      maxPlayers: type === 'swarm' ? 1 + Math.max(aiCount, 3) : 1 + aiCount,
      gameStarted: false,
      isOpen: true,
      visibility: 'public',
      presetType: type,
      aiCount: aiCount,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
    
    await db.collection('gameRooms').doc(roomId).set(roomData);
    
    console.log(`✅ Created ${type} preset room: ${roomId} for ${playerName}`);
    res.json({ ok: true, roomId, roomData });
    
  } catch (error) {
    console.error(`Error creating ${type} preset:`, error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Horropoly Multiplayer Sync Backend running on port ${PORT}`);
  console.log(`📡 Ready to process game intents with pure reducer pattern`);
});

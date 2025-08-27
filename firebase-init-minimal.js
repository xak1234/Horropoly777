// Minimal firebase-init.js for testing
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, onSnapshot, updateDoc, collection, query, where, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let db;

export function initFirebaseHorropoly() {
  try {
    console.log("Starting Firebase initialization...");
    
    // Check if Firebase is already initialized globally
    if (window.firebaseApp && window.firebaseDb) {
      console.log("✅ Using existing Firebase instance");
      db = window.firebaseDb;
      console.log("Existing db instance:", db);
      return db;
    }

    // Check if we're in a browser environment where Firebase might be initialized by index.html
    if (typeof window !== 'undefined' && window.firebaseDb) {
      console.log("✅ Using Firebase instance from index.html");
      db = window.firebaseDb;
      return db;
    }

    console.log("Creating new Firebase app...");
    const firebaseConfig = {
      apiKey: "AIzaSyBwc9JDb49JYp1RBnT1cuw-qfcVQORqlsg",
      authDomain: "horropoly.firebaseapp.com",
      projectId: "horropoly",
      storageBucket: "horropoly.firebasestorage.app",
      messagingSenderId: "582020770053",
      appId: "1:582020770053:web:875b64a83ce557da01ef6c"
    };

    console.log("Firebase config:", firebaseConfig);
    const app = initializeApp(firebaseConfig);
    console.log("Firebase app created:", app);
    
    db = getFirestore(app);
    console.log("Firestore database created:", db);
    
    // Test if the database instance is properly initialized
    if (db && typeof db.collection === 'function') {
      console.log("✅ Firestore database properly initialized with collection method");
    } else {
      console.warn("⚠️ Firestore database created but collection method not available");
      console.log("Database object:", db);
      console.log("Available methods:", Object.getOwnPropertyNames(db));
    }
    
    window.firebaseApp = app;
    window.firebaseDb = db;
    
    console.log("✅ Firebase initialized successfully");
    console.log("Database instance type:", typeof db);
    console.log("Database has collection method:", typeof db.collection);
    return db;
  } catch (error) {
    console.error("❌ Firebase initialization failed:", error);
    return null;
  }
}

export async function getDb() {
  try {
    // First, try to use the production fix if available
    if (window.getDbFixed) {
      console.log('Using production Firebase fix...');
      const fixedDb = await window.getDbFixed();
      if (fixedDb && typeof fixedDb.collection === 'function') {
        db = fixedDb;
        return db;
      }
    }
    
    if (!db) {
      console.log('Database not initialized, initializing Firebase...');
      const result = initFirebaseHorropoly();
      console.log('Firebase initialization result:', result);
      
      // If initialization failed, try again after a short delay
      if (!result) {
        console.log('Initial Firebase initialization failed, retrying after delay...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        const retryResult = initFirebaseHorropoly();
        console.log('Firebase retry result:', retryResult);
        
        if (retryResult && typeof retryResult.collection === 'function') {
          db = retryResult;
          return db;
        } else {
          console.log('❌ Firebase initialization failed after retry');
          return null;
        }
      }
      
      // Wait a bit for Firebase to be fully initialized
      if (result && typeof result.collection !== 'function') {
        console.log('Firebase initialized but collection method not ready, waiting...');
        await new Promise(resolve => setTimeout(resolve, 500));
        if (typeof result.collection === 'function') {
          console.log('✅ Firebase collection method now available');
          db = result;
          return db;
        } else {
          console.log('⚠️ Firebase collection method still not available');
          return null;
        }
      }
      
      if (result && typeof result.collection === 'function') {
        db = result;
        return db;
      } else {
        console.log('❌ Firebase initialized but collection method not available');
        return null;
      }
    }
    
    console.log('Database already initialized, returning existing instance');
    
    // Validate that the existing db instance is still valid
    if (db && typeof db.collection === 'function') {
      return db;
    } else {
      console.log('❌ Existing database instance is invalid, reinitializing...');
      db = null;
      return await getDb(); // Recursive call to reinitialize
    }
  } catch (error) {
    console.error('Error getting Firebase database:', error);
    return null;
  }
}

// Export other functions as needed
export { doc, getDoc };

// Add missing functions that rooms.js needs
export async function createGameRoom(playerName, maxPlayers = 2, aiCount = 0) {
  console.log('createGameRoom called with playerName:', playerName);
  const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
  console.log('Generated room ID:', roomId);
  
  const db = await getDb();
  // Store reference globally so subsequent calls (subscriptions, fixes)
  // know which room is active without needing a page reload.
  gameRoomRef = doc(db, 'gameRooms', roomId);
  
  // Generate unique userID for the host
  const hostUserId = 'user_' + Math.random().toString(36).substring(2, 10);
  
  const gameState = {
    players: [{
      name: playerName,
      userId: hostUserId,
      isHost: true,
      position: 0,
      currentSquare: 'go',
      currentPathKey: 'gamePath',
      currentIndexOnPath: 0,
      isMovingReverse: false,
      x: 0,
      y: 0,
      size: 62,
      money: 12000,
      properties: [],
      isAI: false,
      bankrupt: false,
      tokenImage: 'assets/images/t1.png',
      tokenIndex: 0,
      inJail: false,
      jailTurns: 0,
      consecutiveDoubles: 0,
      goPassCount: 0,
      color: '#ff0000',
      colorName: 'Red'
    }],
    maxPlayers,
    currentTurn: 0,
    gameStarted: false,
    lastDiceRoll: null,
    lastRollWasDoubles: false,
    consecutiveDoublesCount: 0,
    diceValues: { die1: 0, die2: 0 },
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    version: '1.0'
  };

  try {
    await setDoc(gameRoomRef, gameState);
    console.log('Game room created successfully, returning roomId:', roomId);
    return { roomId, userId: hostUserId };
  } catch (error) {
    console.error('Error setting document in Firestore:', error);
    throw error;
  }
}

// Flexible name matching for player reconnection
function findPlayerByFlexibleName(validPlayers, inputName) {
  if (!inputName || !validPlayers || validPlayers.length === 0) {
    return null;
  }
  
  const normalizedInput = inputName.toLowerCase().trim();
  
  // Try different matching strategies
  for (const player of validPlayers) {
    if (!player.name) continue;
    
    const normalizedPlayerName = player.name.toLowerCase().trim();
    
    // Strategy 1: Case-insensitive exact match
    if (normalizedInput === normalizedPlayerName) {
      return player;
    }
    
    // Strategy 2: Check if one name contains the other (for partial matches)
    if (normalizedInput.includes(normalizedPlayerName) || normalizedPlayerName.includes(normalizedInput)) {
      // Only match if the difference is reasonable (not too different)
      if (Math.abs(normalizedInput.length - normalizedPlayerName.length) <= 3) {
        return player;
      }
    }
    
    // Strategy 3: Check for common typing mistakes or variations
    if (areNamesSimilar(normalizedInput, normalizedPlayerName)) {
      return player;
    }
  }
  
  return null;
}

// Check if two names are similar enough to be considered the same player
function areNamesSimilar(name1, name2) {
  // Simple similarity check based on character overlap
  const minLength = Math.min(name1.length, name2.length);
  const maxLength = Math.max(name1.length, name2.length);
  
  // If names are very different in length, probably not the same
  if (maxLength - minLength > 4) {
    return false;
  }
  
  // Count matching characters in similar positions
  let matches = 0;
  for (let i = 0; i < minLength; i++) {
    if (name1[i] === name2[i]) {
      matches++;
    }
  }
  
  // Consider similar if at least 70% of characters match
  const similarity = matches / maxLength;
  return similarity >= 0.7;
}

export async function joinGameRoom(roomId, playerName) {
  console.log('joinGameRoom called with roomId:', roomId, 'playerName:', playerName);
  
  const db = await getDb();
  // Store reference globally so subsequent calls (subscriptions, fixes)
  // know which room is active without needing a page reload.
  gameRoomRef = doc(db, 'gameRooms', roomId);
  
  try {
    const roomDoc = await getDoc(gameRoomRef);
    if (!roomDoc.exists()) {
      throw new Error('Room not found');
    }
    
    const gameState = roomDoc.data();
          // Ensure players is an array and count valid players
      let players = gameState.players || [];
      if (!Array.isArray(players)) {
        console.log('Players is not an array, converting:', players);
        players = Object.values(players);
      }
      
      // Count only valid players (with userId)
      const validPlayers = players.filter(p => p && p.userId);
      const maxPlayers = gameState.maxPlayers || 2;
      
      console.log('Room validation - Valid players:', validPlayers.length, 'Max players:', maxPlayers, 'Total players array:', players.length);
      
      if (validPlayers.length >= maxPlayers) {
        throw new Error('Room is full');
      }
    
    // Check if player is already in the room (allow rejoining started games)
    // First try exact match
    let existingPlayer = validPlayers.find(p => p.name === playerName);
    let nameChanged = false;
    
    // If no exact match, try flexible matching for reconnection
    if (!existingPlayer && gameState.gameStarted) {
      existingPlayer = findPlayerByFlexibleName(validPlayers, playerName);
      if (existingPlayer) {
        nameChanged = true;
        console.log(`Flexible name match found: "${playerName}" matched to existing player "${existingPlayer.name}"`);
      }
    }
    
    if (existingPlayer) {
      console.log('Player already in room, allowing rejoin even if game started');
      return { 
        userId: existingPlayer.userId, 
        playerName: existingPlayer.name,
        nameChanged: nameChanged 
      };
    }

    // Only prevent NEW players from joining started games
    if (gameState.gameStarted) {
      throw new Error('Game has already started - cannot add new players');
    }

    // Generate unique userID for the joining player
    const guestUserId = 'user_' + Math.random().toString(36).substring(2, 10);
    
    const newPlayer = {
      name: playerName,
      userId: guestUserId,
      isHost: false,
      position: 0,
      currentSquare: 'go',
      currentPathKey: 'gamePath',
      currentIndexOnPath: 0,
      isMovingReverse: false,
      x: 0,
      y: 0,
      size: 62,
      money: 12000,
      properties: [],
      isAI: false,
      bankrupt: false,
      tokenImage: `assets/images/t${gameState.players.length + 1}.png`,
      tokenIndex: gameState.players.length,
      inJail: false,
      jailTurns: 0,
      consecutiveDoubles: 0,
      goPassCount: 0,
      color: ['#ff0000', '#0000ff', '#00ff00', '#ffff00', '#800080'][gameState.players.length % 5],
      colorName: ['Red', 'Blue', 'Green', 'Yellow', 'Purple'][gameState.players.length % 5]
    };

    await updateDoc(gameRoomRef, {
      players: [...gameState.players, newPlayer]
    });
    
    console.log('joinGameRoom completed successfully');
    return { userId: guestUserId };
    
  } catch (error) {
    console.error('Error in joinGameRoom:', error);
    throw error;
  }
}

export async function createRoom(roomName, displayName, minPlayers = 2) {
  const db = await getDb();
  const roomRef = await addDoc(collection(db, 'rooms'), {
    roomName,
    hostUid: '',
    status: 'waiting_for_players',
    minPlayers,
    players: []
  });
  const hostUid = 'user_' + Math.random().toString(36).substring(2, 10);
  await updateDoc(roomRef, {
    hostUid,
    players: [{ uid: hostUid, displayName }]
  });
  return { roomId: roomRef.id, hostUid };
}

export async function joinRoom(roomId, displayName) {
  const db = await getDb();
  const roomRef = doc(db, 'rooms', roomId);
  const snap = await getDoc(roomRef);
  if (!snap.exists()) throw new Error('Room not found');
  const data = snap.data();
  if (data.status !== 'waiting_for_players') throw new Error('Game already started');
  if (data.players.length >= 4) throw new Error('Room full');
  const uid = 'user_' + Math.random().toString(36).substring(2, 10);
  await updateDoc(roomRef, { players: [...data.players, { uid, displayName }] });
  return { uid };
}

export async function startGame(roomId) {
  const db = await getDb();
  const roomRef = doc(db, 'rooms', roomId);
  await updateDoc(roomRef, { status: 'in_progress' });
}

export async function getAvailableRooms() {
  const db = await getDb();
  const roomsRef = collection(db, 'rooms');
  const q = query(roomsRef, where('status', '==', 'waiting_for_players'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function listenToRoomUpdates(roomId, callback) {
  const db = await getDb();
  if (!db) {
    console.log('Firebase not initialized, skipping room updates');
    return null;
  }
  const roomRef = doc(db, 'rooms', roomId);
  return onSnapshot(roomRef, (docSnap) => {
    callback({ id: docSnap.id, ...docSnap.data() });
  });
} 
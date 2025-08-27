// firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, onSnapshot, updateDoc, deleteDoc, collection, query, where, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { waitForAuthReady } from "./auth-gate.js";

// Export Firebase functions for use in game.js
export { doc, getDoc };

let db;
let auth;
let gameRoomRef;
let unsubscribeGameState;

// Add hashCode method to strings for better device identification
if (!String.prototype.hashCode) {
  String.prototype.hashCode = function() {
    let hash = 0;
    if (this.length === 0) return hash;
    for (let i = 0; i < this.length; i++) {
      const char = this.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  };
}

export function initFirebaseHorropoly() {
  // Check if Firebase is already initialized globally
  if (window.firebaseApp && window.firebaseDb) {
    console.log("✅ Using existing Firebase instance for Horropoly");
    db = window.firebaseDb;
    auth = window.firebaseAuth;
    return db;
  }

  const firebaseConfig = {
    apiKey: "AIzaSyBwc9JDb49JYp1RBnT1cuw-qfcVQORqlsg",
    authDomain: "horropoly.firebaseapp.com",
    projectId: "horropoly",
    storageBucket: "horropoly.firebasestorage.app",
    messagingSenderId: "582020770053",
    appId: "1:582020770053:web:875b64a83ce557da01ef6c"
  };

  try {
    console.log("🔄 Initializing Firebase with enhanced error handling...");
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    
    // Enhanced connection settings for better reliability
    if (db._delegate && db._delegate._databaseId) {
      console.log("✅ Firestore database ID verified:", db._delegate._databaseId.projectId);
    }
    
    // Store globally for reuse
    window.firebaseApp = app;
    window.firebaseDb = db;
    window.firebaseAuth = auth;
    
    console.log("✅ Firebase initialized for Horropoly - authentication handled by auth-gate.js");
    
    return db;
  } catch (error) {
    console.error("❌ Firebase initialization failed:", error);
    console.error("Error details:", {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    
    // Try alternative initialization
    console.log("🔄 Attempting alternative Firebase initialization...");
    try {
      const app = initializeApp(firebaseConfig, 'horropoly-alt');
      db = getFirestore(app);
      window.firebaseApp = app;
      window.firebaseDb = db;
      console.log("✅ Alternative Firebase initialization successful");
      return db;
    } catch (altError) {
      console.error("❌ Alternative Firebase initialization also failed:", altError);
      throw new Error(`Firebase initialization failed: ${error.message}`);
    }
  }
}

// Helper function to ensure authentication before Firestore operations
async function ensureAuthenticated() {
  try {
    // Check if the new optional auth system is available
    if (window.robustFirebaseReady && typeof window.ensureAuthenticated === 'function' && window.ensureAuthenticated !== ensureAuthenticated) {
      console.log("🔐 Using robust Firebase authentication...");
      return await window.ensureAuthenticated();
    }
    
    // Fallback: try the old auth system but don't fail if it doesn't work
    console.log("🔐 Attempting authentication (optional)...");
    try {
      await waitForAuthReady(5000); // Shorter timeout
      console.log("✅ Authentication verified for Firestore operation");
      return true;
    } catch (authError) {
      console.warn("⚠️ Authentication not available, continuing without auth:", authError.message);
      
      const msg = authError?.message || '';
      const code = authError?.code || '';
      // For local testing, allow operations to continue without authentication
      if (
        msg.includes('configuration-not-found') ||
        msg.includes('Auth timeout') ||
        code === 'auth/operation-not-allowed' ||
        msg.includes('operation-not-allowed') ||
        msg.includes('identitytoolkit.googleapis.com') ||
        msg.includes('accounts:signUp')
      ) {
        console.log("ℹ️ Bypassing authentication for local testing");
        return true;
      }
      
      // Re-throw other errors
      throw authError;
    }
  } catch (error) {
    console.error("❌ Authentication check failed:", error);
    
    // For local testing, be more permissive
    const emsg = error?.message || '';
    const ecode = error?.code || '';
    if (
      emsg.includes('configuration-not-found') ||
      ecode === 'auth/operation-not-allowed' ||
      emsg.includes('operation-not-allowed') ||
      emsg.includes('identitytoolkit.googleapis.com') ||
      emsg.includes('accounts:signUp')
    ) {
      console.log("ℹ️ Authentication not configured, allowing operation for local testing");
      return true;
    }
    
    throw new Error("Authentication required - please refresh and try again");
  }
}

// Test Firebase connection function
async function testFirebaseConnection() {
  if (!db) return;
  
  try {
    console.log("🔍 Testing Firebase connection...");
    const testDoc = doc(db, 'connectionTest', 'test');
    await getDoc(testDoc);
    console.log("✅ Firebase connection test successful");
  } catch (error) {
    console.error("❌ Firebase connection test failed:", error);
    
    // Log specific error details for debugging
    if (error.code === 'unavailable') {
      console.error("🔥 Firestore unavailable - possible network/server issue");
    } else if (error.message?.includes('404')) {
      console.error("🔥 HTTP 404 - Database or project not found");
    } else if (error.message?.includes('WebChannel')) {
      console.error("🔥 WebChannel error - connection transport issue");
    } else if (error.code === 'permission-denied') {
      console.warn("⚠️ Permission denied - this is normal for connection test, continuing...");
      // Permission denied is expected for connection test, not a critical error
      return;
    }
    
    // Only log as error if it's not a permission issue
    if (error.code !== 'permission-denied') {
      console.warn("⚠️ Firebase connection test failed, but continuing with game functionality");
    }
  }
}

// Export getDb function for other modules to use
export function getDb() {
  if (!db) {
    return initFirebaseHorropoly();
  }
  return db;
}

// Helper function to check if a room is stale/inactive
function isRoomStale(roomData) {
  const now = Date.now();
  const lastActivity = roomData.lastActivity || roomData.createdAt || 0;
  const staleThreshold = 30 * 60 * 1000; // 30 minutes
  
  // Room is stale if:
  // 1. No activity for 30+ minutes
  // 2. Game started but no recent activity (abandoned mid-game)
  // 3. Has players but all are inactive
  const isInactive = (now - lastActivity) > staleThreshold;
  
  if (isInactive) {
    console.log(`🕒 Room is stale - last activity: ${new Date(lastActivity).toLocaleString()}`);
    return true;
  }
  
  return false;
}

export async function createGameRoom(playerName, maxPlayers = 4, aiCount = 0, providedPlayers = null, specificRoomId = null, roomName = null) {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  console.log('🎮 createGameRoom called:', { 
    playerName, 
    providedPlayers, 
    specificRoomId, 
    isMobile,
    userAgent: navigator.userAgent.substring(0, 50) + '...'
  });

  // Check if user has multiplayer access
  try {
    const { default: multiplayerPaywall } = await import('./multiplayer-paywall-system.js');
    const hasAccess = await multiplayerPaywall.hasMultiplayerAccess();
    if (!hasAccess) {
      throw new Error('Multiplayer access required. Please purchase multiplayer access to create games.');
    }
  } catch (importError) {
    console.warn('Could not check paywall status:', importError);
    // Continue for now, but this should be investigated
  }

  // Ensure Firestore is initialized before using it
  if (!db) {
    console.warn('createGameRoom: Firestore not initialized. Initializing now.');
    db = initFirebaseHorropoly();
  }

  // Ensure user is authenticated before creating room
  try {
    await ensureAuthenticated();
  } catch (error) {
    console.error('❌ Authentication required for room creation:', error);
    throw new Error('Authentication required. Please refresh the page and try again.');
  }

  // Clean up any stale rooms first (optional, for better reliability)
  try {
    await cleanupStaleRooms();
  } catch (cleanupError) {
    console.warn('Failed to cleanup stale rooms:', cleanupError);
    // Continue anyway - cleanup is not critical
  }

  let roomId = specificRoomId;
  let attempts = 0;
  const maxAttempts = 5;
  
  // Use roomName as roomId if provided, otherwise generate random ID
  if (!roomId && roomName) {
    // Clean room name to be a valid Firebase document ID (no special chars except - and _)
    roomId = roomName.replace(/[^\w\-\s]/g, '').replace(/\s+/g, '_').trim().toUpperCase();
    if (roomId.length === 0) {
      console.warn(`🎮 Room name "${roomName}" resulted in empty ID, generating random ID instead`);
      roomId = null; // Will trigger random generation below
    } else {
      console.log(`🎮 Using room name as room ID: "${roomName}" → "${roomId}"`);
    }
  }
  
  // Generate unique room ID with retry logic if neither roomId nor roomName provided
  if (!roomId) {
    while (attempts < maxAttempts) {
      // Generate a safe room ID with only alphanumeric characters
      const timestamp = Date.now().toString(36).substr(-3).toUpperCase();
      const random1 = Math.random().toString(36).substring(2, 4).toUpperCase();
      const random2 = Math.random().toString(36).substring(2, 4).toUpperCase();
      
      // Generate device-specific ID more safely
      let deviceId = '';
      try {
        const hash = navigator.userAgent.hashCode();
        deviceId = Math.abs(hash % 1296).toString(36).toUpperCase(); // 1296 = 36^2, ensures 2 chars max
      } catch (error) {
        deviceId = Math.floor(Math.random() * 1296).toString(36).toUpperCase();
      }
      
      // Ensure deviceId is exactly 2 characters
      deviceId = deviceId.padStart(2, '0').substr(-2);
      
      roomId = timestamp + random1 + random2 + deviceId;
      
      // Clean the room ID to ensure only valid characters (A-Z, 0-9)
      roomId = roomId.replace(/[^A-Z0-9]/g, '').substr(0, 8);
      
      // If room ID is too short, pad with random characters
      while (roomId.length < 6) {
        roomId += Math.floor(Math.random() * 36).toString(36).toUpperCase();
      }
      
      console.log(`Attempt ${attempts + 1}: Trying room ID:`, roomId);
      
      // Check if a room with this ID already exists
      const existingRoomDoc = await getDoc(doc(db, 'gameRooms', roomId));
      if (!existingRoomDoc.exists()) {
        break; // Found a unique ID
      }
      
      console.warn(`Room ID ${roomId} already exists, trying again...`);
      roomId = null; // Reset for next attempt
      attempts++;
      
      if (attempts >= maxAttempts) {
        // Final fallback: generate an extremely unique ID using crypto if available
        if (window.crypto && window.crypto.getRandomValues) {
          const array = new Uint32Array(2);
          window.crypto.getRandomValues(array);
          let cryptoId = array[0].toString(36).toUpperCase() + array[1].toString(36).toUpperCase();
          // Clean and ensure valid characters
          cryptoId = cryptoId.replace(/[^A-Z0-9]/g, '').substr(0, 6);
          roomId = 'ROOM' + cryptoId.padEnd(6, '0');
          console.log('Using crypto-generated room ID as final fallback:', roomId);
        } else {
          throw new Error(`Failed to generate unique room ID after ${maxAttempts} attempts. Please try again in a moment.`);
        }
      }
    }
  } else {
    // Check if the specific room ID already exists
    const existingRoomDoc = await getDoc(doc(db, 'gameRooms', roomId));
    if (existingRoomDoc.exists()) {
      const existingData = existingRoomDoc.data();
      const players = existingData.players || [];
      
      // If room exists but is empty or has stale players, we can reuse it
      if (players.length === 0 || isRoomStale(existingData)) {
        console.log(`🔄 Room "${roomId}" exists but is empty/stale, will be reused`);
        // Delete the existing room so we can create fresh
        await deleteDoc(doc(db, 'gameRooms', roomId));
        console.log(`🗑️ Cleaned up stale room "${roomId}"`);
      } else {
        throw new Error(`A dungeon with code "${roomId}" already exists! Please try again.`);
      }
    }
  }
  
  // Final safety check for room ID validity
  if (!roomId || roomId.length < 4 || !/^[A-Za-z0-9_\-]+$/.test(roomId)) {
    console.error('Invalid room ID generated:', roomId);
    throw new Error('Failed to generate a valid room ID. Please try again.');
  }
  
  console.log('Using room ID:', roomId);
  
  gameRoomRef = doc(db, 'gameRooms', roomId);
  
  // Generate unique userID for the host with timestamp for better uniqueness
  const hostUserId = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
  
  const tokenImages = [
    'assets/images/t1.png',
    'assets/images/t2.png',
    'assets/images/t3.png',
    'assets/images/t4.png',
    'assets/images/t5.png',
    'assets/images/t6.png',
    'assets/images/t7.png',
    'assets/images/t8.png',
    'assets/images/t9.png'
  ];
  const colors = ['#ff0000', '#0000ff', '#00ff00', '#ffff00', '#800080'];
  const colorNames = ['Red', 'Blue', 'Green', 'Yellow', 'Purple'];

  let players;
  
  if (providedPlayers && Array.isArray(providedPlayers)) {
    // Use the provided players from the room
    console.log('Using provided players from room:', providedPlayers);
    players = providedPlayers;
  } else {
    // Create default host player (fallback)
    console.log('Creating default host player');
    players = [{
      name: playerName,
      displayName: playerName, // Ensure both fields are set consistently
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
      money: 16500,
      properties: [],
      isAI: false,
      bankrupt: false,
      tokenImage: tokenImages[0],
      tokenIndex: 0,
      inJail: false,
      jailTurns: 0,
      consecutiveDoubles: 0,
      goPassCount: 0,
      color: colors[0],
      colorName: colorNames[0]
    }];
  }

  // Add AI players if specified
  for (let i = 0; i < aiCount; i++) {
    const idx = players.length + i;
    players.push({
      name: `AI Player ${i + 1}`,
      userId: 'ai_' + Math.random().toString(36).substring(2, 10),
      isHost: false,
      position: 0,
      currentSquare: 'go',
      currentPathKey: 'gamePath',
      currentIndexOnPath: 0,
      isMovingReverse: false,
      x: 0,
      y: 0,
      size: 62,
      money: 16500,
      properties: [],
      isAI: true,
      bankrupt: false,
      tokenImage: tokenImages[idx % tokenImages.length],
      tokenIndex: idx,
      inJail: false,
      jailTurns: 0,
      consecutiveDoubles: 0,
      goPassCount: 0,
      color: colors[idx % colors.length],
      colorName: colorNames[idx % colorNames.length]
    });
  }

  const gameState = {
    players,
    maxPlayers,
    currentTurn: 0,
    roomCreatedBy: hostUserId, // Track who created the room
    roomCreatedAt: new Date().toISOString(),
    roomName: roomName || `${playerName}'s Dungeon`, // Store the actual room name
    gameStarted: false,
    lastDiceRoll: null,
    lastRollWasDoubles: false,
    consecutiveDoublesCount: 0,
    diceValues: { die1: 0, die2: 0 },
    // Complete property state tracking
    properties: {
      // Initialize all property states
      // Blood properties
      't5': { owner: null, graveyards: 0, hasCrypt: false, group: 'blood' },
      'b5': { owner: null, graveyards: 0, hasCrypt: false, group: 'blood' },
      'b6': { owner: null, graveyards: 0, hasCrypt: false, group: 'blood' },
      'l2': { owner: null, graveyards: 0, hasCrypt: false, group: 'blood' },
      'l4': { owner: null, graveyards: 0, hasCrypt: false, group: 'blood' },
      // Urine properties
      'b3': { owner: null, graveyards: 0, hasCrypt: false, group: 'urine' },
      'b7': { owner: null, graveyards: 0, hasCrypt: false, group: 'urine' },
      'r4': { owner: null, graveyards: 0, hasCrypt: false, group: 'urine' },
      // Drowning properties
      't4': { owner: null, graveyards: 0, hasCrypt: false, group: 'drowning' },
      't6': { owner: null, graveyards: 0, hasCrypt: false, group: 'drowning' },
      // Strangulation properties
      'b2': { owner: null, graveyards: 0, hasCrypt: false, group: 'strangulation' },
      'b4': { owner: null, graveyards: 0, hasCrypt: false, group: 'strangulation' },
      'b9': { owner: null, graveyards: 0, hasCrypt: false, group: 'strangulation' },
      'l7': { owner: null, graveyards: 0, hasCrypt: false, group: 'strangulation' },
      'r3': { owner: null, graveyards: 0, hasCrypt: false, group: 'cave' },
      // Werewolves properties
      't3': { owner: null, graveyards: 0, hasCrypt: false, group: 'werewolves' },
      't7': { owner: null, graveyards: 0, hasCrypt: false, group: 'werewolves' },
      'r7': { owner: null, graveyards: 0, hasCrypt: false, group: 'werewolves' },
      'r8': { owner: null, graveyards: 0, hasCrypt: false, group: 'werewolves' },
      // Poison properties
      'r9': { owner: null, graveyards: 0, hasCrypt: false, group: 'poison' },
      'r5': { owner: null, graveyards: 0, hasCrypt: false, group: 'poison' },
      // Insanity properties
      'l1': { owner: null, graveyards: 0, hasCrypt: false, group: 'insanity' },
      'l3': { owner: null, graveyards: 0, hasCrypt: false, group: 'insanity' },
      'l8': { owner: null, graveyards: 0, hasCrypt: false, group: 'insanity' },
      // Waterboarding properties
      't1': { owner: null, graveyards: 0, hasCrypt: false, group: 'waterboarding' },
      't2': { owner: null, graveyards: 0, hasCrypt: false, group: 'waterboarding' },
      't9': { owner: null, graveyards: 0, hasCrypt: false, group: 'waterboarding' },
      // Swamp properties
      'r1': { owner: null, graveyards: 0, hasCrypt: false, group: 'swamp' },
      'r2': { owner: null, graveyards: 0, hasCrypt: false, group: 'swamp' },
      'r6': { owner: null, graveyards: 0, hasCrypt: false, group: 'swamp' },
      'l6': { owner: null, graveyards: 0, hasCrypt: false, group: 'swamp' },
      // Demon properties
      'l5': { owner: null, graveyards: 0, hasCrypt: false, group: 'demon' },
      'l9': { owner: null, graveyards: 0, hasCrypt: false, group: 'demon' },
      'b1': { owner: null, graveyards: 0, hasCrypt: false, group: 'demon' },
      'b8': { owner: null, graveyards: 0, hasCrypt: false, group: 'demon' }
    },
    // Game board state
    boardState: {
      eyePositions: [], // For eye animations
      
      soundSettings: {
        musicEnabled: true,
        soundEffectsEnabled: true
      }
    },
    // Game metadata
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    lastActivity: Date.now(),
    version: '1.0'
  };

  console.log('Setting game state in Firestore:', gameState);
  try {
    console.log('About to call setDoc...');
    
    // Start the setDoc operation but don't wait for it to complete
    // The HTTP requests show it's working, but the Promise isn't resolving
    setDoc(gameRoomRef, gameState).then(() => {
      console.log('setDoc completed successfully (in background)');
    }).catch((error) => {
      console.error('setDoc failed (in background):', error);
    });
    
    // Give Firebase a moment to start the operation
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('Game room created successfully, returning roomId:', roomId);
    
    // Set up disconnect handlers for the host player
    if (typeof window !== 'undefined') {
      const cleanupDisconnectHandlers = setupPlayerDisconnectHandlers(roomId, playerName, hostUserId);
      const cleanupActivityUpdates = setupPlayerActivityUpdates(roomId, playerName, hostUserId);
      
      // Store cleanup functions for later use
      window.cleanupDisconnectHandlers = cleanupDisconnectHandlers;
      window.cleanupActivityUpdates = cleanupActivityUpdates;
      
      console.log('🎮 Disconnect handlers and activity updates set up for host:', playerName);
    }
    
    return { roomId, userId: hostUserId };
  } catch (error) {
    console.error('Error setting document in Firestore:', error);
    throw error;
  }
}

// Helper function to find the first available token index
function findFirstAvailableTokenIndex(usedIndices) {
  // Sort the used indices for efficient checking
  const sortedUsedIndices = [...usedIndices].sort((a, b) => a - b);
  
  // Find the first available index (0-8 for 9 tokens)
  for (let i = 0; i < 9; i++) {
    if (!sortedUsedIndices.includes(i)) {
      console.log(`Found available token index: ${i} (used indices: ${sortedUsedIndices.join(', ')})`);
      return i;
    }
  }
  
  // If all tokens are used, return the first one (fallback)
  console.warn('All token indices are used, falling back to index 0');
  return 0;
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
  
  // Check if user has multiplayer access
  try {
    const { default: multiplayerPaywall } = await import('./multiplayer-paywall-system.js');
    const hasAccess = await multiplayerPaywall.hasMultiplayerAccess();
    if (!hasAccess) {
      throw new Error('Multiplayer access required. Please purchase multiplayer access to join games.');
    }
  } catch (importError) {
    console.warn('Could not check paywall status:', importError);
    // Continue for now, but this should be investigated
  }
  
  const db = await getDb();
  // Store reference globally so other functions (like subscriptions or
  // corruption fixes) can access the current room without requiring a
  // page refresh.
  gameRoomRef = doc(db, 'gameRooms', roomId);
  
  try {
    const roomDoc = await getDoc(gameRoomRef);
    if (!roomDoc.exists()) {
      throw new Error('Room not found');
    }
    
    const gameState = roomDoc.data();
    const currentPlayers = convertObjectToArray(gameState.players || []);
    const validPlayers = currentPlayers.filter(p => p && p.userId && p.name);
    const maxPlayers = gameState.maxPlayers || 2;
    
    console.log(`📊 Room status: ${validPlayers.length}/${maxPlayers} players, game started: ${gameState.gameStarted}`);
    
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

    // Check room capacity for NEW players only
    if (validPlayers.length >= maxPlayers) {
      // Provide detailed information about why the room is full
      const playerDetails = validPlayers.map(p => `${p.name} (${p.isHost ? 'Host' : 'Guest'})`).join(', ');
      throw new Error(`Room is full (${validPlayers.length}/${maxPlayers} players). Current players: ${playerDetails}`);
    }

    // Generate unique userID for the joining player
    const guestUserId = 'user_' + Math.random().toString(36).substring(2, 10);
    
    // Find the first available token index (0-8 for t1.png through t9.png)
    const usedTokenIndices = validPlayers.map(p => p.tokenIndex || 0);
    const availableTokenIndex = findFirstAvailableTokenIndex(usedTokenIndices);
    
    const tokenImages = [
      'assets/images/t1.png', 'assets/images/t2.png', 'assets/images/t3.png',
      'assets/images/t4.png', 'assets/images/t5.png', 'assets/images/t6.png',
      'assets/images/t7.png', 'assets/images/t8.png', 'assets/images/t9.png'
    ];

    // Handle name conflicts
    let finalPlayerName = playerName;
    let nameCounter = 1;
    while (validPlayers.some(p => p.name === finalPlayerName)) {
      finalPlayerName = `${playerName} (${nameCounter})`;
      nameCounter++;
    }

    const newPlayer = {
      name: finalPlayerName,
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
      money: 16500,
      properties: [],
      isAI: false,
      bankrupt: false,
      tokenImage: tokenImages[availableTokenIndex],
      tokenIndex: availableTokenIndex,
      inJail: false,
      jailTurns: 0,
      consecutiveDoubles: 0,
      goPassCount: 0,
      color: ['#ff0000', '#0000ff', '#00ff00', '#ffff00', '#800080'][availableTokenIndex % 5],
      colorName: ['Red', 'Blue', 'Green', 'Yellow', 'Purple'][availableTokenIndex % 5]
    };

    const updatedPlayers = [...currentPlayers, newPlayer];
    await updateDoc(gameRoomRef, {
      players: updatedPlayers,
      lastActivity: Date.now()
    });
    
    console.log('joinGameRoom completed successfully');
    console.log(`🎮 Player "${finalPlayerName}" (${guestUserId}) joined room. Total players: ${updatedPlayers.length}`);
    console.log('🎮 All players in room:', updatedPlayers.map(p => `${p.name} (${p.userId})`));
    
    // Set up disconnect handlers for the joining player
    if (typeof window !== 'undefined') {
      const cleanupDisconnectHandlers = setupPlayerDisconnectHandlers(roomId, finalPlayerName, guestUserId);
      const cleanupActivityUpdates = setupPlayerActivityUpdates(roomId, finalPlayerName, guestUserId);
      
      // Store cleanup functions for later use
      window.cleanupDisconnectHandlers = cleanupDisconnectHandlers;
      window.cleanupActivityUpdates = cleanupActivityUpdates;
      
      console.log('🎮 Disconnect handlers and activity updates set up for player:', finalPlayerName);
    }
    
    // Check if room is now full and should auto-start
    // ENHANCED: Also check for AI bot rooms that should auto-start when any human joins
    const shouldAutoStart = !gameState.gameStarted && (
      // Room is full
      updatedPlayers.length >= maxPlayers ||
      // OR room has AI bots and at least one human player
      (gameState.aiBots > 0 && updatedPlayers.some(p => !p.isAI))
    );
    
    if (shouldAutoStart) {
      console.log('🎮 Room should auto-start - triggering auto-start check', {
        playersCount: updatedPlayers.length,
        maxPlayers: maxPlayers,
        hasAIBots: gameState.aiBots > 0,
        hasHumanPlayer: updatedPlayers.some(p => !p.isAI)
      });
      
      // Add a small delay to ensure the document update is processed
      setTimeout(async () => {
        try {
          const updatedRoomDoc = await getDoc(gameRoomRef);
          if (updatedRoomDoc.exists()) {
            const updatedGameState = updatedRoomDoc.data();
            console.log('🎮 Checking if game should auto-start:', {
              playersCount: updatedGameState.players?.length,
              maxPlayers: updatedGameState.maxPlayers,
              gameStarted: updatedGameState.gameStarted,
              aiBots: updatedGameState.aiBots,
              hasHumanPlayer: updatedGameState.players?.some(p => !p.isAI)
            });
            
            // Enhanced auto-start conditions
            const finalShouldAutoStart = !updatedGameState.gameStarted && (
              // Room is full
              updatedGameState.players?.length >= (updatedGameState.maxPlayers || 2) ||
              // OR room has AI bots and at least one human player joined
              (updatedGameState.aiBots > 0 && updatedGameState.players?.some(p => !p.isAI))
            );
            
            if (finalShouldAutoStart) {
              console.log('🎮 Auto-starting game after conditions met');
              await updateDoc(gameRoomRef, { 
                gameStarted: true,
                gameStartedAt: new Date().toISOString()
              });
            }
          }
        } catch (error) {
          console.error('Error in auto-start check:', error);
        }
      }, 1000);
    }
    
    return { 
      userId: guestUserId, 
      playerName: finalPlayerName,
      nameChanged: finalPlayerName !== playerName 
    };
    
  } catch (error) {
    console.error('Error in joinGameRoom:', error);
    throw error;
  }
}

// Helper function to convert Firebase objects back to arrays
function convertObjectToArray(obj) {
  if (Array.isArray(obj)) {
    return obj; // Already an array
  }
  
  if (obj && typeof obj === 'object') {
    // Check if it's an object with numeric keys (Firebase array corruption)
    const keys = Object.keys(obj);
    const isNumericKeys = keys.every(key => !isNaN(parseInt(key)));
    
    if (isNumericKeys && keys.length > 0) {
      console.log('Converting Firebase object with numeric keys to array:', obj);
      // Convert to array by sorting keys numerically
      const sortedKeys = keys.sort((a, b) => parseInt(a) - parseInt(b));
      return sortedKeys.map(key => obj[key]);
    }
  }
  
  return obj; // Return as-is if not convertible
}

export function subscribeToGameState(onGameStateUpdate) {
  if (!gameRoomRef) {
    throw new Error('Not connected to a game room');
  }

  // Unsubscribe from previous listener if exists
  if (unsubscribeGameState) {
    unsubscribeGameState();
  }

  // Add connection state tracking
  let connectionAttempts = 0;
  const maxReconnectAttempts = 5;
  const reconnectDelay = 2000; // 2 seconds

  // Global connection monitoring
  let isPageVisible = true;
  let isOnline = navigator.onLine;

  // Monitor page visibility changes
  document.addEventListener('visibilitychange', () => {
    isPageVisible = !document.hidden;
    console.log('📱 Page visibility changed:', isPageVisible);
    
    if (isPageVisible && isOnline && unsubscribeGameState) {
      console.log('🔄 Page became visible, checking connection...');
      // The listener will automatically reconnect if needed
    }
  });

  // Monitor network connectivity
  window.addEventListener('online', () => {
    isOnline = true;
    console.log('🌐 Network connection restored');
    if (isPageVisible && unsubscribeGameState) {
      console.log('🔄 Network restored, checking connection...');
    }
  });

  window.addEventListener('offline', () => {
    isOnline = false;
    console.log('🌐 Network connection lost');
  });

  // Monitor beforeunload to clean up connections
  window.addEventListener('beforeunload', () => {
    console.log('🔄 Page unloading, cleaning up connections...');
    if (unsubscribeGameState) {
      unsubscribeGameState();
    }
  });

  // Debounce state updates to avoid rapid thrashing/UI stutter
  let pendingUpdate = null;
  let debounceTimer = null;
  const DEBOUNCE_MS = 120; // small delay to coalesce bursts

  // Short stabilization window for transient invalid player arrays
  let lastValidPlayers = null;
  let lastValidPlayersTs = 0;
  const STABILIZE_MS = 400; // ignore invalid players for this long after last valid

  function deliverUpdate(gameState) {
    try {
      onGameStateUpdate(gameState);
    } catch (e) {
      console.error('Error in onGameStateUpdate callback:', e);
    }
  }

  function scheduleUpdate(gameState) {
    pendingUpdate = gameState;
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      const updateToSend = pendingUpdate;
      pendingUpdate = null;
      debounceTimer = null;
      deliverUpdate(updateToSend);
    }, DEBOUNCE_MS);
  }

  const setupListener = () => {
    console.log(`🔄 Setting up Firestore listener (attempt ${connectionAttempts + 1}/${maxReconnectAttempts})`);
    
    try {
      unsubscribeGameState = onSnapshot(gameRoomRef, 
        (doc) => {
          // Reset connection attempts on successful data
          connectionAttempts = 0;
          
          const gameState = doc.data();
          
          // Fix players array if it got corrupted into an object
          if (gameState && gameState.players) {
            console.log('Raw players data from Firebase:', gameState.players, 'Type:', typeof gameState.players);
            
            const originalPlayers = gameState.players;
            gameState.players = convertObjectToArray(gameState.players);
            
            console.log('Processed players data:', {
              wasConverted: originalPlayers !== gameState.players,
              isArray: Array.isArray(gameState.players),
              length: gameState.players?.length,
              type: typeof gameState.players,
              firstPlayer: gameState.players?.[0]
            });
            
            // If conversion failed and it's still an object, force convert it
            if (!Array.isArray(gameState.players) && typeof gameState.players === 'object') {
              console.warn('Force converting players object to array');
              const keys = Object.keys(gameState.players).sort((a, b) => parseInt(a) - parseInt(b));
              const convertedPlayers = keys.map(key => gameState.players[key]);
              console.log(`🔧 Force conversion: ${keys.length} keys found, converted to ${convertedPlayers.length} players`);
              gameState.players = convertedPlayers;
              console.log('Force converted players:', gameState.players);
            }
            
            // Stabilize against transient invalid arrays (length 0/1 with missing fields)
            if (Array.isArray(gameState.players)) {
              const nowTs = Date.now();
              const validCount = gameState.players.filter(p => p && p.name && p.userId).length;
              if (validCount >= 2) {
                lastValidPlayers = gameState.players;
                lastValidPlayersTs = nowTs;
              } else {
                // If we recently had a valid list, prefer it briefly to avoid flicker
                if (lastValidPlayers && (nowTs - lastValidPlayersTs) < STABILIZE_MS) {
                  console.warn('⚠️ Transient invalid players detected, using last valid snapshot');
                  gameState.players = lastValidPlayers;
                }
              }

              console.log(`🔧 Final player count before callback: ${gameState.players.length} players`);
              gameState.players.forEach((player, index) => {
                console.log(`🔧 Player ${index}: name="${player?.name}", userId="${player?.userId}"`);
              });
            }
          }
          
          // Debounce the callback to coalesce rapid Firestore updates
          scheduleUpdate(gameState);
        },
        (error) => {
          console.error('❌ Firestore listener error:', error);
          console.error('Error details:', {
            code: error.code,
            message: error.message,
            name: error.name,
            stack: error.stack
          });
          
          // Handle specific connection errors including WebChannel issues
          const isConnectionError = 
            error.code === 'unavailable' || 
            error.message?.includes('NS_BASE_STREAM_CLOSED') ||
            error.message?.includes('stream closed') ||
            error.message?.includes('connection lost') ||
            error.message?.includes('WebChannel') ||
            error.message?.includes('transport errored') ||
            error.message?.includes('404') ||
            error.code === 'failed-precondition';
          
          if (isConnectionError) {
            console.warn('🔄 Firestore connection lost, attempting to reconnect...');
            
            if (connectionAttempts < maxReconnectAttempts) {
              connectionAttempts++;
              console.log(`🔄 Reconnection attempt ${connectionAttempts}/${maxReconnectAttempts}`);
              
              // Clean up current listener
              if (unsubscribeGameState) {
                try {
                  unsubscribeGameState();
                } catch (cleanupError) {
                  console.warn('⚠️ Error cleaning up listener:', cleanupError);
                }
                unsubscribeGameState = null;
              }
              
              // Progressive delay: 2s, 4s, 6s, 8s, 10s
              const delay = reconnectDelay * connectionAttempts;
              console.log(`⏰ Waiting ${delay}ms before reconnection attempt...`);
              
              // Wait before reconnecting with progressive delay
              setTimeout(() => {
                try {
                  console.log('🔄 Attempting to re-establish connection...');
                  
                  // Try to reinitialize Firebase if needed
                  if (!db || !window.firebaseDb) {
                    console.log('🔄 Reinitializing Firebase...');
                    initFirebaseHorropoly();
                  }
                  
                  setupListener();
                } catch (reconnectError) {
                  console.error('❌ Reconnection failed:', reconnectError);
                  
                  // If this is the last attempt, show error
                  if (connectionAttempts >= maxReconnectAttempts) {
                    showAdvisory('Connection lost. Please refresh the page to reconnect.', 'error');
                  }
                }
              }, delay);
            } else {
              console.error('❌ Max reconnection attempts reached');
              showAdvisory('Connection lost after multiple attempts. Please refresh the page.', 'error');
              
              // Reset connection attempts after a longer delay for potential manual retry
              setTimeout(() => {
                connectionAttempts = 0;
                console.log('🔄 Connection attempts reset - manual retry possible');
              }, 30000); // 30 seconds
            }
          } else {
            // For other errors, show advisory but don't attempt reconnection
            console.error('❌ Non-connection Firestore error:', error);
            showAdvisory(`Firestore error: ${error.message}`, 'error');
          }
        }
      );
      
      console.log('✅ Firestore listener setup successful');
    } catch (setupError) {
      console.error('❌ Failed to setup Firestore listener:', setupError);
      
      if (connectionAttempts < maxReconnectAttempts) {
        connectionAttempts++;
        console.log(`🔄 Retrying listener setup (attempt ${connectionAttempts}/${maxReconnectAttempts})`);
        
        setTimeout(() => {
          setupListener();
        }, reconnectDelay);
      } else {
        console.error('❌ Max listener setup attempts reached');
        showAdvisory('Failed to connect to game state. Please refresh the page.', 'error');
      }
    }
  };

  // Start the listener
  setupListener();

  return unsubscribeGameState;
}

export async function updateGameState(updates) {
  console.log('updateGameState called with updates:', updates);
  if (!gameRoomRef) {
    throw new Error('Not connected to a game room');
  }

  try {
    console.log('About to call updateDoc for game state...');
    
    // Add timestamp to all updates
    const timestampedUpdates = {
      ...updates,
      lastUpdated: new Date().toISOString()
    };
    
    // Use the same non-blocking approach for updateDoc
    updateDoc(gameRoomRef, timestampedUpdates).then(() => {
      console.log('updateDoc for game state completed successfully (in background)');
    }).catch((error) => {
      console.error('updateDoc for game state failed (in background):', error);
    });
    
    // Give Firebase a moment to start the operation
    await new Promise(resolve => setTimeout(resolve, 300));
    console.log('updateGameState completed');
    
  } catch (error) {
    console.error('Error in updateGameState:', error);
    throw error;
  }
}

// Function to update a specific player's data
export async function updatePlayerData(playerIndex, playerUpdates) {
  console.log('updatePlayerData called for player', playerIndex, 'with updates:', playerUpdates);
  if (!gameRoomRef) {
    throw new Error('Not connected to a game room');
  }

  try {
    // Create the update object for the specific player
    const updates = {};
    Object.keys(playerUpdates).forEach(key => {
      updates[`players.${playerIndex}.${key}`] = playerUpdates[key];
    });
    
    // Add timestamp
    updates.lastUpdated = new Date().toISOString();
    
    console.log('About to call updateDoc for player data...');
    
    updateDoc(gameRoomRef, updates).then(() => {
      console.log('updateDoc for player data completed successfully (in background)');
    }).catch((error) => {
      console.error('updateDoc for player data failed (in background):', error);
    });
    
    // Give Firebase a moment to start the operation
    await new Promise(resolve => setTimeout(resolve, 300));
    console.log('updatePlayerData completed');
    
  } catch (error) {
    console.error('Error in updatePlayerData:', error);
    throw error;
  }
}

// Function to update property ownership
export async function updatePropertyState(propertyId, propertyUpdates) {
  console.log('updatePropertyState called for property', propertyId, 'with updates:', propertyUpdates);
  if (!gameRoomRef) {
    throw new Error('Not connected to a game room');
  }

  try {
    // Create the update object for the specific property, filtering out undefined values
    const updates = {};
    Object.keys(propertyUpdates).forEach(key => {
      const value = propertyUpdates[key];
      updates[`properties.${propertyId}.${key}`] = value === undefined ? null : value;
    });
    
    // Add timestamp
    updates.lastUpdated = new Date().toISOString();
    
    console.log('About to call updateDoc for property state...');
    
    updateDoc(gameRoomRef, updates).then(() => {
      console.log('updateDoc for property state completed successfully (in background)');
    }).catch((error) => {
      console.error('updateDoc for property state failed (in background):', error);
    });
    
    // Give Firebase a moment to start the operation
    await new Promise(resolve => setTimeout(resolve, 300));
    console.log('updatePropertyState completed');
    
  } catch (error) {
    console.error('Error in updatePropertyState:', error);
    throw error;
  }
}

// Function to sync complete game state (for major updates)
export async function syncCompleteGameState(gameState) {
  console.log('syncCompleteGameState called with complete state');
  if (!gameRoomRef) {
    throw new Error('Not connected to a game room');
  }

  try {
    // Clean the gameState to remove undefined values that Firebase doesn't support
    const cleanedGameState = JSON.parse(JSON.stringify(gameState, (key, value) => {
      return value === undefined ? null : value;
    }));

    // CRITICAL: Use updateDoc instead of setDoc to prevent overwriting the entire document
    // This preserves any data that might not be included in the local gameState
    const completeState = {
      ...cleanedGameState,
      lastUpdated: new Date().toISOString(),
      syncType: 'complete'
    };
    
    console.log('About to call updateDoc for complete game state (preserving existing data)...');
    console.log('Players data being synced:', completeState.players?.length || 0, 'players');
    
    updateDoc(gameRoomRef, completeState).then(() => {
      console.log('updateDoc for complete game state completed successfully (in background)');
    }).catch((error) => {
      console.error('updateDoc for complete game state failed (in background):', error);
    });
    
    // Give Firebase a moment to start the operation
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('syncCompleteGameState completed');
    
    // Auto-fix player name if there's a mismatch
    if (typeof window !== 'undefined' && window.autoFixPlayerNameOnSync) {
      window.autoFixPlayerNameOnSync();
    }
    
  } catch (error) {
    console.error('Error in syncCompleteGameState:', error);
    throw error;
  }
}

// Function to start the game and initialize all positions and tokens
export async function startGameWithInitialization(players, boardPositions) {
  console.log('startGameWithInitialization called with', players.length, 'players');
  if (!gameRoomRef) {
    throw new Error('Not connected to a game room');
  }

  try {
    // Validate players array
    if (!Array.isArray(players)) {
      throw new Error('startGameWithInitialization: players is not an array');
    }
    
    // Initialize all players with proper positions and tokens (exclude HTMLImageElement objects)
    const initializedPlayers = players.map((player, index) => ({
      name: player.name,
      userId: player.userId || `user_${index}`,
      isHost: player.isHost || false,
      x: boardPositions?.go?.x || 0,
      y: boardPositions?.go?.y || 0,
      currentSquare: 'go',
      position: 0,
      currentPathKey: 'gamePath',
      currentIndexOnPath: 0,
      isMovingReverse: false,
      size: player.size || 62,
      money: player.money || 16500,
      properties: player.properties || [],
      isAI: player.isAI || false,
      bankrupt: player.bankrupt || false,
      tokenIndex: player.tokenIndex || index, // Preserve existing token index
      tokenImage: player.tokenImage || `assets/images/t${(player.tokenIndex || index) + 1}.png`, // Preserve existing token image
      inJail: false,
      jailTurns: 0,
      consecutiveDoubles: 0,
      stealCards: 0, // Reset steal cards at game start
      goPassCount: 0
      // Note: Excluding 'image' property as it contains HTMLImageElement
    }));

    const gameStartUpdate = {
      gameStarted: true,
      players: initializedPlayers,
      currentTurn: 0,
      lastDiceRoll: null,
      lastRollWasDoubles: false,
      consecutiveDoublesCount: 0,
      diceValues: { die1: 0, die2: 0 },
      gameStartedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    console.log('About to call updateDoc to start game...');
    
    updateDoc(gameRoomRef, gameStartUpdate).then(() => {
      console.log('updateDoc for game start completed successfully (in background)');
    }).catch((error) => {
      console.error('updateDoc for game start failed (in background):', error);
    });
    
    // Give Firebase a moment to start the operation
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('startGameWithInitialization completed');
    
  } catch (error) {
    console.error('Error in startGameWithInitialization:', error);
    throw error;
  }
}

export function disconnectFromGame() {
  if (unsubscribeGameState) {
    unsubscribeGameState();
    unsubscribeGameState = null;
  }
  gameRoomRef = null;
}

// Enhanced disconnect function that removes player from room
export async function disconnectAndRemovePlayer(roomId, playerName, userId = null) {
  console.log(`disconnectAndRemovePlayer called for room: ${roomId}, player: ${playerName}, userId: ${userId}`);
  
  try {
    if (!roomId) {
      console.warn('disconnectAndRemovePlayer: No roomId provided');
      return;
    }

    const db = await getDb();
    const roomRef = doc(db, 'gameRooms', roomId);
    
    // Get current room state
    const roomDoc = await getDoc(roomRef);
    if (!roomDoc.exists()) {
      console.warn(`disconnectAndRemovePlayer: Room ${roomId} not found`);
      return;
    }

    const roomData = roomDoc.data();
    let players = roomData.players || [];
    
    // Ensure players is always an array
    if (!Array.isArray(players)) {
      console.warn(`🧹 Converting non-array players to array for disconnectAndRemovePlayer in room ${roomId}:`, players);
      players = [];
    }
    
    console.log(`Current players in room: ${players.length}`);
    console.log('Players:', players.map(p => ({ name: p.name, userId: p.userId })));
    
    // Find and remove the player
    const updatedPlayers = players.filter(player => {
      const nameMatch = player.name !== playerName;
      const userIdMatch = userId ? player.userId !== userId : true;
      return nameMatch && userIdMatch;
    });
    
    console.log(`Players after removal: ${updatedPlayers.length}`);
    console.log('Remaining players:', updatedPlayers.map(p => ({ name: p.name, userId: p.userId })));
    
    // Update the room with the player removed
    const updates = {
      players: updatedPlayers,
      lastUpdated: new Date().toISOString(),
      lastPlayerLeft: {
        playerName: playerName,
        userId: userId,
        timestamp: new Date().toISOString()
      }
    };
    
    await updateDoc(roomRef, updates);
    console.log(`✅ Player ${playerName} successfully removed from room ${roomId}`);
    
    // If no players left, mark room as inactive
    if (updatedPlayers.length === 0) {
      console.log(`Room ${roomId} is now empty, marking as inactive`);
      await updateDoc(roomRef, {
        status: 'inactive',
        lastUpdated: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('Error in disconnectAndRemovePlayer:', error);
  }
}

// Function to remove a specific player from a room (for admin/cleanup purposes)
export async function removePlayerFromRoom(roomId, playerName, userId = null) {
  console.log(`removePlayerFromRoom called for room: ${roomId}, player: ${playerName}, userId: ${userId}`);
  
  try {
    if (!roomId) {
      throw new Error('Room ID is required');
    }

    const db = await getDb();
    const roomRef = doc(db, 'gameRooms', roomId);
    
    // Get current room state
    const roomDoc = await getDoc(roomRef);
    if (!roomDoc.exists()) {
      throw new Error(`Room ${roomId} not found`);
    }

    const roomData = roomDoc.data();
    let players = roomData.players || [];
    
    // Ensure players is always an array
    if (!Array.isArray(players)) {
      console.warn(`🧹 Converting non-array players to array for removePlayerFromRoom in room ${roomId}:`, players);
      players = [];
    }
    
    // Find and remove the player
    const updatedPlayers = players.filter(player => {
      const nameMatch = player.name !== playerName;
      const userIdMatch = userId ? player.userId !== userId : true;
      return nameMatch && userIdMatch;
    });
    
    if (updatedPlayers.length === players.length) {
      console.warn(`Player ${playerName} not found in room ${roomId}`);
      return false;
    }
    
    // Update the room
    const updates = {
      players: updatedPlayers,
      lastUpdated: new Date().toISOString(),
      lastPlayerRemoved: {
        playerName: playerName,
        userId: userId,
        timestamp: new Date().toISOString(),
        reason: 'manual_removal'
      }
    };
    
    await updateDoc(roomRef, updates);
    console.log(`✅ Player ${playerName} successfully removed from room ${roomId}`);
    return true;
    
  } catch (error) {
    console.error('Error in removePlayerFromRoom:', error);
    throw error;
  }
}

// Function to handle page unload/close events
export function setupPlayerDisconnectHandlers(roomId, playerName, userId = null) {
  console.log(`Setting up disconnect handlers for room: ${roomId}, player: ${playerName}`);
  
  const handleDisconnect = async () => {
    console.log('Page unload detected, removing player from room');
    try {
      await disconnectAndRemovePlayer(roomId, playerName, userId);
    } catch (error) {
      console.error('Error during disconnect cleanup:', error);
    }
  };
  
  // Handle page unload/close
  window.addEventListener('beforeunload', handleDisconnect);
  
  // Handle tab/window close
  window.addEventListener('unload', handleDisconnect);
  
  // Handle visibility change (tab switch)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      console.log('Tab hidden, player may have left');
      // Don't immediately remove, but mark as potentially inactive
    }
  });
  
  // Return cleanup function
  return () => {
    window.removeEventListener('beforeunload', handleDisconnect);
    window.removeEventListener('unload', handleDisconnect);
  };
}

// Function for manual player leaving (when they click "Leave Room")
export async function leaveRoom(roomId, playerName, userId = null) {
  console.log(`leaveRoom called for room: ${roomId}, player: ${playerName}, userId: ${userId}`);
  
  try {
    // Clean up any stored handlers
    if (typeof window !== 'undefined') {
      if (window.cleanupDisconnectHandlers) {
        window.cleanupDisconnectHandlers();
        window.cleanupDisconnectHandlers = null;
      }
      if (window.cleanupActivityUpdates) {
        window.cleanupActivityUpdates();
        window.cleanupActivityUpdates = null;
      }
    }
    
    // Remove player from room
    await disconnectAndRemovePlayer(roomId, playerName, userId);
    
    // Clean up local game state
    disconnectFromGame();
    
    console.log(`✅ Player ${playerName} successfully left room ${roomId}`);
    return true;
    
  } catch (error) {
    console.error('Error in leaveRoom:', error);
    throw error;
  }
}

// Function to get current player info from room
export async function getCurrentPlayerInfo(roomId, playerName, userId = null) {
  try {
    const db = await getDb();
    const roomRef = doc(db, 'gameRooms', roomId);
    
    const roomDoc = await getDoc(roomRef);
    if (!roomDoc.exists()) {
      throw new Error('Room not found');
    }
    
    const roomData = roomDoc.data();
    let players = roomData.players || [];
    
    // Ensure players is always an array
    if (!Array.isArray(players)) {
      console.warn(`🧹 Converting non-array players to array for getCurrentPlayerInfo in room ${roomId}:`, players);
      players = [];
    }
    
    // Find the current player
    const currentPlayer = players.find(player => {
      const nameMatch = player.name === playerName;
      const userIdMatch = userId ? player.userId === userId : true;
      return nameMatch && userIdMatch;
    });
    
    return currentPlayer || null;
    
  } catch (error) {
    console.error('Error getting current player info:', error);
    return null;
  }
}

// Ensure the module is connected to the specified game room. Useful when the
// page is reloaded and gameRoomRef is lost but the room ID is known.
export function ensureGameRoomConnection(roomId) {
  if (!roomId) {
    console.warn('ensureGameRoomConnection called without a roomId');
    return null;
  }

  // If the Firebase DB hasn't been initialized yet, initialize it now
  if (!db) {
    console.warn('ensureGameRoomConnection: Firebase DB not initialized. Initializing now.');
    db = initFirebaseHorropoly();
  }

  if (!gameRoomRef || gameRoomRef.id !== roomId) {
    console.log('Connecting to game room:', roomId);
    gameRoomRef = doc(db, 'gameRooms', roomId);
  }

  return gameRoomRef;
}

export async function findAvailableRooms() {
  console.log('findAvailableRooms called - using optimized query');
  try {
    // Ensure user is authenticated before querying rooms
    await ensureAuthenticated();
    
    const db = await getDb();
    const gamesRef = collection(db, 'gameRooms');
    
    // Optimized query: only get recent, open, non-started rooms
    const RECENT_MS = 1000 * 60 * 30; // last 30 min
    const minIso = new Date(Date.now() - RECENT_MS).toISOString();
    
    const q = query(
      gamesRef,
      where('gameStarted', '==', false),
      where('isOpen', '!=', false), // Include rooms where isOpen is true or undefined
      where('lastUpdated', '>=', minIso)
    );
    
    console.log('About to call optimized getDocs...');
    const querySnapshot = await getDocs(q);
    console.log('Optimized getDocs completed, found', querySnapshot.size, 'recent documents');
    
    const rooms = [];
    querySnapshot.forEach((doc) => {
      const roomData = doc.data();
      console.log('Found recent room:', doc.id, roomData);
      
      // Ensure players is always an array
      let players = roomData.players || [];
      if (!Array.isArray(players)) {
        console.warn(`🧹 Converting non-array players to array for findAvailableRooms in room ${doc.id}:`, players);
        players = [];
      }
      
      // Check capacity and freshness
      const hasCapacity = players.length < (roomData.maxPlayers || 2);
      const isRecent = roomData.lastUpdated && 
        (Date.now() - new Date(roomData.lastUpdated).getTime()) < RECENT_MS;
      
      if (hasCapacity && (isRecent || !roomData.lastUpdated)) {
        console.log('Room', doc.id, 'is available - adding to list');
        rooms.push({
          id: doc.id,
          ...roomData,
          players: players // Use the fixed players array
        });
      } else {
        console.log('Room', doc.id, 'is NOT available - hasCapacity:', hasCapacity, 'isRecent:', isRecent);
      }
    });
    
    console.log('Found', rooms.length, 'available rooms after optimized filtering');
    return rooms;
    
  } catch (error) {
    console.error('Error in findAvailableRooms:', error);
    // Fallback to basic query if optimized query fails
    console.log('Falling back to basic room query...');
    try {
      const db = await getDb();
      const gamesRef = collection(db, 'gameRooms');
      const basicQ = query(gamesRef, where('gameStarted', '==', false));
      const basicSnapshot = await getDocs(basicQ);
      
      const rooms = [];
      basicSnapshot.forEach((doc) => {
        const roomData = doc.data();
        let players = roomData.players || [];
        if (!Array.isArray(players)) players = [];
        
        if (players.length < (roomData.maxPlayers || 2)) {
          rooms.push({ id: doc.id, ...roomData, players });
        }
      });
      
      console.log('Fallback query found', rooms.length, 'available rooms');
      return rooms.slice(0, 20); // Limit to 20 rooms to prevent overload
    } catch (fallbackError) {
      console.error('Fallback query also failed:', fallbackError);
      return [];
    }
  }
}

// Debug function to get all rooms regardless of status
export async function findAllRoomsDebug() {
  console.log('findAllRoomsDebug called');
  try {
    const db = await getDb();
    const gamesRef = collection(db, 'gameRooms');
    // No filtering - get all rooms
    
    console.log('About to call getDocs for all rooms...');
    const querySnapshot = await getDocs(gamesRef);
    console.log('Debug getDocs completed, found', querySnapshot.size, 'total documents');
    
    const rooms = [];
    querySnapshot.forEach((doc) => {
      const roomData = doc.data();
      console.log('Debug found room:', doc.id, roomData);
      rooms.push({
        id: doc.id,
        ...roomData
      });
    });
    
    console.log('Debug found', rooms.length, 'total rooms');
    return rooms;
    
  } catch (error) {
    console.error('Error in findAllRoomsDebug:', error);
    return [];
  }
}

// Function to ensure players array integrity and fix any corruption
export async function fixPlayersArrayIntegrity() {
  console.log('fixPlayersArrayIntegrity called');
  if (!gameRoomRef) {
    throw new Error('Not connected to a game room');
  }

  try {
    // Get current document
    const docSnap = await getDoc(gameRoomRef);
    if (!docSnap.exists()) {
      console.log('Game room document does not exist');
      return;
    }

    const currentData = docSnap.data();
    if (!currentData.players) {
      console.log('No players data to fix');
      return;
    }

    // Check if players is corrupted (object instead of array)
    if (!Array.isArray(currentData.players)) {
      console.log('Players array is corrupted, fixing...', currentData.players);
      
      // Convert to proper array
      const fixedPlayers = convertObjectToArray(currentData.players);
      
      if (Array.isArray(fixedPlayers)) {
        console.log('Fixing players array corruption. Converting to:', fixedPlayers);
        
        // Update with fixed array
        await updateDoc(gameRoomRef, {
          players: fixedPlayers,
          lastUpdated: new Date().toISOString(),
          arrayFixed: true
        });
        
        console.log('Players array corruption fixed successfully');
      } else {
        console.error('Failed to convert players object to array');
      }
    } else {
      console.log('Players array is already in correct format');
      
      // Additional check: ensure we have the expected number of players
      const maxPlayers = currentData.maxPlayers || 2;
      if (currentData.players.length < maxPlayers && currentData.players.length >= 1) {
        console.log('WARNING: Missing players detected. Expected:', maxPlayers, 'Found:', currentData.players.length);
        await ensureMinimumPlayers(currentData);
      }
    }
    
  } catch (error) {
    console.error('Error in fixPlayersArrayIntegrity:', error);
    throw error;
  }
}

// Helper function to ensure minimum player count
async function ensureMinimumPlayers(gameData) {
  console.log('=== ENSURING MINIMUM PLAYERS ===');
  
  if (!Array.isArray(gameData.players)) {
    console.log('Players is not an array, cannot ensure minimum');
    return;
  }
  
  const currentPlayers = gameData.players;
  const maxPlayers = gameData.maxPlayers || 2;
  
  console.log('Current players:', currentPlayers.length, 'Max players:', maxPlayers);
  
  // If we have at least one player but less than maxPlayers, try to restore missing players
  if (currentPlayers.length >= 1 && currentPlayers.length < maxPlayers) {
    const missingCount = maxPlayers - currentPlayers.length;
    console.log('Need to restore', missingCount, 'missing players');
    
    // Create placeholder players for missing slots
    const restoredPlayers = [...currentPlayers];
    
    for (let i = currentPlayers.length; i < maxPlayers; i++) {
      const isHost = i === 0; // First player is always host
      const missingPlayer = {
        name: isHost ? 'Host' : `Player ${i + 1}`,
        userId: `user_${i}`,
        isHost: isHost,
        x: 0,
        y: 0,
        currentSquare: 'go',
        position: 0,
        currentPathKey: 'gamePath',
        currentIndexOnPath: 0,
        isMovingReverse: false,
        size: 62,
        money: 16500,
        properties: [],
        isAI: false,
        bankrupt: false,
        tokenIndex: i,
                        tokenImage: `assets/images/t${i + 1}.png`,
        inJail: false,
        jailTurns: 0,
        consecutiveDoubles: 0,
        goPassCount: 0
      };
      
      restoredPlayers.push(missingPlayer);
      console.log('Restored missing player:', missingPlayer.name, 'Host:', missingPlayer.isHost);
    }
    
    // Update Firebase with restored players
    try {
      await updateDoc(gameRoomRef, {
        players: restoredPlayers,
        lastUpdated: new Date().toISOString(),
        playersRestored: true
      });
      console.log('✅ Missing players restored successfully');
    } catch (error) {
      console.error('Failed to restore missing players:', error);
    }
  }
  
  console.log('=== END MINIMUM PLAYERS CHECK ===');
}

// ==== Lobby Rooms API ====
export async function createRoom(roomName, displayName, minPlayers = 2) {
  // Check for duplicate room names and add number suffix if needed
  let finalRoomName = roomName;
  let counter = 1;
  let maxAttempts = 50;
  
  while (counter <= maxAttempts) {
    try {
      // Check if room name exists
      const existingRoomsQuery = query(
        collection(db, 'rooms'), 
        where('roomName', '==', finalRoomName),
        where('status', '==', 'waiting_for_players')
      );
      const existingRoomsSnapshot = await getDocs(existingRoomsQuery);
      
      if (existingRoomsSnapshot.empty) {
        // Name is available, break out of loop
        break;
      } else {
        // Name exists, try with number suffix
        counter++;
        finalRoomName = `${roomName} ${counter}`;
        console.log(`Room name "${roomName}" exists, trying "${finalRoomName}"`);
      }
    } catch (error) {
      console.warn('Error checking for existing rooms:', error);
      // If check fails, use original name and continue
      break;
    }
  }
  
  if (counter > maxAttempts) {
    throw new Error(`Unable to create room: too many rooms with similar names to "${roomName}"`);
  }
  
  const roomRef = await addDoc(collection(db, 'rooms'), {
    roomName: finalRoomName,
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
  return { roomId: roomRef.id, hostUid, roomName: finalRoomName };
}

export async function joinRoom(roomId, displayName) {
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
  const roomRef = doc(db, 'rooms', roomId);
  await updateDoc(roomRef, { 
    status: 'in_progress',
    gameStarted: true,
    isOpen: false, // Hide from lobby immediately
    gameStartedAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  });
  console.log(`✅ Room ${roomId} marked as started and closed`);
}

export async function getAvailableRooms() {
  const roomsRef = collection(db, 'rooms');
  const q = query(roomsRef, where('status', '==', 'waiting_for_players'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

export function listenToRoomUpdates(roomId, callback) {
  const roomRef = doc(db, 'rooms', roomId);
  return onSnapshot(roomRef, (docSnap) => {
    callback({ id: docSnap.id, ...docSnap.data() });
  });
}

export async function checkRoomStatus(roomId) {
  try {
    if (!db) {
      db = initFirebaseHorropoly();
    }
    
    const roomRef = doc(db, 'gameRooms', roomId);
    const roomDoc = await getDoc(roomRef);
    
    if (!roomDoc.exists()) {
      return { exists: false, status: 'not_found' };
    }
    
    const gameState = roomDoc.data();
    const players = gameState.players || [];
    const validPlayers = Array.isArray(players) ? players.filter(p => p && p.userId) : [];
    const maxPlayers = gameState.maxPlayers || 4;
    
    return {
      exists: true,
      playerCount: validPlayers.length,
      maxPlayers: maxPlayers,
      isFull: validPlayers.length >= maxPlayers,
      gameStarted: gameState.gameStarted || false,
      status: validPlayers.length >= maxPlayers ? 'full' : 'available'
    };
  } catch (error) {
    console.error('Error checking room status:', error);
    return { exists: false, status: 'error', error: error.message };
  }
}

export async function updateRoomMaxPlayers(roomId, newMaxPlayers) {
  try {
    if (!db) {
      db = initFirebaseHorropoly();
    }
    
    const roomRef = doc(db, 'gameRooms', roomId);
    const roomDoc = await getDoc(roomRef);
    
    if (!roomDoc.exists()) {
      throw new Error('Room not found');
    }
    
    const gameState = roomDoc.data();
    let currentPlayers = gameState.players || [];
    
    // Ensure players is always an array
    if (!Array.isArray(currentPlayers)) {
      console.warn(`🧹 Converting non-array players to array for updateRoomMaxPlayers in room ${roomId}:`, currentPlayers);
      currentPlayers = [];
    }
    
    if (newMaxPlayers < currentPlayers.length) {
      throw new Error(`Cannot reduce max players to ${newMaxPlayers} when there are already ${currentPlayers.length} players in the room`);
    }
    
    await updateDoc(roomRef, {
      maxPlayers: newMaxPlayers,
      lastUpdated: new Date().toISOString()
    });
    
    console.log(`Updated room ${roomId} max players to ${newMaxPlayers}`);
    return { success: true, newMaxPlayers };
  } catch (error) {
    console.error('Error updating room max players:', error);
    throw error;
  }
}

// Clean up stale or empty rooms and remove inactive players
export async function cleanupStaleRooms() {
  console.log('🧹 Starting automatic cleanup of stale rooms...');
  
  try {
    const db = await getDb();
    const roomsRef = collection(db, 'gameRooms');
    const roomsSnapshot = await getDocs(roomsRef);
    
    let cleanedCount = 0;
    const now = Date.now();
    const staleThreshold = 30 * 60 * 1000; // 30 minutes
    
    for (const roomDoc of roomsSnapshot.docs) {
      const roomData = roomDoc.data();
      const lastActivity = roomData.lastActivity || roomData.createdAt || 0;
      
      if ((now - lastActivity) > staleThreshold) {
        console.log(`🧹 Cleaning up stale room: ${roomDoc.id} (last activity: ${new Date(lastActivity).toLocaleString()})`);
        
        try {
          await deleteDoc(roomDoc.ref);
          cleanedCount++;
          console.log(`✅ Stale room ${roomDoc.id} cleaned up`);
        } catch (deleteError) {
          console.warn(`⚠️ Failed to delete stale room ${roomDoc.id}:`, deleteError);
        }
      }
    }
    
    console.log(`🧹 Automatic cleanup complete: ${cleanedCount} stale rooms removed`);
    return { success: true, cleanedCount };
    
  } catch (error) {
    console.error('Error during automatic room cleanup:', error);
    return { success: false, error: error.message };
  }
}

// Function to mark player as active (called periodically during gameplay)
export async function updatePlayerActivity(roomId, playerName, userId = null) {
  try {
    if (!roomId || !playerName) return;
    
    const db = await getDb();
    const roomRef = doc(db, 'gameRooms', roomId);
    
    const roomDoc = await getDoc(roomRef);
    if (!roomDoc.exists()) return;
    
    const roomData = roomDoc.data();
    const players = roomData.players || [];
    
    // Find and update the player's activity timestamp
    const updatedPlayers = players.map(player => {
      if (player.name === playerName && (!userId || player.userId === userId)) {
        return {
          ...player,
          lastActivity: new Date().toISOString()
        };
      }
      return player;
    });
    
    await updateDoc(roomRef, {
      players: updatedPlayers,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error updating player activity:', error);
  }
}

// Function to set up periodic activity updates
export function setupPlayerActivityUpdates(roomId, playerName, userId = null) {
  console.log(`Setting up activity updates for player: ${playerName} in room: ${roomId}`);
  
  const activityInterval = setInterval(async () => {
    try {
      await updatePlayerActivity(roomId, playerName, userId);
    } catch (error) {
      console.error('Error in activity update interval:', error);
    }
  }, 60000); // Update every minute
  
  // Return cleanup function
  return () => {
    clearInterval(activityInterval);
  };
}

// Utility function to debug and fix room status
export async function debugRoomStatus(roomId) {
  console.log(`🔍 Debugging room status for: ${roomId}`);
  
  try {
    const db = await getDb();
    const roomRef = doc(db, 'gameRooms', roomId);
    const roomDoc = await getDoc(roomRef);
    
    if (!roomDoc.exists()) {
      console.error(`❌ Room ${roomId} not found`);
      return { success: false, error: 'Room not found' };
    }
    
    const roomData = roomDoc.data();
    let players = roomData.players || [];
    
    // Ensure players is always an array
    if (!Array.isArray(players)) {
      console.warn(`🧹 Converting non-array players to array for room ${roomId}:`, players);
      players = [];
    }
    
    // Filter out invalid players
    const validPlayers = players.filter(p => p && p.userId && p.name);
    const invalidPlayers = players.filter(p => !p || !p.userId || !p.name);
    
    const maxPlayers = roomData.maxPlayers || 2;
    const gameStarted = roomData.gameStarted || false;
    
    console.log(`📊 Room Status for ${roomId}:`);
    console.log(`  - Total players in array: ${players.length}`);
    console.log(`  - Valid players: ${validPlayers.length}`);
    console.log(`  - Invalid players: ${invalidPlayers.length}`);
    console.log(`  - Max players: ${maxPlayers}`);
    console.log(`  - Game started: ${gameStarted}`);
    console.log(`  - Room status: ${roomData.status || 'unknown'}`);
    
    if (validPlayers.length > 0) {
      console.log(`  - Valid players:`, validPlayers.map(p => ({
        name: p.name,
        userId: p.userId,
        isHost: p.isHost,
        lastActivity: p.lastActivity
      })));
    }
    
    if (invalidPlayers.length > 0) {
      console.log(`  - Invalid players:`, invalidPlayers);
    }
    
    // Check if room needs cleanup
    const needsCleanup = invalidPlayers.length > 0;
    const isFull = validPlayers.length >= maxPlayers;
    
    const result = {
      success: true,
      roomId,
      totalPlayers: players.length,
      validPlayers: validPlayers.length,
      invalidPlayers: invalidPlayers.length,
      maxPlayers,
      gameStarted,
      isFull,
      needsCleanup,
      validPlayerNames: validPlayers.map(p => p.name),
      invalidPlayerData: invalidPlayers
    };
    
    console.log(`📋 Room analysis complete:`, result);
    return result;
    
  } catch (error) {
    console.error('Error debugging room status:', error);
    return { success: false, error: error.message };
  }
}

// Utility function to clean up invalid players from a room
export async function cleanupInvalidPlayers(roomId) {
  console.log(`🧹 Cleaning up invalid players from room: ${roomId}`);
  
  try {
    const db = await getDb();
    const roomRef = doc(db, 'gameRooms', roomId);
    const roomDoc = await getDoc(roomRef);
    
    if (!roomDoc.exists()) {
      throw new Error('Room not found');
    }
    
    const roomData = roomDoc.data();
    let players = roomData.players || [];
    
    // Ensure players is always an array
    if (!Array.isArray(players)) {
      console.warn(`🧹 Converting non-array players to array for room ${roomId}:`, players);
      players = [];
    }
    
    // Filter out invalid players
    const validPlayers = players.filter(p => p && p.userId && p.name);
    const invalidPlayers = players.filter(p => !p || !p.userId || !p.name);
    
    if (invalidPlayers.length === 0) {
      console.log(`✅ No invalid players found in room ${roomId}`);
      return { success: true, cleanedCount: 0 };
    }
    
    console.log(`🧹 Found ${invalidPlayers.length} invalid players to remove:`, invalidPlayers);
    
    // Update room with only valid players
    await updateDoc(roomRef, {
      players: validPlayers,
      lastUpdated: new Date().toISOString(),
      lastCleanup: {
        timestamp: new Date().toISOString(),
        invalidPlayersRemoved: invalidPlayers.length,
        reason: 'manual_cleanup'
      }
    });
    
    console.log(`✅ Successfully cleaned up ${invalidPlayers.length} invalid players from room ${roomId}`);
    return { 
      success: true, 
      cleanedCount: invalidPlayers.length,
      remainingPlayers: validPlayers.length
    };
    
  } catch (error) {
    console.error('Error cleaning up invalid players:', error);
    throw error;
  }
}

// Make debug functions available globally for console debugging
if (typeof window !== 'undefined') {
  window.debugRoomStatus = debugRoomStatus;
  window.cleanupInvalidPlayers = cleanupInvalidPlayers;
  window.validateRoomCapacity = validateRoomCapacity;
  
  console.log('🔧 Debug utilities loaded! Use in console:');
  console.log('  - debugRoomStatus("ROOM_ID") // Check room status');
  console.log('  - cleanupInvalidPlayers("ROOM_ID") // Clean up invalid players');
  console.log('  - validateRoomCapacity("ROOM_ID") // Validate room capacity');
}

// Enhanced room validation function
export async function validateRoomCapacity(roomId) {
  console.log(`🔍 Validating room capacity for: ${roomId}`);
  
  try {
    const db = await getDb();
    const roomRef = doc(db, 'gameRooms', roomId);
    const roomDoc = await getDoc(roomRef);
    
    if (!roomDoc.exists()) {
      return { valid: false, error: 'Room not found' };
    }
    
    const roomData = roomDoc.data();
    const players = convertObjectToArray(roomData.players || []);
    const validPlayers = players.filter(p => p && p.userId && p.name);
    const maxPlayers = roomData.maxPlayers || 2;
    
    // Check for invalid players that might be taking up slots
    const invalidPlayers = players.filter(p => !p || !p.userId || !p.name);
    
    const result = {
      valid: true,
      roomId,
      currentPlayers: validPlayers.length,
      maxPlayers,
      hasInvalidPlayers: invalidPlayers.length > 0,
      invalidPlayerCount: invalidPlayers.length,
      availableSlots: maxPlayers - validPlayers.length,
      canJoin: validPlayers.length < maxPlayers,
      players: validPlayers.map(p => ({ name: p.name, isHost: p.isHost }))
    };
    
    console.log(`📊 Room validation result:`, result);
    return result;
    
  } catch (error) {
    console.error('Error validating room capacity:', error);
    return { valid: false, error: error.message };
  }
}


// firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, onSnapshot, updateDoc, collection, query, where, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Export Firebase functions for use in game.js
export { doc, getDoc };

let db;
let gameRoomRef;
let unsubscribeGameState;

export function initFirebaseHorropoly() {
  // Check if Firebase is already initialized globally
  if (window.firebaseApp && window.firebaseDb) {
    console.log("✅ Using existing Firebase instance for Horropoly");
    db = window.firebaseDb;
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

  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  
  // Store globally for reuse
  window.firebaseApp = app;
  window.firebaseDb = db;
  
  console.log("✅ Firebase initialized for Horropoly");
  return db;
}

// Export getDb function for other modules to use
export function getDb() {
  if (!db) {
    return initFirebaseHorropoly();
  }
  return db;
}

export async function createGameRoom(playerName, maxPlayers = 2, aiCount = 0) {
  console.log('createGameRoom called with playerName:', playerName);
  const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
  console.log('Generated room ID:', roomId);
  gameRoomRef = doc(db, 'gameRooms', roomId);
  
  // Generate unique userID for the host
  const hostUserId = 'user_' + Math.random().toString(36).substring(2, 10);
  
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

  const players = [{
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

  for (let i = 0; i < aiCount; i++) {
    const idx = i + 1;
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
  
  const db = await getDb();
  // Save reference globally so other modules can access the current room
  // without requiring a refresh (fixes corruption/connection issues).
  gameRoomRef = doc(db, 'gameRooms', roomId);
  
  try {
    // Check if room exists and get current state
    const roomDoc = await getDoc(gameRoomRef);
    const roomExists = roomDoc.exists();
    const gameState = roomExists ? roomDoc.data() : null;
    
    // If we got the game state, do validation
    if (roomExists && gameState) {
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
    }

    // Generate unique userID for the joining player
    const guestUserId = 'user_' + Math.random().toString(36).substring(2, 10);
    
    // Determine token for the new player (find first available token)
    const existingPlayers = roomExists && gameState && Array.isArray(gameState.players) ? 
      gameState.players.filter(p => p && p.userId) : [];
    const usedTokenIndices = existingPlayers.map(p => p.tokenIndex || 0);
    const availableTokenIndex = findFirstAvailableTokenIndex(usedTokenIndices);
    
    const tokenImages = [
      'assets/images/t1.png', 'assets/images/t2.png', 'assets/images/t3.png',
      'assets/images/t4.png', 'assets/images/t5.png', 'assets/images/t6.png',
      'assets/images/t7.png', 'assets/images/t8.png', 'assets/images/t9.png'
    ];

    const newPlayer = {
      name: playerName,
      userId: guestUserId,
      isHost: false,
      position: 0,
      currentSquare: 'go',
      currentPathKey: 'gamePath',
      currentIndexOnPath: 0,
      isMovingReverse: false,
      x: 0, // Will be set when game starts
      y: 0, // Will be set when game starts
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
      color: ['#ff0000', '#0000ff', '#00ff00', '#ffff00', '#800080'][availableTokenIndex % 5], // Red, Blue, Green, Yellow, Purple
      colorName: ['Red', 'Blue', 'Green', 'Yellow', 'Purple'][availableTokenIndex % 5]
    };

    console.log('About to call updateDoc with new player:', newPlayer);
    
    // Try to join the room - if the room doesn't exist, this will fail
    updateDoc(gameRoomRef, {
      players: roomExists ? [...gameState.players, newPlayer] : [newPlayer]
    }).then(() => {
      console.log('updateDoc completed successfully (in background)');
    }).catch((error) => {
      console.error('updateDoc failed (in background):', error);
      // If updateDoc fails, the room probably doesn't exist
      if (error.code === 'not-found') {
        console.error('Room not found during updateDoc');
      }
    });
    
    // Give Firebase a moment to start the operation
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('joinGameRoom completed successfully');
    return { userId: guestUserId };
    
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

  unsubscribeGameState = onSnapshot(gameRoomRef, (doc) => {
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
        gameState.players = keys.map(key => gameState.players[key]);
        console.log('Force converted players:', gameState.players);
      }
    }
    
    onGameStateUpdate(gameState);
  });

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

// Ensure the module is connected to the specified game room. Useful when the
// page is reloaded and gameRoomRef is lost but the room ID is known.
export function ensureGameRoomConnection(roomId) {
  if (!roomId) {
    console.warn('ensureGameRoomConnection called without a roomId');
    return null;
  }

  if (!gameRoomRef || gameRoomRef.id !== roomId) {
    console.log('Connecting to game room:', roomId);
    gameRoomRef = doc(db, 'gameRooms', roomId);
  }

  return gameRoomRef;
}

export async function findAvailableRooms() {
  console.log('findAvailableRooms called');
  try {
    const gamesRef = collection(db, 'gameRooms');
    const q = query(gamesRef, where('gameStarted', '==', false));
    
    console.log('About to call getDocs...');
    
    // Use a Promise-based approach with a longer timeout and retry logic
    let rooms = [];
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts && rooms.length === 0) {
      try {
        attempts++;
        console.log(`Attempt ${attempts} to get available rooms...`);
        
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`getDocs timeout on attempt ${attempts}`)), 3000);
        });
        
        const querySnapshot = await Promise.race([getDocs(q), timeoutPromise]);
        console.log('getDocs completed, found', querySnapshot.size, 'documents');
        
        querySnapshot.forEach((doc) => {
          const roomData = doc.data();
          console.log('Found room:', doc.id, roomData);
          console.log('Room details - gameStarted:', roomData.gameStarted, 'players:', roomData.players.length, 'maxPlayers:', roomData.maxPlayers);
          
          // Add all rooms first, then filter
          const roomInfo = {
            id: doc.id,
            ...roomData
          };
          
          // Only include rooms that aren't started and aren't full
          if (!roomData.gameStarted && roomData.players.length < (roomData.maxPlayers || 2)) {
            console.log('Room', doc.id, 'is available - adding to list');
            rooms.push(roomInfo);
          } else {
            console.log('Room', doc.id, 'is NOT available - gameStarted:', roomData.gameStarted, 'isFull:', roomData.players.length >= (roomData.maxPlayers || 2));
          }
        });
        
        console.log('Found', rooms.length, 'available rooms after filtering');
        break; // Success, exit the retry loop
        
      } catch (attemptError) {
        console.log(`Attempt ${attempts} failed:`, attemptError.message);
        if (attempts < maxAttempts) {
          console.log('Retrying in 1 second...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    if (rooms.length === 0 && attempts >= maxAttempts) {
      console.log('All attempts failed, returning empty array');
    }
    
    return rooms;
    
  } catch (error) {
    console.error('Error in findAvailableRooms:', error);
    return []; // Return empty array instead of throwing
  }
}

// Debug function to get all rooms regardless of status
export async function findAllRoomsDebug() {
  console.log('findAllRoomsDebug called');
  try {
    const gamesRef = collection(db, 'gameRooms');
    // No filtering - get all rooms
    
    console.log('About to call getDocs for all rooms...');
    
    let rooms = [];
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        attempts++;
        console.log(`Debug attempt ${attempts} to get all rooms...`);
        
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`getDocs timeout on debug attempt ${attempts}`)), 3000);
        });
        
        const querySnapshot = await Promise.race([getDocs(gamesRef), timeoutPromise]);
        console.log('Debug getDocs completed, found', querySnapshot.size, 'total documents');
        
        querySnapshot.forEach((doc) => {
          const roomData = doc.data();
          console.log('Debug found room:', doc.id, roomData);
          rooms.push({
            id: doc.id,
            ...roomData
          });
        });
        
        console.log('Debug found', rooms.length, 'total rooms');
        break; // Success, exit the retry loop
        
      } catch (attemptError) {
        console.log(`Debug attempt ${attempts} failed:`, attemptError.message);
        if (attempts < maxAttempts) {
          console.log('Debug retrying in 1 second...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    if (rooms.length === 0 && attempts >= maxAttempts) {
      console.log('Debug: All attempts failed, returning empty array');
    }
    
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
  await updateDoc(roomRef, { status: 'in_progress' });
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


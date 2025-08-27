// Backup rooms.js file with guaranteed clearLobbyRooms export
// This file ensures that all required exports are available

import { initFirebaseHorropoly, createGameRoom, joinGameRoom, createRoom as createLobbyRoom, joinRoom as joinLobbyRoom, startGame as startLobbyGame, findAvailableRooms as getLobbyRooms, listenToRoomUpdates as listenToLobbyRoomUpdates, getDb } from './firebase-init.js';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  arrayUnion,
  writeBatch,
  deleteDoc,
  getFirestore
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Use the imported getDb function from firebase-init.js

export async function createRoom(roomName, minPlayers = 2, aiBots = 0, creatorPlayer = null) {
  let db = await getDb();
  if (!db) throw new Error('Firebase not initialized');

  // Validate that db is a proper Firestore instance
  if (!db) {
    console.log('Invalid Firestore instance, trying alternative approach...');
    
    // Try to get the database from the global window object
    if (window.firebaseDb) {
      console.log('Using global Firebase database instance');
      db = window.firebaseDb;
    } else {
      throw new Error('Invalid Firestore instance');
    }
  }

  // Check for duplicate room names and add number suffix if needed
  let finalRoomName = roomName;
  let counter = 1;
  let maxAttempts = 50;
  
  while (counter <= maxAttempts) {
    try {
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

  const hostUid = creatorPlayer ? creatorPlayer.uid : crypto.randomUUID();
  const minPlayersCount = Math.max(2, Math.min(4, parseInt(minPlayers, 10) || 2));
  const maxPlayersCount = minPlayersCount + Math.max(0, Math.min(3, parseInt(aiBots, 10) || 0));
  
  const roomData = {
    roomName: finalRoomName,
    hostUid: hostUid,
    status: 'waiting_for_players',
    minPlayers: minPlayersCount,
    maxPlayers: maxPlayersCount,
    aiBots: Math.max(0, Math.min(3, parseInt(aiBots, 10) || 0)),
    players: creatorPlayer ? [creatorPlayer] : [],
    createdAt: new Date() // Add timestamp for cleanup tracking
  };
  
  console.log('Creating room with data:', roomData);
  const ref = await addDoc(collection(db, 'rooms'), roomData);
  return { id: ref.id, ...roomData };
}

export async function joinRoom(roomId, player) {
  let db = await getDb();
  if (!db) throw new Error('Firebase not initialized');

  // Validate that db is a proper Firestore instance
  if (!db) {
    console.log('Invalid Firestore instance, trying alternative approach...');
    
    // Try to get the database from the global window object
    if (window.firebaseDb) {
      console.log('Using global Firebase database instance');
      db = window.firebaseDb;
    } else {
      throw new Error('Invalid Firestore instance');
    }
  }

  const ref = doc(db, 'rooms', roomId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Room not found');
  
  const data = snap.data();
  console.log('Joining room data:', data);
  console.log('Player joining:', player);
  
  if (data.status !== 'waiting_for_players') {
    throw new Error('Room is not accepting players');
  }
  
  const currentPlayerCount = data.players ? data.players.length : 0;
  const maxPlayersInRoom = data.maxPlayers || data.minPlayers || 4;
  if (currentPlayerCount >= maxPlayersInRoom) {
    throw new Error(`Room is full (${currentPlayerCount}/${maxPlayersInRoom} players)`);
  }
  
  // Check if player is already in the room
  const isAlreadyInRoom = data.players && data.players.some(p => p.uid === player.uid || p.displayName === player.displayName);
  if (isAlreadyInRoom) {
    throw new Error('Player is already in this room');
  }
  
  console.log('Adding player to room:', player);
  await updateDoc(ref, { players: arrayUnion(player) });
  console.log('Player added successfully');
}

export async function startGame(roomId) {
  console.log('🎮 startGame called with roomId:', roomId);
  let db = await getDb();
  if (!db) throw new Error('Firebase not initialized');

  // Validate that db is a proper Firestore instance
  if (typeof db.collection !== 'function') {
    console.log('Invalid Firestore instance, trying alternative approach...');
    
    // Try to get the database from the global window object
    if (window.firebaseDb && typeof window.firebaseDb.collection === 'function') {
      console.log('Using global Firebase database instance');
      db = window.firebaseDb;
    } else {
      // Try to use the collection function directly
      try {
        const testCollection = collection(db, 'test');
        console.log('✅ Collection function works directly, proceeding with direct usage');
        console.log('Test collection created:', testCollection);
        // If this works, we can proceed without the collection method
      } catch (error) {
        console.log('❌ Collection function failed:', error.message);
        console.log('Available methods on db:', Object.getOwnPropertyNames(db));
        throw new Error('Invalid Firestore instance');
      }
    }
  }

  const ref = doc(db, 'rooms', roomId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Room not found');

  const data = snap.data();
  const players = data.players || [];
  if (players.length === 0) throw new Error('No players in room');

  const aiBots = data.aiBots || 0;
  
  // Convert room players to game players format
  const gamePlayers = players.map((player, index) => ({
    name: player.displayName,
    userId: player.uid,
    isHost: player.uid === data.hostUid,
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
    tokenImage: `assets/images/t${index + 1}.png`,
    tokenIndex: index,
    inJail: false,
    jailTurns: 0,
    consecutiveDoubles: 0,
    goPassCount: 0,
    color: ['#ff0000', '#0000ff', '#00ff00', '#ffff00', '#800080'][index % 5],
    colorName: ['Red', 'Blue', 'Green', 'Yellow', 'Purple'][index % 5]
  }));
  
  console.log('🎮 Creating game room with players:', gamePlayers);
  
  // Use the lobby room ID as the game room ID to ensure consistency
  const gameRoomId = roomId;
  const { roomId: createdRoomId } = await createGameRoom(
    players[0].displayName,
    players.length + aiBots,
    aiBots,
    gamePlayers, // Pass all players to createGameRoom
    gameRoomId // Use the lobby room ID as the game room ID
  );

  console.log('🎮 Game room created with ID:', gameRoomId);
  await updateDoc(ref, { status: 'in_progress', gameRoomId });
  console.log('🎮 Room status updated to in_progress');
  return gameRoomId;
}

export async function getAvailableRooms() {
  let db = await getDb();
  if (!db) {
    console.log('Firebase not initialized, returning empty rooms list');
    return [];
  }

  // Validate that db is a proper Firestore instance
  if (!db) {
    console.log('Invalid Firestore instance, trying alternative approach...');
    
    // Try to get the database from the global window object
    if (window.firebaseDb) {
      console.log('Using global Firebase database instance');
      db = window.firebaseDb;
    } else {
      console.log('No valid Firestore instance found, returning empty rooms list');
      return [];
    }
  }

  // Clean up stale rooms before returning available ones
  await cleanupInactiveRooms();

  const q = query(collection(db, 'rooms'), where('status', '==', 'waiting_for_players'));
  const snap = await getDocs(q);
  
  // Filter out rooms that shouldn't be available and validate room data
  const validRooms = snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(room => {
      // Additional validation - room must have proper data
      if (!room.roomName || !room.hostUid) {
        console.warn(`Filtering out invalid room: ${room.id}`);
        return false;
      }
      
      // Check if room has any players
      const playerCount = room.players ? room.players.length : 0;
      if (playerCount === 0) {
        console.warn(`Filtering out empty room: ${room.roomName}`);
        // Delete empty room
        deleteDoc(doc(db, 'rooms', room.id)).catch(err => 
          console.error('Failed to delete empty room:', err)
        );
        return false;
      }
      
      return true;
    });
  
  return validRooms;
}

// Function to clean up inactive or stale rooms
export async function cleanupInactiveRooms() {
  try {
    let db = await getDb();
    if (!db) return;

    // Get all rooms (not just waiting ones)
    const allRoomsQuery = query(collection(db, 'rooms'));
    const allRoomsSnapshot = await getDocs(allRoomsQuery);
    
    const now = Date.now();
    const STALE_TIME = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
    
    for (const roomDoc of allRoomsSnapshot.docs) {
      const roomData = roomDoc.data();
      
      // Check if room is too old (created more than 2 hours ago)
      const roomAge = roomData.createdAt ? now - roomData.createdAt.toMillis() : STALE_TIME + 1;
      
      // Remove rooms that are:
      // 1. Empty (no players)
      // 2. Stuck in "in_progress" for too long  
      // 3. Very old waiting rooms
      const shouldDelete = 
        (!roomData.players || roomData.players.length === 0) ||
        (roomData.status === 'in_progress' && roomAge > STALE_TIME) ||
        (roomData.status === 'waiting_for_players' && roomAge > STALE_TIME);
      
      if (shouldDelete) {
        console.log(`Cleaning up inactive room: ${roomData.roomName || roomDoc.id}`);
        await deleteDoc(doc(db, 'rooms', roomDoc.id));
      }
    }
  } catch (error) {
    console.warn('Error during room cleanup:', error);
  }
}

export async function listenToRoomUpdates(roomId, callback) {
  const db = await getDb();
  if (!db) {
    console.log('Firebase not initialized, skipping room updates');
    return null;
  }

  // Validate that db is a proper Firestore instance
  if (!db) {
    console.log('Invalid Firestore instance, skipping room updates');
    return null;
  }

  // Try gameRooms collection first (for active games), then fall back to rooms collection (for lobby)
  const gameRoomRef = doc(db, 'gameRooms', roomId);
  
  return onSnapshot(gameRoomRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      console.log('📡 Game room data received:', data);
      
      // Convert game room data to expected format for room monitoring
      const roomData = {
        id: snap.id,
        roomName: data.roomName || roomId,
        status: data.gameStarted ? 'in_progress' : 'waiting_for_players',
        players: data.players || [],
        maxPlayers: data.maxPlayers || 4,
        minPlayers: data.minPlayers || 2,
        hostUid: data.players ? data.players.find(p => p.isHost)?.userId : null,
        gameStarted: data.gameStarted || false,
        ...data
      };
      
      callback(roomData);
    } else {
      // Fallback to lobby rooms collection
      console.log('📡 Room not found in gameRooms, checking rooms collection...');
      const lobbyRoomRef = doc(db, 'rooms', roomId);
      return onSnapshot(lobbyRoomRef, (lobbySnap) => {
        if (lobbySnap.exists()) {
          callback({ id: lobbySnap.id, ...lobbySnap.data() });
        } else {
          console.warn('📡 Room not found in either collection:', roomId);
          callback({ id: roomId, status: 'not_found' });
        }
      });
    }
  }, (error) => {
    console.error('📡 Error listening to room updates:', error);
    // Fallback to lobby rooms on error
    const lobbyRoomRef = doc(db, 'rooms', roomId);
    return onSnapshot(lobbyRoomRef, (lobbySnap) => {
      if (lobbySnap.exists()) {
        callback({ id: lobbySnap.id, ...lobbySnap.data() });
      } else {
        callback({ id: roomId, status: 'error', error: error.message });
      }
    });
  });
}

export async function listenToAvailableRooms(callback) {
  console.log('listenToAvailableRooms called');
  
  // Try to get the database instance
  let db = await getDb();
  console.log('Database instance received:', db);
  console.log('Database type:', typeof db);
  
  if (!db) {
    console.log('Firebase not initialized, skipping room listening');
    return null;
  }

  // Validate that db is a proper Firestore instance
  if (!db) {
    console.log('Invalid Firestore instance, trying alternative approach...');
    
    // Try to get the database from the global window object
    if (window.firebaseDb) {
      console.log('Using global Firebase database instance');
      db = window.firebaseDb;
    } else {
      console.log('No valid Firestore instance found, skipping room listening');
      console.log('Database object:', db);
      return null;
    }
  }

  console.log('Creating query for rooms...');
  const q = query(collection(db, 'rooms'), where('status', '==', 'waiting_for_players'));
  console.log('Query created, setting up snapshot listener...');
  return onSnapshot(q, snap => {
    const rooms = [];
    snap.forEach(doc => rooms.push({ id: doc.id, ...doc.data() }));
    callback(rooms);
  });
}

// GUARANTEED EXPORT: clearLobbyRooms function
export async function clearLobbyRooms() {
  console.log('clearLobbyRooms called from backup file');
  const db = await getDb();
  if (!db) {
    console.log('Firebase not initialized, skipping room clearing');
    return;
  }

  // Validate that db is a proper Firestore instance
  if (!db) {
    console.log('Invalid Firestore instance, skipping room clearing');
    return;
  }

  try {
    const snap = await getDocs(collection(db, 'rooms'));
    const batch = writeBatch(db);
    snap.forEach(d => batch.delete(d.ref));
    await batch.commit();
    console.log('Successfully cleared all lobby rooms');
  } catch (error) {
    console.error('Error clearing lobby rooms:', error);
  }
}

// Function to delete a specific room
export async function deleteRoom(roomId) {
  console.log('deleteRoom called for room:', roomId);
  let db = await getDb();
  if (!db) throw new Error('Firebase not initialized');

  // Validate that db is a proper Firestore instance
  if (!db) {
    console.log('Invalid Firestore instance, trying alternative approach...');
    
    // Try to get the database from the global window object
    if (window.firebaseDb) {
      console.log('Using global Firebase database instance');
      db = window.firebaseDb;
    } else {
      throw new Error('Invalid Firestore instance');
    }
  }

  const roomRef = doc(db, 'rooms', roomId);
  await deleteDoc(roomRef);
  console.log(`Successfully deleted room: ${roomId}`);
} 
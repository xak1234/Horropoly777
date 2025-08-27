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
  getFirestore
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Use the imported getDb function from firebase-init.js

export async function createRoom(roomName, minPlayers = 2, aiBots = 0) {
  const db = await getDb();
  if (!db) throw new Error('Firebase not initialized');

  // Validate that db is a proper Firestore instance
  if (typeof db.collection !== 'function') {
    throw new Error('Invalid Firestore instance');
  }

  const roomData = {
    roomName,
    hostUid: crypto.randomUUID(),
    status: 'waiting_for_players',
    minPlayers: Math.max(2, Math.min(4, parseInt(minPlayers, 10) || 2)),
    aiBots: Math.max(0, Math.min(3, parseInt(aiBots, 10) || 0)),
    players: []
  };
  const ref = await addDoc(collection(db, 'rooms'), roomData);
  return { id: ref.id, ...roomData };
}

export async function joinRoom(roomId, player) {
  const db = await getDb();
  if (!db) throw new Error('Firebase not initialized');

  // Validate that db is a proper Firestore instance
  if (typeof db.collection !== 'function') {
    throw new Error('Invalid Firestore instance');
  }

  const ref = doc(db, 'rooms', roomId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Room not found');
  const data = snap.data();
  if (
    data.status !== 'waiting_for_players' ||
    data.players.length >= data.minPlayers
  ) {
    throw new Error('Room not joinable');
  }
  await updateDoc(ref, { players: arrayUnion(player) });
}

export async function startGame(roomId) {
  const db = await getDb();
  if (!db) throw new Error('Firebase not initialized');

  // Validate that db is a proper Firestore instance
  if (typeof db.collection !== 'function') {
    throw new Error('Invalid Firestore instance');
  }

  const ref = doc(db, 'rooms', roomId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Room not found');

  const data = snap.data();
  const players = data.players || [];
  if (players.length === 0) throw new Error('No players in room');

  const aiBots = data.aiBots || 0;
  const { roomId: gameRoomId } = await createGameRoom(
    players[0].displayName,
    players.length + aiBots,
    aiBots
  );

  await updateDoc(ref, { status: 'in_progress', gameRoomId });
  return gameRoomId;
}

export async function getAvailableRooms() {
  let db = await getDb();
  if (!db) {
    console.log('Firebase not initialized, returning empty rooms list');
    return [];
  }

  // Validate that db is a proper Firestore instance
  if (typeof db.collection !== 'function') {
    console.log('Invalid Firestore instance, trying alternative approach...');
    
    // Try to get the database from the global window object
    if (window.firebaseDb && typeof window.firebaseDb.collection === 'function') {
      console.log('Using global Firebase database instance');
      db = window.firebaseDb;
    } else {
      console.log('No valid Firestore instance found, returning empty rooms list');
      return [];
    }
  }

  const q = query(collection(db, 'rooms'), where('status', '==', 'waiting_for_players'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function listenToRoomUpdates(roomId, callback) {
  const db = await getDb();
  if (!db) {
    console.log('Firebase not initialized, skipping room updates');
    return null;
  }

  // Validate that db is a proper Firestore instance
  if (typeof db.collection !== 'function') {
    console.log('Invalid Firestore instance, skipping room updates');
    return null;
  }

  const ref = doc(db, 'rooms', roomId);
  return onSnapshot(ref, snap => callback({ id: snap.id, ...snap.data() }));
}

export async function listenToAvailableRooms(callback) {
  console.log('listenToAvailableRooms called');
  
  // Try to get the database instance
  let db = await getDb();
  console.log('Database instance received:', db);
  console.log('Database type:', typeof db);
  console.log('Database has collection method:', typeof db?.collection);
  
  if (!db) {
    console.log('Firebase not initialized, skipping room listening');
    return null;
  }

  // Validate that db is a proper Firestore instance
  if (typeof db.collection !== 'function') {
    console.log('Invalid Firestore instance, trying alternative approach...');
    
    // Try to get the database from the global window object
    if (window.firebaseDb && typeof window.firebaseDb.collection === 'function') {
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
  if (typeof db.collection !== 'function') {
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
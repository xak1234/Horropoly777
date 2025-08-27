import { initFirebaseHorropoly, createGameRoom, joinGameRoom } from './firebase-init.js';
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
  writeBatch
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

let db = null;
let roomsCollection = null;

// Initialize Firebase and Firestore DB instance
function getDb() {
  if (!db) {
    db = initFirebaseHorropoly(); // This already returns Firestore instance
  }
  return db;
}

function getRoomsCollection() {
  if (!roomsCollection) {
    const db = getDb();
    if (db) {
      roomsCollection = collection(db, 'rooms');
    }
  }
  return roomsCollection;
}

export async function createRoom(roomName, minPlayers = 2, aiBots = 0) {
  const roomsCollection = getRoomsCollection();
  if (!roomsCollection) throw new Error('Firebase not initialized');

  const roomData = {
    roomName,
    hostUid: crypto.randomUUID(),
    status: 'waiting_for_players',
    minPlayers: Math.max(2, Math.min(4, parseInt(minPlayers, 10) || 2)),
    aiBots: Math.max(0, Math.min(3, parseInt(aiBots, 10) || 0)),
    players: []
  };
  const ref = await addDoc(roomsCollection, roomData);
  return { id: ref.id, ...roomData };
}

export async function joinRoom(roomId, player) {
  const db = getDb();
  if (!db) throw new Error('Firebase not initialized');

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
  const db = getDb();
  if (!db) throw new Error('Firebase not initialized');

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
  const roomsCollection = getRoomsCollection();
  if (!roomsCollection) {
    console.log('Firebase not initialized, returning empty rooms list');
    return [];
  }

  const q = query(roomsCollection, where('status', '==', 'waiting_for_players'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export function listenToRoomUpdates(roomId, callback) {
  const db = getDb();
  if (!db) {
    console.log('Firebase not initialized, skipping room updates');
    return null;
  }

  const ref = doc(db, 'rooms', roomId);
  return onSnapshot(ref, snap => callback({ id: snap.id, ...snap.data() }));
}

export function listenToAvailableRooms(callback) {
  const roomsCollection = getRoomsCollection();
  if (!roomsCollection) {
    console.log('Firebase not initialized, skipping room listening');
    return null;
  }

  const q = query(roomsCollection, where('status', '==', 'waiting_for_players'));
  return onSnapshot(q, snap => {
    const rooms = [];
    snap.forEach(doc => rooms.push({ id: doc.id, ...doc.data() }));
    callback(rooms);
  });
}

export async function clearLobbyRooms() {
  const roomsCollection = getRoomsCollection();
  const db = getDb();
  if (!roomsCollection || !db) {
    console.log('Firebase not initialized, skipping room clearing');
    return;
  }

  const snap = await getDocs(roomsCollection);
  const batch = writeBatch(db);
  snap.forEach(d => batch.delete(d.ref));
  await batch.commit();
}

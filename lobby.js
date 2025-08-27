import { initFirebaseHorropoly, createRoom, joinRoom, startGame, findAvailableRooms, listenToRoomUpdates } from './firebase-init.js';
import multiplayerPaywall from './multiplayer-paywall-system.js';

let currentRoomId = null;
let unsubscribeRoom = null;

function $(id) {
  return document.getElementById(id);
}

async function refreshRoomList() {
  const rooms = await findAvailableRooms();
  renderRoomList(rooms);
}

function renderRoomList(rooms) {
  const listEl = $('available-rooms');
  if (!listEl) return;
  listEl.innerHTML = '';
  rooms.forEach(room => {
    const players = Array.isArray(room.players) ? room.players : [];
    const li = document.createElement('li');
    li.textContent = `${room.roomName} (${players.length}/${room.minPlayers})`;
    const btn = document.createElement('button');
    btn.textContent = 'Join';
    btn.addEventListener('click', () => handleJoinRoom(room.id));
    li.appendChild(btn);
    listEl.appendChild(li);
  });
}

async function handleCreateRoom() {
  // Check if user has multiplayer access
  const hasAccess = await multiplayerPaywall.hasMultiplayerAccess();
  if (!hasAccess) {
    console.log('🔒 Multiplayer access required for room creation');
    multiplayerPaywall.showAccessDenied('create rooms');
    return;
  }

  const roomName = $('room-name').value.trim();
  const minPlayers = parseInt($('min-players').value, 10) || 2;
  const displayName = $('display-name').value.trim();
  if (!roomName || !displayName) return alert('Enter room and player name');
  const { roomId } = await createRoom(roomName, displayName, minPlayers);
  currentRoomId = roomId;
  await subscribeRoom(roomId);
}

async function handleJoinRoom(roomId) {
  // Check if user has multiplayer access
  const hasAccess = await multiplayerPaywall.hasMultiplayerAccess();
  if (!hasAccess) {
    console.log('🔒 Multiplayer access required for joining rooms');
    multiplayerPaywall.showAccessDenied('join rooms');
    return;
  }

  const displayName = $('display-name').value.trim();
  if (!displayName) return alert('Enter your name');
  await joinRoom(roomId, displayName);
  currentRoomId = roomId;
  await subscribeRoom(roomId);
}

async function subscribeRoom(roomId) {
  if (unsubscribeRoom) unsubscribeRoom();
  unsubscribeRoom = await listenToRoomUpdates(roomId, room => {
    const players = Array.isArray(room.players) ? room.players : [];
    renderPlayers(players);
    if (room.status === 'in_progress') {
      startGame(roomId);
    }
  });
}

function renderPlayers(players) {
  const listEl = $('room-players');
  if (!listEl) return;
  const playerList = Array.isArray(players) ? players : [];
  listEl.innerHTML = '';
  playerList.forEach(p => {
    const li = document.createElement('li');
    li.textContent = p.displayName;
    listEl.appendChild(li);
  });
}

async function initLobby() {
  initFirebaseHorropoly();
  $('create-room').addEventListener('click', handleCreateRoom);
  $('refresh-rooms').addEventListener('click', refreshRoomList);
  refreshRoomList();
  
  // Initialize paywall system
  try {
    // Wait a moment for the paywall system to initialize
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const hasAccess = await multiplayerPaywall.hasMultiplayerAccess();
    console.log('🔍 Lobby multiplayer access check result:', hasAccess);
    
    if (!hasAccess) {
      console.log('🔒 User does not have multiplayer access - disabling lobby UI');
      // Disable create room button
      const createBtn = $('create-room');
      if (createBtn) {
        createBtn.disabled = true;
        createBtn.textContent = '🔒 Unlock Required';
        createBtn.style.opacity = '0.6';
        createBtn.style.cursor = 'not-allowed';
      }
    }
  } catch (error) {
    console.error('❌ Error initializing lobby paywall system:', error);
  }
}

document.addEventListener('DOMContentLoaded', initLobby);



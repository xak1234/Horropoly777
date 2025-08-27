// smart-join-system.js
// Enhanced join button routing with preset API and room validation

import { joinPresetRoom } from './join-solo.js';

/**
 * Smart join function that handles different room scenarios
 */
export async function smartJoinRoom(roomId, playerName, options = {}) {
  console.log(`🎯 Smart join attempt: ${roomId} by ${playerName}`);
  
  // Check if user has multiplayer access first
  try {
    const { default: multiplayerPaywall } = await import('./multiplayer-paywall-system.js');
    const hasAccess = await multiplayerPaywall.hasMultiplayerAccess();
    if (!hasAccess) {
      console.log('🔒 Smart join blocked - multiplayer access required');
      multiplayerPaywall.showAccessDenied('join multiplayer games');
      return { success: false, reason: 'Multiplayer access required' };
    }
  } catch (importError) {
    console.warn('Could not check paywall status in smart join:', importError);
  }
  
  try {
    // First, validate the room exists and is joinable
    const roomStatus = await validateRoomForJoin(roomId);
    
    if (!roomStatus.valid) {
      console.warn(`Room ${roomId} is not joinable: ${roomStatus.reason}`);
      return await handleInvalidRoom(roomId, playerName, roomStatus, options);
    }
    
    // Room is valid, proceed with normal join
    console.log(`✅ Room ${roomId} is valid, proceeding with join`);
    return await joinValidRoom(roomId, playerName, options);
    
  } catch (error) {
    console.error(`Smart join failed for room ${roomId}:`, error);
    
    // Fallback to preset room
    return await handleJoinFallback(playerName, options);
  }
}

/**
 * Validate if a room is joinable
 */
async function validateRoomForJoin(roomId) {
  try {
    // Check both collections via backend API
    const collections = ['rooms', 'gameRooms'];
    
    for (const collection of collections) {
      try {
        // Try backend API first
        const backendUrl = 'https://horropoly-payment-backend.onrender.com';
        const response = await fetch(`${backendUrl}/api/room/${collection}/${roomId}/status`);
        
        if (response.ok) {
          const roomData = await response.json();
          
          // Check if room is joinable
          if (roomData.gameStarted) {
            return { valid: false, reason: 'game_already_started', data: roomData };
          }
          
          if (!roomData.isOpen) {
            return { valid: false, reason: 'room_closed', data: roomData };
          }
          
          const players = Array.isArray(roomData.players) ? roomData.players : [];
          if (players.length >= (roomData.maxPlayers || 2)) {
            return { valid: false, reason: 'room_full', data: roomData };
          }
          
          // Check if room is stale
          const lastUpdated = roomData.lastUpdated ? new Date(roomData.lastUpdated) : new Date(0);
          const staleThreshold = 30 * 60 * 1000; // 30 minutes
          if (Date.now() - lastUpdated.getTime() > staleThreshold) {
            return { valid: false, reason: 'room_stale', data: roomData };
          }
          
          return { valid: true, data: roomData, collection };
        }
      } catch (backendError) {
        console.warn(`Backend API failed for ${collection}/${roomId}, trying local:`, backendError);
        
        // Fallback to local Firebase check
        try {
          if (window.firebaseDB) {
            const { doc, getDoc } = window.firebaseFunctions || {};
            if (doc && getDoc) {
              const roomRef = doc(window.firebaseDB, collection, roomId);
              const snap = await getDoc(roomRef);
              
              if (snap.exists()) {
                const roomData = snap.data();
                
                // Same validation logic
                if (roomData.gameStarted) {
                  return { valid: false, reason: 'game_already_started', data: roomData };
                }
                
                if (!roomData.isOpen) {
                  return { valid: false, reason: 'room_closed', data: roomData };
                }
                
                const players = Array.isArray(roomData.players) ? roomData.players : [];
                if (players.length >= (roomData.maxPlayers || 2)) {
                  return { valid: false, reason: 'room_full', data: roomData };
                }
                
                const lastUpdated = roomData.lastUpdated ? new Date(roomData.lastUpdated) : new Date(0);
                const staleThreshold = 30 * 60 * 1000;
                if (Date.now() - lastUpdated.getTime() > staleThreshold) {
                  return { valid: false, reason: 'room_stale', data: roomData };
                }
                
                return { valid: true, data: roomData, collection };
              }
            }
          }
        } catch (localError) {
          console.warn(`Local Firebase check also failed for ${collection}/${roomId}:`, localError);
        }
      }
    }
    
    return { valid: false, reason: 'room_not_found' };
    
  } catch (error) {
    console.error('Room validation failed:', error);
    return { valid: false, reason: 'validation_error', error };
  }
}

/**
 * Handle invalid room scenarios
 */
async function handleInvalidRoom(roomId, playerName, roomStatus, options) {
  const { reason, data } = roomStatus;
  
  switch (reason) {
    case 'room_not_found':
      console.log(`Room ${roomId} not found, creating preset room`);
      return await createPresetRoomFallback(playerName, options);
      
    case 'game_already_started':
      throw new Error(`Game in room "${roomId}" has already started. Please choose another room.`);
      
    case 'room_closed':
      throw new Error(`Room "${roomId}" is closed. Please choose another room.`);
      
    case 'room_full':
      const players = data.players || [];
      throw new Error(`Room "${roomId}" is full (${players.length}/${data.maxPlayers} players). Please choose another room.`);
      
    case 'room_stale':
      console.log(`Room ${roomId} is stale, creating fresh preset room`);
      return await createPresetRoomFallback(playerName, options);
      
    default:
      console.log(`Room ${roomId} invalid (${reason}), falling back to preset`);
      return await createPresetRoomFallback(playerName, options);
  }
}

/**
 * Join a validated room
 */
async function joinValidRoom(roomId, playerName, options) {
  const gameUrl = `game.html?roomId=${encodeURIComponent(roomId)}&player=${encodeURIComponent(playerName)}`;
  
  // Add any additional options to URL
  if (options.isHost) {
    gameUrl += '&isHost=true';
  }
  
  console.log(`🎮 Joining valid room: ${gameUrl}`);
  window.location.href = gameUrl;
  
  return { success: true, roomId, gameUrl };
}

/**
 * Create preset room as fallback
 */
async function createPresetRoomFallback(playerName, options = {}) {
  const presetType = options.presetType || 'solo';
  const aiCount = options.aiCount || 1;
  
  console.log(`🎯 Creating ${presetType} preset room as fallback for ${playerName}`);
  
  try {
    await joinPresetRoom(presetType, playerName, aiCount, options);
    return { success: true, fallback: true, presetType };
  } catch (error) {
    console.error('Preset fallback failed:', error);
    throw new Error(`Failed to create fallback game. Please try again later.`);
  }
}

/**
 * Handle join fallback scenarios
 */
async function handleJoinFallback(playerName, options) {
  console.log(`🔄 Using fallback join for ${playerName}`);
  
  // Show user-friendly message
  showJoinMessage('Room unavailable. Creating a new game for you...', 'info');
  
  return await createPresetRoomFallback(playerName, options);
}

/**
 * Enhanced join button click handler
 */
export function setupSmartJoinButtons() {
  console.log('🎯 Setting up smart join buttons...');
  
  // Handle room join buttons
  document.addEventListener('click', async (event) => {
    const joinBtn = event.target.closest('.join-button, [data-action="join"]');
    if (!joinBtn) return;
    
    event.preventDefault();
    
    const roomId = joinBtn.dataset.roomId || joinBtn.closest('[data-room-id]')?.dataset.roomId;
    if (!roomId) {
      console.warn('Join button clicked but no roomId found');
      return;
    }
    
    // Get player name
    let playerName;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile && window.showMobileInput) {
      window.showMobileInput(`Enter your name to join ${roomId}:`, async (name) => {
        if (name && name.trim()) {
          await attemptSmartJoin(roomId, name.trim(), joinBtn);
        }
      });
    } else {
      playerName = prompt(`Enter your name to join ${roomId}:`);
      if (playerName && playerName.trim()) {
        await attemptSmartJoin(roomId, playerName.trim(), joinBtn);
      }
    }
  });
  
  // Handle preset buttons
  document.addEventListener('click', async (event) => {
    const presetBtn = event.target.closest('[data-preset], .preset-button');
    if (!presetBtn) return;
    
    event.preventDefault();
    
    const presetType = presetBtn.dataset.preset || 'solo';
    const aiCount = parseInt(presetBtn.dataset.aiCount || '1');
    
    // Get player name
    let playerName;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile && window.showMobileInput) {
      window.showMobileInput(`Enter your name for ${presetType} game:`, async (name) => {
        if (name && name.trim()) {
          await joinPresetRoom(presetType, name.trim(), aiCount);
        }
      });
    } else {
      playerName = prompt(`Enter your name for ${presetType} game:`);
      if (playerName && playerName.trim()) {
        await joinPresetRoom(presetType, playerName.trim(), aiCount);
      }
    }
  });
  
  console.log('✅ Smart join buttons configured');
}

/**
 * Attempt smart join with UI feedback
 */
async function attemptSmartJoin(roomId, playerName, buttonElement) {
  const originalText = buttonElement.textContent;
  
  try {
    // Update button state
    buttonElement.disabled = true;
    buttonElement.textContent = 'Joining...';
    
    await smartJoinRoom(roomId, playerName);
    
  } catch (error) {
    console.error('Smart join failed:', error);
    
    // Show error to user
    showJoinMessage(error.message, 'error');
    
    // Reset button
    buttonElement.disabled = false;
    buttonElement.textContent = originalText;
  }
}

/**
 * Show join status message
 */
function showJoinMessage(message, type = 'info') {
  const messageDiv = document.createElement('div');
  messageDiv.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: ${type === 'error' ? 'rgba(255, 0, 0, 0.9)' : 'rgba(0, 123, 255, 0.9)'};
    color: white;
    padding: 15px 25px;
    border-radius: 8px;
    font-weight: bold;
    z-index: 10000;
    max-width: 400px;
    text-align: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  `;
  messageDiv.textContent = message;
  
  document.body.appendChild(messageDiv);
  
  // Auto-hide after 4 seconds
  setTimeout(() => {
    if (messageDiv && messageDiv.parentNode) {
      messageDiv.parentNode.removeChild(messageDiv);
    }
  }, 4000);
}

// Auto-setup when module loads
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', setupSmartJoinButtons);
  
  // Make functions globally available
  window.smartJoinRoom = smartJoinRoom;
  window.setupSmartJoinButtons = setupSmartJoinButtons;
}

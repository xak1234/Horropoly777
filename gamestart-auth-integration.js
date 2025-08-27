// @ts-check
import { startGameWithAuth } from "./game-start-gate.js";
import { enableAudioAfterGesture, createAudioWithGesture } from "./audio-helper.js";

/**
 * Integration example for gamestart.html
 * This shows how to properly initialize the game with authentication
 */

// Initialize audio elements with gesture handling
function initializeAudio() {
  console.log("🔊 Initializing audio with gesture handling...");
  
  // Handle existing audio elements
  const existingAudioElements = document.querySelectorAll('audio');
  existingAudioElements.forEach(audioEl => {
    if (audioEl instanceof HTMLAudioElement) {
      enableAudioAfterGesture(audioEl);
    }
  });
  
  // Handle ambient sounds if they exist
  const ambientSounds = ['wind1.mp3', 'wind2.mp3', 'chimes.mp3'];
  ambientSounds.forEach(soundFile => {
    const fullPath = `assets/sounds/${soundFile}`;
    if (window.wind1Sound || window.wind2Sound || window.chimesSound) {
      // These are created in game.js, just enable gesture handling
      if (window.wind1Sound && soundFile === 'wind1.mp3') {
        enableAudioAfterGesture(window.wind1Sound);
      }
      if (window.wind2Sound && soundFile === 'wind2.mp3') {
        enableAudioAfterGesture(window.wind2Sound);
      }
      if (window.chimesSound && soundFile === 'chimes.mp3') {
        enableAudioAfterGesture(window.chimesSound);
      }
    }
  });
}

/**
 * Main game initialization function
 * This will be called after authentication is ready
 */
async function initializeGame() {
  console.log("🎮 Starting authenticated game initialization...");
  
  try {
    // Initialize audio first
    initializeAudio();
    
    // Get room parameters from URL or other sources
    const urlParams = new URLSearchParams(window.location.search);
    const playerName = urlParams.get('player') || 'Player';
    const aiCount = parseInt(urlParams.get('ai') || '0', 10);
    const humanCount = parseInt(urlParams.get('humans') || '1', 10);
    const autostart = urlParams.get('autostart') === '1';
    
    console.log("🎮 Game parameters:", { playerName, aiCount, humanCount, autostart });
    
    // Initialize the game logic here
    // This is where you would call your existing game initialization code
    if (typeof window.initGame === 'function') {
      console.log("🎮 Calling existing initGame function...");
      await window.initGame();
    }
    
    // If this is an autostart game, create the room automatically
    if (autostart) {
      console.log("🚀 Auto-starting game...");
      await autoStartGame(playerName, aiCount, humanCount);
    }
    
    console.log("✅ Game initialization completed successfully");
    
  } catch (error) {
    console.error("❌ Game initialization failed:", error);
    // Show user-friendly error message
    showGameError("Failed to start game. Please refresh and try again.");
  }
}

/**
 * Auto-start game for preset configurations like "Solo Zombie Hunt"
 */
async function autoStartGame(playerName, aiCount, humanCount) {
  try {
    console.log("🧟 Auto-starting game with AI opponents...");
    
    // Import the createGameRoom function
    const { createGameRoom } = await import('./firebase-init.js');
    
    // Create room with AI bots
    const maxPlayers = humanCount + aiCount;
    const roomData = await createGameRoom(playerName, maxPlayers, aiCount, null, null, `${playerName}'s Game`);
    
    console.log("✅ Auto-created room:", roomData.roomId);
    
    // Set up the game with the created room
    if (typeof window.setupMultiplayerGame === 'function') {
      window.setupMultiplayerGame(roomData.roomId, roomData.userId, true);
    }
    
  } catch (error) {
    console.error("❌ Auto-start failed:", error);
    throw error;
  }
}

/**
 * Show error message to user
 */
function showGameError(message) {
  // Create or update error display
  let errorDiv = document.getElementById('game-error');
  if (!errorDiv) {
    errorDiv = document.createElement('div');
    errorDiv.id = 'game-error';
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(255, 0, 0, 0.9);
      color: white;
      padding: 15px 25px;
      border-radius: 8px;
      font-weight: bold;
      z-index: 10000;
      max-width: 400px;
      text-align: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    document.body.appendChild(errorDiv);
  }
  
  errorDiv.textContent = message;
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    if (errorDiv && errorDiv.parentNode) {
      errorDiv.parentNode.removeChild(errorDiv);
    }
  }, 5000);
}

/**
 * Initialize the authenticated game system
 * Call this from your gamestart.html or main game file
 */
export async function initializeAuthenticatedGame() {
  console.log("🔐 Starting authenticated game system...");
  
  try {
    // Use the auth-gated game initialization
    await startGameWithAuth(initializeGame);
    console.log("✅ Authenticated game system ready");
  } catch (error) {
    console.error("❌ Authenticated game system failed:", error);
    showGameError("Authentication failed. Please refresh and try again.");
  }
}

// Auto-initialize if this script is loaded directly
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAuthenticatedGame);
  } else {
    initializeAuthenticatedGame();
  }
  
  // Export for manual initialization
  window.initializeAuthenticatedGame = initializeAuthenticatedGame;
}

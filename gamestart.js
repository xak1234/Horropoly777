// gamestart.js
import { getApps } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { waitForAuthReady } from "./auth-gate.js";

(async () => {
  try {
    console.log("🎮 Starting gamestart initialization...");
    
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get("roomId");
    const playerName = params.get("playerName") || "Player";
    const aiCount = Number(params.get("aiCount") || "1");
    const humanCount = Number(params.get("humanCount") || "1");
    const preset = params.get("preset") || "solo";

    console.log("🎮 Game parameters:", { roomId, playerName, aiCount, humanCount, preset });

    if (!roomId) {
      console.error("❌ No roomId in URL — cannot start game.");
      showGameError("Invalid game link. Missing room ID.");
      return;
    }

    console.log("🔐 Waiting for authentication...");
    const user = await waitForAuthReady(15000);
    console.log("✅ Authentication ready as:", user.uid);

    const app = getApps()[0];
    if (!app) {
      throw new Error("Firebase app not initialized");
    }
    
    const db = getFirestore(app);
    console.log("✅ Firestore connected");

    // Subscribe to authoritative game state
    const stateRef = doc(db, "gameRooms", roomId, "state", "snapshot");
    console.log("📡 Subscribing to game state...");
    
    const unsubscribe = onSnapshot(stateRef, (snap) => {
      if (!snap.exists()) {
        console.warn("⚠️ Authoritative state missing for room:", roomId);
        return;
      }
      
      const state = snap.data();
      console.log("📊 Game state updated:", {
        players: state.players?.length || 0,
        currentTurn: state.currentTurn,
        gameStarted: state.gameStarted,
        lastUpdated: state.lastUpdated
      });
      
      // Render board and handle game logic
      handleGameStateUpdate(state, { roomId, playerName, aiCount });
      
    }, (error) => {
      console.error("❌ State subscription error:", error);
      showGameError("Connection to game lost. Please refresh.");
    });

    // Store unsubscribe function globally for cleanup
    window.gameStateUnsubscribe = unsubscribe;

    console.log(`✅ [INFO] Joined ${preset} game as ${playerName} (AI=${aiCount}), roomId=${roomId}`);
    
    // Initialize game UI
    initializeGameUI({ roomId, playerName, aiCount, humanCount, preset });
    
  } catch (error) {
    console.error("❌ Gamestart initialization failed:", error);
    showGameError("Failed to start game. Please try again.");
  }
})();

/**
 * Handle game state updates from Firestore
 */
function handleGameStateUpdate(state, gameInfo) {
  try {
    // Update game UI based on authoritative state
    if (typeof window.updateGameFromState === 'function') {
      window.updateGameFromState(state);
    }
    
    // Handle AI turn logic if it's an AI player's turn
    if (state.gameStarted && state.players && state.players.length > 0) {
      const currentPlayer = state.players[state.currentTurn];
      if (currentPlayer && currentPlayer.isAI) {
        console.log("🤖 AI turn detected:", currentPlayer.name);
        handleAITurn(currentPlayer, state, gameInfo);
      }
    }
    
    // Update UI elements
    updateGameUI(state, gameInfo);
    
  } catch (error) {
    console.error("❌ Error handling game state update:", error);
  }
}

/**
 * Handle AI turn logic
 */
function handleAITurn(aiPlayer, state, gameInfo) {
  // AI turn logic would go here
  // For now, just log that it's the AI's turn
  console.log(`🤖 ${aiPlayer.name}'s turn (AI)`);
  
  // You would implement AI decision making here
  // This could involve posting intents to the backend
  // or calling existing AI functions
}

/**
 * Initialize game UI elements
 */
function initializeGameUI(gameInfo) {
  console.log("🎨 Initializing game UI...");
  
  // Update page title
  document.title = `Horropoly - ${gameInfo.preset} Game`;
  
  // Show game info
  const gameInfoElement = document.getElementById('game-info');
  if (gameInfoElement) {
    gameInfoElement.innerHTML = `
      <div>Room: ${gameInfo.roomId}</div>
      <div>Player: ${gameInfo.playerName}</div>
      <div>AI Opponents: ${gameInfo.aiCount}</div>
    `;
  }
  
  // Initialize existing game systems if they exist
  if (typeof window.initGame === 'function') {
    console.log("🎮 Calling existing initGame function...");
    window.initGame();
  }
}

/**
 * Update UI based on game state
 */
function updateGameUI(state, gameInfo) {
  // Update turn indicator
  const turnElement = document.getElementById('current-turn');
  if (turnElement && state.players && state.players.length > 0) {
    const currentPlayer = state.players[state.currentTurn];
    turnElement.textContent = `Current Turn: ${currentPlayer?.name || 'Unknown'}`;
  }
  
  // Update player list
  const playerListElement = document.getElementById('player-list');
  if (playerListElement && state.players) {
    playerListElement.innerHTML = state.players.map(player => `
      <div class="player-item ${player.isAI ? 'ai-player' : 'human-player'}">
        ${player.name} ${player.isAI ? '🤖' : '👤'} - $${player.money || 0}
      </div>
    `).join('');
  }
}

/**
 * Show error message to user
 */
function showGameError(message) {
  let errorDiv = document.getElementById('gamestart-error');
  if (!errorDiv) {
    errorDiv = document.createElement('div');
    errorDiv.id = 'gamestart-error';
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
  
  // Auto-hide after 8 seconds
  setTimeout(() => {
    if (errorDiv && errorDiv.parentNode) {
      errorDiv.parentNode.removeChild(errorDiv);
    }
  }, 8000);
}

// Cleanup function
window.addEventListener('beforeunload', () => {
  if (window.gameStateUnsubscribe) {
    window.gameStateUnsubscribe();
    console.log("🧹 Game state subscription cleaned up");
  }
});

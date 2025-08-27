// local-testing-fix.js
// Local testing version that uses robust Firebase init but keeps client-side room creation

import { initHorropolyFirebase } from "./firebase-init-fixed.js";
import { waitForAuthReady } from "./auth-gate.js";

/**
 * Local preset room creation (no backend required)
 * This replaces the server-side creation for local testing
 */
export async function createPresetRoomLocal(presetType, playerName, aiCount = 1) {
  console.log(`🧟 Creating local preset room: ${presetType} for ${playerName}`);
  
  try {
    // Ensure authentication is ready
    await waitForAuthReady(10000);
    console.log("✅ Authentication ready for local room creation");
    
    // Import the existing createGameRoom function
    const { createGameRoom } = await import('./firebase-init.js');
    
    // Map preset types to names
    const presetNames = {
      1: 'Solo Zombie Hunt',
      2: 'Duo Zombie Hunt', 
      3: 'Zombie Swarm',
      4: 'Custom Game',
      5: 'Zombie Nightmare',
      'solo': 'Solo Zombie Hunt',
      'duo': 'Duo Zombie Hunt',
      'swarm': 'Zombie Swarm',
      'nightmare': 'Zombie Nightmare'
    };
    
    const presetName = presetNames[presetType] || `${presetType} Game`;
    const maxPlayers = 1 + aiCount; // Human + AI players
    
    console.log(`🎮 Creating ${presetName} with ${aiCount} AI opponents...`);
    
    // Create the room using existing client-side logic
    const roomData = await createGameRoom(
      playerName,
      maxPlayers,
      aiCount,
      null, // providedPlayers
      null, // specificRoomId
      `${playerName}'s ${presetName}` // roomName
    );
    
    console.log(`✅ Local room created: ${roomData.roomId}`);
    
    // Redirect to gamestart.html with parameters
    const params = new URLSearchParams({
      roomId: roomData.roomId,
      playerName,
      aiCount: aiCount.toString(),
      humanCount: "1",
      preset: presetType.toString()
    });
    
    window.location.href = `gamestart.html?${params.toString()}`;
    
    return roomData;
    
  } catch (error) {
    console.error(`❌ Local preset creation failed:`, error);
    throw error;
  }
}

/**
 * Enhanced local joinPresetRoom that works without backend
 */
export async function joinPresetRoomLocal(presetType, playerName, options = {}) {
  console.log(`🧟 joinPresetRoomLocal called with type: ${presetType}`);
  
  // Handle both numeric and string preset types
  let aiCount = options.aiCount;
  
  // Map preset types to AI counts if not specified
  if (!aiCount) {
    const presetAiCounts = {
      1: 1, // Solo
      2: 2, // Duo
      3: 3, // Swarm
      4: 2, // Custom
      5: 3, // Nightmare
      'solo': 1,
      'duo': 2,
      'swarm': 3,
      'nightmare': 3
    };
    
    aiCount = presetAiCounts[presetType] || 1;
  }
  
  return await createPresetRoomLocal(presetType, playerName, aiCount);
}

/**
 * Replace existing Firebase initialization with robust version
 */
export function initializeLocalTesting() {
  console.log("🔄 Initializing local testing with robust Firebase...");
  
  try {
    // Use robust Firebase initialization instead of old one
    initHorropolyFirebase();
    
    // Override global functions for local testing
    if (typeof window !== 'undefined') {
      // Keep the old createGameRoom available but use robust Firebase
      window.joinPresetRoom = joinPresetRoomLocal;
      window.createPresetRoomLocal = createPresetRoomLocal;
      
      // Override the old Firebase init with the robust one
      window.initFirebaseHorropoly = initHorropolyFirebase;
      
      console.log("✅ Local testing functions installed");
    }
    
  } catch (error) {
    console.error("❌ Local testing initialization failed:", error);
  }
}

/**
 * Update existing preset handlers for local testing
 */
export function updateLocalPresetHandlers() {
  console.log("🔧 Updating preset handlers for local testing...");
  
  // Find existing preset buttons and update them
  const presetButtons = document.querySelectorAll('[onclick*="joinPresetRoom"], [data-preset]');
  
  presetButtons.forEach(button => {
    const originalOnclick = button.getAttribute('onclick');
    
    if (originalOnclick) {
      // Extract preset type from onclick
      const presetMatch = originalOnclick.match(/joinPresetRoom\((\d+)/);
      if (presetMatch) {
        const presetType = parseInt(presetMatch[1]);
        
        // Remove old onclick
        button.removeAttribute('onclick');
        
        // Add new event listener
        button.addEventListener('click', async (e) => {
          e.preventDefault();
          
          const playerName = getPlayerName();
          if (!playerName) {
            alert('Please enter a player name first');
            return;
          }
          
          try {
            button.disabled = true;
            const originalText = button.textContent;
            button.textContent = 'Creating game...';
            
            await joinPresetRoomLocal(presetType, playerName);
            
          } catch (error) {
            console.error('Local preset creation failed:', error);
            button.disabled = false;
            button.textContent = originalText;
            alert('Failed to create game. Please try again.');
          }
        });
        
        console.log(`✅ Updated button for preset type ${presetType}`);
      }
    }
  });
}

/**
 * Get player name from input fields
 */
function getPlayerName() {
  const possibleInputs = [
    'player-name', 'playerName', 'player1-name', 'username', 'name'
  ];
  
  for (const inputId of possibleInputs) {
    const input = document.getElementById(inputId) || document.querySelector(`[name="${inputId}"]`);
    if (input && input.value && input.value.trim()) {
      return input.value.trim();
    }
  }
  
  return null;
}

/**
 * Initialize everything for local testing
 */
export function setupLocalTesting() {
  console.log("🏠 Setting up local testing environment...");
  
  // Initialize robust Firebase
  initializeLocalTesting();
  
  // Update preset handlers
  updateLocalPresetHandlers();
  
  console.log("✅ Local testing environment ready");
}

// Auto-setup if loaded directly
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupLocalTesting);
  } else {
    setupLocalTesting();
  }
}

// preset-migration-fix.js
// Migration script to update existing preset handling to use the new robust system

import { joinPresetRoom } from "./join-solo.js";
import { initHorropolyFirebase } from "./firebase-init-fixed.js";

/**
 * Map of existing preset configurations to new server endpoints
 */
const PRESET_MAPPING = {
  // Existing preset types from your current system
  1: { type: 'solo', name: 'Solo Zombie Hunt', aiCount: 1 },
  2: { type: 'duo', name: 'Duo Zombie Hunt', aiCount: 2 },
  3: { type: 'swarm', name: 'Zombie Swarm', aiCount: 3 },
  4: { type: 'custom', name: 'Custom Game', aiCount: 2 },
  5: { type: 'nightmare', name: 'Zombie Nightmare', aiCount: 3 }, // This is what's being called
  // Add more mappings as needed
};

/**
 * Enhanced joinPresetRoom function that handles the existing preset system
 */
export async function joinPresetRoomEnhanced(presetType, playerName, options = {}) {
  console.log(`🧟 joinPresetRoomEnhanced called with type: ${presetType}`);
  
  // Handle numeric preset types (from existing system)
  let presetConfig;
  if (typeof presetType === 'number') {
    presetConfig = PRESET_MAPPING[presetType];
    if (!presetConfig) {
      console.error(`❌ Unknown preset type: ${presetType}`);
      throw new Error(`Unknown preset type: ${presetType}`);
    }
  } else {
    // Handle string preset types
    presetConfig = { type: presetType, name: presetType, aiCount: options.aiCount || 1 };
  }
  
  console.log(`🎮 Using preset config:`, presetConfig);
  
  try {
    // Use the robust server-side room creation
    await joinPresetRoom(presetConfig.type, playerName, presetConfig.aiCount, {
      presetName: presetConfig.name,
      ...options
    });
  } catch (error) {
    console.error(`❌ Failed to join ${presetConfig.name}:`, error);
    
    // Fallback to old system if server is not available
    console.log(`🔄 Falling back to client-side room creation...`);
    await fallbackToClientSideCreation(presetConfig, playerName, options);
  }
}

/**
 * Fallback to client-side room creation if server is not available
 */
async function fallbackToClientSideCreation(presetConfig, playerName, options = {}) {
  try {
    // Import the old createGameRoom function
    const { createGameRoom } = await import('./firebase-init.js');
    
    console.log(`🔄 Creating room client-side for ${presetConfig.name}...`);
    
    const maxPlayers = 1 + presetConfig.aiCount; // Human + AI players
    const roomData = await createGameRoom(
      playerName, 
      maxPlayers, 
      presetConfig.aiCount, 
      null, 
      null, 
      `${playerName}'s ${presetConfig.name}`
    );
    
    console.log(`✅ Fallback room created: ${roomData.roomId}`);
    
    // Redirect to gamestart.html
    const params = new URLSearchParams({
      roomId: roomData.roomId,
      playerName,
      aiCount: presetConfig.aiCount.toString(),
      humanCount: "1",
      preset: presetConfig.type,
    });
    
    window.location.href = `/gamestart.html?${params.toString()}`;
    
  } catch (fallbackError) {
    console.error(`❌ Fallback creation also failed:`, fallbackError);
    throw new Error(`Failed to create ${presetConfig.name} game. Please try again.`);
  }
}

/**
 * Update the server.js to handle the "nightmare" preset
 */
export function getServerUpdateCode() {
  return `
// Add this to your server.js

// Zombie Nightmare preset (3 AI opponents with harder difficulty)
app.post("/api/preset/nightmare", async (req, res) => {
  try {
    console.log("🧟💀 Creating Zombie Nightmare preset...");
    const { playerName, aiCount = 3 } = req.body ?? {};
    
    if (!playerName || typeof playerName !== 'string' || playerName.trim().length === 0) {
      return res.status(400).json({ 
        ok: false, 
        error: "Player name is required and must be a non-empty string" 
      });
    }
    
    const sanitizedPlayerName = playerName.trim().substring(0, 50);
    const validAiCount = 3; // Always 3 for nightmare mode
    
    const { roomId } = await ensurePresetRoom({
      name: "Zombie Nightmare",
      aiBots: validAiCount,
      hostName: sanitizedPlayerName,
    });
    
    console.log(\`✅ Zombie Nightmare room created: \${roomId}\`);
    res.json({ ok: true, roomId });
    
  } catch (e) {
    console.error("❌ Nightmare preset creation failed:", e);
    res.status(500).json({ ok: false, error: String(e) });
  }
});
  `;
}

/**
 * Replace the existing joinPresetRoom function globally
 */
export function installEnhancedPresetHandler() {
  // Replace the global function if it exists
  if (typeof window !== 'undefined') {
    window.joinPresetRoom = joinPresetRoomEnhanced;
    window.joinPresetRoomEnhanced = joinPresetRoomEnhanced;
    
    console.log("✅ Enhanced preset handler installed");
  }
}

/**
 * Initialize the migration system
 */
export function initializePresetMigration() {
  console.log("🔄 Initializing preset migration system...");
  
  try {
    // Initialize robust Firebase
    initHorropolyFirebase();
    
    // Install enhanced handlers
    installEnhancedPresetHandler();
    
    // Update any existing preset buttons
    updateExistingPresetButtons();
    
    console.log("✅ Preset migration system initialized");
    
  } catch (error) {
    console.error("❌ Preset migration initialization failed:", error);
  }
}

/**
 * Update existing preset buttons to use the new system
 */
function updateExistingPresetButtons() {
  // Find buttons that might be calling the old system
  const presetButtons = document.querySelectorAll('[onclick*="joinPresetRoom"], [data-preset], .preset-button');
  
  presetButtons.forEach(button => {
    // Remove old onclick handlers
    button.removeAttribute('onclick');
    
    // Add new event listener
    button.addEventListener('click', async (e) => {
      e.preventDefault();
      
      const presetType = button.dataset.preset || button.dataset.presetType || 'solo';
      const playerName = getPlayerNameFromInput();
      
      if (!playerName) {
        alert('Please enter a player name first');
        return;
      }
      
      try {
        button.disabled = true;
        const originalText = button.textContent;
        button.textContent = 'Creating game...';
        
        await joinPresetRoomEnhanced(presetType, playerName);
        
      } catch (error) {
        console.error('Preset creation failed:', error);
        button.disabled = false;
        button.textContent = originalText;
        alert('Failed to create game. Please try again.');
      }
    });
  });
  
  console.log(`✅ Updated ${presetButtons.length} preset buttons`);
}

/**
 * Get player name from various input sources
 */
function getPlayerNameFromInput() {
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

// Auto-initialize if loaded directly
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePresetMigration);
  } else {
    initializePresetMigration();
  }
}

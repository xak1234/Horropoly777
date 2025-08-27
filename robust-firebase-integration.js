// robust-firebase-integration.js
// Integration guide for updating existing Horropoly code to use the robust Firebase system

import { initHorropolyFirebase } from "./firebase-init-fixed.js";
import { joinSoloZombieHunt, joinPresetRoom } from "./join-solo.js";

/**
 * Update your existing Firebase initialization
 * Replace the old initFirebaseHorropoly() calls with this
 */
export function initializeRobustFirebase() {
  console.log("🔄 Initializing robust Firebase system...");
  
  try {
    // Use the new robust initialization
    initHorropolyFirebase();
    
    // Set up global compatibility
    window.initFirebaseHorropoly = initHorropolyFirebase;
    
    console.log("✅ Robust Firebase system initialized");
    return true;
  } catch (error) {
    console.error("❌ Robust Firebase initialization failed:", error);
    return false;
  }
}

/**
 * Update your preset room joining logic
 * Replace existing "Solo Zombie Hunt" button handlers with this
 */
export function updatePresetHandlers() {
  console.log("🔧 Setting up robust preset handlers...");
  
  // Find and update Solo Zombie Hunt buttons
  const soloButtons = document.querySelectorAll('[data-preset="solo"], .solo-zombie-hunt, #solo-hunt-btn');
  soloButtons.forEach(button => {
    button.addEventListener('click', async (e) => {
      e.preventDefault();
      
      const playerName = getPlayerName();
      if (!playerName) {
        alert('Please enter a player name first');
        return;
      }
      
      try {
        button.disabled = true;
        button.textContent = 'Creating game...';
        
        await joinSoloZombieHunt(playerName);
      } catch (error) {
        console.error('Failed to join Solo Zombie Hunt:', error);
        button.disabled = false;
        button.textContent = 'Solo Zombie Hunt';
        alert('Failed to create game. Please try again.');
      }
    });
  });
  
  // Find and update Zombie Swarm buttons
  const swarmButtons = document.querySelectorAll('[data-preset="swarm"], .zombie-swarm, #zombie-swarm-btn');
  swarmButtons.forEach(button => {
    button.addEventListener('click', async (e) => {
      e.preventDefault();
      
      const playerName = getPlayerName();
      if (!playerName) {
        alert('Please enter a player name first');
        return;
      }
      
      try {
        button.disabled = true;
        button.textContent = 'Creating swarm...';
        
        await joinPresetRoom('swarm', playerName, 3);
      } catch (error) {
        console.error('Failed to join Zombie Swarm:', error);
        button.disabled = false;
        button.textContent = 'Zombie Swarm';
        alert('Failed to create swarm game. Please try again.');
      }
    });
  });
  
  console.log(`✅ Updated ${soloButtons.length + swarmButtons.length} preset buttons`);
}

/**
 * Get player name from various possible input sources
 */
function getPlayerName() {
  // Try different common input IDs/names
  const possibleInputs = [
    'player-name',
    'playerName',
    'player1-name',
    'username',
    'name'
  ];
  
  for (const inputId of possibleInputs) {
    const input = document.getElementById(inputId) || document.querySelector(`[name="${inputId}"]`);
    if (input && input.value && input.value.trim()) {
      return input.value.trim();
    }
  }
  
  // Fallback to prompt
  const name = prompt('Enter your player name:');
  return name ? name.trim() : null;
}

/**
 * Update existing gamestart.html to use the new system
 * Add this to your gamestart.html <head> section
 */
export function getGamestartIntegrationCode() {
  return `
<!-- Add this to gamestart.html -->
<script type="module">
  import { initializeRobustFirebase } from "./robust-firebase-integration.js";
  import "./gamestart.js"; // This will handle the game initialization
  
  // Initialize robust Firebase before anything else
  document.addEventListener('DOMContentLoaded', () => {
    initializeRobustFirebase();
  });
</script>
  `;
}

/**
 * Update existing index.html to use the new preset system
 * Add this to your index.html
 */
export function getIndexIntegrationCode() {
  return `
<!-- Add this to index.html -->
<script type="module">
  import { initializeRobustFirebase, updatePresetHandlers } from "./robust-firebase-integration.js";
  
  document.addEventListener('DOMContentLoaded', () => {
    // Initialize robust Firebase
    initializeRobustFirebase();
    
    // Update preset button handlers
    updatePresetHandlers();
  });
</script>
  `;
}

/**
 * Auto-initialize if this script is loaded directly
 */
if (typeof window !== 'undefined') {
  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initializeRobustFirebase();
      updatePresetHandlers();
    });
  } else {
    initializeRobustFirebase();
    updatePresetHandlers();
  }
  
  // Export functions globally for manual use
  window.initializeRobustFirebase = initializeRobustFirebase;
  window.updatePresetHandlers = updatePresetHandlers;
  window.joinSoloZombieHunt = joinSoloZombieHunt;
  window.joinPresetRoom = joinPresetRoom;
}

// Export for ES module usage
export { initHorropolyFirebase as initFirebase };

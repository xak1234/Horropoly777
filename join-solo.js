// join-solo.js
export async function joinSoloZombieHunt(playerName) {
  try {
    console.log(`🧟 Creating Solo Zombie Hunt for ${playerName}...`);
    
    // Try backend API first
    const backendUrl = 'https://horropoly-payment-backend.onrender.com';
    let response;
    
    try {
      response = await fetch(`${backendUrl}/api/preset/solo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName, aiCount: 1 }),
      });
    } catch (backendError) {
      console.warn('Backend API failed, trying local:', backendError);
      
      // Fallback to local API
      response = await fetch("/api/preset/solo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName, aiCount: 1 }),
      });
    }
    
    const data = await response.json();
    if (!data.ok) throw new Error(data.error || "Failed to create preset room");
    
    console.log(`✅ Preset room created: ${data.roomId}`);
    
    const params = new URLSearchParams({
      roomId: data.roomId,
      playerName,
      aiCount: "1",
      humanCount: "1",
    });
    
    window.location.href = `/gamestart.html?${params.toString()}`;
  } catch (error) {
    console.error("❌ Failed to join Solo Zombie Hunt:", error);
    throw error;
  }
}

/**
 * Generic function for joining any preset room type
 * @param {string} presetType - The preset type (e.g., "solo", "duo", etc.)
 * @param {string} playerName - Player's name
 * @param {number} aiCount - Number of AI opponents
 * @param {object} options - Additional options
 */
export async function joinPresetRoom(presetType, playerName, aiCount = 1, options = {}) {
  try {
    console.log(`🎮 Creating ${presetType} preset for ${playerName}...`);
    
    const requestBody = {
      playerName,
      aiCount,
      ...options
    };
    
    // Try backend API first
    const backendUrl = 'https://horropoly-payment-backend.onrender.com';
    let response;
    
    try {
      response = await fetch(`${backendUrl}/api/preset/${presetType}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
    } catch (backendError) {
      console.warn(`Backend API failed for ${presetType}, trying local:`, backendError);
      
      // Fallback to local API
      response = await fetch(`/api/preset/${presetType}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
    }
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    if (!data.ok) throw new Error(data.error || `Failed to create ${presetType} preset room`);
    
    console.log(`✅ ${presetType} preset room created: ${data.roomId}`);
    
    const params = new URLSearchParams({
      roomId: data.roomId,
      playerName,
      aiCount: aiCount.toString(),
      humanCount: "1",
      preset: presetType,
    });
    
    window.location.href = `/gamestart.html?${params.toString()}`;
  } catch (error) {
    console.error(`❌ Failed to join ${presetType} preset:`, error);
    
    // Show user-friendly error message
    showPresetError(`Failed to create ${presetType} game. Please try again.`);
    throw error;
  }
}

/**
 * Show error message to user
 */
function showPresetError(message) {
  // Create or update error display
  let errorDiv = document.getElementById('preset-error');
  if (!errorDiv) {
    errorDiv = document.createElement('div');
    errorDiv.id = 'preset-error';
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

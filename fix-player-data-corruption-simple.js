// Simple Fix for Player Data Corruption in Firebase Sync
console.log('🔧 Loading Simple Player Data Corruption Fix...');

// Enhanced player validation
function validatePlayer(player) {
    if (!player || typeof player !== 'object') return null;
    
    // Fix corrupted name/userId fields
    if (player.name === 'undefined' || player.name === 'null' || !player.name) {
        player.name = `Player_${Math.random().toString(36).substr(2, 6)}`;
    }
    if (player.userId === 'undefined' || player.userId === 'null' || !player.userId) {
        player.userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    return player;
}

// Store original function
const originalUpdateGameFromState = window.updateGameFromState;

// Enhanced game state update
function enhancedUpdateGameFromState(gameState) {
    if (!gameState.players || !Array.isArray(gameState.players)) {
        console.warn('🔧 Invalid players array, preserving local state');
        return;
    }
    
    // Validate and fix each player
    const validPlayers = gameState.players
        .map(validatePlayer)
        .filter(p => p && p.name && p.name !== 'undefined');
    
    if (validPlayers.length === 0 && window.players && window.players.length > 0) {
        console.warn('🔧 No valid players in update, preserving local state');
        return;
    }
    
    gameState.players = validPlayers;
    
    // Call original function
    if (originalUpdateGameFromState) {
        return originalUpdateGameFromState.call(this, gameState);
    }
}

// Replace function
if (typeof window.updateGameFromState === 'function') {
    window.updateGameFromState = enhancedUpdateGameFromState;
    console.log('🔧 Enhanced updateGameFromState installed');
}

// Manual recovery function
window.recoverPlayerData = function() {
    if (!window.players || !Array.isArray(window.players)) return false;
    
    let fixed = 0;
    window.players.forEach((player, i) => {
        if (player && (player.name === 'undefined' || !player.name)) {
            player.name = `Player_${i + 1}`;
            fixed++;
        }
        if (player && (player.userId === 'undefined' || !player.userId)) {
            player.userId = `user_${Date.now()}_${i}`;
            fixed++;
        }
    });
    
    if (fixed > 0) {
        console.log(`🔧 Fixed ${fixed} corrupted player fields`);
        if (typeof updatePlayerList === 'function') updatePlayerList(window.players);
        return true;
    }
    return false;
};

console.log('🔧 Simple Player Data Corruption Fix loaded!');
console.log('🔧 Use recoverPlayerData() to manually fix corrupted player data');

// Fix for multiplayer turn timeout issue
// Problem: When it's not the local player's turn, no auto-action timer is started
// This causes turns to get stuck when a player doesn't take their turn

console.log('🔧 Loading Multiplayer Turn Timeout Fix...');

// Store original function
const originalEnableDiceSection = window.enableDiceSection;

// Enhanced enableDiceSection that ensures auto-action timers are started for all players
function fixedEnableDiceSection() {
    console.log('[FIXED enableDiceSection] Called.');
    
    // Call the original function first
    if (originalEnableDiceSection) {
        originalEnableDiceSection.call(this);
    }
    
    // Additional logic to ensure auto-action timer is started in multiplayer
    if (window.isMultiplayerGame && window.players && window.players.length > 0) {
        const currentPlayer = window.players[window.currentPlayerIndex];
        
        if (currentPlayer && !currentPlayer.isAI && !currentPlayer.bankrupt) {
            // Get local player name
            let localPlayerName = '';
            const playerNameInput = document.getElementById('player1-name');
            if (playerNameInput) {
                localPlayerName = playerNameInput.value.trim();
            }
            if (!localPlayerName && window.localPlayerName) {
                localPlayerName = window.localPlayerName;
            }
            
            const isMyTurn = currentPlayer.name.toLowerCase() === localPlayerName.toLowerCase();
            
            console.log(`[FIXED enableDiceSection] Multiplayer check: currentPlayer="${currentPlayer.name}", localPlayer="${localPlayerName}", isMyTurn=${isMyTurn}`);
            
            // CRITICAL FIX: Start auto-action timer for current player regardless of whose turn it is locally
            // This ensures that if the current player doesn't take their turn, it will auto-advance
            if (!isMyTurn) {
                console.log(`[FIXED enableDiceSection] Starting auto-action timer for remote player: ${currentPlayer.name}`);
                
                // Clear any existing timer first
                if (window.clearAutoActionTimer) {
                    window.clearAutoActionTimer();
                }
                
                // Start timer for the current player (even if it's not the local player)
                if (window.startAutoActionTimer) {
                    window.startAutoActionTimer('roll');
                    console.log(`[FIXED enableDiceSection] Auto-action timer started for ${currentPlayer.name} (remote player)`);
                } else {
                    // Fallback: create our own timeout
                    console.log(`[FIXED enableDiceSection] startAutoActionTimer not available, creating fallback timeout`);
                    
                    const TURN_TIMEOUT = 15000; // 15 seconds
                    
                    setTimeout(async () => {
                        console.log(`[FIXED enableDiceSection] Turn timeout for ${currentPlayer.name} - forcing auto-turn`);
                        
                        // Check if it's still the same player's turn
                        const stillCurrentPlayer = window.players && window.players[window.currentPlayerIndex] && 
                                                 window.players[window.currentPlayerIndex].name === currentPlayer.name;
                        
                        if (stillCurrentPlayer) {
                            console.log(`[FIXED enableDiceSection] Executing auto-turn for ${currentPlayer.name}`);
                            
                            if (window.executeMultiplayerAutoTurn) {
                                await window.executeMultiplayerAutoTurn();
                            } else if (window.nextTurn) {
                                // Fallback: just advance to next turn
                                console.log(`[FIXED enableDiceSection] executeMultiplayerAutoTurn not available, calling nextTurn`);
                                window.nextTurn();
                            }
                        } else {
                            console.log(`[FIXED enableDiceSection] Turn already advanced, no action needed`);
                        }
                    }, TURN_TIMEOUT);
                }
            }
        }
    }
    
    console.log('[FIXED enableDiceSection] Completed.');
}

// Apply the fix
if (typeof window.enableDiceSection === 'function') {
    window.enableDiceSection = fixedEnableDiceSection;
    console.log('✅ Multiplayer turn timeout fix applied to enableDiceSection');
} else {
    console.error('❌ enableDiceSection function not found - fix not applied');
}

// Also add a manual function to force turn advancement
window.forceNextTurn = function() {
    console.log('🔧 Forcing turn advancement...');
    
    if (window.nextTurn) {
        window.nextTurn();
        console.log('✅ Turn advanced');
    } else {
        console.error('❌ nextTurn function not found');
    }
};

// Add a function to check current turn status
window.checkTurnStatus = function() {
    console.log('🔍 Current turn status:');
    console.log('- currentPlayerIndex:', window.currentPlayerIndex);
    console.log('- players:', window.players?.map(p => p.name));
    console.log('- current player:', window.players?.[window.currentPlayerIndex]?.name);
    console.log('- isMultiplayerGame:', window.isMultiplayerGame);
    
    const playerNameInput = document.getElementById('player1-name');
    const localPlayerName = playerNameInput?.value?.trim() || window.localPlayerName || 'Unknown';
    console.log('- local player:', localPlayerName);
    
    const currentPlayer = window.players?.[window.currentPlayerIndex];
    const isMyTurn = currentPlayer?.name?.toLowerCase() === localPlayerName.toLowerCase();
    console.log('- is my turn:', isMyTurn);
    
    return {
        currentPlayerIndex: window.currentPlayerIndex,
        currentPlayerName: currentPlayer?.name,
        localPlayerName,
        isMyTurn,
        isMultiplayerGame: window.isMultiplayerGame
    };
};

console.log('✅ Multiplayer Turn Timeout Fix loaded');
console.log('💡 Use forceNextTurn() to manually advance turn if stuck');
console.log('💡 Use checkTurnStatus() to check current turn state');

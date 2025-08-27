// Emergency fix for stuck multiplayer turns
// This can be run directly in the browser console

console.log('🚨 Loading Emergency Turn Fix...');

// Function to force turn advancement
function emergencyTurnFix() {
    console.log('🚨 Emergency Turn Fix: Analyzing current state...');
    
    // Check current game state
    const currentPlayerIndex = window.currentPlayerIndex || 0;
    const players = window.players || [];
    const isMultiplayerGame = window.isMultiplayerGame || false;
    
    console.log('Current state:', {
        currentPlayerIndex,
        currentPlayer: players[currentPlayerIndex]?.name,
        totalPlayers: players.length,
        isMultiplayerGame
    });
    
    if (!isMultiplayerGame) {
        console.log('❌ Not a multiplayer game - fix not needed');
        return;
    }
    
    if (players.length === 0) {
        console.log('❌ No players found - game may not be initialized');
        return;
    }
    
    const currentPlayer = players[currentPlayerIndex];
    if (!currentPlayer) {
        console.log('❌ Current player not found');
        return;
    }
    
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
    
    console.log('Turn analysis:', {
        currentPlayer: currentPlayer.name,
        localPlayer: localPlayerName,
        isMyTurn
    });
    
    if (isMyTurn) {
        console.log('✅ It is your turn - no fix needed, just click the dice');
        return;
    }
    
    console.log('🔧 It is not your turn - starting auto-advance timer...');
    
    // Start a timer to auto-advance the turn
    const TURN_TIMEOUT = 10000; // 10 seconds
    
    console.log(`⏰ Starting ${TURN_TIMEOUT/1000}-second timer for ${currentPlayer.name}...`);
    
    const timeoutId = setTimeout(async () => {
        console.log(`⏰ Timer expired for ${currentPlayer.name} - forcing turn advancement`);
        
        // Double-check it's still the same player's turn
        const stillCurrentPlayer = window.players && window.players[window.currentPlayerIndex] && 
                                 window.players[window.currentPlayerIndex].name === currentPlayer.name;
        
        if (stillCurrentPlayer) {
            console.log('🔧 Executing auto-turn...');
            
            try {
                if (typeof window.executeMultiplayerAutoTurn === 'function') {
                    await window.executeMultiplayerAutoTurn();
                    console.log('✅ Auto-turn executed successfully');
                } else if (typeof window.nextTurn === 'function') {
                    window.nextTurn();
                    console.log('✅ Turn advanced using nextTurn()');
                } else {
                    console.log('❌ No turn advancement functions available');
                }
            } catch (error) {
                console.error('❌ Error during auto-turn:', error);
                
                // Fallback: try to just advance the turn
                if (typeof window.nextTurn === 'function') {
                    try {
                        window.nextTurn();
                        console.log('✅ Fallback: Turn advanced using nextTurn()');
                    } catch (fallbackError) {
                        console.error('❌ Fallback also failed:', fallbackError);
                    }
                }
            }
        } else {
            console.log('✅ Turn already advanced - no action needed');
        }
    }, TURN_TIMEOUT);
    
    console.log(`✅ Emergency timer set (ID: ${timeoutId})`);
    
    // Show a message to the user
    if (typeof window.showAdvisory === 'function') {
        window.showAdvisory(`⏰ Waiting for ${currentPlayer.name} to take their turn... (auto-advancing in ${TURN_TIMEOUT/1000}s)`, 'info');
    }
    
    return timeoutId;
}

// Function to manually advance turn
function forceAdvanceTurn() {
    console.log('🔧 Manually forcing turn advancement...');
    
    try {
        if (typeof window.nextTurn === 'function') {
            window.nextTurn();
            console.log('✅ Turn manually advanced');
            
            if (typeof window.showAdvisory === 'function') {
                window.showAdvisory('Turn manually advanced', 'success');
            }
        } else {
            console.log('❌ nextTurn function not available');
        }
    } catch (error) {
        console.error('❌ Error manually advancing turn:', error);
    }
}

// Function to check current turn status
function checkCurrentTurnStatus() {
    const currentPlayerIndex = window.currentPlayerIndex || 0;
    const players = window.players || [];
    const currentPlayer = players[currentPlayerIndex];
    
    let localPlayerName = '';
    const playerNameInput = document.getElementById('player1-name');
    if (playerNameInput) {
        localPlayerName = playerNameInput.value.trim();
    }
    if (!localPlayerName && window.localPlayerName) {
        localPlayerName = window.localPlayerName;
    }
    
    const isMyTurn = currentPlayer?.name?.toLowerCase() === localPlayerName.toLowerCase();
    
    const status = {
        currentPlayerIndex,
        currentPlayer: currentPlayer?.name || 'Unknown',
        localPlayer: localPlayerName || 'Unknown',
        isMyTurn,
        isMultiplayerGame: window.isMultiplayerGame || false,
        totalPlayers: players.length
    };
    
    console.log('🔍 Current turn status:', status);
    return status;
}

// Make functions available globally
window.emergencyTurnFix = emergencyTurnFix;
window.forceAdvanceTurn = forceAdvanceTurn;
window.checkCurrentTurnStatus = checkCurrentTurnStatus;

console.log('✅ Emergency Turn Fix loaded');
console.log('💡 Available functions:');
console.log('  - emergencyTurnFix() - Start auto-advance timer');
console.log('  - forceAdvanceTurn() - Manually advance turn');
console.log('  - checkCurrentTurnStatus() - Check current state');

// Auto-run the fix
console.log('🚀 Auto-running emergency turn fix...');
emergencyTurnFix();

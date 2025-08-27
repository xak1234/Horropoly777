// Emergency Fix for Development Button Deadlock
// Quick fix to prevent the game from getting stuck when players can't afford development

console.log('🚨 Loading Emergency Development Deadlock Fix...');

// Store original function
const originalUpdateInfoPanel = window.updateInfoPanel;

// Simple deadlock prevention
function emergencyUpdateInfoPanel(propertyId, playerName, options = {}) {
    console.log(`🚨 Emergency updateInfoPanel for ${propertyId} by ${playerName}`);
    
    // Check if this is a potential deadlock scenario
    const isOwnProperty = window.properties && window.properties[propertyId] && window.properties[propertyId].owner === playerName;
    
    if (isOwnProperty && window.isMultiplayerGame) {
        console.log(`🚨 Player ${playerName} landed on own property ${propertyId}`);
        
        // Quick affordability check
        const player = window.players ? window.players.find(p => p && p.name === playerName) : null;
        const devInfo = window.getPropertyDevelopmentInfo ? window.getPropertyDevelopmentInfo(propertyId) : null;
        
        if (player && devInfo && devInfo.cost && player.money < devInfo.cost) {
            console.log(`🚨 Player ${playerName} cannot afford development ($${player.money} < $${devInfo.cost}) - auto-progressing`);
            
            // Auto-progress after a short delay
            setTimeout(() => {
                console.log(`🚨 Auto-progressing turn for ${playerName}`);
                
                // Try multiple methods to progress the turn
                if (window.nextPlayerTurn) {
                    window.nextPlayerTurn();
                } else if (window.endTurn) {
                    window.endTurn();
                } else if (window.currentPlayerIndex !== undefined && window.players) {
                    // Manual turn progression
                    const nextIndex = (window.currentPlayerIndex + 1) % window.players.length;
                    window.currentPlayerIndex = nextIndex;
                    
                    // Update the current player name
                    const nextPlayer = window.players[nextIndex];
                    if (nextPlayer && nextPlayer.name) {
                        window.currentPlayerName = nextPlayer.name;
                        console.log(`🚨 Manually progressed to ${nextPlayer.name}'s turn`);
                    }
                    
                    // Enable dice for next player
                    if (window.enableDiceSection) {
                        window.enableDiceSection();
                    }
                    
                    // Update the game frame
                    if (window.updateGameFrame) {
                        window.updateGameFrame();
                    }
                }
            }, 1500); // Give UI time to update
            
            // Still call original but return early to prevent deadlock
            const result = originalUpdateInfoPanel ? originalUpdateInfoPanel(propertyId, playerName, options) : null;
            return result;
        }
    }
    
    // Call original function for all other cases
    return originalUpdateInfoPanel ? originalUpdateInfoPanel(propertyId, playerName, options) : null;
}

// Apply the fix
if (typeof window !== 'undefined') {
    window.updateInfoPanel = emergencyUpdateInfoPanel;
    
    console.log('🚨 Emergency Development Deadlock Fix applied!');
    
    // Add emergency unstick function
    window.emergencyUnstick = function() {
        console.log('🚨 Emergency unstick activated!');
        
        // Clear any timers
        if (window.autoActionTimer) {
            clearTimeout(window.autoActionTimer);
            window.autoActionTimer = null;
        }
        
        // Force turn progression
        if (window.currentPlayerIndex !== undefined && window.players && window.players.length > 0) {
            const nextIndex = (window.currentPlayerIndex + 1) % window.players.length;
            window.currentPlayerIndex = nextIndex;
            
            const nextPlayer = window.players[nextIndex];
            if (nextPlayer && nextPlayer.name) {
                window.currentPlayerName = nextPlayer.name;
                console.log(`🚨 Emergency: Forced progression to ${nextPlayer.name}'s turn`);
            }
            
            // Enable dice and update display
            if (window.enableDiceSection) {
                window.enableDiceSection();
            }
            if (window.updateGameFrame) {
                window.updateGameFrame();
            }
        }
        
        console.log('🚨 Emergency unstick completed!');
    };
    
    console.log('🚨 Added window.emergencyUnstick() function - call this if game gets stuck!');
}

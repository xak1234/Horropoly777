// Fix for Development Button Deadlock Issue
// This script fixes the issue where the game gets stuck when a player lands on their own property
// but can't afford to develop it

console.log('🏗️ Loading Development Button Deadlock Fix...');

// Store original functions
const originalUpdateInfoPanel = window.updateInfoPanel;
const originalStartAutoActionTimer = window.startAutoActionTimer;
const originalCanDevelopProperty = window.canDevelopProperty;

// Enhanced development affordability check
function enhancedCanDevelopProperty(propertyId, playerName) {
    console.log(`🏗️ Enhanced development check for ${propertyId} by ${playerName}`);
    
    // Get the original result
    const originalResult = originalCanDevelopProperty ? originalCanDevelopProperty(propertyId, playerName) : false;
    
    if (!originalResult) {
        console.log(`🏗️ Original development check failed for ${propertyId}`);
        return false;
    }
    
    // Check if player can afford it
    const player = window.players ? window.players.find(p => p && p.name === playerName) : null;
    if (!player) {
        console.log(`🏗️ Player ${playerName} not found for affordability check`);
        return false;
    }
    
    const devInfo = window.getPropertyDevelopmentInfo ? window.getPropertyDevelopmentInfo(propertyId) : null;
    if (!devInfo || !devInfo.cost) {
        console.log(`🏗️ No development info found for ${propertyId}`);
        return false;
    }
    
    const canAfford = player.money >= devInfo.cost;
    console.log(`🏗️ Affordability check: ${playerName} has $${player.money}, needs $${devInfo.cost}, canAfford: ${canAfford}`);
    
    return canAfford;
}

// Enhanced info panel update that handles unaffordable development
function enhancedUpdateInfoPanel(propertyId, playerName, options = {}) {
    console.log(`🏗️ Enhanced updateInfoPanel called for ${propertyId} by ${playerName}`);
    
    // Check if this is a development scenario
    const isOwnProperty = window.properties && window.properties[propertyId] && window.properties[propertyId].owner === playerName;
    
    if (isOwnProperty && window.isMultiplayerGame) {
        console.log(`🏗️ Player ${playerName} landed on own property ${propertyId} in multiplayer`);
        
        // Check if they can develop (including affordability)
        const canDevelop = enhancedCanDevelopProperty(propertyId, playerName);
        
        if (!canDevelop) {
            console.log(`🏗️ Player ${playerName} cannot develop ${propertyId} - auto-progressing turn`);
            
            // Auto-progress the turn since there's nothing to do
            setTimeout(() => {
                console.log(`🏗️ Auto-progressing turn for ${playerName} - no development possible`);
                
                // Clear any existing timers
                if (window.clearAutoActionTimer) {
                    window.clearAutoActionTimer();
                }
                
                // Move to next player's turn
                if (window.nextPlayerTurn) {
                    window.nextPlayerTurn();
                } else if (window.endTurn) {
                    window.endTurn();
                } else {
                    // Fallback: try to enable dice for next player
                    console.log(`🏗️ Using fallback turn progression`);
                    if (window.currentPlayerIndex !== undefined && window.players) {
                        const nextIndex = (window.currentPlayerIndex + 1) % window.players.length;
                        window.currentPlayerIndex = nextIndex;
                        if (window.enableDiceSection) {
                            window.enableDiceSection();
                        }
                    }
                }
            }, 1000); // Small delay to ensure UI updates
            
            // Still call original function but with modified options
            const modifiedOptions = { ...options, skipDevelopment: true };
            return originalUpdateInfoPanel ? originalUpdateInfoPanel(propertyId, playerName, modifiedOptions) : null;
        }
    }
    
    // Call original function for all other cases
    return originalUpdateInfoPanel ? originalUpdateInfoPanel(propertyId, playerName, options) : null;
}

// Enhanced auto-action timer that handles development deadlocks
function enhancedStartAutoActionTimer(actionType = 'roll') {
    console.log(`🏗️ Enhanced startAutoActionTimer for ${actionType}`);
    
    // If this is a development action but player can't afford it, skip it
    if (actionType === 'develop') {
        const currentPlayer = window.players && window.players[window.currentPlayerIndex];
        const currentProperty = window.currentPropertyForDevelopment; // This would need to be set by the game
        
        if (currentPlayer && currentProperty) {
            const canAfford = enhancedCanDevelopProperty(currentProperty, currentPlayer.name);
            if (!canAfford) {
                console.log(`🏗️ Skipping development timer - player ${currentPlayer.name} cannot afford ${currentProperty}`);
                
                // Auto-decline development and progress turn
                setTimeout(() => {
                    console.log(`🏗️ Auto-declining development for ${currentPlayer.name}`);
                    if (window.nextPlayerTurn) {
                        window.nextPlayerTurn();
                    } else if (window.endTurn) {
                        window.endTurn();
                    }
                }, 500);
                
                return;
            }
        }
    }
    
    // Call original function for all other cases
    return originalStartAutoActionTimer ? originalStartAutoActionTimer(actionType) : null;
}

// Apply the enhancements
if (typeof window !== 'undefined') {
    window.canDevelopProperty = enhancedCanDevelopProperty;
    window.updateInfoPanel = enhancedUpdateInfoPanel;
    window.startAutoActionTimer = enhancedStartAutoActionTimer;
    
    console.log('🏗️ Development Button Deadlock Fix applied successfully!');
    
    // Add a global function to manually unstick the game if needed
    window.unstickDevelopmentDeadlock = function() {
        console.log('🏗️ Manual unstick requested');
        
        if (window.clearAutoActionTimer) {
            window.clearAutoActionTimer();
        }
        
        if (window.nextPlayerTurn) {
            window.nextPlayerTurn();
        } else if (window.endTurn) {
            window.endTurn();
        } else {
            console.log('🏗️ Trying fallback turn progression');
            if (window.currentPlayerIndex !== undefined && window.players) {
                const nextIndex = (window.currentPlayerIndex + 1) % window.players.length;
                window.currentPlayerIndex = nextIndex;
                if (window.enableDiceSection) {
                    window.enableDiceSection();
                }
            }
        }
    };
    
    console.log('🏗️ Added window.unstickDevelopmentDeadlock() function for manual recovery');
}

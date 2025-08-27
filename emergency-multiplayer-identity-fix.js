// Emergency Fix for Multiplayer Identity Confusion
// Quick fix to resolve immediate turn confusion issues

console.log('🚨 Loading Emergency Multiplayer Identity Fix...');

// Store the original functions
const originalEnableDiceSection = window.enableDiceSection;
const originalUpdateGameFromState = window.updateGameFromState;

// Track local player more reliably
let confirmedLocalPlayer = null;

// Function to get reliable local player info
function getReliableLocalPlayer() {
    // Try multiple sources to determine who we are
    if (window.players && Array.isArray(window.players)) {
        for (let i = 0; i < window.players.length; i++) {
            const player = window.players[i];
            if (player && player.name && player.name !== 'undefined') {
                // Check if this is likely our player
                if (window.localPlayerName === player.name || 
                    (confirmedLocalPlayer && confirmedLocalPlayer.name === player.name)) {
                    confirmedLocalPlayer = { name: player.name, index: i };
                    return confirmedLocalPlayer;
                }
            }
        }
        
        // If we can't find a match, use the first valid player as fallback
        for (let i = 0; i < window.players.length; i++) {
            const player = window.players[i];
            if (player && player.name && player.name !== 'undefined') {
                confirmedLocalPlayer = { name: player.name, index: i };
                window.localPlayerName = player.name;
                console.log(`🚨 Using fallback player: ${player.name}`);
                return confirmedLocalPlayer;
            }
        }
    }
    
    return confirmedLocalPlayer;
}

// Enhanced enableDiceSection with better identity logic
function emergencyEnableDiceSection() {
    console.log('🚨 Emergency enableDiceSection called');
    
    const localPlayer = getReliableLocalPlayer();
    if (!localPlayer) {
        console.log('🚨 No reliable local player found, calling original function');
        return originalEnableDiceSection ? originalEnableDiceSection.call(this) : null;
    }
    
    const currentPlayerIndex = window.currentPlayerIndex || 0;
    const isMyTurn = (currentPlayerIndex === localPlayer.index);
    
    console.log(`🚨 Identity check: localPlayer="${localPlayer.name}" (index ${localPlayer.index}), currentPlayerIndex=${currentPlayerIndex}, isMyTurn=${isMyTurn}`);
    
    // Force update global variables
    window.localPlayerName = localPlayer.name;
    
    // Call original function
    return originalEnableDiceSection ? originalEnableDiceSection.call(this) : null;
}

// Enhanced updateGameFromState to reject corrupted data
function emergencyUpdateGameFromState(gameState) {
    console.log('🚨 Emergency updateGameFromState called');
    
    // Quick validation - reject if all players are undefined
    if (gameState && gameState.players) {
        let validPlayerCount = 0;
        for (const player of gameState.players) {
            if (player && player.name && player.name !== 'undefined') {
                validPlayerCount++;
            }
        }
        
        if (validPlayerCount === 0) {
            console.log('🚨 Rejecting corrupted game state - no valid players');
            return; // Don't update with corrupted data
        }
        
        console.log(`🚨 Game state has ${validPlayerCount} valid players`);
    }
    
    // Update our local player tracking
    getReliableLocalPlayer();
    
    // Call original function
    return originalUpdateGameFromState ? originalUpdateGameFromState.call(this, gameState) : null;
}

// Apply the emergency fixes
if (typeof window.enableDiceSection === 'function') {
    window.enableDiceSection = emergencyEnableDiceSection;
    console.log('✅ Emergency enableDiceSection fix applied');
}

if (typeof window.updateGameFromState === 'function') {
    window.updateGameFromState = emergencyUpdateGameFromState;
    console.log('✅ Emergency updateGameFromState fix applied');
}

// Also apply the dice timing fix
if (typeof window.startAutoActionTimer === 'function') {
    const originalStartAutoActionTimer = window.startAutoActionTimer;
    
    window.startAutoActionTimer = function(actionType = 'roll') {
        let delay;
        
        if (actionType === 'develop') {
            delay = window.isMultiplayerGame ? 45000 : 25000;
        } else if (actionType === 'purchase') {
            delay = window.isMultiplayerGame ? 12000 : 6000;
        } else { // roll
            delay = window.isMultiplayerGame ? 8000 : 5000; // 8s instead of 20s!
        }
        
        console.log(`🚨 Using ${delay/1000}s delay for ${actionType} (was 20s for rolls)`);
        
        // Clear existing timer
        if (window.autoActionTimer) {
            clearTimeout(window.autoActionTimer);
        }
        
        // Set new timer with reduced delay
        window.autoActionTimer = setTimeout(() => {
            console.log(`🚨 Auto-executing ${actionType} after ${delay/1000}s`);
            
            if (actionType === 'roll') {
                if (window.executeMultiplayerAutoTurn) {
                    window.executeMultiplayerAutoTurn();
                } else if (window.rollDice) {
                    window.rollDice();
                }
            } else if (actionType === 'purchase' && window.declineProperty) {
                window.declineProperty();
            } else if (actionType === 'develop' && window.skipDevelopment) {
                window.skipDevelopment();
            }
        }, delay);
        
        return delay;
    };
    
    console.log('✅ Emergency dice timing fix applied');
}

console.log('🚨 Emergency Multiplayer Identity Fix loaded successfully!');

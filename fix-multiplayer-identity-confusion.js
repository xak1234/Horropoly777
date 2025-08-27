// Fix for Multiplayer Player Identity Confusion
// This script fixes issues where players get confused about whose turn it is

console.log('🔧 Loading Multiplayer Identity Confusion Fix...');

// Store original functions
const originalUpdateGameFromState = window.updateGameFromState;
const originalEnableDiceSection = window.enableDiceSection;
const originalStartAutoActionTimer = window.startAutoActionTimer;

// Enhanced player identity tracking
let localPlayerIdentity = {
    name: null,
    userId: null,
    index: null,
    lastConfirmedAt: 0
};

// Function to establish and maintain local player identity
function establishLocalPlayerIdentity() {
    // Try to get from localStorage first
    const storedIdentity = localStorage.getItem('horropoly_player_identity');
    if (storedIdentity) {
        try {
            const parsed = JSON.parse(storedIdentity);
            if (parsed.name && parsed.userId) {
                localPlayerIdentity = { ...parsed, lastConfirmedAt: Date.now() };
                console.log('🔧 Restored local player identity:', localPlayerIdentity.name);
                return true;
            }
        } catch (e) {
            console.warn('🔧 Failed to parse stored identity:', e);
        }
    }

    // Try to get from current game state
    if (window.players && Array.isArray(window.players)) {
        for (let i = 0; i < window.players.length; i++) {
            const player = window.players[i];
            if (player && player.name && player.userId && player.name !== 'undefined') {
                // Check if this might be our player based on various indicators
                const isLikelyOurs = (
                    player.isHost === true || // We're the host
                    window.localPlayerName === player.name || // Name matches
                    window.currentPlayerName === player.name // Current player matches
                );
                
                if (isLikelyOurs) {
                    localPlayerIdentity = {
                        name: player.name,
                        userId: player.userId,
                        index: i,
                        lastConfirmedAt: Date.now()
                    };
                    
                    // Store for future use
                    localStorage.setItem('horropoly_player_identity', JSON.stringify(localPlayerIdentity));
                    console.log('🔧 Established local player identity:', localPlayerIdentity.name);
                    return true;
                }
            }
        }
    }

    return false;
}

// Enhanced updateGameFromState with identity preservation
function enhancedUpdateGameFromState(gameState) {
    console.log('🔧 Enhanced updateGameFromState called');
    
    // Establish our identity if we don't have it
    if (!localPlayerIdentity.name || Date.now() - localPlayerIdentity.lastConfirmedAt > 30000) {
        establishLocalPlayerIdentity();
    }

    // Validate incoming player data
    if (gameState && gameState.players) {
        let validPlayers = 0;
        let hasOurPlayer = false;

        for (let i = 0; i < gameState.players.length; i++) {
            const player = gameState.players[i];
            if (player && player.name && player.name !== 'undefined' && player.userId && player.userId !== 'undefined') {
                validPlayers++;
                
                // Check if this is our player
                if (localPlayerIdentity.name && 
                    (player.name === localPlayerIdentity.name || player.userId === localPlayerIdentity.userId)) {
                    hasOurPlayer = true;
                    
                    // Update our identity index if it changed
                    if (localPlayerIdentity.index !== i) {
                        console.log(`🔧 Player index changed from ${localPlayerIdentity.index} to ${i}`);
                        localPlayerIdentity.index = i;
                    }
                }
            }
        }

        console.log(`🔧 Player validation: ${validPlayers} valid players, hasOurPlayer: ${hasOurPlayer}`);

        // If we have valid players but don't find ourselves, try to re-establish identity
        if (validPlayers > 0 && !hasOurPlayer) {
            console.log('🔧 Our player not found in game state, re-establishing identity...');
            establishLocalPlayerIdentity();
        }

        // Reject updates with corrupted player data
        if (validPlayers === 0) {
            console.log('🚫 Rejecting game state update - no valid players found');
            return;
        }
    }

    // Set global player name variables to maintain consistency
    if (localPlayerIdentity.name) {
        window.localPlayerName = localPlayerIdentity.name;
        if (window.currentPlayerIndex === localPlayerIdentity.index) {
            window.currentPlayerName = localPlayerIdentity.name;
        }
    }

    // Call original function
    if (originalUpdateGameFromState) {
        return originalUpdateGameFromState.call(this, gameState);
    }
}

// Enhanced enableDiceSection with better identity checking
function enhancedEnableDiceSection() {
    console.log('🔧 Enhanced enableDiceSection called');
    
    // Ensure we have our identity
    if (!localPlayerIdentity.name) {
        establishLocalPlayerIdentity();
    }

    // Get current game state
    const currentPlayerIndex = window.currentPlayerIndex || 0;
    const totalPlayers = window.players ? window.players.length : 0;
    
    if (totalPlayers === 0) {
        console.log('🔧 No players found, skipping dice section update');
        return;
    }

    // Determine if it's our turn using multiple checks
    let isMyTurn = false;
    let currentPlayerName = 'Unknown';

    if (window.players && window.players[currentPlayerIndex]) {
        const currentPlayer = window.players[currentPlayerIndex];
        currentPlayerName = currentPlayer.name || 'Unknown';
        
        // Multiple ways to check if it's our turn
        isMyTurn = (
            currentPlayerIndex === localPlayerIdentity.index || // Index matches
            currentPlayerName === localPlayerIdentity.name || // Name matches
            (window.localPlayerName && currentPlayerName === window.localPlayerName) // Global name matches
        );
    }

    console.log(`🔧 Turn check: currentPlayer="${currentPlayerName}", localPlayer="${localPlayerIdentity.name}", isMyTurn=${isMyTurn}`);

    // Update global variables for consistency
    window.localPlayerName = localPlayerIdentity.name;
    if (isMyTurn) {
        window.currentPlayerName = localPlayerIdentity.name;
    }

    // Call original function
    if (originalEnableDiceSection) {
        return originalEnableDiceSection.call(this);
    }
}

// Enhanced auto-action timer with reduced delays
function enhancedStartAutoActionTimer(actionType = 'roll') {
    console.log(`🔧 Enhanced startAutoActionTimer called for ${actionType}`);
    
    // Use reduced delays for better responsiveness
    let delay;
    
    if (actionType === 'develop') {
        delay = window.isMultiplayerGame ? 45000 : 25000; // 45s multiplayer, 25s single
    } else if (actionType === 'purchase') {
        delay = window.isMultiplayerGame ? 12000 : 6000; // 12s multiplayer, 6s single
    } else { // roll
        delay = window.isMultiplayerGame ? 8000 : 5000; // 8s multiplayer, 5s single (was 20s!)
    }

    console.log(`🔧 Using ${delay/1000}s delay for ${actionType} action`);

    // Clear any existing timer
    if (window.autoActionTimer) {
        clearTimeout(window.autoActionTimer);
        window.autoActionTimer = null;
    }

    // Set new timer
    window.autoActionTimer = setTimeout(() => {
        console.log(`🔧 Auto-action timer expired for ${actionType}. Auto-executing...`);
        
        if (actionType === 'roll') {
            if (window.executeMultiplayerAutoTurn) {
                window.executeMultiplayerAutoTurn();
            } else if (window.rollDice) {
                window.rollDice();
            }
        } else if (actionType === 'purchase') {
            if (window.declineProperty) {
                window.declineProperty();
            }
        } else if (actionType === 'develop') {
            if (window.skipDevelopment) {
                window.skipDevelopment();
            }
        }
    }, delay);

    return delay;
}

// Apply enhancements
if (typeof window.updateGameFromState === 'function') {
    window.updateGameFromState = enhancedUpdateGameFromState;
    console.log('✅ Enhanced updateGameFromState applied');
}

if (typeof window.enableDiceSection === 'function') {
    window.enableDiceSection = enhancedEnableDiceSection;
    console.log('✅ Enhanced enableDiceSection applied');
}

if (typeof window.startAutoActionTimer === 'function') {
    window.startAutoActionTimer = enhancedStartAutoActionTimer;
    console.log('✅ Enhanced startAutoActionTimer applied');
}

// Initialize identity on load
setTimeout(() => {
    establishLocalPlayerIdentity();
}, 1000);

console.log('✅ Multiplayer Identity Confusion Fix loaded successfully');

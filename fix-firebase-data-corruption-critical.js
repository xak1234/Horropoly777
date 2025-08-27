// Critical Fix for Firebase Player Data Corruption
// This script fixes the severe data corruption causing properties to vanish and return

console.log('🚨 Loading Critical Firebase Data Corruption Fix...');

// Store original functions
const originalUpdateGameFromState = window.updateGameFromState;
const originalUpdatePlayerData = window.updatePlayerData;

// Enhanced player data validation and repair
function validateAndRepairPlayerData(players) {
    if (!Array.isArray(players)) {
        console.log('🔧 Converting non-array players to array');
        if (typeof players === 'object' && players !== null) {
            // Convert object with numeric keys to array
            const keys = Object.keys(players).filter(key => !isNaN(key)).sort((a, b) => parseInt(a) - parseInt(b));
            players = keys.map(key => players[key]);
        } else {
            return [];
        }
    }

    return players.map((player, index) => {
        if (!player || typeof player !== 'object') {
            console.log(`🔧 Repairing null/invalid player at index ${index}`);
            return null; // Mark for removal
        }

        // Create a repaired copy
        const repairedPlayer = { ...player };

        // Fix undefined/null names
        if (!repairedPlayer.name || repairedPlayer.name === 'undefined' || repairedPlayer.name === 'null') {
            console.log(`🔧 Repairing undefined name for player ${index}`);
            repairedPlayer.name = `Player_${index + 1}`;
        }

        // Fix undefined/null userIds
        if (!repairedPlayer.userId || repairedPlayer.userId === 'undefined' || repairedPlayer.userId === 'null') {
            console.log(`🔧 Repairing undefined userId for player ${index}`);
            repairedPlayer.userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }

        // Ensure required fields exist
        if (typeof repairedPlayer.isHost !== 'boolean') {
            repairedPlayer.isHost = index === 0;
        }

        // Ensure position data exists
        if (typeof repairedPlayer.x !== 'number') repairedPlayer.x = 0;
        if (typeof repairedPlayer.y !== 'number') repairedPlayer.y = 0;
        if (!repairedPlayer.currentSquare) repairedPlayer.currentSquare = 'go';

        // Ensure money exists
        if (typeof repairedPlayer.money !== 'number') repairedPlayer.money = 12000;

        // Ensure properties array exists
        if (!Array.isArray(repairedPlayer.properties)) repairedPlayer.properties = [];

        // Ensure color exists
        if (!repairedPlayer.color) {
            const colors = ['#ff0000', '#0000ff', '#00ff00', '#ffff00'];
            repairedPlayer.color = colors[index % colors.length];
        }

        console.log(`🔧 Player ${index} repaired: ${repairedPlayer.name} (${repairedPlayer.userId})`);
        return repairedPlayer;
    }).filter(player => player !== null); // Remove null players
}

// Enhanced updateGameFromState with corruption protection
function enhancedUpdateGameFromState(gameState) {
    console.log('🔧 Enhanced updateGameFromState with corruption protection');
    
    if (!gameState || typeof gameState !== 'object') {
        console.log('🚨 Invalid game state received, ignoring update');
        return;
    }

    // Validate and repair player data before processing
    if (gameState.players) {
        const originalPlayerCount = Array.isArray(gameState.players) ? gameState.players.length : Object.keys(gameState.players).length;
        console.log(`🔧 Original player count: ${originalPlayerCount}`);
        
        const repairedPlayers = validateAndRepairPlayerData(gameState.players);
        console.log(`🔧 Repaired player count: ${repairedPlayers.length}`);
        
        if (repairedPlayers.length === 0) {
            console.log('🚨 No valid players after repair - maintaining local state');
            return;
        }
        
        // Update the game state with repaired players
        gameState.players = repairedPlayers;
        
        // Log the repaired players
        repairedPlayers.forEach((player, index) => {
            console.log(`🔧 Repaired Player ${index}: ${player.name} (${player.userId}) - Host: ${player.isHost}`);
        });
    }

    // Call the original function with repaired data
    if (originalUpdateGameFromState) {
        return originalUpdateGameFromState(gameState);
    }
}

// Enhanced updatePlayerData with validation
function enhancedUpdatePlayerData(playerIndex, updates) {
    console.log(`🔧 Enhanced updatePlayerData for player ${playerIndex}`);
    
    if (!window.players || !Array.isArray(window.players) || !window.players[playerIndex]) {
        console.log(`🚨 Invalid player data for index ${playerIndex}, skipping update`);
        return;
    }

    const player = window.players[playerIndex];
    
    // Validate player before updating
    if (!player.name || player.name === 'undefined' || !player.userId || player.userId === 'undefined') {
        console.log(`🔧 Repairing player ${playerIndex} before update`);
        
        if (!player.name || player.name === 'undefined') {
            player.name = `Player_${playerIndex + 1}`;
        }
        if (!player.userId || player.userId === 'undefined') {
            player.userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        
        console.log(`🔧 Player ${playerIndex} repaired: ${player.name} (${player.userId})`);
    }

    // Call original function
    if (originalUpdatePlayerData) {
        return originalUpdatePlayerData(playerIndex, updates);
    }
}

// Property sync stabilization
function stabilizePropertySync() {
    console.log('🏠 Stabilizing property sync...');
    
    // Ensure properties object exists
    if (!window.properties || typeof window.properties !== 'object') {
        console.log('🏠 Initializing properties object');
        window.properties = {};
    }

    // Validate property ownership consistency
    if (window.players && Array.isArray(window.players)) {
        window.players.forEach((player, index) => {
            if (player && Array.isArray(player.properties)) {
                player.properties.forEach(propertyId => {
                    if (window.properties[propertyId] && window.properties[propertyId].owner !== player.name) {
                        console.log(`🏠 Fixing property ownership mismatch: ${propertyId} should be owned by ${player.name}`);
                        window.properties[propertyId].owner = player.name;
                        window.properties[propertyId].ownerColor = player.color || '#ff0000';
                    }
                });
            }
        });
    }
}

// Apply the enhancements
if (typeof window !== 'undefined') {
    window.updateGameFromState = enhancedUpdateGameFromState;
    window.updatePlayerData = enhancedUpdatePlayerData;
    
    // Add periodic property sync stabilization
    setInterval(stabilizePropertySync, 5000); // Every 5 seconds
    
    console.log('🔧 Critical Firebase Data Corruption Fix applied successfully!');
    
    // Add emergency repair function
    window.emergencyRepairGameState = function() {
        console.log('🚨 Emergency game state repair initiated!');
        
        // Repair local players
        if (window.players && Array.isArray(window.players)) {
            window.players = validateAndRepairPlayerData(window.players);
            console.log('🔧 Local players repaired');
        }
        
        // Stabilize properties
        stabilizePropertySync();
        
        // Force visual update
        if (window.updateGameFrame) {
            window.updateGameFrame();
        }
        
        console.log('🔧 Emergency repair completed!');
    };
    
    // Add data corruption detection
    window.detectDataCorruption = function() {
        console.log('🔍 Detecting data corruption...');
        
        let issues = [];
        
        if (window.players && Array.isArray(window.players)) {
            window.players.forEach((player, index) => {
                if (!player) {
                    issues.push(`Player ${index}: null/undefined`);
                } else {
                    if (!player.name || player.name === 'undefined') {
                        issues.push(`Player ${index}: undefined name`);
                    }
                    if (!player.userId || player.userId === 'undefined') {
                        issues.push(`Player ${index}: undefined userId`);
                    }
                }
            });
        } else {
            issues.push('Players array is invalid');
        }
        
        if (issues.length > 0) {
            console.log('🚨 Data corruption detected:', issues);
            return { corrupted: true, issues };
        } else {
            console.log('✅ No data corruption detected');
            return { corrupted: false, issues: [] };
        }
    };
    
    console.log('🔧 Added emergency functions:');
    console.log('  - window.emergencyRepairGameState()');
    console.log('  - window.detectDataCorruption()');
}

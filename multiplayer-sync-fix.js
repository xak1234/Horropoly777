/**
 * Comprehensive Multiplayer Sync Fix
 * Addresses player data corruption, sync issues, and missing player recovery
 */

// Enhanced player data validation and recovery
function validateAndRecoverPlayerData(players, existingPlayers = []) {
    console.log('🔍 Validating player data:', { 
        incoming: players?.length || 0, 
        existing: existingPlayers?.length || 0 
    });
    
    if (!Array.isArray(players)) {
        console.error('❌ Players is not an array:', typeof players);
        return existingPlayers.length > 0 ? existingPlayers : [];
    }
    
    // Filter out completely corrupted players
    const validPlayers = players.filter(player => {
        if (!player || typeof player !== 'object') {
            console.warn('⚠️ Filtering out non-object player:', player);
            return false;
        }
        
        // Player is valid if it has at least a name or userId
        const hasValidIdentity = (player.name && player.name !== 'undefined') || 
                                (player.userId && player.userId !== 'undefined');
        
        if (!hasValidIdentity) {
            console.warn('⚠️ Filtering out player with no valid identity:', player);
            return false;
        }
        
        return true;
    });
    
    // Recover missing data from existing players
    const recoveredPlayers = validPlayers.map((player, index) => {
        const existingPlayer = existingPlayers[index];
        
        // Recover missing name
        if (!player.name || player.name === 'undefined') {
            if (existingPlayer?.name && existingPlayer.name !== 'undefined') {
                console.log(`🔧 Recovering name for player ${index}: ${existingPlayer.name}`);
                player.name = existingPlayer.name;
            } else {
                player.name = `Player ${index + 1}`;
                console.log(`🔧 Assigned fallback name for player ${index}: ${player.name}`);
            }
        }
        
        // Recover missing userId
        if (!player.userId || player.userId === 'undefined') {
            if (existingPlayer?.userId && existingPlayer.userId !== 'undefined') {
                console.log(`🔧 Recovering userId for player ${index}: ${existingPlayer.userId}`);
                player.userId = existingPlayer.userId;
            } else {
                player.userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                console.log(`🔧 Generated new userId for player ${index}: ${player.userId}`);
            }
        }
        
        // Recover missing isHost
        if (player.isHost === undefined || player.isHost === null) {
            if (existingPlayer?.isHost !== undefined) {
                console.log(`🔧 Recovering isHost for player ${index}: ${existingPlayer.isHost}`);
                player.isHost = existingPlayer.isHost;
            } else {
                player.isHost = index === 0; // First player is host by default
                console.log(`🔧 Assigned default isHost for player ${index}: ${player.isHost}`);
            }
        }
        
        // Preserve other critical game data
        const criticalFields = ['money', 'currentSquare', 'properties', 'color', 'x', 'y', 'isInJail', 'jailTurns'];
        criticalFields.forEach(field => {
            if (player[field] === undefined && existingPlayer?.[field] !== undefined) {
                player[field] = existingPlayer[field];
                console.log(`🔧 Recovered ${field} for ${player.name}: ${player[field]}`);
            }
        });
        
        return player;
    });
    
    // Check for missing players (existing players not in the new data)
    if (existingPlayers.length > recoveredPlayers.length) {
        console.warn('⚠️ Detected missing players, attempting recovery...');
        
        const existingPlayerIds = recoveredPlayers.map(p => p.userId || p.name);
        const missingPlayers = existingPlayers.filter(p => 
            p && (p.name && p.name !== 'undefined') && 
            !existingPlayerIds.includes(p.userId || p.name)
        );
        
        if (missingPlayers.length > 0) {
            console.log('🔧 Recovering missing players:', missingPlayers.map(p => p.name));
            recoveredPlayers.push(...missingPlayers);
        }
    }
    
    console.log('✅ Player data validation complete:', {
        original: players?.length || 0,
        valid: validPlayers.length,
        recovered: recoveredPlayers.length,
        players: recoveredPlayers.map(p => ({ name: p.name, userId: p.userId, isHost: p.isHost }))
    });
    
    return recoveredPlayers;
}

// Enhanced Firebase object to array conversion
function robustConvertObjectToArray(obj) {
    if (Array.isArray(obj)) {
        return obj;
    }
    
    if (!obj || typeof obj !== 'object') {
        console.warn('⚠️ Cannot convert non-object to array:', typeof obj);
        return [];
    }
    
    const keys = Object.keys(obj);
    
    // Check if all keys are numeric (array-like object)
    const numericKeys = keys.filter(key => !isNaN(parseInt(key)));
    
    if (numericKeys.length === keys.length && keys.length > 0) {
        console.log('🔄 Converting object with numeric keys to array');
        
        // Sort keys numerically and convert
        const sortedKeys = numericKeys.sort((a, b) => parseInt(a) - parseInt(b));
        const converted = sortedKeys.map(key => obj[key]);
        
        // Validate the conversion
        const hasValidData = converted.some(item => 
            item && typeof item === 'object' && 
            (item.name || item.userId)
        );
        
        if (hasValidData) {
            console.log('✅ Successfully converted object to array:', converted.length, 'items');
            return converted;
        } else {
            console.warn('⚠️ Converted array contains no valid data');
            return [];
        }
    }
    
    // If not array-like, try to extract values
    const values = Object.values(obj);
    const validValues = values.filter(val => 
        val && typeof val === 'object' && (val.name || val.userId)
    );
    
    if (validValues.length > 0) {
        console.log('🔄 Extracting values from object as array');
        return validValues;
    }
    
    console.warn('⚠️ Cannot convert object to meaningful array:', obj);
    return [];
}

// Enhanced game state update with better error handling
function enhancedUpdateGameFromState(gameState, existingPlayers = []) {
    console.log('🔄 Enhanced updateGameFromState called');
    
    try {
        // Validate basic game state structure
        if (!gameState || typeof gameState !== 'object') {
            console.error('❌ Invalid game state received:', gameState);
            return false;
        }
        
        // Handle players data with enhanced validation
        if (gameState.players) {
            // Convert object to array if needed
            const convertedPlayers = robustConvertObjectToArray(gameState.players);
            
            // Validate and recover player data
            const validatedPlayers = validateAndRecoverPlayerData(convertedPlayers, existingPlayers);
            
            if (validatedPlayers.length === 0) {
                console.error('❌ No valid players after validation, preserving existing data');
                return false;
            }
            
            gameState.players = validatedPlayers;
            console.log('✅ Players data processed successfully:', validatedPlayers.length, 'players');
        } else {
            console.error('❌ No players data in game state');
            return false;
        }
        
        // Validate currentTurn
        if (typeof gameState.currentTurn !== 'number' || 
            gameState.currentTurn < 0 || 
            gameState.currentTurn >= gameState.players.length) {
            
            console.warn('⚠️ Invalid currentTurn, resetting to 0');
            gameState.currentTurn = 0;
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Error in enhanced updateGameFromState:', error);
        return false;
    }
}

// Player data integrity monitor
function monitorPlayerDataIntegrity(players) {
    if (!Array.isArray(players)) {
        console.error('🚨 INTEGRITY ALERT: Players is not an array!', typeof players);
        return false;
    }
    
    let integrityScore = 0;
    let issues = [];
    
    players.forEach((player, index) => {
        if (!player) {
            issues.push(`Player ${index}: null/undefined`);
            return;
        }
        
        if (!player.name || player.name === 'undefined') {
            issues.push(`Player ${index}: missing/invalid name`);
        } else {
            integrityScore += 1;
        }
        
        if (!player.userId || player.userId === 'undefined') {
            issues.push(`Player ${index}: missing/invalid userId`);
        } else {
            integrityScore += 1;
        }
        
        if (player.isHost === undefined || player.isHost === null) {
            issues.push(`Player ${index}: missing isHost flag`);
        } else {
            integrityScore += 1;
        }
    });
    
    const maxScore = players.length * 3;
    const integrityPercentage = maxScore > 0 ? (integrityScore / maxScore) * 100 : 0;
    
    console.log(`🔍 Player data integrity: ${integrityPercentage.toFixed(1)}% (${integrityScore}/${maxScore})`);
    
    if (issues.length > 0) {
        console.warn('⚠️ Player data issues detected:', issues);
    }
    
    return integrityPercentage >= 80; // Consider 80%+ as acceptable
}

// Sync state recovery mechanism
function recoverSyncState(gameState, localState) {
    console.log('🔧 Attempting sync state recovery...');
    
    const recovered = { ...gameState };
    
    // Recover players if corrupted
    if (!gameState.players || !Array.isArray(gameState.players) || 
        !monitorPlayerDataIntegrity(gameState.players)) {
        
        if (localState.players && Array.isArray(localState.players) && 
            monitorPlayerDataIntegrity(localState.players)) {
            
            console.log('🔧 Using local player data for recovery');
            recovered.players = localState.players;
        }
    }
    
    // Recover currentTurn if invalid
    if (typeof recovered.currentTurn !== 'number' || 
        recovered.currentTurn < 0 || 
        recovered.currentTurn >= recovered.players?.length) {
        
        if (typeof localState.currentPlayerIndex === 'number' && 
            localState.currentPlayerIndex >= 0 && 
            localState.currentPlayerIndex < recovered.players?.length) {
            
            console.log('🔧 Using local currentPlayerIndex for recovery');
            recovered.currentTurn = localState.currentPlayerIndex;
        } else {
            recovered.currentTurn = 0;
        }
    }
    
    return recovered;
}

// Export functions for use in main game files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        validateAndRecoverPlayerData,
        robustConvertObjectToArray,
        enhancedUpdateGameFromState,
        monitorPlayerDataIntegrity,
        recoverSyncState
    };
} else if (typeof window !== 'undefined') {
    window.MultiplayerSyncFix = {
        validateAndRecoverPlayerData,
        robustConvertObjectToArray,
        enhancedUpdateGameFromState,
        monitorPlayerDataIntegrity,
        recoverSyncState
    };
}

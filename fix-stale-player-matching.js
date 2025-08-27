/**
 * Fix Stale Player Matching Issue
 * This addresses the core problem where old players with the same names
 * are causing false matches when new players try to join
 */

// Enhanced player matching that considers session freshness
function isPlayerStale(player, maxAgeMinutes = 30) {
    if (!player.lastActivity && !player.createdAt) {
        console.log('🕒 Player has no timestamp data, considering stale:', player.name);
        return true;
    }
    
    const now = Date.now();
    const playerTime = player.lastActivity || new Date(player.createdAt).getTime() || 0;
    const ageMinutes = (now - playerTime) / (1000 * 60);
    
    const isStale = ageMinutes > maxAgeMinutes;
    console.log(`🕒 Player ${player.name} age: ${ageMinutes.toFixed(1)} minutes, stale: ${isStale}`);
    
    return isStale;
}

// Enhanced player validation that removes stale players
function validateAndCleanPlayers(players, maxAgeMinutes = 30) {
    console.log('🧹 Validating and cleaning player list...');
    
    if (!Array.isArray(players)) {
        console.warn('⚠️ Players is not an array:', typeof players);
        return [];
    }
    
    const validPlayers = players.filter(player => {
        if (!player) {
            console.log('🗑️ Removing null/undefined player');
            return false;
        }
        
        if (!player.name || player.name === 'undefined') {
            console.log('🗑️ Removing player with invalid name:', player);
            return false;
        }
        
        if (!player.userId || player.userId === 'undefined') {
            console.log('🗑️ Removing player with invalid userId:', player);
            return false;
        }
        
        if (isPlayerStale(player, maxAgeMinutes)) {
            console.log('🗑️ Removing stale player:', player.name, 'userId:', player.userId);
            return false;
        }
        
        return true;
    });
    
    console.log(`✅ Player validation complete: ${players.length} -> ${validPlayers.length} players`);
    return validPlayers;
}

// Enhanced player existence check with session validation
function findExistingPlayer(validPlayers, playerName, requireFreshSession = true) {
    console.log(`🔍 Looking for existing player "${playerName}" (requireFresh: ${requireFreshSession})`);
    
    // First, try exact name match
    const exactMatches = validPlayers.filter(p => p.name === playerName);
    
    if (exactMatches.length === 0) {
        console.log(`✅ No existing player found with name "${playerName}"`);
        return null;
    }
    
    if (exactMatches.length === 1) {
        const match = exactMatches[0];
        console.log(`🔍 Found single match for "${playerName}":`, {
            name: match.name,
            userId: match.userId,
            isHost: match.isHost,
            isStale: requireFreshSession ? isPlayerStale(match, 5) : false
        });
        
        // If requiring fresh session, check if this player is stale
        if (requireFreshSession && isPlayerStale(match, 5)) {
            console.log(`🗑️ Existing player "${playerName}" is stale, treating as new player`);
            return null;
        }
        
        return match;
    }
    
    // Multiple matches - this shouldn't happen with proper cleanup
    console.warn(`⚠️ Multiple players found with name "${playerName}":`, exactMatches.length);
    exactMatches.forEach((match, index) => {
        console.log(`  Match ${index + 1}:`, {
            name: match.name,
            userId: match.userId,
            isHost: match.isHost,
            isStale: isPlayerStale(match, 5)
        });
    });
    
    // Return the most recent non-stale match, or null if all are stale
    const freshMatches = exactMatches.filter(p => !isPlayerStale(p, 5));
    if (freshMatches.length > 0) {
        console.log(`✅ Using most recent fresh match for "${playerName}"`);
        return freshMatches[0];
    }
    
    console.log(`🗑️ All matches for "${playerName}" are stale, treating as new player`);
    return null;
}

// Function to clean up a room before processing joins
async function cleanupRoomBeforeJoin(gameRoomRef, gameState) {
    console.log('🧹 Cleaning up room before processing join...');
    
    const originalPlayers = gameState.players || [];
    const cleanedPlayers = validateAndCleanPlayers(originalPlayers, 30);
    
    if (cleanedPlayers.length !== originalPlayers.length) {
        console.log(`🧹 Room cleanup needed: ${originalPlayers.length} -> ${cleanedPlayers.length} players`);
        
        try {
            await updateDoc(gameRoomRef, {
                players: cleanedPlayers,
                lastActivity: Date.now(),
                lastCleaned: new Date().toISOString()
            });
            
            console.log('✅ Room cleanup completed successfully');
            return cleanedPlayers;
        } catch (error) {
            console.warn('⚠️ Room cleanup failed, continuing with original data:', error);
            return originalPlayers;
        }
    }
    
    console.log('✅ Room is already clean');
    return cleanedPlayers;
}

// Enhanced join room logic with better player matching
async function enhancedJoinGameRoom(roomId, playerName) {
    console.log('🚀 Enhanced joinGameRoom called:', { roomId, playerName });
    
    try {
        const { getDb } = await import('./firebase-init.js');
        const { doc, getDoc, updateDoc } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');
        
        const db = await getDb();
        const gameRoomRef = doc(db, 'gameRooms', roomId);
        
        // Get current room state
        const roomDoc = await getDoc(gameRoomRef);
        if (!roomDoc.exists()) {
            throw new Error('Room not found');
        }
        
        const gameState = roomDoc.data();
        
        // Clean up the room first
        const cleanedPlayers = await cleanupRoomBeforeJoin(gameRoomRef, gameState);
        
        // Check for existing player with enhanced logic
        const existingPlayer = findExistingPlayer(cleanedPlayers, playerName, true);
        
        if (existingPlayer) {
            console.log(`✅ Player "${playerName}" found in room, allowing rejoin`);
            return {
                userId: existingPlayer.userId,
                playerName: existingPlayer.name,
                isRejoin: true
            };
        }
        
        // Check room capacity
        const maxPlayers = gameState.maxPlayers || 2;
        if (cleanedPlayers.length >= maxPlayers) {
            throw new Error(`Room is full (${cleanedPlayers.length}/${maxPlayers} players)`);
        }
        
        // Create new player
        const newPlayer = {
            name: playerName,
            userId: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            isHost: cleanedPlayers.length === 0,
            createdAt: new Date().toISOString(),
            lastActivity: Date.now(),
            // ... other player properties
        };
        
        const updatedPlayers = [...cleanedPlayers, newPlayer];
        
        // Update room
        await updateDoc(gameRoomRef, {
            players: updatedPlayers,
            lastActivity: Date.now()
        });
        
        console.log(`✅ Player "${playerName}" added to room successfully`);
        return {
            userId: newPlayer.userId,
            playerName: newPlayer.name,
            isRejoin: false
        };
        
    } catch (error) {
        console.error('❌ Enhanced joinGameRoom failed:', error);
        throw error;
    }
}

// Export functions for use
if (typeof window !== 'undefined') {
    window.StalePlayerFix = {
        isPlayerStale,
        validateAndCleanPlayers,
        findExistingPlayer,
        cleanupRoomBeforeJoin,
        enhancedJoinGameRoom
    };
    
    // Quick access functions
    window.cleanStalePlayersFromRoom = async function(roomId) {
        console.log('🧹 Cleaning stale players from room:', roomId);
        
        try {
            const { getDb } = await import('./firebase-init.js');
            const { doc, getDoc, updateDoc } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');
            
            const db = await getDb();
            const gameRoomRef = doc(db, 'gameRooms', roomId);
            const roomDoc = await getDoc(gameRoomRef);
            
            if (!roomDoc.exists()) {
                console.log('❌ Room not found');
                return;
            }
            
            const gameState = roomDoc.data();
            const cleanedPlayers = await cleanupRoomBeforeJoin(gameRoomRef, gameState);
            
            console.log('✅ Stale player cleanup completed');
            return cleanedPlayers;
            
        } catch (error) {
            console.error('❌ Failed to clean stale players:', error);
            throw error;
        }
    };
    
    console.log('🔧 Stale Player Fix utilities loaded!');
    console.log('💡 Use cleanStalePlayersFromRoom("ROOM_ID") to clean a room');
}

export {
    isPlayerStale,
    validateAndCleanPlayers,
    findExistingPlayer,
    cleanupRoomBeforeJoin,
    enhancedJoinGameRoom
};

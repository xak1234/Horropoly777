/**
 * Cleanup Stale Rooms Utility
 * Use this to clean up rooms with invalid/stale player data
 */

// Function to clean up a specific room
async function cleanupRoom(roomId) {
    console.log('🧹 Starting cleanup for room:', roomId);
    
    try {
        const { getDb } = await import('./firebase-init.js');
        const { doc, getDoc, updateDoc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');
        
        const db = await getDb();
        const roomRef = doc(db, 'gameRooms', roomId);
        const roomDoc = await getDoc(roomRef);
        
        if (!roomDoc.exists()) {
            console.log('❌ Room not found:', roomId);
            return false;
        }
        
        const roomData = roomDoc.data();
        const originalPlayers = roomData.players || [];
        
        console.log('📊 Room before cleanup:', {
            roomId: roomId,
            playerCount: originalPlayers.length,
            players: originalPlayers.map(p => ({ 
                name: p?.name, 
                userId: p?.userId, 
                isValid: !!(p?.name && p?.name !== 'undefined' && p?.userId && p?.userId !== 'undefined')
            }))
        });
        
        // Filter out invalid players
        const validPlayers = originalPlayers.filter(player => {
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
            
            return true;
        });
        
        console.log('📊 Room after cleanup:', {
            originalPlayerCount: originalPlayers.length,
            validPlayerCount: validPlayers.length,
            removedCount: originalPlayers.length - validPlayers.length,
            validPlayers: validPlayers.map(p => ({ name: p.name, userId: p.userId, isHost: p.isHost }))
        });
        
        if (validPlayers.length === 0) {
            // If no valid players, delete the room entirely
            console.log('🗑️ No valid players found, deleting room entirely');
            await deleteDoc(roomRef);
            console.log('✅ Room deleted successfully');
            return true;
        } else if (validPlayers.length !== originalPlayers.length) {
            // Update room with cleaned players
            console.log('🧹 Updating room with cleaned player data');
            await updateDoc(roomRef, {
                players: validPlayers,
                lastActivity: Date.now(),
                lastCleaned: new Date().toISOString()
            });
            console.log('✅ Room cleaned successfully');
            return true;
        } else {
            console.log('✅ Room is already clean');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Error cleaning room:', error);
        throw error;
    }
}

// Function to clean up all rooms
async function cleanupAllRooms() {
    console.log('🧹 Starting cleanup for ALL rooms...');
    
    try {
        const { getDb } = await import('./firebase-init.js');
        const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');
        
        const db = await getDb();
        const roomsCollection = collection(db, 'gameRooms');
        const roomsSnapshot = await getDocs(roomsCollection);
        
        console.log(`📊 Found ${roomsSnapshot.size} rooms to check`);
        
        let cleanedCount = 0;
        let deletedCount = 0;
        
        for (const roomDoc of roomsSnapshot.docs) {
            const roomId = roomDoc.id;
            console.log(`\n🔍 Checking room: ${roomId}`);
            
            try {
                const wasModified = await cleanupRoom(roomId);
                if (wasModified) {
                    // Check if room still exists (might have been deleted)
                    const { getDoc, doc } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');
                    const updatedDoc = await getDoc(doc(db, 'gameRooms', roomId));
                    
                    if (updatedDoc.exists()) {
                        cleanedCount++;
                    } else {
                        deletedCount++;
                    }
                }
            } catch (error) {
                console.error(`❌ Failed to clean room ${roomId}:`, error);
            }
        }
        
        console.log('\n✅ Cleanup completed:', {
            totalRoomsChecked: roomsSnapshot.size,
            roomsCleaned: cleanedCount,
            roomsDeleted: deletedCount,
            roomsUnchanged: roomsSnapshot.size - cleanedCount - deletedCount
        });
        
        return { cleanedCount, deletedCount, totalChecked: roomsSnapshot.size };
        
    } catch (error) {
        console.error('❌ Error during bulk cleanup:', error);
        throw error;
    }
}

// Function to get room status
async function getRoomStatus(roomId) {
    console.log('📊 Getting status for room:', roomId);
    
    try {
        const { getDb } = await import('./firebase-init.js');
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');
        
        const db = await getDb();
        const roomRef = doc(db, 'gameRooms', roomId);
        const roomDoc = await getDoc(roomRef);
        
        if (!roomDoc.exists()) {
            console.log('❌ Room not found:', roomId);
            return null;
        }
        
        const roomData = roomDoc.data();
        const players = roomData.players || [];
        
        const status = {
            roomId: roomId,
            roomName: roomData.roomName,
            gameStarted: roomData.gameStarted,
            maxPlayers: roomData.maxPlayers || 2,
            playerCount: players.length,
            createdAt: roomData.createdAt,
            lastActivity: roomData.lastActivity,
            players: players.map((p, index) => ({
                index: index,
                name: p?.name,
                userId: p?.userId,
                isHost: p?.isHost,
                isValid: !!(p?.name && p?.name !== 'undefined' && p?.userId && p?.userId !== 'undefined')
            })),
            validPlayerCount: players.filter(p => 
                p && p.name && p.name !== 'undefined' && p.userId && p.userId !== 'undefined'
            ).length
        };
        
        console.log('📊 Room Status:', status);
        return status;
        
    } catch (error) {
        console.error('❌ Error getting room status:', error);
        throw error;
    }
}

// Function to force reset a room to empty state
async function resetRoom(roomId) {
    console.log('🔄 Resetting room to empty state:', roomId);
    
    try {
        const { getDb } = await import('./firebase-init.js');
        const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');
        
        const db = await getDb();
        const roomRef = doc(db, 'gameRooms', roomId);
        
        await updateDoc(roomRef, {
            players: [],
            gameStarted: false,
            currentTurn: 0,
            lastActivity: Date.now(),
            lastReset: new Date().toISOString()
        });
        
        console.log('✅ Room reset successfully');
        return true;
        
    } catch (error) {
        console.error('❌ Error resetting room:', error);
        throw error;
    }
}

// Export functions for global use
window.roomCleanupUtils = {
    cleanupRoom,
    cleanupAllRooms,
    getRoomStatus,
    resetRoom
};

// Quick access functions
window.cleanupRoom = cleanupRoom;
window.cleanupAllRooms = cleanupAllRooms;
window.getRoomStatus = getRoomStatus;
window.resetRoom = resetRoom;

console.log('🧹 Room Cleanup Utilities Loaded!');
console.log('📋 Available commands:');
console.log('  cleanupRoom("ROOM_ID") - Clean up a specific room');
console.log('  cleanupAllRooms() - Clean up all rooms');
console.log('  getRoomStatus("ROOM_ID") - Get detailed room status');
console.log('  resetRoom("ROOM_ID") - Reset room to empty state');
console.log('');
console.log('💡 Example usage:');
console.log('  cleanupRoom("ELM_STREET")');
console.log('  getRoomStatus("ELM_STREET")');
console.log('  resetRoom("ELM_STREET")');

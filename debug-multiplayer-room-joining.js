/**
 * Debug Multiplayer Room Joining Issues
 * Use this script to diagnose and fix room joining problems
 */

// Enhanced room joining debug utility
window.debugMultiplayerRoomJoining = {
    
    // Check current room state
    async checkRoomState(roomId) {
        console.log('🔍 Checking room state for:', roomId);
        
        try {
            const { getDb } = await import('./firebase-init.js');
            const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');
            
            const db = await getDb();
            const roomRef = doc(db, 'gameRooms', roomId);
            const roomDoc = await getDoc(roomRef);
            
            if (!roomDoc.exists()) {
                console.error('❌ Room not found:', roomId);
                return null;
            }
            
            const roomData = roomDoc.data();
            console.log('📊 Room Data:', {
                roomId: roomId,
                players: roomData.players,
                playerCount: roomData.players?.length || 0,
                maxPlayers: roomData.maxPlayers || 2,
                gameStarted: roomData.gameStarted,
                lastActivity: new Date(roomData.lastActivity).toLocaleString(),
                createdAt: roomData.createdAt
            });
            
            // Analyze players
            if (roomData.players && Array.isArray(roomData.players)) {
                console.log('👥 Player Analysis:');
                roomData.players.forEach((player, index) => {
                    console.log(`  Player ${index}:`, {
                        name: player.name,
                        userId: player.userId,
                        isHost: player.isHost,
                        hasValidName: !!(player.name && player.name !== 'undefined'),
                        hasValidUserId: !!(player.userId && player.userId !== 'undefined'),
                        isValid: !!(player.name && player.name !== 'undefined' && player.userId && player.userId !== 'undefined')
                    });
                });
            } else {
                console.warn('⚠️ Players data is not a valid array:', typeof roomData.players, roomData.players);
            }
            
            return roomData;
            
        } catch (error) {
            console.error('❌ Error checking room state:', error);
            return null;
        }
    },
    
    // Test joining a room with detailed logging
    async testJoinRoom(roomId, playerName) {
        console.log(`🧪 Testing room join: "${playerName}" -> "${roomId}"`);
        
        try {
            const { joinGameRoom } = await import('./firebase-init.js');
            
            console.log('📝 Before join - checking room state...');
            await this.checkRoomState(roomId);
            
            console.log(`🚀 Attempting to join room...`);
            const result = await joinGameRoom(roomId, playerName);
            
            console.log('✅ Join result:', result);
            
            console.log('📝 After join - checking room state...');
            await this.checkRoomState(roomId);
            
            return result;
            
        } catch (error) {
            console.error('❌ Error testing room join:', error);
            
            console.log('📝 After error - checking room state...');
            await this.checkRoomState(roomId);
            
            throw error;
        }
    },
    
    // Monitor room changes in real-time
    monitorRoom(roomId) {
        console.log('👀 Starting room monitoring for:', roomId);
        
        import('./firebase-init.js').then(async ({ getDb }) => {
            const { doc, onSnapshot } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');
            
            const db = await getDb();
            const roomRef = doc(db, 'gameRooms', roomId);
            
            const unsubscribe = onSnapshot(roomRef, (doc) => {
                if (doc.exists()) {
                    const data = doc.data();
                    console.log('🔄 Room Update:', {
                        timestamp: new Date().toLocaleTimeString(),
                        playerCount: data.players?.length || 0,
                        players: data.players?.map(p => ({ name: p.name, userId: p.userId, isHost: p.isHost })) || [],
                        gameStarted: data.gameStarted,
                        lastActivity: data.lastActivity
                    });
                } else {
                    console.log('❌ Room no longer exists');
                }
            }, (error) => {
                console.error('❌ Room monitoring error:', error);
            });
            
            // Store unsubscribe function
            window.stopRoomMonitoring = unsubscribe;
            console.log('💡 Use stopRoomMonitoring() to stop monitoring');
        });
    },
    
    // Simulate the exact scenario from your logs
    async simulateYourScenario() {
        const roomId = 'SINISTER_SANCTUM';
        
        console.log('🎭 Simulating your exact scenario...');
        console.log('Step 1: Check if room exists');
        
        let roomData = await this.checkRoomState(roomId);
        
        if (!roomData) {
            console.log('Step 2: Room does not exist, would need to create it first');
            return;
        }
        
        console.log('Step 2: Room exists, testing Wolfman join...');
        try {
            await this.testJoinRoom(roomId, 'Wolfman');
            console.log('✅ Simulation completed successfully');
        } catch (error) {
            console.error('❌ Simulation failed:', error.message);
        }
    },
    
    // Clean up invalid players from a room
    async cleanupRoom(roomId) {
        console.log('🧹 Cleaning up room:', roomId);
        
        try {
            const { getDb } = await import('./firebase-init.js');
            const { doc, getDoc, updateDoc } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');
            
            const db = await getDb();
            const roomRef = doc(db, 'gameRooms', roomId);
            const roomDoc = await getDoc(roomRef);
            
            if (!roomDoc.exists()) {
                console.error('❌ Room not found');
                return;
            }
            
            const roomData = roomDoc.data();
            const originalPlayers = roomData.players || [];
            
            // Filter out invalid players
            const validPlayers = originalPlayers.filter(player => {
                const isValid = player && 
                               player.name && player.name !== 'undefined' &&
                               player.userId && player.userId !== 'undefined';
                
                if (!isValid) {
                    console.log('🗑️ Removing invalid player:', player);
                }
                
                return isValid;
            });
            
            if (validPlayers.length !== originalPlayers.length) {
                console.log(`🧹 Cleaned up ${originalPlayers.length - validPlayers.length} invalid players`);
                
                await updateDoc(roomRef, {
                    players: validPlayers,
                    lastActivity: Date.now()
                });
                
                console.log('✅ Room cleanup completed');
            } else {
                console.log('✅ Room is already clean');
            }
            
            return validPlayers;
            
        } catch (error) {
            console.error('❌ Error cleaning room:', error);
            throw error;
        }
    }
};

// Quick access functions
window.checkRoom = (roomId) => window.debugMultiplayerRoomJoining.checkRoomState(roomId);
window.testJoin = (roomId, playerName) => window.debugMultiplayerRoomJoining.testJoinRoom(roomId, playerName);
window.monitorRoom = (roomId) => window.debugMultiplayerRoomJoining.monitorRoom(roomId);
window.simulateScenario = () => window.debugMultiplayerRoomJoining.simulateYourScenario();
window.cleanupRoom = (roomId) => window.debugMultiplayerRoomJoining.cleanupRoom(roomId);

console.log('🔧 Multiplayer Room Joining Debug Utilities Loaded!');
console.log('📋 Available commands:');
console.log('  checkRoom("ROOM_ID") - Check room state');
console.log('  testJoin("ROOM_ID", "PLAYER_NAME") - Test joining room');
console.log('  monitorRoom("ROOM_ID") - Monitor room changes');
console.log('  simulateScenario() - Simulate your exact scenario');
console.log('  cleanupRoom("ROOM_ID") - Clean up invalid players');
console.log('');
console.log('💡 Example usage:');
console.log('  checkRoom("SINISTER_SANCTUM")');
console.log('  testJoin("SINISTER_SANCTUM", "Wolfman")');
console.log('  monitorRoom("SINISTER_SANCTUM")');

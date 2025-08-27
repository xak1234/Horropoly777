// Comprehensive Multiplayer Sync Fix Utilities - Version 2
// Addresses: Token rendering, turn validation, Firebase conversion, player sync

// Enhanced debugging utilities for multiplayer sync issues
window.multiplayerSyncDebug = {
    
    // Test token rendering for all players
    async testTokenRendering(roomId) {
        console.log('🎯 Testing token rendering for all players...');
        
        if (!window.players || !Array.isArray(window.players)) {
            console.error('❌ No players array found');
            return;
        }
        
        const results = [];
        
        for (let i = 0; i < window.players.length; i++) {
            const player = window.players[i];
            const result = {
                name: player.name,
                hasImage: !!player.image,
                tokenImage: player.tokenImage,
                tokenIndex: player.tokenIndex,
                color: player.color,
                colorName: player.colorName,
                status: 'unknown'
            };
            
            if (player.image) {
                result.status = 'has_image';
            } else if (player.tokenImage && player.tokenImage !== 'undefined') {
                result.status = 'needs_loading';
            } else {
                result.status = 'fallback_circle';
            }
            
            results.push(result);
        }
        
        console.table(results);
        return results;
    },
    
    // Test turn validation system
    testTurnValidation() {
        console.log('🚫 Testing turn validation system...');
        
        const currentPlayerIndex = window.currentPlayerIndex || 0;
        const localPlayerName = window.localPlayerName || document.getElementById('player1-name')?.value?.trim();
        const isMultiplayerGame = window.isMultiplayerGame || false;
        
        console.log('Turn validation state:', {
            currentPlayerIndex,
            localPlayerName,
            isMultiplayerGame,
            players: window.players?.map(p => ({ name: p.name, isCurrentPlayer: window.players.indexOf(p) === currentPlayerIndex }))
        });
        
        if (window.players && window.players[currentPlayerIndex]) {
            const currentPlayer = window.players[currentPlayerIndex];
            const isMyTurn = localPlayerName && currentPlayer.name && 
                           localPlayerName.toLowerCase() === currentPlayer.name.toLowerCase();
            
            console.log(`Current turn: ${currentPlayer.name}, Is my turn: ${isMyTurn}`);
            
            // Test property info panel state
            const propertyInfoContent = document.getElementById('property-info-content');
            if (propertyInfoContent) {
                console.log('Property info panel content:', propertyInfoContent.innerHTML.substring(0, 200) + '...');
            }
        }
    },
    
    // Test Firebase array conversion
    async testFirebaseConversion(roomId) {
        console.log('🔄 Testing Firebase array conversion...');
        
        if (!roomId) {
            console.error('❌ Room ID required');
            return;
        }
        
        try {
            // Get current room data
            const db = window.db || await window.getDb();
            const roomRef = window.doc(db, 'gameRooms', roomId);
            const roomDoc = await window.getDoc(roomRef);
            
            if (!roomDoc.exists()) {
                console.error('❌ Room not found');
                return;
            }
            
            const gameState = roomDoc.data();
            console.log('Raw players data from Firebase:', gameState.players);
            console.log('Players data type:', typeof gameState.players);
            console.log('Is array:', Array.isArray(gameState.players));
            
            // Test conversion
            const converted = window.convertObjectToArray ? 
                            window.convertObjectToArray(gameState.players) : 
                            gameState.players;
            
            console.log('Converted players:', converted);
            console.log('Conversion successful:', Array.isArray(converted));
            
            // Test validation
            if (Array.isArray(converted)) {
                const validationResults = converted.map((player, index) => {
                    const hasValidName = player.name && player.name !== 'undefined' && player.name !== 'null';
                    const hasValidUserId = player.userId && player.userId !== 'undefined' && player.userId !== 'null';
                    const hasDisplayName = player.displayName && player.displayName !== 'undefined';
                    const hasPlayerProperties = player.hasOwnProperty('money') || 
                                              player.hasOwnProperty('properties') || 
                                              player.hasOwnProperty('currentSquare') ||
                                              player.hasOwnProperty('isHost') ||
                                              player.hasOwnProperty('tokenImage') ||
                                              player.hasOwnProperty('color') ||
                                              player.hasOwnProperty('tokenIndex');
                    
                    return {
                        index,
                        name: player.name,
                        userId: player.userId,
                        hasValidName,
                        hasValidUserId,
                        hasDisplayName,
                        hasPlayerProperties,
                        wouldBeFiltered: !(hasValidName || hasValidUserId || hasDisplayName || hasPlayerProperties)
                    };
                });
                
                console.table(validationResults);
                
                const filteredCount = validationResults.filter(r => r.wouldBeFiltered).length;
                console.log(`${filteredCount} players would be filtered out with new validation logic`);
            }
            
        } catch (error) {
            console.error('❌ Error testing Firebase conversion:', error);
        }
    },
    
    // Test player synchronization
    testPlayerSync() {
        console.log('🔄 Testing player synchronization...');
        
        if (!window.players || !Array.isArray(window.players)) {
            console.error('❌ No players array found');
            return;
        }
        
        const syncResults = window.players.map((player, index) => ({
            index,
            name: player.name,
            userId: player.userId,
            currentSquare: player.currentSquare,
            position: { x: player.x, y: player.y },
            tokenIndex: player.tokenIndex,
            color: player.color,
            colorName: player.colorName,
            hasImage: !!player.image,
            tokenImage: player.tokenImage,
            money: player.money,
            properties: player.properties?.length || 0,
            isHost: player.isHost
        }));
        
        console.table(syncResults);
        
        // Check for missing data
        const issues = [];
        syncResults.forEach(player => {
            if (!player.name || player.name === 'undefined') issues.push(`${player.index}: Missing name`);
            if (!player.userId || player.userId === 'undefined') issues.push(`${player.index}: Missing userId`);
            if (player.tokenIndex === undefined) issues.push(`${player.index}: Missing tokenIndex`);
            if (!player.color) issues.push(`${player.index}: Missing color`);
            if (!player.hasImage && (!player.tokenImage || player.tokenImage === 'undefined')) {
                issues.push(`${player.index}: Missing token image`);
            }
        });
        
        if (issues.length > 0) {
            console.warn('⚠️ Player sync issues found:');
            issues.forEach(issue => console.warn(`  - ${issue}`));
        } else {
            console.log('✅ All players have required sync data');
        }
        
        return syncResults;
    },
    
    // Force token reload for all players
    async forceTokenReload() {
        console.log('🔄 Forcing token reload for all players...');
        
        if (!window.players || !Array.isArray(window.players)) {
            console.error('❌ No players array found');
            return;
        }
        
        const promises = window.players.map(player => {
            return new Promise((resolve) => {
                if (player.tokenImage && player.tokenImage !== 'undefined') {
                    const img = new Image();
                    img.onload = () => {
                        player.image = img;
                        console.log(`✅ Reloaded token for ${player.name}`);
                        resolve({ player: player.name, status: 'loaded' });
                    };
                    img.onerror = () => {
                        console.error(`❌ Failed to reload token for ${player.name}`);
                        resolve({ player: player.name, status: 'failed' });
                    };
                    img.src = player.tokenImage;
                } else {
                    console.warn(`⚠️ No token image for ${player.name}`);
                    resolve({ player: player.name, status: 'no_image' });
                }
            });
        });
        
        const results = await Promise.all(promises);
        console.table(results);
        
        // Trigger redraw
        if (window.updateGameFrame) {
            window.updateGameFrame();
        }
        
        return results;
    },
    
    // Comprehensive sync test
    async runComprehensiveTest(roomId) {
        console.log('🧪 Running comprehensive multiplayer sync test...');
        console.log('='.repeat(50));
        
        const results = {
            tokenRendering: await this.testTokenRendering(roomId),
            turnValidation: this.testTurnValidation(),
            firebaseConversion: roomId ? await this.testFirebaseConversion(roomId) : null,
            playerSync: this.testPlayerSync(),
            timestamp: new Date().toISOString()
        };
        
        console.log('🧪 Comprehensive test completed');
        console.log('='.repeat(50));
        
        return results;
    },
    
    // Fix common issues automatically
    async autoFix(roomId) {
        console.log('🔧 Running automatic fixes...');
        
        let fixCount = 0;
        
        // Fix missing token indices
        if (window.players && Array.isArray(window.players)) {
            window.players.forEach((player, index) => {
                if (player.tokenIndex === undefined || player.tokenIndex === null) {
                    player.tokenIndex = index;
                    console.log(`🔧 Fixed tokenIndex for ${player.name}: ${index}`);
                    fixCount++;
                }
            });
        }
        
        // Fix missing colors
        if (window.players && Array.isArray(window.players)) {
            const colors = ['#ff0000', '#0000ff', '#00ff00', '#ffff00', '#800080', '#ff8c00', '#8b4513', '#ff1493'];
            const colorNames = ['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange', 'Brown', 'Pink'];
            
            window.players.forEach((player, index) => {
                if (!player.color || player.color === 'undefined') {
                    const colorIndex = index % colors.length;
                    player.color = colors[colorIndex];
                    player.colorName = colorNames[colorIndex];
                    console.log(`🔧 Fixed color for ${player.name}: ${player.color}`);
                    fixCount++;
                }
            });
        }
        
        // Force token reload
        await this.forceTokenReload();
        
        // Sync to Firebase if in multiplayer
        if (window.isMultiplayerGame && window.syncGameStateToFirebase) {
            console.log('🔧 Syncing fixes to Firebase...');
            await window.syncGameStateToFirebase();
            fixCount++;
        }
        
        console.log(`🔧 Applied ${fixCount} automatic fixes`);
        return fixCount;
    }
};

// Enhanced room status checker
window.debugMultiplayerRoom = async function(roomId) {
    if (!roomId) {
        console.error('❌ Room ID required');
        return;
    }
    
    console.log(`🏠 Debugging room: ${roomId}`);
    console.log('='.repeat(50));
    
    try {
        const db = window.db || await window.getDb();
        const roomRef = window.doc(db, 'gameRooms', roomId);
        const roomDoc = await window.getDoc(roomRef);
        
        if (!roomDoc.exists()) {
            console.error('❌ Room not found');
            return;
        }
        
        const gameState = roomDoc.data();
        
        console.log('📊 Room Overview:');
        console.log(`  - Room Name: ${gameState.roomName || 'Unknown'}`);
        console.log(`  - Game Started: ${gameState.gameStarted || false}`);
        console.log(`  - Max Players: ${gameState.maxPlayers || 2}`);
        console.log(`  - Current Turn: ${gameState.currentTurn || 0}`);
        console.log(`  - Last Activity: ${new Date(gameState.lastActivity || 0).toLocaleString()}`);
        
        console.log('\n👥 Players:');
        const players = window.convertObjectToArray ? 
                       window.convertObjectToArray(gameState.players || []) : 
                       gameState.players || [];
        
        if (Array.isArray(players) && players.length > 0) {
            players.forEach((player, index) => {
                console.log(`  ${index + 1}. ${player.name || 'Unknown'}`);
                console.log(`     - User ID: ${player.userId || 'Missing'}`);
                console.log(`     - Is Host: ${player.isHost || false}`);
                console.log(`     - Token Index: ${player.tokenIndex}`);
                console.log(`     - Token Image: ${player.tokenImage || 'Missing'}`);
                console.log(`     - Color: ${player.color || 'Missing'}`);
                console.log(`     - Position: ${player.currentSquare || 'Unknown'}`);
                console.log(`     - Money: $${player.money || 0}`);
            });
        } else {
            console.log('  No players found or invalid player data');
        }
        
        console.log('='.repeat(50));
        
        return gameState;
        
    } catch (error) {
        console.error('❌ Error debugging room:', error);
    }
};

console.log('🔧 Comprehensive Multiplayer Sync Fix Utilities v2 loaded!');
console.log('Available functions:');
console.log('  - multiplayerSyncDebug.testTokenRendering(roomId)');
console.log('  - multiplayerSyncDebug.testTurnValidation()');
console.log('  - multiplayerSyncDebug.testFirebaseConversion(roomId)');
console.log('  - multiplayerSyncDebug.testPlayerSync()');
console.log('  - multiplayerSyncDebug.forceTokenReload()');
console.log('  - multiplayerSyncDebug.runComprehensiveTest(roomId)');
console.log('  - multiplayerSyncDebug.autoFix(roomId)');
console.log('  - debugMultiplayerRoom(roomId)');

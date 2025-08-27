// Fix for Player Data Corruption During Firebase Sync
// This addresses the root cause where player names/userIds become undefined

console.log('🔧 Loading Player Data Corruption Fix...');

// Store the last known good player data
window.lastKnownGoodPlayers = {};

// Enhanced player data interceptor
function interceptPlayerDataCorruption() {
    // Hook into the Firebase listener to prevent corruption
    const originalAddSnapshotListener = window.onSnapshot || window.addSnapshotListener;
    
    // Intercept updateGameFromState calls
    const originalUpdateGameFromState = window.updateGameFromState;
    if (originalUpdateGameFromState) {
        window.updateGameFromState = function(gameState) {
            console.log('🔍 Intercepting updateGameFromState - checking for corruption...');
            
            // Store current good data before update
            if (window.players && Array.isArray(window.players)) {
                window.players.forEach((player, index) => {
                    if (player.name && player.name !== 'undefined' && 
                        player.userId && player.userId !== 'undefined') {
                        window.lastKnownGoodPlayers[index] = {
                            name: player.name,
                            userId: player.userId,
                            isHost: player.isHost,
                            color: player.color,
                            colorName: player.colorName,
                            tokenIndex: player.tokenIndex,
                            tokenImage: player.tokenImage,
                            money: player.money,
                            properties: player.properties ? [...player.properties] : [],
                            currentSquare: player.currentSquare,
                            x: player.x,
                            y: player.y
                        };
                    }
                });
            }
            
            // Call original function
            const result = originalUpdateGameFromState.call(this, gameState);
            
            // Check for corruption after update and fix immediately
            setTimeout(() => {
                if (window.players && Array.isArray(window.players)) {
                    let fixed = false;
                    
                    window.players.forEach((player, index) => {
                        const isCorrupted = !player.name || player.name === 'undefined' ||
                                          !player.userId || player.userId === 'undefined';
                        
                        if (isCorrupted && window.lastKnownGoodPlayers[index]) {
                            console.log(`🔧 Fixing corrupted player at index ${index}`);
                            const goodData = window.lastKnownGoodPlayers[index];
                            
                            // Restore essential identity data
                            player.name = goodData.name;
                            player.userId = goodData.userId;
                            player.isHost = goodData.isHost;
                            
                            // Restore visual data
                            player.color = goodData.color;
                            player.colorName = goodData.colorName;
                            player.tokenIndex = goodData.tokenIndex;
                            player.tokenImage = goodData.tokenImage;
                            
                            // Restore game state if missing
                            if (player.money === undefined) player.money = goodData.money;
                            if (!player.properties) player.properties = [...goodData.properties];
                            if (!player.currentSquare) player.currentSquare = goodData.currentSquare;
                            if (!player.x) player.x = goodData.x;
                            if (!player.y) player.y = goodData.y;
                            
                            fixed = true;
                            console.log(`✅ Fixed corrupted player: ${player.name} (${player.userId})`);
                        }
                        
                        // Also fix token loading issues
                        const needsTokenLoading = !player.image || 
                                                !player.image.complete || 
                                                player.image.naturalWidth === 0;
                        
                        if (needsTokenLoading && player.tokenImage) {
                            console.log(`🎯 Force loading token for ${player.name}: ${player.tokenImage}`);
                            
                            const img = new Image();
                            img.onload = function() {
                                player.image = img;
                                console.log(`✅ Token loaded for ${player.name}`);
                                if (window.updateGameFrame) {
                                    window.updateGameFrame();
                                }
                            };
                            img.onerror = function() {
                                console.error(`❌ Token failed for ${player.name}, trying fallback`);
                                // Try fallback token
                                const fallbackTokens = [
                                    'assets/images/t1.png', 'assets/images/t2.png', 'assets/images/t3.png',
                                    'assets/images/t4.png', 'assets/images/t5.png', 'assets/images/t6.png'
                                ];
                                const fallbackIndex = (player.tokenIndex || index) % fallbackTokens.length;
                                const fallbackImg = new Image();
                                fallbackImg.onload = function() {
                                    player.image = fallbackImg;
                                    player.tokenImage = fallbackTokens[fallbackIndex];
                                    console.log(`🔄 Fallback token loaded: ${player.name}`);
                                    if (window.updateGameFrame) window.updateGameFrame();
                                };
                                fallbackImg.src = fallbackTokens[fallbackIndex] + '?fix=' + Date.now();
                            };
                            img.src = player.tokenImage + '?fix=' + Date.now();
                        }
                    });
                    
                    if (fixed) {
                        console.log('🔧 Player data corruption fixed, forcing UI update');
                        if (window.updateGameFrame) {
                            window.updateGameFrame();
                        }
                        if (window.updatePlayerList) {
                            window.updatePlayerList(window.players);
                        }
                    }
                }
            }, 50); // Small delay to ensure Firebase update is complete
            
            return result;
        };
        
        console.log('✅ Installed updateGameFromState interceptor');
    }
    
    // Also intercept the player list update function
    const originalUpdatePlayerList = window.updatePlayerList;
    if (originalUpdatePlayerList) {
        window.updatePlayerList = function(players) {
            console.log('🔍 Intercepting updatePlayerList - checking for corruption...');
            
            if (players && Array.isArray(players)) {
                let fixed = false;
                
                players.forEach((player, index) => {
                    const isCorrupted = !player.name || player.name === 'undefined' ||
                                      !player.userId || player.userId === 'undefined';
                    
                    if (isCorrupted && window.lastKnownGoodPlayers[index]) {
                        console.log(`🔧 Fixing corrupted player in updatePlayerList: index ${index}`);
                        const goodData = window.lastKnownGoodPlayers[index];
                        
                        player.name = goodData.name;
                        player.userId = goodData.userId;
                        player.isHost = goodData.isHost;
                        player.color = goodData.color;
                        player.colorName = goodData.colorName;
                        player.tokenIndex = goodData.tokenIndex;
                        player.tokenImage = goodData.tokenImage;
                        
                        fixed = true;
                        console.log(`✅ Fixed player in updatePlayerList: ${player.name}`);
                    }
                });
                
                if (fixed) {
                    console.log('🔧 Fixed corruption in updatePlayerList');
                }
            }
            
            return originalUpdatePlayerList.call(this, players);
        };
        
        console.log('✅ Installed updatePlayerList interceptor');
    }
}

// Enhanced Firebase array conversion fix
function fixFirebaseArrayConversion() {
    const originalConvertObjectToArray = window.convertObjectToArray;
    if (originalConvertObjectToArray) {
        window.convertObjectToArray = function(obj) {
            console.log('🔍 Intercepting convertObjectToArray...');
            
            const result = originalConvertObjectToArray.call(this, obj);
            
            // Check if conversion resulted in data loss
            if (result && Array.isArray(result)) {
                result.forEach((player, index) => {
                    if (player && typeof player === 'object') {
                        // If player data is incomplete, try to restore from backup
                        const isIncomplete = !player.name || player.name === 'undefined' ||
                                           !player.userId || player.userId === 'undefined';
                        
                        if (isIncomplete && window.lastKnownGoodPlayers[index]) {
                            console.log(`🔧 Restoring incomplete player data from backup: index ${index}`);
                            const goodData = window.lastKnownGoodPlayers[index];
                            
                            // Only restore missing fields, don't overwrite existing data
                            if (!player.name || player.name === 'undefined') player.name = goodData.name;
                            if (!player.userId || player.userId === 'undefined') player.userId = goodData.userId;
                            if (player.isHost === undefined) player.isHost = goodData.isHost;
                            if (!player.color) player.color = goodData.color;
                            if (!player.colorName) player.colorName = goodData.colorName;
                            if (player.tokenIndex === undefined) player.tokenIndex = goodData.tokenIndex;
                            if (!player.tokenImage) player.tokenImage = goodData.tokenImage;
                            
                            console.log(`✅ Restored player data: ${player.name} (${player.userId})`);
                        }
                    }
                });
            }
            
            return result;
        };
        
        console.log('✅ Enhanced convertObjectToArray with data restoration');
    }
}

// Initialize all fixes
function initializeCorruptionFix() {
    console.log('🚀 Initializing player data corruption fixes...');
    
    interceptPlayerDataCorruption();
    fixFirebaseArrayConversion();
    
    // Start periodic health check
    setInterval(() => {
        if (window.players && Array.isArray(window.players)) {
            let corruptedCount = 0;
            
            window.players.forEach((player, index) => {
                if (!player.name || player.name === 'undefined' ||
                    !player.userId || player.userId === 'undefined') {
                    corruptedCount++;
                }
            });
            
            if (corruptedCount > 0) {
                console.warn(`🚨 Detected ${corruptedCount} corrupted players - auto-fixing...`);
                
                // Try to restore from backup
                window.players.forEach((player, index) => {
                    const isCorrupted = !player.name || player.name === 'undefined' ||
                                      !player.userId || player.userId === 'undefined';
                    
                    if (isCorrupted && window.lastKnownGoodPlayers[index]) {
                        const goodData = window.lastKnownGoodPlayers[index];
                        player.name = goodData.name;
                        player.userId = goodData.userId;
                        player.isHost = goodData.isHost;
                        player.color = goodData.color;
                        player.colorName = goodData.colorName;
                        player.tokenIndex = goodData.tokenIndex;
                        player.tokenImage = goodData.tokenImage;
                        
                        console.log(`🔧 Auto-fixed corrupted player: ${player.name}`);
                    }
                });
                
                // Force UI update
                if (window.updateGameFrame) {
                    window.updateGameFrame();
                }
            }
        }
    }, 3000); // Check every 3 seconds
    
    console.log('✅ Player data corruption fixes initialized');
}

// Run initialization
setTimeout(initializeCorruptionFix, 500);

console.log('🔧 Player Data Corruption Fix loaded!');

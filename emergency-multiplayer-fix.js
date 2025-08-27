// EMERGENCY MULTIPLAYER FIX
// Addresses critical player identity loss and token rendering issues

console.log('🚨 Loading Emergency Multiplayer Fix...');

// Store original player data to prevent loss
window.emergencyPlayerBackup = {};

// Enhanced player data preservation
window.preservePlayerData = function() {
    if (window.players && Array.isArray(window.players)) {
        window.players.forEach((player, index) => {
            if (player.name && player.userId) {
                window.emergencyPlayerBackup[index] = {
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
                console.log(`💾 Backed up player data for ${player.name}:`, window.emergencyPlayerBackup[index]);
            }
        });
    }
};

// Restore corrupted player data
window.restorePlayerData = function() {
    if (!window.players || !Array.isArray(window.players)) {
        console.error('❌ No players array to restore');
        return false;
    }
    
    let restored = false;
    
    window.players.forEach((player, index) => {
        const backup = window.emergencyPlayerBackup[index];
        
        // Check if player data is corrupted
        const isCorrupted = !player.name || 
                          player.name === 'undefined' || 
                          !player.userId || 
                          player.userId === 'undefined';
        
        if (isCorrupted && backup) {
            console.log(`🔧 Restoring corrupted player data for index ${index}:`, backup);
            
            // Restore essential data
            player.name = backup.name;
            player.userId = backup.userId;
            player.isHost = backup.isHost;
            player.color = backup.color;
            player.colorName = backup.colorName;
            player.tokenIndex = backup.tokenIndex;
            player.tokenImage = backup.tokenImage;
            
            // Restore game state if missing
            if (!player.money && backup.money) player.money = backup.money;
            if (!player.properties && backup.properties) player.properties = [...backup.properties];
            if (!player.currentSquare && backup.currentSquare) player.currentSquare = backup.currentSquare;
            if (!player.x && backup.x) player.x = backup.x;
            if (!player.y && backup.y) player.y = backup.y;
            
            restored = true;
            console.log(`✅ Restored player: ${player.name} (${player.userId})`);
        }
    });
    
    return restored;
};

// Force token loading with aggressive retry
window.emergencyTokenFix = function() {
    console.log('🎯 Emergency token fix starting...');
    
    if (!window.players || !Array.isArray(window.players)) {
        console.error('❌ No players array found');
        return;
    }
    
    const tokenImages = [
        'assets/images/t1.png', 'assets/images/t2.png', 'assets/images/t3.png',
        'assets/images/t4.png', 'assets/images/t5.png', 'assets/images/t6.png'
    ];
    
    window.players.forEach((player, index) => {
        // Ensure basic data
        if (!player.tokenIndex) player.tokenIndex = index;
        if (!player.color) {
            const colors = ['#ff0000', '#0000ff', '#00ff00', '#ffff00', '#800080', '#ff8c00'];
            const colorNames = ['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange'];
            player.color = colors[index % colors.length];
            player.colorName = colorNames[index % colorNames.length];
        }
        
        // Force token image loading
        const tokenPath = tokenImages[player.tokenIndex % tokenImages.length];
        player.tokenImage = tokenPath;
        
        console.log(`🔧 Force loading token for ${player.name || 'Player' + index}: ${tokenPath}`);
        
        const img = new Image();
        img.onload = function() {
            player.image = img;
            console.log(`✅ Emergency token loaded: ${player.name} -> ${tokenPath}`);
            
            // Force redraw
            if (window.updateGameFrame) {
                window.updateGameFrame();
            }
        };
        
        img.onerror = function() {
            console.error(`❌ Emergency token failed: ${tokenPath}`);
            // Try next token
            const nextIndex = (player.tokenIndex + 1) % tokenImages.length;
            const nextPath = tokenImages[nextIndex];
            
            const fallbackImg = new Image();
            fallbackImg.onload = function() {
                player.image = fallbackImg;
                player.tokenImage = nextPath;
                player.tokenIndex = nextIndex;
                console.log(`🔄 Fallback token loaded: ${player.name} -> ${nextPath}`);
                if (window.updateGameFrame) window.updateGameFrame();
            };
            fallbackImg.src = nextPath + '?emergency=' + Date.now();
        };
        
        // Add cache busting and retry mechanism
        img.src = tokenPath + '?emergency=' + Date.now();
    });
};

// Monitor and auto-fix player data corruption
window.startEmergencyMonitoring = function() {
    console.log('📊 Starting emergency monitoring...');
    
    if (window.emergencyMonitorInterval) {
        clearInterval(window.emergencyMonitorInterval);
    }
    
    window.emergencyMonitorInterval = setInterval(() => {
        // Preserve current data
        window.preservePlayerData();
        
        // Check for corruption
        if (window.players && Array.isArray(window.players)) {
            let corruptedCount = 0;
            let tokenIssues = 0;
            
            window.players.forEach((player, index) => {
                // Check for identity corruption
                if (!player.name || player.name === 'undefined' || 
                    !player.userId || player.userId === 'undefined') {
                    corruptedCount++;
                }
                
                // Check for token issues
                if (!player.image || !player.image.complete || player.image.naturalWidth === 0) {
                    tokenIssues++;
                }
            });
            
            if (corruptedCount > 0) {
                console.warn(`🚨 Detected ${corruptedCount} corrupted players - attempting restore...`);
                const restored = window.restorePlayerData();
                if (restored) {
                    console.log('✅ Player data restored');
                    // Force sync to Firebase
                    if (window.syncGameStateToFirebase) {
                        window.syncGameStateToFirebase();
                    }
                }
            }
            
            if (tokenIssues > 0) {
                console.warn(`🎯 Detected ${tokenIssues} token issues - fixing...`);
                window.emergencyTokenFix();
            }
            
            if (corruptedCount === 0 && tokenIssues === 0) {
                console.log(`✅ [Monitor] All ${window.players.length} players healthy`);
            }
        }
    }, 5000); // Check every 5 seconds
};

window.stopEmergencyMonitoring = function() {
    if (window.emergencyMonitorInterval) {
        clearInterval(window.emergencyMonitorInterval);
        window.emergencyMonitorInterval = null;
        console.log('📊 Emergency monitoring stopped');
    }
};

// Enhanced Firebase sync interceptor
const originalUpdateGameFromState = window.updateGameFromState;
if (originalUpdateGameFromState) {
    window.updateGameFromState = function(gameState) {
        console.log('🔍 Intercepting updateGameFromState for emergency checks...');
        
        // Preserve data before update
        window.preservePlayerData();
        
        // Call original function
        const result = originalUpdateGameFromState.call(this, gameState);
        
        // Check and restore after update
        setTimeout(() => {
            const restored = window.restorePlayerData();
            if (restored) {
                console.log('🔧 Auto-restored player data after Firebase update');
                if (window.updateGameFrame) {
                    window.updateGameFrame();
                }
            }
        }, 100);
        
        return result;
    };
    console.log('🔧 Installed Firebase sync interceptor');
}

// Run immediate fixes
setTimeout(() => {
    console.log('🚀 Running immediate emergency fixes...');
    
    // Preserve current data
    window.preservePlayerData();
    
    // Fix tokens
    window.emergencyTokenFix();
    
    // Start monitoring
    window.startEmergencyMonitoring();
    
    console.log('✅ Emergency fixes applied');
}, 1000);

console.log('🚨 Emergency Multiplayer Fix loaded!');
console.log('Available functions:');
console.log('  - preservePlayerData() // Backup current player data');
console.log('  - restorePlayerData() // Restore corrupted data');
console.log('  - emergencyTokenFix() // Force fix all tokens');
console.log('  - startEmergencyMonitoring() // Auto-monitor and fix');
console.log('  - stopEmergencyMonitoring() // Stop monitoring');

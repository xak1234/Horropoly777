// Emergency Token Rendering Fix
// Addresses the persistent issue where tokens appear as circles instead of images

console.log('🔧 Loading Emergency Token Rendering Fix...');

// Enhanced token image loading with aggressive retry logic
window.forceLoadPlayerTokens = function() {
    console.log('🎯 Force loading all player tokens...');
    
    if (!window.players || !Array.isArray(window.players)) {
        console.error('❌ No players array found');
        return;
    }
    
    const tokenImages = [
        'assets/images/t1.png',
        'assets/images/t2.png', 
        'assets/images/t3.png',
        'assets/images/t4.png',
        'assets/images/t5.png',
        'assets/images/t6.png',
        'assets/images/t7.png',
        'assets/images/t8.png',
        'assets/images/t9.png'
    ];
    
    window.players.forEach((player, index) => {
        console.log(`🎯 Processing ${player.name}:`, {
            hasImage: !!player.image,
            tokenImage: player.tokenImage,
            tokenIndex: player.tokenIndex,
            imageComplete: player.image ? player.image.complete : false,
            imageNaturalWidth: player.image ? player.image.naturalWidth : 0
        });
        
        // Ensure tokenIndex is set
        if (player.tokenIndex === undefined || player.tokenIndex === null) {
            player.tokenIndex = index;
            console.log(`🔧 Set tokenIndex for ${player.name}: ${player.tokenIndex}`);
        }
        
        // Determine which token image to use
        let targetTokenImage = null;
        if (player.tokenImage && player.tokenImage !== 'undefined' && player.tokenImage !== 'null') {
            targetTokenImage = player.tokenImage;
        } else {
            targetTokenImage = tokenImages[player.tokenIndex % tokenImages.length];
            player.tokenImage = targetTokenImage;
            console.log(`🔧 Assigned token image for ${player.name}: ${targetTokenImage}`);
        }
        
        // Force load the token image
        if (targetTokenImage) {
            console.log(`🖼️ Force loading token for ${player.name}: ${targetTokenImage}`);
            
            const img = new Image();
            img.onload = function() {
                player.image = img;
                console.log(`✅ Token loaded for ${player.name}: ${targetTokenImage} (${img.naturalWidth}x${img.naturalHeight})`);
                
                // Force immediate redraw
                if (window.updateGameFrame) {
                    window.updateGameFrame();
                }
                
                // Sync to Firebase if multiplayer
                if (window.isMultiplayerGame && window.syncGameStateToFirebase) {
                    console.log(`🔄 Syncing token for ${player.name} to Firebase...`);
                    window.syncGameStateToFirebase();
                }
            };
            
            img.onerror = function() {
                console.error(`❌ Failed to load token for ${player.name}: ${targetTokenImage}`);
                
                // Try a different token as fallback
                const fallbackIndex = (player.tokenIndex + 1) % tokenImages.length;
                const fallbackImage = tokenImages[fallbackIndex];
                
                console.log(`🔄 Trying fallback token for ${player.name}: ${fallbackImage}`);
                
                const fallbackImg = new Image();
                fallbackImg.onload = function() {
                    player.image = fallbackImg;
                    player.tokenImage = fallbackImage;
                    console.log(`✅ Fallback token loaded for ${player.name}: ${fallbackImage}`);
                    
                    if (window.updateGameFrame) {
                        window.updateGameFrame();
                    }
                };
                
                fallbackImg.onerror = function() {
                    console.error(`❌ Even fallback failed for ${player.name}, will use circle`);
                };
                
                fallbackImg.src = fallbackImage;
            };
            
            // Add cache busting to ensure fresh load
            img.src = targetTokenImage + '?t=' + Date.now();
        }
    });
};

// Enhanced token validation
window.validatePlayerTokens = function() {
    console.log('🔍 Validating player tokens...');
    
    if (!window.players || !Array.isArray(window.players)) {
        console.error('❌ No players array found');
        return false;
    }
    
    let allValid = true;
    const results = [];
    
    window.players.forEach((player, index) => {
        const hasValidImage = player.image && 
                            player.image.complete && 
                            player.image.naturalWidth > 0;
        
        const result = {
            name: player.name,
            index: index,
            hasImage: !!player.image,
            imageComplete: player.image ? player.image.complete : false,
            imageNaturalWidth: player.image ? player.image.naturalWidth : 0,
            tokenImage: player.tokenImage,
            tokenIndex: player.tokenIndex,
            isValid: hasValidImage
        };
        
        results.push(result);
        
        if (!hasValidImage) {
            allValid = false;
            console.warn(`⚠️ ${player.name} has invalid token:`, result);
        } else {
            console.log(`✅ ${player.name} has valid token:`, result);
        }
    });
    
    console.table(results);
    return allValid;
};

// Auto-fix token issues
window.autoFixTokens = async function() {
    console.log('🔧 Auto-fixing token issues...');
    
    // First validate current state
    const isValid = window.validatePlayerTokens();
    
    if (!isValid) {
        console.log('🔧 Issues found, force loading tokens...');
        window.forceLoadPlayerTokens();
        
        // Wait a bit for images to load, then validate again
        setTimeout(() => {
            console.log('🔍 Re-validating after fix attempt...');
            const newValidation = window.validatePlayerTokens();
            
            if (newValidation) {
                console.log('✅ All tokens are now valid!');
            } else {
                console.warn('⚠️ Some tokens still have issues, may need manual intervention');
            }
        }, 2000);
    } else {
        console.log('✅ All tokens are already valid!');
    }
};

// Monitor token rendering in real-time
window.startTokenMonitoring = function() {
    console.log('📊 Starting token monitoring...');
    
    if (window.tokenMonitorInterval) {
        clearInterval(window.tokenMonitorInterval);
    }
    
    window.tokenMonitorInterval = setInterval(() => {
        if (window.players && Array.isArray(window.players)) {
            const invalidTokens = window.players.filter(player => {
                return !player.image || 
                       !player.image.complete || 
                       player.image.naturalWidth === 0;
            });
            
            if (invalidTokens.length > 0) {
                console.warn(`⚠️ [Monitor] ${invalidTokens.length} players have invalid tokens:`, 
                           invalidTokens.map(p => p.name));
                
                // Auto-fix if needed
                window.forceLoadPlayerTokens();
            } else {
                console.log(`✅ [Monitor] All ${window.players.length} player tokens are valid`);
            }
        }
    }, 10000); // Check every 10 seconds
};

window.stopTokenMonitoring = function() {
    if (window.tokenMonitorInterval) {
        clearInterval(window.tokenMonitorInterval);
        window.tokenMonitorInterval = null;
        console.log('📊 Token monitoring stopped');
    }
};

// Immediate fix on load
setTimeout(() => {
    console.log('🚀 Running immediate token fix...');
    window.autoFixTokens();
}, 1000);

console.log('🔧 Emergency Token Rendering Fix loaded!');
console.log('Available functions:');
console.log('  - forceLoadPlayerTokens() // Force reload all tokens');
console.log('  - validatePlayerTokens() // Check token validity');
console.log('  - autoFixTokens() // Auto-fix token issues');
console.log('  - startTokenMonitoring() // Monitor tokens in real-time');
console.log('  - stopTokenMonitoring() // Stop monitoring');

/**
 * Fix Multiplayer Rendering and Sync Issues
 * Addresses token rendering, Firebase array conversion, and turn logic problems
 */

// Enhanced Firebase array conversion that preserves player data
function fixedConvertObjectToArray(obj) {
    console.log('🔧 FIXED: Converting object to array with enhanced validation');
    
    if (!obj || typeof obj !== 'object') {
        console.log('🔧 FIXED: Input is not an object, returning empty array');
        return [];
    }
    
    if (Array.isArray(obj)) {
        console.log('🔧 FIXED: Input is already an array');
        return obj.filter(item => item != null); // Remove null/undefined items
    }
    
    // Check if object has numeric keys (Firebase array-like object)
    const keys = Object.keys(obj);
    const numericKeys = keys.filter(key => /^\d+$/.test(key));
    
    if (numericKeys.length > 0) {
        console.log('🔧 FIXED: Converting object with numeric keys to array');
        
        // Sort keys numerically and convert
        const sortedKeys = numericKeys.sort((a, b) => parseInt(a) - parseInt(b));
        const converted = sortedKeys.map(key => obj[key]).filter(item => item != null);
        
        // Enhanced validation - check for any meaningful player data
        const hasValidData = converted.some(item => 
            item && typeof item === 'object' && (
                // Check for any of these player identifiers
                (item.name && item.name !== 'undefined' && item.name !== 'null') ||
                (item.userId && item.userId !== 'undefined' && item.userId !== 'null') ||
                (item.displayName && item.displayName !== 'undefined') ||
                // Check for other player properties
                item.hasOwnProperty('money') ||
                item.hasOwnProperty('properties') ||
                item.hasOwnProperty('currentSquare') ||
                item.hasOwnProperty('isHost')
            )
        );
        
        if (hasValidData) {
            console.log('✅ FIXED: Successfully converted object to array:', converted.length, 'items');
            console.log('✅ FIXED: Converted players:', converted.map(p => ({ 
                name: p.name, 
                userId: p.userId, 
                hasTokenImage: !!p.tokenImage,
                hasColor: !!p.color 
            })));
            return converted;
        } else {
            console.warn('⚠️ FIXED: Converted array contains no valid player data');
            console.log('⚠️ FIXED: Raw converted data:', converted);
            // Don't return empty array immediately - try to salvage data
        }
    }
    
    // Try to extract values that look like player objects
    const values = Object.values(obj);
    const validPlayerValues = values.filter(val => 
        val && typeof val === 'object' && val !== null && (
            (val.name && val.name !== 'undefined' && val.name !== 'null') ||
            (val.userId && val.userId !== 'undefined' && val.userId !== 'null') ||
            val.hasOwnProperty('money') ||
            val.hasOwnProperty('isHost')
        )
    );
    
    if (validPlayerValues.length > 0) {
        console.log('🔧 FIXED: Extracting player values from object as array');
        return validPlayerValues;
    }
    
    console.warn('⚠️ FIXED: No valid player data found in object:', obj);
    return [];
}

// Enhanced token image loading and assignment
function ensurePlayerTokenImages(players) {
    console.log('🎨 FIXED: Ensuring all players have proper token images');
    
    const tokenImages = [
        'assets/images/t1.png', 'assets/images/t2.png', 'assets/images/t3.png',
        'assets/images/t4.png', 'assets/images/t5.png', 'assets/images/t6.png',
        'assets/images/t7.png', 'assets/images/t8.png', 'assets/images/t9.png'
    ];
    
    return players.map((player, index) => {
        if (!player) return null;
        
        const fixedPlayer = { ...player };
        
        // Ensure tokenImage is set
        if (!fixedPlayer.tokenImage || fixedPlayer.tokenImage === 'undefined') {
            const tokenIndex = fixedPlayer.tokenIndex || index;
            fixedPlayer.tokenImage = tokenImages[tokenIndex % tokenImages.length];
            console.log(`🎨 FIXED: Set token image for ${fixedPlayer.name}: ${fixedPlayer.tokenImage}`);
        }
        
        // Ensure color is set
        if (!fixedPlayer.color || fixedPlayer.color === 'undefined' || fixedPlayer.color === 'null') {
            const colors = ['#ff0000', '#0000ff', '#00ff00', '#ffff00', '#800080'];
            const colorNames = ['Red', 'Blue', 'Green', 'Yellow', 'Purple'];
            const colorIndex = (fixedPlayer.tokenIndex || index) % colors.length;
            
            fixedPlayer.color = colors[colorIndex];
            fixedPlayer.colorName = colorNames[colorIndex];
            console.log(`🎨 FIXED: Set color for ${fixedPlayer.name}: ${fixedPlayer.color} (${fixedPlayer.colorName})`);
        }
        
        // Load token image if not already loaded
        if (!fixedPlayer.image && fixedPlayer.tokenImage) {
            console.log(`🎨 FIXED: Loading token image for ${fixedPlayer.name}: ${fixedPlayer.tokenImage}`);
            
            const img = new Image();
            img.onload = function() {
                fixedPlayer.image = img;
                console.log(`✅ FIXED: Token image loaded for ${fixedPlayer.name}`);
                
                // Trigger a visual update
                if (typeof updateGameFrame === 'function') {
                    updateGameFrame();
                }
            };
            img.onerror = function() {
                console.error(`❌ FIXED: Failed to load token image for ${fixedPlayer.name}: ${fixedPlayer.tokenImage}`);
            };
            img.src = fixedPlayer.tokenImage;
        }
        
        return fixedPlayer;
    }).filter(player => player != null);
}

// Enhanced turn validation to prevent wrong-turn actions
function validatePlayerTurn(currentPlayerName, localPlayerName, action = 'action') {
    const isMyTurn = currentPlayerName && localPlayerName && 
                     currentPlayerName.toLowerCase() === localPlayerName.toLowerCase();
    
    console.log(`🎯 FIXED: Turn validation for ${action}:`, {
        currentPlayer: currentPlayerName,
        localPlayer: localPlayerName,
        isMyTurn: isMyTurn
    });
    
    if (!isMyTurn) {
        console.log(`🚫 FIXED: Blocking ${action} - not ${localPlayerName}'s turn (current: ${currentPlayerName})`);
        return false;
    }
    
    return true;
}

// Enhanced property development validation
function validatePropertyDevelopment(propertySquare, currentPlayerName, localPlayerName, propertyOwner) {
    console.log(`🏠 FIXED: Validating property development:`, {
        square: propertySquare,
        currentPlayer: currentPlayerName,
        localPlayer: localPlayerName,
        propertyOwner: propertyOwner
    });
    
    // Check if it's the player's turn
    if (!validatePlayerTurn(currentPlayerName, localPlayerName, 'property development')) {
        return false;
    }
    
    // Check if the player owns the property
    if (propertyOwner !== localPlayerName) {
        console.log(`🚫 FIXED: Blocking development - ${localPlayerName} doesn't own ${propertySquare} (owner: ${propertyOwner})`);
        return false;
    }
    
    return true;
}

// Enhanced position synchronization
function syncPlayerPositions(players, positionsMap) {
    console.log('📍 FIXED: Synchronizing player positions');
    
    return players.map(player => {
        if (!player || !player.currentSquare) return player;
        
        const position = positionsMap.get(player.currentSquare);
        if (position && (player.x !== position.x || player.y !== position.y)) {
            console.log(`📍 FIXED: Updated position for ${player.name}: ${player.currentSquare} -> (${position.x}, ${position.y})`);
            return {
                ...player,
                x: position.x,
                y: position.y
            };
        }
        
        return player;
    });
}

// Export functions for global use
if (typeof window !== 'undefined') {
    window.MultiplayerRenderingFix = {
        fixedConvertObjectToArray,
        ensurePlayerTokenImages,
        validatePlayerTurn,
        validatePropertyDevelopment,
        syncPlayerPositions
    };
    
    // Override the problematic convertObjectToArray function
    if (window.convertObjectToArray) {
        console.log('🔧 FIXED: Overriding convertObjectToArray with enhanced version');
        window.convertObjectToArray = fixedConvertObjectToArray;
    }
    
    console.log('🔧 Multiplayer Rendering Fix utilities loaded!');
    console.log('💡 Enhanced Firebase array conversion, token loading, and turn validation active');
}

export {
    fixedConvertObjectToArray,
    ensurePlayerTokenImages,
    validatePlayerTurn,
    validatePropertyDevelopment,
    syncPlayerPositions
};

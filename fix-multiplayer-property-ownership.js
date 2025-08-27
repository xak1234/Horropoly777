// Fix for Multiplayer Property Ownership Registration Issues
// This script addresses critical synchronization problems in multiplayer games

console.log('🏠 Loading Multiplayer Property Ownership Fix...');

// Store original functions for restoration if needed
const originalHandlePropertyPurchase = window.handlePropertyPurchase;
const originalUpdateGameFromState = window.updateGameFromState;
const originalSyncGameStateToFirebase = window.syncGameStateToFirebase;

// Enhanced property purchase function with real-time validation
async function enhancedHandlePropertyPurchase(square, playerIndex) {
    console.log(`🏠 [Enhanced] Property purchase attempt: ${square} by player ${playerIndex}`);
    
    const player = players[playerIndex];
    const propertyInfo = getPropertyInfo(square);
    
    if (!player || !propertyInfo) {
        console.error('[Enhanced] Invalid player or property info');
        return;
    }
    
    // CRITICAL: Check Firebase state first in multiplayer games
    if (isMultiplayerGame && currentRoomId) {
        try {
            console.log('🔍 Checking real-time property ownership in Firebase...');
            
            // Import Firebase functions
            const { getDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            const roomRef = doc(window.firebaseDb || db, 'gameRooms', currentRoomId);
            const roomSnap = await getDoc(roomRef);
            
            if (roomSnap.exists()) {
                const roomData = roomSnap.data();
                const firebasePropertyState = roomData.properties || {};
                const firebaseProperty = firebasePropertyState[square];
                
                if (firebaseProperty && firebaseProperty.owner) {
                    console.warn(`🚫 Property ${square} already owned by ${firebaseProperty.owner} in Firebase`);
                    showAdvisory(`${getPropertyDisplayName(propertyInfo)} is already owned by ${firebaseProperty.owner}.`, 'error');
                    
                    // Update local state to match Firebase
                    propertyState[square] = { ...firebaseProperty };
                    updateGameFrame();
                    updateInfoPanel();
                    
                    return; // Block the purchase
                }
            }
        } catch (error) {
            console.error('Failed to check Firebase property state:', error);
            // Continue with local validation as fallback
        }
    }
    
    // Proceed with original purchase logic
    return originalHandlePropertyPurchase.call(this, square, playerIndex);
}

// Enhanced game state update function with proper property synchronization
async function enhancedUpdateGameFromState(gameState) {
    if (!gameState || !isMultiplayerGame) {
        return originalUpdateGameFromState.call(this, gameState);
    }
    
    console.log('🔄 [Enhanced] Updating game state with improved property sync...');
    
    // Call original function first
    await originalUpdateGameFromState.call(this, gameState);
    
    // CRITICAL FIX: Always accept property updates from Firebase
    if (gameState.properties) {
        console.log('🏠 [Enhanced] Force-syncing property ownership from Firebase...');
        
        Object.entries(gameState.properties).forEach(([square, firebaseProp]) => {
            const localProp = propertyState[square];
            
            // Always update property ownership from Firebase (override local state)
            if (firebaseProp && firebaseProp.owner) {
                console.log(`🔄 Force updating property ${square}: ${firebaseProp.owner} (was: ${localProp?.owner || 'unowned'})`);
                propertyState[square] = { ...firebaseProp };
                
                // Ensure owner color is set
                if (!firebaseProp.ownerColor) {
                    const ownerPlayer = players.find(p => p.name.toLowerCase() === firebaseProp.owner.toLowerCase());
                    if (ownerPlayer && ownerPlayer.color) {
                        propertyState[square].ownerColor = ownerPlayer.color;
                    }
                }
            } else if (firebaseProp && !firebaseProp.owner && localProp && localProp.owner) {
                // Property was released in Firebase, update local state
                console.log(`🔄 Property ${square} released in Firebase, updating local state`);
                propertyState[square] = { ...firebaseProp };
            }
        });
        
        // Force UI update to reflect property changes
        updateGameFrame();
        updateInfoPanel();
    }
}

// Enhanced Firebase sync with immediate property updates
let propertyUpdateQueue = [];
let immediatePropertySync = false;

async function enhancedSyncGameStateToFirebase() {
    if (!isMultiplayerGame || !currentRoomId) return;
    
    // For property updates, sync immediately without delay
    if (immediatePropertySync) {
        console.log('🚀 [Enhanced] Immediate property sync to Firebase...');
        immediatePropertySync = false;
        
        try {
            await performActualFirebaseSync();
        } catch (error) {
            console.error('Immediate property sync failed:', error);
        }
        return;
    }
    
    // Use original batched sync for other updates
    return originalSyncGameStateToFirebase.call(this);
}

// Function to trigger immediate property sync
function triggerImmediatePropertySync() {
    console.log('🚀 Triggering immediate property sync...');
    immediatePropertySync = true;
    enhancedSyncGameStateToFirebase();
}

// Enhanced property purchase wrapper that triggers immediate sync
async function propertyPurchaseWithImmediateSync(square, playerIndex) {
    console.log(`🏠 [Enhanced] Property purchase with immediate sync: ${square}`);
    
    // Call enhanced purchase function
    await enhancedHandlePropertyPurchase(square, playerIndex);
    
    // Trigger immediate sync for property changes
    if (isMultiplayerGame) {
        triggerImmediatePropertySync();
    }
}

// Apply the fixes
function applyPropertyOwnershipFixes() {
    console.log('🔧 Applying multiplayer property ownership fixes...');
    
    // Replace the functions
    window.handlePropertyPurchase = propertyPurchaseWithImmediateSync;
    window.updateGameFromState = enhancedUpdateGameFromState;
    window.syncGameStateToFirebase = enhancedSyncGameStateToFirebase;
    
    // Also patch the global reference
    if (typeof handlePropertyPurchase !== 'undefined') {
        handlePropertyPurchase = propertyPurchaseWithImmediateSync;
    }
    
    console.log('✅ Property ownership fixes applied successfully!');
    
    // Add visual indicator
    showAdvisory('🏠 Property ownership sync enhanced for multiplayer!', 'info');
}

// Restore original functions
function restoreOriginalFunctions() {
    console.log('🔄 Restoring original property functions...');
    
    window.handlePropertyPurchase = originalHandlePropertyPurchase;
    window.updateGameFromState = originalUpdateGameFromState;
    window.syncGameStateToFirebase = originalSyncGameStateToFirebase;
    
    if (typeof handlePropertyPurchase !== 'undefined') {
        handlePropertyPurchase = originalHandlePropertyPurchase;
    }
    
    console.log('✅ Original functions restored!');
}

// Auto-apply fixes when in multiplayer mode
if (typeof isMultiplayerGame !== 'undefined' && isMultiplayerGame) {
    console.log('🎮 Multiplayer game detected, auto-applying fixes...');
    applyPropertyOwnershipFixes();
} else {
    console.log('📝 Fixes loaded, will apply when multiplayer game starts');
}

// Expose functions for manual control
window.applyPropertyOwnershipFixes = applyPropertyOwnershipFixes;
window.restoreOriginalPropertyFunctions = restoreOriginalFunctions;
window.triggerImmediatePropertySync = triggerImmediatePropertySync;

// Monitor for multiplayer game start
const originalStartMultiplayerGame = window.startMultiplayerGame;
if (originalStartMultiplayerGame) {
    window.startMultiplayerGame = async function(...args) {
        console.log('🎮 Multiplayer game starting, applying property fixes...');
        const result = await originalStartMultiplayerGame.apply(this, args);
        applyPropertyOwnershipFixes();
        return result;
    };
}

console.log('🏠 Multiplayer Property Ownership Fix loaded successfully!');
console.log('📋 Available commands:');
console.log('  - applyPropertyOwnershipFixes() - Apply the fixes');
console.log('  - restoreOriginalPropertyFunctions() - Restore original functions');
console.log('  - triggerImmediatePropertySync() - Force immediate property sync');

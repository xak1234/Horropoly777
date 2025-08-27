// Fix for vanishing crypts during Firebase synchronization
// This addresses the issue where hasCrypt property gets lost during multiplayer sync

// Enhanced merge function that preserves development state
function mergePropertyStatePreservingDevelopment(localProp, firebaseProp, square) {
    console.log(`[mergePropertyState] 🏰 Merging ${square}: Local hasCrypt=${localProp?.hasCrypt}, Firebase hasCrypt=${firebaseProp?.hasCrypt}`);
    
    // If local property has development (crypts/graveyards) but Firebase doesn't, preserve local development
    const localHasCrypt = localProp?.hasCrypt || false;
    const localGraveyards = localProp?.graveyards || 0;
    const firebaseHasCrypt = firebaseProp?.hasCrypt || false;
    const firebaseGraveyards = firebaseProp?.graveyards || 0;
    
    // Determine which development state to use
    let finalHasCrypt = firebaseHasCrypt;
    let finalGraveyards = firebaseGraveyards;
    
    // If local has more development than Firebase, preserve local development
    if (localHasCrypt && !firebaseHasCrypt) {
        console.log(`[mergePropertyState] 🏰 Preserving local crypt for ${square}`);
        finalHasCrypt = true;
        finalGraveyards = 0; // Crypts reset graveyards
    } else if (!localHasCrypt && !firebaseHasCrypt && localGraveyards > firebaseGraveyards) {
        console.log(`[mergePropertyState] 🪦 Preserving local graveyards (${localGraveyards}) for ${square}`);
        finalGraveyards = localGraveyards;
    }
    
    // Create merged state preserving the most developed version
    const mergedState = {
        ...firebaseProp,
        hasCrypt: finalHasCrypt,
        graveyards: finalGraveyards,
        group: localProp?.group || firebaseProp?.group, // Preserve group info
        declined: firebaseProp?.declined || localProp?.declined || false
    };
    
    console.log(`[mergePropertyState] 🏰 Final state for ${square}:`, {
        owner: mergedState.owner,
        hasCrypt: mergedState.hasCrypt,
        graveyards: mergedState.graveyards
    });
    
    return mergedState;
}

// Enhanced updateGameFromState function with crypt preservation
async function enhancedUpdateGameFromState(gameState) {
    if (!gameState) {
        console.warn('[enhancedUpdateGameFromState] No game state provided');
        return;
    }

    console.log('[enhancedUpdateGameFromState] 🏰 Starting enhanced property sync with crypt preservation');

    // Update players first
    if (gameState.players && Array.isArray(gameState.players)) {
        console.log('Updating players from Firebase state');
        
        gameState.players.forEach((player, idx) => {
            if (players[idx]) {
                // Preserve local player data but update from Firebase
                players[idx].name = player.name || players[idx].name;
                players[idx].money = player.money !== undefined ? player.money : players[idx].money;
                players[idx].currentSquare = player.currentSquare || players[idx].currentSquare;
                players[idx].x = player.x !== undefined ? player.x : players[idx].x;
                players[idx].y = player.y !== undefined ? player.y : players[idx].y;
                players[idx].isInJail = player.isInJail !== undefined ? player.isInJail : players[idx].isInJail;
                players[idx].jailTurns = player.jailTurns !== undefined ? player.jailTurns : players[idx].jailTurns;
                players[idx].doublesCount = player.doublesCount !== undefined ? player.doublesCount : players[idx].doublesCount;
                
                // Handle token image updates
                if (player.tokenImage && player.tokenImage !== players[idx].tokenImage) {
                    console.log(`Updating token image for ${player.name}`);
                    players[idx].tokenImage = player.tokenImage;
                    
                    // Load new token image
                    const img = new Image();
                    img.onload = () => {
                        console.log(`Token image loaded for ${player.name}`);
                        updateGameFrame();
                        
                        // Force sync to Firebase to make this player's token visible to others
                        if (isMultiplayerGame) {
                            console.log(`Syncing ${player.name}'s token visibility to Firebase...`);
                            syncGameStateToFirebase();
                        }
                    };
                    img.onerror = () => {
                        console.warn(`Failed to load token image for ${player.name}:`, player.tokenImage);
                    };
                    img.src = player.tokenImage;
                }
            }
        });
    }

    // Enhanced property state update with development preservation
    if (gameState.properties) {
        console.log('🏰 Restoring property state from Firebase with crypt preservation:', gameState.properties);
        console.log('🐞 Current local property state before restore:', JSON.stringify(propertyState));
        
        // Track properties that had crypts before sync
        const propertiesWithCryptsBefore = {};
        Object.entries(propertyState).forEach(([square, state]) => {
            if (state?.hasCrypt) {
                propertiesWithCryptsBefore[square] = true;
            }
        });
        
        // Merge property state carefully to avoid overwriting recent local changes AND preserve development
        Object.entries(gameState.properties).forEach(([square, firebaseProp]) => {
            const localProp = propertyState[square];
            console.log(`[enhancedUpdateGameFromState] 🐞 MERGE CHECK for ${square}: Local owner: ${localProp?.owner}, Firebase owner: ${firebaseProp?.owner}`);
            console.log(`[enhancedUpdateGameFromState] 🏰 CRYPT CHECK for ${square}: Local hasCrypt: ${localProp?.hasCrypt}, Firebase hasCrypt: ${firebaseProp?.hasCrypt}`);
            
            const timeSincePurchase = localProp?.purchaseTimestamp ? Date.now() - localProp.purchaseTimestamp : Infinity;

            // If local property was purchased recently and firebase update is trying to nullify owner, ignore it.
            if (localProp && localProp.owner && !firebaseProp.owner && timeSincePurchase < 15000) {
                console.log(`[enhancedUpdateGameFromState] 🛡️ IGNORING stale Firebase update for recently purchased property ${square}.`);
                return; // Skip update for this property
            }

            // Enhanced merge logic that preserves development
            if (localProp && localProp.owner && !firebaseProp.owner) {
                console.log(`Merged property ${square} (keeping local owner and development)`);
                // Use firebase state but preserve local ownership AND development
                propertyState[square] = mergePropertyStatePreservingDevelopment(localProp, firebaseProp, square);
                propertyState[square].owner = localProp.owner;
                propertyState[square].ownerColor = localProp.ownerColor;
            } else {
                // Use enhanced merge that preserves development
                propertyState[square] = mergePropertyStatePreservingDevelopment(localProp, firebaseProp, square);
            }
        });
        
        // Check for lost crypts and report
        const propertiesWithCryptsAfter = {};
        Object.entries(propertyState).forEach(([square, state]) => {
            if (state?.hasCrypt) {
                propertiesWithCryptsAfter[square] = true;
            }
        });
        
        // Report any crypts that were preserved or lost
        Object.keys(propertiesWithCryptsBefore).forEach(square => {
            if (!propertiesWithCryptsAfter[square]) {
                console.warn(`🏰 CRYPT LOST during sync for ${square}! This should not happen with the enhanced merge.`);
            } else {
                console.log(`🏰 CRYPT PRESERVED for ${square} ✅`);
            }
        });
        
        console.log('🐞 Current local property state after enhanced restore:', JSON.stringify(propertyState));
        
        // Ensure ownerColor is set based on player colors
        Object.entries(propertyState).forEach(([square, state]) => {
            if (state.owner && !state.ownerColor) {
                const ownerPlayer = players.find(p => p.name === state.owner);
                if (ownerPlayer) {
                    state.ownerColor = getPlayerColor(ownerPlayer.name);
                    console.log(`Fixed missing color for property ${square} owned by ${state.owner}, color: ${state.ownerColor}`);
                }
            }
        });

        // Rebuild player property arrays to maintain consistency
        rebuildPlayerPropertyArrays();
    }

    // Update other game state
    if (gameState.currentPlayerIndex !== undefined) {
        currentPlayerIndex = gameState.currentPlayerIndex;
    }
    
    if (gameState.gameStarted !== undefined) {
        gameStarted = gameState.gameStarted;
    }

    // Update UI
    updateGameFrame();
    updateInfoPanel();
    if (typeof updateBottomPlayerDisplay === 'function') {
        updateBottomPlayerDisplay();
    }
    
    console.log('[enhancedUpdateGameFromState] 🏰 Enhanced sync completed with crypt preservation');
}

// Function to validate and fix property state integrity
function validateAndFixPropertyState() {
    console.log('🔧 [validatePropertyState] Checking property state integrity...');
    
    let fixedCount = 0;
    
    Object.entries(propertyState).forEach(([square, state]) => {
        let needsUpdate = false;
        
        // Ensure hasCrypt is boolean
        if (typeof state.hasCrypt !== 'boolean') {
            console.warn(`🔧 Fixing hasCrypt type for ${square}: ${state.hasCrypt} -> false`);
            state.hasCrypt = false;
            needsUpdate = true;
        }
        
        // Ensure graveyards is a valid number
        if (typeof state.graveyards !== 'number' || state.graveyards < 0 || state.graveyards > 4) {
            console.warn(`🔧 Fixing graveyards for ${square}: ${state.graveyards} -> 0`);
            state.graveyards = 0;
            needsUpdate = true;
        }
        
        // If has crypt, graveyards should be 0
        if (state.hasCrypt && state.graveyards > 0) {
            console.warn(`🔧 Fixing graveyards for crypt property ${square}: ${state.graveyards} -> 0`);
            state.graveyards = 0;
            needsUpdate = true;
        }
        
        // Ensure group is set
        if (!state.group) {
            const foundGroup = Object.entries(propertyGroups).find(([groupName, groupInfo]) => 
                groupInfo.positions.includes(square)
            );
            if (foundGroup) {
                state.group = foundGroup[0];
                console.log(`🔧 Fixed missing group for ${square}: ${state.group}`);
                needsUpdate = true;
            }
        }
        
        if (needsUpdate) {
            fixedCount++;
        }
    });
    
    if (fixedCount > 0) {
        console.log(`🔧 [validatePropertyState] Fixed ${fixedCount} property state issues`);
        updateGameFrame();
    } else {
        console.log('🔧 [validatePropertyState] Property state integrity OK');
    }
    
    return fixedCount;
}

// Function to backup and restore crypt state
function backupCryptState() {
    const cryptBackup = {};
    Object.entries(propertyState).forEach(([square, state]) => {
        if (state?.hasCrypt) {
            cryptBackup[square] = {
                hasCrypt: true,
                owner: state.owner,
                ownerColor: state.ownerColor
            };
        }
    });
    console.log('🏰 Backed up crypt state:', cryptBackup);
    return cryptBackup;
}

function restoreCryptState(cryptBackup) {
    let restoredCount = 0;
    Object.entries(cryptBackup).forEach(([square, backupState]) => {
        if (propertyState[square] && !propertyState[square].hasCrypt) {
            console.log(`🏰 Restoring lost crypt for ${square}`);
            propertyState[square].hasCrypt = true;
            propertyState[square].graveyards = 0;
            restoredCount++;
        }
    });
    
    if (restoredCount > 0) {
        console.log(`🏰 Restored ${restoredCount} lost crypts`);
        updateGameFrame();
        
        // Sync the restoration to Firebase
        if (isMultiplayerGame) {
            syncGameStateToFirebase();
        }
    }
    
    return restoredCount;
}

// Export functions for use in game.js
if (typeof window !== 'undefined') {
    window.enhancedUpdateGameFromState = enhancedUpdateGameFromState;
    window.validateAndFixPropertyState = validateAndFixPropertyState;
    window.backupCryptState = backupCryptState;
    window.restoreCryptState = restoreCryptState;
    window.mergePropertyStatePreservingDevelopment = mergePropertyStatePreservingDevelopment;
}

console.log('🏰 Crypt vanishing fix loaded - enhanced property sync with development preservation');

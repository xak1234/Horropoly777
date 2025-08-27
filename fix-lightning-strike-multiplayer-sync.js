// Fix for Lightning Strike Multiplayer Synchronization
// This script ensures lightning strikes hit the same property across all players in multiplayer games

console.log('⚡ Loading Lightning Strike Multiplayer Synchronization Fix...');

// Store original functions for restoration if needed
const originalTriggerLightningStrike = window.triggerLightningStrike;
const originalScheduleLightningStrike = window.scheduleLightningStrike;

// Lightning strike synchronization state
let lightningStrikeSyncData = null;
let isLightningHost = false; // Only the host generates lightning strike data

// Enhanced lightning strike trigger with multiplayer synchronization
async function synchronizedTriggerLightningStrike() {
    if (lightningActive || !isGameInitialized || isGameOver) {
        // Skip if lightning already active, game not started, or game over
        if (typeof scheduleLightningStrike === 'function') {
            scheduleLightningStrike(); // Reschedule for next strike
        }
        return;
    }
    
    // CRITICAL FIX: In multiplayer games, only the host should generate lightning strike data
    if (isMultiplayerGame) {
        // Determine if this client should be the lightning host
        // Use the first player (index 0) as the lightning host to ensure consistency
        const hostPlayer = players && players.length > 0 ? players[0] : null;
        isLightningHost = hostPlayer && (
            (typeof currentPlayerName !== 'undefined' && hostPlayer.name === currentPlayerName) ||
            (typeof playerName !== 'undefined' && hostPlayer.name === playerName) ||
            (hostPlayer.isHost === true)
        );
        
        console.log(`⚡ [Sync] Lightning strike triggered in multiplayer. This client is host: ${isLightningHost}`);
        
        if (isLightningHost) {
            // Host generates the lightning strike data and syncs it to Firebase
            await generateAndSyncLightningStrike();
        } else {
            // Non-host clients wait for lightning strike data from Firebase
            console.log('⚡ [Sync] Non-host client waiting for lightning strike data from Firebase...');
            // The lightning strike will be triggered when Firebase data is received
            return;
        }
    } else {
        // Single player game - use original logic
        return originalTriggerLightningStrike.call(this);
    }
}

// Generate lightning strike data and sync to Firebase (host only)
async function generateAndSyncLightningStrike() {
    console.log('⚡ [Sync] Host generating lightning strike data...');
    
    lightningActive = true;
    
    // CRITICAL FIX: Validate game state before lightning strike in multiplayer
    if (!Array.isArray(players) || players.length === 0) {
        console.error('⚡ Lightning strike aborted: Invalid players array:', players);
        lightningActive = false;
        scheduleLightningStrike();
        return;
    }
    
    // Check for corrupted property state
    if (!propertyState || typeof propertyState !== 'object') {
        console.error('⚡ Lightning strike aborted: Invalid property state:', propertyState);
        lightningActive = false;
        scheduleLightningStrike();
        return;
    }
    
    // Validate players have proper structure
    const hasValidPlayers = players.some(p => p && p.name && p.name !== 'undefined');
    if (!hasValidPlayers) {
        console.error('⚡ Lightning strike aborted: No valid players found');
        lightningActive = false;
        scheduleLightningStrike();
        return;
    }
    
    // Get all property positions that can be struck
    const propertyPositions = [];
    for (const group of Object.values(propertyGroups)) {
        propertyPositions.push(...group.positions);
    }
    
    // SYNCHRONIZED: Generate random property selection (host only)
    const randomIndex = Math.floor(Math.random() * propertyPositions.length);
    const targetProperty = propertyPositions[randomIndex];
    const timestamp = Date.now();
    
    // Create lightning strike data
    lightningStrikeSyncData = {
        targetProperty: targetProperty,
        timestamp: timestamp,
        randomIndex: randomIndex,
        hostPlayerId: players[0]?.userId || 'host',
        gameVersion: Date.now() // Prevent stale data
    };
    
    console.log(`⚡ [Sync] Host selected property ${targetProperty} (index ${randomIndex}/${propertyPositions.length})`);
    
    // Sync lightning strike data to Firebase
    if (currentRoomId) {
        try {
            console.log('⚡ [Sync] Syncing lightning strike data to Firebase...');
            
            // Use Firebase to sync the lightning strike data
            if (typeof updateGameState === 'function') {
                await updateGameState(currentRoomId, {
                    lightningStrike: lightningStrikeSyncData,
                    lastUpdated: new Date().toISOString()
                });
                console.log('⚡ [Sync] Lightning strike data synced to Firebase successfully');
            } else {
                console.error('⚡ [Sync] updateGameState function not available');
            }
            
            // Execute the lightning strike locally on the host
            await executeSynchronizedLightningStrike(lightningStrikeSyncData);
            
        } catch (error) {
            console.error('⚡ [Sync] Error syncing lightning strike to Firebase:', error);
            lightningActive = false;
            scheduleLightningStrike();
        }
    } else {
        console.error('⚡ [Sync] No current room ID for syncing lightning strike');
        lightningActive = false;
        scheduleLightningStrike();
    }
}

// Execute synchronized lightning strike (called by all clients)
async function executeSynchronizedLightningStrike(strikeData) {
    if (!strikeData || !strikeData.targetProperty) {
        console.error('⚡ [Sync] Invalid lightning strike data:', strikeData);
        return;
    }
    
    const targetProperty = strikeData.targetProperty;
    console.log(`⚡ [Sync] Executing synchronized lightning strike on ${targetProperty}`);
    
    const propertyPos = positionsMap?.get(targetProperty);
    
    if (!propertyPos) {
        console.error('⚡ [Sync] Could not find position for lightning strike property:', targetProperty);
        lightningActive = false;
        if (typeof scheduleLightningStrike === 'function') {
            scheduleLightningStrike();
        }
        return;
    }
    
    console.log(`⚡ [Sync] Lightning strikes ${targetProperty} at position (${propertyPos.x}, ${propertyPos.y})`);
    
    // Create lightning visual effect
    if (typeof createLightningEffect === 'function') {
        createLightningEffect(propertyPos.x, propertyPos.y);
    }
    
    // Create persistent scorch mark on the property
    if (typeof createScorchMark === 'function') {
        createScorchMark(targetProperty);
    }
    
    // If property is owned at the moment of strike, add a red glow pulse for 2s
    try {
        const propertyDataAtStrike = propertyState[targetProperty];
        if (propertyDataAtStrike && propertyDataAtStrike.owner) {
            if (typeof createOwnedPropertyRedGlow === 'function') {
                createOwnedPropertyRedGlow(targetProperty);
            }
        }
    } catch (e) {
        console.warn('⚡ [Sync] Failed to apply owned-property red glow:', e);
    }

    // Play lightning sound (strike sound)
    if (typeof playStrikeSound === 'function') {
        playStrikeSound();
    }
    
    // Check if any players are on this property
    const playersOnProperty = players.filter(player => 
        !player.bankrupt && player.currentSquare === targetProperty
    );
    
    if (playersOnProperty.length > 0) {
        console.log(`⚡ [Sync] ${playersOnProperty.length} player(s) struck by lightning on ${targetProperty}!`);
        
        // Apply penalty to each player on the property
        for (const player of playersOnProperty) {
            if (typeof applyLightningPenalty === 'function') {
                await applyLightningPenalty(player, targetProperty);
            }
        }
    } else {
        console.log(`⚡ [Sync] Lightning strikes ${targetProperty} but no players are there`);
        
        // Get proper property display name
        const propertyInfo = getPropertyInfo ? getPropertyInfo(targetProperty) : null;
        const displayName = propertyInfo && getPropertyDisplayNameWithoutNumber ? 
            getPropertyDisplayNameWithoutNumber(propertyInfo) : targetProperty;
        
        // Still apply property effects even if no players are on the property
        let propertyEffectMessage = null;
        if (typeof applyLightningPropertyEffects === 'function') {
            propertyEffectMessage = await applyLightningPropertyEffects(targetProperty);
        }
        
        // Check if property is unowned
        const propertyData = propertyState[targetProperty];
        const isUnowned = !propertyData || !propertyData.owner;
        
        let message;
        if (isUnowned) {
            message = `⚡ Lightning strikes ${displayName}! The empty property is scorched but undamaged.`;
        } else {
            message = `⚡ Lightning strikes ${displayName}!`;
            if (propertyEffectMessage) {
                message = propertyEffectMessage;
            } else {
                message += ` Fortunately, no developments were damaged this time.`;
            }
        }
        
        if (typeof showAdvisory === 'function') {
            showAdvisory(message, 'lightning');
        }
        
        // Brief pause to show the effect
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Schedule next lightning strike
    setTimeout(() => {
        lightningActive = false;
        if (typeof scheduleLightningStrike === 'function') {
            scheduleLightningStrike();
        }
    }, 3000); // 3 second delay before next strike can be scheduled
}

// Enhanced game state update to handle lightning strike synchronization
const originalUpdateGameFromState = window.updateGameFromState;
async function enhancedUpdateGameFromStateWithLightning(gameState) {
    // Call original function first
    if (originalUpdateGameFromState) {
        await originalUpdateGameFromState.call(this, gameState);
    }
    
    // Handle lightning strike synchronization
    if (gameState && gameState.lightningStrike && isMultiplayerGame) {
        const incomingStrike = gameState.lightningStrike;
        
        // Check if this is a new lightning strike (prevent duplicate execution)
        if (!lightningStrikeSyncData || 
            lightningStrikeSyncData.timestamp !== incomingStrike.timestamp ||
            lightningStrikeSyncData.targetProperty !== incomingStrike.targetProperty) {
            
            console.log('⚡ [Sync] Received new lightning strike data from Firebase:', incomingStrike);
            
            // Update local lightning strike data
            lightningStrikeSyncData = incomingStrike;
            
            // Execute the lightning strike if we're not the host (host already executed it)
            if (!isLightningHost) {
                console.log('⚡ [Sync] Non-host client executing synchronized lightning strike...');
                await executeSynchronizedLightningStrike(incomingStrike);
            } else {
                console.log('⚡ [Sync] Host client - lightning strike already executed locally');
            }
        }
    }
}

// Replace the original functions
if (typeof window !== 'undefined') {
    window.triggerLightningStrike = synchronizedTriggerLightningStrike;
    
    // Also replace updateGameFromState if it exists
    if (typeof window.updateGameFromState === 'function') {
        window.updateGameFromState = enhancedUpdateGameFromStateWithLightning;
    }
    
    console.log('⚡ [Sync] Lightning strike synchronization system installed successfully');
    console.log('⚡ [Sync] Lightning strikes will now hit the same property for all players in multiplayer games');
}

// Cleanup function to restore original functions if needed
window.restoreLightningStrikeFunctions = function() {
    if (originalTriggerLightningStrike) {
        window.triggerLightningStrike = originalTriggerLightningStrike;
    }
    if (originalUpdateGameFromState) {
        window.updateGameFromState = originalUpdateGameFromState;
    }
    console.log('⚡ [Sync] Original lightning strike functions restored');
};

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        synchronizedTriggerLightningStrike,
        executeSynchronizedLightningStrike,
        enhancedUpdateGameFromStateWithLightning
    };
}

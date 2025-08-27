/**
 * 🚨 CRITICAL LIGHTNING MULTIPLAYER SYNC FIX
 * Addresses the specific issue where lightning strikes hit different properties on different players' screens
 * 
 * Root Issue: Each client generates its own random lightning target, causing desynchronization
 * Solution: Host-based lightning generation with Firebase synchronization
 */

(function() {
    'use strict';
    
    console.log('⚡ Loading CRITICAL Lightning Multiplayer Sync Fix...');
    
    // State tracking
    let lightningFixApplied = false;
    let originalTriggerLightningStrike = null;
    let originalUpdateGameFromState = null;
    let lightningStrikeQueue = [];
    let lastLightningStrike = null;
    
    // Lightning synchronization data
    let lightningHost = null;
    let isLightningHost = false;
    
    function applyLightningMultiplayerFix() {
        if (lightningFixApplied) {
            console.log('⚡ Lightning multiplayer fix already applied');
            return;
        }
        
        // Store original functions
        originalTriggerLightningStrike = window.triggerLightningStrike;
        originalUpdateGameFromState = window.updateGameFromState;
        
        if (!originalTriggerLightningStrike) {
            console.warn('⚡ triggerLightningStrike not found, will retry...');
            return false;
        }
        
        // Determine lightning host (first player or host player)
        function determineLightningHost() {
            if (!window.players || !Array.isArray(window.players) || window.players.length === 0) {
                return null;
            }
            
            // Try to find the host player first
            const hostPlayer = window.players.find(p => p && p.isHost === true);
            if (hostPlayer) {
                return hostPlayer;
            }
            
            // Fallback to first valid player
            const firstPlayer = window.players.find(p => p && p.name && p.name !== 'undefined');
            return firstPlayer;
        }
        
        // Enhanced lightning strike function with multiplayer sync
        window.triggerLightningStrike = async function() {
            console.log('⚡ [CRITICAL] Lightning strike triggered with multiplayer sync');
            
            // Skip if lightning already active or game not ready
            if (window.lightningActive || !window.isGameInitialized || window.isGameOver) {
                console.log('⚡ Lightning skipped - game not ready or lightning active');
                if (typeof window.scheduleLightningStrike === 'function') {
                    window.scheduleLightningStrike();
                }
                return;
            }
            
            // In single player mode, use original function
            if (!window.isMultiplayerGame) {
                console.log('⚡ Single player mode - using original lightning');
                return originalTriggerLightningStrike.call(this);
            }
            
            // Multiplayer mode - determine host
            lightningHost = determineLightningHost();
            if (!lightningHost) {
                console.error('⚡ No valid lightning host found, aborting');
                if (typeof window.scheduleLightningStrike === 'function') {
                    window.scheduleLightningStrike();
                }
                return;
            }
            
            // Check if this client is the lightning host
            const localPlayerName = document.getElementById('player1-name')?.value?.trim() || window.localPlayerName;
            isLightningHost = lightningHost.name === localPlayerName;
            
            console.log(`⚡ [CRITICAL] Lightning host: ${lightningHost.name}, Local player: ${localPlayerName}, Is host: ${isLightningHost}`);
            
            if (isLightningHost) {
                // Host generates and syncs lightning data
                await generateLightningStrike();
            } else {
                // Non-host clients wait for Firebase data
                console.log('⚡ [CRITICAL] Non-host client waiting for lightning data from Firebase');
            }
        };
        
        // Generate lightning strike data (host only)
        async function generateLightningStrike() {
            console.log('⚡ [CRITICAL] Host generating lightning strike data');
            
            window.lightningActive = true;
            
            // Validate game state
            if (!Array.isArray(window.players) || window.players.length === 0) {
                console.error('⚡ Invalid players array, aborting lightning');
                window.lightningActive = false;
                if (typeof window.scheduleLightningStrike === 'function') {
                    window.scheduleLightningStrike();
                }
                return;
            }
            
            // Get property positions
            const propertyPositions = [];
            if (window.propertyGroups) {
                for (const group of Object.values(window.propertyGroups)) {
                    if (group.positions) {
                        propertyPositions.push(...group.positions);
                    }
                }
            }
            
            if (propertyPositions.length === 0) {
                console.error('⚡ No property positions found, aborting lightning');
                window.lightningActive = false;
                if (typeof window.scheduleLightningStrike === 'function') {
                    window.scheduleLightningStrike();
                }
                return;
            }
            
            // Generate synchronized random selection
            const randomIndex = Math.floor(Math.random() * propertyPositions.length);
            const targetProperty = propertyPositions[randomIndex];
            const timestamp = Date.now();
            
            const lightningData = {
                targetProperty: targetProperty,
                timestamp: timestamp,
                randomIndex: randomIndex,
                hostPlayer: lightningHost.name,
                gameVersion: timestamp
            };
            
            console.log(`⚡ [CRITICAL] Host selected property ${targetProperty} (index ${randomIndex})`);
            
            // Store locally
            lastLightningStrike = lightningData;
            
            // Sync to Firebase
            try {
                if (window.updateGameState && window.currentRoomId) {
                    await window.updateGameState(window.currentRoomId, {
                        lightningStrike: lightningData,
                        lastUpdated: new Date().toISOString()
                    });
                    console.log('⚡ [CRITICAL] Lightning data synced to Firebase');
                }
            } catch (error) {
                console.error('⚡ [CRITICAL] Failed to sync lightning data:', error);
            }
            
            // Execute lightning strike locally (host)
            await executeLightningStrike(lightningData);
        }
        
        // Execute lightning strike with given data
        async function executeLightningStrike(lightningData) {
            const targetProperty = lightningData.targetProperty;
            console.log(`⚡ [CRITICAL] Executing lightning strike on ${targetProperty}`);
            
            // Get property position
            const propertyPos = window.positionsMap?.get(targetProperty);
            if (!propertyPos) {
                console.error(`⚡ Could not find position for property ${targetProperty}`);
                window.lightningActive = false;
                return;
            }
            
            // Create lightning effect
            if (typeof window.createLightningEffect === 'function') {
                window.createLightningEffect(propertyPos.x, propertyPos.y);
            }
            
            // Play lightning sound
            if (typeof window.playStrikeSound === 'function') {
                window.playStrikeSound();
            }
            
            // Apply property effects
            if (typeof window.applyLightningPropertyEffects === 'function') {
                await window.applyLightningPropertyEffects(targetProperty);
            }
            
            // Check for players on the property
            if (window.players && Array.isArray(window.players)) {
                const playersOnProperty = window.players.filter(p => 
                    p && p.currentSquare === targetProperty && !p.bankrupt
                );
                
                for (const player of playersOnProperty) {
                    if (typeof window.handleLightningStrikeOnPlayer === 'function') {
                        await window.handleLightningStrikeOnPlayer(player, targetProperty);
                    }
                }
            }
            
            // Create scorch mark
            if (typeof window.createScorchMark === 'function') {
                window.createScorchMark(targetProperty);
            }
            
            // Schedule next lightning strike
            setTimeout(() => {
                window.lightningActive = false;
                if (typeof window.scheduleLightningStrike === 'function') {
                    window.scheduleLightningStrike();
                }
            }, 3000);
            
            console.log(`⚡ [CRITICAL] Lightning strike on ${targetProperty} completed`);
        }
        
        // Enhanced updateGameFromState to handle lightning sync
        if (originalUpdateGameFromState) {
            window.updateGameFromState = function(gameState) {
                // Call original function first
                const result = originalUpdateGameFromState.call(this, gameState);
                
                // Handle lightning synchronization
                if (gameState && gameState.lightningStrike && window.isMultiplayerGame) {
                    const incomingLightning = gameState.lightningStrike;
                    
                    // Check if this is a new lightning strike
                    if (!lastLightningStrike || 
                        lastLightningStrike.timestamp !== incomingLightning.timestamp ||
                        lastLightningStrike.targetProperty !== incomingLightning.targetProperty) {
                        
                        console.log('⚡ [CRITICAL] Received new lightning data from Firebase:', incomingLightning);
                        
                        // Update local data
                        lastLightningStrike = incomingLightning;
                        
                        // Execute if we're not the host (host already executed)
                        if (!isLightningHost) {
                            console.log('⚡ [CRITICAL] Non-host executing synchronized lightning');
                            executeLightningStrike(incomingLightning);
                        } else {
                            console.log('⚡ [CRITICAL] Host - lightning already executed locally');
                        }
                    }
                }
                
                return result;
            };
        }
        
        lightningFixApplied = true;
        console.log('✅ Critical lightning multiplayer sync fix applied');
        return true;
    }
    
    // Apply fix when ready
    function initializeLightningFix() {
        if (applyLightningMultiplayerFix()) {
            console.log('⚡ Critical lightning multiplayer fix initialized');
        } else {
            // Retry after delay
            setTimeout(initializeLightningFix, 1000);
        }
    }
    
    // Start immediately and after DOM ready
    initializeLightningFix();
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeLightningFix);
    }
    
    // Make functions globally available for debugging
    window.lightningMultiplayerFix = {
        isApplied: () => lightningFixApplied,
        isHost: () => isLightningHost,
        lastStrike: () => lastLightningStrike,
        forceSync: generateLightningStrike
    };
    
})();


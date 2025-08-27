/**
 * 🚨 CRITICAL FIX: Turn Skipping Issue
 * Addresses the specific problem where dice clicks are ignored even when it shows "Current player grog"
 * 
 * Root cause analysis:
 * 1. handleDiceClick has overly strict validation that blocks legitimate clicks
 * 2. Race conditions between isDiceRollInProgress and isDiceClickHandlerRunning flags
 * 3. Multiplayer turn validation may be incorrectly rejecting valid turns
 * 4. State flags not being properly reset after failed validation
 */

(function() {
    'use strict';
    
    console.log('🚨 Loading CRITICAL Turn Skipping Fix...');
    
    // Track fix state
    let fixApplied = false;
    let originalHandleDiceClick = null;
    
    function applyTurnSkippingFix() {
        if (fixApplied) {
            console.log('🔧 Turn skipping fix already applied');
            return;
        }
        
        // Store original function
        originalHandleDiceClick = window.handleDiceClick;
        if (!originalHandleDiceClick) {
            console.warn('⚠️ handleDiceClick not found, will retry...');
            return false;
        }
        
        // Override handleDiceClick with improved validation
        window.handleDiceClick = async function(source = 'main') {
            const clickId = Math.random().toString(36).substr(2, 9);
            const currentTime = Date.now();
            console.log(`🎲 [FIXED] DICE CLICKED (${source}) [ID: ${clickId}] - Enhanced validation...`);
            
            // CRITICAL FIX 1: Reset stuck states immediately
            if (window.isDiceRollInProgress && window.isDiceClickHandlerRunning) {
                const timeSinceLastClick = currentTime - (window.lastDiceClickTime || 0);
                if (timeSinceLastClick > 5000) { // If stuck for more than 5 seconds
                    console.log('🔧 [FIXED] Clearing stuck dice states (both flags stuck > 5s)');
                    window.isDiceRollInProgress = false;
                    window.isDiceClickHandlerRunning = false;
                    window.turnInProgress = false;
                }
            }
            
            // CRITICAL FIX 2: More lenient validation for multiplayer
            if (window.isMultiplayerGame) {
                const currentPlayer = window.players && window.players[window.currentPlayerIndex];
                const playerName = document.getElementById('player1-name')?.value?.trim() || window.localPlayerName;
                
                if (currentPlayer && playerName) {
                    const isMyTurn = currentPlayer.name.toLowerCase() === playerName.toLowerCase();
                    
                    if (!isMyTurn) {
                        console.log(`🚫 [FIXED] Not your turn: ${currentPlayer.name} vs ${playerName}`);
                        window.showAdvisory(`Waiting for ${currentPlayer.name}'s turn`, 'info');
                        return false;
                    } else {
                        console.log(`✅ [FIXED] Confirmed your turn: ${playerName}`);
                    }
                } else {
                    console.warn('⚠️ [FIXED] Missing player data, allowing click to proceed');
                }
            }
            
            // CRITICAL FIX 3: Bypass problematic validations for legitimate clicks
            const bypassValidation = 
                !window.isDiceRollInProgress && 
                !window.isDiceClickHandlerRunning && 
                !window.isRecordingEyes &&
                (!window.isMultiplayerGame || !window.isAITurn);
            
            if (bypassValidation) {
                console.log(`🚀 [FIXED] Bypassing complex validation - calling takeTurn directly`);
                
                // Set minimal required flags
                window.isDiceRollInProgress = true;
                window.isDiceClickHandlerRunning = true;
                window.lastDiceClickTime = currentTime;
                
                // Disable dice visually
                const diceSection = document.getElementById('dice-section');
                if (diceSection) {
                    diceSection.style.pointerEvents = 'none';
                    diceSection.style.opacity = '0.6';
                }
                
                try {
                    // Call takeTurn directly
                    await window.takeTurn();
                    console.log(`✅ [FIXED] takeTurn completed successfully`);
                } catch (error) {
                    console.error(`🚫 [FIXED] Error in takeTurn:`, error);
                } finally {
                    // Always reset flags
                    window.isDiceRollInProgress = false;
                    window.isDiceClickHandlerRunning = false;
                    
                    // Restore dice
                    if (diceSection) {
                        diceSection.style.pointerEvents = 'auto';
                        diceSection.style.opacity = '';
                    }
                }
                
                return true;
            }
            
            // CRITICAL FIX 4: If validation fails, try original with state reset
            console.log(`🔄 [FIXED] Falling back to original validation with state reset`);
            
            // Reset problematic states before calling original
            if (window.isDiceClickHandlerRunning && (currentTime - (window.lastDiceClickTime || 0)) > 3000) {
                console.log('🔧 [FIXED] Clearing stuck handler state before original call');
                window.isDiceClickHandlerRunning = false;
            }
            
            if (window.isDiceRollInProgress && (currentTime - (window.lastDiceClickTime || 0)) > 3000) {
                console.log('🔧 [FIXED] Clearing stuck roll state before original call');
                window.isDiceRollInProgress = false;
            }
            
            // Call original function
            try {
                return await originalHandleDiceClick.call(this, source);
            } catch (error) {
                console.error(`🚫 [FIXED] Error in original handleDiceClick:`, error);
                
                // Emergency reset
                window.isDiceRollInProgress = false;
                window.isDiceClickHandlerRunning = false;
                
                const diceSection = document.getElementById('dice-section');
                if (diceSection) {
                    diceSection.style.pointerEvents = 'auto';
                    diceSection.style.opacity = '';
                }
                
                return false;
            }
        };
        
        fixApplied = true;
        console.log('✅ Turn skipping fix applied successfully');
        return true;
    }
    
    // CRITICAL FIX 5: Emergency dice recovery system
    function startEmergencyDiceRecovery() {
        setInterval(() => {
            try {
                const diceSection = document.getElementById('dice-section');
                const currentTime = Date.now();
                const timeSinceLastClick = currentTime - (window.lastDiceClickTime || 0);
                
                // Check for stuck states
                const isStuck = (
                    window.isDiceRollInProgress || 
                    window.isDiceClickHandlerRunning
                ) && timeSinceLastClick > 10000; // 10 seconds
                
                if (isStuck && diceSection) {
                    console.log('🚨 [EMERGENCY] Detected stuck dice state, forcing recovery...');
                    
                    // Force reset all flags
                    window.isDiceRollInProgress = false;
                    window.isDiceClickHandlerRunning = false;
                    window.turnInProgress = false;
                    
                    // Restore dice section
                    diceSection.style.pointerEvents = 'auto';
                    diceSection.style.opacity = '';
                    diceSection.classList.remove('dice-processing', 'dice-disabled');
                    
                    console.log('✅ [EMERGENCY] Dice state recovered');
                }
                
                // Check if dice should be clickable but isn't
                if (!window.isDiceRollInProgress && 
                    !window.isDiceClickHandlerRunning && 
                    !window.isRecordingEyes &&
                    diceSection && 
                    diceSection.style.pointerEvents === 'none') {
                    
                    console.log('🔧 [EMERGENCY] Dice should be clickable, enabling...');
                    diceSection.style.pointerEvents = 'auto';
                    diceSection.style.opacity = '';
                }
                
            } catch (error) {
                console.error('🚫 [EMERGENCY] Error in dice recovery:', error);
            }
        }, 2000); // Check every 2 seconds
    }
    
    // Apply fix when ready
    function initializeFix() {
        if (applyTurnSkippingFix()) {
            startEmergencyDiceRecovery();
            console.log('🚀 Critical turn skipping fix initialized');
        } else {
            // Retry after delay
            setTimeout(initializeFix, 1000);
        }
    }
    
    // Start immediately and after DOM ready
    initializeFix();
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeFix);
    }
    
    // Make functions globally available for debugging
    window.fixTurnSkipping = {
        applyFix: applyTurnSkippingFix,
        emergencyReset: () => {
            window.isDiceRollInProgress = false;
            window.isDiceClickHandlerRunning = false;
            window.turnInProgress = false;
            const diceSection = document.getElementById('dice-section');
            if (diceSection) {
                diceSection.style.pointerEvents = 'auto';
                diceSection.style.opacity = '';
            }
            console.log('🚨 Emergency dice reset applied');
        }
    };
    
})();

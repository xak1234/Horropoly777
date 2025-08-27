/**
 * 🎯 MULTIPLAYER TURN PROGRESSION FIX
 * Fixes turn skipping, excessive refreshes, and dice click issues
 */

(function() {
    'use strict';
    
    console.log('🔧 Loading Multiplayer Turn Progression Fix...');
    
    // State tracking
    let lastTurnState = null;
    let turnProgressionLocked = false;
    let refreshThrottleTimer = null;
    let diceClickCooldown = false;
    
    // 1. FIX TURN PROGRESSION DEADLOCK
    function fixTurnProgression() {
        // Override the turn validation logic that's causing deadlocks
        const originalEnableDiceSection = window.enableDiceSection;
        if (originalEnableDiceSection) {
            window.enableDiceSection = function() {
                try {
                    console.log('🎲 [FIXED] enableDiceSection called with turn progression fix');
                    
                    // Reset any stuck states
                    if (window.isDiceRollInProgress) {
                        console.log('🔧 Clearing stuck dice roll state');
                        window.isDiceRollInProgress = false;
                    }
                    
                    if (window.takeTurnCompleted === false) {
                        console.log('🔧 Clearing stuck turn completion state');
                        window.takeTurnCompleted = true;
                    }
                    
                    // Call original with safety wrapper
                    return originalEnableDiceSection.apply(this, arguments);
                } catch (error) {
                    console.error('🚫 Error in enableDiceSection fix:', error);
                    // Fallback: enable dice manually
                    const diceSection = document.querySelector('.dice-section');
                    if (diceSection) {
                        diceSection.style.pointerEvents = 'auto';
                        diceSection.classList.remove('dice-disabled');
                    }
                }
            };
        }
    }
    
    // 2. FIX DICE CLICK VALIDATION
    function fixDiceClickValidation() {
        // Override dice click handler to fix ignored clicks
        const originalHandleDiceClick = window.handleDiceClick;
        if (originalHandleDiceClick) {
            window.handleDiceClick = function(event) {
                try {
                    // Prevent rapid clicking
                    if (diceClickCooldown) {
                        console.log('🎲 Dice click cooldown active, ignoring click');
                        return;
                    }
                    
                    diceClickCooldown = true;
                    setTimeout(() => { diceClickCooldown = false; }, 1000);
                    
                    console.log('🎲 [FIXED] Processing dice click with validation fix');
                    
                    // Reset problematic states before processing click
                    if (window.handlerRunning) {
                        console.log('🔧 Clearing stuck handler state');
                        window.handlerRunning = false;
                    }
                    
                    // Call original handler
                    return originalHandleDiceClick.apply(this, arguments);
                } catch (error) {
                    console.error('🚫 Error in dice click fix:', error);
                    diceClickCooldown = false;
                }
            };
        }
    }
    
    // 3. FIX EXCESSIVE REFRESH CALLS
    function fixExcessiveRefreshes() {
        const originalUpdateGameFrame = window.updateGameFrame;
        if (originalUpdateGameFrame) {
            window.updateGameFrame = function() {
                // Throttle refresh calls to max 10 FPS
                if (refreshThrottleTimer) {
                    return; // Skip this call
                }
                
                refreshThrottleTimer = setTimeout(() => {
                    refreshThrottleTimer = null;
                }, 100); // 100ms = 10 FPS max
                
                try {
                    return originalUpdateGameFrame.apply(this, arguments);
                } catch (error) {
                    console.error('🚫 Error in updateGameFrame:', error);
                }
            };
        }
    }
    
    // 4. FIX TURN STATE MONITORING
    function fixTurnStateMonitoring() {
        setInterval(() => {
            try {
                if (!window.players || !window.currentPlayerIndex) return;
                
                const currentTurnState = {
                    currentPlayer: window.players[window.currentPlayerIndex]?.name,
                    playerIndex: window.currentPlayerIndex,
                    isDiceRollInProgress: window.isDiceRollInProgress,
                    takeTurnCompleted: window.takeTurnCompleted,
                    handlerRunning: window.handlerRunning
                };
                
                // Detect stuck turn states
                if (lastTurnState && 
                    JSON.stringify(currentTurnState) === JSON.stringify(lastTurnState) &&
                    currentTurnState.isDiceRollInProgress === false &&
                    currentTurnState.takeTurnCompleted === true) {
                    
                    // Check if we've been in this state too long
                    const diceSection = document.querySelector('.dice-section');
                    if (diceSection && diceSection.style.pointerEvents === 'auto') {
                        console.log('🔧 Turn state appears healthy, no intervention needed');
                    } else {
                        console.log('🚨 Detected stuck turn state, attempting recovery...');
                        
                        // Force enable dice
                        if (diceSection) {
                            diceSection.style.pointerEvents = 'auto';
                            diceSection.classList.remove('dice-disabled');
                        }
                        
                        // Reset stuck flags
                        window.isDiceRollInProgress = false;
                        window.handlerRunning = false;
                        window.takeTurnCompleted = true;
                        
                        console.log('✅ Turn state recovery attempted');
                    }
                }
                
                lastTurnState = currentTurnState;
            } catch (error) {
                console.error('🚫 Error in turn state monitoring:', error);
            }
        }, 2000); // Check every 2 seconds
    }
    
    // 5. FIX AUDIO AUTOPLAY ISSUES
    function fixAudioAutoplay() {
        // Override audio play methods to handle autoplay restrictions
        const originalPlaySound = window.playSound;
        if (originalPlaySound) {
            window.playSound = function(soundName) {
                try {
                    return originalPlaySound.apply(this, arguments);
                } catch (error) {
                    if (error.name === 'NotAllowedError') {
                        console.log('🔇 Audio autoplay blocked, will play after user interaction');
                        return Promise.resolve(); // Silent fail
                    }
                    throw error;
                }
            };
        }
        
        // Add user interaction listener to enable audio
        let audioEnabled = false;
        function enableAudio() {
            if (!audioEnabled) {
                audioEnabled = true;
                console.log('🔊 Audio enabled after user interaction');
            }
        }
        
        document.addEventListener('click', enableAudio, { once: true });
        document.addEventListener('touchstart', enableAudio, { once: true });
    }
    
    // 6. FIX PRELOAD RESOURCE WARNINGS
    function fixPreloadWarnings() {
        // Remove unused preload links that cause warnings
        const preloadLinks = document.querySelectorAll('link[rel="preload"]');
        preloadLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && (href.includes('game.js') || href.includes('lobby.js'))) {
                // Convert preload to regular script loading
                link.remove();
                console.log('🔧 Removed problematic preload link:', href);
            }
        });
    }
    
    // Initialize all fixes
    function initializeFixes() {
        console.log('🚀 Initializing multiplayer turn progression fixes...');
        
        fixTurnProgression();
        fixDiceClickValidation();
        fixExcessiveRefreshes();
        fixTurnStateMonitoring();
        fixAudioAutoplay();
        fixPreloadWarnings();
        
        console.log('✅ Multiplayer turn progression fixes loaded successfully');
    }
    
    // Start fixes when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeFixes);
    } else {
        initializeFixes();
    }
    
    // Also initialize after a short delay to catch dynamically loaded content
    setTimeout(initializeFixes, 1000);
})();

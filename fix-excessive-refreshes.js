// Fix for excessive screen refreshes and player jumping
// This script throttles updateGameFrame calls and stabilizes player positions

(function() {
    'use strict';
    
    console.log('🔧 Loading excessive refresh fix...');
    
    // Throttling variables
    let updateGameFrameThrottled = false;
    let pendingUpdate = false;
    let lastUpdateTime = 0;
    const UPDATE_THROTTLE_MS = 50; // Limit updates to 20fps max
    
    // Position stability tracking
    let lastPlayerPositions = new Map();
    let positionStabilityThreshold = 10; // pixels
    
    // Store original functions
    let originalUpdateGameFrame = null;
    let originalUpdateGameFromState = null;
    let originalRenderTokens = null;
    
    // Enhanced updateGameFrame with throttling
    function throttledUpdateGameFrame() {
        const now = Date.now();
        
        // If we're already throttled, just mark that an update is pending
        if (updateGameFrameThrottled) {
            pendingUpdate = true;
            return Promise.resolve();
        }
        
        // If not enough time has passed since last update, throttle
        if (now - lastUpdateTime < UPDATE_THROTTLE_MS) {
            pendingUpdate = true;
            
            // Schedule the update for later
            setTimeout(() => {
                if (pendingUpdate) {
                    throttledUpdateGameFrame();
                }
            }, UPDATE_THROTTLE_MS - (now - lastUpdateTime));
            
            return Promise.resolve();
        }
        
        // Perform the actual update
        updateGameFrameThrottled = true;
        pendingUpdate = false;
        lastUpdateTime = now;
        
        return originalUpdateGameFrame().then(() => {
            updateGameFrameThrottled = false;
            
            // If there's a pending update, schedule it
            if (pendingUpdate) {
                setTimeout(() => {
                    if (pendingUpdate) {
                        throttledUpdateGameFrame();
                    }
                }, UPDATE_THROTTLE_MS);
            }
        }).catch(error => {
            console.error('Error in throttled updateGameFrame:', error);
            updateGameFrameThrottled = false;
        });
    }
    
    // Enhanced updateGameFromState with position stability
    function stabilizedUpdateGameFromState(gameState) {
        if (!gameState || !originalUpdateGameFromState) {
            return;
        }
        
        console.log('🔧 Stabilized updateGameFromState called');
        
        // Check if player positions have actually changed significantly
        let significantChange = false;
        
        if (gameState.players && Array.isArray(gameState.players)) {
            gameState.players.forEach((player, index) => {
                if (!player || !player.name) return;
                
                const lastPos = lastPlayerPositions.get(player.name);
                const currentPos = { x: player.x, y: player.y, square: player.currentSquare };
                
                if (!lastPos || 
                    Math.abs(lastPos.x - currentPos.x) > positionStabilityThreshold ||
                    Math.abs(lastPos.y - currentPos.y) > positionStabilityThreshold ||
                    lastPos.square !== currentPos.square) {
                    
                    significantChange = true;
                    lastPlayerPositions.set(player.name, currentPos);
                    console.log(`📍 Significant position change for ${player.name}: ${lastPos?.square} -> ${currentPos.square}`);
                }
            });
        }
        
        // Only update if there's a significant change or it's been a while
        const timeSinceLastUpdate = Date.now() - lastUpdateTime;
        if (significantChange || timeSinceLastUpdate > 5000) {
            console.log('🔄 Applying game state update (significant change detected)');
            return originalUpdateGameFromState(gameState);
        } else {
            console.log('🚫 Skipping game state update (no significant changes)');
        }
    }
    
    // Enhanced renderTokens with position validation
    function validatedRenderTokens(playersToRender) {
        if (!originalRenderTokens || !playersToRender || !Array.isArray(playersToRender)) {
            return;
        }
        
        // Validate player positions before rendering
        const validatedPlayers = playersToRender.map(player => {
            if (!player || !player.name) return player;
            
            // Check for invalid positions (0,0 or undefined)
            if (!player.x || !player.y || (player.x === 0 && player.y === 0)) {
                console.warn(`🔧 Invalid position for ${player.name}, attempting to fix...`);
                
                // Try to get position from positionsMap
                if (window.positionsMap && player.currentSquare) {
                    const pos = window.positionsMap.get(player.currentSquare);
                    if (pos) {
                        return {
                            ...player,
                            x: pos.x,
                            y: pos.y
                        };
                    }
                }
                
                // If we can't fix it, use last known good position
                const lastPos = lastPlayerPositions.get(player.name);
                if (lastPos && lastPos.x && lastPos.y) {
                    console.log(`🔧 Using last known position for ${player.name}: (${lastPos.x}, ${lastPos.y})`);
                    return {
                        ...player,
                        x: lastPos.x,
                        y: lastPos.y
                    };
                }
            }
            
            return player;
        });
        
        return originalRenderTokens(validatedPlayers);
    }
    
    // Reduce animation timer frequencies
    function optimizeAnimationTimers() {
        // Override setInterval for updateGameFrame calls to use longer intervals
        const originalSetInterval = window.setInterval;
        
        window.setInterval = function(callback, delay, ...args) {
            // If the callback calls updateGameFrame and delay is very short, increase it
            if (typeof callback === 'function' && 
                (callback.toString().includes('updateGameFrame') || 
                 callback === window.updateGameFrame)) {
                
                if (delay < 200) {
                    console.log(`🔧 Optimizing animation timer: ${delay}ms -> 200ms`);
                    delay = 200; // Reduce from 100ms to 200ms
                }
            }
            
            return originalSetInterval.call(this, callback, delay, ...args);
        };
    }
    
    // Initialize the fix
    function initializeRefreshFix() {
        // Wait for game functions to be available
        const checkAndApply = () => {
            if (typeof window.updateGameFrame === 'function') {
                originalUpdateGameFrame = window.updateGameFrame;
                window.updateGameFrame = throttledUpdateGameFrame;
                console.log('✅ Applied updateGameFrame throttling');
            }
            
            if (typeof window.updateGameFromState === 'function') {
                originalUpdateGameFromState = window.updateGameFromState;
                window.updateGameFromState = stabilizedUpdateGameFromState;
                console.log('✅ Applied updateGameFromState stabilization');
            }
            
            if (typeof window.renderTokens === 'function') {
                originalRenderTokens = window.renderTokens;
                window.renderTokens = validatedRenderTokens;
                console.log('✅ Applied renderTokens validation');
            } else if (window.game_utils && typeof window.game_utils.renderTokens === 'function') {
                originalRenderTokens = window.game_utils.renderTokens;
                window.game_utils.renderTokens = validatedRenderTokens;
                console.log('✅ Applied renderTokens validation (game_utils)');
            }
            
            // Apply animation timer optimization
            optimizeAnimationTimers();
            console.log('✅ Applied animation timer optimization');
        };
        
        // Try immediately
        checkAndApply();
        
        // Also try after a short delay in case functions aren't loaded yet
        setTimeout(checkAndApply, 1000);
        setTimeout(checkAndApply, 3000);
    }
    
    // Start the fix
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeRefreshFix);
    } else {
        initializeRefreshFix();
    }
    
    console.log('🔧 Excessive refresh fix loaded');
})();

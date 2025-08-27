// Fix for Development Button Timing Issues
// This script extends the time development buttons stay visible for players

console.log('🏗️ Loading Development Button Timing Fix...');

// Store original functions for restoration if needed
const originalStartAutoActionTimer = window.startAutoActionTimer;

// Enhanced auto-action timer with longer development timeouts
function enhancedStartAutoActionTimer(actionType = 'roll') {
    // Extended delays for development decisions - players need more time to think
    let delay;
    
    if (actionType === 'develop') {
        // Much longer delays for development decisions
        delay = isMultiplayerGame ? 45000 : 30000; // 45s multiplayer, 30s single player
    } else if (actionType === 'purchase') {
        // Slightly longer for purchase decisions
        delay = isMultiplayerGame ? 25000 : 15000; // 25s multiplayer, 15s single player
    } else {
        // Standard delays for other actions (rolling dice)
        delay = isMultiplayerGame ? 20000 : 10000; // 20s multiplayer, 10s single player
    }
    
    console.log(`🏗️ [Enhanced] Starting ${delay/1000}-second timer for ${actionType} action (${isMultiplayerGame ? 'multiplayer' : 'single player'})`);
    clearAutoActionTimer(); // Clear any existing timer
    
    const currentPlayer = players[currentPlayerIndex];
    if (!currentPlayer || currentPlayer.isAI || currentPlayer.bankrupt) {
        console.log('[enhancedStartAutoActionTimer] No timer needed - player is AI, bankrupt, or not found');
        return;
    }

    // Show early warning for development decisions
    let warningTimeout;
    if (actionType === 'develop') {
        const warningTime = delay - 10000; // Show warning 10 seconds before timeout
        warningTimeout = setTimeout(() => {
            showAdvisory(`⏰ Development decision needed! Auto-declining in 10 seconds...`, 'warning');
        }, warningTime);
    }

    autoActionTimeout = setTimeout(async () => {
        console.log(`🏗️ [Enhanced] ${delay/1000}-second timer expired for ${actionType} action. Auto-executing...`);
        
        // Clear warning timeout if it exists
        if (warningTimeout) {
            clearTimeout(warningTimeout);
        }
        
        if (isMultiplayerGame) {
            // In multiplayer, show warning and auto-execute after another brief delay
            const warningMessage = actionType === 'develop' 
                ? `⏰ ${currentPlayer.name} didn't make a development decision in time! Auto-declining in 5 seconds...`
                : `⏰ ${currentPlayer.name} didn't respond in time! Auto-executing in 3 seconds...`;
            
            showAdvisory(warningMessage, 'warning');
            
            const finalDelay = actionType === 'develop' ? 5000 : 3000; // Longer final delay for development
            
            setTimeout(async () => {
                switch(actionType) {
                    case 'roll':
                        console.log('[enhancedStartAutoActionTimer] Multiplayer auto-rolling dice for unresponsive player...');
                        if (isMultiplayerGame) {
                            await executeMultiplayerAutoTurn();
                        } else {
                            await takeTurn();
                        }
                        break;
                    case 'purchase':
                        console.log('[enhancedStartAutoActionTimer] Multiplayer auto-declining purchase...');
                        await handleAutoDeclinePurchase();
                        break;
                    case 'develop':
                        console.log('[enhancedStartAutoActionTimer] Multiplayer auto-declining development...');
                        showAdvisory(`${currentPlayer.name} took too long - development declined automatically`, 'info');
                        await handleAutoDeclineDevelopment();
                        break;
                    case 'decline':
                        console.log('[enhancedStartAutoActionTimer] Multiplayer auto-declining...');
                        await handleAutoDecline();
                        break;
                }
            }, finalDelay);
        } else {
            // Single player - immediate auto-action with custom message for development
            switch(actionType) {
                case 'roll':
                    console.log('[enhancedStartAutoActionTimer] Auto-rolling dice...');
                    await takeTurn();
                    break;
                case 'purchase':
                    console.log('[enhancedStartAutoActionTimer] Auto-declining purchase...');
                    await handleAutoDeclinePurchase();
                    break;
                case 'develop':
                    console.log('[enhancedStartAutoActionTimer] Auto-declining development...');
                    showAdvisory('Development decision timed out - automatically declined', 'info');
                    await handleAutoDeclineDevelopment();
                    break;
                case 'decline':
                    console.log('[enhancedStartAutoActionTimer] Auto-declining...');
                    await handleAutoDecline();
                    break;
            }
        }
    }, delay);
}

// Enhanced clear function that also clears warning timeouts
const originalClearAutoActionTimer = window.clearAutoActionTimer;
function enhancedClearAutoActionTimer() {
    if (autoActionTimeout) {
        clearTimeout(autoActionTimeout);
        autoActionTimeout = null;
        console.log('🏗️ [Enhanced] Auto-action timer cleared');
    }
    
    // Clear any warning timeouts that might be pending
    if (typeof warningTimeout !== 'undefined' && warningTimeout) {
        clearTimeout(warningTimeout);
        warningTimeout = null;
    }
}

// Function to disable auto-decline for development (for testing)
function disableDevelopmentAutoDecline() {
    console.log('🏗️ Disabling automatic development decline');
    
    // Override the auto-action timer to skip development actions
    window.startAutoActionTimer = function(actionType = 'roll') {
        if (actionType === 'develop') {
            console.log('🏗️ Development auto-decline disabled - no timer started');
            return;
        }
        return enhancedStartAutoActionTimer(actionType);
    };
    
    showAdvisory('🏗️ Development auto-decline disabled - buttons will stay visible indefinitely', 'info');
}

// Function to enable extended development timing
function enableExtendedDevelopmentTiming() {
    console.log('🏗️ Enabling extended development button timing');
    
    // Replace the auto-action timer function
    window.startAutoActionTimer = enhancedStartAutoActionTimer;
    window.clearAutoActionTimer = enhancedClearAutoActionTimer;
    
    showAdvisory('🏗️ Development buttons will now stay visible longer!', 'info');
}

// Function to restore original timing
function restoreOriginalTiming() {
    console.log('🏗️ Restoring original development button timing');
    
    window.startAutoActionTimer = originalStartAutoActionTimer;
    window.clearAutoActionTimer = originalClearAutoActionTimer;
    
    showAdvisory('🏗️ Original development button timing restored', 'info');
}

// Auto-apply the fix
function applyDevelopmentTimingFix() {
    console.log('🏗️ Applying development button timing fix...');
    enableExtendedDevelopmentTiming();
}

// Apply the fix immediately if game is loaded
if (typeof players !== 'undefined' && typeof startAutoActionTimer !== 'undefined') {
    console.log('🏗️ Game detected, applying development timing fix...');
    applyDevelopmentTimingFix();
} else {
    console.log('🏗️ Fix loaded, will apply when game starts');
}

// Expose functions for manual control
window.applyDevelopmentTimingFix = applyDevelopmentTimingFix;
window.enableExtendedDevelopmentTiming = enableExtendedDevelopmentTiming;
window.disableDevelopmentAutoDecline = disableDevelopmentAutoDecline;
window.restoreOriginalDevelopmentTiming = restoreOriginalTiming;

// Monitor for game initialization
const originalUpdateInfoPanel = window.updateInfoPanel;
if (originalUpdateInfoPanel) {
    window.updateInfoPanel = function(...args) {
        // Apply fix when info panel is updated (ensures it's active during gameplay)
        if (typeof startAutoActionTimer !== 'undefined' && startAutoActionTimer !== enhancedStartAutoActionTimer) {
            console.log('🏗️ Info panel updated, ensuring development timing fix is active...');
            enableExtendedDevelopmentTiming();
        }
        return originalUpdateInfoPanel.apply(this, args);
    };
}

console.log('🏗️ Development Button Timing Fix loaded successfully!');
console.log('📋 Available commands:');
console.log('  - applyDevelopmentTimingFix() - Apply extended timing');
console.log('  - disableDevelopmentAutoDecline() - Disable auto-decline completely');
console.log('  - restoreOriginalDevelopmentTiming() - Restore original timing');
console.log('⏰ New timing: 30s single player, 45s multiplayer (was 8s/15s)');

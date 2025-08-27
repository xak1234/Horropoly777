// Fix for Dice Timing in Multiplayer - Reduce Auto-Action Timer Delay
// This script reduces the 20-second auto-action timer for dice rolls to make the game more responsive

console.log('🎲 Loading Dice Timing Fix for Multiplayer...');

// Store original function for restoration if needed
const originalStartAutoActionTimer = window.startAutoActionTimer;

// Enhanced auto-action timer with reduced dice roll delays
function enhancedStartAutoActionTimer(actionType = 'roll') {
    // Reduced delays for better game flow
    let delay;
    
    if (actionType === 'develop') {
        // Keep longer delays for development decisions - players need time to think
        delay = isMultiplayerGame ? 60000 : 30000; // 60s multiplayer, 30s single player
    } else if (actionType === 'purchase') {
        // Moderate delays for purchase decisions
        delay = isMultiplayerGame ? 15000 : 8000; // 15s multiplayer, 8s single player
    } else {
        // REDUCED delays for dice rolling - much more responsive
        delay = isMultiplayerGame ? 8000 : 5000; // 8s multiplayer (was 20s), 5s single player (was 10s)
    }
    
    // CRITICAL FIX: Don't restart timer if same type is already running
    // This prevents multiplayer Firebase syncs from constantly resetting the timer
    if (autoActionTimeout && currentTimerType === actionType && timerStartTime) {
        const elapsed = Date.now() - timerStartTime;
        const remaining = delay - elapsed;
        
        if (remaining > 1000) { // If more than 1 second remaining, don't restart
            console.log(`🎲 [Enhanced] Timer for ${actionType} already running with ${Math.round(remaining/1000)}s remaining - not restarting`);
            return;
        }
    }
    
    console.log(`🎲 [Enhanced] Starting ${delay/1000}-second timer for ${actionType} action (${isMultiplayerGame ? 'multiplayer' : 'single player'})`);
    clearAutoActionTimer(); // Clear any existing timer
    
    // Track the new timer
    currentTimerType = actionType;
    timerStartTime = Date.now();
    
    const currentPlayer = players[currentPlayerIndex];
    if (!currentPlayer || currentPlayer.isAI || currentPlayer.bankrupt) {
        console.log('🎲 [Enhanced] No timer needed - player is AI, bankrupt, or not found');
        return;
    }

    // Add early warning for development actions (15 seconds before timeout)
    if (actionType === 'develop' && delay > 15000) {
        const earlyWarningTime = delay - 15000;
        setTimeout(() => {
            if (isMultiplayerGame) {
                showAdvisory(`⏰ Development decision needed! Auto-declining in 15 seconds...`, 'warning');
            }
        }, earlyWarningTime);
    }

    autoActionTimeout = setTimeout(async () => {
        console.log(`🎲 [Enhanced] ${delay/1000}-second timer expired for ${actionType} action. Auto-executing...`);
        
        if (isMultiplayerGame) {
            // In multiplayer, show warning and auto-execute after another brief delay
            const finalWarningMessage = actionType === 'develop' ? 
                `⏰ ${currentPlayer.name} didn't make a development decision in time! Auto-declining in 3 seconds...` :
                actionType === 'roll' ?
                `⏰ ${currentPlayer.name} is taking too long! Auto-rolling dice in 2 seconds...` :
                `⏰ ${currentPlayer.name} didn't respond in time! Auto-executing in 3 seconds...`;
            showAdvisory(finalWarningMessage, 'warning');
            
            // Shorter delay for dice rolls to make game more responsive
            const finalDelay = actionType === 'roll' ? 2000 : 3000;
            
            setTimeout(async () => {
                switch(actionType) {
                    case 'roll':
                        console.log('🎲 [Enhanced] Multiplayer auto-rolling dice for unresponsive player...');
                        if (isMultiplayerGame) {
                            // Force the turn for multiplayer
                            await executeMultiplayerAutoTurn();
                        } else {
                            await takeTurn();
                        }
                        break;
                    case 'purchase':
                        console.log('🎲 [Enhanced] Multiplayer auto-declining purchase...');
                        await handleAutoDeclinePurchase();
                        break;
                    case 'develop':
                        console.log('🎲 [Enhanced] Multiplayer auto-declining development...');
                        await handleAutoDeclineDevelopment();
                        break;
                    case 'decline':
                        console.log('🎲 [Enhanced] Multiplayer auto-declining...');
                        await handleAutoDecline();
                        break;
                }
            }, finalDelay);
        } else {
            // Single player - immediate auto-action
            switch(actionType) {
                case 'roll':
                    console.log('🎲 [Enhanced] Auto-rolling dice...');
                    await takeTurn();
                    break;
                case 'purchase':
                    console.log('🎲 [Enhanced] Auto-declining purchase...');
                    await handleAutoDeclinePurchase();
                    break;
                case 'develop':
                    console.log('🎲 [Enhanced] Auto-declining development...');
                    await handleAutoDeclineDevelopment();
                    break;
                case 'decline':
                    console.log('🎲 [Enhanced] Auto-declining...');
                    await handleAutoDecline();
                    break;
            }
        }
    }, delay);
}

// Replace the original function
window.startAutoActionTimer = enhancedStartAutoActionTimer;

// Provide restoration function
window.restoreOriginalDiceTimer = function() {
    if (originalStartAutoActionTimer) {
        window.startAutoActionTimer = originalStartAutoActionTimer;
        console.log('🎲 Original dice timer restored');
    }
};

console.log('🎲 Enhanced Dice Timing Fix loaded successfully!');
console.log('🎲 New timings:');
console.log('   - Dice rolls: 8s multiplayer (was 20s), 5s single player (was 10s)');
console.log('   - Purchases: 15s multiplayer, 8s single player');
console.log('   - Development: 60s multiplayer, 30s single player');
console.log('🎲 Use restoreOriginalDiceTimer() to revert if needed');

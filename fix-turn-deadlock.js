/**
 * 🔓 Turn Deadlock Fix
 * 
 * Fixes the issue where the game gets stuck at "next turn" with:
 * - Turn in progress flag stuck as true
 * - Dice clicks being ignored
 * - Auto-action timer expiring without completing turn
 * - Audio autoplay errors blocking game flow
 */

console.log('🔓 Loading turn deadlock fix...');

// Turn state monitoring and recovery
let turnDeadlockMonitor = {
    lastTurnTime: 0,
    turnTimeoutId: null,
    maxTurnDuration: 30000, // 30 seconds max per turn
    recoveryAttempts: 0,
    maxRecoveryAttempts: 3
};

/**
 * Monitor for turn deadlocks and auto-recover
 */
function monitorTurnDeadlock() {
    // Check if turn has been in progress too long
    if (window.turnInProgress && Date.now() - turnDeadlockMonitor.lastTurnTime > turnDeadlockMonitor.maxTurnDuration) {
        console.warn('🔓 Turn deadlock detected - attempting recovery...');
        recoverFromTurnDeadlock();
    }
}

/**
 * Recover from turn deadlock
 */
function recoverFromTurnDeadlock() {
    if (turnDeadlockMonitor.recoveryAttempts >= turnDeadlockMonitor.maxRecoveryAttempts) {
        console.error('🔓 Max recovery attempts reached - manual intervention required');
        return;
    }
    
    turnDeadlockMonitor.recoveryAttempts++;
    console.log(`🔓 Turn deadlock recovery attempt ${turnDeadlockMonitor.recoveryAttempts}...`);
    
    try {
        // Reset turn flags
        if (window.turnInProgress !== undefined) {
            window.turnInProgress = false;
            console.log('🔓 Reset turnInProgress flag');
        }
        
        if (window.isDiceRollInProgress !== undefined) {
            window.isDiceRollInProgress = false;
            console.log('🔓 Reset isDiceRollInProgress flag');
        }
        
        if (window.isDiceClickHandlerRunning !== undefined) {
            window.isDiceClickHandlerRunning = false;
            console.log('🔓 Reset isDiceClickHandlerRunning flag');
        }
        
        // Clear any pending timers
        if (window.clearAutoActionTimer && typeof window.clearAutoActionTimer === 'function') {
            window.clearAutoActionTimer();
            console.log('🔓 Cleared auto-action timer');
        }
        
        // Re-enable dice section
        const diceSection = document.getElementById('dice-section');
        if (diceSection) {
            diceSection.style.pointerEvents = 'auto';
            diceSection.classList.remove('dice-processing');
            diceSection.style.opacity = '';
            console.log('🔓 Re-enabled dice section');
        }
        
        // Force dice section update
        if (window.enableDiceSection && typeof window.enableDiceSection === 'function') {
            window.enableDiceSection();
            console.log('🔓 Forced dice section update');
        }
        
        // Update game frame to refresh UI
        if (window.updateGameFrame && typeof window.updateGameFrame === 'function') {
            window.updateGameFrame();
            console.log('🔓 Refreshed game frame');
        }
        
        console.log('✅ Turn deadlock recovery completed');
        
        // Reset recovery counter on successful recovery
        setTimeout(() => {
            turnDeadlockMonitor.recoveryAttempts = 0;
        }, 5000);
        
    } catch (error) {
        console.error('🔓 Turn deadlock recovery failed:', error);
    }
}

/**
 * Fix audio autoplay issues that can block game flow
 */
function fixAudioAutoplayIssues() {
    // Suppress audio autoplay errors
    window.addEventListener('unhandledrejection', function(event) {
        if (event.reason && event.reason.message) {
            const message = event.reason.message;
            if (message.includes('autoplay') || 
                message.includes('NotAllowedError') ||
                message.includes('play() request was interrupted')) {
                
                console.warn('🔊 Audio autoplay error suppressed:', message);
                event.preventDefault();
                return;
            }
        }
    });
    
    // Override audio play methods to handle autoplay gracefully
    const originalPlay = HTMLAudioElement.prototype.play;
    HTMLAudioElement.prototype.play = function() {
        const playPromise = originalPlay.call(this);
        if (playPromise && playPromise.catch) {
            playPromise.catch(error => {
                if (error.name === 'NotAllowedError' || error.message.includes('autoplay')) {
                    console.warn('🔊 Audio autoplay blocked (expected):', error.message);
                } else {
                    console.error('🔊 Audio play error:', error);
                }
            });
        }
        return playPromise;
    };
    
    console.log('✅ Audio autoplay error handling active');
}

/**
 * Enhanced dice click handler to prevent deadlocks
 */
function enhanceDiceClickHandling() {
    // Monitor dice clicks for deadlock patterns
    let lastDiceClickTime = 0;
    let consecutiveIgnoredClicks = 0;
    
    // Override console.log to catch ignored dice clicks
    const originalConsoleLog = console.log;
    console.log = function(...args) {
        const message = args.join(' ');
        
        // Detect ignored dice clicks
        if (message.includes('Dice click ignored - turn already in progress')) {
            consecutiveIgnoredClicks++;
            
            // If too many consecutive ignored clicks, trigger recovery
            if (consecutiveIgnoredClicks >= 3) {
                console.warn('🔓 Multiple ignored dice clicks detected - triggering recovery');
                recoverFromTurnDeadlock();
                consecutiveIgnoredClicks = 0;
            }
        } else if (message.includes('DICE CLICKED')) {
            // Reset counter on successful dice click
            consecutiveIgnoredClicks = 0;
        }
        
        return originalConsoleLog.apply(this, args);
    };
    
    console.log('✅ Enhanced dice click monitoring active');
}

/**
 * Monitor turn timing
 */
function monitorTurnTiming() {
    // Track when turns start
    if (window.takeTurn) {
        const originalTakeTurn = window.takeTurn;
        
        window.takeTurn = async function(...args) {
            turnDeadlockMonitor.lastTurnTime = Date.now();
            console.log('🔓 Turn started at:', new Date(turnDeadlockMonitor.lastTurnTime).toLocaleTimeString());
            
            try {
                const result = await originalTakeTurn.apply(this, args);
                console.log('🔓 Turn completed successfully');
                return result;
            } catch (error) {
                console.error('🔓 Turn failed:', error);
                // Trigger recovery on turn failure
                setTimeout(() => recoverFromTurnDeadlock(), 1000);
                throw error;
            }
        };
    }
    
    // Track when turns end
    if (window.nextTurn) {
        const originalNextTurn = window.nextTurn;
        
        window.nextTurn = function(...args) {
            console.log('🔓 Next turn called');
            turnDeadlockMonitor.lastTurnTime = Date.now();
            
            try {
                return originalNextTurn.apply(this, args);
            } catch (error) {
                console.error('🔓 Next turn failed:', error);
                // Trigger recovery on next turn failure
                setTimeout(() => recoverFromTurnDeadlock(), 1000);
                throw error;
            }
        };
    }
    
    console.log('✅ Turn timing monitoring active');
}

/**
 * Add manual recovery button for emergencies
 */
function addManualRecoveryButton() {
    // Only add if not already present
    if (document.getElementById('turn-recovery-button')) {
        return;
    }
    
    const button = document.createElement('button');
    button.id = 'turn-recovery-button';
    button.textContent = '🔓 Fix Turn';
    button.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        z-index: 10000;
        background: #ff4444;
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        display: none;
    `;
    
    button.onclick = function() {
        console.log('🔓 Manual turn recovery triggered');
        recoverFromTurnDeadlock();
        button.style.display = 'none';
    };
    
    document.body.appendChild(button);
    
    // Show button when deadlock is detected
    setInterval(() => {
        if (window.turnInProgress && Date.now() - turnDeadlockMonitor.lastTurnTime > 15000) {
            button.style.display = 'block';
        } else {
            button.style.display = 'none';
        }
    }, 2000);
    
    console.log('✅ Manual recovery button added');
}

/**
 * Initialize turn deadlock fix
 */
function initializeTurnDeadlockFix() {
    console.log('🔓 Initializing turn deadlock fix...');
    
    try {
        fixAudioAutoplayIssues();
        enhanceDiceClickHandling();
        monitorTurnTiming();
        addManualRecoveryButton();
        
        // Start monitoring for deadlocks
        setInterval(monitorTurnDeadlock, 5000); // Check every 5 seconds
        
        console.log('✅ Turn deadlock fix initialized successfully');
        
        // Set flag to indicate fix is active
        window.turnDeadlockFixActive = true;
        
    } catch (error) {
        console.error('❌ Error initializing turn deadlock fix:', error);
    }
}

// Apply fix when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTurnDeadlockFix);
} else {
    initializeTurnDeadlockFix();
}

// Export for manual use
window.turnDeadlockFix = {
    recoverFromTurnDeadlock,
    monitorTurnDeadlock,
    initialize: initializeTurnDeadlockFix
};

console.log('🔓 Turn deadlock fix loaded');

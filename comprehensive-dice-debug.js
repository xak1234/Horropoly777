// Comprehensive Dice Click and Turn Debugging System
// This module adds extensive logging to track every aspect of dice clicking and turn management

(function() {
    'use strict';
    
    console.log('🔍 Loading Comprehensive Dice Debug System...');
    
    // Debug state tracking
    let debugState = {
        diceClickCount: 0,
        turnCount: 0,
        lastDiceClick: 0,
        lastTurnStart: 0,
        turnHistory: [],
        diceClickHistory: [],
        flagHistory: [],
        maxHistorySize: 50
    };
    
    // Add debug styles
    const debugStyles = document.createElement('style');
    debugStyles.textContent = `
        #dice-debug-overlay {
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 12px;
            z-index: 10000;
            max-width: 300px;
            max-height: 400px;
            overflow-y: auto;
        }
        .debug-section { margin: 5px 0; }
        .debug-flag { color: #ffff00; }
        .debug-error { color: #ff4444; }
        .debug-success { color: #44ff44; }
        .debug-warning { color: #ff8844; }
    `;
    document.head.appendChild(debugStyles);
    
    // Create debug overlay
    const debugOverlay = document.createElement('div');
    debugOverlay.id = 'dice-debug-overlay';
    debugOverlay.innerHTML = `
        <div class="debug-section">
            <strong>🎲 DICE DEBUG</strong>
            <button onclick="toggleDiceDebug()" style="float: right; font-size: 10px;">Hide</button>
        </div>
        <div id="debug-content"></div>
    `;
    document.body.appendChild(debugOverlay);
    
    // Global toggle function
    window.toggleDiceDebug = function() {
        const overlay = document.getElementById('dice-debug-overlay');
        overlay.style.display = overlay.style.display === 'none' ? 'block' : 'none';
    };
    
    // Enhanced logging function
    function debugLog(category, message, data = {}) {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = {
            timestamp,
            category,
            message,
            data: JSON.parse(JSON.stringify(data)) // Deep clone
        };
        
        // Add to history
        debugState.diceClickHistory.push(logEntry);
        if (debugState.diceClickHistory.length > debugState.maxHistorySize) {
            debugState.diceClickHistory.shift();
        }
        
        // Console log with enhanced formatting
        console.log(`🔍 [${category}] ${message}`, data);
        
        // Update overlay
        updateDebugOverlay();
    }
    
    // Update debug overlay
    function updateDebugOverlay() {
        const content = document.getElementById('debug-content');
        if (!content) return;
        
        const now = Date.now();
        const recentHistory = debugState.diceClickHistory.slice(-10);
        
        content.innerHTML = `
            <div class="debug-section">
                <div>Dice Clicks: <span class="debug-flag">${debugState.diceClickCount}</span></div>
                <div>Turn Count: <span class="debug-flag">${debugState.turnCount}</span></div>
                <div>Last Click: ${debugState.lastDiceClick ? Math.round((now - debugState.lastDiceClick) / 1000) + 's ago' : 'Never'}</div>
            </div>
            <div class="debug-section">
                <strong>Current Flags:</strong>
                <div>isDiceRollInProgress: <span class="${typeof isDiceRollInProgress !== 'undefined' && isDiceRollInProgress ? 'debug-error' : 'debug-success'}">${typeof isDiceRollInProgress !== 'undefined' ? isDiceRollInProgress : 'undefined'}</span></div>
                <div>isDiceClickHandlerRunning: <span class="${typeof isDiceClickHandlerRunning !== 'undefined' && isDiceClickHandlerRunning ? 'debug-error' : 'debug-success'}">${typeof isDiceClickHandlerRunning !== 'undefined' ? isDiceClickHandlerRunning : 'undefined'}</span></div>
                <div>isPlayerTurnInProgress: <span class="${typeof isPlayerTurnInProgress !== 'undefined' && isPlayerTurnInProgress ? 'debug-warning' : 'debug-success'}">${typeof isPlayerTurnInProgress !== 'undefined' ? isPlayerTurnInProgress : 'undefined'}</span></div>
                <div>lastRollWasDoubles: <span class="debug-flag">${typeof lastRollWasDoubles !== 'undefined' ? lastRollWasDoubles : 'undefined'}</span></div>
            </div>
            <div class="debug-section">
                <strong>Recent Events:</strong>
                ${recentHistory.map(entry => `
                    <div style="font-size: 10px; margin: 2px 0;">
                        <span class="debug-flag">${entry.timestamp}</span> [${entry.category}] ${entry.message}
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // Track dice section state changes
    function trackDiceSectionState() {
        const diceSection = document.getElementById('dice-section');
        if (!diceSection) return null;
        
        return {
            exists: true,
            classes: Array.from(diceSection.classList),
            pointerEvents: diceSection.style.pointerEvents,
            parentId: diceSection.parentElement?.id,
            hasClickHandler: !!diceSection.onclick,
            eventListeners: getEventListeners ? getEventListeners(diceSection) : 'N/A'
        };
    }
    
    // Intercept and debug enableDiceSection calls
    const originalEnableDiceSection = window.enableDiceSection;
    if (originalEnableDiceSection) {
        window.enableDiceSection = function(...args) {
            const callStack = new Error().stack;
            const diceState = trackDiceSectionState();
            
            debugLog('ENABLE_DICE', 'enableDiceSection() called', {
                args,
                diceState,
                callStack: callStack.split('\n').slice(1, 4).join('\n')
            });
            
            const result = originalEnableDiceSection.apply(this, args);
            
            // Track state after enabling
            const diceStateAfter = trackDiceSectionState();
            debugLog('ENABLE_DICE_AFTER', 'enableDiceSection() completed', {
                diceStateAfter
            });
            
            return result;
        };
    }
    
    // Intercept and debug handleDiceClick calls
    const originalHandleDiceClick = window.handleDiceClick;
    if (originalHandleDiceClick) {
        window.handleDiceClick = function(...args) {
            debugState.diceClickCount++;
            debugState.lastDiceClick = Date.now();
            
            const currentPlayer = typeof players !== 'undefined' && Array.isArray(players) ? players[currentPlayerIndex] : null;
            const diceState = trackDiceSectionState();
            
            debugLog('DICE_CLICK', `handleDiceClick() called (Click #${debugState.diceClickCount})`, {
                source: args[0] || 'unknown',
                currentPlayerIndex: typeof currentPlayerIndex !== 'undefined' ? currentPlayerIndex : 'undefined',
                currentPlayer: currentPlayer ? { name: currentPlayer.name, square: currentPlayer.currentSquare } : null,
                flags: {
                    isDiceRollInProgress: typeof isDiceRollInProgress !== 'undefined' ? isDiceRollInProgress : 'undefined',
                    isDiceClickHandlerRunning: typeof isDiceClickHandlerRunning !== 'undefined' ? isDiceClickHandlerRunning : 'undefined',
                    isPlayerTurnInProgress: typeof isPlayerTurnInProgress !== 'undefined' ? isPlayerTurnInProgress : 'undefined'
                },
                diceState
            });
            
            return originalHandleDiceClick.apply(this, args);
        };
    }
    
    // Intercept and debug takeTurn calls
    const originalTakeTurn = window.takeTurn;
    if (originalTakeTurn) {
        window.takeTurn = function(...args) {
            debugState.turnCount++;
            debugState.lastTurnStart = Date.now();
            
            const currentPlayer = typeof players !== 'undefined' && Array.isArray(players) ? players[currentPlayerIndex] : null;
            
            debugLog('TAKE_TURN', `takeTurn() called (Turn #${debugState.turnCount})`, {
                args,
                currentPlayerIndex: typeof currentPlayerIndex !== 'undefined' ? currentPlayerIndex : 'undefined',
                currentPlayer: currentPlayer ? { name: currentPlayer.name, square: currentPlayer.currentSquare, money: currentPlayer.money } : null,
                lastRollWasDoubles: typeof lastRollWasDoubles !== 'undefined' ? lastRollWasDoubles : 'undefined',
                consecutiveDoublesCount: typeof consecutiveDoublesCount !== 'undefined' ? consecutiveDoublesCount : 'undefined'
            });
            
            return originalTakeTurn.apply(this, args);
        };
    }
    
    // Intercept and debug nextTurn calls
    const originalNextTurn = window.nextTurn;
    if (originalNextTurn) {
        window.nextTurn = function(...args) {
            const currentPlayer = typeof players !== 'undefined' && Array.isArray(players) ? players[currentPlayerIndex] : null;
            
            debugLog('NEXT_TURN', 'nextTurn() called', {
                args,
                currentPlayerIndex: typeof currentPlayerIndex !== 'undefined' ? currentPlayerIndex : 'undefined',
                currentPlayer: currentPlayer ? { name: currentPlayer.name } : null,
                lastRollWasDoubles: typeof lastRollWasDoubles !== 'undefined' ? lastRollWasDoubles : 'undefined'
            });
            
            return originalNextTurn.apply(this, args);
        };
    }
    
    // Monitor dice section clicks directly
    function monitorDiceClicks() {
        const diceSection = document.getElementById('dice-section');
        if (diceSection && !diceSection.hasAttribute('data-debug-monitored')) {
            diceSection.setAttribute('data-debug-monitored', 'true');
            
            // Add event listener with highest priority
            diceSection.addEventListener('click', function(e) {
                debugLog('DICE_DOM_CLICK', 'Raw dice section click detected', {
                    target: e.target.tagName + (e.target.id ? '#' + e.target.id : ''),
                    timestamp: Date.now(),
                    pointerEvents: this.style.pointerEvents,
                    classes: Array.from(this.classList)
                });
            }, { capture: true });
            
            debugLog('MONITOR', 'Added dice click monitoring');
        }
    }
    
    // Check for multiple rapid clicks
    let clickTimes = [];
    function checkRapidClicks() {
        const now = Date.now();
        clickTimes.push(now);
        
        // Keep only clicks from last 5 seconds
        clickTimes = clickTimes.filter(time => now - time < 5000);
        
        if (clickTimes.length > 3) {
            debugLog('RAPID_CLICKS', `WARNING: ${clickTimes.length} clicks in 5 seconds`, {
                clickTimes: clickTimes.map(time => new Date(time).toLocaleTimeString())
            });
        }
    }
    
    // Periodic state monitoring
    function monitorGameState() {
        const currentPlayer = typeof players !== 'undefined' && Array.isArray(players) ? players[currentPlayerIndex] : null;
        const diceState = trackDiceSectionState();
        
        debugLog('STATE_CHECK', 'Periodic state check', {
            currentPlayer: currentPlayer ? { name: currentPlayer.name, square: currentPlayer.currentSquare } : null,
            diceState,
            flags: {
                isDiceRollInProgress: typeof isDiceRollInProgress !== 'undefined' ? isDiceRollInProgress : 'undefined',
                isDiceClickHandlerRunning: typeof isDiceClickHandlerRunning !== 'undefined' ? isDiceClickHandlerRunning : 'undefined',
                isPlayerTurnInProgress: typeof isPlayerTurnInProgress !== 'undefined' ? isPlayerTurnInProgress : 'undefined',
                lastRollWasDoubles: typeof lastRollWasDoubles !== 'undefined' ? lastRollWasDoubles : 'undefined'
            }
        });
    }
    
    // Initialize monitoring
    function initializeDebugSystem() {
        debugLog('INIT', 'Comprehensive dice debug system initialized');
        
        // Set up periodic monitoring
        setInterval(monitorDiceClicks, 1000);
        setInterval(monitorGameState, 5000);
        setInterval(updateDebugOverlay, 1000);
        
        // Monitor for dice section creation
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1 && (node.id === 'dice-section' || node.querySelector('#dice-section'))) {
                        debugLog('DOM_CHANGE', 'Dice section added to DOM');
                        monitorDiceClicks();
                    }
                });
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
        
        // Initial setup
        monitorDiceClicks();
    }
    
    // Global debug functions
    window.debugDiceSystem = {
        getState: () => debugState,
        getHistory: () => debugState.diceClickHistory,
        clearHistory: () => {
            debugState.diceClickHistory = [];
            debugState.diceClickCount = 0;
            debugState.turnCount = 0;
            updateDebugOverlay();
        },
        forceStateCheck: monitorGameState,
        checkDiceSection: trackDiceSectionState
    };
    
    // Start the debug system
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeDebugSystem);
    } else {
        initializeDebugSystem();
    }
    
    console.log('🔍 Comprehensive Dice Debug System Loaded');
    
})();

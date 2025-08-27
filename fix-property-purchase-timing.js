// Fix for Property Purchase Button Timing Issues
// This script fixes the issue where purchase buttons disappear too quickly

console.log('🏠 Loading Property Purchase Timing Fix...');

// Store original functions
const originalStartAutoActionTimer = window.startAutoActionTimer;
const originalUpdateInfoPanel = window.updateInfoPanel;
const originalClearAutoActionTimer = window.clearAutoActionTimer;

// Enhanced property purchase timing
let purchaseDecisionActive = false;
let purchaseDecisionStartTime = 0;
let purchaseDecisionProperty = null;

// Enhanced auto-action timer with proper purchase timing
function enhancedStartAutoActionTimer(actionType = 'roll') {
    console.log(`🏠 Enhanced startAutoActionTimer called for ${actionType}`);
    
    // Clear any existing timer first
    if (window.autoActionTimer) {
        clearTimeout(window.autoActionTimer);
        window.autoActionTimer = null;
        console.log('🏠 Cleared existing timer');
    }
    
    // Set appropriate delays
    let delay;
    
    if (actionType === 'develop') {
        delay = window.isMultiplayerGame ? 45000 : 25000; // 45s multiplayer, 25s single
    } else if (actionType === 'purchase') {
        delay = window.isMultiplayerGame ? 25000 : 15000; // 25s multiplayer, 15s single (increased!)
        purchaseDecisionActive = true;
        purchaseDecisionStartTime = Date.now();
        console.log(`🏠 Purchase decision started - ${delay/1000}s timer`);
    } else { // roll
        delay = window.isMultiplayerGame ? 8000 : 5000; // 8s multiplayer, 5s single
    }

    console.log(`🏠 Setting ${delay/1000}s timer for ${actionType} action`);

    // Set new timer
    window.autoActionTimer = setTimeout(() => {
        console.log(`🏠 Auto-action timer expired for ${actionType}. Auto-executing...`);
        
        if (actionType === 'roll') {
            if (window.executeMultiplayerAutoTurn) {
                window.executeMultiplayerAutoTurn();
            } else if (window.rollDice) {
                window.rollDice();
            }
        } else if (actionType === 'purchase') {
            console.log('🏠 Auto-declining property purchase due to timeout');
            purchaseDecisionActive = false;
            if (window.declineProperty) {
                window.declineProperty();
            }
        } else if (actionType === 'develop') {
            if (window.skipDevelopment) {
                window.skipDevelopment();
            }
        }
    }, delay);

    return delay;
}

// Enhanced clear timer function
function enhancedClearAutoActionTimer() {
    console.log('🏠 Enhanced clearAutoActionTimer called');
    
    if (window.autoActionTimer) {
        clearTimeout(window.autoActionTimer);
        window.autoActionTimer = null;
        console.log('🏠 Timer cleared successfully');
    }
    
    // Don't clear purchase decision immediately - let it persist
    if (purchaseDecisionActive) {
        const timeElapsed = Date.now() - purchaseDecisionStartTime;
        if (timeElapsed < 5000) { // Keep purchase UI for at least 5 seconds
            console.log(`🏠 Keeping purchase decision active (${timeElapsed}ms elapsed)`);
            return;
        }
    }
    
    // Call original if it exists
    if (originalClearAutoActionTimer) {
        originalClearAutoActionTimer.call(this);
    }
}

// Enhanced updateInfoPanel to prevent premature clearing
function enhancedUpdateInfoPanel(playerName) {
    console.log(`🏠 Enhanced updateInfoPanel called for ${playerName}`);
    
    // Check if we're in a purchase decision
    if (purchaseDecisionActive && purchaseDecisionStartTime) {
        const timeElapsed = Date.now() - purchaseDecisionStartTime;
        const minDisplayTime = 8000; // Minimum 8 seconds display time
        
        if (timeElapsed < minDisplayTime) {
            console.log(`🏠 Purchase decision active - preventing UI clear (${timeElapsed}ms elapsed, need ${minDisplayTime}ms)`);
            
            // Force show purchase buttons if they're being hidden
            const currentSquare = window.players && window.players[window.currentPlayerIndex] ? 
                window.players[window.currentPlayerIndex].currentSquare : null;
            
            if (currentSquare && window.propertyState && window.propertyState[currentSquare]) {
                const property = window.propertyState[currentSquare];
                if (!property.owner && !property.declined) {
                    console.log(`🏠 Forcing purchase UI to stay visible for ${currentSquare}`);
                    
                    // Show purchase buttons
                    setTimeout(() => {
                        const propertyInfo = document.getElementById('property-info');
                        if (propertyInfo) {
                            propertyInfo.style.display = 'block';
                        }
                        
                        const purchaseButton = document.getElementById('purchase-button');
                        const declineButton = document.getElementById('decline-button');
                        
                        if (purchaseButton) {
                            purchaseButton.style.display = 'inline-block';
                            purchaseButton.disabled = false;
                        }
                        if (declineButton) {
                            declineButton.style.display = 'inline-block';
                            declineButton.disabled = false;
                        }
                        
                        console.log('🏠 Purchase buttons forced to stay visible');
                    }, 100);
                    
                    return; // Don't call original function yet
                }
            }
        } else {
            console.log('🏠 Purchase decision time expired, allowing normal UI update');
            purchaseDecisionActive = false;
        }
    }
    
    // Call original function
    if (originalUpdateInfoPanel) {
        return originalUpdateInfoPanel.call(this, playerName);
    }
}

// Function to handle property purchase completion
function onPropertyPurchaseDecision() {
    console.log('🏠 Property purchase decision made');
    purchaseDecisionActive = false;
    purchaseDecisionStartTime = 0;
    purchaseDecisionProperty = null;
}

// Apply enhancements
if (typeof window.startAutoActionTimer === 'function') {
    window.startAutoActionTimer = enhancedStartAutoActionTimer;
    console.log('✅ Enhanced startAutoActionTimer applied');
}

if (typeof window.clearAutoActionTimer === 'function') {
    window.clearAutoActionTimer = enhancedClearAutoActionTimer;
    console.log('✅ Enhanced clearAutoActionTimer applied');
}

if (typeof window.updateInfoPanel === 'function') {
    window.updateInfoPanel = enhancedUpdateInfoPanel;
    console.log('✅ Enhanced updateInfoPanel applied');
}

// Hook into purchase/decline functions
if (typeof window.purchaseProperty === 'function') {
    const originalPurchaseProperty = window.purchaseProperty;
    window.purchaseProperty = function(...args) {
        onPropertyPurchaseDecision();
        return originalPurchaseProperty.apply(this, args);
    };
    console.log('✅ Enhanced purchaseProperty applied');
}

if (typeof window.declineProperty === 'function') {
    const originalDeclineProperty = window.declineProperty;
    window.declineProperty = function(...args) {
        onPropertyPurchaseDecision();
        return originalDeclineProperty.apply(this, args);
    };
    console.log('✅ Enhanced declineProperty applied');
}

// Add visual indicator for purchase decision time
function showPurchaseTimer() {
    if (!purchaseDecisionActive) return;
    
    const timeElapsed = Date.now() - purchaseDecisionStartTime;
    const totalTime = window.isMultiplayerGame ? 25000 : 15000;
    const timeRemaining = Math.max(0, totalTime - timeElapsed);
    
    // Update any timer display
    const timerElement = document.querySelector('.purchase-timer');
    if (timerElement) {
        timerElement.textContent = `${Math.ceil(timeRemaining / 1000)}s`;
    }
    
    if (timeRemaining > 0) {
        setTimeout(showPurchaseTimer, 1000);
    }
}

// Start timer display when purchase decision begins
const originalShowPurchaseOptions = window.showPurchaseOptions;
if (typeof originalShowPurchaseOptions === 'function') {
    window.showPurchaseOptions = function(...args) {
        const result = originalShowPurchaseOptions.apply(this, args);
        showPurchaseTimer();
        return result;
    };
}

console.log('✅ Property Purchase Timing Fix loaded successfully!');

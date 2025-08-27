// Emergency Fix for Purchase Button Timing
// Quick fix to prevent purchase buttons from disappearing too fast

console.log('🚨 Loading Emergency Purchase Button Fix...');

// Store original functions
const originalStartAutoActionTimer = window.startAutoActionTimer;
const originalClearAutoActionTimer = window.clearAutoActionTimer;

// Track purchase state
let purchaseUIActive = false;
let purchaseUIStartTime = 0;

// Enhanced timer function with better purchase timing
function emergencyStartAutoActionTimer(actionType = 'roll') {
    console.log(`🚨 Emergency timer for ${actionType}`);
    
    // Clear existing timer
    if (window.autoActionTimer) {
        clearTimeout(window.autoActionTimer);
        window.autoActionTimer = null;
    }
    
    let delay;
    
    if (actionType === 'develop') {
        delay = window.isMultiplayerGame ? 45000 : 25000;
    } else if (actionType === 'purchase') {
        delay = window.isMultiplayerGame ? 30000 : 20000; // Much longer for purchases!
        purchaseUIActive = true;
        purchaseUIStartTime = Date.now();
        console.log(`🚨 Purchase UI active - ${delay/1000}s timer`);
    } else { // roll
        delay = window.isMultiplayerGame ? 8000 : 5000; // Fixed dice timing
    }
    
    console.log(`🚨 Setting ${delay/1000}s timer for ${actionType}`);
    
    window.autoActionTimer = setTimeout(() => {
        console.log(`🚨 Timer expired for ${actionType}`);
        
        if (actionType === 'roll') {
            if (window.executeMultiplayerAutoTurn) {
                window.executeMultiplayerAutoTurn();
            } else if (window.rollDice) {
                window.rollDice();
            }
        } else if (actionType === 'purchase') {
            console.log('🚨 Auto-declining property after timeout');
            purchaseUIActive = false;
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

// Enhanced clear timer - don't clear purchase UI too early
function emergencyClearAutoActionTimer() {
    console.log('🚨 Emergency clear timer called');
    
    if (purchaseUIActive) {
        const elapsed = Date.now() - purchaseUIStartTime;
        if (elapsed < 10000) { // Keep purchase UI for at least 10 seconds
            console.log(`🚨 Keeping purchase UI active (${elapsed}ms elapsed)`);
            return; // Don't clear the timer yet
        }
    }
    
    if (window.autoActionTimer) {
        clearTimeout(window.autoActionTimer);
        window.autoActionTimer = null;
        console.log('🚨 Timer cleared');
    }
    
    // Call original if it exists
    if (originalClearAutoActionTimer) {
        originalClearAutoActionTimer.call(this);
    }
}

// Hook into purchase decisions to reset state
function onPurchaseDecision() {
    console.log('🚨 Purchase decision made');
    purchaseUIActive = false;
    purchaseUIStartTime = 0;
}

// Apply the emergency fixes
if (typeof window.startAutoActionTimer === 'function') {
    window.startAutoActionTimer = emergencyStartAutoActionTimer;
    console.log('✅ Emergency startAutoActionTimer applied');
}

if (typeof window.clearAutoActionTimer === 'function') {
    window.clearAutoActionTimer = emergencyClearAutoActionTimer;
    console.log('✅ Emergency clearAutoActionTimer applied');
}

// Hook into purchase/decline functions
if (typeof window.purchaseProperty === 'function') {
    const originalPurchase = window.purchaseProperty;
    window.purchaseProperty = function(...args) {
        onPurchaseDecision();
        return originalPurchase.apply(this, args);
    };
    console.log('✅ Enhanced purchaseProperty hook applied');
}

if (typeof window.declineProperty === 'function') {
    const originalDecline = window.declineProperty;
    window.declineProperty = function(...args) {
        onPurchaseDecision();
        return originalDecline.apply(this, args);
    };
    console.log('✅ Enhanced declineProperty hook applied');
}

// Force purchase buttons to stay visible
function forcePurchaseButtonsVisible() {
    if (!purchaseUIActive) return;
    
    const propertyInfo = document.getElementById('property-info');
    const purchaseButton = document.getElementById('purchase-button');
    const declineButton = document.getElementById('decline-button');
    
    if (propertyInfo) {
        propertyInfo.style.display = 'block';
    }
    
    if (purchaseButton) {
        purchaseButton.style.display = 'inline-block';
        purchaseButton.disabled = false;
    }
    
    if (declineButton) {
        declineButton.style.display = 'inline-block';
        declineButton.disabled = false;
    }
    
    // Check again in 1 second
    setTimeout(forcePurchaseButtonsVisible, 1000);
}

// Start forcing buttons when purchase UI becomes active
const originalShowPurchaseOptions = window.showPurchaseOptions;
if (typeof originalShowPurchaseOptions === 'function') {
    window.showPurchaseOptions = function(...args) {
        const result = originalShowPurchaseOptions.apply(this, args);
        
        // Start forcing buttons to stay visible
        setTimeout(forcePurchaseButtonsVisible, 100);
        
        return result;
    };
    console.log('✅ Enhanced showPurchaseOptions applied');
}

console.log('🚨 Emergency Purchase Button Fix loaded successfully!');

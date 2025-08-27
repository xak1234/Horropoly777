// Version Click Fix - Console Script
// Copy and paste this entire script into the browser console on the main game page

console.log('🔧 Applying version click fix...');

// Define the version clicking functions
window.versionTapCount = 0;
window.versionTapTimeout = null;

window.handleVersionTap = function() {
    window.versionTapCount++;
    console.log(`🔧 Version tap count: ${window.versionTapCount}/6`);
    
    // Reset counter after 3 seconds of no taps
    clearTimeout(window.versionTapTimeout);
    window.versionTapTimeout = setTimeout(() => {
        window.versionTapCount = 0;
    }, 3000);
    
    // Visual feedback
    const versionSpan = document.getElementById('version-span');
    if (versionSpan) {
        versionSpan.style.color = '#ff0000';
        setTimeout(() => {
            versionSpan.style.color = '#ffff00';
        }, 150);
    }
    
    // Unlock after 6 taps
    if (window.versionTapCount >= 6) {
        console.log('🔓 Testing unlock activated!');
        window.versionTapCount = 0;
        clearTimeout(window.versionTapTimeout);
        
        // Visual confirmation
        if (versionSpan) {
            versionSpan.style.color = '#00ff00';
            versionSpan.textContent = 'v6.5 🔓';
        }
        
        // Unlock paywall for testing
        window.unlockPaywallForTesting();
    }
};

window.unlockPaywallForTesting = function() {
    console.log('🧪 TESTING MODE: Unlocking paywall...');
    
    // Set localStorage flags to simulate payment
    localStorage.setItem('multiplayerPaid', 'true');
    localStorage.setItem('testingUnlock', 'true');
    localStorage.setItem('stripe_session_id', 'test_session_' + Date.now());
    localStorage.setItem('userId', 'test_user_' + Date.now());
    
    // Show success message
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 255, 0, 0.9);
        color: #000;
        padding: 20px;
        border-radius: 10px;
        font-weight: bold;
        z-index: 10000;
        text-align: center;
        border: 2px solid #00ff00;
        box-shadow: 0 0 20px rgba(0, 255, 0, 0.5);
    `;
    successDiv.innerHTML = `
        🧪 TESTING MODE ACTIVATED<br>
        <span style="font-size: 14px;">Paywall unlocked for testing</span><br>
        <span style="font-size: 12px; opacity: 0.8;">Multiplayer access enabled</span>
    `;
    
    document.body.appendChild(successDiv);
    
    // Remove success message after 3 seconds
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.parentNode.removeChild(successDiv);
        }
    }, 3000);
    
    // Hide modal paywall if it exists
    const modalPaywall = document.getElementById('multiplayer-payment-wall-modal');
    if (modalPaywall) {
        modalPaywall.style.display = 'none';
    }
    
    // Show create dungeon section if it exists
    const createDungeonSection = document.getElementById('create-dungeon-section');
    if (createDungeonSection) {
        createDungeonSection.style.display = 'block';
    }
    
    console.log('🧪 Testing unlock complete - paywall bypassed');
};

// Function to attach event listeners
function attachVersionListeners() {
    const versionSpan = document.getElementById('version-span');
    if (versionSpan) {
        console.log('✅ Version span found, attaching listeners');
        
        // Remove existing listeners by cloning
        const newSpan = versionSpan.cloneNode(true);
        versionSpan.parentNode.replaceChild(newSpan, versionSpan);
        
        // Add new listeners
        newSpan.addEventListener('click', function(e) {
            console.log('🖱️ Click detected on version span');
            window.handleVersionTap();
        });
        
        newSpan.addEventListener('touchend', function(e) {
            console.log('👆 Touch detected on version span');
            e.preventDefault();
            window.handleVersionTap();
        });
        
        console.log('✅ Event listeners attached successfully');
        return true;
    } else {
        console.log('❌ Version span not found');
        return false;
    }
}

// Try to attach listeners immediately
if (attachVersionListeners()) {
    console.log('✅ Fix applied successfully! Version clicking should now work.');
} else {
    console.log('⚠️ Version span not found, will retry...');
    
    // Try again after DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        if (attachVersionListeners()) {
            console.log('✅ Fix applied after DOM ready!');
        } else {
            console.log('❌ Failed to apply fix - version span not found');
        }
    });
}

// Test function
function testVersionClick() {
    console.log('🧪 Testing version click...');
    
    const versionSpan = document.getElementById('version-span');
    if (versionSpan) {
        console.log('✅ Version span found, testing click...');
        versionSpan.click();
        
        setTimeout(() => {
            console.log(`📊 Tap count: ${window.versionTapCount || 'undefined'}`);
        }, 100);
    } else {
        console.log('❌ Version span not found for testing');
    }
}

console.log('🎯 Fix applied! Try clicking the version number 6 times to unlock multiplayer.');
console.log('🧪 Run testVersionClick() to test the fix.'); 
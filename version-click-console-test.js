// Version Click Console Test Commands
// Run these commands in the browser console when on the main game page (http://localhost:8000)

console.log('🔧 Version Click Console Test Commands');
console.log('Copy and paste these commands into the browser console:');

// Test 1: Check if version span exists
console.log(`
// Test 1: Check if version span exists
const versionSpan = document.getElementById('version-span');
if (versionSpan) {
    console.log('✅ Version span found:', versionSpan.textContent);
    console.log('📍 Position:', versionSpan.offsetTop, versionSpan.offsetLeft);
    console.log('🎨 Style:', versionSpan.style.color, versionSpan.style.cursor);
} else {
    console.log('❌ Version span NOT found!');
}
`);

// Test 2: Check if functions exist
console.log(`
// Test 2: Check if functions exist
console.log('handleVersionTap function:', typeof handleVersionTap);
console.log('unlockPaywallForTesting function:', typeof unlockPaywallForTesting);
console.log('versionTapCount variable:', typeof versionTapCount, versionTapCount);
`);

// Test 3: Test click manually
console.log(`
// Test 3: Test click manually
const versionSpan = document.getElementById('version-span');
if (versionSpan) {
    console.log('🖱️ Simulating click on version span...');
    versionSpan.click();
    console.log('✅ Click simulated');
} else {
    console.log('❌ Cannot click - version span not found');
}
`);

// Test 4: Check localStorage
console.log(`
// Test 4: Check localStorage
console.log('multiplayerPaid:', localStorage.getItem('multiplayerPaid'));
console.log('testingUnlock:', localStorage.getItem('testingUnlock'));
console.log('stripe_session_id:', localStorage.getItem('stripe_session_id'));
console.log('userId:', localStorage.getItem('userId'));
`);

// Test 5: Manual unlock
console.log(`
// Test 5: Manual unlock (if functions exist)
if (typeof unlockPaywallForTesting === 'function') {
    console.log('🔓 Manually calling unlockPaywallForTesting...');
    unlockPaywallForTesting();
    console.log('✅ Manual unlock called');
} else {
    console.log('❌ unlockPaywallForTesting function not found');
}
`);

// Test 6: Force attach event listeners
console.log(`
// Test 6: Force attach event listeners
const versionSpan = document.getElementById('version-span');
if (versionSpan) {
    console.log('🔧 Force attaching event listeners...');
    
    // Remove existing listeners by cloning
    const newSpan = versionSpan.cloneNode(true);
    versionSpan.parentNode.replaceChild(newSpan, versionSpan);
    
    // Add new listeners
    newSpan.addEventListener('click', function() {
        console.log('🖱️ Click detected on version span');
        if (typeof handleVersionTap === 'function') {
            handleVersionTap();
        } else {
            console.log('❌ handleVersionTap function not found');
        }
    });
    
    newSpan.addEventListener('touchend', function(e) {
        console.log('👆 Touch detected on version span');
        e.preventDefault();
        if (typeof handleVersionTap === 'function') {
            handleVersionTap();
        } else {
            console.log('❌ handleVersionTap function not found');
        }
    });
    
    console.log('✅ Event listeners force-attached');
} else {
    console.log('❌ Version span not found for force attach');
}
`);

// Test 7: Complete diagnostic
console.log(`
// Test 7: Complete diagnostic
function runVersionClickDiagnostic() {
    console.log('🔍 Running version click diagnostic...');
    
    // Check version span
    const versionSpan = document.getElementById('version-span');
    console.log('Version span found:', !!versionSpan);
    if (versionSpan) {
        console.log('  Text:', versionSpan.textContent);
        console.log('  Color:', versionSpan.style.color);
        console.log('  Cursor:', versionSpan.style.cursor);
    }
    
    // Check functions
    console.log('handleVersionTap function:', typeof handleVersionTap);
    console.log('unlockPaywallForTesting function:', typeof unlockPaywallForTesting);
    console.log('versionTapCount variable:', typeof versionTapCount, versionTapCount);
    
    // Check localStorage
    console.log('multiplayerPaid:', localStorage.getItem('multiplayerPaid'));
    console.log('testingUnlock:', localStorage.getItem('testingUnlock'));
    
    // Test click
    if (versionSpan) {
        console.log('🖱️ Testing click...');
        versionSpan.click();
        setTimeout(() => {
            console.log('Tap count after click:', versionTapCount);
        }, 100);
    }
    
    console.log('🏁 Diagnostic complete');
}

// Run the diagnostic
runVersionClickDiagnostic();
`);

console.log('📋 Copy and paste any of the above test commands into the browser console');
console.log('🌐 Make sure you are on the main game page: http://localhost:8000'); 
// Emergency Dice Fix Script
// Copy and paste this entire script into your browser console when dice won't click

console.log('🚨 EMERGENCY DICE FIX - Starting...');

function emergencyDiceFix() {
    console.log('🛠️ Running emergency dice fix...');
    
    try {
        // Step 1: Reset all blocking flags
        console.log('Step 1: Resetting blocking flags...');
        if (typeof isDiceRollInProgress !== 'undefined') {
            isDiceRollInProgress = false;
            console.log('✅ isDiceRollInProgress = false');
        }
        
        if (typeof isDiceClickHandlerRunning !== 'undefined') {
            isDiceClickHandlerRunning = false;
            console.log('✅ isDiceClickHandlerRunning = false');
        }
        
        if (typeof isPlayerMoving !== 'undefined') {
            isPlayerMoving = false;
            console.log('✅ isPlayerMoving = false');
        }
        
        if (typeof isRecordingEyes !== 'undefined') {
            isRecordingEyes = false;
            console.log('✅ isRecordingEyes = false');
        }
        
        // Step 2: Find and fix dice element
        console.log('Step 2: Finding and fixing dice element...');
        const diceSection = document.getElementById('dice-section');
        
        if (diceSection) {
            // Enable pointer events
            diceSection.style.pointerEvents = 'auto';
            console.log('✅ Dice pointer events enabled');
            
            // Fix classes
            diceSection.classList.remove('dice-pulse-red', 'dice-pulse-blue');
            diceSection.classList.add('dice-pulse');
            console.log('✅ Dice classes fixed');
            
            // Show current state
            console.log('🔍 Dice element state:');
            console.log('   Classes:', Array.from(diceSection.classList).join(', '));
            console.log('   Pointer Events:', diceSection.style.pointerEvents);
            console.log('   Parent:', diceSection.parentElement?.id);
            
        } else {
            console.log('❌ Dice section not found');
            
            // Look for dice elements
            const diceElements = document.querySelectorAll('.dice-section, [class*="dice"], #die1, #die2');
            if (diceElements.length > 0) {
                console.log(`Found ${diceElements.length} dice-related elements:`);
                diceElements.forEach((el, i) => {
                    console.log(`  ${i + 1}: ${el.tagName}#${el.id}.${el.className}`);
                });
            }
        }
        
        // Step 3: Try to call enableDiceSection if it exists
        console.log('Step 3: Calling enableDiceSection...');
        if (typeof enableDiceSection === 'function') {
            enableDiceSection();
            console.log('✅ enableDiceSection() called');
        } else {
            console.log('⚠️ enableDiceSection function not found');
        }
        
        // Step 4: Check if it's a multiplayer turn issue
        console.log('Step 4: Checking multiplayer turn state...');
        if (typeof isMultiplayerGame !== 'undefined' && isMultiplayerGame) {
            const playerNameInput = document.getElementById('player1-name');
            const playerName = playerNameInput ? playerNameInput.value.trim() : '';
            const currentPlayer = players && players[currentPlayerIndex];
            
            console.log('🔍 Multiplayer state:');
            console.log('   Your name:', playerName);
            console.log('   Current player:', currentPlayer?.name);
            console.log('   Is your turn:', currentPlayer?.name === playerName);
            
            if (currentPlayer?.name !== playerName) {
                console.log('⚠️ It might not be your turn in multiplayer');
                console.log('💡 If this is wrong, check your player name in the input field');
            }
        }
        
        // Step 5: Test dice functionality
        console.log('Step 5: Testing dice functionality...');
        if (typeof handleDiceClick === 'function') {
            console.log('✅ handleDiceClick function exists');
            console.log('💡 Try clicking the dice now, or run: handleDiceClick("test")');
        } else {
            console.log('❌ handleDiceClick function not found');
        }
        
        console.log('🎉 Emergency dice fix completed!');
        console.log('💡 Try clicking the dice now. If it still doesn\'t work, check the console for error messages.');
        
        return {
            success: true,
            diceElementFound: !!diceSection,
            flagsReset: true,
            enableDiceSectionCalled: typeof enableDiceSection === 'function'
        };
        
    } catch (error) {
        console.error('❌ Emergency dice fix failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Run the fix immediately
const result = emergencyDiceFix();

// Make the function available globally for repeated use
window.emergencyDiceFix = emergencyDiceFix;

console.log('💡 You can run this fix again anytime by typing: emergencyDiceFix()');

// Additional helper functions
window.checkDiceState = function() {
    console.log('🔍 CURRENT DICE STATE:');
    console.log('Flags:');
    console.log('  isDiceRollInProgress:', typeof isDiceRollInProgress !== 'undefined' ? isDiceRollInProgress : 'undefined');
    console.log('  isDiceClickHandlerRunning:', typeof isDiceClickHandlerRunning !== 'undefined' ? isDiceClickHandlerRunning : 'undefined');
    console.log('  isPlayerMoving:', typeof isPlayerMoving !== 'undefined' ? isPlayerMoving : 'undefined');
    console.log('  isAITurn:', typeof isAITurn !== 'undefined' ? isAITurn : 'undefined');
    console.log('  isRecordingEyes:', typeof isRecordingEyes !== 'undefined' ? isRecordingEyes : 'undefined');
    
    const diceSection = document.getElementById('dice-section');
    console.log('Dice Element:');
    if (diceSection) {
        console.log('  Found: Yes');
        console.log('  Classes:', Array.from(diceSection.classList).join(', '));
        console.log('  Pointer Events:', diceSection.style.pointerEvents);
        console.log('  Visible:', window.getComputedStyle(diceSection).display !== 'none');
    } else {
        console.log('  Found: No');
    }
    
    console.log('Functions:');
    console.log('  handleDiceClick:', typeof handleDiceClick);
    console.log('  enableDiceSection:', typeof enableDiceSection);
};

window.forceDiceClickable = function() {
    console.log('🔧 FORCING DICE CLICKABLE...');
    
    // Reset flags
    if (typeof isDiceRollInProgress !== 'undefined') isDiceRollInProgress = false;
    if (typeof isDiceClickHandlerRunning !== 'undefined') isDiceClickHandlerRunning = false;
    if (typeof isPlayerMoving !== 'undefined') isPlayerMoving = false;
    
    // Fix dice element
    const diceSection = document.getElementById('dice-section');
    if (diceSection) {
        diceSection.style.pointerEvents = 'auto';
        diceSection.classList.remove('dice-pulse-red', 'dice-pulse-blue');
        diceSection.classList.add('dice-pulse');
        console.log('✅ Dice forced clickable');
    } else {
        console.log('❌ Dice section not found');
    }
    
    // Call enableDiceSection
    if (typeof enableDiceSection === 'function') {
        enableDiceSection();
        console.log('✅ enableDiceSection called');
    }
};

console.log('📋 Available helper functions:');
console.log('  emergencyDiceFix() - Run the full fix');
console.log('  checkDiceState() - Check current state');
console.log('  forceDiceClickable() - Force dice clickable');
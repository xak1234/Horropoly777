// Fix for "Turn info element not found" error
// This script ensures the turn-info element is always available

console.log('🔧 Applying turn-info element fix...');

// Function to ensure turn-info element exists
function ensureTurnInfoElement() {
    let turnInfo = document.getElementById('turn-info');
    
    if (!turnInfo) {
        console.log('⚠️ turn-info element not found, creating it...');
        
        // Try to find the info-panel-content to insert the turn-info element
        const infoPanelContent = document.getElementById('info-panel-content');
        if (infoPanelContent) {
            // Create the turn-info element
            turnInfo = document.createElement('h3');
            turnInfo.id = 'turn-info';
            turnInfo.className = 'turn-info';
            turnInfo.style.cssText = `
                margin: 5px 0;
                padding: 5px;
                text-align: center;
                font-size: 14px;
                font-weight: bold;
                color: #fff;
                text-shadow: 0 0 4px #00ff00;
                background: rgba(0, 0, 0, 0.7);
                border-radius: 5px;
                border: 1px solid #00ff00;
                box-shadow: 0 0 8px rgba(0, 255, 0, 0.3);
            `;
            
            // Insert it before the dice section if it exists, otherwise just append
            const diceSection = document.getElementById('dice-section');
            if (diceSection && diceSection.parentElement === infoPanelContent) {
                infoPanelContent.insertBefore(turnInfo, diceSection);
            } else {
                infoPanelContent.appendChild(turnInfo);
            }
            
            console.log('✅ turn-info element created and inserted');
            return turnInfo;
        } else {
            console.error('❌ Could not find info-panel-content to insert turn-info');
            return null;
        }
    }
    
    return turnInfo;
}

// Enhanced updateTurnInfo function
function enhancedUpdateTurnInfo(isInitialRoll = false) {
    try {
        // Check if we have valid players and current player index
        if (typeof players === 'undefined' || !Array.isArray(players) || players.length === 0 || 
            typeof currentPlayerIndex === 'undefined' || currentPlayerIndex < 0 || currentPlayerIndex >= players.length) {
            console.log('updateTurnInfo: No valid players or currentPlayerIndex');
            return;
        }

        const currentPlayer = players[currentPlayerIndex];
        if (!currentPlayer) {
            console.log('updateTurnInfo: Current player is undefined');
            return;
        }

        // Ensure turn-info element exists
        let turnInfo = ensureTurnInfoElement();
        if (!turnInfo) {
            console.error('❌ Could not create or find turn-info element');
            return;
        }
        
        const diceRollInfo = document.getElementById('dice-roll-info');
        
        turnInfo.textContent = `${currentPlayer.name}'s Turn`;
        turnInfo.style.display = 'block'; // Show the turn info initially
        
        // Clear dice roll info to prevent duplicate turn display
        if (diceRollInfo) {
            diceRollInfo.textContent = '';
        }
        
        // Clear the turn info after 3 seconds if it's not the initial roll
        if (!isInitialRoll) {
            setTimeout(() => {
                if (turnInfo) {
                    turnInfo.style.display = 'none';
                }
            }, 3000);
        }
        
        console.log(`✅ Updated turn info to: "${turnInfo.textContent}"`);
    } catch (error) {
        console.error('❌ Error in enhanced updateTurnInfo:', error);
    }
}

// Override the original updateTurnInfo function if it exists
if (typeof window.updateTurnInfo === 'function') {
    const originalUpdateTurnInfo = window.updateTurnInfo;
    
    window.updateTurnInfo = function(isInitialRoll = false) {
        console.log('🔄 Enhanced updateTurnInfo called');
        enhancedUpdateTurnInfo(isInitialRoll);
    };
    
    console.log('✅ Enhanced updateTurnInfo function applied');
} else {
    // If the function doesn't exist yet, create it
    window.updateTurnInfo = enhancedUpdateTurnInfo;
    console.log('✅ Created new updateTurnInfo function');
}

// Also ensure the element exists immediately
ensureTurnInfoElement();

console.log('🔧 Turn-info element fix applied successfully'); 
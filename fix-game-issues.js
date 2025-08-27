// fix-game-issues.js
// Fix for turn-info element not found and token rendering issues

console.log('🔧 Applying game fixes...');

// Fix for turn-info element not found
function ensureTurnInfoElement() {
    console.log('🔍 Checking for turn-info element...');
    
    let turnInfo = document.getElementById('turn-info');
    
    if (!turnInfo) {
        console.log('⚠️ turn-info element not found, creating it...');
        
        // Find the info panel content
        const infoPanelContent = document.getElementById('info-panel-content');
        const diceContent = document.getElementById('dice-content');
        
        if (infoPanelContent) {
            // Create the turn-info element
            turnInfo = document.createElement('h3');
            turnInfo.id = 'turn-info';
            turnInfo.className = 'turn-info';
            turnInfo.style.cssText = `
                margin: 8px 0;
                padding: 6px 10px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 4px;
                text-align: center;
                font-size: 14px;
                font-weight: bold;
                color: #fff;
                text-shadow: 0 0 4px #ffd700;
                display: none;
            `;
            
            // Insert it after the dice content if it exists, otherwise at the beginning
            if (diceContent) {
                diceContent.parentNode.insertBefore(turnInfo, diceContent.nextSibling);
            } else {
                infoPanelContent.insertBefore(turnInfo, infoPanelContent.firstChild);
            }
            
            console.log('✅ turn-info element created and inserted');
        } else {
            console.error('❌ Could not find info-panel-content to insert turn-info');
        }
    } else {
        console.log('✅ turn-info element found');
    }
    
    return turnInfo;
}

// Fix for Phantom player token rendering
function fixPhantomPlayerToken() {
    console.log('🔍 Checking for Phantom player token issues...');
    
    // Check if there's a player named "Phantom"
    if (typeof players !== 'undefined' && Array.isArray(players)) {
        const phantomPlayer = players.find(p => p && p.name === 'Phantom');
        
        if (phantomPlayer) {
            console.log('👻 Found Phantom player:', phantomPlayer);
            
            // Ensure Phantom has proper color assignment
            if (!phantomPlayer.color || phantomPlayer.color === 'undefined' || phantomPlayer.color === 'null') {
                // Assign green color (#00ff00) to Phantom (third player)
                phantomPlayer.color = '#00ff00';
                console.log('✅ Assigned green color to Phantom player');
            }
            
            // Ensure Phantom has proper token image
            if (!phantomPlayer.tokenImage || phantomPlayer.tokenImage === 'undefined') {
                phantomPlayer.tokenImage = `assets/images/t${(phantomPlayer.tokenIndex || 2) + 1}.png`;
                console.log('✅ Assigned token image to Phantom player:', phantomPlayer.tokenImage);
            }
            
            // Ensure Phantom has proper size
            if (!phantomPlayer.size) {
                phantomPlayer.size = 62;
                console.log('✅ Assigned size to Phantom player');
            }
        }
    }
}

// Enhanced token rendering fix
function enhanceTokenRendering() {
    console.log('🎨 Enhancing token rendering...');
    
    // Override the renderTokens function to add better error handling
    if (typeof window.renderTokens === 'function') {
        const originalRenderTokens = window.renderTokens;
        
        window.renderTokens = function(playersToRender) {
            console.log('🎨 Enhanced renderTokens called with players:', playersToRender?.length || 0);
            
            try {
                // Ensure all players have proper color assignments
                if (playersToRender && Array.isArray(playersToRender)) {
                    playersToRender.forEach((player, index) => {
                        if (player && (!player.color || player.color === 'undefined' || player.color === 'null')) {
                            const colors = ['#ff0000', '#0000ff', '#00ff00', '#ffff00', '#800080'];
                            player.color = colors[index % colors.length];
                            console.log(`🎨 Assigned color ${player.color} to player ${player.name}`);
                        }
                    });
                }
                
                // Call the original function
                return originalRenderTokens(playersToRender);
            } catch (error) {
                console.error('❌ Error in enhanced renderTokens:', error);
                // Fallback to original function
                return originalRenderTokens(playersToRender);
            }
        };
        
        console.log('✅ Enhanced renderTokens function applied');
    }
}

// Fix for turn info display
function fixTurnInfoDisplay() {
    console.log('🔄 Fixing turn info display...');
    
    // Override the updateTurnInfo function if it exists
    if (typeof window.updateTurnInfo === 'function') {
        const originalUpdateTurnInfo = window.updateTurnInfo;
        
        window.updateTurnInfo = function(isInitialRoll = false) {
            console.log('🔄 Enhanced updateTurnInfo called');
            
            try {
                const turnInfo = ensureTurnInfoElement();
                
                if (!turnInfo) {
                    console.error('❌ Could not ensure turn-info element');
                    return;
                }
                
                // Get current player info
                let currentPlayerName = 'Unknown Player';
                if (typeof currentPlayerIndex !== 'undefined' && typeof players !== 'undefined' && players && players[currentPlayerIndex]) {
                    currentPlayerName = players[currentPlayerIndex].name;
                }
                
                // Update turn info
                turnInfo.textContent = `${currentPlayerName}'s Turn`;
                turnInfo.style.display = 'block';
                turnInfo.style.visibility = 'visible';
                turnInfo.style.opacity = '1';
                
                console.log(`✅ Updated turn info: ${currentPlayerName}'s Turn`);
                
                // Clear dice roll info to prevent duplicate turn display
                const diceRollInfo = document.getElementById('dice-roll-info');
                if (diceRollInfo) {
                    diceRollInfo.textContent = '';
                }
                
                // Keep turn info visible for longer in minimized mode
                const infoPanel = document.getElementById('info-panel');
                const isMinimized = infoPanel && infoPanel.classList.contains('minimized');
                
                // Clear the turn info after 3 seconds if it's not the initial roll, but keep it visible longer in minimized mode
                if (!isInitialRoll) {
                    const clearDelay = isMinimized ? 5000 : 3000; // 5 seconds in minimized mode, 3 seconds in standard mode
                    setTimeout(() => {
                        // Only hide if not in minimized mode or if turn info is still relevant
                        if (!isMinimized) {
                            turnInfo.style.display = 'none';
                        }
                    }, clearDelay);
                }
                
            } catch (error) {
                console.error('❌ Error in enhanced updateTurnInfo:', error);
                // Fallback to original function
                return originalUpdateTurnInfo(isInitialRoll);
            }
        };
        
        console.log('✅ Enhanced updateTurnInfo function applied');
    }
}

// Apply all fixes
function applyGameFixes() {
    console.log('🔧 Applying comprehensive game fixes...');
    
    // Fix turn-info element
    ensureTurnInfoElement();
    
    // Fix Phantom player token
    fixPhantomPlayerToken();
    
    // Enhance token rendering
    enhanceTokenRendering();
    
    // Fix turn info display
    fixTurnInfoDisplay();
    
    console.log('✅ All game fixes applied successfully');
}

// Auto-apply fixes when script loads
applyGameFixes();

// Export functions for manual use
window.applyGameFixes = applyGameFixes;
window.ensureTurnInfoElement = ensureTurnInfoElement;
window.fixPhantomPlayerToken = fixPhantomPlayerToken;
window.enhanceTokenRendering = enhanceTokenRendering;
window.fixTurnInfoDisplay = fixTurnInfoDisplay;

console.log('🚀 Game fixes script loaded and applied'); 
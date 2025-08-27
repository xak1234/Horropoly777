// Fix for Player Development Issue
// This script addresses the issue where players cannot develop properties while AI bots can

console.log('🏗️ Loading Player Development Issue Fix...');

// Store original functions for restoration if needed
const originalHandlePropertyDevelopment = window.handlePropertyDevelopment;
const originalCanDevelopProperty = window.canDevelopProperty;
const originalUpdateInfoPanel = window.updateInfoPanel;

// Enhanced canDevelopProperty function with better player validation
function enhancedCanDevelopProperty(player, square) {
    const property = propertyState[square];
    
    // Get player name with fallback for corrupted data
    let playerName = player.name;
    if (!playerName || playerName === 'undefined') {
        // Try to get from window.localPlayerName if this is the current player
        if (window.localPlayerName && players[currentPlayerIndex] === player) {
            playerName = window.localPlayerName;
            console.log(`🔧 [Enhanced] Using fallback name "${playerName}" for corrupted player data`);
        }
    }
    
    // Debug logging for property development checks
    console.log(`🔧 [Enhanced] canDevelopProperty: Checking square ${square} for player "${playerName}". Property owner: "${property?.owner}"`);
    
    if (!property || property.owner !== playerName) {
        console.log(`🔧 [Enhanced] Failed ownership check. Property exists: ${!!property}, Owner match: ${property?.owner === playerName}`);
        
        // CRITICAL FIX: Check case-insensitive ownership for multiplayer games
        if (isMultiplayerGame && property && property.owner && playerName) {
            const ownershipMatch = property.owner.toLowerCase() === playerName.toLowerCase();
            console.log(`🔧 [Enhanced] Case-insensitive ownership check: ${ownershipMatch}`);
            if (!ownershipMatch) {
                return false;
            }
        } else if (!property || !property.owner || !playerName) {
            return false;
        }
    }
    
    const propertyInfo = getPropertyInfo(square);
    if (!propertyInfo) {
        console.log(`🔧 [Enhanced] No property info found for ${square}`);
        return false;
    }
    
    // Check if property is in a complete group
    const group = propertyInfo.group;
    const groupProperties = Object.keys(propertyState).filter(s => {
        const info = getPropertyInfo(s);
        return info && info.group === group;
    });
    
    const ownedInGroup = groupProperties.filter(s => {
        const state = propertyState[s];
        return state && (
            state.owner === playerName || 
            (isMultiplayerGame && state.owner && playerName && state.owner.toLowerCase() === playerName.toLowerCase())
        );
    });
    
    const ownsCompleteGroup = ownedInGroup.length === groupProperties.length;
    console.log(`🔧 [Enhanced] Group ${group}: owns ${ownedInGroup.length}/${groupProperties.length}, complete: ${ownsCompleteGroup}`);
    
    if (!ownsCompleteGroup) {
        console.log(`🔧 [Enhanced] Cannot develop - incomplete group ownership`);
        return false;
    }
    
    // Check development limits
    const maxGraveyards = 4;
    const currentGraveyards = property.graveyards || 0;
    const hasCrypt = property.hasCrypt || false;
    
    console.log(`🔧 [Enhanced] Development state: ${currentGraveyards} graveyards, crypt: ${hasCrypt}`);
    
    // Can develop if: no developments yet, or has graveyards but no crypt, or less than max graveyards
    const canDevelop = (!hasCrypt && currentGraveyards < maxGraveyards) || (currentGraveyards === maxGraveyards && !hasCrypt);
    
    console.log(`🔧 [Enhanced] Can develop ${square}: ${canDevelop}`);
    return canDevelop;
}

// Enhanced handlePropertyDevelopment with better validation and error handling
async function enhancedHandlePropertyDevelopment(square, playerIndex) {
    console.log('🔧 [Enhanced] handlePropertyDevelopment called for square:', square, 'playerIndex:', playerIndex);
    
    clearAutoActionTimer(); // Clear the auto-action timer since player took action
    
    const propertyInfo = getPropertyInfo(square);
    const currentPlayer = players[playerIndex];
    
    if (!currentPlayer) {
        console.error('🔧 [Enhanced] Player not found for index:', playerIndex);
        showAdvisory('Error: Player not found. Please refresh the page.', 'error');
        return;
    }
    
    // CRITICAL FIX: Enhanced multiplayer validation
    if (isMultiplayerGame) {
        const activePlayer = players[currentPlayerIndex];
        let playerName = document.getElementById('player1-name').value.trim();
        
        // If player name is empty, try to get it from the stored local player name
        if (!playerName && window.localPlayerName) {
            playerName = window.localPlayerName;
            document.getElementById('player1-name').value = playerName;
        }
        
        console.log('🔧 [Enhanced] Multiplayer validation:', {
            activePlayer: activePlayer?.name,
            localPlayerName: playerName,
            playerIndex: playerIndex,
            currentPlayerIndex: currentPlayerIndex,
            isCorrectPlayer: playerIndex === currentPlayerIndex
        });
        
        // Enhanced validation with case-insensitive name matching
        const isMyTurn = activePlayer && playerName && (
            activePlayer.name.toLowerCase() === playerName.toLowerCase() ||
            (playerIndex === currentPlayerIndex && window.localPlayerName)
        );
        
        if (!activePlayer || !isMyTurn || playerIndex !== currentPlayerIndex) {
            console.warn(`🔧 [Enhanced] Multiplayer validation failed. Current player: ${activePlayer?.name}, Your name: ${playerName}`);
            showAdvisory("It's not your turn to develop properties!", 'error');
            return;
        }
    }
    
    // Prevent bankrupt players from developing
    if (currentPlayer.bankrupt) {
        console.log('🔧 [Enhanced] Bankrupt player cannot develop property:', currentPlayer.name);
        showAdvisory('Bankrupt players cannot develop properties.', 'error');
        return;
    }
    
    if (!propertyInfo) {
        console.error('🔧 [Enhanced] Property info not found for square:', square);
        showAdvisory('Error: Property information not found.', 'error');
        return;
    }
    
    // CRITICAL FIX: Enhanced ownership validation
    const property = propertyState[square];
    let playerName = currentPlayer.name;
    if (!playerName && window.localPlayerName) {
        playerName = window.localPlayerName;
    }
    
    const ownsProperty = property && (
        property.owner === playerName ||
        (isMultiplayerGame && property.owner && playerName && property.owner.toLowerCase() === playerName.toLowerCase())
    );
    
    if (!ownsProperty) {
        console.error('🔧 [Enhanced] Player does not own this property:', {
            square: square,
            propertyOwner: property?.owner,
            playerName: playerName,
            ownsProperty: ownsProperty
        });
        showAdvisory('You do not own this property!', 'error');
        return;
    }
    
    // Enhanced development validation
    if (!enhancedCanDevelopProperty(currentPlayer, square)) {
        console.error('🔧 [Enhanced] Cannot develop this property:', square);
        showAdvisory('This property cannot be developed right now.', 'error');
        return;
    }
    
    const devInfo = getDevelopmentCost(square);
    if (!devInfo) {
        console.error('🔧 [Enhanced] No development cost info for:', square);
        showAdvisory('Error: Development cost information not available.', 'error');
        return;
    }
    
    if (currentPlayer.money < devInfo.cost) {
        console.error('🔧 [Enhanced] Insufficient funds for development:', {
            playerMoney: currentPlayer.money,
            developmentCost: devInfo.cost,
            shortfall: devInfo.cost - currentPlayer.money
        });
        showAdvisory(`Insufficient funds! You need £${devInfo.cost} but only have £${currentPlayer.money}.`, 'error');
        return;
    }
    
    console.log('🔧 [Enhanced] Development is valid, proceeding...');
    
    // Proceed with development
    if (developProperty(currentPlayer, square)) {
        console.log('🔧 [Enhanced] Property developed successfully:', {
            square: square,
            type: devInfo.type,
            cost: devInfo.cost,
            remainingMoney: currentPlayer.money
        });
        
        // Show development advisory
        showAdvisory(
            `${currentPlayer.name} built a ${devInfo.type} on ${getPropertyDisplayName(propertyInfo)} for £${devInfo.cost}`,
            'development'
        );
        
        // Clear stored property info since development is complete
        currentPropertyInfo = null;
        
        // Update the display
        updateInfoPanel(null, null, propertyInfo);
        updateGameFrame();
        
        // Ensure bottom player display is updated after development
        if (typeof updateBottomPlayerDisplay === 'function') {
            updateBottomPlayerDisplay();
        }
        
        // Sync state to Firebase if in multiplayer mode
        if (isMultiplayerGame) {
            try {
                // Update both player data and property state
                await updatePlayerData(playerIndex, {
                    money: currentPlayer.money,
                    properties: currentPlayer.properties
                });
                
                await updatePropertyState(square, propertyState[square]);
                console.log('🔧 [Enhanced] Firebase sync completed');
            } catch (error) {
                console.error('🔧 [Enhanced] Error syncing to Firebase:', error);
            }
        }
        
        // Check if player can still develop this property and has enough cash
        const nextDevInfo = getDevelopmentCost(square);
        if (
            nextDevInfo &&
            enhancedCanDevelopProperty(currentPlayer, square) &&
            currentPlayer.money >= nextDevInfo.cost
        ) {
            // Give player choice to continue developing or exit
            showAdvisory(
                `Development successful! You can build another ${nextDevInfo.type} on ${getPropertyDisplayName(propertyInfo)} for £${nextDevInfo.cost}, develop later, or click dice to continue your turn.`,
                'info'
            );
            // Update info panel to show development buttons again, but also enable dice
            updateInfoPanel(null, null, propertyInfo);
            // Enable dice section so player can choose to exit
            enableDiceSection();
            return; // Pause for player decision
        }
        
        // No more development possible, continue the turn
        enableDiceSection();
        setTimeout(() => {
            // Check if it was doubles - if so, player gets another turn
            if (lastRollWasDoubles) {
                console.log('🔧 [Enhanced] Doubles rolled, checking for more development options...');
                
                // Check if player still has development options after building
                if (hasDevelopmentButtonsVisible()) {
                    console.log('🔧 [Enhanced] Development buttons still visible after building. Not auto-rolling.');
                    showAdvisory("Doubles! You can continue developing properties or click dice to roll again and develop later.", 'turn');
                    return;
                }
                
                // Handle doubles differently for multiplayer vs single player
                if (isMultiplayerGame) {
                    showAdvisory("Doubles! Click dice to roll again.", 'turn');
                    console.log(`🔧 [Enhanced] Multiplayer doubles: Waiting for ${currentPlayer.name} to click dice again.`);
                    // Don't auto-roll in multiplayer - player must click dice
                } else {
                    showAdvisory("Doubles! Auto-rolling again...", 'turn');
                    // Auto-roll for single player mode only
                    if (currentPlayer.isAI) {
                        handleAITurn();
                    } else {
                        console.log('🔧 [Enhanced] Auto-rolling dice after development');
                        takeTurn();
                    }
                }
            } else {
                // Not doubles, advance to next player
                nextTurn();
            }
        }, 3000); // 3 second delay to see development result
    } else {
        console.error('🔧 [Enhanced] Development failed in developProperty function');
        showAdvisory('Development failed. Please try again.', 'error');
    }
}

// Enhanced updateInfoPanel to ensure development buttons are properly shown
const originalUpdateInfoPanelFunction = window.updateInfoPanel;
function enhancedUpdateInfoPanel(player, dice, propertyInfo) {
    // Call original function first
    const result = originalUpdateInfoPanelFunction.call(this, player, dice, propertyInfo);
    
    // Enhanced development button logic for human players
    if (propertyInfo && !player?.isAI) {
        const currentPlayer = players[currentPlayerIndex];
        if (currentPlayer && !currentPlayer.isAI && propertyInfo.state.owner) {
            // Check if current player owns this property (case-insensitive for multiplayer)
            let playerName = currentPlayer.name;
            if (!playerName && window.localPlayerName) {
                playerName = window.localPlayerName;
            }
            
            const ownsProperty = propertyInfo.state.owner === playerName ||
                (isMultiplayerGame && propertyInfo.state.owner.toLowerCase() === playerName.toLowerCase());
            
            if (ownsProperty && enhancedCanDevelopProperty(currentPlayer, propertyInfo.square)) {
                const devInfo = getDevelopmentCost(propertyInfo.square);
                if (devInfo && currentPlayer.money >= devInfo.cost) {
                    console.log(`🔧 [Enhanced] Ensuring development button is visible for ${propertyInfo.square}`);
                    
                    // Force update the info panel content to include development button
                    const propertyInfoContent = document.getElementById('property-info-content');
                    if (propertyInfoContent) {
                        // Check if development button already exists
                        const existingButton = propertyInfoContent.querySelector('button[onclick*="handlePropertyDevelopment"]');
                        if (!existingButton) {
                            console.log(`🔧 [Enhanced] Adding missing development button for ${propertyInfo.square}`);
                            
                            const developButton = document.createElement('button');
                            developButton.onclick = () => handlePropertyDevelopment(propertyInfo.square, currentPlayerIndex);
                            developButton.style.cssText = `
                                margin-top: 10px; 
                                background-color: #9C27B0; 
                                color: white; 
                                border: 1px solid #bb33cc; 
                                padding: 8px 12px; 
                                border-radius: 4px; 
                                cursor: pointer; 
                                font-family: 'Courier New', 'Lucida Console', 'Monaco', 'Consolas', monospace; 
                                font-weight: bold; 
                                text-shadow: 0 0 4px #ff00ff; 
                                box-shadow: 0 0 8px rgba(156, 39, 176, 0.5); 
                                min-height: 36px; 
                                min-width: 36px; 
                                touch-action: manipulation;
                            `;
                            developButton.textContent = `Build ${devInfo.type} for £${devInfo.cost}`;
                            
                            // Add touch events for mobile
                            developButton.ontouchstart = function() { this.style.transform = 'scale(0.95)'; };
                            developButton.ontouchend = function() { this.style.transform = 'scale(1)'; };
                            
                            propertyInfoContent.appendChild(developButton);
                        }
                    }
                }
            }
        }
    }
    
    return result;
}

// Apply the fixes
function applyPlayerDevelopmentFixes() {
    console.log('🔧 Applying player development fixes...');
    
    // Replace the functions
    window.handlePropertyDevelopment = enhancedHandlePropertyDevelopment;
    window.canDevelopProperty = enhancedCanDevelopProperty;
    window.updateInfoPanel = enhancedUpdateInfoPanel;
    
    // Also patch global references
    if (typeof handlePropertyDevelopment !== 'undefined') {
        handlePropertyDevelopment = enhancedHandlePropertyDevelopment;
    }
    if (typeof canDevelopProperty !== 'undefined') {
        canDevelopProperty = enhancedCanDevelopProperty;
    }
    if (typeof updateInfoPanel !== 'undefined') {
        updateInfoPanel = enhancedUpdateInfoPanel;
    }
    
    console.log('✅ Player development fixes applied successfully!');
    showAdvisory('🔧 Player development system enhanced!', 'info');
}

// Restore original functions
function restoreOriginalDevelopmentFunctions() {
    console.log('🔄 Restoring original development functions...');
    
    window.handlePropertyDevelopment = originalHandlePropertyDevelopment;
    window.canDevelopProperty = originalCanDevelopProperty;
    window.updateInfoPanel = originalUpdateInfoPanelFunction;
    
    if (typeof handlePropertyDevelopment !== 'undefined') {
        handlePropertyDevelopment = originalHandlePropertyDevelopment;
    }
    if (typeof canDevelopProperty !== 'undefined') {
        canDevelopProperty = originalCanDevelopProperty;
    }
    if (typeof updateInfoPanel !== 'undefined') {
        updateInfoPanel = originalUpdateInfoPanelFunction;
    }
    
    console.log('✅ Original development functions restored!');
}

// Auto-apply fixes when game is detected
if (typeof players !== 'undefined' && typeof propertyState !== 'undefined') {
    console.log('🎮 Game detected, auto-applying player development fixes...');
    applyPlayerDevelopmentFixes();
} else {
    console.log('📝 Fixes loaded, will apply when game starts');
}

// Expose functions for manual control
window.applyPlayerDevelopmentFixes = applyPlayerDevelopmentFixes;
window.restoreOriginalDevelopmentFunctions = restoreOriginalDevelopmentFunctions;

// Monitor for game initialization
const originalStartGame = window.startGame;
if (originalStartGame) {
    window.startGame = function(...args) {
        console.log('🎮 Game starting, applying player development fixes...');
        const result = originalStartGame.apply(this, args);
        applyPlayerDevelopmentFixes();
        return result;
    };
}

console.log('🔧 Player Development Issue Fix loaded successfully!');
console.log('📋 Available commands:');
console.log('  - applyPlayerDevelopmentFixes() - Apply the fixes');
console.log('  - restoreOriginalDevelopmentFunctions() - Restore original functions');
console.log('🎯 This fix addresses:');
console.log('  - Case-sensitive name matching in multiplayer');
console.log('  - Missing development buttons for players');
console.log('  - Enhanced ownership validation');
console.log('  - Better error handling and user feedback');

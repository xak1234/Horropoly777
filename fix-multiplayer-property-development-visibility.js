// Fix for multiplayer property development visibility issue
// This addresses the problem where development buttons don't show even when players have complete sets

// Enhanced property ownership debugging function
function debugPropertyOwnership(playerName = null) {
    console.log('🏠 === PROPERTY OWNERSHIP DEBUG ===');
    
    if (playerName) {
        const player = players.find(p => p.name.toLowerCase() === playerName.toLowerCase());
        if (!player) {
            console.log(`❌ Player "${playerName}" not found`);
            return;
        }
        debugSinglePlayerOwnership(player);
    } else {
        // Debug all players
        players.forEach(player => {
            debugSinglePlayerOwnership(player);
        });
    }
    
    console.log('🏠 === END PROPERTY DEBUG ===');
}

function debugSinglePlayerOwnership(player) {
    console.log(`\n👤 Player: ${player.name} (${player.colorName})`);
    
    // Group properties by their groups
    const propertiesByGroup = {};
    
    // Check all property squares for this player
    Object.entries(propertyState).forEach(([square, state]) => {
        if (state.owner === player.name) {
            const propertyInfo = getPropertyInfo(square);
            if (propertyInfo) {
                const group = propertyInfo.group;
                if (!propertiesByGroup[group]) {
                    propertiesByGroup[group] = [];
                }
                propertiesByGroup[group].push(square);
            }
        }
    });
    
    // Check each group for completeness
    Object.entries(propertyGroups).forEach(([groupName, groupInfo]) => {
        const ownedInGroup = propertiesByGroup[groupName] || [];
        const totalInGroup = groupInfo.positions.length;
        const completionThreshold = groupName === 'demon' ? 4 : 3;
        const isComplete = ownedInGroup.length >= completionThreshold && ownedInGroup.length === totalInGroup;
        
        if (ownedInGroup.length > 0) {
            console.log(`  📍 ${groupName}: ${ownedInGroup.length}/${totalInGroup} (${ownedInGroup.join(', ')}) ${isComplete ? '✅ COMPLETE' : '❌ Incomplete'}`);
            
            if (!isComplete && ownedInGroup.length > 0) {
                const missing = groupInfo.positions.filter(pos => !ownedInGroup.includes(pos));
                console.log(`    Missing: ${missing.join(', ')}`);
                missing.forEach(pos => {
                    const owner = propertyState[pos]?.owner;
                    console.log(`      ${pos}: ${owner || 'Unowned'}`);
                });
            }
        }
    });
}

// Enhanced canDevelopProperty function with better debugging
function canDevelopPropertyEnhanced(player, square) {
    const property = propertyState[square];
    
    // Get player name with fallback for corrupted data
    let playerName = player.name;
    if (!playerName || playerName === 'undefined') {
        if (window.localPlayerName && players[currentPlayerIndex] === player) {
            playerName = window.localPlayerName;
            console.log(`canDevelopPropertyEnhanced: Using fallback name "${playerName}" for corrupted player data`);
        } else {
            console.warn('canDevelopPropertyEnhanced: Player name is undefined/corrupted:', player);
            return false;
        }
    }
    
    console.log(`🏗️ canDevelopPropertyEnhanced: Checking ${square} for ${playerName}`);
    
    if (!property || property.owner !== playerName) {
        console.log(`❌ Ownership check failed: property exists=${!!property}, owner="${property?.owner}", expected="${playerName}"`);
        return false;
    }
    
    const propertyInfo = getPropertyInfo(square);
    if (!propertyInfo) {
        console.log(`❌ No property info found for ${square}`);
        return false;
    }
    
    // Cave properties cannot be developed
    if (propertyInfo.group === 'cave') {
        console.log(`❌ Cave properties cannot be developed`);
        return false;
    }
    
    // Check if already fully developed
    if (property.hasCrypt) {
        console.log(`❌ Property already has crypt (fully developed)`);
        return false;
    }
    
    // Check group ownership with enhanced debugging
    const groupOwnership = checkGroupOwnershipEnhanced(player, propertyInfo.group);
    if (!groupOwnership.ownsFullGroup) {
        console.log(`❌ Does not own full ${propertyInfo.group} group:`);
        console.log(`   Owned: ${groupOwnership.ownedProperties.join(', ')} (${groupOwnership.ownedCount}/${groupOwnership.totalCount})`);
        console.log(`   Missing: ${groupOwnership.missingProperties.join(', ')}`);
        groupOwnership.missingProperties.forEach(pos => {
            const owner = propertyState[pos]?.owner;
            console.log(`     ${pos}: ${owner || 'Unowned'}`);
        });
        return false;
    }
    
    console.log(`✅ Can develop ${square}: owns full ${propertyInfo.group} group, graveyards=${property.graveyards}, hasCrypt=${property.hasCrypt}`);
    return true;
}

// Enhanced group ownership check
function checkGroupOwnershipEnhanced(player, group) {
    let playerName = player.name;
    if (!playerName || playerName === 'undefined') {
        if (window.localPlayerName && players[currentPlayerIndex] === player) {
            playerName = window.localPlayerName;
        } else {
            console.warn('checkGroupOwnershipEnhanced: Player name is undefined/corrupted:', player);
            return {
                ownsFullGroup: false,
                ownedProperties: [],
                missingProperties: propertyGroups[group]?.positions || [],
                ownedCount: 0,
                totalCount: propertyGroups[group]?.positions?.length || 0
            };
        }
    }
    
    const groupPositions = propertyGroups[group]?.positions || [];
    const ownedProperties = [];
    const missingProperties = [];
    
    groupPositions.forEach(pos => {
        if (propertyState[pos]?.owner === playerName) {
            ownedProperties.push(pos);
        } else {
            missingProperties.push(pos);
        }
    });
    
    const ownsFullGroup = ownedProperties.length === groupPositions.length;
    
    return {
        ownsFullGroup,
        ownedProperties,
        missingProperties,
        ownedCount: ownedProperties.length,
        totalCount: groupPositions.length
    };
}

// Enhanced updateInfoPanel function that forces property development checks
function updateInfoPanelEnhanced(die1 = null, die2 = null, propertyInfo = null) {
    console.log('🔄 updateInfoPanelEnhanced called');
    
    // Call the original function first
    updateInfoPanel(die1, die2, propertyInfo);
    
    // Then perform enhanced development button checks
    setTimeout(() => {
        checkAndShowDevelopmentButtons();
    }, 100);
}

// Function to check and show development buttons for all owned properties
function checkAndShowDevelopmentButtons() {
    if (!isMultiplayerGame) return;
    
    const currentPlayer = players[currentPlayerIndex];
    if (!currentPlayer) return;
    
    // Get local player name for multiplayer
    const localPlayerName = window.localPlayerName || document.getElementById('player1-name')?.value;
    if (!localPlayerName) return;
    
    // Only show development options for the local player
    const localPlayer = players.find(p => p.name.toLowerCase() === localPlayerName.toLowerCase());
    if (!localPlayer) return;
    
    console.log(`🏗️ Checking development options for local player: ${localPlayer.name}`);
    
    // Check if local player can develop any properties
    const developableProperties = [];
    
    Object.entries(propertyState).forEach(([square, state]) => {
        if (state.owner === localPlayer.name) {
            if (canDevelopPropertyEnhanced(localPlayer, square)) {
                developableProperties.push(square);
            }
        }
    });
    
    console.log(`🏗️ Developable properties for ${localPlayer.name}:`, developableProperties);
    
    // If the current player is the local player and they're on a developable property, show the button
    if (currentPlayer.name === localPlayer.name && developableProperties.includes(currentPlayer.currentSquare)) {
        const propertyInfo = getPropertyInfo(currentPlayer.currentSquare);
        if (propertyInfo) {
            console.log(`🏗️ Forcing development UI for ${currentPlayer.currentSquare}`);
            showDevelopmentOptionsForProperty(currentPlayer, currentPlayer.currentSquare);
        }
    }
}

// Function to force refresh property development visibility
function refreshPropertyDevelopmentVisibility() {
    console.log('🔄 Refreshing property development visibility...');
    
    // Debug current property ownership
    debugPropertyOwnership();
    
    // Force update info panel
    updateInfoPanelEnhanced();
    
    // Check for development opportunities
    checkAndShowDevelopmentButtons();
}

// Override the original functions with enhanced versions
if (typeof window !== 'undefined') {
    // Store original functions
    window.originalCanDevelopProperty = window.canDevelopProperty || canDevelopProperty;
    window.originalOwnsFullGroup = window.ownsFullGroup || ownsFullGroup;
    
    // Replace with enhanced versions
    window.canDevelopProperty = canDevelopPropertyEnhanced;
    window.ownsFullGroup = (player, group) => checkGroupOwnershipEnhanced(player, group).ownsFullGroup;
    
    // Add debug functions to window for console access
    window.debugPropertyOwnership = debugPropertyOwnership;
    window.refreshPropertyDevelopmentVisibility = refreshPropertyDevelopmentVisibility;
    window.checkAndShowDevelopmentButtons = checkAndShowDevelopmentButtons;
    
    console.log('✅ Enhanced property development functions loaded');
    console.log('💡 Available debug functions:');
    console.log('   - debugPropertyOwnership() - Debug all players');
    console.log('   - debugPropertyOwnership("PlayerName") - Debug specific player');
    console.log('   - refreshPropertyDevelopmentVisibility() - Force refresh development UI');
    console.log('   - checkAndShowDevelopmentButtons() - Check development opportunities');
}

// Auto-refresh on load
if (typeof players !== 'undefined' && players.length > 0) {
    setTimeout(() => {
        refreshPropertyDevelopmentVisibility();
    }, 1000);
}

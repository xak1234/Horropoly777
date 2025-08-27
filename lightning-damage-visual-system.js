// Lightning Damage Visual System
// Tracks lightning-damaged properties and displays red X marks in player panels

console.log('⚡ Loading Lightning Damage Visual System...');

// Global tracking for lightning-damaged properties
window.lightningDamagedProperties = window.lightningDamagedProperties || new Set();

// Function to mark a property as lightning-damaged
function markPropertyAsLightningDamaged(property) {
    if (!property) return;
    
    console.log(`⚡ Marking property ${property} as lightning-damaged`);
    window.lightningDamagedProperties.add(property);
    
    // Update the bottom player display to show the red X
    if (typeof updateBottomPlayerDisplay === 'function') {
        updateBottomPlayerDisplay();
    }
    
    // Also update the main game frame if needed
    if (typeof updateGameFrame === 'function') {
        updateGameFrame();
    }
}

// Function to clear lightning damage from a property (when it's repaired/redeveloped)
function clearLightningDamageFromProperty(property) {
    if (!property) return;
    
    console.log(`⚡ Clearing lightning damage from property ${property}`);
    window.lightningDamagedProperties.delete(property);
    
    // Update displays
    if (typeof updateBottomPlayerDisplay === 'function') {
        updateBottomPlayerDisplay();
    }
    
    if (typeof updateGameFrame === 'function') {
        updateGameFrame();
    }
}

// Function to check if a property is lightning-damaged
function isPropertyLightningDamaged(property) {
    return window.lightningDamagedProperties.has(property);
}

// Enhanced version of the original applyLightningPropertyEffects function
// This version tracks when properties are damaged by lightning
const originalApplyLightningPropertyEffects = window.applyLightningPropertyEffects;

async function enhancedApplyLightningPropertyEffectsWithVisuals(property) {
    console.log(`⚡ [Visual System] Applying lightning effects to property: ${property}`);
    
    const propertyData = propertyState[property];
    
    if (!propertyData) {
        console.log(`⚡ [Visual System] Property ${property} not found in propertyState`);
        return null;
    }
    
    // If property is not owned, no visual effect needed
    if (!propertyData.owner) {
        console.log(`⚡ [Visual System] Property ${property} is unowned - no visual effects applied`);
        return null;
    }
    
    let effectMessage = '';
    let propertyChanged = false;
    let wasLightningDamaged = false;
    
    // Find the owner player object
    const ownerPlayer = players.find(p => p.name === propertyData.owner);
    if (!ownerPlayer) {
        console.log(`⚡ [Visual System] Owner ${propertyData.owner} not found - no effects applied`);
        return null;
    }
    
    // Get property display name for messages
    const propertyInfo = getPropertyInfo(property);
    const displayName = propertyInfo ? getPropertyDisplayName(propertyInfo) : 'Unknown Location';
    
    console.log(`⚡ [Visual System] Applying property effects to ${displayName} owned by ${propertyData.owner}`);
    console.log(`⚡ [Visual System] Current state: graveyards: ${propertyData.graveyards}, hasCrypt: ${propertyData.hasCrypt}`);
    
    // Lightning strike logic:
    // 1. If crypt present: remove crypt and replace with 4 graveyards
    if (propertyData.hasCrypt) {
        propertyData.hasCrypt = false;
        propertyData.graveyards = 4; // Replace crypt with 4 graveyards
        effectMessage = `⚡ The crypt on ${displayName} was destroyed by lightning and replaced with 4 graveyards!`;
        propertyChanged = true;
        wasLightningDamaged = true;
        console.log(`⚡ [Visual System] Removed crypt from ${displayName} and added 4 graveyards`);
    }
    // 2. If graveyards present: remove 1 graveyard
    else if (propertyData.graveyards > 0) {
        propertyData.graveyards--;
        const remaining = propertyData.graveyards;
        if (remaining > 0) {
            effectMessage = `⚡ A graveyard on ${displayName} was destroyed by lightning! ${remaining} graveyard${remaining > 1 ? 's' : ''} remaining.`;
        } else {
            effectMessage = `⚡ The last graveyard on ${displayName} was destroyed by lightning! Property now has no developments.`;
        }
        propertyChanged = true;
        wasLightningDamaged = true;
        console.log(`⚡ [Visual System] Removed 1 graveyard from ${displayName}, remaining: ${propertyData.graveyards}`);
    }
    // 3. If no developments: remove ownership
    else {
        // Remove property from owner's property list
        const propertyIndex = ownerPlayer.properties.indexOf(property);
        if (propertyIndex !== -1) {
            ownerPlayer.properties.splice(propertyIndex, 1);
        }
        
        // Clear ownership
        propertyData.owner = null;
        propertyData.ownerColor = null;
        propertyData.declined = false; // Reset declined status
        
        effectMessage = `⚡ ${ownerPlayer.name} lost ownership of ${displayName} due to lightning strike!`;
        propertyChanged = true;
        console.log(`⚡ [Visual System] Removed ownership of ${displayName} from ${ownerPlayer.name}`);
        
        // Clear any lightning damage since property is no longer owned
        clearLightningDamageFromProperty(property);
    }
    
    // Mark property as lightning-damaged if it was damaged but still owned
    if (wasLightningDamaged && propertyData.owner) {
        markPropertyAsLightningDamaged(property);
        
        // Show visual feedback for lightning damage
        showFlashMessage(`⚡ LIGHTNING DAMAGE! ⚡`, '#ff0000', 'lightningDamage');
        
        // Play lightning damage sound if available
        if (typeof playStrikeHouseSound === 'function') {
            playStrikeHouseSound();
        } else if (typeof playStrikeSound === 'function') {
            playStrikeSound();
        }
    }
    
    // Update game displays if property changed
    if (propertyChanged) {
        // Sync property state in multiplayer
        if (isMultiplayerGame && typeof syncPropertyState === 'function') {
            try {
                await syncPropertyState(property, propertyData);
            } catch (error) {
                console.warn('Failed to sync lightning property changes:', error);
            }
        }
        
        // Update displays
        updateInfoPanel();
        if (typeof updateGameFrame === 'function') {
            updateGameFrame();
        }
        
        console.log(`⚡ [Visual System] Property ${property} updated:`, propertyData);
    }
    
    return effectMessage;
}

// Enhanced updateBottomPlayerDisplay function that shows red X for lightning-damaged properties
const originalUpdateBottomPlayerDisplay = window.updateBottomPlayerDisplay;

function enhancedUpdateBottomPlayerDisplayWithLightningVisuals() {
    const bottomPlayerDisplay = document.getElementById('bottom-player-display');
    const bottomPlayerContent = document.getElementById('bottom-player-content');
    
    if (!bottomPlayerDisplay || !bottomPlayerContent) {
        console.log('Bottom player display elements not found');
        return;
    }
    
    // Enhanced mobile visibility handling
    if (typeof ensureBottomPlayerVisibility === 'function') {
        ensureBottomPlayerVisibility(bottomPlayerDisplay);
    }
    
    // Show the bottom player display if it's hidden
    if (bottomPlayerDisplay.style.display === 'none') {
        bottomPlayerDisplay.style.display = 'block';
    }
    
    // Clear existing content
    bottomPlayerContent.innerHTML = '';
    
    // Check if we have players
    if (!players || players.length === 0) {
        bottomPlayerDisplay.style.display = 'none';
        return;
    }
    
    // Detect mobile device for responsive styling
    const isMobileDevice = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Create player items for the bottom display
    players.forEach((player, index) => {
        const isCurrentPlayer = index === currentPlayerIndex;
        
        // Create player item container - single line layout
        const playerItem = document.createElement('div');
        playerItem.className = `bottom-player-item ${isCurrentPlayer ? 'current-player' : ''}`;
        playerItem.style.cssText = `
            width: 100%;
            display: flex; 
            align-items: center; 
            gap: ${isMobileDevice ? '6px' : '10px'}; 
            padding: ${isMobileDevice ? '4px 6px' : '6px 10px'}; 
            margin-bottom: ${isMobileDevice ? '2px' : '3px'};
            background: ${isCurrentPlayer ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.12)'};
            border: ${isCurrentPlayer ? '2px solid rgba(255, 255, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.2)'};
            border-radius: 4px;
            font-size: ${isMobileDevice ? '11px' : '12px'};
            line-height: 1.2;
            overflow: hidden;
            flex-wrap: wrap;
        `;
        
        // Create star indicator and token
        const tokenSection = document.createElement('span');
        tokenSection.style.cssText = `display: flex; align-items: center; gap: 4px; flex-shrink: 0;`;
        
        // Star indicator
        const starSpan = document.createElement('span');
        starSpan.className = 'bottom-player-star';
        starSpan.textContent = '★';
        starSpan.style.cssText = `color: ${player.color || '#ffd700'}; font-size: ${isMobileDevice ? '12px' : '14px'}; text-shadow: 0 0 4px ${player.color || '#ffd700'};`;
        tokenSection.appendChild(starSpan);
        
        // Token image if available
        if (player.image && player.image.src) {
            const tokenImg = document.createElement('img');
            tokenImg.src = player.image.src;
            tokenImg.alt = `${player.name} token`;
            tokenImg.style.cssText = `width: ${isMobileDevice ? '16px' : '20px'}; height: ${isMobileDevice ? '16px' : '20px'}; border-radius: 2px;`;
            tokenSection.appendChild(tokenImg);
        }
        
        // Player name
        const nameSpan = document.createElement('span');
        nameSpan.className = 'bottom-player-name';
        nameSpan.textContent = player.name || 'Unknown';
        nameSpan.style.cssText = `
            font-weight: bold; 
            color: ${player.color || '#fff'}; 
            text-shadow: 0 0 4px ${player.color || '#fff'};
            flex-shrink: 0;
            min-width: ${isMobileDevice ? '50px' : '70px'};
        `;
        
        // Money display
        const moneySpan = document.createElement('span');
        moneySpan.className = 'bottom-player-money';
        if (player.bankrupt || player.money <= 0) {
            moneySpan.textContent = 'BANKRUPT';
            moneySpan.style.cssText = 'color: #ff4444; font-weight: bold; flex-shrink: 0;';
        } else {
            moneySpan.textContent = `£${player.money || 0}`;
            moneySpan.style.cssText = 'color: #90EE90; font-weight: bold; flex-shrink: 0;';
        }
        
        // Properties display with lightning damage indicators
        const propertiesSpan = document.createElement('span');
        propertiesSpan.className = 'bottom-player-properties';
        propertiesSpan.style.cssText = `
            flex: 1; 
            overflow: hidden; 
            text-overflow: ellipsis; 
            white-space: nowrap;
            font-size: ${isMobileDevice ? '10px' : '11px'};
            color: #ccc;
            min-width: 0;
        `;
        
        // Build properties list with lightning damage indicators
        if (Array.isArray(player.properties) && player.properties.length > 0) {
            // Group properties by color/group and aggregate developments for compact display
            const ownedGroups = {};
            
            player.properties.forEach(square => {
                const propInfo = getPropertyInfo(square);
                if (!propInfo) return;
                
                const groupName = propInfo.group;
                if (!ownedGroups[groupName]) {
                    ownedGroups[groupName] = {
                        color: propInfo.color,
                        properties: [],
                        totalGraveyards: 0,
                        totalCrypts: 0,
                        lightningDamaged: []
                    };
                }
                
                const state = propInfo.state || {};
                const isLightningDamaged = isPropertyLightningDamaged(square);
                
                ownedGroups[groupName].properties.push({
                    square: square,
                    graveyards: Number(state.graveyards || 0),
                    hasCrypt: !!state.hasCrypt,
                    isLightningDamaged: isLightningDamaged
                });
                
                ownedGroups[groupName].totalGraveyards += Number(state.graveyards || 0);
                if (state.hasCrypt) ownedGroups[groupName].totalCrypts += 1;
                if (isLightningDamaged) ownedGroups[groupName].lightningDamaged.push(square);
            });
            
            // Format properties for display with lightning damage indicators
            const propertyDisplays = Object.entries(ownedGroups)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([groupName, groupData]) => {
                    const totalInGroup = (propertyGroups[groupName] && propertyGroups[groupName].positions) ? propertyGroups[groupName].positions.length : groupData.properties.length;
                    const ownedCount = groupData.properties.length;
                    const ownsSet = ownedCount === totalInGroup && totalInGroup > 0;
                    const lightningDamagedCount = groupData.lightningDamaged.length;
                    
                    // Dot sizing: enlarge single dot if set is complete
                    const dotSize = ownsSet ? (isMobileDevice ? 18 : 20) : (isMobileDevice ? 12 : 14);
                    let dotsHtml = '';
                    
                    if (ownsSet && lightningDamagedCount === 0) {
                        // Complete set, no lightning damage - show single large dot
                        dotsHtml = `<span style="color: ${groupData.color}; font-weight: bold; font-size: ${dotSize}px; line-height: 1;">●</span>`;
                    } else {
                        // Show individual dots with lightning damage indicators
                        dotsHtml = groupData.properties.map(prop => {
                            if (prop.isLightningDamaged) {
                                // Red X for lightning-damaged properties
                                return `<span style="color: #ff0000; font-weight: bold; font-size: ${dotSize}px; line-height: 1; text-shadow: 0 0 4px #ff0000;" title="Lightning Damaged Property">✗</span>`;
                            } else {
                                // Normal colored dot
                                return `<span style="color: ${groupData.color}; font-weight: bold; font-size: ${dotSize}px; line-height: 1;">●</span>`;
                            }
                        }).join('');
                    }
                    
                    // Aggregate development badges (space-saving)
                    let devHtml = '';
                    if (groupData.totalGraveyards > 0) {
                        devHtml += `<span style="margin-left: 2px;">🪦${groupData.totalGraveyards > 1 ? groupData.totalGraveyards : ''}</span>`;
                    }
                    if (groupData.totalCrypts > 0) {
                        devHtml += `<span style="margin-left: 2px;">🏰${groupData.totalCrypts > 1 ? groupData.totalCrypts : ''}</span>`;
                    }
                    
                    // Add lightning damage indicator if any properties in this group are damaged
                    if (lightningDamagedCount > 0) {
                        devHtml += `<span style="margin-left: 2px; color: #ff0000; text-shadow: 0 0 4px #ff0000;" title="${lightningDamagedCount} lightning-damaged propert${lightningDamagedCount > 1 ? 'ies' : 'y'}">⚡</span>`;
                    }
                    
                    return `${dotsHtml}${devHtml}`;
                });
            
            // Join property groups with small spacing to separate groups
            propertiesSpan.innerHTML = propertyDisplays.join('<span style="margin: 0 2px;"></span>');
            
            // Enhanced tooltip with lightning damage info
            const lightningDamagedTotal = player.properties.filter(prop => isPropertyLightningDamaged(prop)).length;
            let tooltipText = `${player.properties.length} properties owned`;
            if (lightningDamagedTotal > 0) {
                tooltipText += `, ${lightningDamagedTotal} lightning-damaged`;
            }
            propertiesSpan.title = tooltipText;
        } else {
            propertiesSpan.textContent = 'Nada!';
            propertiesSpan.style.fontStyle = 'italic';
        }
        
        // Steal cards indicator
        let stealCardsSpan = null;
        if (player.stealCards && player.stealCards > 0) {
            stealCardsSpan = document.createElement('span');
            stealCardsSpan.style.cssText = `
                color: #00ff00; 
                font-size: ${isMobileDevice ? '10px' : '11px'}; 
                flex-shrink: 0;
                text-shadow: 0 0 4px #00ff00;
            `;
            stealCardsSpan.innerHTML = `<img src="assets/images/spades.png" style="width: 12px; height: 12px; vertical-align: middle; margin-right: 2px;">${player.stealCards}`;
            stealCardsSpan.title = `${player.stealCards} steal card${player.stealCards > 1 ? 's' : ''}`;
        }
        
        // Assemble the player item
        playerItem.appendChild(tokenSection);
        if (stealCardsSpan) {
            playerItem.appendChild(stealCardsSpan);
        }
        playerItem.appendChild(nameSpan);
        playerItem.appendChild(moneySpan);
        playerItem.appendChild(propertiesSpan);
        
        bottomPlayerContent.appendChild(playerItem);
    });
    
    console.log('✅ Enhanced bottom player display updated with lightning damage indicators');
}

// Function to clear lightning damage when property is developed (repaired)
function clearLightningDamageOnDevelopment(property) {
    if (isPropertyLightningDamaged(property)) {
        console.log(`⚡ Clearing lightning damage from ${property} due to development/repair`);
        clearLightningDamageFromProperty(property);
        showFlashMessage(`🔧 Property Repaired! 🔧`, '#00ff00', 'propertyRepaired');
    }
}

// Hook into property development to clear lightning damage
const originalDevelopProperty = window.developProperty;
if (originalDevelopProperty) {
    window.developProperty = function(player, square) {
        const result = originalDevelopProperty.call(this, player, square);
        if (result) {
            // Property was successfully developed, clear any lightning damage
            clearLightningDamageOnDevelopment(square);
        }
        return result;
    };
}

// Apply the enhancements
function applyLightningDamageVisualSystem() {
    console.log('⚡ Applying Lightning Damage Visual System...');
    
    // Replace the lightning property effects function
    window.applyLightningPropertyEffects = enhancedApplyLightningPropertyEffectsWithVisuals;
    
    // Replace the bottom player display function
    window.updateBottomPlayerDisplay = enhancedUpdateBottomPlayerDisplayWithLightningVisuals;
    
    // Make functions globally available
    window.markPropertyAsLightningDamaged = markPropertyAsLightningDamaged;
    window.clearLightningDamageFromProperty = clearLightningDamageFromProperty;
    window.isPropertyLightningDamaged = isPropertyLightningDamaged;
    window.clearLightningDamageOnDevelopment = clearLightningDamageOnDevelopment;
    
    console.log('✅ Lightning Damage Visual System applied successfully!');
    
    // Update display immediately if game is running
    if (typeof players !== 'undefined' && players && players.length > 0) {
        enhancedUpdateBottomPlayerDisplayWithLightningVisuals();
    }
    
    showAdvisory('⚡ Lightning damage visual indicators enabled!', 'info');
}

// Auto-apply the system
applyLightningDamageVisualSystem();

// Export functions for testing
window.LightningDamageVisualSystem = {
    markPropertyAsLightningDamaged,
    clearLightningDamageFromProperty,
    isPropertyLightningDamaged,
    clearLightningDamageOnDevelopment,
    applyLightningDamageVisualSystem
};

console.log('⚡ Lightning Damage Visual System loaded successfully!');

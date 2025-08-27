// Modified property development rules
// Allow development with 3+ properties (4+ for demon group)

function checkDetailedGroupOwnership(player, group) {
    // Get player name with fallback
    let playerName = player?.name;
    if (!playerName || playerName === 'undefined' || playerName === 'null') {
        if (window.localPlayerName && players[currentPlayerIndex] === player) {
            playerName = window.localPlayerName;
        }
    }

    if (!playerName) {
        console.warn('checkDetailedGroupOwnership: Could not resolve player name:', player);
        return {
            ownsEnough: false,
            ownedProperties: [],
            missingProperties: [],
            ownedCount: 0,
            requiredCount: 3
        };
    }

    const groupPositions = propertyGroups[group].positions;
    const ownedProperties = [];
    const missingProperties = [];

    // Check each property in the group
    groupPositions.forEach(pos => {
        if (propertyState[pos]?.owner === playerName) {
            ownedProperties.push(pos);
        } else {
            missingProperties.push(pos);
            console.log(`[checkDetailedGroupOwnership] Checking ${pos}: owner is "${propertyState[pos]?.owner}", expecting "${playerName}"`);
        }
    });

    // Required count is 4 for demon group, 3 for others
    const requiredCount = group === 'demon' ? 4 : 3;
    
    // Changed: Now allows development with 3 or more properties (4 or more for demon)
    const ownsEnough = ownedProperties.length >= requiredCount;

    return {
        ownsEnough,
        ownedProperties,
        missingProperties,
        ownedCount: ownedProperties.length,
        requiredCount
    };
}

// Modified canDevelopProperty function
function canDevelopProperty(player, square) {
    const property = propertyState[square];
    
    // Enhanced player name resolution for multiplayer
    let playerName = player?.name;
    if (!playerName || playerName === 'undefined' || playerName === 'null') {
        if (window.localPlayerName && players[currentPlayerIndex] === player) {
            playerName = window.localPlayerName;
            console.log(`canDevelopProperty: Using window.localPlayerName fallback: "${playerName}"`);
        } else if (isMultiplayerGame) {
            const inputName = document.getElementById('player1-name')?.value?.trim();
            if (inputName && players[currentPlayerIndex] === player) {
                playerName = inputName;
                console.log(`canDevelopProperty: Using input fallback: "${playerName}"`);
            }
        }
        
        if (!playerName) {
            console.warn('canDevelopProperty: Could not resolve player name:', player);
            return false;
        }
    }
    
    // Enhanced debug logging for property development checks
    console.log(`🏗️ canDevelopProperty: Checking ${square} for "${playerName}". Property owner: "${property?.owner}"`);
    
    if (!property || property.owner !== playerName) {
        console.log(`❌ Ownership check failed: property=${!!property}, owner="${property?.owner}", expected="${playerName}"`);
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
        console.log(`❌ Property ${square} already has crypt (fully developed)`);
        return false;
    }
    
    // Check group ownership with new rules (3+ properties, 4+ for demon)
    const groupOwnership = checkDetailedGroupOwnership(player, propertyInfo.group);
    if (!groupOwnership.ownsEnough) {
        console.log(`❌ ${playerName} does not own enough properties in ${propertyInfo.group} group:`);
        console.log(`[canDevelopProperty] Owned: ${groupOwnership.ownedProperties.join(', ')} (${groupOwnership.ownedCount}/${groupOwnership.requiredCount})`);
        console.log(`[canDevelopProperty] Missing: ${groupOwnership.missingProperties.join(', ')}`);
        groupOwnership.missingProperties.forEach(pos => {
            const owner = propertyState[pos]?.owner;
            console.log(`[canDevelopProperty] ${pos}: owner is ${owner || 'Unowned'}`);
        });
        return false;
    }
    
    return true;
}

// Modified checkPropertySetCompletion function
function checkPropertySetCompletion(player, newProperty) {
    let playerName = player?.name;
    if (!playerName || playerName === 'undefined' || playerName === 'null') {
        if (window.localPlayerName && players[currentPlayerIndex] === player) {
            playerName = window.localPlayerName;
        } else {
            console.warn('checkPropertySetCompletion: Player name is undefined/corrupted:', player);
            return false;
        }
    }
    
    const propertyInfo = getPropertyInfo(newProperty);
    if (!propertyInfo) return false;
    
    const group = propertyInfo.group;
    const groupPositions = propertyGroups[group].positions;
    
    // Count how many properties in this group the player owns (including the new one)
    const ownedInGroup = groupPositions.filter(pos => 
        propertyState[pos].owner === playerName
    ).length;
    
    // Changed: Now considers 3+ properties (4+ for demon) as a completed set
    const completionThreshold = group === 'demon' ? 4 : 3;
    
    if (ownedInGroup >= completionThreshold) {
        console.log(`[checkPropertySetCompletion] ${playerName} has enough properties (${ownedInGroup}) in the ${group} group with ${newProperty}!`);
        return true;
    }
    
    return false;
}

// Apply the fix
console.log('🔧 Applying property development rules fix...');
window.checkDetailedGroupOwnership = checkDetailedGroupOwnership;
window.canDevelopProperty = canDevelopProperty;
window.checkPropertySetCompletion = checkPropertySetCompletion;
console.log('✅ Property development rules updated: Now allows development with 3+ properties (4+ for demon group)!');

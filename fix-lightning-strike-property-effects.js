// Fix for Lightning Strike Property Effects
// This script enhances lightning strike effects to properly affect properties

console.log('⚡ Loading Lightning Strike Property Effects Fix...');

// Store original functions for restoration if needed
const originalApplyLightningPropertyEffects = window.applyLightningPropertyEffects;
const originalTriggerLightningStrike = window.triggerLightningStrike;

// Enhanced lightning property effects with better visual feedback and validation
async function enhancedApplyLightningPropertyEffects(property) {
    console.log(`⚡ [Enhanced] Applying lightning effects to property: ${property}`);
    
    const propertyData = propertyState[property];
    
    if (!propertyData) {
        console.log(`⚡ [Enhanced] Property ${property} not found in propertyState`);
        return null;
    }
    
    // If property is not owned, no effect
    if (!propertyData.owner) {
        console.log(`⚡ [Enhanced] Property ${property} is unowned - no property effects applied`);
        return null;
    }
    
    let effectMessage = '';
    let propertyChanged = false;
    
    // Find the owner player object
    const ownerPlayer = players.find(p => p.name === propertyData.owner);
    if (!ownerPlayer) {
        console.log(`⚡ [Enhanced] Owner ${propertyData.owner} not found - no property effects applied`);
        return null;
    }
    
    // Get property display name for messages
    const propertyInfo = getPropertyInfo(property);
    const displayName = propertyInfo ? getPropertyDisplayName(propertyInfo) : 'Unknown Location';
    
    console.log(`⚡ [Enhanced] Applying property effects to ${displayName} owned by ${propertyData.owner}`);
    console.log(`⚡ [Enhanced] Current state: graveyards: ${propertyData.graveyards || 0}, hasCrypt: ${propertyData.hasCrypt || false}`);
    
    // ENHANCED: More dramatic lightning effects with better prioritization
    // Priority order: Remove most valuable development first
    
    // 1. Remove crypt if present (most valuable)
    if (propertyData.hasCrypt) {
        propertyData.hasCrypt = false;
        effectMessage = `⚡ LIGHTNING DESTROYS the crypt on ${displayName}! ${ownerPlayer.name} loses their most valuable development!`;
        propertyChanged = true;
        console.log(`⚡ [Enhanced] Removed crypt from ${displayName}`);
        
        // Play owned property strike sound
        if (typeof playStrikeHouseSound === 'function') {
            playStrikeHouseSound();
        } else if (typeof playStrikeSound === 'function') {
            playStrikeSound();
        }
        
        // Add visual effect for crypt destruction
        showFlashMessage(`💥 CRYPT DESTROYED! 💥`, '#ff0000', 'cryptDestroyed');
    }
    // 2. Remove one graveyard if present (and no crypt)
    else if (propertyData.graveyards > 0) {
        const graveyardsDestroyed = Math.min(propertyData.graveyards, 1); // Destroy 1 graveyard
        propertyData.graveyards -= graveyardsDestroyed;
        
        if (graveyardsDestroyed === 1) {
            effectMessage = `⚡ Lightning strikes ${displayName}! A graveyard is destroyed! ${ownerPlayer.name} now has ${propertyData.graveyards} graveyard(s) remaining.`;
        }
        
        propertyChanged = true;
        console.log(`⚡ [Enhanced] Removed ${graveyardsDestroyed} graveyard(s) from ${displayName}, remaining: ${propertyData.graveyards}`);
        
        // Play owned property strike sound
        if (typeof playStrikeHouseSound === 'function') {
            playStrikeHouseSound();
        } else if (typeof playStrikeSound === 'function') {
            playStrikeSound();
        }
        
        // Add visual effect for graveyard destruction
        showFlashMessage(`⚡ GRAVEYARD DESTROYED! ⚡`, '#ffff00', 'graveyardDestroyed');
    }
    // 3. Remove ownership if no developments (last resort)
    else {
        // ENHANCED: More dramatic ownership loss
        // Remove property from owner's property list
        const propertyIndex = ownerPlayer.properties.indexOf(property);
        if (propertyIndex !== -1) {
            ownerPlayer.properties.splice(propertyIndex, 1);
        }
        
        // Clear ownership
        propertyData.owner = null;
        propertyData.ownerColor = null;
        propertyData.declined = false; // Reset declined status
        
        effectMessage = `⚡ CATASTROPHIC LIGHTNING STRIKE! ${ownerPlayer.name} loses ownership of ${displayName} completely! The property is now available for purchase!`;
        propertyChanged = true;
        console.log(`⚡ [Enhanced] Removed ownership of ${displayName} from ${ownerPlayer.name}`);
        
        // Play owned property strike sound
        if (typeof playStrikeHouseSound === 'function') {
            playStrikeHouseSound();
        } else if (typeof playStrikeSound === 'function') {
            playStrikeSound();
        }
        
        // Add visual effect for ownership loss
        showFlashMessage(`💸 OWNERSHIP LOST! 💸`, '#ff6600', 'ownershipLost');
    }
    
    if (propertyChanged) {
        console.log(`⚡ [Enhanced] Property effect applied: ${effectMessage}`);
        
        // ENHANCED: Better visual feedback
        // Create a more dramatic visual effect
        createEnhancedLightningPropertyEffect(property, displayName);
        
        // Update game display immediately
        updateGameFrame();
        updateInfoPanel();
        
        // Show the effect message prominently
        showAdvisory(effectMessage, 'lightning');
        
        // ENHANCED: Better Firebase synchronization
        if (isMultiplayerGame && currentRoomId) {
            try {
                console.log(`⚡ [Enhanced] Syncing lightning effects to Firebase...`);
                
                // Update property state
                await updatePropertyState(property, propertyData);
                
                // Update owner's properties if ownership was removed
                if (!propertyData.owner && ownerPlayer) {
                    await updatePlayerData(ownerPlayer.name, {
                        properties: ownerPlayer.properties
                    });
                }
                
                console.log(`⚡ [Enhanced] Firebase sync completed successfully`);
            } catch (error) {
                console.error('⚡ [Enhanced] Error syncing lightning property effects to Firebase:', error);
                // Show error but don't fail the effect
                showAdvisory('Lightning effect applied locally, but sync failed. Other players may not see the change immediately.', 'warning');
            }
        }
        
        return effectMessage;
    }
    
    console.log(`⚡ [Enhanced] No property changes applied to ${displayName}`);
    return null;
}

// Enhanced lightning strike trigger with better property targeting
async function enhancedTriggerLightningStrike() {
    if (lightningActive || !isGameInitialized || isGameOver) {
        // Skip if lightning already active, game not started, or game over
        if (typeof scheduleLightningStrike === 'function') {
            scheduleLightningStrike(); // Reschedule for next strike
        }
        return;
    }
    
    lightningActive = true;
    console.log('⚡ [Enhanced] Lightning strike triggered!');
    
    // ENHANCED: Better property targeting - prefer developed properties
    const allProperties = ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9',
                          'b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8', 'b9',
                          'r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8', 'r9',
                          'l1', 'l2', 'l3', 'l4', 'l5', 'l6', 'l7', 'l8', 'l9'];
    
    // Categorize properties by development level for better targeting
    const ownedProperties = [];
    const developedProperties = [];
    const cryptProperties = [];
    
    allProperties.forEach(prop => {
        const state = propertyState[prop];
        if (state && state.owner) {
            ownedProperties.push(prop);
            
            if (state.hasCrypt) {
                cryptProperties.push(prop);
            } else if (state.graveyards > 0) {
                developedProperties.push(prop);
            }
        }
    });
    
    console.log(`⚡ [Enhanced] Property analysis: ${ownedProperties.length} owned, ${developedProperties.length} with graveyards, ${cryptProperties.length} with crypts`);
    
    // ENHANCED: Weighted selection - prefer more developed properties
    let targetProperty;
    const rand = Math.random();
    
    if (cryptProperties.length > 0 && rand < 0.4) {
        // 40% chance to target crypt properties (most dramatic)
        targetProperty = cryptProperties[Math.floor(Math.random() * cryptProperties.length)];
        console.log(`⚡ [Enhanced] Targeting crypt property: ${targetProperty}`);
    } else if (developedProperties.length > 0 && rand < 0.7) {
        // 30% chance to target developed properties
        targetProperty = developedProperties[Math.floor(Math.random() * developedProperties.length)];
        console.log(`⚡ [Enhanced] Targeting developed property: ${targetProperty}`);
    } else if (ownedProperties.length > 0) {
        // Target any owned property
        targetProperty = ownedProperties[Math.floor(Math.random() * ownedProperties.length)];
        console.log(`⚡ [Enhanced] Targeting owned property: ${targetProperty}`);
    } else {
        // Fallback to any property
        targetProperty = allProperties[Math.floor(Math.random() * allProperties.length)];
        console.log(`⚡ [Enhanced] Targeting random property: ${targetProperty}`);
    }
    
    const propertyPos = positionsMap?.get(targetProperty);
    
    if (!propertyPos) {
        console.error('⚡ [Enhanced] Could not find position for lightning strike property:', targetProperty);
        lightningActive = false;
        if (typeof scheduleLightningStrike === 'function') {
            scheduleLightningStrike();
        }
        return;
    }
    
    console.log(`⚡ [Enhanced] Lightning strikes ${targetProperty} at position (${propertyPos.x}, ${propertyPos.y})`);
    
    // Create enhanced lightning visual effect
    createEnhancedLightningEffect(propertyPos.x, propertyPos.y);
    
    // Create persistent scorch mark on the property
    if (typeof createScorchMark === 'function') {
        createScorchMark(targetProperty);
    }
    
    // Base lightning sound (optional)
    if (typeof playStrikeSound === 'function') {
        playStrikeSound();
    }
    
    // Check if any players are on this property
    const playersOnProperty = players.filter(p => p.currentSquare === targetProperty && !p.bankrupt);
    
    if (playersOnProperty.length > 0) {
        console.log(`⚡ [Enhanced] Lightning strikes ${playersOnProperty.length} player(s) on ${targetProperty}`);
        // Play player strike sound
        if (typeof playStrikePlayerSound === 'function') {
            playStrikePlayerSound();
        } else if (typeof playStrikeSound === 'function') {
            playStrikeSound();
        }
        
        for (const player of playersOnProperty) {
            console.log(`⚡ [Enhanced] Applying lightning penalty to ${player.name}`);
            if (typeof applyLightningPenalty === 'function') {
                await applyLightningPenalty(player, targetProperty);
            }
        }
    } else {
        console.log(`⚡ [Enhanced] Lightning strikes ${targetProperty} but no players are there`);
        
        // Get proper property display name
        const propertyInfo = getPropertyInfo(targetProperty);
        const displayName = propertyInfo ? getPropertyDisplayName(propertyInfo) : targetProperty;
        
        // Apply property effects even if no players are present
        const propertyEffectMessage = await enhancedApplyLightningPropertyEffects(targetProperty);
        
        // Determine if property is owned for message
        const propertyState_local = propertyState[targetProperty];
        const isUnowned = !propertyState_local || !propertyState_local.owner;
        
        let message;
        if (isUnowned) {
            // Simple message for unowned properties
            message = `⚡ Lightning Strikes ${displayName}! The empty property is scorched but undamaged.`;
        } else {
            // More detailed message for owned properties
            message = `⚡ Lightning strikes ${displayName}!`;
            if (propertyEffectMessage) {
                message = propertyEffectMessage; // Use the detailed effect message
            } else {
                message += ` Fortunately, no developments were damaged this time.`;
            }
        }
        
        showAdvisory(message, 'lightning');
        
        // Brief pause to show the effect
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Schedule next lightning strike
    setTimeout(() => {
        lightningActive = false;
        if (typeof scheduleLightningStrike === 'function') {
            scheduleLightningStrike();
        }
    }, 3000); // 3 second delay before next strike can be scheduled
}

// Enhanced visual effects for lightning property damage
function createEnhancedLightningPropertyEffect(property, displayName) {
    console.log(`⚡ [Enhanced] Creating enhanced visual effect for ${property}`);
    
    // Create multiple flash effects
    setTimeout(() => showFlashMessage('⚡ LIGHTNING STRIKE! ⚡', '#ffff00', 'lightningStrike1'), 0);
    setTimeout(() => showFlashMessage('💥 PROPERTY DAMAGED! 💥', '#ff4444', 'propertyDamage'), 500);
    setTimeout(() => showFlashMessage(`${displayName} AFFECTED!`, '#ff8800', 'propertyAffected'), 1000);
    
    // Screen flicker effect
    if (typeof createScreenFlicker === 'function') {
        createScreenFlicker();
    }
}

// Enhanced lightning visual effect
function createEnhancedLightningEffect(x, y) {
    console.log(`⚡ [Enhanced] Creating enhanced lightning effect at (${x}, ${y})`);
    
    // Call original lightning effect if available
    if (typeof createLightningEffect === 'function') {
        createLightningEffect(x, y);
    }
    
    // Add additional enhanced effects
    const canvas = document.getElementById('game-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        
        // Create multiple lightning bolts for more dramatic effect
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                ctx.save();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 4;
                ctx.shadowColor = '#ffff00';
                ctx.shadowBlur = 10;
                
                // Draw jagged lightning bolt
                ctx.beginPath();
                ctx.moveTo(x, 0);
                
                const segments = 8;
                const segmentHeight = y / segments;
                let currentX = x;
                
                for (let j = 1; j <= segments; j++) {
                    const nextX = currentX + (Math.random() - 0.5) * 40;
                    const nextY = j * segmentHeight;
                    ctx.lineTo(nextX, nextY);
                    currentX = nextX;
                }
                
                ctx.stroke();
                ctx.restore();
                
                // Clear after brief display
                setTimeout(() => {
                    updateGameFrame();
                }, 100);
            }, i * 200);
        }
    }
}

// Enhanced flash message function
function showFlashMessage(text, color, className) {
    const flashDiv = document.createElement('div');
    flashDiv.textContent = text;
    flashDiv.className = className;
    flashDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 48px;
        font-weight: bold;
        color: ${color};
        text-shadow: 0 0 20px ${color};
        z-index: 10000;
        pointer-events: none;
        animation: flashPulse 1s ease-in-out;
    `;
    
    // Add CSS animation if not already present
    if (!document.getElementById('flash-animation-style')) {
        const style = document.createElement('style');
        style.id = 'flash-animation-style';
        style.textContent = `
            @keyframes flashPulse {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
                50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(flashDiv);
    
    setTimeout(() => {
        if (flashDiv.parentNode) {
            flashDiv.parentNode.removeChild(flashDiv);
        }
    }, 1000);
}

// Apply the fixes
function applyLightningStrikeFixes() {
    console.log('⚡ Applying lightning strike property effects fixes...');
    
    // Replace the functions
    window.applyLightningPropertyEffects = enhancedApplyLightningPropertyEffects;
    window.triggerLightningStrike = enhancedTriggerLightningStrike;
    
    // Also patch global references
    if (typeof applyLightningPropertyEffects !== 'undefined') {
        applyLightningPropertyEffects = enhancedApplyLightningPropertyEffects;
    }
    if (typeof triggerLightningStrike !== 'undefined') {
        triggerLightningStrike = enhancedTriggerLightningStrike;
    }
    
    console.log('✅ Lightning strike fixes applied successfully!');
    showAdvisory('⚡ Lightning strike effects enhanced!', 'info');
}

// Restore original functions
function restoreOriginalLightningFunctions() {
    console.log('🔄 Restoring original lightning functions...');
    
    window.applyLightningPropertyEffects = originalApplyLightningPropertyEffects;
    window.triggerLightningStrike = originalTriggerLightningStrike;
    
    if (typeof applyLightningPropertyEffects !== 'undefined') {
        applyLightningPropertyEffects = originalApplyLightningPropertyEffects;
    }
    if (typeof triggerLightningStrike !== 'undefined') {
        triggerLightningStrike = originalTriggerLightningStrike;
    }
    
    console.log('✅ Original lightning functions restored!');
}

// Test function to trigger lightning on a specific property
function testLightningOnProperty(property) {
    console.log(`⚡ [Test] Testing lightning strike on property: ${property}`);
    
    if (!propertyState[property]) {
        console.error(`⚡ [Test] Property ${property} not found`);
        return;
    }
    
    // Force trigger lightning effect on specified property
    const propertyPos = positionsMap?.get(property);
    if (propertyPos) {
        createEnhancedLightningEffect(propertyPos.x, propertyPos.y);
        
        setTimeout(async () => {
            const result = await enhancedApplyLightningPropertyEffects(property);
            console.log(`⚡ [Test] Lightning test result: ${result || 'No effect'}`);
        }, 1000);
    }
}

// Auto-apply fixes when game is detected
if (typeof lightningActive !== 'undefined' && typeof propertyState !== 'undefined') {
    console.log('🎮 Game detected, auto-applying lightning strike fixes...');
    applyLightningStrikeFixes();
} else {
    console.log('📝 Fixes loaded, will apply when game starts');
}

// Expose functions for manual control
window.applyLightningStrikeFixes = applyLightningStrikeFixes;
window.restoreOriginalLightningFunctions = restoreOriginalLightningFunctions;
window.testLightningOnProperty = testLightningOnProperty;

console.log('⚡ Lightning Strike Property Effects Fix loaded successfully!');
console.log('📋 Available commands:');
console.log('  - applyLightningStrikeFixes() - Apply the fixes');
console.log('  - restoreOriginalLightningFunctions() - Restore original functions');
console.log('  - testLightningOnProperty("propertyCode") - Test lightning on specific property');
console.log('🎯 This fix enhances:');
console.log('  - Property targeting (prefers developed properties)');
console.log('  - Visual effects and feedback');
console.log('  - Firebase synchronization');
console.log('  - Dramatic effect messages');
console.log('  - Better property damage prioritization');

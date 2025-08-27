// Helper to reset property ownership/development
function resetPropertyState() {
    if (typeof propertyState === 'undefined' || typeof propertyGroups === 'undefined') {
        console.warn('[resetPropertyState] propertyState or propertyGroups not defined');
        return;
    }

    Object.entries(propertyGroups).forEach(([group, info]) => {
        info.positions.forEach(pos => {
            propertyState[pos] = {
                owner: null,
                ownerColor: null,
                graveyards: 0,
                hasCrypt: false,
                group: group,
                declined: false
            };
        });
    });

    console.log('[resetPropertyState] Property states reset to initial values');
}

// Restart game function
function restartGame() {
    console.log('[restartGame] Restarting game...');
    
    // Stop any ongoing music
    if (typeof stopAllMusic === 'function') {
        stopAllMusic();
    }
    
    // Clear any timeouts or intervals
    if (typeof autoRollTimeout !== 'undefined' && autoRollTimeout) {
        clearTimeout(autoRollTimeout);
        autoRollTimeout = null;
    }
    
    if (typeof eyeAnimationFrame !== 'undefined' && eyeAnimationFrame) {
        cancelAnimationFrame(eyeAnimationFrame);
        eyeAnimationFrame = null;
    }
    
    if (typeof gojailGlowTimeout !== 'undefined' && gojailGlowTimeout) {
        clearTimeout(gojailGlowTimeout);
        gojailGlowTimeout = null;
    }
    
    if (typeof gojailGravesShakeTimeout !== 'undefined' && gojailGravesShakeTimeout) {
        clearTimeout(gojailGravesShakeTimeout);
        gojailGravesShakeTimeout = null;
    }

    // Reset game state variables
    if (typeof players !== 'undefined') players = [];
    if (typeof currentPlayerIndex !== 'undefined') currentPlayerIndex = 0;
    if (typeof isAITurn !== 'undefined') isAITurn = false;
    if (typeof isRecordingEyes !== 'undefined') isRecordingEyes = false;
    if (typeof lastRollWasDoubles !== 'undefined') lastRollWasDoubles = false;
    if (typeof consecutiveDoublesCount !== 'undefined') consecutiveDoublesCount = 0;
    if (typeof isInitialRoll !== 'undefined') isInitialRoll = true;
    if (typeof isMultiplayerGame !== 'undefined') isMultiplayerGame = false;
    if (typeof isGameInitialized !== 'undefined') isGameInitialized = false;
    if (typeof isInitializing !== 'undefined') isInitializing = false;
    if (typeof gojailGlowActive !== 'undefined') gojailGlowActive = false;
    if (typeof gojailGravesShaking !== 'undefined') gojailGravesShaking = false;
    if (typeof isPlayerMoving !== 'undefined') isPlayerMoving = false;

    // Clear all property ownership and development
    if (typeof resetPropertyState === 'function') {
        resetPropertyState();
    }
    
    // Reset mobile pan position
    if (typeof isMobile !== 'undefined' && isMobile && typeof resetCanvasPan === 'function') {
        resetCanvasPan();
    }
    
    // Hide game container and show intro screen
    const gameContainer = document.getElementById('game-container');
    const infoPanel = document.getElementById('info-panel');
    const introScreen = document.getElementById('intro-screen');

    if (gameContainer) gameContainer.style.display = 'none';
    if (infoPanel) infoPanel.style.display = 'none';
    if (introScreen) introScreen.style.display = 'block';

    // Reset player selection window position/size
    const playerWindow = document.querySelector('.player-selection-window');
    if (playerWindow) {
        playerWindow.classList.remove('dragging');
        playerWindow.style.position = 'relative';
        playerWindow.style.left = '';
        playerWindow.style.top = '';
        playerWindow.style.margin = '';
        playerWindow.style.width = '';
        playerWindow.style.height = '';
    }
    
    // Reset game mode selection
    const vsAiBtn = document.getElementById('vs-ai-btn');
    const vsHumanBtn = document.getElementById('vs-human-btn');
    const aiOptions = document.getElementById('ai-options');
    const multiplayerControls = document.getElementById('multiplayer-controls');
    
    if (vsAiBtn) vsAiBtn.classList.remove('selected');
    if (vsHumanBtn) vsHumanBtn.classList.remove('selected');
    if (aiOptions) aiOptions.style.display = 'none';
    if (multiplayerControls) multiplayerControls.style.display = 'none';
    
    // Clear any advisory messages
    const advisoryContent = document.getElementById('advisory-content');
    if (advisoryContent) {
        advisoryContent.innerHTML = 'Welcome to Horropoly!';
    }
    
    // Reset dice
    const die1Element = document.getElementById('die1');
    const die2Element = document.getElementById('die2');
    if (die1Element) die1Element.textContent = '?';
    if (die2Element) die2Element.textContent = '?';
    
    // Clear turn info
    const turnInfo = document.getElementById('turn-info');
    if (turnInfo) {
        turnInfo.textContent = '';
        turnInfo.style.display = 'none';
    }
    
    // Clear dice roll info
    const diceRollInfo = document.getElementById('dice-roll-info');
    if (diceRollInfo) {
        diceRollInfo.textContent = '';
    }
    
    // Clear player info
    const playerInfoContent = document.getElementById('player-info-content');
    if (playerInfoContent) {
        playerInfoContent.innerHTML = '';
    }
    
    // Clear property info
    const propertyInfoContent = document.getElementById('property-info-content');
    if (propertyInfoContent) {
        propertyInfoContent.innerHTML = '';
    }
    
    // Clear player scores
    const playerScores = document.getElementById('player-scores');
    if (playerScores) {
        playerScores.innerHTML = '';
    }
    
    // Clear dice content
    const diceContent = document.getElementById('dice-content');
    if (diceContent) {
        diceContent.innerHTML = '';
    }
    
    // Reset canvas if it exists
    if (typeof canvas !== 'undefined' && canvas && typeof ctx !== 'undefined' && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    // Disconnect from Firebase if in multiplayer mode
    if (typeof isMultiplayerGame !== 'undefined' && isMultiplayerGame && 
        typeof currentRoomId !== 'undefined' && currentRoomId && 
        typeof disconnectFromGame === 'function') {
        disconnectFromGame().catch(error => console.error('Error disconnecting from game:', error));
    }
    
    console.log('[restartGame] Game restarted successfully - redirecting to front page');
    
    // Redirect to the front page (or overridden lobby)
    setTimeout(() => {
        const target = (typeof window !== 'undefined' && window.RESTART_REDIRECT_URL) ? window.RESTART_REDIRECT_URL : 'index.html';
        window.location.href = target;
    }, 500); // Small delay to allow cleanup to complete
}

// Double-press confirmation variables
let restartConfirmationTimeout = null;
let restartConfirmationCount = 0;

// Confirm restart function with double-press safety
function confirmRestart() {
    restartConfirmationCount++;
    
    const restartButton = document.getElementById('restart-toggle');
    
    if (restartConfirmationCount === 1) {
        // First press - change button to show confirmation needed
        restartButton.textContent = 'Sure?';
        restartButton.style.background = '#ff9800';
        restartButton.style.borderColor = '#f57c00';
        
        // Set timeout to reset if second press doesn't happen within 3 seconds
        restartConfirmationTimeout = setTimeout(() => {
            restartConfirmationCount = 0;
            restartButton.textContent = 'Reset';
            restartButton.style.background = '#f44336';
            restartButton.style.borderColor = '#d32f2f';
        }, 3000);
        
        console.log('[confirmRestart] First press - waiting for confirmation...');
        
    } else if (restartConfirmationCount === 2) {
        // Second press - proceed with restart
        clearTimeout(restartConfirmationTimeout);
        restartConfirmationCount = 0;
        
        // Reset button appearance
        restartButton.textContent = 'Reset';
        restartButton.style.background = '#f44336';
        restartButton.style.borderColor = '#d32f2f';
        
        console.log('[confirmRestart] Second press confirmed - restarting game...');
        restartGame();
    }
}

// Make restartGame function available globally
window.restartGame = restartGame;
window.confirmRestart = confirmRestart; 
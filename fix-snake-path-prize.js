// Fix for snake path prize collection
function handleSnakePathPrize(player) {
    console.log(`[handleSnakePathPrize] Awarding prize to ${player.name} for completing snake path`);
    
    // Award steal card
    player.stealCards = (player.stealCards || 0) + 1;
    
    // Show advisory
    showAdvisory(`${player.name} got a steal card for completing the snake path! 🎭`, 'prize');
    
    // Play prize sound
    playStealAwardSound().catch(error => {
        console.warn('Could not play steal award sound:', error);
    });
    
    console.log(`[handleSnakePathPrize] ${player.name} now has ${player.stealCards} steal cards`);
}

// Modified snake path exit handler
async function handleDoublesOnSpecialPath(player, currentSquare, die1, die2) {
    console.log(`[handleDoublesOnSpecialPath] ${player.name} rolled doubles on ${currentSquare}`);
    
    // Check if on snake path
    if (currentSquare.startsWith('TT')) {
        console.log(`[handleDoublesOnSpecialPath] ${player.name} rolled doubles on snakePath2 - moving step-by-step to exit!`);
        
        // Move through snake path steps
        const snakePathSteps = [
            'TT5', 'TT6', 'TT7', 'TT8', 'TT9', 'TT10',
            'TT11', 'TT12', 'TT13', 'TT14', 'TT15',
            'TT16', 'TT17', 'TT18', 'TT19'
        ];
        
        // Animate through each step
        for (let i = 0; i < snakePathSteps.length; i++) {
            const step = snakePathSteps[i];
            console.log(`[handleDoublesOnSpecialPath] Step ${i + 1}/${snakePathSteps.length}: ${player.name} moved to ${step}`);
            
            // Update player position
            player.currentSquare = step;
            
            // Get coordinates for this step
            const coords = getSquareCoordinates(step);
            if (coords) {
                player.x = coords.x;
                player.y = coords.y;
            }
            
            // Update game frame
            updateGameFrame();
            
            // Small delay between steps
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        // Exit to main path at b9
        console.log(`[handleDoublesOnSpecialPath] Final step: ${player.name} exited to b9 on main path`);
        player.currentSquare = 'b9';
        const exitCoords = getSquareCoordinates('b9');
        if (exitCoords) {
            player.x = exitCoords.x;
            player.y = exitCoords.y;
        }
        
        // Award snake path prize
        handleSnakePathPrize(player);
        
        // Update game frame one last time
        updateGameFrame();
        
        return true; // Indicate special path was handled
    }
    
    return false; // Not on special path
}

// Apply the fix
console.log('🔧 Applying snake path prize fix...');
window.handleDoublesOnSpecialPath = handleDoublesOnSpecialPath;
window.handleSnakePathPrize = handleSnakePathPrize;
console.log('✅ Snake path prize fix applied - players will now get steal cards for completing the snake path!');

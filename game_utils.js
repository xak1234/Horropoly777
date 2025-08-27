// Game state variables
let canvas = null;
let players = [];
let eyePositions = { left: { x: 856, y: 94 }, right: { x: 896, y: 91 } };
let lastRollWasDoubles = false;
let eyeAnimationFrame = null;
let eyeAnimationStartTime = null;
let boardImage = null; // Add cached board image
let positionsMap = null; // To store board square positions

export function renderBoard(container, boardImageUrl, options = {}) {
    return new Promise((resolve, reject) => {
        console.log('renderBoard called with:', { container: !!container, boardImageUrl, options });
        
        if (!container) {
            reject(new Error('Container element is required for renderBoard'));
            return;
        }
        
        boardImage = new Image(); // Cache the board image
        boardImage.src = boardImageUrl;
        
        boardImage.onload = () => {
            console.log('Board image loaded, creating canvas...');
            canvas = document.createElement('canvas');
            canvas.width = options.width || boardImage.naturalWidth;
            canvas.height = options.height || boardImage.naturalHeight;
            
            console.log('Canvas created with dimensions:', canvas.width, 'x', canvas.height);
            
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Failed to get 2D context from canvas'));
                return;
            }
            
            // Draw the board image
            ctx.drawImage(boardImage, 0, 0, canvas.width, canvas.height);
            console.log('Board image drawn to canvas');
            
            // Append to container
            container.appendChild(canvas);
            console.log('Canvas appended to container');
            
            // Verify canvas is in DOM
            const canvasInDOM = document.querySelector('canvas');
            if (!canvasInDOM) {
                console.warn('Canvas not found in DOM after append');
            } else {
                console.log('Canvas verified in DOM');
            }
            
            resolve(canvas); // Resolve with the canvas element
        };
        
        boardImage.onerror = (error) => {
            console.error('Failed to load board image:', error);
            reject(new Error(`Failed to load board image: ${boardImageUrl}`));
        };
    });
}

export function loadTokens(tokenUrls) {
    const promises = tokenUrls.map(url => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = url;
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to load token: ${url}`));
        });
    });
    return Promise.all(promises);
}

export function renderTokens(playersToRender) {
    if (!canvas || !playersToRender || !Array.isArray(playersToRender)) {
        console.error('Invalid parameters for renderTokens');
        return;
    }

    const ctx = canvas.getContext('2d');
    console.log(`[renderTokens] Rendering ${playersToRender.length} players`);

    // Group players by their current square to easily find who is where
    const playersBySquare = playersToRender.reduce((acc, player) => {
        const square = player.currentSquare || 'unknown'; // Use 'unknown' if currentSquare is not set
        if (!acc[square]) {
            acc[square] = [];
        }
        acc[square].push(player);
        return acc;
    }, {});

    playersToRender.forEach(player => {
        console.log(`[renderTokens] Processing player ${player.name}: x=${player.x}, y=${player.y}, currentSquare=${player.currentSquare}`);
        
        // Check for missing coordinates and try to fix them
        if (!player.x || !player.y || (player.x === 0 && player.y === 0)) {
            console.warn(`Missing or zero coordinates for player ${player.name}, attempting to fix using currentSquare: ${player.currentSquare}`);
            
            // Try to get position from positions map
            if (window.positionsMap && player.currentSquare) {
                const pos = window.positionsMap.get(player.currentSquare);
                if (pos) {
                    player.x = pos.x;
                    player.y = pos.y;
                    console.log(`Fixed coordinates for ${player.name}: (${player.x}, ${player.y})`);
                } else {
                    console.error(`No position found for square ${player.currentSquare} for player ${player.name}`);
                    return;
                }
            } else {
                console.error('Missing coordinates and no positionsMap available for player:', player);
                return;
            }
        }

        ctx.save();

        // Enhanced shadow and glow effects for better visibility
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.globalAlpha = 1.0; // Full opacity for better visibility

        let visualX = player.x; // Default: player's logical X (center of square for this player)
        const currentSquareId = player.currentSquare;
        
        // Special adjustment for top row squares - move tokens slightly left
        const topRowSquares = ['go', 't1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9', 'jail'];
        if (topRowSquares.includes(currentSquareId)) {
            visualX = player.x - 5; // Move 5 pixels to the left for better centering
        }
        
        if (currentSquareId) { // Ensure currentSquareId is valid
            const playersOnThisSquare = playersBySquare[currentSquareId] || [];

            if (playersOnThisSquare.length > 1) {
                const halfPlayerSize = player.size / 2;
                
                if (currentSquareId === 'go') {
                    // On GO: Human player stays centered on player.x (square's base X).
                    // AI player is offset to the right by a full player.size, so they touch.
                    if (player.isAI) {
                        visualX = player.x + player.size;
                    }
                    // Human player uses the default visualX = player.x, which is the square's center.
                } else {
                    // On other squares: Position side-by-side, centered around the square's player.x.
                    // Find the index of this player among those on the same square.
                    const playerIndexOnSquare = playersOnThisSquare.findIndex(p => p.name === player.name);

                    if (playerIndexOnSquare === 0) { // First player on this square
                        visualX = player.x - halfPlayerSize;
                    } else if (playerIndexOnSquare === 1) { // Second player on this square
                        visualX = player.x + halfPlayerSize;
                    }
                }
            }
        }

        // Calculate top-left for drawImage, player.y already includes vertical adjustments from game.js
        const drawX = Math.round(visualX - player.size / 2);
        const drawY = Math.round(player.y - player.size / 2);
        
        console.log(`[renderTokens] Drawing ${player.name} at visualX=${visualX}, drawX=${drawX}, drawY=${drawY}, size=${player.size}`); 

        // Add enhanced visual effect for current player
        if (player.isCurrentPlayer) {
            ctx.shadowColor = 'rgba(255, 215, 0, 0.8)'; // Brighter golden glow for current player
            ctx.shadowBlur = 20;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }

        // Draw player token or enhanced fallback circle if image is missing
        if (player.image && player.image.complete && player.image.naturalWidth > 0) {
            // Add a colored border around the token using the player's assigned color (matches their star color)
            let playerColor;
            if (player.color && player.color !== 'undefined' && player.color !== 'null') {
                playerColor = player.color;
                console.log(`[renderTokens] ${player.name} - using assigned color: ${playerColor}`);
            } else {
                playerColor = player.isAI ? 'rgba(255, 100, 100, 0.8)' : 'rgba(100, 255, 100, 0.8)';
                console.log(`[renderTokens] ${player.name} - NO COLOR ASSIGNED, using fallback: ${playerColor} (isAI: ${player.isAI})`);
            }
            
            // Draw a colored background circle behind the token for better visibility
            ctx.beginPath();
            ctx.fillStyle = playerColor;
            ctx.arc(visualX, player.y, (player.size / 2) + 8, 0, Math.PI * 2);
            ctx.fill();
            
            // Add a thicker, more visible colored border
            ctx.strokeStyle = playerColor;
            ctx.lineWidth = 8;
            ctx.strokeRect(drawX - 4, drawY - 4, player.size + 8, player.size + 8);
            
            // Add a white inner border for contrast
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.strokeRect(drawX - 1, drawY - 1, player.size + 2, player.size + 2);
            
            // Draw the token image
            ctx.drawImage(player.image, drawX, drawY, player.size, player.size);
        } else {
            // Enhanced fallback circle with gradient using player's assigned color
            const centerX = visualX;
            const centerY = player.y;
            const radius = player.size / 2;
            
            // Use player's assigned color for gradient, fallback to AI/human colors if no color assigned
            const hasValidColor = player.color && player.color !== 'undefined' && player.color !== 'null';
            const baseColor = hasValidColor ? player.color : (player.isAI ? '#ff0000' : '#00ff00');
            
            // Create gradient using the player's color
            const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
            if (hasValidColor) {
                // Use player's assigned color with varying opacity for gradient effect
                const colorWithAlpha = player.color + '99'; // Add alpha for center
                const colorMedium = player.color + 'CC'; // Medium opacity
                const colorFull = player.color; // Full opacity for edge
                gradient.addColorStop(0, colorWithAlpha);
                gradient.addColorStop(0.7, colorMedium);
                gradient.addColorStop(1, colorFull);
            } else {
                // Fallback to original AI/human colors if no player color assigned
                if (player.isAI) {
                    gradient.addColorStop(0, '#ff6666'); // Bright red center
                    gradient.addColorStop(0.7, '#ff3333'); // Medium red
                    gradient.addColorStop(1, '#cc0000'); // Dark red edge
                } else {
                    gradient.addColorStop(0, '#66ff66'); // Bright green center
                    gradient.addColorStop(0.7, '#33ff33'); // Medium green
                    gradient.addColorStop(1, '#00cc00'); // Dark green edge
                }
            }
            
            // Draw the gradient circle
            ctx.beginPath();
            ctx.fillStyle = gradient;
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Add a border using the player's color
            const fallbackBorderColor = hasValidColor ? player.color : (player.isAI ? '#ffaaaa' : '#aaffaa');
            if (hasValidColor) {
                console.log(`[renderTokens] ${player.name} fallback circle - using assigned color: ${fallbackBorderColor}`);
            } else {
                console.log(`[renderTokens] ${player.name} fallback circle - NO COLOR ASSIGNED, using fallback: ${fallbackBorderColor} (isAI: ${player.isAI})`);
            }
            ctx.strokeStyle = fallbackBorderColor;
            ctx.lineWidth = 4;
            ctx.stroke();
            
            // Add player name with better contrast
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.strokeText(player.name.substring(0, 1), centerX, centerY + 5);
            ctx.fillText(player.name.substring(0, 1), centerX, centerY + 5);
        }

        ctx.restore();
    });
}

// Function to draw glowing eyes with pulsing effect
function drawGlowingEyes(ctx, progress) {
    if (!eyePositions.left || !eyePositions.right) {
        console.log('No eye positions set');
        return;
    }

    // Save the current context state
    ctx.save();

    // Calculate pulse intensity (0 to 1)
    const pulseIntensity = Math.sin(progress * Math.PI * 2) * 0.5 + 0.5;
    
    // Create radial gradient for glow effect
    const drawEye = (x, y) => {
        // Make eyes more visible
        const radius = 20 + (pulseIntensity * 10); // Increased base radius and pulse range
        const gradient = ctx.createRadialGradient(x, y, 2, x, y, radius);
        const alpha = Math.min(1, 1.2 - progress); // Slower fade out
        
        // Brighter red color
        gradient.addColorStop(0, `rgba(255, 0, 0, ${alpha})`);
        gradient.addColorStop(0.5, `rgba(255, 50, 50, ${alpha * 0.7})`);
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        
        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Inner eye (brighter)
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 50, 50, ${alpha})`;
        ctx.arc(x, y, 4 + (pulseIntensity * 3), 0, Math.PI * 2);
        ctx.fill();
    };

    drawEye(eyePositions.left.x, eyePositions.left.y);
    drawEye(eyePositions.right.x, eyePositions.right.y);

    // Restore the context state
    ctx.restore();
}

function startEyeAnimation() {
    // Clear any existing animation
    if (eyeAnimationFrame) {
        cancelAnimationFrame(eyeAnimationFrame);
        eyeAnimationFrame = null;
    }
    
    eyeAnimationStartTime = null;
    
    // Laugh sound removed - no sound when rolling doubles

    function animate(timestamp) {
        if (!eyeAnimationStartTime) {
            eyeAnimationStartTime = timestamp;
        }
        
        const progress = (timestamp - eyeAnimationStartTime) / 1000; // Convert to seconds
        
        if (progress <= 1) { // Animation lasts 1 second
            // Draw current frame
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw board
            if (boardImage) {
                ctx.drawImage(boardImage, 0, 0, canvas.width, canvas.height);
            }
            
            // Draw eyes
            drawGlowingEyes(ctx, progress);
            
            // Draw players
            renderTokens(players);
            
            // Request next frame
            eyeAnimationFrame = requestAnimationFrame(animate);
        } else {
            // Animation complete
            cancelAnimationFrame(eyeAnimationFrame);
            eyeAnimationFrame = null;
            eyeAnimationStartTime = null;
            lastRollWasDoubles = false;
            updateFrame(); // Final render without eyes
        }
    }
    
    // Start the animation
    eyeAnimationFrame = requestAnimationFrame(animate);
}

export function updateFrame(progress) {
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (boardImage) {
        ctx.drawImage(boardImage, 0, 0, canvas.width, canvas.height);

        // Glow effect for 'go' square
        if (positionsMap && positionsMap['go']) {
            const goSquareData = positionsMap['go'];
            const goSquareX = goSquareData.x;
            const goSquareY = goSquareData.y;
            
            // Define the visual size of the 'go' square for the glow area.
            // These values might need adjustment to match your board.png.
            const goSquareVisualWidth = 70; 
            const goSquareVisualHeight = 70;

            let isPlayerOnGo = false;
            if (players && players.length > 0) {
                for (const player of players) {
                    // Assuming player.currentSquare holds the ID like 'go', 't1', etc.
                    if (player.currentSquare === 'go') {
                        isPlayerOnGo = true;
                        break;
                    }
                }
            }
            
            if (isPlayerOnGo) {
                ctx.save();
                ctx.shadowColor = 'white';
                ctx.shadowBlur = 25; // Intensity of the glow
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
                
                // Draw a rectangle that will cast the shadow.
                // Its fill can be transparent or very slightly white to enhance the glow.
                ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'; // Subtle fill
                ctx.fillRect(
                    goSquareX - goSquareVisualWidth / 2, 
                    goSquareY - goSquareVisualHeight / 2, 
                    goSquareVisualWidth, 
                    goSquareVisualHeight
                );
                ctx.restore();
            }
        }
        
        // Only draw eyes during animation
        if (lastRollWasDoubles && progress !== undefined) {
            drawGlowingEyes(ctx, progress);
        }
        
        renderTokens(players);
    }
}

export function setPlayers(newPlayers) {
    players = newPlayers;
}

export function getCanvas() {
    return canvas;
}

export function setEyePositions(positions) {
    console.log('Setting eye positions:', positions);
    eyePositions = positions;
}

export function setDoublesState(isDoubles) {
    console.log('setDoublesState called with:', isDoubles);
    if (isDoubles && eyePositions.left && eyePositions.right) {
        lastRollWasDoubles = true;
        // Don't start the problematic animation - let updateGameFrame handle the static glow
        // startEyeAnimation(); // Commented out to prevent screen clearing issues
        
        // Auto-clear the glow after 3 seconds to ensure it doesn't stay forever
        setTimeout(() => {
            lastRollWasDoubles = false;
            console.log('Auto-cleared skull eyes glow after 3 seconds');
        }, 3000);
    }
}

export function setPositionsMap(map) {
    positionsMap = map;
    // Also set it globally for coordinate fixing
    window.positionsMap = map;
}

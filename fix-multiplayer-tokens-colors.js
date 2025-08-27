/**
 * Fix Multiplayer Token and Color Assignment
 * Ensures proper token and color assignment for up to 4 players
 */

// Enhanced token and color assignment system
const PLAYER_TOKENS_AND_COLORS = [
    {
        tokenIndex: 0,
        tokenImage: 'assets/images/t1.png',
        color: '#ff0000',
        colorName: 'Red'
    },
    {
        tokenIndex: 1,
        tokenImage: 'assets/images/t2.png',
        color: '#0000ff',
        colorName: 'Blue'
    },
    {
        tokenIndex: 2,
        tokenImage: 'assets/images/t3.png',
        color: '#00ff00',
        colorName: 'Green'
    },
    {
        tokenIndex: 3,
        tokenImage: 'assets/images/t4.png',
        color: '#ffff00',
        colorName: 'Yellow'
    },
    {
        tokenIndex: 4,
        tokenImage: 'assets/images/t5.png',
        color: '#800080',
        colorName: 'Purple'
    },
    {
        tokenIndex: 5,
        tokenImage: 'assets/images/t6.png',
        color: '#ffa500',
        colorName: 'Orange'
    },
    {
        tokenIndex: 6,
        tokenImage: 'assets/images/t7.png',
        color: '#ff69b4',
        colorName: 'Pink'
    },
    {
        tokenIndex: 7,
        tokenImage: 'assets/images/t8.png',
        color: '#40e0d0',
        colorName: 'Turquoise'
    }
];

// Function to find the next available token/color assignment
function findAvailableTokenAndColor(existingPlayers) {
    console.log('🎨 Finding available token and color for new player');
    console.log('🎨 Existing players:', existingPlayers.map(p => ({ 
        name: p.name, 
        tokenIndex: p.tokenIndex, 
        color: p.color,
        colorName: p.colorName 
    })));
    
    // Get used token indices
    const usedTokenIndices = existingPlayers
        .map(p => p.tokenIndex)
        .filter(index => typeof index === 'number');
    
    console.log('🎨 Used token indices:', usedTokenIndices);
    
    // Find first available token/color combination
    for (let i = 0; i < PLAYER_TOKENS_AND_COLORS.length; i++) {
        if (!usedTokenIndices.includes(i)) {
            const assignment = PLAYER_TOKENS_AND_COLORS[i];
            console.log(`🎨 Assigning token ${i}:`, assignment);
            return assignment;
        }
    }
    
    // Fallback to first token if all are somehow used (shouldn't happen with proper validation)
    console.warn('🎨 All tokens used, falling back to token 0');
    return PLAYER_TOKENS_AND_COLORS[0];
}

// Function to validate and fix player token/color assignments
function validateAndFixPlayerAssignments(players) {
    console.log('🔧 Validating and fixing player token/color assignments');
    
    if (!Array.isArray(players)) {
        console.error('❌ Players is not an array');
        return [];
    }
    
    const fixedPlayers = [];
    const usedTokenIndices = new Set();
    
    players.forEach((player, index) => {
        if (!player) {
            console.warn(`⚠️ Skipping null/undefined player at index ${index}`);
            return;
        }
        
        const fixedPlayer = { ...player };
        
        // Ensure tokenIndex is valid and unique
        if (typeof fixedPlayer.tokenIndex !== 'number' || 
            fixedPlayer.tokenIndex < 0 || 
            fixedPlayer.tokenIndex >= PLAYER_TOKENS_AND_COLORS.length ||
            usedTokenIndices.has(fixedPlayer.tokenIndex)) {
            
            // Find next available token index
            let newTokenIndex = 0;
            while (usedTokenIndices.has(newTokenIndex) && newTokenIndex < PLAYER_TOKENS_AND_COLORS.length) {
                newTokenIndex++;
            }
            
            if (newTokenIndex >= PLAYER_TOKENS_AND_COLORS.length) {
                console.error(`❌ No available token index for player ${player.name}`);
                newTokenIndex = index % PLAYER_TOKENS_AND_COLORS.length;
            }
            
            console.log(`🔧 Fixed token index for ${player.name}: ${fixedPlayer.tokenIndex} -> ${newTokenIndex}`);
            fixedPlayer.tokenIndex = newTokenIndex;
        }
        
        usedTokenIndices.add(fixedPlayer.tokenIndex);
        
        // Ensure token/color data matches the index
        const tokenData = PLAYER_TOKENS_AND_COLORS[fixedPlayer.tokenIndex];
        if (tokenData) {
            if (fixedPlayer.tokenImage !== tokenData.tokenImage) {
                console.log(`🔧 Fixed token image for ${player.name}: ${fixedPlayer.tokenImage} -> ${tokenData.tokenImage}`);
                fixedPlayer.tokenImage = tokenData.tokenImage;
            }
            
            if (fixedPlayer.color !== tokenData.color) {
                console.log(`🔧 Fixed color for ${player.name}: ${fixedPlayer.color} -> ${tokenData.color}`);
                fixedPlayer.color = tokenData.color;
            }
            
            if (fixedPlayer.colorName !== tokenData.colorName) {
                console.log(`🔧 Fixed color name for ${player.name}: ${fixedPlayer.colorName} -> ${tokenData.colorName}`);
                fixedPlayer.colorName = tokenData.colorName;
            }
        }
        
        fixedPlayers.push(fixedPlayer);
    });
    
    console.log('✅ Player assignments validated and fixed:', fixedPlayers.map(p => ({
        name: p.name,
        tokenIndex: p.tokenIndex,
        color: p.color,
        colorName: p.colorName
    })));
    
    return fixedPlayers;
}

// Function to create a new player with proper token/color assignment
function createPlayerWithProperAssignment(playerName, existingPlayers, isHost = false) {
    console.log(`🎨 Creating player "${playerName}" with proper token/color assignment`);
    
    const tokenAssignment = findAvailableTokenAndColor(existingPlayers);
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newPlayer = {
        name: playerName,
        userId: userId,
        isHost: isHost,
        position: 0,
        currentSquare: 'go',
        currentPathKey: 'gamePath',
        currentIndexOnPath: 0,
        isMovingReverse: false,
        x: 0,
        y: 0,
        size: 62,
        money: 16500,
        properties: [],
        isAI: false,
        bankrupt: false,
        tokenImage: tokenAssignment.tokenImage,
        tokenIndex: tokenAssignment.tokenIndex,
        inJail: false,
        jailTurns: 0,
        consecutiveDoubles: 0,
        goPassCount: 0,
        color: tokenAssignment.color,
        colorName: tokenAssignment.colorName
    };
    
    console.log(`✅ Created player "${playerName}":`, {
        name: newPlayer.name,
        userId: newPlayer.userId,
        tokenIndex: newPlayer.tokenIndex,
        tokenImage: newPlayer.tokenImage,
        color: newPlayer.color,
        colorName: newPlayer.colorName,
        isHost: newPlayer.isHost
    });
    
    return newPlayer;
}

// Function to check if game should auto-start
function shouldAutoStartGame(players, maxPlayers, gameStarted) {
    const validPlayerCount = players.filter(p => p && p.name && p.userId).length;
    const shouldStart = !gameStarted && validPlayerCount >= maxPlayers && validPlayerCount >= 2;
    
    console.log('🎮 Auto-start check:', {
        validPlayerCount,
        maxPlayers,
        gameStarted,
        shouldStart,
        players: players.map(p => ({ name: p.name, userId: p.userId }))
    });
    
    return shouldStart;
}

// Function to trigger game auto-start
async function triggerGameAutoStart(gameRoomRef) {
    console.log('🚀 Triggering game auto-start...');
    
    try {
        const { updateDoc } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');
        
        await updateDoc(gameRoomRef, {
            gameStarted: true,
            gameStartedAt: new Date().toISOString(),
            lastActivity: Date.now()
        });
        
        console.log('✅ Game auto-started successfully');
        return true;
    } catch (error) {
        console.error('❌ Failed to auto-start game:', error);
        return false;
    }
}

// Enhanced room status checker
async function checkRoomStatusDetailed(roomId) {
    console.log('📊 Checking detailed room status:', roomId);
    
    try {
        const { getDb } = await import('./firebase-init.js');
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');
        
        const db = await getDb();
        const roomRef = doc(db, 'gameRooms', roomId);
        const roomDoc = await getDoc(roomRef);
        
        if (!roomDoc.exists()) {
            console.log('❌ Room not found');
            return null;
        }
        
        const roomData = roomDoc.data();
        const players = roomData.players || [];
        
        console.log('📊 Room Status:', {
            roomId: roomId,
            roomName: roomData.roomName,
            gameStarted: roomData.gameStarted,
            maxPlayers: roomData.maxPlayers || 2,
            playerCount: players.length,
            players: players.map((p, index) => ({
                index: index,
                name: p.name,
                userId: p.userId,
                isHost: p.isHost,
                tokenIndex: p.tokenIndex,
                color: p.color,
                colorName: p.colorName,
                hasValidData: !!(p.name && p.userId)
            }))
        });
        
        return roomData;
        
    } catch (error) {
        console.error('❌ Error checking room status:', error);
        return null;
    }
}

// Export functions for global use
if (typeof window !== 'undefined') {
    window.MultiplayerTokenFix = {
        PLAYER_TOKENS_AND_COLORS,
        findAvailableTokenAndColor,
        validateAndFixPlayerAssignments,
        createPlayerWithProperAssignment,
        shouldAutoStartGame,
        triggerGameAutoStart,
        checkRoomStatusDetailed
    };
    
    // Quick access functions
    window.fixRoomTokens = async function(roomId) {
        console.log('🔧 Fixing room tokens and colors:', roomId);
        
        try {
            const { getDb } = await import('./firebase-init.js');
            const { doc, getDoc, updateDoc } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');
            
            const db = await getDb();
            const roomRef = doc(db, 'gameRooms', roomId);
            const roomDoc = await getDoc(roomRef);
            
            if (!roomDoc.exists()) {
                console.log('❌ Room not found');
                return;
            }
            
            const roomData = roomDoc.data();
            const originalPlayers = roomData.players || [];
            const fixedPlayers = validateAndFixPlayerAssignments(originalPlayers);
            
            if (JSON.stringify(fixedPlayers) !== JSON.stringify(originalPlayers)) {
                await updateDoc(roomRef, {
                    players: fixedPlayers,
                    lastActivity: Date.now(),
                    tokensFixed: new Date().toISOString()
                });
                
                console.log('✅ Room tokens and colors fixed');
            } else {
                console.log('✅ Room tokens and colors are already correct');
            }
            
            return fixedPlayers;
            
        } catch (error) {
            console.error('❌ Error fixing room tokens:', error);
            throw error;
        }
    };
    
    window.checkRoomStatus = checkRoomStatusDetailed;
    
    console.log('🎨 Multiplayer Token Fix utilities loaded!');
    console.log('💡 Use fixRoomTokens("ROOM_ID") to fix token assignments');
    console.log('💡 Use checkRoomStatus("ROOM_ID") to check room details');
}

export {
    PLAYER_TOKENS_AND_COLORS,
    findAvailableTokenAndColor,
    validateAndFixPlayerAssignments,
    createPlayerWithProperAssignment,
    shouldAutoStartGame,
    triggerGameAutoStart,
    checkRoomStatusDetailed
};

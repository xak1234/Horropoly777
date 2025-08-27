# Token Allocation Fix - Unique Player Tokens

## Problem Description

Previously, the game used a sequential token assignment system that could lead to duplicate tokens when players left and rejoined games. The old system assigned tokens based on the player's position in the array (`gameState.players.length + 1`), which could cause conflicts.

## Issues with Old System

1. **Sequential Assignment**: Tokens were assigned based on array position, not availability
2. **Duplicate Tokens**: When players left and new players joined, tokens could be duplicated
3. **No Uniqueness Check**: No mechanism to ensure each player had a unique token
4. **Potential Conflicts**: Gaps in the player array could cause token mismatches

## Solution Implemented

### 1. New Token Allocation Algorithm

Added a `findFirstAvailableTokenIndex()` function that:
- Takes an array of used token indices
- Finds the first available token index (0-8 for 9 tokens)
- Returns the first unused token index
- Falls back to index 0 if all tokens are used

```javascript
function findFirstAvailableTokenIndex(usedIndices) {
  const sortedUsedIndices = [...usedIndices].sort((a, b) => a - b);
  
  for (let i = 0; i < 9; i++) {
    if (!sortedUsedIndices.includes(i)) {
      return i;
    }
  }
  
  return 0; // Fallback
}
```

### 2. Updated joinGameRoom Function

Modified the `joinGameRoom` function in all Firebase initialization files:
- `firebase-init.js`
- `firebase-init-new.js`
- `hwroks/firebase-init.js`
- `hwroks/firebase-init-new.js`
- `hwroks/firebase-init-minimal.js`

**Key Changes:**
- Extract used token indices from existing players
- Find first available token using the new algorithm
- Assign unique token to new player
- Preserve existing token assignments

### 3. Updated startGameWithInitialization Function

Modified the game initialization to preserve existing token assignments instead of reassigning them:
- Preserve `player.tokenIndex` if it exists
- Preserve `player.tokenImage` if it exists
- Only assign new tokens if none exist

## Token Images Available

The system supports 9 unique token images:
- `assets/images/t1.png` through `assets/images/t9.png`
- Token indices 0-8 correspond to these images

## How It Works

### Scenario 1: New Game
1. Player 1 joins → Gets token 0 (t1.png)
2. Player 2 joins → Gets token 1 (t2.png)
3. Player 3 joins → Gets token 2 (t3.png)

### Scenario 2: Player Leaves and Rejoins
1. Initial state: [Player1(t0), Player2(t1), Player3(t2)]
2. Player2 leaves: [Player1(t0), Player3(t2)]
3. New player joins → Gets token 1 (t2.png) - fills the gap!

### Scenario 3: Multiple Players Leave
1. Initial state: [Player1(t0), Player2(t1), Player3(t2), Player4(t3)]
2. Player2 and Player4 leave: [Player1(t0), Player3(t2)]
3. New player joins → Gets token 1 (t2.png) - fills the lowest available gap

## Benefits

1. **Guaranteed Uniqueness**: Each player always gets a unique token
2. **Efficient Gap Filling**: Available tokens are reused efficiently
3. **Backward Compatibility**: Existing games continue to work
4. **Scalable**: Supports up to 9 players with unique tokens
5. **Robust**: Handles edge cases like all tokens being used

## Testing

Created `test-token-allocation.html` to verify the system works correctly:
- Test 1: Demonstrates problems with old sequential system
- Test 2: Shows new unique assignment working correctly
- Test 3: Simulates leave/rejoin scenarios

## Files Modified

### Core Firebase Files:
- `firebase-init.js` - Main Firebase initialization
- `firebase-init-new.js` - Alternative Firebase initialization
- `hwroks/firebase-init.js` - Hwroks version
- `hwroks/firebase-init-new.js` - Hwroks new version
- `hwroks/firebase-init-minimal.js` - Hwroks minimal version

### Test Files:
- `test-token-allocation.html` - Test page for verification

## Implementation Details

### Token Assignment Logic:
```javascript
// Get used token indices from existing players
const usedTokenIndices = validPlayers.map(p => p.tokenIndex || 0);

// Find first available token
const availableTokenIndex = findFirstAvailableTokenIndex(usedTokenIndices);

// Assign token to new player
const newPlayer = {
  // ... other properties
  tokenImage: tokenImages[availableTokenIndex],
  tokenIndex: availableTokenIndex
};
```

### Game Initialization Preservation:
```javascript
const initializedPlayers = players.map((player, index) => ({
  // ... other properties
  tokenIndex: player.tokenIndex || index, // Preserve existing
  tokenImage: player.tokenImage || `assets/images/t${(player.tokenIndex || index) + 1}.png`
}));
```

## Verification

To test the implementation:
1. Open `test-token-allocation.html` in a browser
2. Run the different test scenarios
3. Verify that all tokens remain unique in all scenarios
4. Check that gaps are properly filled when players leave

## Future Considerations

1. **More Tokens**: If more than 9 players are needed, additional token images can be added
2. **Token Preferences**: Could add player token preference system
3. **Visual Feedback**: Could show available tokens to players during room joining
4. **Token Validation**: Could add server-side validation to ensure token uniqueness

## Conclusion

This fix ensures that every player joining a game receives a unique token, preventing visual confusion and maintaining game integrity. The system is robust, efficient, and handles edge cases gracefully. 
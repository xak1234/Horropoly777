# Multiplayer Testing Guide

## Prerequisites
- Server running at `http://localhost:8000`
- Two browser tabs/windows or different devices
- Browser developer console open (F12) for debugging

## Step-by-Step Testing

### Player 1 (Host)

1. **Open the game**: Navigate to `http://localhost:8000`
2. **Enter your name**: Type a name in the "Enter your name" field (e.g., "Player1")
3. **Select multiplayer mode**: Click the "Play vs Human" button
   - The button should highlight in green
   - Multiplayer controls should appear below
4. **Create a room**: Click the "Create Room" button
   - Check browser console for debug messages
   - Should see: "Create room button clicked"
   - Should see: "Room created with ID: XXXXXX"
   - Room code should appear on screen
  - "Start Game" button should appear (game will auto-start when all players join)

### Player 2 (Guest)

1. **Open the game**: Navigate to `http://localhost:8000` in a new tab/window
2. **Enter your name**: Type a different name (e.g., "Player2")
3. **Select multiplayer mode**: Click the "Play vs Human" button
4. **Join the room**: Click the "Join Room" button
   - Manual entry: Type the room code from Player 1 and click "Join"
   - OR select from the available rooms list
5. **Wait for game start**: Player 1 should see Player 2 in the player list

### Starting the Game

1. **Auto Start**: Once all required players have joined, the game begins automatically
   - Game board should appear for everyone
   - Both players should see the game simultaneously

### During Gameplay

- **Turn indicators**: 
  - Green pulsing dice = Your turn
  - Red pulsing dice = Wait for other player
- **Actions sync**: All moves, purchases, dice rolls should appear on both screens
- **Turn-based**: Only current player can roll dice

## Debug Console Messages

Look for these messages in the browser console:

### Successful Flow:
```
✅ Firebase initialized for Horropoly
Multiplayer controls initialized successfully
Create room button clicked
Creating room for player: Player1
createGameRoom called with playerName: Player1
Generated room ID: ABC123
Setting game state in Firestore: {...}
Game room created successfully
Room created with ID: ABC123
```

### Common Issues:

1. **Elements not found**:
```
Multiplayer control elements not found: {createRoomBtn: false, ...}
```
**Solution**: Make sure you selected "Play vs Human" first

2. **Name validation**:
```
Please enter your name first
```
**Solution**: Enter a name in the text field

3. **Firebase errors**: Check network tab for failed requests

## Troubleshooting

### Issue: "Create Room" button does nothing
- **Check**: Did you enter a name?
- **Check**: Did you select "Play vs Human"?
- **Check**: Browser console for error messages
- **Check**: Network tab for Firebase requests

### Issue: Room not appearing for Player 2
- **Check**: Both players selected "Play vs Human"
- **Check**: Room code spelling is correct
- **Check**: Room hasn't been started yet

### Issue: Game doesn't start
- **Check**: Exactly 2 players in the room
- **Check**: Wait a few seconds for auto start
- **Check**: No JavaScript errors in console

### Issue: Actions not syncing
- **Check**: Internet connection
- **Check**: Both players are in the same room
- **Check**: Refresh both browsers if needed

## Expected Behavior

✅ **Working correctly when**:
- Room codes are generated and displayed
- Player lists update in real-time
- Game starts for both players simultaneously
- Dice rolls and moves sync across both screens
- Turn management works (only current player can act)

❌ **Something is wrong if**:
- Buttons don't respond to clicks
- Room codes don't appear
- Players can't join rooms
- Game state doesn't sync
- Both players can roll dice at the same time

## Firebase Debug

Check the Firebase console at: https://console.firebase.google.com/project/horropoly/firestore/data

You should see:
- `gameRooms` collection
- Documents with random IDs
- Player data and game state

## Network Debug

In browser dev tools Network tab, look for:
- Requests to `firestore.googleapis.com`
- Status 200 responses
- WebSocket connections for real-time updates 
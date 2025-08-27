# Horropoly - Multiplayer Horror Monopoly Game

A horror-themed Monopoly-style board game with both AI and multiplayer support using Firebase.

## Game Modes

### 1. Play vs AI / Local Multiplayer
- Start a local game with any mix of human players and AI bots (up to 4 total)
- AI automatically makes decisions and takes turns
- Great for learning the game mechanics or playing cooperatively

### 2. Play vs Human (Multiplayer)
- Real-time multiplayer for 2-4 players
- Uses Firebase for synchronization
- Players can join from different devices/browsers

## How to Play Multiplayer

### Starting a Multiplayer Game

1. **Enter Your Name**: Both players must enter their names in the text field
2. **Select "Play vs Human"**: Click the "Play vs Human" button
3. **Choose Your Role**:
   - **Host**: Click "Create Room" to start a new game room
   - **Guest**: Click "Join Room" to join an existing room

### For the Host (Player 1)

1. Click **"Create Room"**
2. Share the **Room Code** that appears with the other player
3. Wait for the second player to join (you'll see them in the player list)
4. The game starts automatically once all players join

### For the Guest (Player 2)

1. Click **"Join Room"**
2. Either:
   - **Manual Entry**: Enter the room code in the text field and click "Join"
   - **Room List**: Select from available rooms in the list
3. Wait for the host to start the game

### During Multiplayer Gameplay

- **Turn-Based**: Only the current player can roll the dice
- **Real-Time Sync**: All game actions are synchronized across both players
- **Visual Indicators**: 
  - Green pulsing dice = Your turn
  - Red pulsing dice = Not your turn
  - Blue pulsing dice = AI turn (not applicable in multiplayer)

## Game Features

- **Property System**: Buy, develop, and collect rent on properties
- **Development**: Build graveyards and crypts on your properties
- **Special Squares**: Jail, Go to Jail, and Yin-Yang squares
- **Sound Effects**: Horror-themed audio for various game events
- **Visual Effects**: Animated tokens and dice
- **Background Music**: Toggle atmospheric music on/off

## Technical Requirements

- Modern web browser with JavaScript enabled
- Internet connection (for multiplayer mode)
- Local HTTP server for development (Python, Node.js, or similar)

### Mobile/Desktop Modes
Horropoly automatically uses mobile-friendly styles on small devices. You can pinch with two fingers to zoom and pan the board. If you request the desktop site on your phone, the board still scales correctly so it remains easy to see.

## Running the Game

### Local Development
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx http-server

# Using PHP
php -S localhost:8000
```

Then open your browser to `http://localhost:8000`

### Firebase Configuration

The game uses Firebase Firestore for multiplayer functionality. The Firebase configuration is already set up in `firebase-init.js`.

## Game Rules

1. **Starting**: All players begin at the "GO" square with £5000
2. **Movement**: Roll two dice to move around the board
3. **Properties**: Land on unowned properties to purchase them
4. **Rent**: Pay rent when landing on other players' properties
5. **Development**: Build graveyards (houses) and crypts (hotels) on owned properties
6. **Doubles**: Rolling doubles gives you another turn (max 3 in a row)
7. **Jail**: Get sent to jail for rolling 3 doubles in a row
8. **Winning**: Last player standing (not bankrupt) wins

## Controls

- **Dice**: Click to roll (when it's your turn)
- **Property Decisions**: Use the buttons that appear when landing on properties
- **Music Toggle**: Click the switch in the info panel
- **Draggable Panel**: The info panel can be moved by dragging

## Troubleshooting

### Common Issues

1. **"It's not your turn" message**: Wait for the other player to complete their turn
2. **Room not found**: Double-check the room code spelling
3. **Connection issues**: Refresh the page and try again
4. **Game stuck**: Check browser console for errors

### Multiplayer Sync Issues

- Game state is automatically synchronized
- If sync fails, players may need to refresh their browsers
- Check internet connection if experiencing delays

## File Structure

 - `lobby.html` - Entry lobby to create or join multiplayer games
 - `gamestart.html` - Main game interface
- `game.js` - Core game logic and multiplayer functionality
- `game_utils.js` - Utility functions for rendering and game mechanics
- `firebase-init.js` - Firebase configuration and database operations
- `positions_updated.json` - Board position coordinates
- `assets/` - Game assets (sounds, tokens, images)

## Contributing

To add new features or fix bugs:

1. Test both AI and multiplayer modes
2. Ensure Firebase sync works correctly
3. Test with multiple browser tabs/devices
4. Check console for errors

Enjoy your horror-themed multiplayer Monopoly experience! 🎲👻
# Player Removal System Documentation

## Overview

The Player Removal System ensures that when a player leaves or disconnects from a room, they are automatically removed from the room's player list. This prevents issues with full rooms, stale player data, and maintains accurate room state.

## Key Features

### 1. Automatic Disconnect Detection
- **Page Unload Events**: Detects when a player closes the browser tab/window
- **Tab Visibility**: Monitors when a player switches tabs
- **Network Disconnection**: Handles connection loss scenarios

### 2. Manual Player Removal
- **Leave Room Button**: Players can manually leave rooms
- **Admin Removal**: Hosts can remove players from rooms
- **Cleanup Functions**: Automatic removal of inactive players

### 3. Activity Tracking
- **Periodic Updates**: Players send activity signals every minute
- **Inactivity Detection**: Players inactive for 5+ minutes are automatically removed
- **Timestamp Tracking**: Records when players were last active

## Functions

### Core Removal Functions

#### `disconnectAndRemovePlayer(roomId, playerName, userId)`
Removes a player from a room when they disconnect.

**Parameters:**
- `roomId` (string): The room ID
- `playerName` (string): The player's name
- `userId` (string, optional): The player's unique ID

**Behavior:**
- Removes player from room's player list
- Updates room's `lastUpdated` timestamp
- Records disconnect event in `lastPlayerLeft`
- Marks room as inactive if no players remain

#### `removePlayerFromRoom(roomId, playerName, userId)`
Manually removes a specific player from a room.

**Parameters:**
- `roomId` (string): The room ID
- `playerName` (string): The player's name
- `userId` (string, optional): The player's unique ID

**Returns:** `boolean` - true if player was found and removed

#### `leaveRoom(roomId, playerName, userId)`
Handles manual player leaving (when they click "Leave Room").

**Parameters:**
- `roomId` (string): The room ID
- `playerName` (string): The player's name
- `userId` (string, optional): The player's unique ID

**Behavior:**
- Cleans up event handlers
- Removes player from room
- Disconnects from game state
- Returns true on success

### Event Handler Functions

#### `setupPlayerDisconnectHandlers(roomId, playerName, userId)`
Sets up automatic disconnect detection for a player.

**Parameters:**
- `roomId` (string): The room ID
- `playerName` (string): The player's name
- `userId` (string, optional): The player's unique ID

**Event Handlers:**
- `beforeunload`: Page close/refresh
- `unload`: Tab/window close
- `visibilitychange`: Tab switching

**Returns:** Cleanup function to remove event listeners

#### `setupPlayerActivityUpdates(roomId, playerName, userId)`
Sets up periodic activity updates for a player.

**Parameters:**
- `roomId` (string): The room ID
- `playerName` (string): The player's name
- `userId` (string, optional): The player's unique ID

**Behavior:**
- Updates player's `lastActivity` timestamp every minute
- Helps prevent false disconnections

**Returns:** Cleanup function to stop activity updates

### Activity Management Functions

#### `updatePlayerActivity(roomId, playerName, userId)`
Updates a player's activity timestamp.

**Parameters:**
- `roomId` (string): The room ID
- `playerName` (string): The player's name
- `userId` (string, optional): The player's unique ID

**Behavior:**
- Finds player in room
- Updates their `lastActivity` field
- Updates room's `lastUpdated` timestamp

#### `getCurrentPlayerInfo(roomId, playerName, userId)`
Gets information about a specific player in a room.

**Parameters:**
- `roomId` (string): The room ID
- `playerName` (string): The player's name
- `userId` (string, optional): The player's unique ID

**Returns:** Player object or null if not found

### Cleanup Functions

#### `cleanupStaleRooms()`
Cleans up stale rooms and removes inactive players.

**Behavior:**
- Removes rooms older than 30 minutes with no players
- Removes players inactive for 5+ minutes from active rooms
- Marks rooms as inactive if they become empty

**Returns:** Object with `roomsCleaned` and `inactivePlayersRemoved` counts

## Integration Points

### Room Creation
When a room is created via `createGameRoom()`:
```javascript
// Set up disconnect handlers for the host player
const cleanupDisconnectHandlers = setupPlayerDisconnectHandlers(roomId, playerName, hostUserId);
const cleanupActivityUpdates = setupPlayerActivityUpdates(roomId, playerName, hostUserId);
```

### Room Joining
When a player joins via `joinGameRoom()`:
```javascript
// Set up disconnect handlers for the joining player
const cleanupDisconnectHandlers = setupPlayerDisconnectHandlers(roomId, playerName, guestUserId);
const cleanupActivityUpdates = setupPlayerActivityUpdates(roomId, playerName, guestUserId);
```

## Data Structure

### Player Object
```javascript
{
  name: "PlayerName",
  userId: "user_1234567890_abc123",
  lastActivity: "2024-01-01T12:00:00.000Z",
  // ... other player properties
}
```

### Room State Updates
```javascript
{
  players: [...], // Updated player list
  lastUpdated: "2024-01-01T12:00:00.000Z",
  lastPlayerLeft: {
    playerName: "PlayerName",
    userId: "user_1234567890_abc123",
    timestamp: "2024-01-01T12:00:00.000Z"
  }
}
```

## Usage Examples

### Basic Player Removal
```javascript
import { removePlayerFromRoom } from './firebase-init.js';

// Remove a specific player
const removed = await removePlayerFromRoom('room123', 'PlayerName', 'user123');
if (removed) {
  console.log('Player removed successfully');
}
```

### Manual Leave Room
```javascript
import { leaveRoom } from './firebase-init.js';

// Player manually leaves room
await leaveRoom('room123', 'PlayerName', 'user123');
console.log('Player left room');
```

### Setup Disconnect Handlers
```javascript
import { setupPlayerDisconnectHandlers, setupPlayerActivityUpdates } from './firebase-init.js';

// Set up automatic disconnect detection
const cleanupDisconnect = setupPlayerDisconnectHandlers('room123', 'PlayerName', 'user123');
const cleanupActivity = setupPlayerActivityUpdates('room123', 'PlayerName', 'user123');

// Later, clean up handlers
cleanupDisconnect();
cleanupActivity();
```

### Periodic Cleanup
```javascript
import { cleanupStaleRooms } from './firebase-init.js';

// Run cleanup every 10 minutes
setInterval(async () => {
  const result = await cleanupStaleRooms();
  console.log(`Cleaned ${result.roomsCleaned} rooms, removed ${result.inactivePlayersRemoved} players`);
}, 10 * 60 * 1000);
```

## Testing

Use the `test-player-removal.html` page to test all player removal functionality:

1. **Initialize Firebase**
2. **Create Test Room**
3. **Join Room as Guest**
4. **Test Player Removal**
5. **Test Disconnect Simulation**
6. **Check Room Status**
7. **Test Activity Updates**
8. **Cleanup Stale Rooms**

## Error Handling

The system includes comprehensive error handling:

- **Network Errors**: Graceful handling of Firebase connection issues
- **Missing Players**: Safe removal when players don't exist
- **Invalid Room IDs**: Proper error messages for non-existent rooms
- **Duplicate Removals**: Prevents errors when removing already-removed players

## Best Practices

1. **Always Clean Up Handlers**: Call cleanup functions when players leave
2. **Use Unique User IDs**: Include userId for more accurate player identification
3. **Monitor Activity**: Set up periodic activity updates for active players
4. **Regular Cleanup**: Run `cleanupStaleRooms()` periodically
5. **Error Logging**: Monitor console for any removal-related errors

## Troubleshooting

### Common Issues

1. **Players Not Being Removed**
   - Check if disconnect handlers are properly set up
   - Verify player names and user IDs match
   - Check Firebase connection status

2. **False Disconnections**
   - Increase activity update frequency
   - Check network connectivity
   - Verify event handlers are working

3. **Room State Inconsistencies**
   - Run `cleanupStaleRooms()` to fix stale data
   - Check for concurrent room modifications
   - Verify Firebase rules allow player removal

### Debug Information

Enable detailed logging by checking console output:
- Player join/leave events
- Activity update timestamps
- Cleanup operation results
- Error messages and stack traces 
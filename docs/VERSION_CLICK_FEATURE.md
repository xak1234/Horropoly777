# 🔓 Version Click Multiplayer Unlock Feature

## 📋 Overview
The version clicking feature allows users to unlock multiplayer functionality by clicking on the version number in the lobby 6 times within 3 seconds. This is a testing/development feature that bypasses the payment system.

## 🎯 How It Works

### Location
The version number is located in the main lobby at:
```html
<h1>Horropoly <span id="version-span" style="font-size: 0.6em; color: #ffff00; cursor: pointer; user-select: none;">v6.5</span></h1>
```

### Activation Process
1. **Click Counter**: User must click the version number 6 times
2. **Time Limit**: Clicks must occur within 3 seconds of each other
3. **Visual Feedback**: Version number flashes red on each click
4. **Success State**: Version changes to green and shows "v6.5 🔓"

### Technical Implementation

#### Event Listeners
```javascript
document.addEventListener('DOMContentLoaded', function() {
  const versionSpan = document.getElementById('version-span');
  if (versionSpan) {
    versionSpan.addEventListener('click', handleVersionTap);
    versionSpan.addEventListener('touchend', function(e) {
      e.preventDefault();
      handleVersionTap();
    });
  }
});
```

#### Click Handler
```javascript
let versionTapCount = 0;
let versionTapTimeout = null;

function handleVersionTap() {
  versionTapCount++;
  console.log(`🔧 Version tap count: ${versionTapCount}/6`);
  
  // Reset counter after 3 seconds of no taps
  clearTimeout(versionTapTimeout);
  versionTapTimeout = setTimeout(() => {
    versionTapCount = 0;
  }, 3000);
  
  // Visual feedback
  const versionSpan = document.getElementById('version-span');
  if (versionSpan) {
    versionSpan.style.color = '#ff0000';
    setTimeout(() => {
      versionSpan.style.color = '#ffff00';
    }, 150);
  }
  
  // Unlock after 6 taps
  if (versionTapCount >= 6) {
    console.log('🔓 Testing unlock activated!');
    versionTapCount = 0;
    clearTimeout(versionTapTimeout);
    
    // Visual confirmation
    if (versionSpan) {
      versionSpan.style.color = '#00ff00';
      versionSpan.textContent = 'v6.5 🔓';
    }
    
    // Unlock paywall for testing
    unlockPaywallForTesting();
  }
}
```

#### Unlock Function
```javascript
function unlockPaywallForTesting() {
  console.log('🧪 TESTING MODE: Unlocking paywall...');
  
  // Set localStorage flags to simulate payment
  localStorage.setItem('multiplayerPaid', 'true');
  localStorage.setItem('testingUnlock', 'true');
  localStorage.setItem('stripe_session_id', 'test_session_' + Date.now());
  localStorage.setItem('userId', 'test_user_' + Date.now());
  
  // Show success message
  const successDiv = document.createElement('div');
  successDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 255, 0, 0.9);
    color: #000;
    padding: 20px;
    border-radius: 10px;
    font-weight: bold;
    z-index: 10000;
    text-align: center;
    border: 2px solid #00ff00;
    box-shadow: 0 0 20px rgba(0, 255, 0, 0.5);
  `;
  successDiv.innerHTML = `
    🧪 TESTING MODE ACTIVATED<br>
    <span style="font-size: 14px;">Paywall unlocked for testing</span><br>
    <span style="font-size: 12px; opacity: 0.8;">Multiplayer access enabled</span>
  `;
  
  document.body.appendChild(successDiv);
  
  // Remove success message after 3 seconds
  setTimeout(() => {
    if (successDiv.parentNode) {
      successDiv.parentNode.removeChild(successDiv);
    }
  }, 3000);
  
  // Hide modal paywall if it exists
  const modalPaywall = document.getElementById('multiplayer-payment-wall-modal');
  if (modalPaywall) {
    modalPaywall.style.display = 'none';
  }
  
  // Show create dungeon section if it exists
  const createDungeonSection = document.getElementById('create-dungeon-section');
  if (createDungeonSection) {
    createDungeonSection.style.display = 'block';
  }
  
  // Trigger payment verification to update UI
  if (typeof verifyPayment === 'function') {
    verifyPayment();
  }
  
  console.log('🧪 Testing unlock complete - paywall bypassed');
}
```

## 🧪 Testing

### Test Page
A dedicated test page is available at: `http://localhost:8000/test-version-click.html`

This page provides:
- Visual click counter
- Real-time feedback
- Success confirmation
- Console logging for debugging

### Manual Testing Steps
1. Open the main game at `http://localhost:8000`
2. Look for the version number "v6.5" in the lobby
3. Click it 6 times within 3 seconds
4. Watch for visual feedback (red flash on each click)
5. Verify success state (green "v6.5 🔓")
6. Check that multiplayer features are unlocked

## 🔧 Features

### Visual Feedback
- **Click Animation**: Version number flashes red for 150ms on each click
- **Counter Reset**: Visual indication when counter resets due to timeout
- **Success State**: Version changes to green and shows unlock symbol

### localStorage Changes
When unlocked, the following localStorage items are set:
- `multiplayerPaid`: `'true'`
- `testingUnlock`: `'true'`
- `stripe_session_id`: `'test_session_' + timestamp`
- `userId`: `'test_user_' + timestamp`

### UI Updates
- Hides the multiplayer payment wall modal
- Shows the create dungeon section
- Displays a success message overlay
- Triggers payment verification to update UI state

## 🚨 Security Notes

### Development Only
This feature is intended for testing and development purposes only. In production:
- Consider removing or disabling this feature
- Implement proper authentication and payment verification
- Add rate limiting to prevent abuse

### localStorage Security
The feature uses localStorage to simulate payment status. In production:
- Implement server-side verification
- Use secure session management
- Add proper authentication checks

## 📝 Console Logging

The feature provides detailed console logging:
- `🔧 Version tap count: X/6` - Shows current click count
- `🔓 Testing unlock activated!` - Confirms unlock trigger
- `🧪 TESTING MODE: Unlocking paywall...` - Shows unlock process
- `🧪 Testing unlock complete - paywall bypassed` - Confirms completion

## 🔄 Reset Behavior

The click counter automatically resets if:
- 3 seconds pass without any clicks
- The unlock is successfully triggered
- The page is refreshed

## 📱 Mobile Support

The feature works on both desktop and mobile devices:
- Desktop: Uses `click` event
- Mobile: Uses `touchend` event with `preventDefault()`
- Touch-friendly visual feedback

## 🎮 Integration with Game

When unlocked, the feature:
1. Bypasses the payment wall
2. Enables multiplayer room creation
3. Allows access to premium features
4. Maintains unlock state across page refreshes
5. Provides visual confirmation of unlock status 
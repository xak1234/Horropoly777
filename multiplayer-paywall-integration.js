// Comprehensive Multiplayer Paywall Integration
// This script ensures paywall enforcement across all multiplayer entry points

import multiplayerPaywall from './multiplayer-paywall-system.js';

class MultiplayerPaywallIntegration {
  constructor() {
    this.initialized = false;
    this.originalHandlers = new Map();
    this.init();
  }

  async init() {
    try {
      console.log('🔧 Initializing comprehensive multiplayer paywall integration...');
      
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
      }

      // Wait for paywall system to initialize
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check initial access status
      const hasAccess = await multiplayerPaywall.hasMultiplayerAccess();
      console.log('🔍 Initial multiplayer access status:', hasAccess);

      // Integrate with all known multiplayer entry points
      this.integrateAvailableRooms();
      this.integrateGamestart();
      this.integrateLobby();
      this.integrateGenericButtons();

      // Set up periodic access checks
      this.setupPeriodicChecks();

      this.initialized = true;
      console.log('✅ Multiplayer paywall integration complete');

      // Initial UI update
      this.updateAllUI();

    } catch (error) {
      console.error('❌ Failed to initialize paywall integration:', error);
    }
  }

  // Integration for available_rooms.html
  integrateAvailableRooms() {
    // Create dungeon button
    const createBtn = document.querySelector('.create-dungeon-btn');
    if (createBtn) {
      this.wrapButtonWithPaywall(createBtn, 'create dungeons');
    }

    // Join buttons (dynamically added)
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const joinButtons = node.querySelectorAll ? node.querySelectorAll('.join-button') : [];
            joinButtons.forEach(btn => {
              this.wrapButtonWithPaywall(btn, 'join dungeons');
            });
          }
        });
      });
    });

    const roomList = document.getElementById('roomList');
    if (roomList) {
      observer.observe(roomList, { childList: true, subtree: true });
    }
  }

  // Integration for gamestart.html
  integrateGamestart() {
    // Create room button
    const createRoomBtn = document.getElementById('create-room-btn');
    if (createRoomBtn) {
      this.wrapButtonWithPaywall(createRoomBtn, 'create multiplayer rooms');
    }

    // Join room button
    const joinRoomBtn = document.getElementById('join-room-btn');
    if (joinRoomBtn) {
      this.wrapButtonWithPaywall(joinRoomBtn, 'join multiplayer rooms');
    }

    // Lobby create button
    const lobbyCreateBtn = document.getElementById('create-room');
    if (lobbyCreateBtn) {
      this.wrapButtonWithPaywall(lobbyCreateBtn, 'create lobby rooms');
    }

    // Play vs Human button (if it leads to multiplayer)
    const vsHumanBtn = document.getElementById('vs-human-btn');
    if (vsHumanBtn) {
      this.wrapButtonWithPaywall(vsHumanBtn, 'play multiplayer games', false); // Don't disable, just check on click
    }
  }

  // Integration for lobby.js
  integrateLobby() {
    // These are handled by the lobby.js modifications we already made
    console.log('🔧 Lobby integration handled by lobby.js modifications');
  }

  // Integration for generic buttons that might be added dynamically
  integrateGenericButtons() {
    // Set up observers for dynamically added multiplayer buttons
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Look for buttons with multiplayer-related text or classes
            const buttons = node.querySelectorAll ? node.querySelectorAll('button') : [];
            buttons.forEach(btn => {
              const text = btn.textContent.toLowerCase();
              if (text.includes('create') && (text.includes('room') || text.includes('dungeon')) ||
                  text.includes('join') && (text.includes('room') || text.includes('dungeon')) ||
                  text.includes('multiplayer')) {
                this.wrapButtonWithPaywall(btn, 'access multiplayer features');
              }
            });
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Wrap a button with paywall check
  wrapButtonWithPaywall(button, actionDescription, disableWhenLocked = true) {
    if (button.dataset.paywallWrapped) return; // Already wrapped
    button.dataset.paywallWrapped = 'true';

    // Store original handler
    const originalOnClick = button.onclick;
    const originalHandlers = [];
    
    // Clone the button to get all event listeners (this is a workaround)
    const buttonClone = button.cloneNode(true);
    
    // Remove all existing event listeners by replacing the button
    const parent = button.parentNode;
    const newButton = button.cloneNode(true);
    parent.replaceChild(newButton, button);

    // Add our paywall-wrapped handler
    newButton.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();

      console.log(`🔍 Checking multiplayer access for: ${actionDescription}`);
      const hasAccess = await multiplayerPaywall.hasMultiplayerAccess();
      
      if (!hasAccess) {
        console.log(`🔒 Access denied for: ${actionDescription}`);
        multiplayerPaywall.showAccessDenied(actionDescription);
        return;
      }

      console.log(`✅ Access granted for: ${actionDescription}`);
      
      // If access is granted, execute original handler
      if (originalOnClick) {
        originalOnClick.call(newButton, event);
      }

      // Also trigger any other handlers that might have been on the original button
      // This is a best-effort approach since we can't perfectly clone all listeners
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      
      // Temporarily remove our handler to avoid infinite loop
      newButton.removeEventListener('click', arguments.callee);
      
      // Dispatch the event to trigger any other handlers
      setTimeout(() => {
        newButton.dispatchEvent(clickEvent);
        // Re-add our handler
        newButton.addEventListener('click', arguments.callee);
      }, 0);
    });

    return newButton;
  }

  // Update all UI elements based on current access status
  async updateAllUI() {
    try {
      const hasAccess = await multiplayerPaywall.hasMultiplayerAccess();
      console.log(`🔄 Updating all UI elements. Access status: ${hasAccess}`);

      if (hasAccess) {
        this.enableAllMultiplayerUI();
      } else {
        this.disableAllMultiplayerUI();
      }
    } catch (error) {
      console.error('❌ Error updating UI:', error);
      // On error, assume no access for security
      this.disableAllMultiplayerUI();
    }
  }

  // Enable all multiplayer UI elements
  enableAllMultiplayerUI() {
    console.log('✅ Enabling all multiplayer UI elements');

    // Enable create dungeon button
    const createBtn = document.querySelector('.create-dungeon-btn');
    if (createBtn && createBtn.textContent.includes('🔒')) {
      createBtn.disabled = false;
      createBtn.textContent = 'Create Dungeon';
      createBtn.style.opacity = '1';
      createBtn.style.cursor = 'pointer';
    }

    // Enable join buttons
    const joinButtons = document.querySelectorAll('.join-button');
    joinButtons.forEach(btn => {
      if (btn.textContent.includes('🔒')) {
        btn.disabled = false;
        btn.textContent = 'Join';
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
      }
    });

    // Enable gamestart buttons
    const createRoomBtn = document.getElementById('create-room-btn');
    if (createRoomBtn && createRoomBtn.textContent.includes('🔒')) {
      createRoomBtn.disabled = false;
      createRoomBtn.textContent = 'Create Room';
      createRoomBtn.style.opacity = '1';
      createRoomBtn.style.cursor = 'pointer';
    }

    const joinRoomBtn = document.getElementById('join-room-btn');
    if (joinRoomBtn && joinRoomBtn.textContent.includes('🔒')) {
      joinRoomBtn.disabled = false;
      joinRoomBtn.textContent = 'Join Room';
      joinRoomBtn.style.opacity = '1';
      joinRoomBtn.style.cursor = 'pointer';
    }

    // Remove paywall overlays
    const overlays = document.querySelectorAll('.paywall-overlay');
    overlays.forEach(overlay => overlay.remove());

    // Show multiplayer controls if they exist
    const multiplayerControls = document.querySelector('.multiplayer-controls');
    if (multiplayerControls) {
      multiplayerControls.style.display = 'flex';
    }
  }

  // Disable all multiplayer UI elements
  disableAllMultiplayerUI() {
    console.log('🔒 Disabling all multiplayer UI elements');

    // Disable create dungeon button
    const createBtn = document.querySelector('.create-dungeon-btn');
    if (createBtn) {
      createBtn.disabled = true;
      createBtn.textContent = '🔒 Unlock Required';
      createBtn.style.opacity = '0.6';
      createBtn.style.cursor = 'not-allowed';
    }

    // Disable join buttons (except already full rooms)
    const joinButtons = document.querySelectorAll('.join-button');
    joinButtons.forEach(btn => {
      if (!btn.textContent.includes('Full')) {
        btn.disabled = true;
        btn.textContent = '🔒 Unlock Required';
        btn.style.opacity = '0.6';
        btn.style.cursor = 'not-allowed';
      }
    });

    // Disable gamestart buttons
    const createRoomBtn = document.getElementById('create-room-btn');
    if (createRoomBtn) {
      createRoomBtn.disabled = true;
      createRoomBtn.textContent = '🔒 Unlock Required';
      createRoomBtn.style.opacity = '0.6';
      createRoomBtn.style.cursor = 'not-allowed';
    }

    const joinRoomBtn = document.getElementById('join-room-btn');
    if (joinRoomBtn) {
      joinRoomBtn.disabled = true;
      joinRoomBtn.textContent = '🔒 Unlock Required';
      joinRoomBtn.style.opacity = '0.6';
      joinRoomBtn.style.cursor = 'not-allowed';
    }

    // Add paywall overlays to create sections
    this.addPaywallOverlays();
  }

  // Add paywall overlays to multiplayer sections
  addPaywallOverlays() {
    // Add overlay to create dungeon section
    const createSection = document.querySelector('.create-dungeon-section');
    if (createSection && !createSection.querySelector('.paywall-overlay')) {
      const overlay = document.createElement('div');
      overlay.className = 'paywall-overlay';
      overlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        cursor: pointer;
        z-index: 100;
      `;
      overlay.innerHTML = `
        <div style="
          background: rgba(255, 0, 0, 0.9);
          color: white;
          padding: 8px 12px;
          border-radius: 6px;
          font-weight: bold;
          font-size: 10px;
          text-align: center;
          border: 1px solid rgba(255, 255, 255, 0.3);
        ">
          🔒 UNLOCK REQUIRED<br>
          <span style="font-size: 8px;">Click to purchase</span>
        </div>
      `;
      overlay.addEventListener('click', () => multiplayerPaywall.showPaywall());
      
      createSection.style.position = 'relative';
      createSection.appendChild(overlay);
    }

    // Add overlay to multiplayer controls
    const multiplayerControls = document.querySelector('.multiplayer-controls');
    if (multiplayerControls && !multiplayerControls.querySelector('.paywall-overlay')) {
      const overlay = document.createElement('div');
      overlay.className = 'paywall-overlay';
      overlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        cursor: pointer;
        z-index: 100;
      `;
      overlay.innerHTML = `
        <div style="
          background: rgba(255, 0, 0, 0.9);
          color: white;
          padding: 15px 20px;
          border-radius: 8px;
          font-weight: bold;
          font-size: 14px;
          text-align: center;
          border: 2px solid rgba(255, 255, 255, 0.3);
        ">
          🔒 MULTIPLAYER UNLOCK REQUIRED<br>
          <span style="font-size: 12px;">Click to purchase access</span>
        </div>
      `;
      overlay.addEventListener('click', () => multiplayerPaywall.showPaywall());
      
      multiplayerControls.style.position = 'relative';
      multiplayerControls.appendChild(overlay);
    }
  }

  // Set up periodic checks for payment status changes
  setupPeriodicChecks() {
    // Check every 30 seconds for payment status changes
    setInterval(async () => {
      try {
        const hasAccess = await multiplayerPaywall.hasMultiplayerAccess();
        const currentlyEnabled = !document.querySelector('.create-dungeon-btn')?.disabled;
        
        // Only update UI if status has changed
        if (hasAccess !== currentlyEnabled) {
          console.log(`🔄 Payment status changed: ${hasAccess}`);
          this.updateAllUI();
        }
      } catch (error) {
        console.error('❌ Error in periodic payment check:', error);
      }
    }, 30000);

    // Also check when window regains focus (user might have completed payment in another tab)
    window.addEventListener('focus', async () => {
      console.log('🔄 Window focused - checking payment status');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait a moment for any payment processing
      this.updateAllUI();
    });
  }

  // Manual refresh method that can be called externally
  async refresh() {
    console.log('🔄 Manual paywall integration refresh requested');
    await this.updateAllUI();
  }
}

// Create global instance
const paywallIntegration = new MultiplayerPaywallIntegration();

// Export for external use
window.multiplayerPaywallIntegration = paywallIntegration;

export default paywallIntegration;

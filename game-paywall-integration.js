// Game Paywall Integration
// This script adds paywall checks to direct game access via URL parameters

import multiplayerPaywall from './multiplayer-paywall-system.js';

class GamePaywallIntegration {
  constructor() {
    this.initialized = false;
    this.init();
  }

  async init() {
    try {
      console.log('🔧 Initializing game paywall integration...');
      
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
      }

      // Check URL parameters for multiplayer game access
      await this.checkMultiplayerGameAccess();

      this.initialized = true;
      console.log('✅ Game paywall integration complete');

    } catch (error) {
      console.error('❌ Failed to initialize game paywall integration:', error);
    }
  }

  async checkMultiplayerGameAccess() {
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get('roomId') || params.get('room');
    const playerName = params.get('player');
    const autostart = params.get('autostart') === '1';

    // If this is a multiplayer game (has roomId and player parameters)
    if (roomId && playerName) {
      console.log('🔍 Detected multiplayer game access attempt:', { roomId, playerName, autostart });
      
      // Check if user has multiplayer access
      const hasAccess = await multiplayerPaywall.hasMultiplayerAccess();
      
      if (!hasAccess) {
        console.log('🔒 Multiplayer access denied - redirecting to paywall');
        
        // Block the game from starting
        this.blockGameStart();
        
        // Show paywall with specific message for direct game access
        this.showGameAccessPaywall(roomId, playerName);
        
        return false;
      } else {
        console.log('✅ Multiplayer access verified - allowing game to continue');
        return true;
      }
    }

    // Not a multiplayer game, allow to continue
    return true;
  }

  blockGameStart() {
    // Hide the game container
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
      gameContainer.style.display = 'none';
    }

    // Hide intro screen if it exists
    const introScreen = document.getElementById('intro-screen');
    if (introScreen) {
      introScreen.style.display = 'none';
    }

    // Prevent game initialization by overriding key functions
    if (window.startAIGame) {
      window.startAIGame = () => {
        console.log('🔒 Game start blocked - payment required');
      };
    }

    // Block multiplayer initialization
    if (window.initializeMultiplayerControls) {
      const originalInit = window.initializeMultiplayerControls;
      window.initializeMultiplayerControls = async () => {
        console.log('🔒 Multiplayer initialization blocked - payment required');
        return;
      };
    }
  }

  showGameAccessPaywall(roomId, playerName) {
    // Remove any existing paywall modal
    const existingModal = document.getElementById('game-access-paywall-modal');
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'game-access-paywall-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.95);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    `;

    modal.innerHTML = `
      <div style="
        background: rgba(20, 20, 20, 0.98);
        border: 3px solid #ff0000;
        border-radius: 20px;
        padding: 40px;
        text-align: center;
        color: white;
        max-width: 600px;
        width: 90%;
        box-shadow: 0 0 50px rgba(255, 0, 0, 0.5);
        animation: modalPulse 2s ease-in-out infinite alternate;
      ">
        <style>
          @keyframes modalPulse {
            0% { box-shadow: 0 0 50px rgba(255, 0, 0, 0.5); }
            100% { box-shadow: 0 0 70px rgba(255, 0, 0, 0.8); }
          }
        </style>
        
        <h1 style="color: #ff0000; margin-bottom: 20px; font-size: 28px; text-shadow: 0 0 15px #ff0000;">
          🔒 MULTIPLAYER ACCESS REQUIRED
        </h1>
        
        <div style="
          background: rgba(139, 0, 0, 0.3);
          border: 2px solid rgba(255, 0, 0, 0.5);
          border-radius: 15px;
          padding: 25px;
          margin: 25px 0;
        ">
          <h3 style="color: #ff6666; margin-bottom: 15px; font-size: 20px;">🎮 Game Access Blocked</h3>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
            You're trying to join a multiplayer game, but you haven't unlocked multiplayer access yet.
          </p>
          <div style="
            background: rgba(0, 0, 0, 0.4);
            border-radius: 8px;
            padding: 15px;
            margin: 15px 0;
            font-family: monospace;
          ">
            <div style="color: #ffaa00; font-size: 14px;">🏰 Room: <strong>${roomId}</strong></div>
            <div style="color: #ffaa00; font-size: 14px;">👤 Player: <strong>${playerName}</strong></div>
          </div>
        </div>

        <div style="
          background: rgba(0, 100, 0, 0.2);
          border: 1px solid rgba(0, 255, 0, 0.3);
          border-radius: 10px;
          padding: 20px;
          margin: 20px 0;
        ">
          <h3 style="color: #00ff00; margin-bottom: 15px;">✨ Unlock Multiplayer Features:</h3>
          <ul style="text-align: left; margin: 0; padding-left: 20px; color: #ccc; line-height: 1.8;">
            <li>🏰 Create and join custom dungeons</li>
            <li>👥 Play with up to 4 friends</li>
            <li>🌐 Real-time multiplayer gameplay</li>
            <li>📱 Cross-device compatibility</li>
            <li>🎯 Exclusive multiplayer features</li>
          </ul>
        </div>

        <div style="margin: 30px 0;">
          <button onclick="window.gamePaywallIntegration.startPayment()" style="
            background: linear-gradient(45deg, #ff0000, #cc0000);
            color: white;
            border: none;
            padding: 18px 35px;
            border-radius: 10px;
            cursor: pointer;
            font-weight: bold;
            font-size: 18px;
            margin-right: 15px;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(255, 0, 0, 0.3);
          " onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 6px 20px rgba(255, 0, 0, 0.5)'" 
             onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 15px rgba(255, 0, 0, 0.3)'">
            💳 Unlock Multiplayer (£1.99)
          </button>
          <button onclick="window.gamePaywallIntegration.goToLobby()" style="
            background: #666;
            color: white;
            border: none;
            padding: 18px 35px;
            border-radius: 10px;
            cursor: pointer;
            font-weight: bold;
            font-size: 18px;
            transition: all 0.3s ease;
          " onmouseover="this.style.background='#777'" onmouseout="this.style.background='#666'">
            🏠 Go to Lobby
          </button>
        </div>

        <p style="font-size: 12px; color: #888; margin-top: 20px; line-height: 1.4;">
          🔒 Secure payment via Stripe • 🛡️ One-time purchase • 📱 Works on up to 3 devices<br>
          💡 <strong>Tip:</strong> After purchase, you can return to this game link to join automatically
        </p>
      </div>
    `;

    document.body.appendChild(modal);

    // Add escape key handler
    const escapeHandler = (event) => {
      if (event.key === 'Escape') {
        this.goToLobby();
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);
  }

  async startPayment() {
    try {
      await multiplayerPaywall.startPayment();
    } catch (error) {
      console.error('Payment start failed:', error);
      alert('Failed to start payment. Please try again.');
    }
  }

  goToLobby() {
    // Perform a full reset before leaving, same as the player info panel reset
    try {
      // Ensure restart.js is loaded; then trigger a reset with lobby redirect
      window.RESTART_REDIRECT_URL = 'https://horropoly.com';
      if (typeof window.restartGame === 'function') {
        window.restartGame();
      } else {
        // Fallback: direct redirect if restart not available
        window.location.href = 'https://horropoly.com';
      }
    } catch (e) {
      window.location.href = 'https://horropoly.com';
    }
  }

  // Method to check if current page access should be blocked
  async shouldBlockAccess() {
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get('roomId') || params.get('room');
    const playerName = params.get('player');

    if (roomId && playerName) {
      const hasAccess = await multiplayerPaywall.hasMultiplayerAccess();
      return !hasAccess;
    }

    return false;
  }

  // Method to be called after successful payment
  async onPaymentSuccess() {
    console.log('🎉 Payment successful - reloading game');
    
    // Remove paywall modal
    const modal = document.getElementById('game-access-paywall-modal');
    if (modal) {
      modal.remove();
    }

    // Reload the page to start the game
    window.location.reload();
  }
}

// Create global instance
const gamePaywallIntegration = new GamePaywallIntegration();

// Make it globally accessible
window.gamePaywallIntegration = gamePaywallIntegration;

// Listen for payment success events
window.addEventListener('multiplayerPaymentSuccess', () => {
  gamePaywallIntegration.onPaymentSuccess();
});

export default gamePaywallIntegration;

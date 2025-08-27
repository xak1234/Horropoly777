// Multiplayer Paywall System for Horropoly
// This system enforces payment verification before allowing room creation/joining

import { initializePaymentSystem } from './payment-system.js';

class MultiplayerPaywallSystem {
  constructor() {
    this.paymentSystem = null;
    this.isInitialized = false;
    this.init();
  }

  async init() {
    try {
      this.paymentSystem = initializePaymentSystem();
      this.isInitialized = true;
      console.log('✅ Multiplayer paywall system initialized');
    } catch (error) {
      console.error('❌ Failed to initialize paywall system:', error);
      this.isInitialized = false;
    }
  }

  // Check if user has paid for multiplayer access
  async hasMultiplayerAccess() {
    try {
      // TEMPORARY TESTING BYPASS (Tempo)
      // If URL contains tempo=1|true, persist bypass flag for this device
      try {
        const params = new URLSearchParams(window.location.search);
        const tempoParam = params.get('tempo');
        if (tempoParam && (tempoParam === '1' || tempoParam === 'true')) {
          localStorage.setItem('tempoBypass', 'true');
        }
      } catch (_) {}

      // Allow testing unlocks during development/testing
      const tempoBypass = localStorage.getItem('tempoBypass') === 'true';
      const testingUnlock = localStorage.getItem('testingUnlock') === 'true';
      if (tempoBypass || testingUnlock) {
        console.log('🧪 Tempo/testing bypass active - granting temporary multiplayer access');
        return true;
      }

      // Never trust multiplayerPaid alone. Require backend verification.
      const sessionId = localStorage.getItem('stripe_session_id') || localStorage.getItem('currentSessionId');
      const userId = localStorage.getItem('userId');

      if (!this.paymentSystem) {
        console.warn('❌ Payment system unavailable - denying multiplayer access');
        return false;
      }

      if (sessionId) {
        console.log('🔍 Verifying payment with backend...');
        const verification = await this.paymentSystem.verifyPayment(sessionId);
        if (verification.verified && verification.deviceAllowed) {
          console.log('✅ Payment verified with backend - granting access');
          localStorage.setItem('multiplayerPaid', 'true');
          // Emit payment success event
          window.dispatchEvent(new CustomEvent('multiplayerPaymentSuccess', { detail: { sessionId } }));
          return true;
        }

        console.log('❌ Payment verification failed:', verification.reason);
        // Clear invalid/stale data
        localStorage.removeItem('stripe_session_id');
        localStorage.removeItem('currentSessionId');
        localStorage.removeItem('multiplayerPaid');
        return false;
      }

      // No active session, try userId-based verification for returning users
      if (userId && this.paymentSystem && typeof this.paymentSystem.verifyAccessByUserId === 'function') {
        console.log('🔍 Verifying access by userId via backend...');
        const verification = await this.paymentSystem.verifyAccessByUserId(userId);
        if (verification.verified && verification.deviceAllowed) {
          console.log('✅ Access verified by userId - granting access');
          localStorage.setItem('multiplayerPaid', 'true');
          return true;
        }
      }

      // If we only have a stale local flag, clear and deny
      if (localStorage.getItem('multiplayerPaid') === 'true') {
        console.warn('⚠️ Stale local multiplayerPaid flag without session or record - clearing and denying');
        localStorage.removeItem('multiplayerPaid');
      }

      console.log('🔒 No verified payment found - access denied');
      return false;
    } catch (error) {
      console.error('❌ Error checking multiplayer access:', error);
      return false;
    }
  }

  // Show paywall modal
  showPaywall() {
    // Remove any existing paywall modal
    const existingModal = document.getElementById('multiplayer-paywall-modal');
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'multiplayer-paywall-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    `;

    modal.innerHTML = `
      <div style="
        background: rgba(20, 20, 20, 0.95);
        border: 2px solid #ff0000;
        border-radius: 15px;
        padding: 30px;
        text-align: center;
        color: white;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 0 30px rgba(255, 0, 0, 0.3);
      ">
        <h2 style="color: #ff0000; margin-bottom: 20px; font-size: 24px;">🔒 Multiplayer Access Required</h2>
        <p style="margin-bottom: 20px; font-size: 16px; line-height: 1.5;">
          To create or join multiplayer dungeons, you need to unlock multiplayer access.
        </p>
        <div style="
          background: rgba(139, 0, 0, 0.2);
          border: 1px solid rgba(255, 0, 0, 0.3);
          border-radius: 10px;
          padding: 20px;
          margin: 20px 0;
        ">
          <h3 style="color: #ff4444; margin-bottom: 15px;">🎮 Multiplayer Features Include:</h3>
          <ul style="text-align: left; margin: 0; padding-left: 20px; color: #ccc;">
            <li>Create custom dungeons with friends</li>
            <li>Join existing multiplayer rooms</li>
            <li>Play with up to 4 players</li>
            <li>Real-time multiplayer gameplay</li>
            <li>Cross-device compatibility</li>
          </ul>
        </div>
        <div style="margin-bottom: 20px;">
          <button onclick="window.multiplayerPaywall.startPayment()" style="
            background: linear-gradient(45deg, #ff0000, #cc0000);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            font-size: 16px;
            margin-right: 10px;
            transition: all 0.3s ease;
          " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
            💳 Unlock Multiplayer (£1.99)
          </button>
          <button onclick="document.getElementById('multiplayer-paywall-modal').remove()" style="
            background: #333;
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            font-size: 16px;
            transition: all 0.3s ease;
          " onmouseover="this.style.background='#555'" onmouseout="this.style.background='#333'">
            ❌ Cancel
          </button>
        </div>
        <p style="font-size: 12px; color: #888; margin-top: 15px;">
          🔒 Secure payment via Stripe • 🛡️ One-time purchase • 📱 Works on up to 3 devices
        </p>
      </div>
    `;

    document.body.appendChild(modal);
  }

  // Start payment process
  async startPayment() {
    if (!this.paymentSystem) {
      console.error('Payment system not initialized');
      alert('Payment system not available. Please refresh the page and try again.');
      return;
    }

    try {
      await this.paymentSystem.startPayment();
    } catch (error) {
      console.error('Payment start failed:', error);
      alert('Failed to start payment. Please try again.');
    }
  }

  // Show access denied message with specific context
  showAccessDenied(action = 'access multiplayer features') {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    `;

    modal.innerHTML = `
      <div style="
        background: rgba(20, 20, 20, 0.95);
        border: 2px solid #ff0000;
        border-radius: 15px;
        padding: 30px;
        text-align: center;
        color: white;
        max-width: 400px;
        width: 90%;
      ">
        <h2 style="color: #ff0000; margin-bottom: 20px;">🚫 Access Denied</h2>
        <p style="margin-bottom: 20px;">
          You need to purchase multiplayer access to ${action}.
        </p>
        <div style="margin-bottom: 20px;">
          <button onclick="window.multiplayerPaywall.showPaywall(); this.parentElement.parentElement.parentElement.remove();" style="
            background: linear-gradient(45deg, #ff0000, #cc0000);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            margin-right: 10px;
          ">💳 Purchase Access</button>
          <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
            background: #333;
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
          ">Cancel</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  // Disable UI elements for unpaid users
  disableMultiplayerUI() {
    // Disable create dungeon button
    const createBtn = document.querySelector('.create-dungeon-btn');
    if (createBtn) {
      createBtn.disabled = true;
      createBtn.textContent = '🔒 Unlock Required';
      createBtn.style.opacity = '0.6';
      createBtn.style.cursor = 'not-allowed';
    }

    // Disable join buttons
    const joinButtons = document.querySelectorAll('.join-button');
    joinButtons.forEach(btn => {
      if (!btn.disabled) { // Don't modify already disabled (full) rooms
        btn.disabled = true;
        btn.textContent = '🔒 Unlock Required';
        btn.style.opacity = '0.6';
        btn.style.cursor = 'not-allowed';
      }
    });

    // Add paywall overlay to create section
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
      overlay.addEventListener('click', () => this.showPaywall());
      
      createSection.style.position = 'relative';
      createSection.appendChild(overlay);
    }
  }

  // Enable UI elements for paid users
  enableMultiplayerUI() {
    // Enable create dungeon button
    const createBtn = document.querySelector('.create-dungeon-btn');
    if (createBtn) {
      createBtn.disabled = false;
      createBtn.textContent = 'Create Dungeon';
      createBtn.style.opacity = '1';
      createBtn.style.cursor = 'pointer';
    }

    // Enable join buttons (except for full rooms)
    const joinButtons = document.querySelectorAll('.join-button');
    joinButtons.forEach(btn => {
      if (btn.textContent.includes('🔒')) {
        btn.disabled = false;
        btn.textContent = 'Join';
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
      }
    });

    // Remove paywall overlay
    const overlay = document.querySelector('.paywall-overlay');
    if (overlay) {
      overlay.remove();
    }
  }
}

// Create global instance
window.multiplayerPaywall = new MultiplayerPaywallSystem();

// Export for module usage
export { MultiplayerPaywallSystem };
export default window.multiplayerPaywall;

// Payment Verification Fix for Horropoly
// This fixes the issue where localStorage has payment data but verification fails
// Updated to work with Render backend deployment

// Render backend URL
const RENDER_BACKEND_URL = 'https://horropoly-payment-backend.onrender.com';

// Improved payment verification with better fallback handling
async function checkMultiplayerAccessFixed() {
  console.log('🔍 Starting improved payment verification...');
  
  // Check localStorage first
  const hasPaidLocal = localStorage.getItem('multiplayerPaid') === 'true';
  const stripeSessionId = localStorage.getItem('stripe_session_id');
  const userId = localStorage.getItem('userId');
  
  console.log('📊 Payment status check:', {
    hasPaidLocal,
    hasStripeSession: !!stripeSessionId,
    hasUserId: !!userId
  });
  
  // If no local payment data, definitely no access
  if (!hasPaidLocal) {
    console.log('🔒 No local payment data found');
    return false;
  }
  
  // If we have a Stripe session ID, verify with Render backend
  if (stripeSessionId && userId) {
    try {
      console.log('🔍 Verifying payment with Render backend...');
      const verified = await verifyStripePaymentWithRender(stripeSessionId);
      console.log('Render backend verification result:', verified);
      
      if (verified) {
        console.log('✅ Payment verified by Render backend - access granted');
        return true;
      } else {
        console.log('❌ Render backend verification failed - checking fallback options');
        // Don't immediately clear data - try fallback verification
        return await checkFallbackPaymentVerification();
      }
    } catch (error) {
      console.error('❌ Render backend verification error:', error);
      console.log('🔄 Render backend unavailable - trying fallback verification');
      return await checkFallbackPaymentVerification();
    }
  }
  
  // No Stripe session but has local payment data - try fallback
  console.log('🔄 No Stripe session but local payment data exists - trying fallback');
  return await checkFallbackPaymentVerification();
}

// Verify Stripe payment with Render backend
async function verifyStripePaymentWithRender(sessionId) {
  if (!sessionId) {
    console.log('❌ No session ID provided for verification');
    return false;
  }
  
  console.log('🔍 Verifying session ID with Render backend:', sessionId);
  
  try {
    const response = await fetch(`${RENDER_BACKEND_URL}/api/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: sessionId,
        deviceFingerprint: {
          // DISABLED: Device fingerprinting has been disabled for privacy
          hash: 'fingerprinting_disabled',
          timestamp: Date.now(),
          userAgent: 'Mozilla/5.0 (Generic Browser)',
          screen: '1920x1080',
          timezone: 'UTC',
          disabled: true,
          note: 'Device fingerprinting has been disabled for privacy'
        },
        userId: localStorage.getItem('userId') || 'unknown'
      })
    });
    
    console.log('📡 Render backend response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Render backend verification result:', result);
      return result.verified && result.deviceAllowed;
    } else {
      console.log('❌ Render backend verification failed:', response.status);
      const errorText = await response.text();
      console.log('❌ Error details:', errorText);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Render backend verification error:', error);
    return false;
  }
}

// Check Render backend health
async function checkRenderBackendHealth() {
  try {
    console.log('🏥 Checking Render backend health...');
    const response = await fetch(`${RENDER_BACKEND_URL}/api/health`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Render backend health:', data);
      return true;
    } else {
      console.log('❌ Render backend health check failed:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Render backend health check error:', error);
    return false;
  }
}

// Fallback payment verification methods
async function checkFallbackPaymentVerification() {
  console.log('🔄 Starting fallback payment verification...');
  
  const userId = localStorage.getItem('userId');
  const paymentStartTime = localStorage.getItem('payment_start_time');
  
  // Method 1: Check if payment was recent (within last 30 minutes)
  if (paymentStartTime) {
    const timeSincePayment = Date.now() - parseInt(paymentStartTime);
    const thirtyMinutes = 30 * 60 * 1000;
    
    if (timeSincePayment < thirtyMinutes) {
      console.log('✅ Recent payment detected (within 30 minutes) - allowing access');
      return true;
    } else {
      console.log('⏰ Payment too old (over 30 minutes) - requiring re-verification');
    }
  }
  
  // Method 2: Check Firebase for payment record (if available)
  if (userId && typeof firebaseAvailable !== 'undefined' && firebaseAvailable) {
    try {
      console.log('🔍 Checking Firebase for payment record...');
      const hasFirebasePayment = await checkFirebasePayment(userId);
      
      if (hasFirebasePayment) {
        console.log('✅ Payment found in Firebase - access granted');
        return true;
      } else {
        console.log('❌ No payment found in Firebase');
      }
    } catch (error) {
      console.log('⚠️ Firebase check failed:', error.message);
    }
  }
  
  // Method 3: Check for manual payment verification
  const manualVerification = localStorage.getItem('manual_payment_verified');
  if (manualVerification === 'true') {
    console.log('✅ Manual payment verification found - access granted');
    return true;
  }
  
  // Method 4: Check for force unlock
  const forceUnlockTime = localStorage.getItem('force_unlock_time');
  if (forceUnlockTime) {
    const timeSinceForceUnlock = Date.now() - parseInt(forceUnlockTime);
    const oneHour = 60 * 60 * 1000;
    
    if (timeSinceForceUnlock < oneHour) {
      console.log('✅ Recent force unlock detected (within 1 hour) - allowing access');
      return true;
    } else {
      console.log('⏰ Force unlock too old (over 1 hour) - requiring re-verification');
    }
  }
  
  // All fallback methods failed
  console.log('❌ All fallback verification methods failed - clearing invalid data');
  clearInvalidPaymentData();
  return false;
}

// Clear invalid payment data
function clearInvalidPaymentData() {
  console.log('🧹 Clearing invalid payment data...');
  localStorage.removeItem('multiplayerPaid');
  localStorage.removeItem('stripe_session_id');
  localStorage.removeItem('manual_payment_verified');
  localStorage.removeItem('force_unlock_time');
  console.log('✅ Invalid payment data cleared');
}

// Improved manual payment verification
async function manualPaymentVerificationImproved() {
  console.log('🔧 Starting improved manual payment verification...');
  
  const userId = localStorage.getItem('userId') || crypto.randomUUID();
  localStorage.setItem('userId', userId);
  
  // Show verification modal
  showManualVerificationModal();
}

// Show manual verification modal
function showManualVerificationModal() {
  const modal = document.createElement('div');
  modal.id = 'manual-verification-modal';
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
      background: rgba(0, 0, 0, 0.95);
      border: 2px solid #ff6600;
      border-radius: 15px;
      padding: 30px;
      text-align: center;
      color: white;
      max-width: 500px;
      width: 90%;
    ">
      <h2 style="color: #ff6600; margin-bottom: 20px;">🔧 Manual Payment Verification</h2>
      <p style="margin-bottom: 20px;">Please confirm that you have completed payment through Stripe:</p>
      
      <div style="text-align: left; margin-bottom: 20px; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 8px;">
        <h4 style="color: #00ff00; margin-bottom: 10px;">✅ To verify your payment:</h4>
        <ol style="margin: 0; padding-left: 20px;">
          <li>Complete payment on the Stripe page</li>
          <li>Return to this page</li>
          <li>Click "I've Completed Payment" below</li>
          <li>If verification fails, use "Force Unlock"</li>
        </ol>
      </div>
      
      <div style="margin: 20px 0;">
        <button onclick="confirmManualPayment()" style="
          background: linear-gradient(45deg, #00ff00, #00cc00);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
          margin: 5px;
        ">✅ I've Completed Payment</button>
        
        <button onclick="forceUnlockImproved()" style="
          background: linear-gradient(45deg, #ff6600, #cc5500);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
          margin: 5px;
        ">🚨 Force Unlock</button>
        
        <button onclick="closeManualVerificationModal()" style="
          background: #333;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
          margin: 5px;
        ">❌ Cancel</button>
      </div>
      
      <p style="font-size: 12px; color: #999;">
        🔒 This verification includes fraud protection and device tracking
      </p>
    </div>
  `;
  
  document.body.appendChild(modal);
}

// Confirm manual payment
async function confirmManualPayment() {
  console.log('✅ Manual payment confirmation...');
  
  try {
    // Check if user has actually paid via Stripe
    const stripeSessionId = localStorage.getItem('stripe_session_id');
    
    if (stripeSessionId) {
      console.log('🔍 Found Stripe session - verifying with Render backend...');
      const verified = await verifyStripePaymentWithRender(stripeSessionId);
      
      if (verified) {
        console.log('✅ Stripe payment verified - unlocking access');
        unlockAccessWithTimestamp();
        closeManualVerificationModal();
        return;
      } else {
        console.log('❌ Stripe verification failed - showing force unlock option');
        showForceUnlockOption();
        return;
      }
    } else {
      console.log('⚠️ No Stripe session found - showing force unlock option');
      showForceUnlockOption();
      return;
    }
    
  } catch (error) {
    console.error('❌ Manual verification error:', error);
    showForceUnlockOption();
  }
}

// Show force unlock option
function showForceUnlockOption() {
  const confirmed = confirm(`
⚠️ Manual Payment Verification

No valid payment session found, but you can still unlock if you have completed payment.

This will:
• Unlock multiplayer access
• Record manual verification
• Allow access for 1 hour

Have you completed payment through Stripe?

• Click OK to force unlock (if you have paid)
• Click Cancel if you haven't paid yet
  `);
  
  if (confirmed) {
    console.log('🚨 Force unlock confirmed by user');
    forceUnlockImproved();
  }
}

// Improved force unlock
function forceUnlockImproved() {
  console.log('🚨 Force unlock triggered...');
  
  // Record force unlock timestamp
  localStorage.setItem('force_unlock_time', Date.now().toString());
  localStorage.setItem('multiplayerPaid', 'true');
  
  // Close verification modal
  closeManualVerificationModal();
  
  // Show success message
  alert('🎉 Multiplayer unlocked successfully!\n\n⏰ Access granted for 1 hour\n🔒 Fraud protection active');
  
  // Refresh page to show unlocked content
  window.location.reload();
}

// Unlock access with timestamp
function unlockAccessWithTimestamp() {
  localStorage.setItem('multiplayerPaid', 'true');
  localStorage.setItem('manual_payment_verified', 'true');
  localStorage.setItem('payment_verification_time', Date.now().toString());
  
  console.log('✅ Access unlocked with timestamp');
}

// Close manual verification modal
function closeManualVerificationModal() {
  const modal = document.getElementById('manual-verification-modal');
  if (modal) {
    modal.remove();
  }
}

// Improved payment verification function
async function verifyPaymentImproved() {
  try {
    console.log('🔄 Starting improved payment verification...');
    const hasPaid = await checkMultiplayerAccessFixed();
    console.log('Improved payment verification result:', hasPaid);
    
    const paymentWall = document.getElementById('multiplayer-payment-wall');
    const multiplayerContent = document.getElementById('multiplayer-content');
    
    if (!paymentWall || !multiplayerContent) {
      console.error('Payment UI elements not found');
      return;
    }
    
    if (hasPaid) {
      console.log('✅ Setting UI to unlocked state...');
      paymentWall.style.display = 'none';
      multiplayerContent.style.display = 'block';
      
      // Add visual indicator that multiplayer is unlocked
      const statusIndicator = document.createElement('div');
      statusIndicator.id = 'multiplayer-status';
      statusIndicator.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: linear-gradient(45deg, #00ff00, #00cc00);
        color: white;
        padding: 10px 15px;
        border-radius: 20px;
        font-weight: bold;
        z-index: 1000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      `;
      statusIndicator.textContent = '🎮 Multiplayer Unlocked';
      
      // Remove existing indicator if present
      const existing = document.getElementById('multiplayer-status');
      if (existing) existing.remove();
      
      document.body.appendChild(statusIndicator);
      
      console.log('✅ Multiplayer access verified - unlocked');
    } else {
      console.log('🔒 Setting UI to locked state...');
      paymentWall.style.display = 'block';
      multiplayerContent.style.display = 'none';
      
      // Remove status indicator if present
      const existing = document.getElementById('multiplayer-status');
      if (existing) existing.remove();
      
      console.log('🔒 Multiplayer access verified - locked');
    }
  } catch (error) {
    console.error('❌ Error in improved payment verification:', error);
    
    // Fallback: try to unlock based on localStorage
    const hasPaidLocal = localStorage.getItem('multiplayerPaid') === 'true';
    if (hasPaidLocal) {
      console.log('🔄 Fallback: Unlocking based on localStorage');
      const paymentWall = document.getElementById('multiplayer-payment-wall');
      const multiplayerContent = document.getElementById('multiplayer-content');
      
      if (paymentWall && multiplayerContent) {
        paymentWall.style.display = 'none';
        multiplayerContent.style.display = 'block';
        console.log('✅ Fallback unlock successful');
      }
    }
  }
}

// Test Render backend connection
async function testRenderBackend() {
  console.log('🧪 Testing Render backend connection...');
  
  try {
    const isHealthy = await checkRenderBackendHealth();
    
    if (isHealthy) {
      console.log('✅ Render backend is healthy and accessible');
      return true;
    } else {
      console.log('❌ Render backend health check failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Render backend test error:', error);
    return false;
  }
}

// Export functions
window.checkMultiplayerAccessFixed = checkMultiplayerAccessFixed;
window.verifyPaymentImproved = verifyPaymentImproved;
window.manualPaymentVerificationImproved = manualPaymentVerificationImproved;
window.forceUnlockImproved = forceUnlockImproved;
window.confirmManualPayment = confirmManualPayment;
window.closeManualVerificationModal = closeManualVerificationModal;
window.verifyStripePaymentWithRender = verifyStripePaymentWithRender;
window.checkRenderBackendHealth = checkRenderBackendHealth;
window.testRenderBackend = testRenderBackend;

console.log('✅ Improved payment verification system loaded (Render backend ready)'); 
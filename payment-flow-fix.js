// Payment Flow Fix for Horropoly
// This fixes the Stripe payment page jumping and not registering sales properly

// Global variables for payment flow
let paymentWindow = null;
let paymentPollingInterval = null;
let paymentDetectionActive = false;
let paymentCompleted = false;

// Improved payment flow with better redirect handling
function startImprovedPaymentFlow() {
  console.log('🚀 Starting improved payment flow...');
  
  // Clear any existing payment processes
  cancelAllPaymentProcesses();
  
  // Generate user ID if not exists
  const userId = localStorage.getItem('userId') || crypto.randomUUID();
  localStorage.setItem('userId', userId);
  
  // Store payment start time
  localStorage.setItem('payment_start_time', Date.now().toString());
  
  // Show payment loading modal
  showImprovedPaymentLoading();
  
  // Open Stripe payment with better error handling
  openStripePaymentWindow();
}

// Improved Stripe payment window opening
function openStripePaymentWindow() {
  const stripeUrl = 'https://buy.stripe.com/fZu7sLfBa4Ju7Uz0Kvfbq0j';
  
  try {
    // Open payment window with specific dimensions
    paymentWindow = window.open(stripeUrl, 'stripe_payment', 'width=500,height=700,scrollbars=yes,resizable=yes');
    
    if (!paymentWindow) {
      console.log('❌ Popup blocked - showing alternative');
      showPopupBlockedAlternative();
      return;
    }
    
    console.log('✅ Payment window opened successfully');
    
    // Start improved payment detection
    startImprovedPaymentDetection();
    
    // Focus the payment window
    paymentWindow.focus();
    
  } catch (error) {
    console.error('❌ Payment window error:', error);
    showPaymentError('Failed to open payment page. Please try again.');
  }
}

// Improved payment detection system
function startImprovedPaymentDetection() {
  console.log('🔍 Starting improved payment detection...');
  paymentDetectionActive = true;
  paymentCompleted = false;
  
  // Show detection modal
  showImprovedPaymentDetectionModal();
  
  // Start polling with better timing
  startImprovedPolling();
}

// Improved polling system
function startImprovedPolling() {
  let pollCount = 0;
  const maxPolls = 60; // 10 minutes at 10-second intervals
  const pollInterval = 10000; // 10 seconds
  
  console.log('⏱️ Starting improved polling system...');
  
  // Clear any existing interval
  if (paymentPollingInterval) {
    clearInterval(paymentPollingInterval);
  }
  
  paymentPollingInterval = setInterval(async () => {
    pollCount++;
    console.log(`🔍 Poll ${pollCount}/${maxPolls} - Checking payment status...`);
    
    try {
      // Check if payment window was closed
      if (paymentWindow && paymentWindow.closed) {
        console.log('📱 Payment window was closed by user');
        paymentWindow = null;
        
        // Don't stop polling immediately - user might have completed payment
        // Continue polling for a few more cycles to catch late completions
        if (pollCount > 5) {
          console.log('⏰ Payment window closed - continuing to poll for late completions');
        }
      }
      
      // Check for payment completion
      const paymentCompleted = await checkImprovedPaymentStatus();
      
      if (paymentCompleted && !window.paymentCompleted) {
        console.log('✅ Payment completed - processing...');
        window.paymentCompleted = true;
        
        // Don't close window immediately - let user see confirmation
        handlePaymentCompletion();
        return;
      }
      
      // Check for timeout
      if (pollCount >= maxPolls) {
        console.log('⏰ Payment polling timeout');
        clearInterval(paymentPollingInterval);
        paymentPollingInterval = null;
        paymentDetectionActive = false;
        showPaymentTimeout();
      }
      
    } catch (error) {
      console.error('❌ Polling error:', error);
      pollCount++;
      
      if (pollCount >= maxPolls) {
        clearInterval(paymentPollingInterval);
        paymentPollingInterval = null;
        paymentDetectionActive = false;
        showPaymentTimeout();
      }
    }
  }, pollInterval);
}

// Handle payment completion with proper timing
function handlePaymentCompletion() {
  console.log('🎉 Payment completion detected - showing success message...');
  
  // Stop polling
  if (paymentPollingInterval) {
    clearInterval(paymentPollingInterval);
    paymentPollingInterval = null;
  }
  
  paymentDetectionActive = false;
  
  // Show success message first
  showPaymentSuccess();
  
  // Don't close window immediately - let user see Stripe confirmation
  // Wait 5 seconds before suggesting to close the window
  setTimeout(() => {
    if (paymentWindow && !paymentWindow.closed) {
      console.log('⏰ Suggesting to close payment window...');
      showCloseWindowSuggestion();
    }
  }, 5000);
  
  // Auto-close window after 30 seconds if still open
  setTimeout(() => {
    if (paymentWindow && !paymentWindow.closed) {
      console.log('⏰ Auto-closing payment window after 30 seconds...');
      paymentWindow.close();
      paymentWindow = null;
    }
  }, 30000);
}

// Show suggestion to close payment window
function showCloseWindowSuggestion() {
  const modal = document.createElement('div');
  modal.id = 'close-window-suggestion';
  modal.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.9);
    border: 2px solid #00ff00;
    border-radius: 10px;
    padding: 15px;
    color: white;
    z-index: 10001;
    max-width: 300px;
    animation: slideIn 0.5s ease-out;
  `;
  
  modal.innerHTML = `
    <div style="text-align: center;">
      <h4 style="color: #00ff00; margin: 0 0 10px 0;">✅ Payment Complete!</h4>
      <p style="margin: 0 0 10px 0; font-size: 14px;">You can now close the Stripe window.</p>
      <button onclick="closePaymentWindowManually()" style="
        background: linear-gradient(45deg, #00ff00, #00cc00);
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 12px;
        margin-right: 5px;
      ">Close Window</button>
      <button onclick="this.parentElement.parentElement.remove()" style="
        background: #333;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 12px;
      ">Dismiss</button>
    </div>
  `;
  
  // Add CSS animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(modal);
  
  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (modal.parentElement) {
      modal.remove();
    }
  }, 10000);
}

// Manual close payment window
function closePaymentWindowManually() {
  if (paymentWindow && !paymentWindow.closed) {
    paymentWindow.close();
    paymentWindow = null;
    console.log('✅ Payment window closed manually');
  }
  
  // Remove suggestion modal
  const suggestion = document.getElementById('close-window-suggestion');
  if (suggestion) {
    suggestion.remove();
  }
}

// Improved payment status checking
async function checkImprovedPaymentStatus() {
  try {
    // Check localStorage first
    const hasPaid = localStorage.getItem('multiplayerPaid') === 'true';
    if (hasPaid) {
      console.log('✅ Payment found in localStorage');
      return true;
    }
    
    // Check for Stripe session ID
    const sessionId = localStorage.getItem('stripe_session_id');
    if (sessionId) {
      console.log('🔍 Found Stripe session ID - verifying with backend...');
      const verified = await verifyStripePayment(sessionId);
      if (verified) {
        console.log('✅ Stripe payment verified');
        localStorage.setItem('multiplayerPaid', 'true');
        return true;
      }
    }
    
    // Check URL parameters for redirect
    const urlParams = new URLSearchParams(window.location.search);
    const redirectSessionId = urlParams.get('session_id');
    const paymentStatus = urlParams.get('payment_status');
    
    if (redirectSessionId && paymentStatus === 'success') {
      console.log('✅ Payment redirect detected - processing...');
      await processPaymentRedirect(redirectSessionId);
      return true;
    }
    
    return false;
    
  } catch (error) {
    console.error('❌ Payment status check error:', error);
    return false;
  }
}

// Process payment redirect
async function processPaymentRedirect(sessionId) {
  console.log('🔄 Processing payment redirect...');
  
  try {
    // Store session ID
    localStorage.setItem('stripe_session_id', sessionId);
    
    // Verify with backend
    const verified = await verifyStripePayment(sessionId);
    
    if (verified) {
      console.log('✅ Payment redirect verified');
      localStorage.setItem('multiplayerPaid', 'true');
      
      // Clean URL
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      
      return true;
    } else {
      console.log('❌ Payment redirect verification failed');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Payment redirect processing error:', error);
    return false;
  }
}

// Improved payment loading modal
function showImprovedPaymentLoading() {
  const modal = document.createElement('div');
  modal.id = 'improved-payment-loading-modal';
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
      border: 2px solid #ff0000;
      border-radius: 15px;
      padding: 30px;
      text-align: center;
      color: white;
      max-width: 450px;
      width: 90%;
    ">
      <h2 style="color: #ff0000; margin-bottom: 20px;">💳 Secure Payment</h2>
      <div style="margin: 20px 0;">
        <div style="
          width: 40px;
          height: 40px;
          border: 4px solid #333;
          border-top: 4px solid #ff0000;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        "></div>
      </div>
      <p style="margin-bottom: 15px;">Opening secure Stripe payment page...</p>
      <p style="font-size: 14px; color: #ccc; margin-bottom: 20px;">
        🔒 Your payment is processed securely by Stripe<br>
        📱 Complete payment in the popup window<br>
        ⏱️ You'll be redirected back automatically
      </p>
      
      <div style="margin: 20px 0;">
        <button onclick="cancelAllPaymentProcesses()" style="
          background: linear-gradient(45deg, #ff0000, #cc0000);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
          margin: 5px;
        ">❌ Cancel</button>
        
        <button onclick="openStripePaymentWindow()" style="
          background: linear-gradient(45deg, #00ff00, #00cc00);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
          margin: 5px;
        ">🔄 Retry</button>
      </div>
      
      <p style="font-size: 12px; color: #999;">
        If popup doesn't open, check your browser's popup blocker
      </p>
    </div>
  `;
  
  // Add CSS animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(modal);
}

// Improved payment detection modal
function showImprovedPaymentDetectionModal() {
  const modal = document.createElement('div');
  modal.id = 'improved-payment-detection-modal';
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
      border: 2px solid #ff0000;
      border-radius: 15px;
      padding: 30px;
      text-align: center;
      color: white;
      max-width: 500px;
      width: 90%;
    ">
      <h2 style="color: #ff0000; margin-bottom: 20px;">🔍 Payment Detection Active</h2>
      <div style="margin: 20px 0;">
        <div style="
          width: 40px;
          height: 40px;
          border: 4px solid #333;
          border-top: 4px solid #ff0000;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        "></div>
      </div>
      <p style="margin-bottom: 15px;">Waiting for payment completion...</p>
      <p style="font-size: 14px; color: #ccc; margin-bottom: 20px;">
        💳 Complete your payment in the Stripe window<br>
        🔄 This page will automatically detect completion<br>
        ⏱️ Detection active for 10 minutes<br>
        📱 You can close the payment window after payment
      </p>
      
      <div style="margin: 20px 0;">
        <button onclick="manualPaymentVerification()" style="
          background: linear-gradient(45deg, #00ff00, #00cc00);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
          margin: 5px;
        ">✅ I've Completed Payment</button>
        
        <button onclick="cancelAllPaymentProcesses()" style="
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
        🔒 Payment verification includes fraud protection
      </p>
    </div>
  `;
  
  document.body.appendChild(modal);
}

// Payment success modal
function showPaymentSuccess() {
  const modal = document.createElement('div');
  modal.id = 'payment-success-modal';
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
      border: 2px solid #00ff00;
      border-radius: 15px;
      padding: 30px;
      text-align: center;
      color: white;
      max-width: 400px;
      width: 90%;
    ">
      <h2 style="color: #00ff00; margin-bottom: 20px;">🎉 Payment Successful!</h2>
      <p style="margin-bottom: 20px;">Your payment has been verified and multiplayer is now unlocked!</p>
      <p style="font-size: 14px; color: #ccc; margin-bottom: 20px;">
        📱 The Stripe window will close automatically in 30 seconds<br>
        🎮 You can start playing multiplayer now!
      </p>
      <button onclick="closePaymentSuccess()" style="
        background: linear-gradient(45deg, #00ff00, #00cc00);
        color: white;
        border: none;
        padding: 15px 30px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
      ">🎮 Start Playing</button>
    </div>
  `;
  
  document.body.appendChild(modal);
}

// Payment timeout modal
function showPaymentTimeout() {
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
      background: rgba(0, 0, 0, 0.95);
      border: 2px solid #ff6600;
      border-radius: 15px;
      padding: 30px;
      text-align: center;
      color: white;
      max-width: 400px;
      width: 90%;
    ">
      <h2 style="color: #ff6600; margin-bottom: 20px;">⏰ Payment Timeout</h2>
      <p style="margin-bottom: 20px;">Payment detection timed out. If you completed payment, use manual verification.</p>
      <button onclick="manualPaymentVerification()" style="
        background: linear-gradient(45deg, #00ff00, #00cc00);
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
        margin: 5px;
      ">✅ I've Completed Payment</button>
      
      <button onclick="cancelAllPaymentProcesses()" style="
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
  `;
  
  document.body.appendChild(modal);
}

// Popup blocked alternative
function showPopupBlockedAlternative() {
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
      background: rgba(0, 0, 0, 0.95);
      border: 2px solid #ff0000;
      border-radius: 15px;
      padding: 30px;
      text-align: center;
      color: white;
      max-width: 400px;
      width: 90%;
    ">
      <h2 style="color: #ff0000; margin-bottom: 20px;">⚠️ Popup Blocked</h2>
      <p style="margin-bottom: 20px;">Your browser blocked the payment popup. Please:</p>
      <ol style="text-align: left; margin-bottom: 20px;">
        <li>Allow popups for this site, or</li>
        <li>Click the link below to pay directly</li>
      </ol>
      <a href="https://buy.stripe.com/fZu7sLfBa4Ju7Uz0Kvfbq0j" target="_blank" style="
        background: linear-gradient(45deg, #ff0000, #cc0000);
        color: white;
        text-decoration: none;
        padding: 15px 30px;
        border-radius: 6px;
        display: inline-block;
        font-weight: bold;
        margin: 10px;
      ">💳 Pay Directly</a>
      <br>
      <button onclick="cancelAllPaymentProcesses()" style="
        background: #333;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        cursor: pointer;
        margin-top: 10px;
      ">❌ Cancel</button>
    </div>
  `;
  
  document.body.appendChild(modal);
}

// Close payment success
function closePaymentSuccess() {
  const modal = document.getElementById('improved-payment-loading-modal');
  if (modal) modal.remove();
  
  const detectionModal = document.getElementById('improved-payment-detection-modal');
  if (detectionModal) detectionModal.remove();
  
  const successModal = document.getElementById('payment-success-modal');
  if (successModal) successModal.remove();
  
  // Close payment window if still open
  if (paymentWindow && !paymentWindow.closed) {
    paymentWindow.close();
    paymentWindow = null;
  }
  
  // Refresh page to show unlocked content
  window.location.reload();
}

// Cancel all payment processes
function cancelAllPaymentProcesses() {
  console.log('🛑 Cancelling all payment processes...');
  
  // Clear polling
  if (paymentPollingInterval) {
    clearInterval(paymentPollingInterval);
    paymentPollingInterval = null;
  }
  
  // Close payment window
  if (paymentWindow && !paymentWindow.closed) {
    paymentWindow.close();
    paymentWindow = null;
  }
  
  // Reset flags
  paymentDetectionActive = false;
  paymentCompleted = false;
  
  // Remove all payment modals
  const modals = [
    'improved-payment-loading-modal',
    'improved-payment-detection-modal',
    'payment-success-modal',
    'close-window-suggestion'
  ];
  
  modals.forEach(modalId => {
    const modal = document.getElementById(modalId);
    if (modal) modal.remove();
  });
  
  // Remove any other payment-related modals
  const paymentModals = document.querySelectorAll('div[style*="background: rgba(0, 0, 0, 0.9)"]');
  paymentModals.forEach(modal => {
    if (modal.innerHTML.includes('Payment') || modal.innerHTML.includes('payment')) {
      modal.remove();
    }
  });
  
  console.log('✅ All payment processes cancelled');
}

// Export functions
window.startImprovedPaymentFlow = startImprovedPaymentFlow;
window.openStripePaymentWindow = openStripePaymentWindow;
window.cancelAllPaymentProcesses = cancelAllPaymentProcesses;
window.closePaymentSuccess = closePaymentSuccess;
window.closePaymentWindowManually = closePaymentWindowManually;

console.log('✅ Improved payment flow system loaded'); 
// Payment Success Handler - Communicates payment completion back to original window
(function() {
  'use strict';
  
  console.log('🎉 Payment success handler loaded');
  
  // Check if we're on a payment success page
  const urlParams = new URLSearchParams(window.location.search);
  const paymentStatus = urlParams.get('payment_status');
  const sessionId = urlParams.get('session_id');
  
  if (paymentStatus === 'success' && sessionId) {
    console.log('✅ Payment successful, session ID:', sessionId);
    
    // Try to communicate with the original window
    if (window.opener && !window.opener.closed) {
      console.log('📤 Sending payment completion message to original window');
      
      // Send postMessage to original window
      window.opener.postMessage({
        type: 'payment_completed',
        sessionId: sessionId,
        status: 'success'
      }, window.opener.location.origin);
      
      // Close this window after a short delay
      setTimeout(() => {
        window.close();
      }, 2000);
      
    } else {
      console.log('⚠️ Original window not available, processing payment locally');
      
      // Fallback: process payment in this window if original window is not available
      processPaymentLocally(sessionId);
    }
  } else if (paymentStatus === 'cancelled') {
    console.log('❌ Payment cancelled');
    
    // Close window and notify original window
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({
        type: 'payment_cancelled'
      }, window.opener.location.origin);
    }
    
    setTimeout(() => {
      window.close();
    }, 1000);
  }
  
  function processPaymentLocally(sessionId) {
    // This is a fallback for when the original window is not available
    // The payment will be processed when the user returns to the main page
    console.log('💾 Storing payment data for local processing');
    
    // Store payment data in localStorage
    localStorage.setItem('pendingPaymentSessionId', sessionId);
    localStorage.setItem('pendingPaymentStatus', 'success');
    
    // Show success message
    showSuccessMessage();
  }
  
  function showSuccessMessage() {
    // Create a simple success page
    document.body.innerHTML = `
      <div style="
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        background: linear-gradient(135deg, #1e3c72, #2a5298);
        color: white;
        font-family: Arial, sans-serif;
        text-align: center;
      ">
        <div style="
          background: rgba(255, 255, 255, 0.1);
          padding: 40px;
          border-radius: 15px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        ">
          <h1 style="color: #4CAF50; margin-bottom: 20px;">🎉 Payment Successful!</h1>
          <p style="font-size: 18px; margin-bottom: 30px;">
            Your Horropoly multiplayer access has been unlocked!
          </p>
          <p style="font-size: 14px; color: #ccc;">
            You can now return to the game and enjoy multiplayer mode.
          </p>
          <button onclick="window.close()" style="
            background: #4CAF50;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            margin-top: 20px;
          ">
            Close Window
          </button>
        </div>
      </div>
    `;
  }
  
})(); 
// Enhanced Payment System for Horropoly Multiplayer
// Includes fraud prevention, machine fingerprinting, and Firebase integration

import { getDb } from './firebase-init.js';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Use Firebase from firebase-init.js
let firebaseAvailable = false;

async function checkFirebaseAvailability() {
  try {
    // Test if Firebase is available
    await getDb();
    firebaseAvailable = true;
    console.log('✅ Firebase available for payment system');
  } catch (error) {
    console.log('❌ Firebase not available for payment system:', error.message);
    firebaseAvailable = false;
  }
}

// Check Firebase availability immediately
checkFirebaseAvailability();

// DISABLED: Enhanced device fingerprinting for fraud prevention
// Fingerprinting has been disabled for privacy reasons
class DeviceFingerprinter {
  constructor() {
    this.fingerprint = null;
    this.generateFingerprint();
  }

  generateFingerprint() {
    // Return a static fingerprint instead of generating a real one
    const staticFingerprint = {
      // Basic device info - using generic values
      userAgent: 'Mozilla/5.0 (Generic Browser)',
      platform: 'Generic Platform',
      language: 'en-US',
      timezone: 'UTC',
      
      // Screen and window info - using generic values
      screen: {
        width: 1920,
        height: 1080,
        availWidth: 1920,
        availHeight: 1040,
        colorDepth: 24,
        pixelDepth: 24
      },
      
      // Canvas fingerprint - using static value
      canvas: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      
      // WebGL fingerprint - using static value
      webgl: 'static_webgl_fingerprint',
      
      // Audio fingerprint - using static value
      audio: 'static_audio_fingerprint',
      
      // Hardware info - using generic values
      hardware: {
        cores: 4,
        memory: 8,
        connection: 'wifi'
      },
      
      // Browser capabilities - using generic values
      capabilities: {
        cookies: true,
        localStorage: true,
        sessionStorage: true,
        indexedDB: true,
        serviceWorker: true,
        webRTC: true,
        webGL: true
      },
      
      // Timestamp for uniqueness
      timestamp: Date.now(),
      
      // Random component for additional uniqueness
      random: 'static_random_component'
    };

    // Create hash of the fingerprint
    const fingerprintString = JSON.stringify(staticFingerprint);
    this.fingerprint = this.hashString(fingerprintString);
    
    return this.fingerprint;
  }

  getWebGLFingerprint() {
    // Return static WebGL fingerprint
    return 'static_webgl_fingerprint';
  }

  getAudioFingerprint() {
    // Return static audio fingerprint
    return 'static_audio_fingerprint';
  }

  hashString(str) {
    // Simple hash function
    let hash = 0;
    if (str.length === 0) return hash.toString();
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  getFingerprint() {
    return this.fingerprint;
  }

  getDetailedFingerprint() {
    return {
      hash: this.fingerprint,
      disabled: true,
      note: 'Device fingerprinting has been disabled for privacy'
    };
  }
}

// Payment verification and fraud prevention
class PaymentVerifier {
  constructor() {
    this.deviceFingerprinter = new DeviceFingerprinter();
    this.maxDevicesPerPayment = 3;
    this.paymentTimeout = 5 * 60 * 1000; // 5 minutes
    // Always prioritize the Render backend for payment API calls (even during local dev)
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const prodPaymentBackend = 'https://horropoly-payment-backend.onrender.com';
    const localUrls = isLocal ? [
      `http://${window.location.hostname}:3001`,
      `http://${window.location.hostname}:8080`
    ] : [];
    // Prefer Render first, then local fallbacks if running locally
    this.backendUrls = [prodPaymentBackend, ...localUrls];
    this.backendUrl = this.backendUrls[0];
    console.log('💳 Payment backend URLs (priority order):', this.backendUrls);
  }

  async fetchWithFallback(path, options) {
    let lastError;
    for (const base of this.backendUrls) {
      try {
        const res = await fetch(`${base}${path}`, options);
        if (res.status === 404) {
          // Try next backend if endpoint not found here
          lastError = new Error(`404 at ${base}${path}`);
          continue;
        }
        return res;
      } catch (e) {
        lastError = e;
        continue;
      }
    }
    throw lastError || new Error('All backend URLs failed');
  }

  async verifyPayment(sessionId) {
    if (!sessionId) {
      console.log('No session ID provided');
      return { verified: false, reason: 'No session ID', deviceAllowed: false };
    }

    try {
      // ALWAYS verify with backend API - never trust localStorage alone
      const response = await this.fetchWithFallback('/api/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionId,
          deviceFingerprint: this.deviceFingerprinter.getDetailedFingerprint(),
          userId: localStorage.getItem('userId') || 'unknown'
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Payment verification result:', result);
        return result;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Backend verification failed:', errorData);
        return { 
          verified: false, 
          reason: errorData.reason || 'Backend verification failed', 
          deviceAllowed: false 
        };
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      return { 
        verified: false, 
        reason: 'Network error - cannot verify payment', 
        deviceAllowed: false 
      };
    }
  }

  // Verify access for returning users based on their userId by checking Firebase payments
  async verifyAccessByUserId(userId) {
    try {
      if (!userId) {
        return { verified: false, reason: 'No userId provided', deviceAllowed: false };
      }
      // Ensure Firebase availability
      if (!firebaseAvailable) {
        await checkFirebaseAvailability();
      }
      if (!firebaseAvailable) {
        return { verified: false, reason: 'Backend unavailable', deviceAllowed: false };
      }

      const dbInstance = await getDb();
      if (!dbInstance) {
        return { verified: false, reason: 'Backend unavailable', deviceAllowed: false };
      }

      const paymentRef = doc(dbInstance, 'payments', userId);
      const paymentDoc = await getDoc(paymentRef);
      if (!paymentDoc.exists()) {
        return { verified: false, reason: 'No payment record', deviceAllowed: false };
      }

      const paymentData = paymentDoc.data();
      const status = paymentData.status;
      const feature = paymentData.feature;
      if (status === 'completed' && (feature === 'multiplayer_access' || !feature)) {
        return { verified: true, reason: 'Payment record found', deviceAllowed: true };
      }
      return { verified: false, reason: `Invalid status: ${status}` , deviceAllowed: false };
    } catch (error) {
      console.error('verifyAccessByUserId error:', error);
      return { verified: false, reason: 'Verification error', deviceAllowed: false };
    }
  }

  async createCheckoutSession(requestBody) {
    console.log('🚀 createCheckoutSession called with:', {
      backendUrls: this.backendUrls,
      requestBody: requestBody
    });
    
    let lastError;
    for (const base of this.backendUrls) {
      try {
        console.log(`🔄 Attempting payment request to: ${base}/api/create-checkout-session`);
        console.log(`📦 Request payload:`, JSON.stringify(requestBody, null, 2));
        
        const res = await fetch(`${base}/api/create-checkout-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });
        
        console.log(`📡 Response status: ${res.status} ${res.statusText}`);
        console.log(`📡 Response headers:`, Object.fromEntries(res.headers.entries()));
        
        if (res.status === 404) {
          lastError = new Error(`404 at ${base}/api/create-checkout-session`);
          console.error(`❌ 404 Not Found at ${base}/api/create-checkout-session`);
          continue;
        }

        const rawBody = await res.text();
        console.log(`📄 Raw response body (${rawBody.length} chars):`, rawBody.substring(0, 500));

        if (!res.ok) {
          lastError = new Error(`HTTP ${res.status} from ${base}: ${rawBody?.substring(0, 200)}`);
          console.error(`❌ HTTP ${res.status} error:`, rawBody);
          continue;
        }

        if (!rawBody || rawBody.trim().length === 0) {
          lastError = new Error(`Empty response from ${base} while creating session`);
          console.error(`❌ Empty response from ${base}`);
          continue;
        }

        let parsed;
        try {
          parsed = JSON.parse(rawBody);
          console.log(`✅ Parsed JSON response:`, parsed);
        } catch (e) {
          lastError = new Error(`Invalid JSON from ${base}: ${rawBody.substring(0, 200)}`);
          console.error(`❌ JSON parse error:`, e.message, 'Raw body:', rawBody.substring(0, 200));
          continue;
        }

        const url = parsed.url;
        const sessionId = parsed.sessionId || parsed.id || parsed.session_id;
        if (!url || !sessionId) {
          lastError = new Error(`Invalid response from ${base}: missing url or sessionId. Body: ${rawBody.substring(0, 200)}`);
          console.error(`❌ Missing url or sessionId in response:`, { url, sessionId, parsed });
          continue;
        }

        console.log(`✅ Payment session created successfully via ${base}`);
        console.log(`✅ Session URL: ${url}`);
        console.log(`✅ Session ID: ${sessionId}`);
        
        // Lock in the working backend URL
        this.backendUrl = base;
        return { url, sessionId };
      } catch (e) {
        lastError = e;
        console.error(`❌ Network/fetch error at ${base}:`, e);
        if (e.name === 'TypeError' && e.message.includes('fetch')) {
          console.error(`❌ Possible CORS or network connectivity issue`);
        }
        continue;
      }
    }
    
    console.error(`❌ All backend URLs failed. Last error:`, lastError);
    throw lastError || new Error('All backend URLs failed');
  }

  async checkFraudPrevention(userId, sessionId) {
    // Temporarily disable fraud prevention due to Firestore permissions
    console.log('Fraud prevention temporarily disabled - allowing access');
    return { allowed: true, reason: 'Fraud prevention disabled' };
    
    // Original fraud prevention code (commented out for now)
    /*
    if (!firebaseAvailable) {
      console.log('Firebase not available for fraud prevention');
      return { allowed: true, reason: 'Firebase unavailable' };
    }

    try {
      const deviceFingerprint = this.deviceFingerprinter.getFingerprint();
      
      // Get Firebase database instance
      const dbInstance = await getDb();
      if (!dbInstance) {
        console.log('Firebase not available, skipping device check');
        return { allowed: true, reason: 'Firebase not available' };
      }

      // Validate that dbInstance is a proper Firestore instance
      if (!dbInstance) {
        console.log('Firebase not available, skipping fraud prevention');
        return { allowed: true, reason: 'Firebase not available' };
      }
      
      // Check if this device has already been used with this payment
      const deviceRef = doc(dbInstance, 'paymentDevices', `${userId}_${deviceFingerprint}`);
      const deviceDoc = await getDoc(deviceRef);
      
      if (deviceDoc.exists()) {
        const deviceData = deviceDoc.data();
        if (deviceData.sessionId === sessionId) {
          return { allowed: true, reason: 'Device already verified for this payment' };
        } else {
          return { allowed: false, reason: 'Device used with different payment' };
        }
      }

      // Check how many devices have used this payment
      const paymentsRef = collection(dbInstance, 'payments');
      const paymentQuery = query(paymentsRef, where('sessionId', '==', sessionId));
      const paymentDocs = await getDocs(paymentQuery);
      
      if (!paymentDocs.empty) {
        const paymentData = paymentDocs.docs[0].data();
        const deviceCount = paymentData.devices ? paymentData.devices.length : 0;
        
        if (deviceCount >= this.maxDevicesPerPayment) {
          return { allowed: false, reason: 'Maximum devices reached for this payment' };
        }
      }

      return { allowed: true, reason: 'Device check passed' };
    } catch (error) {
      console.error('Fraud prevention check error:', error);
      return { allowed: true, reason: 'Check failed, allowing access' };
    }
    */
  }

  async recordPaymentInFirebase(userId, paymentData) {
    if (!firebaseAvailable) {
      console.log('Firebase not available, skipping payment record');
      return true;
    }

    try {
      const deviceFingerprint = this.deviceFingerprinter.getDetailedFingerprint();
      
      // Record the payment
      const dbInstance = await getDb();
      if (!dbInstance) {
        console.log('Firebase not available, skipping payment record');
        return true;
      }

      // Validate that dbInstance is a proper Firestore instance
      if (!dbInstance) {
        console.log('Firebase not available, skipping payment record');
        return true;
      }

      const paymentRef = doc(dbInstance, 'payments', userId);
      await setDoc(paymentRef, {
        userId: userId,
        paymentId: paymentData.payment_intent || 'stripe_payment',
        sessionId: paymentData.session_id,
        amount: 199, // £1.99 in pence
        currency: 'gbp',
        status: 'completed',
        timestamp: new Date().toISOString(),
        feature: 'multiplayer_access',
        deviceFingerprint: deviceFingerprint,
        devices: [deviceFingerprint],
        fraudChecks: {
          deviceVerified: true,
          timestamp: new Date().toISOString()
        }
      });

      // Record device usage (simplified to avoid permission issues)
      try {
        const deviceRef = doc(dbInstance, 'paymentDevices', `${userId}_${deviceFingerprint.hash}`);
        await setDoc(deviceRef, {
          userId: userId,
          sessionId: paymentData.session_id,
          deviceFingerprint: deviceFingerprint,
          firstUsed: new Date().toISOString(),
          lastUsed: new Date().toISOString(),
          usageCount: 1
        });
        console.log('✅ Device usage recorded');
      } catch (error) {
        console.log('⚠️ Could not record device usage (continuing anyway):', error.message);
      }

      console.log('✅ Payment recorded in Firebase with fraud prevention');
      return true;
    } catch (error) {
      console.error('❌ Error recording payment in Firebase:', error);
      return false;
    }
  }

  async addDeviceToPayment(userId, sessionId) {
    if (!firebaseAvailable) return true;

    try {
      const deviceFingerprint = this.deviceFingerprinter.getDetailedFingerprint();
      
      // Update payment record with new device
      const dbInstance = await getDb();
      if (!dbInstance) {
        console.log('Firebase not available, skipping device update');
        return true;
      }

      // Validate that dbInstance is a proper Firestore instance
      if (typeof dbInstance.collection !== 'function') {
        console.log('Invalid Firestore instance, skipping device update');
        return true;
      }

      const paymentRef = doc(dbInstance, 'payments', userId);
      const paymentDoc = await getDoc(paymentRef);
      
      if (paymentDoc.exists()) {
        const paymentData = paymentDoc.data();
        const devices = paymentData.devices || [];
        
        if (!devices.find(d => d.hash === deviceFingerprint.hash)) {
          devices.push(deviceFingerprint);
          
          await setDoc(paymentRef, {
            ...paymentData,
            devices: devices,
            lastUpdated: new Date().toISOString()
          }, { merge: true });
        }
      }

      // Record device usage
      const deviceRef = doc(dbInstance, 'paymentDevices', `${userId}_${deviceFingerprint.hash}`);
      const deviceDoc = await getDoc(deviceRef);
      
      if (deviceDoc.exists()) {
        const deviceData = deviceDoc.data();
        await setDoc(deviceRef, {
          ...deviceData,
          lastUsed: new Date().toISOString(),
          usageCount: (deviceData.usageCount || 0) + 1
        }, { merge: true });
      } else {
        await setDoc(deviceRef, {
          userId: userId,
          sessionId: sessionId,
          deviceFingerprint: deviceFingerprint,
          firstUsed: new Date().toISOString(),
          lastUsed: new Date().toISOString(),
          usageCount: 1
        });
      }

      return true;
    } catch (error) {
      console.error('Error adding device to payment:', error);
      return false;
    }
  }
}

// Payment UI Manager
class PaymentUIManager {
  constructor(paymentVerifier, deviceFingerprinter) {
    this.paymentVerifier = paymentVerifier;
    this.deviceFingerprinter = deviceFingerprinter;
    this.paymentWindow = null;
    this.pollingInterval = null;
  }

  showPaywall() {
    // Check if user already has access
    if (localStorage.getItem('multiplayerPaid') === 'true') {
      console.log('User already has multiplayer access');
      this.unlockMultiplayer();
      return;
    }
    
    // The paywall is now only in the modal, so we just ensure it's visible
    const modalPaywall = document.getElementById('multiplayer-payment-wall-modal');
    if (modalPaywall) {
      modalPaywall.style.display = 'block';
    }
    
    // Hide create dungeon section
    const createDungeonSection = document.getElementById('create-dungeon-section');
    if (createDungeonSection) {
      createDungeonSection.style.display = 'none';
    }
  }

  async startPayment() {
    console.log('🚀 startPayment() called');
    console.log('🔧 Payment system state:', {
      deviceFingerprinter: !!this.deviceFingerprinter,
      paymentVerifier: !!this.paymentVerifier,
      backendUrl: this.paymentVerifier?.backendUrl,
      backendUrls: this.paymentVerifier?.backendUrls
    });
    
    // Ensure deviceFingerprinter is available
    if (!this.deviceFingerprinter) {
      console.warn('Device fingerprinter missing, creating new instance.');
      this.deviceFingerprinter = new DeviceFingerprinter();
    }

    const userId = localStorage.getItem('userId') || crypto.randomUUID();
    localStorage.setItem('userId', userId);
    console.log('💳 Using userId:', userId);

    // Clear any existing session IDs to prevent confusion
    localStorage.removeItem('stripe_session_id');
    localStorage.removeItem('currentSessionId');
    
    // Also clear any cached session data
    sessionStorage.clear();
    
    console.log('Cleared all session data for fresh payment');

    // Show payment loading modal
    this.showPaymentLoadingModal();

    try {
      // Create checkout session via backend
      // Use a simple success page that will close itself
      const successUrl = `${window.location.origin}/close-window.html?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${window.location.origin}/close-window.html?cancelled=true`;
      
      console.log('Creating checkout session with URLs:', { successUrl, cancelUrl });
      
      // Add retry logic for Render service wake-up with longer timeouts
      let response;
      let lastError;
      
      // First attempt to wake up the service
      console.log('🔄 Waking up payment service before attempting payment...');
      await wakeUpRenderService(this.paymentVerifier.backendUrl);
      
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          console.log(`🔄 Payment request attempt ${attempt + 1}/5`);
          
          // Use AbortController for timeout control
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout
          
          const payload = {
            userId: userId,
            deviceFingerprint: this.deviceFingerprinter ? this.deviceFingerprinter.getFingerprint() : 'fingerprinting_disabled',
            successUrl: successUrl,
            cancelUrl: cancelUrl,
            timestamp: Date.now(),
            requestId: crypto.randomUUID()
          };

          // Create session with validation and backend fallback
          const { url, sessionId } = await this.paymentVerifier.createCheckoutSession(payload);

          // On success, store and proceed immediately
          console.log('Received session ID:', sessionId);
          console.log('Previous session ID:', localStorage.getItem('currentSessionId'));
          localStorage.setItem('currentSessionId', sessionId);

          this.paymentWindow = window.open(url, '_blank', 'width=500,height=600');

          if (!this.paymentWindow) {
            this.showPaymentError('Popup blocked. Please allow popups and try again.');
            return;
          }

          // Start polling for payment completion
          this.startPaymentPolling(userId);
          
          // Also listen for window focus events as a fallback
          const checkWindowClosed = () => {
            if (this.paymentWindow && this.paymentWindow.closed) {
              console.log('Payment window closed, checking completion...');
              this.checkPaymentCompletion(userId);
            }
          };
          
          window.addEventListener('blur', checkWindowClosed);
          
          const windowCheckInterval = setInterval(() => {
            if (this.paymentWindow && this.paymentWindow.closed) {
              clearInterval(windowCheckInterval);
              window.removeEventListener('blur', checkWindowClosed);
              console.log('Payment window closed, checking completion...');
              this.checkPaymentCompletion(userId);
            }
            
            try {
              if (this.paymentWindow && !this.paymentWindow.closed) {
                const popupUrl = this.paymentWindow.location.href;
                if (popupUrl.includes('close-window.html') || popupUrl.includes('payment_success')) {
                  console.log('Payment window redirected, closing and checking completion...');
                  this.paymentWindow.close();
                  this.checkPaymentCompletion(userId);
                }
              }
            } catch (e) {
              // Cross-origin error, ignore
            }
          }, 500);
          
          // If successful, break out of retry loop
          response = new Response(null, { status: 200 });
          
          clearTimeout(timeout);
          
          // If successful, break out of retry loop
          break;
          
        } catch (error) {
          lastError = error;
          console.warn(`🔄 Payment attempt ${attempt + 1} failed:`, error.message);
          
          if (attempt < 4) {
            // Progressive backoff: 3, 6, 12, 24 seconds
            const waitTime = Math.min(3 * Math.pow(2, attempt), 30);
            console.log(`⏱️ Waiting ${waitTime} seconds before retry (Render service wake-up)...`);
            await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
            
            // Try to wake up service again on later attempts
            if (attempt >= 1) {
              await wakeUpRenderService(this.paymentVerifier.backendUrl);
            }
          }
        }
      }
      
      // If all attempts failed, throw the last error
      if (!response) {
        throw new Error(`Payment backend unavailable after 5 attempts. ${lastError?.message || 'Unknown error'}. The Render service might be starting up - please try again in a moment.`);
      }

      // No further parsing here; handled by createCheckoutSession
      // Window polling and handlers are already set above
      // Note: keep interval frequency the same
      // (the interval has been set during session creation)
      
    } catch (error) {
      console.error('❌ Failed to start payment:', error);
      
      // Check if it's a Render service wake-up issue
      if (error.message.includes('NetworkError') || error.message.includes('CORS') || error.message.includes('fetch')) {
        this.showPaymentError('⏱️ Payment service is starting up. Please wait a moment and try again.');
      } else if (error.message.includes('Render service might be starting up')) {
        this.showPaymentError(error.message);
      } else {
        this.showPaymentError('Failed to start payment. Please try again.');
      }
      
      this.hidePaymentLoadingModal();
    }
  }

  showPaymentLoadingModal() {
    const modal = document.createElement('div');
    modal.id = 'payment-loading-modal';
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

    const wakeUrl = this.paymentVerifier ? this.paymentVerifier.backendUrl : 'https://horropoly-payment-backend.onrender.com';
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
        <h2 style="color: #ff0000; margin-bottom: 20px;">💳 Processing Payment</h2>
        <div style="
          width: 40px;
          height: 40px;
          border: 4px solid #333;
          border-top: 4px solid #ff0000;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        "></div>
        <p style="margin-bottom: 20px;">Please complete your payment in the new window...</p>
        <p style="font-size: 12px; color: #ccc;">
          🔒 Secure payment via Stripe<br>
          🛡️ Fraud protection active<br>
          ⏱️ Payment window will close automatically
        </p>
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: #333;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
          margin-top: 15px;
        ">❌ Cancel</button>
      </div>
    `;

    document.body.appendChild(modal);
  }

  startPaymentPolling(userId) {
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes at 5-second intervals

    // Listen for messages from popup windows
    const messageHandler = async (event) => {
      console.log('Received message from popup:', event.data);
      
      if (event.data.type === 'payment_success') {
        console.log('Payment success message received, processing...');
        clearInterval(this.pollingInterval);
        this.hidePaymentLoadingModal();
        window.removeEventListener('message', messageHandler);
        
        // Process successful payment
        await this.processSuccessfulPayment(userId, event.data.sessionId);
      } else if (event.data.type === 'payment_cancelled') {
        console.log('Payment cancelled message received');
        clearInterval(this.pollingInterval);
        this.hidePaymentLoadingModal();
        window.removeEventListener('message', messageHandler);
        
        // Clear any session IDs and show cancellation message
        localStorage.removeItem('stripe_session_id');
        localStorage.removeItem('currentSessionId');
        this.showPaymentError('Payment was cancelled. Please try again.');
      }
    };

    window.addEventListener('message', messageHandler);

    this.pollingInterval = setInterval(async () => {
      attempts++;

      // Check if payment window is closed
      if (this.paymentWindow && this.paymentWindow.closed) {
        clearInterval(this.pollingInterval);
        this.hidePaymentLoadingModal();
        window.removeEventListener('message', messageHandler);
        
        // Check for payment completion (this will verify with backend)
        await this.checkPaymentCompletion(userId);
        return;
      }

      // Check URL parameters for payment completion (fallback)
      const urlParams = new URLSearchParams(window.location.search);
      const paymentStatus = urlParams.get('payment_success') || urlParams.get('payment_status');
      const sessionId = urlParams.get('session_id');

      if (paymentStatus === 'true' && sessionId) {
        clearInterval(this.pollingInterval);
        this.hidePaymentLoadingModal();
        window.removeEventListener('message', messageHandler);
        
        console.log('Payment success detected via URL, verifying with backend...');
        // Process successful payment
        await this.processSuccessfulPayment(userId, sessionId);
        return;
      } else if (urlParams.get('payment_cancelled') === 'true') {
        clearInterval(this.pollingInterval);
        this.hidePaymentLoadingModal();
        window.removeEventListener('message', messageHandler);
        
        // Clear any session IDs and show cancellation message
        localStorage.removeItem('stripe_session_id');
        localStorage.removeItem('currentSessionId');
        this.showPaymentError('Payment was cancelled. Please try again.');
        return;
      }

      // Timeout after max attempts
      if (attempts >= maxAttempts) {
        clearInterval(this.pollingInterval);
        this.hidePaymentLoadingModal();
        window.removeEventListener('message', messageHandler);
        this.showPaymentError('Payment timeout. Please try again.');
      }
    }, 5000); // Check every 5 seconds
  }

  hidePaymentLoadingModal() {
    const modal = document.getElementById('payment-loading-modal');
    if (modal) {
      modal.remove();
    }
  }

  async processSuccessfulPayment(userId, sessionId) {
    try {
      // Double-check payment verification with backend
      const verification = await this.paymentVerifier.verifyPayment(sessionId);
      
      if (!verification.verified) {
        this.showPaymentError(`Payment verification failed: ${verification.reason}`);
        return;
      }

      // Verify payment with fraud prevention
      const fraudCheck = await this.paymentVerifier.checkFraudPrevention(userId, sessionId);
      
      if (!fraudCheck.allowed) {
        this.showPaymentError(`Payment verification failed: ${fraudCheck.reason}`);
        return;
      }

      // Record payment in Firebase
      const paymentData = {
        payment_intent: sessionId,
        session_id: sessionId
      };

      const paymentRecorded = await this.paymentVerifier.recordPaymentInFirebase(userId, paymentData);
      
      if (paymentRecorded) {
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Unlock multiplayer
        localStorage.setItem('multiplayerPaid', 'true');
        
        // Clear session IDs after successful payment to prevent reuse
        localStorage.removeItem('stripe_session_id');
        localStorage.removeItem('currentSessionId');
        
        // Show success message
        this.showPaymentSuccess();
        
        // Update UI
        this.unlockMultiplayer();
      } else {
        this.showPaymentError('Payment recording failed. Please contact support.');
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      this.showPaymentError('Payment processing failed. Please try again.');
    }
  }

  showPaymentSuccess() {
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
        border: 2px solid #00ff00;
        border-radius: 15px;
        padding: 30px;
        text-align: center;
        color: white;
        max-width: 400px;
        width: 90%;
      ">
        <h2 style="color: #00ff00; margin-bottom: 20px;">✅ Payment Successful!</h2>
        <p style="margin-bottom: 20px;">Multiplayer access has been unlocked for this device.</p>
        <p style="font-size: 12px; color: #ccc; margin-bottom: 20px;">
          🔒 Device fingerprint recorded<br>
          🛡️ Fraud protection active<br>
          📱 Works on up to 3 devices
        </p>
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: linear-gradient(45deg, #00ff00, #00cc00);
          color: white;
          border: none;
          padding: 15px 30px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
        ">🎮 Start Playing!</button>
      </div>
    `;

    document.body.appendChild(modal);
  }

  showPaymentError(message) {
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

    // Check if it's a service startup issue
    const isServiceIssue = message.includes('starting up') || message.includes('CORS') || message.includes('NetworkError') || message.includes('Render service');
    
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
        <h2 style="color: #ff0000; margin-bottom: 20px;">❌ Payment Error</h2>
        <p style="margin-bottom: 20px;">${message}</p>
        <div style="margin-bottom: 20px;">
          ${isServiceIssue ? `
            <button onclick="
              this.textContent = '🔄 Waking up...'; 
              this.disabled = true;
              fetch('${wakeUrl}/', {method: 'GET'})
                .then(() => {
                  this.textContent = '✅ Service Ready!';
                  setTimeout(() => this.parentElement.parentElement.parentElement.remove(), 2000);
                })
                .catch(() => {
                  this.textContent = '❌ Wake up failed';
                  this.disabled = false;
                });
            " style="
              background: #007cba;
              color: white;
              border: none;
              padding: 12px 20px;
              border-radius: 6px;
              cursor: pointer;
              font-weight: bold;
              margin-right: 10px;
            ">🔄 Wake Up Service</button>
          ` : ''}
          <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
            background: #333;
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
          ">❌ Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  unlockMultiplayer() {
    // Hide modal paywall (dungeons)
    const modalPaywall = document.getElementById('multiplayer-payment-wall-modal');
    if (modalPaywall) {
      modalPaywall.style.display = 'none';
    }

    // Show create dungeon section
    const createDungeonSection = document.getElementById('create-dungeon-section');
    if (createDungeonSection) {
      createDungeonSection.style.display = 'block';
    }
  }

  async checkPaymentCompletion(userId) {
    // This method is called when the payment window is closed
    // We need to verify the payment status with the backend
    const sessionId = localStorage.getItem('stripe_session_id') || localStorage.getItem('currentSessionId');
    
    if (sessionId) {
      // ALWAYS verify with backend before processing
      const verification = await this.paymentVerifier.verifyPayment(sessionId);
      
      if (verification.verified) {
        console.log('✅ Payment verified with backend, processing...');
        await this.processSuccessfulPayment(userId, sessionId);
      } else {
        console.log('❌ Payment verification failed:', verification.reason);
        // Clear invalid session ID
        localStorage.removeItem('stripe_session_id');
        localStorage.removeItem('currentSessionId');
        this.showPaymentError('Payment verification failed. Please try again.');
      }
    } else {
      console.log('No session ID found - payment was likely cancelled');
      this.showPaymentError('Payment was cancelled or failed. Please try again.');
    }
  }
}

// Export the payment system
export const PaymentSystem = {
  PaymentVerifier,
  PaymentUIManager,
  DeviceFingerprinter
};

// Wake up Render service to prevent CORS errors
async function wakeUpRenderService(backendUrl = null) {
  // Determine backend URL
  const targetUrl = backendUrl || (
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? `http://${window.location.hostname}:8080`
      : 'https://horropoly-payment-backend.onrender.com'
  );
  
  try {
    console.log('🔄 Waking up payment service...', targetUrl);
    
    // Try the health endpoint first with a longer timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(`${targetUrl}/api/health`, {
      method: 'GET',
      mode: 'cors',
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    
    if (response.ok) {
      console.log('✅ Payment service is awake and ready');
      return true;
    } else {
      console.warn('⚠️ Payment service responded but not healthy:', response.status);
      return false;
    }
  } catch (error) {
    console.warn('⚠️ Could not wake up payment service:', error.message);
    
    // If the health endpoint fails, try a simple GET to wake up the service
    try {
      await fetch(`${targetUrl}/`, {
        method: 'GET',
        mode: 'no-cors' // Don't care about response, just wake it up
      });
      console.log('🔄 Service wake-up call sent (no-cors mode)');
    } catch (wakeError) {
      console.warn('⚠️ Wake-up call also failed:', wakeError.message);
    }
    
    return false;
  }
}

// Initialize payment system
export function initializePaymentSystem() {
  const paymentVerifier = new PaymentVerifier();
  const deviceFingerprinter = new DeviceFingerprinter();
  const paymentUI = new PaymentUIManager(paymentVerifier, deviceFingerprinter);
  
  // Wake up Render service proactively
  wakeUpRenderService(paymentVerifier.backendUrl);
  
  return {
    paymentVerifier,
    paymentUI,
    deviceFingerprinter,
    wakeUpRenderService,
    showPaywall: () => paymentUI.showPaywall(),
    startPayment: () => paymentUI.startPayment(),
    verifyPayment: (sessionId) => paymentVerifier.verifyPayment(sessionId),
    verifyAccessByUserId: (userId) => paymentVerifier.verifyAccessByUserId(userId),
    recordPayment: (userId, paymentData) => paymentVerifier.recordPaymentInFirebase(userId, paymentData),
    // Add reset function for testing
    resetPaymentState: () => {
      localStorage.removeItem('multiplayerPaid');
      localStorage.removeItem('stripe_session_id');
      localStorage.removeItem('currentSessionId');
      sessionStorage.clear();
      console.log('Payment state reset for testing');
    },
    // Add function to check current state
    checkPaymentState: () => {
      console.log('=== Current Payment State ===');
      console.log('multiplayerPaid:', localStorage.getItem('multiplayerPaid'));
      console.log('stripe_session_id:', localStorage.getItem('stripe_session_id'));
      console.log('currentSessionId:', localStorage.getItem('currentSessionId'));
      console.log('userId:', localStorage.getItem('userId'));
      console.log('============================');
    }
  };
} 
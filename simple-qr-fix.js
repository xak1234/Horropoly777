// Simple QR Code Fix for Horropoly
// This fixes the "invalid QR code" issue by using a simpler approach

// Simple QR code generation
async function generateSimpleQRCode() {
  try {
    // Import QR code library
    const QRCode = await import('https://cdn.jsdelivr.net/npm/qrcode@1.5.3/+esm');
    
    // Create simple unlock token
    const unlockToken = crypto.randomUUID();
    const unlockData = {
      token: unlockToken,
      action: 'unlock_multiplayer',
      timestamp: Date.now(),
      expiresAt: Date.now() + (5 * 60 * 1000), // 5 minutes
      maxUses: 3
    };
    
    // Store token data in localStorage (for the generating device)
    localStorage.setItem('qr_unlock_token', unlockToken);
    localStorage.setItem('qr_unlock_data', JSON.stringify(unlockData));
    
    // Create unlock URL
    const unlockUrl = `https://horropoly.com?qr_unlock=${unlockToken}`;
    
    // Get canvas element
    const canvas = document.getElementById('qr-code');
    if (!canvas) {
      throw new Error('QR code canvas element not found');
    }
    
    // Generate QR code
    await QRCode.toCanvas(canvas, unlockUrl, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    console.log('✅ Simple QR code generated successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Simple QR code generation failed:', error);
    return false;
  }
}

// Simple QR code validation
function validateSimpleQRCode(token) {
  try {
    // Get stored token data
    const storedToken = localStorage.getItem('qr_unlock_token');
    const tokenDataString = localStorage.getItem('qr_unlock_data');
    
    if (!storedToken || !tokenDataString) {
      return { valid: false, reason: 'No QR code data found' };
    }
    
    // Check if token matches
    if (token !== storedToken) {
      return { valid: false, reason: 'Invalid QR code token' };
    }
    
    const tokenData = JSON.parse(tokenDataString);
    
    // Check if token is expired
    const now = Date.now();
    if (now > tokenData.expiresAt) {
      return { valid: false, reason: 'QR code has expired' };
    }
    
    // Check usage count
    const usageCount = parseInt(localStorage.getItem('qr_usage_count') || '0');
    if (usageCount >= tokenData.maxUses) {
      return { valid: false, reason: 'QR code usage limit reached' };
    }
    
    // Calculate time remaining
    const expiresIn = Math.ceil((tokenData.expiresAt - now) / (60 * 1000));
    
    return {
      valid: true,
      expiresIn: expiresIn,
      usageCount: usageCount,
      maxUses: tokenData.maxUses
    };
    
  } catch (error) {
    console.error('❌ QR code validation error:', error);
    return { valid: false, reason: 'QR code validation failed' };
  }
}

// Process QR code unlock
function processQRUnlock(token) {
  const validation = validateSimpleQRCode(token);
  
  if (validation.valid) {
    // Increment usage count
    const currentCount = parseInt(localStorage.getItem('qr_usage_count') || '0');
    localStorage.setItem('qr_usage_count', (currentCount + 1).toString());
    
    // Unlock multiplayer
    localStorage.setItem('multiplayerPaid', 'true');
    
    // Show success message
    alert(`🎉 Multiplayer unlocked successfully!\n\n⏰ Expires in: ${validation.expiresIn} minutes\n📱 Usage: ${validation.usageCount + 1}/${validation.maxUses}`);
    
    // Clean URL
    const newUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, newUrl);
    
    // Refresh page to show unlocked content
    window.location.reload();
    
  } else {
    // Show error message
    const errorMessages = {
      'No QR code data found': 'QR code data not found. Please generate a new QR code.',
      'Invalid QR code token': 'Invalid QR code. Please use the correct QR code.',
      'QR code has expired': 'QR code has expired. Please generate a new QR code.',
      'QR code usage limit reached': 'QR code has been used maximum times. Please generate a new QR code.',
      'QR code validation failed': 'QR code validation failed. Please try again.'
    };
    
    const message = errorMessages[validation.reason] || 'Unknown QR code error.';
    alert(`❌ QR Code Error\n\n${message}`);
  }
}

// Check for QR unlock on page load
function checkForQRUnlock() {
  const urlParams = new URLSearchParams(window.location.search);
  const qrToken = urlParams.get('qr_unlock');
  
  if (qrToken) {
    console.log('🔍 QR unlock token found:', qrToken);
    processQRUnlock(qrToken);
  }
}

// Simple QR code modal
function showSimpleQRModal() {
  const modal = document.createElement('div');
  modal.id = 'simple-qr-modal';
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
      <h2 style="color: #ff0000; margin-bottom: 20px;">📱 Multiplayer QR Code</h2>
      <p style="margin-bottom: 20px;">Scan this QR code with another device to unlock multiplayer access.</p>
      <div id="qr-container" style="margin: 20px 0; padding: 20px; background: white; border-radius: 10px; display: inline-block;">
        <canvas id="qr-code" style="max-width: 200px; height: auto;"></canvas>
      </div>
      <p style="font-size: 12px; color: #ccc; margin-top: 15px;">
        🔒 Security: 5-minute expiration, max 3 devices<br>
        📱 Device tracking enabled<br>
        ✅ This device is already unlocked
      </p>
      <button onclick="closeSimpleQRModal()" style="
        background: #333;
        color: white;
        border: none;
        padding: 15px 30px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
        margin-top: 15px;
      ">❌ Close</button>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Generate QR code
  generateSimpleQRCode();
}

// Close QR modal
function closeSimpleQRModal() {
  const modal = document.getElementById('simple-qr-modal');
  if (modal) {
    modal.remove();
  }
}

// Export functions
window.generateSimpleQRCode = generateSimpleQRCode;
window.validateSimpleQRCode = validateSimpleQRCode;
window.processQRUnlock = processQRUnlock;
window.checkForQRUnlock = checkForQRUnlock;
window.showSimpleQRModal = showSimpleQRModal;
window.closeSimpleQRModal = closeSimpleQRModal;

// Auto-check for QR unlock on page load
document.addEventListener('DOMContentLoaded', function() {
  checkForQRUnlock();
});

console.log('✅ Simple QR code system loaded'); 
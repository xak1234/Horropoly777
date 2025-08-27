// multiplayer-auth-bypass.js
// Bypass authentication for multiplayer room operations in local testing

/**
 * Override the old ensureAuthenticated function to bypass auth for local testing
 */
export function bypassAuthenticationForLocalTesting() {
  console.log("🔧 Setting up authentication bypass for local testing...");
  
  // Override the global ensureAuthenticated function if it exists
  if (typeof window.ensureAuthenticated === 'function') {
    const originalEnsureAuth = window.ensureAuthenticated;
    
    window.ensureAuthenticated = async () => {
      console.log("ℹ️ Authentication bypassed for local testing");
      return true;
    };
    
    // Store the original for fallback
    window.originalEnsureAuthenticated = originalEnsureAuth;
    
    console.log("✅ Authentication bypass installed");
  }
  
  // Also patch any Firebase auth functions that might be causing issues
  try {
    // Override waitForAuthReady if it exists globally
    if (typeof window.waitForAuthReady === 'function') {
      window.waitForAuthReady = async (timeout = 1000) => {
        console.log("ℹ️ waitForAuthReady bypassed for local testing");
        return { uid: 'local-test-user' };
      };
    }
    
    console.log("✅ Firebase auth functions patched for local testing");
  } catch (error) {
    console.warn("⚠️ Could not patch all auth functions:", error);
  }
}

/**
 * Apply the bypass immediately when this module loads
 */
export function applyAuthBypass() {
  // Wait a moment for other scripts to load
  setTimeout(() => {
    bypassAuthenticationForLocalTesting();
  }, 100);
  
  // Also apply on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bypassAuthenticationForLocalTesting);
  } else {
    bypassAuthenticationForLocalTesting();
  }
}

// Auto-apply the bypass
applyAuthBypass();

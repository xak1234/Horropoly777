// local-robust-firebase.js
// Simple script to use robust Firebase initialization for local testing

// Import the robust Firebase initialization
import { initHorropolyFirebase } from "./firebase-init-fixed.js";

/**
 * Initialize robust Firebase for local testing
 * This replaces the old firebase-init.js initialization
 */
function initRobustFirebaseLocal() {
  console.log("🔄 Initializing robust Firebase for local testing...");
  
  try {
    // Use the robust Firebase initialization
    initHorropolyFirebase();
    
    // Ensure global compatibility
    if (typeof window !== 'undefined') {
      // Make sure the global db variable is set
      const apps = window.firebaseApp ? [window.firebaseApp] : [];
      if (apps.length > 0 && window.firebaseDb) {
        window.db = window.firebaseDb;
      }
      
      // Keep the old function name for compatibility
      window.initFirebaseHorropoly = initHorropolyFirebase;
    }
    
    console.log("✅ Robust Firebase initialized for local testing");
    return true;
    
  } catch (error) {
    console.error("❌ Robust Firebase initialization failed:", error);
    
    // Fallback to old initialization if robust fails
    console.log("🔄 Falling back to old Firebase initialization...");
    try {
      if (typeof window.initFirebaseHorropoly === 'function') {
        window.db = window.initFirebaseHorropoly();
        console.log("✅ Fallback Firebase initialization successful");
        return true;
      }
    } catch (fallbackError) {
      console.error("❌ Fallback Firebase initialization also failed:", fallbackError);
    }
    
    return false;
  }
}

// Initialize immediately
initRobustFirebaseLocal();

// Export for manual initialization if needed
export { initRobustFirebaseLocal };

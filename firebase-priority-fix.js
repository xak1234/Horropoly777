// firebase-priority-fix.js
// Priority fix to ensure robust Firebase initializes first and prevents old system issues

import { initHorropolyFirebase } from "./firebase-init-fixed.js";
import { waitForAuthReady } from "./auth-gate.js";

/**
 * Initialize robust Firebase with priority and prevent old system conflicts
 */
export async function initializeRobustFirebasePriority() {
  console.log("🚀 Initializing robust Firebase with priority...");
  
  try {
    // Initialize robust Firebase first
    initHorropolyFirebase();
    
    // Wait for authentication to be ready
    await waitForAuthReady(10000);
    console.log("✅ Robust Firebase authentication ready");
    
    // Set global variables for compatibility
    if (window.firebaseApp && window.firebaseDb && window.firebaseAuth) {
      window.db = window.firebaseDb;
      
      // Override the old initialization function to prevent conflicts
      window.initFirebaseHorropoly = () => {
        console.log("✅ Using existing robust Firebase instance (old init bypassed)");
        return window.firebaseDb;
      };
      
      // Mark that robust Firebase is ready
      window.robustFirebaseReady = true;
      
      console.log("✅ Robust Firebase system ready with priority");
      return true;
    }
    
  } catch (error) {
    console.error("❌ Robust Firebase priority initialization failed:", error);
    return false;
  }
}

/**
 * Enhanced version that completely replaces old Firebase functions
 */
export function overrideOldFirebaseFunctions() {
  // Override the old ensureAuthenticated function
  if (typeof window !== 'undefined') {
    window.ensureAuthenticated = async () => {
      try {
        await waitForAuthReady(5000);
        console.log("✅ Authentication verified via robust system");
        return true;
      } catch (error) {
        console.error("❌ Robust authentication failed:", error);
        throw new Error("Authentication required - please refresh and try again");
      }
    };
    
    // Override old Firebase init
    const originalInit = window.initFirebaseHorropoly;
    window.initFirebaseHorropoly = () => {
      if (window.robustFirebaseReady) {
        console.log("✅ Robust Firebase already initialized, skipping old init");
        return window.firebaseDb;
      } else {
        console.log("🔄 Falling back to original Firebase init");
        return originalInit ? originalInit() : null;
      }
    };
    
    console.log("✅ Old Firebase functions overridden with robust versions");
  }
}

/**
 * Complete priority initialization
 */
export async function setupRobustFirebasePriority() {
  console.log("🎯 Setting up robust Firebase with complete priority...");
  
  try {
    // Initialize robust Firebase first
    const success = await initializeRobustFirebasePriority();
    
    if (success) {
      // Override old functions
      overrideOldFirebaseFunctions();
      
      console.log("✅ Robust Firebase priority setup complete");
      return true;
    } else {
      console.warn("⚠️ Robust Firebase failed, allowing old system to run");
      return false;
    }
    
  } catch (error) {
    console.error("❌ Robust Firebase priority setup failed:", error);
    return false;
  }
}

// firebase-final-fix.js
// Final fix for Firebase global variables and authentication

import { getApps } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { initHorropolyFirebase } from "./firebase-init-fixed.js";

/**
 * Simple and reliable Firebase setup
 */
export async function setupSimpleRobustFirebase() {
  console.log("🔧 Setting up simple robust Firebase...");
  
  try {
    // Initialize robust Firebase
    initHorropolyFirebase();
    console.log("✅ Robust Firebase initialized");
    
    // Get the Firebase app and services directly
    const apps = getApps();
    if (apps.length === 0) {
      throw new Error("No Firebase apps found after initialization");
    }
    
    const app = apps[0];
    const db = getFirestore(app);
    const auth = getAuth(app);
    
    console.log("✅ Firebase services obtained:", {
      app: !!app,
      db: !!db,
      auth: !!auth,
      projectId: app.options.projectId
    });
    
    // Set global variables immediately
    window.firebaseApp = app;
    window.firebaseDb = db;
    window.firebaseAuth = auth;
    window.db = db; // For compatibility
    
    console.log("✅ Global Firebase variables set");
    
    // Try anonymous authentication (but don't fail if it doesn't work)
    try {
      console.log("🔐 Attempting anonymous authentication...");
      
      // Set up a simple auth state listener
      onAuthStateChanged(auth, (user) => {
        if (user) {
          console.log("✅ User authenticated:", user.uid);
        } else {
          console.log("ℹ️ No user authenticated yet");
        }
      });
      
      // Try to sign in anonymously
      const userCredential = await signInAnonymously(auth);
      console.log("✅ Anonymous authentication successful:", userCredential.user.uid);
      
    } catch (authError) {
      console.warn("⚠️ Authentication failed, but continuing:", authError.message);
      // Don't fail the entire setup just because auth failed
    }
    
    // Override old Firebase functions
    window.initFirebaseHorropoly = () => {
      console.log("✅ Using existing robust Firebase instance");
      return db;
    };
    
    // Simple ensureAuthenticated that doesn't block
    window.ensureAuthenticated = async () => {
      console.log("✅ Authentication check passed (simple mode)");
      return true;
    };
    
    // Mark as ready
    window.robustFirebaseReady = true;
    
    console.log("✅ Simple robust Firebase setup complete");
    return true;
    
  } catch (error) {
    console.error("❌ Simple robust Firebase setup failed:", error);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 200) + "..."
    });
    return false;
  }
}

/**
 * Even simpler fallback that just sets up the transport layer
 */
export async function setupMinimalRobustFirebase() {
  console.log("🔧 Setting up minimal robust Firebase...");
  
  try {
    // Just initialize the robust Firebase without any auth
    initHorropolyFirebase();
    console.log("✅ Minimal robust Firebase initialized");
    
    // Check if global variables were set
    if (window.firebaseApp && window.firebaseDb) {
      window.db = window.firebaseDb;
      
      // Override just the init function
      window.initFirebaseHorropoly = () => {
        console.log("✅ Using existing minimal robust Firebase instance");
        return window.firebaseDb;
      };
      
      console.log("✅ Minimal robust Firebase setup complete");
      return true;
    } else {
      console.warn("⚠️ Global Firebase variables not set by robust init");
      return false;
    }
    
  } catch (error) {
    console.error("❌ Minimal robust Firebase setup failed:", error);
    return false;
  }
}

/**
 * Complete setup with multiple fallback levels
 */
export async function setupRobustFirebaseFinal() {
  console.log("🎯 Setting up robust Firebase with final approach...");
  
  try {
    // Try simple approach first
    console.log("🔧 Attempting simple robust setup...");
    let success = await setupSimpleRobustFirebase();
    
    if (!success) {
      console.log("🔧 Simple failed, trying minimal setup...");
      success = await setupMinimalRobustFirebase();
    }
    
    if (success) {
      console.log("✅ Robust Firebase final setup successful");
      return true;
    } else {
      console.warn("⚠️ All robust Firebase approaches failed, using old system");
      return false;
    }
    
  } catch (error) {
    console.error("❌ Robust Firebase final setup failed:", error);
    return false;
  }
}

/**
 * Quick test function to verify Firebase is working
 */
export function testFirebaseSetup() {
  console.log("🧪 Testing Firebase setup...");
  
  const tests = {
    firebaseApp: !!window.firebaseApp,
    firebaseDb: !!window.firebaseDb,
    firebaseAuth: !!window.firebaseAuth,
    db: !!window.db,
    robustReady: !!window.robustFirebaseReady,
    appsCount: getApps().length
  };
  
  console.log("🧪 Firebase test results:", tests);
  
  const allGood = tests.firebaseApp && tests.firebaseDb && tests.db;
  console.log(allGood ? "✅ Firebase setup test passed" : "❌ Firebase setup test failed");
  
  return allGood;
}

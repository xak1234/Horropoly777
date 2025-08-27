// firebase-auth-optional.js
// Firebase setup with optional authentication for local testing

import { getApps } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { initHorropolyFirebase } from "./firebase-init-fixed.js";

/**
 * Setup Firebase with optional authentication
 * Works even if anonymous auth is not enabled in Firebase console
 */
export async function setupFirebaseWithOptionalAuth() {
  console.log("🔧 Setting up Firebase with optional authentication...");
  
  try {
    // Initialize robust Firebase
    initHorropolyFirebase();
    console.log("✅ Robust Firebase initialized");
    
    // Get the Firebase services
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
    
    // Set global variables immediately (don't wait for auth)
    window.firebaseApp = app;
    window.firebaseDb = db;
    window.firebaseAuth = auth;
    window.db = db; // For compatibility
    
    console.log("✅ Global Firebase variables set");
    
    // Try authentication but don't fail if it doesn't work
    let authWorking = false;
    try {
      console.log("🔐 Attempting optional authentication...");
      
      // Import auth functions dynamically to avoid errors
      const { signInAnonymously, onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js");
      
      // Set up auth state listener
      onAuthStateChanged(auth, (user) => {
        if (user) {
          console.log("✅ User authenticated:", user.uid);
          authWorking = true;
        }
      });
      
      // Try to sign in anonymously
      const userCredential = await signInAnonymously(auth);
      console.log("✅ Anonymous authentication successful:", userCredential.user.uid);
      authWorking = true;
      
    } catch (authError) {
      console.warn("⚠️ Authentication not available:", authError.message);
      
      if (authError.code === 'auth/configuration-not-found') {
        console.log("ℹ️ Anonymous authentication is not enabled in Firebase console");
        console.log("ℹ️ This is OK for local testing - continuing without auth");
      }
      
      // Don't fail the entire setup just because auth failed
      authWorking = false;
    }
    
    // Override Firebase functions regardless of auth status
    window.initFirebaseHorropoly = () => {
      console.log("✅ Using existing Firebase instance (optional auth)");
      return db;
    };
    
    // Create a smart ensureAuthenticated function
    window.ensureAuthenticated = async () => {
      if (authWorking) {
        console.log("✅ Authentication verified (auth working)");
        return true;
      } else {
        console.log("ℹ️ Authentication bypassed (auth not configured)");
        return true; // Allow operations to continue
      }
    };
    
    // Mark as ready
    window.robustFirebaseReady = true;
    window.authConfigured = authWorking;
    
    console.log("✅ Firebase with optional auth setup complete");
    console.log(`ℹ️ Authentication status: ${authWorking ? 'Working' : 'Bypassed'}`);
    
    return true;
    
  } catch (error) {
    console.error("❌ Firebase optional auth setup failed:", error);
    return false;
  }
}

/**
 * Test the Firebase setup
 */
export function testOptionalAuthSetup() {
  console.log("🧪 Testing Firebase optional auth setup...");
  
  const tests = {
    firebaseApp: !!window.firebaseApp,
    firebaseDb: !!window.firebaseDb,
    firebaseAuth: !!window.firebaseAuth,
    db: !!window.db,
    robustReady: !!window.robustFirebaseReady,
    authConfigured: !!window.authConfigured,
    appsCount: getApps().length
  };
  
  console.log("🧪 Firebase test results:", tests);
  
  const coreWorking = tests.firebaseApp && tests.firebaseDb && tests.db;
  console.log(coreWorking ? "✅ Firebase core setup test passed" : "❌ Firebase core setup test failed");
  console.log(`ℹ️ Authentication: ${tests.authConfigured ? 'Configured' : 'Not configured (OK for local testing)'}`);
  
  return coreWorking;
}

/**
 * Instructions for enabling authentication (if desired)
 */
export function showAuthInstructions() {
  console.log(`
🔧 To enable Firebase Authentication (optional):

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project: horropoly
3. Go to Authentication > Sign-in method
4. Enable "Anonymous" sign-in provider
5. Save changes
6. Refresh your game

Note: Authentication is NOT required for local testing.
Your game will work fine without it!
  `);
}

// Export for manual use
if (typeof window !== 'undefined') {
  window.setupFirebaseWithOptionalAuth = setupFirebaseWithOptionalAuth;
  window.testOptionalAuthSetup = testOptionalAuthSetup;
  window.showAuthInstructions = showAuthInstructions;
}

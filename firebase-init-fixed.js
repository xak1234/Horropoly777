// firebase-init-fixed.js
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

export function initFirebase(config) {
  if (getApps().length) {
    console.log("✅ Firebase already initialized, reusing existing app");
    return;
  }

  const app = initializeApp(config);

  try {
    initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true, // fixes WebChannel errors
      useFetchStreams: false,
      localCache: persistentLocalCache({ 
        tabManager: persistentMultipleTabManager() 
      }),
    });
  } catch (error) {
    console.warn("⚠️ Advanced Firestore features not available, using default initialization:", error);
    // Fallback to basic initialization if advanced features aren't available
  }

  getAuth(app);
  console.log("✅ Firebase initialized (robust transport enabled)");
}

// Default Horropoly Firebase config
export const HORROPOLY_CONFIG = {
  apiKey: "AIzaSyBwc9JDb49JYp1RBnT1cuw-qfcVQORqlsg",
  authDomain: "horropoly.firebaseapp.com",
  projectId: "horropoly",
  storageBucket: "horropoly.firebasestorage.app",
  messagingSenderId: "582020770053",
  appId: "1:582020770053:web:875b64a83ce557da01ef6c"
};

// Initialize with Horropoly config
export function initHorropolyFirebase() {
  initFirebase(HORROPOLY_CONFIG);
  
  // Store globally for compatibility with existing code
  const apps = getApps();
  if (apps.length > 0) {
    const app = apps[0];
    
    try {
      const db = getFirestore(app);
      const auth = getAuth(app);
      
      window.firebaseApp = app;
      window.firebaseDb = db;
      window.firebaseAuth = auth;
      window.db = db; // For compatibility
      
      console.log("✅ Firebase global variables set:", {
        app: !!window.firebaseApp,
        db: !!window.firebaseDb,
        auth: !!window.firebaseAuth,
        projectId: app.options.projectId
      });
      
    } catch (error) {
      console.error("❌ Failed to set Firebase global variables:", error);
      console.error("Error details:", error);
    }
  } else {
    console.error("❌ No Firebase apps found after initialization");
  }
}

// Production Firebase Fix - Apply this to resolve collection() errors
// Add this script to your production index.html before other Firebase scripts

(function() {
  'use strict';
  
  console.log('🔧 Applying production Firebase fix...');
  
  // Override the problematic getDb function with a robust version
  window.getDbFixed = async function() {
    try {
      // Check if Firebase is already initialized globally
      if (window.firebaseDb && typeof window.firebaseDb.collection === 'function') {
        console.log('✅ Using existing Firebase instance');
        return window.firebaseDb;
      }
      
      // Check if we have a Firebase app but no db
      if (window.firebaseApp && !window.firebaseDb) {
        console.log('🔄 Initializing Firestore from existing app...');
        const { getFirestore } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        window.firebaseDb = getFirestore(window.firebaseApp);
        
        // Wait a moment for Firestore to initialize
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (typeof window.firebaseDb.collection === 'function') {
          console.log('✅ Firestore initialized successfully');
          return window.firebaseDb;
        }
      }
      
      // If no Firebase app exists, try to initialize
      if (!window.firebaseApp) {
        console.log('🔄 Initializing new Firebase app...');
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
        const { getFirestore } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const firebaseConfig = {
          apiKey: "AIzaSyBwc9JDb49JYp1RBnT1cuw-qfcVQORqlsg",
          authDomain: "horropoly.firebaseapp.com",
          projectId: "horropoly",
          storageBucket: "horropoly.firebasestorage.app",
          messagingSenderId: "582020770053",
          appId: "1:582020770053:web:875b64a83ce557da01ef6c"
        };
        
        window.firebaseApp = initializeApp(firebaseConfig);
        window.firebaseDb = getFirestore(window.firebaseApp);
        
        // Wait for Firestore to be ready
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (typeof window.firebaseDb.collection === 'function') {
          console.log('✅ New Firebase app initialized successfully');
          return window.firebaseDb;
        }
      }
      
      console.log('❌ Failed to initialize Firebase');
      return null;
    } catch (error) {
      console.error('❌ Firebase initialization error:', error);
      return null;
    }
  };
  
  // Override collection function to add validation
  const originalCollection = window.collection;
  window.collection = function(db, path) {
    if (!db || typeof db.collection !== 'function') {
      console.error('❌ Invalid Firestore instance passed to collection()');
      throw new Error('Expected first argument to collection() to be a CollectionReference, a DocumentReference or FirebaseFirestore');
    }
    return db.collection(path);
  };
  
  // Add a global Firebase test function
  window.testFirebaseProduction = async function() {
    console.log('🧪 Testing Firebase on production...');
    const db = await window.getDbFixed();
    if (db && typeof db.collection === 'function') {
      console.log('✅ Production Firebase is working!');
      return true;
    } else {
      console.log('❌ Production Firebase failed');
      return false;
    }
  };
  
  console.log('🔧 Production Firebase fix applied');
})(); 
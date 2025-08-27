// clear-firebase-purchase-logs.js
// Script to clear all Firebase purchase logs and start fresh

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBwc9JDb49JYp1RBnT1cuw-qfcVQORqlsg",
  authDomain: "horropoly.firebaseapp.com",
  projectId: "horropoly",
  storageBucket: "horropoly.firebasestorage.app",
  messagingSenderId: "582020770053",
  appId: "1:582020770053:web:875b64a83ce557da01ef6c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Collections to clear
const collectionsToClear = [
  'payments',
  'paymentDevices', 
  'paymentSessions',
  'failedPayments'
];

async function clearCollection(collectionName) {
  console.log(`🗑️ Clearing collection: ${collectionName}`);
  
  try {
    const collectionRef = collection(db, collectionName);
    const querySnapshot = await getDocs(collectionRef);
    
    if (querySnapshot.empty) {
      console.log(`✅ Collection ${collectionName} is already empty`);
      return 0;
    }
    
    const deletePromises = [];
    querySnapshot.forEach((doc) => {
      deletePromises.push(deleteDoc(doc.ref));
    });
    
    await Promise.all(deletePromises);
    console.log(`✅ Deleted ${deletePromises.length} documents from ${collectionName}`);
    return deletePromises.length;
    
  } catch (error) {
    console.error(`❌ Error clearing collection ${collectionName}:`, error);
    return 0;
  }
}

async function clearAllPurchaseLogs() {
  console.log('🧹 Starting Firebase purchase logs cleanup...');
  console.log('⚠️  This will delete ALL payment-related data!');
  
  let totalDeleted = 0;
  
  for (const collectionName of collectionsToClear) {
    const deletedCount = await clearCollection(collectionName);
    totalDeleted += deletedCount;
  }
  
  console.log(`\n🎉 Cleanup completed!`);
  console.log(`📊 Total documents deleted: ${totalDeleted}`);
  console.log(`📋 Collections cleared: ${collectionsToClear.join(', ')}`);
  
  if (totalDeleted > 0) {
    console.log('\n✅ Firebase purchase logs have been cleared successfully!');
    console.log('🔄 The system is now ready for fresh payment data.');
  } else {
    console.log('\nℹ️  No existing purchase logs found to clear.');
  }
}

// Function to be called from HTML
window.clearFirebasePurchaseLogs = clearAllPurchaseLogs;

// Auto-run if this script is executed directly
if (typeof window !== 'undefined') {
  console.log('🔧 Firebase purchase logs cleanup script loaded');
  console.log('💡 Call clearFirebasePurchaseLogs() to start the cleanup process');
} 
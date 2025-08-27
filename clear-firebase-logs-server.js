// clear-firebase-logs-server.js
// Node.js script to clear Firebase purchase logs using Firebase Admin SDK

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
try {
    // Try to use service account if available
    const serviceAccountPath = path.join(__dirname, 'firebase-service-account.json');
    const serviceAccount = require(serviceAccountPath);
    
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    
    console.log('✅ Firebase Admin SDK initialized with service account');
} catch (error) {
    console.log('⚠️ Service account not found, using default credentials');
    admin.initializeApp();
}

const db = admin.firestore();

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
        const collectionRef = db.collection(collectionName);
        const snapshot = await collectionRef.get();
        
        if (snapshot.empty) {
            console.log(`✅ Collection ${collectionName} is already empty`);
            return 0;
        }
        
        const batch = db.batch();
        let deletedCount = 0;
        
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
            deletedCount++;
        });
        
        await batch.commit();
        console.log(`✅ Deleted ${deletedCount} documents from ${collectionName}`);
        return deletedCount;
        
    } catch (error) {
        console.error(`❌ Error clearing collection ${collectionName}:`, error);
        return 0;
    }
}

async function clearAllPurchaseLogs() {
    console.log('🧹 Starting Firebase purchase logs cleanup...');
    console.log('⚠️  This will delete ALL payment-related data!');
    console.log('📋 Collections to be cleared:', collectionsToClear.join(', '));
    
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
    
    // Close the connection
    await admin.app().delete();
    console.log('🔌 Firebase connection closed');
}

// Run the cleanup if this script is executed directly
if (require.main === module) {
    clearAllPurchaseLogs()
        .then(() => {
            console.log('🎯 Script execution completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Script execution failed:', error);
            process.exit(1);
        });
}

module.exports = { clearAllPurchaseLogs }; 
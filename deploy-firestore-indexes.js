// deploy-firestore-indexes.js
// Script to help deploy Firestore indexes for optimized room queries

console.log(`
🔥 FIRESTORE INDEX DEPLOYMENT GUIDE
===================================

The optimized room queries require composite indexes. Here's how to set them up:

📋 REQUIRED INDEXES:
-------------------

1. For 'rooms' collection:
   - gameStarted (ASC) + isOpen (ASC) + lastUpdated (DESC)
   - gameStarted (ASC) + visibility (ASC) + lastUpdated (DESC)

2. For 'gameRooms' collection:
   - gameStarted (ASC) + isOpen (ASC) + lastUpdated (DESC)
   - gameStarted (ASC) + visibility (ASC) + lastUpdated (DESC)

🚀 DEPLOYMENT OPTIONS:
---------------------

Option 1: Firebase CLI (Recommended)
  1. Install Firebase CLI: npm install -g firebase-tools
  2. Login: firebase login
  3. Deploy indexes: firebase deploy --only firestore:indexes
  
Option 2: Manual via Console
  1. Go to Firebase Console > Firestore > Indexes
  2. Click "Create Index"
  3. Add the field combinations above
  
Option 3: Auto-create via Query
  1. Run the optimized queries in your app
  2. Firestore will prompt to create missing indexes
  3. Click the provided links to auto-create

📁 INDEX FILE:
--------------
The required indexes are defined in: firestore-indexes-optimized.json

🔧 TESTING:
-----------
After deployment, test with: test-optimized-rooms.html

⚡ PERFORMANCE IMPACT:
---------------------
- Before: Full collection scan (580+ rooms)
- After: Index-optimized query (~10-50 rooms)
- Expected speedup: 10-20x faster
`);

// Function to validate if indexes are working
export async function validateIndexes(app) {
  console.log('🔍 Validating Firestore indexes...');
  
  try {
    const { fetchJoinableRooms } = await import('./rooms-query.js');
    
    const startTime = performance.now();
    const result = await fetchJoinableRooms(app);
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);
    
    console.log(`✅ Index validation successful!`);
    console.log(`   Query time: ${duration}ms`);
    console.log(`   Results: ${result.rooms.length} rooms`);
    console.log(`   Total recent: ${result.totalRecent} rooms`);
    
    if (duration < 1000) {
      console.log(`🚀 Excellent performance! Indexes are working optimally.`);
    } else if (duration < 3000) {
      console.log(`⚠️  Moderate performance. Indexes may still be building.`);
    } else {
      console.log(`❌ Slow performance. Indexes may be missing or building.`);
    }
    
    return { success: true, duration, resultCount: result.rooms.length };
    
  } catch (error) {
    console.error(`❌ Index validation failed: ${error.message}`);
    
    if (error.message.includes('index')) {
      console.log(`
🔧 INDEX CREATION NEEDED:
The error suggests missing indexes. Options:
1. Check Firebase Console for index creation prompts
2. Deploy firestore-indexes-optimized.json
3. Wait for auto-creation after running queries
      `);
    }
    
    return { success: false, error: error.message };
  }
}

// Make function available globally
if (typeof window !== 'undefined') {
  window.validateFirestoreIndexes = validateIndexes;
}

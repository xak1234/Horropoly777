// deploy-room-optimization.js
// Script to deploy the optimized room query system

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { migrateRoomsForOptimization, getRoomStats, cleanupStaleRooms } from './room-optimization-utils.js';

const firebaseConfig = {
  apiKey: "AIzaSyBwc9JDb49JYp1RBnT1cuw-qfcVQORqlsg",
  authDomain: "horropoly.firebaseapp.com",
  projectId: "horropoly",
  storageBucket: "horropoly.firebasestorage.app",
  messagingSenderId: "582020770053",
  appId: "1:582020770053:web:875b64a83ce557da01ef6c"
};

async function deployOptimization() {
  console.log('🚀 Deploying room optimization system...');
  
  try {
    const app = initializeApp(firebaseConfig);
    
    // Step 1: Get current stats
    console.log('\n📊 Getting current room statistics...');
    const beforeStats = await getRoomStats(app);
    if (beforeStats) {
      console.log(`Current state: ${beforeStats.total} total rooms, ${beforeStats.withCapacity} joinable`);
    }
    
    // Step 2: Clean up stale rooms
    console.log('\n🧹 Cleaning up stale rooms...');
    const cleanupResult = await cleanupStaleRooms(app, 60);
    if (cleanupResult.success) {
      console.log(`✅ Cleaned up ${cleanupResult.deletedCount} stale rooms`);
    }
    
    // Step 3: Migrate existing rooms
    console.log('\n🔄 Migrating rooms for optimization...');
    const migrationResult = await migrateRoomsForOptimization(app);
    if (migrationResult.success) {
      console.log(`✅ Migration complete: ${migrationResult.migratedCount} rooms updated`);
    } else {
      console.error(`❌ Migration failed: ${migrationResult.error}`);
      return;
    }
    
    // Step 4: Get final stats
    console.log('\n📊 Getting final statistics...');
    const afterStats = await getRoomStats(app);
    if (afterStats) {
      console.log(`Final state: ${afterStats.total} total rooms, ${afterStats.withCapacity} joinable, ${afterStats.recent} recent`);
    }
    
    console.log('\n🎉 Room optimization deployment complete!');
    console.log('\nNext steps:');
    console.log('1. Test the optimized queries using test-optimized-rooms.html');
    console.log('2. Monitor performance in the browser console');
    console.log('3. Set up Firestore composite indexes if prompted');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
  }
}

// Run deployment if this script is executed directly
if (typeof window !== 'undefined') {
  window.deployRoomOptimization = deployOptimization;
  console.log('Room optimization deployment script loaded. Call deployRoomOptimization() to run.');
} else {
  deployOptimization();
}

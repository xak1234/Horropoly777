// Quick fix script to force auto-start any full rooms that should have started
import { initFirebaseHorropoly, getDb } from './firebase-init.js';
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  query,
  where
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

async function forceAutoStartFullRooms() {
  console.log('🔧 Force auto-start check for full rooms...');
  
  try {
    // Initialize Firebase
    initFirebaseHorropoly();
    const db = await getDb();
    
    if (!db) {
      console.error('❌ Firebase not initialized');
      return;
    }
    
    // Get all game rooms
    const gameRoomsQuery = query(collection(db, 'gameRooms'));
    const snapshot = await getDocs(gameRoomsQuery);
    
    console.log(`📊 Found ${snapshot.docs.length} game rooms to check`);
    
    for (const roomDoc of snapshot.docs) {
      const roomData = roomDoc.data();
      const roomId = roomDoc.id;
      
      console.log(`🏠 Checking room ${roomId}:`, {
        gameStarted: roomData.gameStarted,
        playersCount: roomData.players?.length,
        maxPlayers: roomData.maxPlayers
      });
      
      // Check if room should auto-start
      const shouldAutoStart = !roomData.gameStarted && 
                             roomData.players?.length >= (roomData.maxPlayers || 2);
      
      if (shouldAutoStart) {
        console.log(`🎮 Auto-starting room ${roomId}...`);
        
        try {
          await updateDoc(doc(db, 'gameRooms', roomId), {
            gameStarted: true,
            lastUpdated: new Date().toISOString()
          });
          
          console.log(`✅ Successfully auto-started room ${roomId}`);
        } catch (error) {
          console.error(`❌ Failed to auto-start room ${roomId}:`, error);
        }
      } else {
        console.log(`ℹ️ Room ${roomId} doesn't need auto-start`);
      }
    }
    
    console.log('🎯 Force auto-start check completed');
    
  } catch (error) {
    console.error('❌ Error in force auto-start:', error);
  }
}

// Export the function and also run it immediately when this script is loaded
export { forceAutoStartFullRooms };

// Auto-run when script is loaded directly
if (typeof window !== 'undefined') {
  window.forceAutoStartFullRooms = forceAutoStartFullRooms;
  console.log('🔧 Force auto-start function loaded. Call forceAutoStartFullRooms() to check all rooms.');
}

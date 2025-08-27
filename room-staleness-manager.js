// room-staleness-manager.js
// Auto-mark stale rooms with isOpen=false to hide them from queries

import { getFirestore, collection, query, where, getDocs, updateDoc, doc, writeBatch } from "firebase/firestore";

const STALE_THRESHOLD_MS = 1000 * 60 * 15; // 15 minutes of inactivity
const BATCH_SIZE = 500; // Firestore batch limit

/**
 * Mark rooms as stale (isOpen=false) when they haven't been updated recently
 * or when the game has started
 */
export async function markStaleRooms(app, collections = ["rooms", "gameRooms"]) {
  console.log('🕒 Checking for stale rooms to mark as closed...');
  
  const db = getFirestore(app);
  const cutoffTime = new Date(Date.now() - STALE_THRESHOLD_MS).toISOString();
  let totalMarked = 0;
  
  for (const collectionName of collections) {
    try {
      console.log(`Checking ${collectionName} collection...`);
      
      // Find rooms that should be marked as stale
      const staleQuery = query(
        collection(db, collectionName),
        where("isOpen", "!=", false), // Only check rooms that are currently open
        where("lastUpdated", "<", cutoffTime)
      );
      
      const staleSnapshot = await getDocs(staleQuery);
      console.log(`Found ${staleSnapshot.docs.length} potentially stale rooms in ${collectionName}`);
      
      if (staleSnapshot.docs.length === 0) continue;
      
      // Process in batches
      const batches = [];
      let currentBatch = writeBatch(db);
      let batchCount = 0;
      
      staleSnapshot.forEach(roomDoc => {
        const data = roomDoc.data();
        
        // Mark as stale if:
        // 1. Game has started (should be hidden from lobby)
        // 2. No recent activity and still waiting for players
        const shouldMarkStale = 
          data.gameStarted === true || 
          (data.status === 'waiting_for_players' && !data.gameStarted);
        
        if (shouldMarkStale) {
          currentBatch.update(roomDoc.ref, {
            isOpen: false,
            markedStaleAt: new Date().toISOString(),
            staleReason: data.gameStarted ? 'game_started' : 'inactive'
          });
          
          batchCount++;
          totalMarked++;
          
          console.log(`Marking room ${roomDoc.id} as stale (${data.gameStarted ? 'game started' : 'inactive'})`);
          
          // Start new batch if current one is full
          if (batchCount >= BATCH_SIZE) {
            batches.push(currentBatch);
            currentBatch = writeBatch(db);
            batchCount = 0;
          }
        }
      });
      
      // Add final batch if it has updates
      if (batchCount > 0) {
        batches.push(currentBatch);
      }
      
      // Commit all batches
      for (let i = 0; i < batches.length; i++) {
        await batches[i].commit();
        console.log(`Committed batch ${i + 1}/${batches.length} for ${collectionName}`);
      }
      
    } catch (error) {
      console.error(`Error marking stale rooms in ${collectionName}:`, error);
    }
  }
  
  console.log(`✅ Marked ${totalMarked} rooms as stale (isOpen=false)`);
  return { success: true, markedCount: totalMarked };
}

/**
 * Auto-mark a specific room as stale when game starts
 */
export async function markRoomAsStarted(app, roomId, collectionName = "rooms") {
  try {
    const db = getFirestore(app);
    await updateDoc(doc(db, collectionName, roomId), {
      gameStarted: true,
      isOpen: false, // Hide from lobby immediately
      gameStartedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    });
    
    console.log(`✅ Marked room ${roomId} as started and closed`);
    return { success: true };
    
  } catch (error) {
    console.error(`Failed to mark room ${roomId} as started:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Reopen a room (mark as isOpen=true) and update its timestamp
 */
export async function reopenRoom(app, roomId, collectionName = "rooms") {
  try {
    const db = getFirestore(app);
    await updateDoc(doc(db, collectionName, roomId), {
      isOpen: true,
      lastUpdated: new Date().toISOString(),
      reopenedAt: new Date().toISOString()
    });
    
    console.log(`✅ Reopened room ${roomId}`);
    return { success: true };
    
  } catch (error) {
    console.error(`Failed to reopen room ${roomId}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Touch a room to update its lastUpdated timestamp (keeps it fresh)
 */
export async function touchRoomActivity(app, roomId, collectionName = "rooms") {
  try {
    const db = getFirestore(app);
    await updateDoc(doc(db, collectionName, roomId), {
      lastUpdated: new Date().toISOString(),
      isOpen: true // Ensure it stays open when there's activity
    });
    
    return { success: true };
    
  } catch (error) {
    console.warn(`Failed to touch room ${roomId}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Set up automatic stale room marking (call this once on app startup)
 */
export function setupAutoStaleMarking(app, intervalMinutes = 5) {
  console.log(`🔄 Setting up auto-stale marking every ${intervalMinutes} minutes`);
  
  const intervalMs = intervalMinutes * 60 * 1000;
  
  // Run immediately
  markStaleRooms(app);
  
  // Then run periodically
  const intervalId = setInterval(() => {
    markStaleRooms(app).catch(error => {
      console.error('Auto-stale marking failed:', error);
    });
  }, intervalMs);
  
  // Return cleanup function
  return () => {
    clearInterval(intervalId);
    console.log('Auto-stale marking stopped');
  };
}

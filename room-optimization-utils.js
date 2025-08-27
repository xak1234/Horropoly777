// room-optimization-utils.js
// Utility functions to support the optimized room query system

import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";

/**
 * Ensure all rooms have the required fields for optimized queries
 * This should be run once to migrate existing rooms
 */
export async function migrateRoomsForOptimization(app) {
  console.log('🔄 Migrating rooms for optimization...');
  
  const db = getFirestore(app);
  const roomsCol = collection(db, "rooms");
  
  try {
    // Get all rooms
    const allRoomsQuery = query(roomsCol);
    const snapshot = await getDocs(allRoomsQuery);
    
    let migratedCount = 0;
    const now = new Date().toISOString();
    
    for (const roomDoc of snapshot.docs) {
      const data = roomDoc.data();
      const updates = {};
      
      // Add lastUpdated if missing
      if (!data.lastUpdated) {
        updates.lastUpdated = data.createdAt || now;
      }
      
      // Add isOpen if missing (default to true for existing rooms)
      if (data.isOpen === undefined) {
        updates.isOpen = true;
      }
      
      // Ensure gameStarted is boolean
      if (typeof data.gameStarted !== 'boolean') {
        updates.gameStarted = data.status === 'in_progress' || false;
      }
      
      // Apply updates if needed
      if (Object.keys(updates).length > 0) {
        await updateDoc(doc(db, "rooms", roomDoc.id), updates);
        migratedCount++;
        console.log(`✅ Migrated room ${roomDoc.id}:`, updates);
      }
    }
    
    console.log(`🎉 Migration complete: ${migratedCount} rooms updated out of ${snapshot.docs.length} total`);
    return { success: true, migratedCount, totalRooms: snapshot.docs.length };
    
  } catch (error) {
    console.error('❌ Room migration failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update a room's lastUpdated timestamp
 * Call this whenever a room is modified
 */
export async function touchRoom(app, roomId, collection = "rooms") {
  try {
    const db = getFirestore(app);
    await updateDoc(doc(db, collection, roomId), {
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.warn('Failed to update room timestamp:', error);
  }
}

/**
 * Cleanup stale rooms based on lastUpdated timestamp
 */
export async function cleanupStaleRooms(app, maxAgeMinutes = 60) {
  console.log(`🧹 Cleaning up rooms older than ${maxAgeMinutes} minutes...`);
  
  const db = getFirestore(app);
  const roomsCol = collection(db, "rooms");
  const cutoffTime = new Date(Date.now() - maxAgeMinutes * 60 * 1000).toISOString();
  
  try {
    // Find stale rooms
    const staleQuery = query(
      roomsCol,
      where("lastUpdated", "<", cutoffTime)
    );
    
    const staleSnapshot = await getDocs(staleQuery);
    let deletedCount = 0;
    
    for (const roomDoc of staleSnapshot.docs) {
      const data = roomDoc.data();
      
      // Only delete if room is still waiting for players (not in progress)
      if (data.status === 'waiting_for_players' || !data.gameStarted) {
        await deleteDoc(roomDoc.ref);
        deletedCount++;
        console.log(`🗑️ Deleted stale room: ${data.roomName || roomDoc.id}`);
      }
    }
    
    console.log(`✅ Cleanup complete: ${deletedCount} stale rooms deleted`);
    return { success: true, deletedCount };
    
  } catch (error) {
    console.error('❌ Stale room cleanup failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get room statistics for monitoring
 */
export async function getRoomStats(app) {
  const db = getFirestore(app);
  const roomsCol = collection(db, "rooms");
  
  try {
    const allRoomsSnapshot = await getDocs(roomsCol);
    const now = Date.now();
    const stats = {
      total: 0,
      waiting: 0,
      inProgress: 0,
      recent: 0,
      stale: 0,
      withCapacity: 0
    };
    
    allRoomsSnapshot.forEach(doc => {
      const data = doc.data();
      stats.total++;
      
      if (data.status === 'waiting_for_players' || !data.gameStarted) {
        stats.waiting++;
        
        const players = Array.isArray(data.players) ? data.players : [];
        if (players.length < (data.maxPlayers || 2)) {
          stats.withCapacity++;
        }
      } else {
        stats.inProgress++;
      }
      
      if (data.lastUpdated) {
        const age = now - new Date(data.lastUpdated).getTime();
        if (age < 30 * 60 * 1000) { // 30 minutes
          stats.recent++;
        } else if (age > 60 * 60 * 1000) { // 1 hour
          stats.stale++;
        }
      }
    });
    
    return stats;
  } catch (error) {
    console.error('Failed to get room stats:', error);
    return null;
  }
}

// room-visibility-security.js
// Add visibility field for security filtering

import { getFirestore, collection, query, where, orderBy, limit, getDocs, updateDoc, doc, writeBatch } from "firebase/firestore";

/**
 * Room visibility levels
 */
export const VISIBILITY_LEVELS = {
  PUBLIC: 'public',      // Anyone can see and join
  FRIENDS: 'friends',    // Only friends can see and join
  PRIVATE: 'private',    // Invite-only, hidden from listings
  UNLISTED: 'unlisted'   // Can join with direct link, but not listed
};

/**
 * Add visibility field to existing rooms (migration)
 */
export async function migrateRoomVisibility(app, collections = ["rooms", "gameRooms"]) {
  console.log('🔒 Migrating room visibility settings...');
  
  const db = getFirestore(app);
  let totalMigrated = 0;
  
  for (const collectionName of collections) {
    try {
      console.log(`Checking ${collectionName} collection...`);
      
      // Get all rooms without visibility field
      const roomsQuery = query(collection(db, collectionName));
      const snapshot = await getDocs(roomsQuery);
      
      const batch = writeBatch(db);
      let batchCount = 0;
      
      snapshot.forEach(roomDoc => {
        const data = roomDoc.data();
        
        // Add visibility field if missing
        if (!data.visibility) {
          // Default to public for existing rooms
          batch.update(roomDoc.ref, {
            visibility: VISIBILITY_LEVELS.PUBLIC,
            visibilityUpdatedAt: new Date().toISOString()
          });
          
          batchCount++;
          totalMigrated++;
          
          console.log(`Adding visibility to room ${roomDoc.id}`);
        }
      });
      
      if (batchCount > 0) {
        await batch.commit();
        console.log(`✅ Updated ${batchCount} rooms in ${collectionName}`);
      }
      
    } catch (error) {
      console.error(`Error migrating visibility in ${collectionName}:`, error);
    }
  }
  
  console.log(`✅ Migrated visibility for ${totalMigrated} rooms`);
  return { success: true, migratedCount: totalMigrated };
}

/**
 * Enhanced room query with visibility filtering
 */
export async function fetchJoinableRoomsWithVisibility(app, userVisibilityLevel = VISIBILITY_LEVELS.PUBLIC) {
  const db = getFirestore(app);
  const roomsCol = collection(db, "rooms");

  const RECENT_MS = 1000 * 60 * 30; // last 30 min
  const minIso = new Date(Date.now() - RECENT_MS).toISOString();

  try {
    // Query with visibility filtering
    const q = query(
      roomsCol,
      where("gameStarted", "==", false),
      where("isOpen", "==", true),
      where("visibility", "==", userVisibilityLevel), // Security filter
      where("lastUpdated", ">=", minIso),
      orderBy("lastUpdated", "desc"),
      limit(20)
    );

    const snap = await getDocs(q);
    const rooms = [];
    
    snap.forEach(d => {
      const data = d.data();
      const capacityOk =
        typeof data.maxPlayers === "number" &&
        Array.isArray(data.players) &&
        data.players.length < data.maxPlayers;
      if (capacityOk) rooms.push({ id: d.id, ...data });
    });

    console.log(`🔒 Found ${rooms.length} ${userVisibilityLevel} rooms`);
    return { rooms, totalRecent: snap.size };
    
  } catch (error) {
    console.error('Visibility-filtered query failed:', error);
    
    // Fallback to basic public query
    const basicQ = query(
      roomsCol,
      where("gameStarted", "==", false),
      where("isOpen", "==", true),
      limit(20)
    );
    
    const basicSnap = await getDocs(basicQ);
    const rooms = [];
    
    basicSnap.forEach(d => {
      const data = d.data();
      // Only include public rooms in fallback
      if (data.visibility === VISIBILITY_LEVELS.PUBLIC || !data.visibility) {
        const capacityOk =
          typeof data.maxPlayers === "number" &&
          Array.isArray(data.players) &&
          data.players.length < data.maxPlayers;
        if (capacityOk) rooms.push({ id: d.id, ...data });
      }
    });
    
    console.log(`🔒 Fallback found ${rooms.length} public rooms`);
    return { rooms, totalRecent: basicSnap.size };
  }
}

/**
 * Set room visibility level
 */
export async function setRoomVisibility(app, roomId, visibility, collectionName = "rooms") {
  try {
    if (!Object.values(VISIBILITY_LEVELS).includes(visibility)) {
      throw new Error(`Invalid visibility level: ${visibility}`);
    }
    
    const db = getFirestore(app);
    await updateDoc(doc(db, collectionName, roomId), {
      visibility: visibility,
      visibilityUpdatedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    });
    
    console.log(`✅ Set room ${roomId} visibility to ${visibility}`);
    return { success: true };
    
  } catch (error) {
    console.error(`Failed to set room visibility:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Create room with visibility setting
 */
export function createRoomWithVisibility(roomData, visibility = VISIBILITY_LEVELS.PUBLIC) {
  return {
    ...roomData,
    visibility: visibility,
    isOpen: true,
    gameStarted: false,
    lastUpdated: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    visibilityUpdatedAt: new Date().toISOString()
  };
}

/**
 * Get rooms by visibility level (for admin/debugging)
 */
export async function getRoomsByVisibility(app, visibility, collectionName = "rooms") {
  try {
    const db = getFirestore(app);
    const q = query(
      collection(db, collectionName),
      where("visibility", "==", visibility)
    );
    
    const snapshot = await getDocs(q);
    const rooms = [];
    
    snapshot.forEach(doc => {
      rooms.push({ id: doc.id, ...doc.data() });
    });
    
    console.log(`Found ${rooms.length} ${visibility} rooms`);
    return rooms;
    
  } catch (error) {
    console.error(`Failed to get ${visibility} rooms:`, error);
    return [];
  }
}

// rooms-query.js
// @ts-check
import {
  getFirestore, collection, query, where, orderBy, limit, startAfter,
  getDocs, getCountFromServer
} from "firebase/firestore";

/**
 * Find *joinable* rooms only.
 * Criteria:
 *  - gameStarted == false   (lobby stage)
 *  - isOpen == true         (not locked/private)
 *  - maxPlayers > players.length (capacity available)
 *  - lastUpdated >= now - RECENT_MS (hide stale)
 *
 * Uses: orderBy(lastUpdated desc), paginated with startAfter.
 */

const RECENT_MS = 1000 * 60 * 30; // last 30 min
const PAGE_SIZE = 20;

/**
 * @typedef {{ id:string; name?:string; maxPlayers:number; isOpen?:boolean;
 * players?: any[]; gameStarted?: boolean; lastUpdated?: string }} LobbyRoom
 */

/**
 * First page
 * @param {import("firebase/app").FirebaseApp} app
 * @returns {Promise<{rooms: LobbyRoom[], nextCursor: any|null, totalRecent:number}>}
 */
export async function fetchJoinableRooms(app) {
  const db = getFirestore(app);
  const roomsCol = collection(db, "rooms");

  const minIso = new Date(Date.now() - RECENT_MS).toISOString();

  // NOTE: Firestore requires a composite index for these filters+order.
  // Create it when prompted in the console.
  const q = query(
    roomsCol,
    where("gameStarted", "==", false),
    where("isOpen", "==", true),
    where("lastUpdated", ">=", minIso),
    orderBy("lastUpdated", "desc"),
    limit(PAGE_SIZE)
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

  // Aggregate count of recent rooms (cheap header stat)
  const countQ = query(
    roomsCol,
    where("lastUpdated", ">=", minIso)
  );
  const totalRecent = (await getCountFromServer(countQ)).data().count;

  const lastDoc = snap.docs[snap.docs.length - 1] || null;
  return { rooms, nextCursor: lastDoc, totalRecent };
}

/**
 * Next page
 * @param {import("firebase/app").FirebaseApp} app
 * @param {any} cursor last doc from previous page
 */
export async function fetchJoinableRoomsNext(app, cursor) {
  if (!cursor) return { rooms: [], nextCursor: null };
  const db = getFirestore(app);
  const roomsCol = collection(db, "rooms");
  const minIso = new Date(Date.now() - RECENT_MS).toISOString();

  const q = query(
    roomsCol,
    where("gameStarted", "==", false),
    where("isOpen", "==", true),
    where("lastUpdated", ">=", minIso),
    orderBy("lastUpdated", "desc"),
    startAfter(cursor),
    limit(PAGE_SIZE)
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

  const lastDoc = snap.docs[snap.docs.length - 1] || null;
  return { rooms, nextCursor: lastDoc };
}

// rooms-realtime.js
// @ts-check
import { getFirestore, collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";

export function subscribeHotLobby(app, onRooms) {
  const db = getFirestore(app);
  const roomsCol = collection(db, "rooms");
  const minIso = new Date(Date.now() - 1000 * 60 * 10).toISOString(); // last 10 min

  const q = query(
    roomsCol,
    where("gameStarted", "==", false),
    where("isOpen", "==", true),
    where("lastUpdated", ">=", minIso),
    orderBy("lastUpdated", "desc"),
    limit(10) // tiny live list for speed
  );

  return onSnapshot(q, (snap) => {
    const rows = [];
    snap.forEach(d => {
      const data = d.data();
      if (Array.isArray(data.players) && data.players.length < data.maxPlayers) {
        rows.push({ id: d.id, ...data });
      }
    });
    onRooms(rows);
  });
}

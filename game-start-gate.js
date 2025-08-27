// @ts-check
import { waitForAuthReady } from "./auth-gate.js";
import { getFirestore, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getApps } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

/**
 * Ensures Firebase app exists and returns Firestore
 * @returns {import("firebase/firestore").Firestore}
 */
function dbOrThrow() {
  const apps = getApps();
  if (!apps.length) throw new Error("Firebase not initialized. Run after firebase-init.js.");
  return getFirestore(apps[0]);
}

/**
 * Gate your game (including AI startup) on auth readiness,
 * then subscribe to the authoritative state.
 * @param {string} roomId
 * @param {(state:any)=>void} onState
 * @param {()=>Promise<void>} startAI // your function to boot the AI turn/loop
 */
export async function startGameAfterAuth(roomId, onState, startAI) {
  // 1) Wait until request.auth != null is guaranteed
  const user = await waitForAuthReady(15000);
  console.log("✅ Auth ready as:", user.uid);

  // 2) Now safe to subscribe to /state (rules require auth)
  const db = dbOrThrow();
  const stateRef = doc(db, "gameRooms", roomId, "state", "snapshot");

  const unsub = onSnapshot(stateRef, (snap) => {
    if (!snap.exists()) {
      console.warn("No state snapshot yet.");
      return;
    }
    const state = snap.data();
    onState(state);
  }, (err) => {
    console.error("State subscribe error:", err);
  });

  // 3) Start AI only *after* auth+subscribe are OK
  await startAI();

  return () => {
    unsub();
  };
}

/**
 * Simplified version for games that don't need state subscription
 * Just ensures authentication is ready before proceeding
 * @param {()=>Promise<void>} gameInitFunction
 */
export async function startGameWithAuth(gameInitFunction) {
  // Wait until request.auth != null is guaranteed
  const user = await waitForAuthReady(15000);
  console.log("✅ Auth ready for game start as:", user.uid);
  
  // Now safe to proceed with game initialization
  await gameInitFunction();
}

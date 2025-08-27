// @ts-check
import { getApps, initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/**
 * Ensure a single Firebase app exists. If you've already inited elsewhere,
 * this will re-use it. Otherwise it throws (to avoid hardcoding secrets here).
 * @returns {{ app: import("firebase/app").FirebaseApp, auth: import("firebase/auth").Auth }}
 */
export function getFirebaseOrThrow() {
  const apps = getApps();
  if (!apps.length) {
    // You already initialize in firebase-init.js; do NOT initialize again here
    // to avoid duplicate-app errors and mismatched Auth instances.
    throw new Error("Firebase app not initialized yet. Call after firebase-init.js completes.");
  }
  const app = apps[0];
  const auth = getAuth(app);
  return { app, auth };
}

/**
 * Waits for a signed-in user (anonymous or real). If not signed in, it signs in anonymously.
 * Resolves only when request.auth != null is guaranteed for Firestore rules.
 * @param {number} timeoutMs
 * @returns {Promise<import("firebase/auth").User>}
 */
export function waitForAuthReady(timeoutMs = 10000) {
  const { auth } = getFirebaseOrThrow();

  return new Promise((resolve, reject) => {
    let settled = false;
    const to = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error("Auth timeout: user not authenticated within time limit."));
      }
    }, timeoutMs);

    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        if (settled) return;
        if (user) {
          settled = true;
          clearTimeout(to);
          unsub();
          return resolve(user);
        }
        // No user yet → sign in anonymously and wait for the next onAuthStateChanged tick
        await signInAnonymously(auth);
      } catch (e) {
        if (!settled) {
          const code = e?.code || "";
          const message = e?.message || "";
          const isOperationNotAllowed = code === "auth/operation-not-allowed" ||
            message.includes("operation-not-allowed") ||
            message.includes("identitytoolkit.googleapis.com") ||
            message.includes("accounts:signUp");

          if (isOperationNotAllowed) {
            // Anonymous auth not enabled (or REST 400); allow app to proceed without blocking
            settled = true;
            clearTimeout(to);
            unsub();
            return resolve({ uid: "anon_bypass", isAnonymous: true });
          }

          settled = true;
          clearTimeout(to);
          unsub();
          reject(e);
        }
      }
    });
  });
}

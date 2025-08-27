// preset-room-service.js
import { initializeApp, applicationDefault, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import crypto from "crypto";

const adminApp = initializeApp({
  credential: process.env.FIREBASE_SERVICE_ACCOUNT
    ? cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    : applicationDefault(),
});
const db = getFirestore(adminApp);

function makeRoomId() {
  return crypto.randomBytes(4).toString("hex").slice(0, 6).toUpperCase();
}

function buildInitialState({ hostName, aiCount }) {
  const host = {
    name: hostName,
    userId: "host_" + crypto.randomBytes(4).toString("hex"),
    isHost: true,
    position: 0,
    currentSquare: "go",
    currentPathKey: "gamePath",
    currentIndexOnPath: 0,
    isMovingReverse: false,
    x: 0,
    y: 0,
    size: 62,
    money: 1500,
    properties: [],
    isAI: false,
    bankrupt: false,
    tokenImage: "assets/images/t1.png",
    tokenIndex: 0,
    inJail: false,
    jailTurns: 0,
    consecutiveDoubles: 0,
    stealCards: 0,
    goPassCount: 0,
    color: "#ff0000",
    colorName: "Red",
    isMoving: false,
    movementTimestamp: null,
    movementStep: 0,
    totalMovementSteps: 0,
  };

  const bots = Array.from({ length: aiCount }).map((_, i) => ({
    ...host,
    name: `AI_${i + 1}`,
    userId: `ai_${i + 1}_${crypto.randomBytes(3).toString("hex")}`,
    isHost: false,
    isAI: true,
    color: "#00ff88",
    colorName: "Neon",
    tokenIndex: i + 1,
    tokenImage: `assets/images/t${(i + 2) % 6}.png`,
  }));

  return {
    players: [host, ...bots],
    maxPlayers: 4,
    currentTurn: 0,
    gameStarted: true,
    lastDiceRoll: null,
    lastRollWasDoubles: false,
    consecutiveDoublesCount: 0,
    diceValues: { die1: 0, die2: 0 },
    properties: {},
    boardState: {
      eyePositions: [],
      soundSettings: { musicEnabled: true, soundEffectsEnabled: true },
    },
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    lastActivity: Date.now(),
    version: 1,
    lastAppliedId: 0,
    syncType: "complete",
    hash: "",
  };
}

function hashState(state) {
  return crypto.createHash("sha256").update(JSON.stringify(state)).digest("hex");
}

export async function ensurePresetRoom({ name, aiBots, hostName }) {
  const roomId = makeRoomId();
  const roomRef = db.collection("rooms").doc(roomId);
  const stateRef = db.collection("gameRooms").doc(roomId).collection("state").doc("snapshot");
  const logRef = db.collection("gameRooms").doc(roomId).collection("log").doc("0");

  const initialState = buildInitialState({ hostName, aiCount: aiBots });
  initialState.hash = hashState(initialState);

  await db.runTransaction(async (tx) => {
    tx.set(roomRef, {
      name,
      roomId,
      preset: "Solo Zombie Hunt",
      aiBots,
      humanSlots: 1,
      isOpen: false,
      createdAt: new Date().toISOString(),
      startsWithAI: true,
    });

    tx.set(stateRef, initialState);

    tx.set(logRef, {
      actionId: 0,
      intent: { type: "INIT_PRESET", payload: { name, aiBots, hostName } },
      prevHash: null,
      nextHash: initialState.hash,
      timestamp: new Date().toISOString(),
    });
  });

  return { roomId };
}

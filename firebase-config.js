// firebase-config.js
// Complete Firebase configuration for Horropoly with Analytics

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBwc9JDb49JYp1RBnT1cuw-qfcVQORqlsg",
  authDomain: "horropoly.firebaseapp.com",
  projectId: "horropoly",
  storageBucket: "horropoly.firebasestorage.app",
  messagingSenderId: "582020770053",
  appId: "1:582020770053:web:875b64a83ce557da01ef6c",
  measurementId: "G-R5ZHGLXDN6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const db = getFirestore(app);
const analytics = getAnalytics(app);

// Export for use in other modules
export { app, db, analytics, firebaseConfig };

// Log initialization status
console.log("✅ Firebase initialized with Analytics");
console.log("📊 Analytics Measurement ID:", firebaseConfig.measurementId);
console.log("🔥 Firestore Database:", db);
console.log("📈 Analytics:", analytics);

// Example analytics event for payment tracking
export function trackPaymentEvent(eventName, parameters = {}) {
  try {
    if (analytics) {
      // Note: In a real implementation, you'd use logEvent from analytics
      console.log("📊 Analytics Event:", eventName, parameters);
    }
  } catch (error) {
    console.log("⚠️ Analytics tracking failed:", error.message);
  }
}

// Example usage:
// trackPaymentEvent('payment_completed', { 
//   amount: 199, 
//   currency: 'gbp', 
//   feature: 'multiplayer_access' 
// }); 
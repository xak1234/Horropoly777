// Production Configuration for Horropoly
// This file contains all production settings and can be imported where needed

export const PRODUCTION_CONFIG = {
  // Firebase Configuration
  firebase: {
    apiKey: "AIzaSyBwc9JDb49JYp1RBnT1cuw-qfcVQORqlsg",
    authDomain: "horropoly.firebaseapp.com",
    projectId: "horropoly",
    storageBucket: "horropoly.firebasestorage.app",
    messagingSenderId: "582020770053",
    appId: "1:582020770053:web:875b64a83ce557da01ef6c"
  },
  
  // Backend API Configuration
  api: {
    baseUrl: 'https://horropoly.com',
    verifyPaymentEndpoint: '/api/verify-payment',
    webhookEndpoint: '/api/stripe-webhook'
  },
  
  // Stripe Configuration
  stripe: {
    paymentUrl: 'https://buy.stripe.com/fZu7sLfBa4Ju7Uz0Kvfbq0j',
    priceId: 'price_1OqXqXfBa4Ju7Uz0Kvfbq0j',
    currency: 'usd',
    amount: 199 // $1.99 in cents
  },
  
  // Game Configuration
  game: {
    domain: 'https://horropoly.com',
    qrCodeExpiration: 5 * 60 * 1000, // 5 minutes
    maxQrDevices: 3,
    paymentTimeout: 5 * 60 * 1000 // 5 minutes
  },
  
  // Feature Flags
  features: {
    debugMode: false,
    testMode: false,
    enableConsoleLogs: false,
    enablePaymentVerification: true,
    enableQrCodeSecurity: true
  }
};

// Helper function to check if we're in production
export function isProduction() {
  return window.location.hostname === 'horropoly.com' || 
         window.location.hostname === 'www.horropoly.com';
}

// Helper function to get appropriate configuration
export function getConfig() {
  return PRODUCTION_CONFIG;
} 
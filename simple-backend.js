// Simplified Payment Backend for Horropoly - Render Compatible
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');

console.log('🚀 Starting Simplified Horropoly Payment Backend...');

// Initialize Firebase Admin
let firebaseAdmin;
try {
  let serviceAccount;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    console.log('📁 Using Firebase service account from environment variable');
  } else {
    console.log('⚠️ No Firebase service account found - Firebase Admin will be disabled');
    serviceAccount = null;
  }
  
  if (serviceAccount) {
    firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin initialized');
  } else {
    console.log('⚠️ Firebase Admin disabled - no service account available');
  }
} catch (error) {
  console.log('❌ Firebase Admin initialization failed:', error.message);
  console.log('⚠️ Firebase Admin will be disabled');
}

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://horropoly.com',
      'https://www.horropoly.com',
      'https://horropoly-payment-backend.onrender.com',
      'https://horropoly.onrender.com'
    ];
    
    // Add localhost origins for development
    if (process.env.NODE_ENV !== 'production') {
      allowedOrigins.push(
        'http://localhost:3000',
        'http://localhost:8000',
        'http://localhost:8080',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:8000',
        'http://127.0.0.1:8080',
        'http://localhost:5500',
        'http://127.0.0.1:5500'
      );
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    
    // For development, allow all origins
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    console.log('🚫 CORS blocked origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());

// Handle preflight requests
app.options('*', cors());

// Add CORS headers to all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    firebase: !!firebaseAdmin,
    stripe: !!process.env.STRIPE_SECRET_KEY,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Payment stats endpoint
app.get('/api/payment-stats', (req, res) => {
  res.json({
    totalPayments: 0,
    totalRevenue: 0,
    lastPayment: null,
    status: 'operational'
  });
});

// Create checkout session
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { successUrl, cancelUrl, timestamp, requestId } = req.body;
    
    console.log('🛒 Creating checkout session for user:', req.body.userId);
    console.log('📋 Success URL:', successUrl);
    console.log('📋 Cancel URL:', cancelUrl);
    console.log('🕒 Timestamp:', timestamp);
    console.log('🆔 Request ID:', requestId);
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: 'Horropoly Multiplayer Access',
              description: 'Unlock multiplayer features for Horropoly game',
            },
            unit_amount: 199, // £1.99 in pence
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl || 'https://horropoly.com/success',
      cancel_url: cancelUrl || 'https://horropoly.com/cancel',
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('❌ Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook endpoint
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  console.log('📨 Received webhook event:', event.type);
  
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log('✅ Payment completed for session:', session.id);
    
    // Here you would typically:
    // 1. Verify the payment
    // 2. Store user access in Firebase
    // 3. Send confirmation email
    // 4. Generate unlock code
    
    if (firebaseAdmin) {
      try {
        const db = firebaseAdmin.firestore();
        await db.collection('payments').doc(session.id).set({
          sessionId: session.id,
          customerEmail: session.customer_details?.email,
          amount: session.amount_total,
          status: 'completed',
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log('✅ Payment recorded in Firebase');
      } catch (error) {
        console.error('❌ Error recording payment in Firebase:', error);
      }
    }
  }
  
  res.json({ received: true });
});

// Verify payment
app.post('/api/verify-payment', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status === 'paid') {
      // Generate a simple unlock code
      const unlockCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      res.json({
        verified: true,
        unlockCode,
        sessionId: session.id,
        amount: session.amount_total,
        customerEmail: session.customer_details?.email
      });
    } else {
      res.status(400).json({ error: 'Payment not completed' });
    }
  } catch (error) {
    console.error('❌ Error verifying payment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🎉 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app; 
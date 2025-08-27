// Enhanced Payment Backend for Horropoly
// Includes fraud prevention, device tracking, and comprehensive payment validation

const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');
const fs = require('fs').promises;

const USERS_FILE = 'paid_users.json';
let paidUsers = {};

async function loadPaidUsers() {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf8');
    paidUsers = JSON.parse(data);
  } catch (err) {
    paidUsers = {};
  }
}

async function savePaidUsers() {
  try {
    await fs.writeFile(USERS_FILE, JSON.stringify(paidUsers, null, 2));
  } catch (err) {
    console.error('Error saving paid users', err);
  }
}

// Initialize Firebase Admin
let firebaseAdmin;
try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  firebaseAdmin = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✅ Firebase Admin initialized');
} catch (error) {
  console.log('❌ Firebase Admin initialization failed:', error);
}

const app = express();

// FIXED CORS configuration - more permissive for development and production
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
    
    // For development and Render, allow all origins
    if (process.env.NODE_ENV !== 'production' || origin.includes('onrender.com')) {
      return callback(null, true);
    }
    
    console.log('🚫 CORS blocked origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept']
}));

// Add CORS headers to all responses BEFORE any routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Origin, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Handle preflight requests explicitly
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Origin, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Webhook endpoint for Stripe events (must be before express.json!)
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
  
  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(event.data.object);
      break;
      
    case 'payment_intent.succeeded':
      await handlePaymentIntentSucceeded(event.data.object);
      break;
      
    case 'payment_intent.payment_failed':
      await handlePaymentIntentFailed(event.data.object);
      break;
      
    default:
      console.log(`⚠️ Unhandled event type: ${event.type}`);
  }
  
  res.json({ received: true });
});

// All other middleware/routes AFTER webhook
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Trust Cloudflare proxy headers
app.set('trust proxy', true);

// Middleware to get real IP from Cloudflare
app.use((req, res, next) => {
  // Get real IP from Cloudflare headers
  req.realIP = req.headers['cf-connecting-ip'] || 
               req.headers['x-forwarded-for'] || 
               req.connection.remoteAddress;
  next();
});

// Enhanced payment verification with fraud prevention
app.post('/api/verify-payment', async (req, res) => {
  console.log('📨 Payment verification request received:', {
    sessionId: req.body.sessionId,
    hasDeviceFingerprint: !!req.body.deviceFingerprint,
    userId: req.body.userId,
    userAgent: req.headers['user-agent'],
    ip: req.ip
  });
  
  try {
    const { sessionId, deviceFingerprint, userId } = req.body;
    if (!sessionId) {
      console.log('❌ No session ID provided');
      return res.status(400).json({ 
        verified: false, 
        reason: 'Session ID required' 
      });
    }
    let session;
    try {
      console.log('🔍 Attempting to retrieve Stripe session:', sessionId);
      session = await stripe.checkout.sessions.retrieve(sessionId);
      console.log('✅ Stripe session retrieved successfully:', {
        id: session.id,
        status: session.status,
        payment_status: session.payment_status,
        amount_total: session.amount_total,
        currency: session.currency
      });
    } catch (err) {
      // Stripe returns 404 for invalid/fake sessions
      console.error('❌ Stripe session retrieval failed:', {
        sessionId: sessionId,
        error: err.message,
        code: err.code,
        statusCode: err.statusCode,
        type: err.type,
        detail: err.detail,
        headers: err.headers,
        requestId: err.requestId
      });
      
      // Provide more specific error messages
      let errorReason = 'Invalid session or Stripe error';
      if (err.statusCode === 404) {
        errorReason = 'Payment session not found - session may be invalid or expired';
      } else if (err.code === 'resource_missing') {
        errorReason = 'Payment session does not exist';
      } else if (err.type === 'StripeInvalidRequestError') {
        errorReason = 'Invalid session ID format';
      }
      
      return res.status(400).json({ 
        verified: false, 
        reason: errorReason,
        error: err.message,
        code: err.code
      });
    }
    if (session.payment_status !== 'paid' || session.status !== 'complete') {
      return res.json({ verified: false, reason: 'Payment not completed' });
    }
    // Check if payment amount is correct (£1.99)
    const expectedAmount = 199; // £1.99 in pence
    if (session.amount_total !== expectedAmount) {
      console.log('❌ Incorrect payment amount:', session.amount_total);
      return res.json({ 
        verified: false, 
        reason: 'Incorrect payment amount' 
      });
    }
    // Check if payment currency is correct (GBP)
    if (session.currency !== 'gbp') {
      console.log('❌ Incorrect currency:', session.currency);
      return res.json({ 
        verified: false, 
        reason: 'Incorrect currency' 
      });
    }
    // Fraud prevention checks
    const fraudCheck = await performFraudChecks(session, deviceFingerprint);
    if (!fraudCheck.allowed) {
      console.log('❌ Fraud check failed:', fraudCheck.reason);
      return res.json({ 
        verified: false, 
        reason: fraudCheck.reason 
      });
    }
    // Record successful verification
    await recordPaymentVerification(session, deviceFingerprint);
    if (userId) {
      paidUsers[userId] = {
        sessionId: session.id,
        paymentIntentId: session.payment_intent,
        amount: session.amount_total,
        currency: session.currency,
        paidAt: new Date().toISOString(),
        deviceIds: paidUsers[userId]?.deviceIds || []
      };
      await savePaidUsers();
    }
    console.log('✅ Payment verified successfully:', {
      sessionId: session.id,
      amount: session.amount_total,
      currency: session.currency,
      customer: session.customer,
      userId: userId
    });
    res.json({ 
      verified: true, 
      amount: session.amount_total,
      currency: session.currency,
      customer: session.customer,
      fraudChecks: fraudCheck
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ 
      verified: false, 
      reason: 'Verification failed' 
    });
  }
});

// Enhanced fraud prevention checks
async function performFraudChecks(session, deviceFingerprint) {
  if (!firebaseAdmin) {
    console.log('⚠️ Firebase Admin not available, skipping fraud checks');
    return { allowed: true, reason: 'Firebase unavailable' };
  }

  try {
    const db = firebaseAdmin.firestore();
    
    // Check if this session has been used before
    const sessionRef = db.collection('paymentSessions').doc(session.id);
    const sessionDoc = await sessionRef.get();
    
    if (sessionDoc.exists) {
      const sessionData = sessionDoc.data();
      if (sessionData.used) {
        console.log('⚠️ Session already used:', sessionData);
        return { allowed: false, reason: 'Session already used' };
      }
    }

    // Check device fingerprint if provided
    if (deviceFingerprint) {
      // Check if this device has been used with a different payment
      const deviceRef = db.collection('paymentDevices').doc(deviceFingerprint.hash);
      const deviceDoc = await deviceRef.get();
      
      if (deviceDoc.exists) {
        const deviceData = deviceDoc.data();
        if (deviceData.sessionId !== session.id) {
          console.log('❌ Device used with different payment');
          return { allowed: false, reason: 'Device used with different payment' };
        }
      }

      // Check how many devices have used this payment
      const paymentsRef = db.collection('payments');
      const paymentQuery = paymentsRef.where('sessionId', '==', session.id);
      const paymentDocs = await paymentQuery.get();
      
      if (!paymentDocs.empty) {
        const paymentData = paymentDocs.docs[0].data();
        const deviceCount = paymentData.devices ? paymentData.devices.length : 0;
        
        if (deviceCount >= 3) {
          console.log('❌ Maximum devices reached for this payment');
          return { allowed: false, reason: 'Maximum devices reached' };
        }
      }
    }

    // Check for rapid payment attempts (rate limiting)
    const recentPayments = await checkRecentPayments(session.customer_details?.email);
    if (!recentPayments.allowed) {
      return recentPayments;
    }

    return { allowed: true, reason: 'All fraud checks passed' };
    
  } catch (error) {
    console.error('❌ Fraud check error:', error);
    return { allowed: true, reason: 'Fraud check failed, allowing access' };
  }
}

// Check for recent payment attempts
async function checkRecentPayments(email) {
  if (!email || !firebaseAdmin) return { allowed: true, reason: 'No email or Firebase unavailable' };

  try {
    const db = firebaseAdmin.firestore();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const paymentsRef = db.collection('payments');
    const recentQuery = paymentsRef
      .where('customerEmail', '==', email)
      .where('timestamp', '>', oneHourAgo.toISOString());
    
    const recentDocs = await recentQuery.get();
    
    if (recentDocs.size >= 5) {
      console.log('❌ Too many recent payments from this email');
      return { allowed: false, reason: 'Too many recent payments' };
    }

    return { allowed: true, reason: 'Rate limit check passed' };
  } catch (error) {
    console.error('Rate limit check error:', error);
    return { allowed: true, reason: 'Rate limit check failed' };
  }
}

// Record payment verification
async function recordPaymentVerification(session, deviceFingerprint) {
  if (!firebaseAdmin) {
    console.log('⚠️ Firebase Admin not available, skipping verification record');
    return;
  }

  try {
    const db = firebaseAdmin.firestore();
    
    // Record the session usage
    const sessionRef = db.collection('paymentSessions').doc(session.id);
    await sessionRef.set({
      sessionId: session.id,
      customerEmail: session.customer_details?.email,
      amount: session.amount_total,
      currency: session.currency,
      verifiedAt: new Date().toISOString(),
      deviceFingerprint: deviceFingerprint || null
    }, { merge: true });

    // Record device usage if fingerprint provided
    if (deviceFingerprint) {
      const deviceRef = db.collection('paymentDevices').doc(deviceFingerprint.hash);
      await deviceRef.set({
        sessionId: session.id,
        deviceFingerprint: deviceFingerprint,
        firstUsed: new Date().toISOString(),
        lastUsed: new Date().toISOString(),
        usageCount: 1
      }, { merge: true });
    }

    console.log('✅ Payment verification recorded');
  } catch (error) {
    console.error('❌ Error recording payment verification:', error);
  }
}

// Handle successful checkout session
async function handleCheckoutSessionCompleted(session) {
  console.log('✅ Checkout session completed:', session.id);
  
  if (!firebaseAdmin) {
    console.log('⚠️ Firebase Admin not available, skipping session record');
    return;
  }

  try {
    const db = firebaseAdmin.firestore();
    
    // Generate unlock code for this payment
    const unlockCode = generateUnlockCode();
    
    // Record the successful payment
    const paymentRef = db.collection('payments').doc(session.customer_details?.email || session.id);
    await paymentRef.set({
      sessionId: session.id,
      customerEmail: session.customer_details?.email,
      customerName: session.customer_details?.name,
      amount: session.amount_total,
      currency: session.currency,
      status: 'completed',
      timestamp: new Date().toISOString(),
      feature: 'multiplayer_access',
      webhookReceived: true,
      unlockCode: unlockCode
    });

    const sessionRef = db.collection('paymentSessions').doc(session.id);
    await sessionRef.set({
      sessionId: session.id,
      customerEmail: session.customer_details?.email,
      amount: session.amount_total,
      currency: session.currency,
      verifiedAt: new Date().toISOString(),
      unlockCode: unlockCode,
      used: false
    });

    console.log(`✅ Payment recorded from webhook with unlock code: ${unlockCode}`);
  } catch (error) {
    console.error('❌ Error recording payment from webhook:', error);
  }
}

// Handle successful payment intent
async function handlePaymentIntentSucceeded(paymentIntent) {
  console.log('✅ Payment intent succeeded:', paymentIntent.id);
  
  // Additional processing can be added here
  // For example, sending confirmation emails, updating user accounts, etc.
}

// Handle failed payment intent
async function handlePaymentIntentFailed(paymentIntent) {
  console.log('❌ Payment intent failed:', paymentIntent.id);
  
  if (!firebaseAdmin) return;

  try {
    const db = firebaseAdmin.firestore();
    
    // Record the failed payment attempt
    const failedPaymentRef = db.collection('failedPayments').doc(paymentIntent.id);
    await failedPaymentRef.set({
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      failureReason: paymentIntent.last_payment_error?.message || 'Unknown',
      timestamp: new Date().toISOString()
    });

    console.log('✅ Failed payment recorded');
  } catch (error) {
    console.error('❌ Error recording failed payment:', error);
  }
}

// Root endpoint to verify service is running
app.get('/', (req, res) => {
  res.json({
    service: 'Horropoly Payment Backend',
    version: '2.0.0',
    status: 'running',
    endpoints: [
      'GET /api/health',
      'POST /api/create-checkout-session',
      'POST /api/verify-payment',
      'GET /api/paid-users',
      'GET /api/debug/payment/:sessionId'
    ],
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    firebase: !!firebaseAdmin,
    stripe: !!stripe,
    cloudflare: true,
    clientIP: req.realIP
  });
});

// Create checkout session endpoint - FIXED to handle errors properly
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    console.log('🛒 Creating checkout session request received:', {
      body: req.body,
      headers: req.headers,
      origin: req.headers.origin
    });

    const { userId, deviceFingerprint, successUrl, cancelUrl } = req.body;

    if (!userId) {
      console.log('❌ No userId provided');
      return res.status(400).json({ 
        error: 'userId is required',
        message: 'Please provide a valid user ID'
      });
    }

    console.log('🛒 Creating checkout session for user:', userId);
    if (successUrl) console.log('📋 Success URL override:', successUrl);
    if (cancelUrl) console.log('📋 Cancel URL override:', cancelUrl);

    // Validate Stripe configuration
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('❌ STRIPE_SECRET_KEY not configured');
      return res.status(500).json({ 
        error: 'Payment system not configured',
        message: 'Stripe secret key is missing'
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: 'Horropoly Multiplayer Access',
              description: 'Unlock multiplayer mode for Horropoly',
            },
            unit_amount: 199, // £1.99 in pence
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl || `${req.headers.origin || 'https://horropoly.com'}?payment_status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${req.headers.origin || 'https://horropoly.com'}?payment_status=cancelled`,
      metadata: {
        userId: userId,
        deviceFingerprint: deviceFingerprint || 'unknown'
      },
      expires_at: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
    });

    console.log('✅ Checkout session created:', session.id);
    res.json({ sessionId: session.id, url: session.url });
    
  } catch (error) {
    console.error('❌ Failed to create checkout session:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to create checkout session';
    if (error.type === 'StripeInvalidRequestError') {
      errorMessage = 'Invalid payment configuration';
    } else if (error.code === 'resource_missing') {
      errorMessage = 'Payment system not properly configured';
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details: error.message,
      code: error.code
    });
  }
});

// Debug endpoint for payment troubleshooting
app.get('/api/debug/payment/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    console.log('🔍 Debug request for session:', sessionId);
    
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    res.json({
      session: {
        id: session.id,
        status: session.status,
        payment_status: session.payment_status,
        amount_total: session.amount_total,
        currency: session.currency,
        customer: session.customer,
        created: session.created,
        expires_at: session.expires_at
      }
    });
  } catch (error) {
    console.error('❌ Debug session retrieval failed:', error);
    res.status(400).json({
      error: error.message,
      code: error.code,
      statusCode: error.statusCode
    });
  }
});

function generateUnlockCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateSessionToken(deviceId, unlockCode) {
  const crypto = require('crypto');
  const payload = {
    deviceId,
    unlockCode,
    timestamp: Date.now(),
    expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
  };
  const secret = process.env.ENCRYPTION_KEY || 'fallback-secret-key';
  return crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex') + '.' + Buffer.from(JSON.stringify(payload)).toString('base64');
}

function verifySessionToken(token) {
  try {
    const [signature, payloadBase64] = token.split('.');
    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString());
    
    if (payload.expires < Date.now()) {
      return { valid: false, reason: 'Token expired' };
    }
    
    const secret = process.env.ENCRYPTION_KEY || 'fallback-secret-key';
    const expectedSignature = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
    
    if (signature !== expectedSignature) {
      return { valid: false, reason: 'Invalid signature' };
    }
    
    return { valid: true, payload };
  } catch (error) {
    return { valid: false, reason: 'Invalid token format' };
  }
}

// Check if payment has been processed by webhook
app.post('/api/check-payment-status', async (req, res) => {
  try {
    const { paymentIntentId, sessionId } = req.body;
    
    if (!paymentIntentId && !sessionId) {
      return res.status(400).json({ 
        found: false,
        error: 'Payment intent ID or session ID required' 
      });
    }

    console.log('🔍 Checking payment status:', { paymentIntentId, sessionId });

    if (!firebaseAdmin) {
      return res.status(503).json({
        found: false,
        error: 'Firebase not available'
      });
    }

    try {
      const db = firebaseAdmin.firestore();
      
      if (sessionId) {
        const sessionQuery = db.collection('paymentSessions').where('sessionId', '==', sessionId);
        const sessionDocs = await sessionQuery.get();
        
        if (!sessionDocs.empty) {
          const sessionData = sessionDocs.docs[0].data();
          return res.json({
            found: true,
            unlockCode: sessionData.unlockCode || generateUnlockCode(),
            sessionId: sessionId,
            verifiedAt: sessionData.verifiedAt || sessionData.timestamp
          });
        }
      }

      if (paymentIntentId) {
        const paymentQuery = db.collection('payments').where('paymentIntentId', '==', paymentIntentId);
        const paymentDocs = await paymentQuery.get();
        
        if (!paymentDocs.empty) {
          const paymentData = paymentDocs.docs[0].data();
          return res.json({
            found: true,
            unlockCode: paymentData.unlockCode || generateUnlockCode(),
            paymentIntentId: paymentIntentId,
            verifiedAt: paymentData.timestamp
          });
        }
      }

      res.json({
        found: false,
        message: 'Payment not yet processed by webhook'
      });
    } catch (firebaseError) {
      console.error('❌ Firebase error:', firebaseError);
      res.json({
        found: false,
        message: 'Payment not yet processed by webhook'
      });
    }
  } catch (error) {
    console.error('❌ Error checking payment status:', error);
    res.status(500).json({ 
      found: false,
      error: 'Internal server error' 
    });
  }
});

// Verify unlock code endpoint
app.post('/api/verify-unlock-code', async (req, res) => {
  try {
    const { unlockCode, deviceId, userId } = req.body;
    
    if (!unlockCode || !deviceId) {
      return res.status(400).json({ 
        valid: false,
        error: 'Unlock code and device ID required' 
      });
    }

    console.log('🔓 Verifying unlock code:', { unlockCode, deviceId });


    if (!firebaseAdmin) {
      console.log('⚠️ Firebase not available, using fallback verification');
      return res.json({
        valid: unlockCode.length === 6,
        message: unlockCode.length === 6 ? 'Unlock code verified (fallback)' : 'Invalid unlock code format'
      });
    }

    try {
      const db = firebaseAdmin.firestore();
      
      // Check if unlock code exists in payment sessions
      const sessionQuery = db.collection('paymentSessions').where('unlockCode', '==', unlockCode);
      const sessionDocs = await sessionQuery.get();
      
      if (!sessionDocs.empty) {
        const sessionData = sessionDocs.docs[0].data();
        
        // Check if already used
        if (sessionData.used) {
          return res.json({
            valid: false,
            message: 'Unlock code already used'
          });
        }
        
        await sessionDocs.docs[0].ref.update({
          used: true,
          usedBy: deviceId,
          usedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp()
        });

        if (userId && paidUsers[userId]) {
          const set = new Set(paidUsers[userId].deviceIds || []);
          set.add(deviceId);
          paidUsers[userId].deviceIds = Array.from(set);
          await savePaidUsers();
        }

        console.log(`✅ Unlock code ${unlockCode} verified and marked as used by device: ${deviceId}`);
        
        return res.json({
          valid: true,
          message: 'Unlock code verified successfully',
          sessionToken: generateSessionToken(deviceId, unlockCode)
        });
      }
      
      // Check in payments collection as fallback
      const paymentQuery = db.collection('payments').where('unlockCode', '==', unlockCode);
      const paymentDocs = await paymentQuery.get();
      
      if (!paymentDocs.empty) {
        console.log(`✅ Unlock code ${unlockCode} found in payments collection`);
        return res.json({
          valid: true,
          message: 'Unlock code verified successfully'
        });
      }
      
      return res.json({
        valid: false,
        message: 'Invalid unlock code'
      });
      
    } catch (firebaseError) {
      console.error('❌ Firebase error during unlock code verification:', firebaseError);
      return res.json({
        valid: unlockCode.length === 6,
        message: unlockCode.length === 6 ? 'Unlock code verified (fallback)' : 'Invalid unlock code format'
      });
    }
  } catch (error) {
    console.error('❌ Error verifying unlock code:', error);
    res.status(500).json({ 
      valid: false,
      error: 'Failed to verify unlock code',
      message: 'Server error during code verification'
    });
  }
});

app.post('/api/validate-multiplayer-access', async (req, res) => {
  try {
    const { sessionToken, deviceId } = req.body;
    
    if (!sessionToken || !deviceId) {
      return res.status(400).json({ 
        valid: false,
        error: 'Session token and device ID required' 
      });
    }

    const tokenValidation = verifySessionToken(sessionToken);
    
    if (!tokenValidation.valid) {
      return res.status(401).json({
        valid: false,
        error: 'Invalid or expired session token',
        reason: tokenValidation.reason
      });
    }
    
    if (tokenValidation.payload.deviceId !== deviceId) {
      return res.status(401).json({
        valid: false,
        error: 'Device ID mismatch'
      });
    }
    
    res.json({
      valid: true,
      message: 'Multiplayer access validated',
      expiresAt: new Date(tokenValidation.payload.expires).toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error validating multiplayer access:', error);
    res.status(500).json({ 
      valid: false,
      error: 'Server error during validation' 
    });
  }
});

function requireAdminAuth(req, res, next) {
  const adminKey = req.headers['x-admin-key'] || req.query.adminKey;
  if (!adminKey || adminKey !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Admin authentication required' });
  }
  next();
}

app.get('/api/admin/unlock-codes', requireAdminAuth, async (req, res) => {
  if (!firebaseAdmin) {
    return res.status(503).json({ error: 'Firebase not available' });
  }

  try {
    const db = firebaseAdmin.firestore();
    
    const sessionsSnapshot = await db.collection('paymentSessions').get();
    const unlockCodes = [];
    
    sessionsSnapshot.forEach(doc => {
      const data = doc.data();
      unlockCodes.push({
        sessionId: data.sessionId,
        unlockCode: data.unlockCode,
        customerEmail: data.customerEmail,
        amount: data.amount,
        verifiedAt: data.verifiedAt,
        used: data.used,
        usedBy: data.usedBy,
        usedAt: data.usedAt
      });
    });
    
    res.json({
      unlockCodes: unlockCodes.sort((a, b) => new Date(b.verifiedAt) - new Date(a.verifiedAt)),
      total: unlockCodes.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting unlock codes:', error);
    res.status(500).json({ error: 'Failed to get unlock codes' });
  }
});

// Payment statistics endpoint (for admin use)
app.get('/api/payment-stats', requireAdminAuth, async (req, res) => {
  if (!firebaseAdmin) {
    return res.status(503).json({ error: 'Firebase not available' });
  }

  try {
    const db = firebaseAdmin.firestore();
    
    // Get total payments
    const paymentsSnapshot = await db.collection('payments').get();
    const totalPayments = paymentsSnapshot.size;
    
    // Get total revenue
    let totalRevenue = 0;
    paymentsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.amount && data.currency === 'gbp') {
        totalRevenue += data.amount / 100; // Convert from pence to pounds
      }
    });
    
    // Get unique devices
    const devicesSnapshot = await db.collection('paymentDevices').get();
    const uniqueDevices = devicesSnapshot.size;
    
    res.json({
      totalPayments,
      totalRevenue: `£${totalRevenue.toFixed(2)}`,
      uniqueDevices,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting payment stats:', error);
    res.status(500).json({ error: 'Failed to get payment stats' });
  }
});

// List paid users (for debugging)
app.get('/api/paid-users', async (req, res) => {
  res.json(paidUsers);
});

// Start server
const PORT = process.env.PORT || 3001;
loadPaidUsers().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Enhanced payment backend running on port ${PORT}`);
    console.log(`🔒 Fraud prevention: ${firebaseAdmin ? 'Enabled' : 'Disabled'}`);
    console.log(`💳 Stripe integration: ${stripe ? 'Enabled' : 'Disabled'}`);
  });
});

// Environment variables needed:
// STRIPE_SECRET_KEY=sk_test_... (your Stripe secret key)
// STRIPE_WEBHOOK_SECRET=whsec_... (your webhook secret)
// FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...} (your Firebase service account JSON)
// NODE_ENV=production (or development)

module.exports = app;      
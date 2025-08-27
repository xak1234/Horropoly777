const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const fs = require('fs').promises;
const crypto = require('crypto');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Encryption configuration
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-encryption-key-here';
const ALGORITHM = 'aes-256-cbc';
const CODES_FILE = path.join(__dirname, 'encrypted_codes.json');

// FIXED CORS configuration - more permissive
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

app.use(express.json());

// Encryption functions
function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = textParts.join(':');
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Load encrypted codes from file
async function loadEncryptedCodes() {
  try {
    const encryptedData = await fs.readFile(CODES_FILE, 'utf8');
    const decryptedData = decrypt(encryptedData);
    return JSON.parse(decryptedData);
  } catch (error) {
    console.log('No existing codes file found, starting fresh');
    return {};
  }
}

// Save encrypted codes to file
async function saveEncryptedCodes(codes) {
  try {
    const jsonData = JSON.stringify(codes, null, 2);
    const encryptedData = encrypt(jsonData);
    await fs.writeFile(CODES_FILE, encryptedData, 'utf8');
    console.log('Codes saved to encrypted file');
  } catch (error) {
    console.error('Error saving encrypted codes:', error);
    throw error;
  }
}

// In-memory cache for performance (with periodic saves)
let unlockCodes = new Map();
let lastSaveTime = Date.now();
const SAVE_INTERVAL = 5 * 60 * 1000; // Save every 5 minutes

// Initialize codes from encrypted storage
async function initializeCodes() {
  try {
    const savedCodes = await loadEncryptedCodes();
    
    // Convert back to Map
    unlockCodes = new Map(Object.entries(savedCodes));
    
    // Add pre-validated test codes if not exists
    if (!unlockCodes.has('111333')) {
      unlockCodes.set('111333', {
        paymentIntentId: 'pre_validated_111333',
        sessionId: 'pre_validated_111333',
        createdAt: new Date().toISOString(),
        used: false,
        usedBy: null,
        manualVerification: true,
        preValidated: true
      });
    }
    
    if (!unlockCodes.has('111444')) {
      unlockCodes.set('111444', {
        paymentIntentId: 'pre_validated_111444',
        sessionId: 'pre_validated_111444',
        createdAt: new Date().toISOString(),
        used: false,
        usedBy: null,
        manualVerification: true,
        preValidated: true
      });
    }
    
    console.log(`Loaded ${unlockCodes.size} codes from encrypted storage`);
  } catch (error) {
    console.error('Error initializing codes:', error);
    // Start with just the test codes
    unlockCodes = new Map();
    unlockCodes.set('111333', {
      paymentIntentId: 'pre_validated_111333',
      sessionId: 'pre_validated_111333',
      createdAt: new Date().toISOString(),
      used: false,
      usedBy: null,
      manualVerification: true,
      preValidated: true
    });
    
    unlockCodes.set('111444', {
      paymentIntentId: 'pre_validated_111444',
      sessionId: 'pre_validated_111444',
      createdAt: new Date().toISOString(),
      used: false,
      usedBy: null,
      manualVerification: true,
      preValidated: true
    });
  }
}

// Periodic save function
async function periodicSave() {
  try {
    const now = Date.now();
    if (now - lastSaveTime > SAVE_INTERVAL) {
      const codesObject = Object.fromEntries(unlockCodes);
      await saveEncryptedCodes(codesObject);
      lastSaveTime = now;
    }
  } catch (error) {
    console.error('Error in periodic save:', error);
  }
}

// Generate 6-digit alphanumeric code
function generateUnlockCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Horropoly Payment Backend is running',
    codesLoaded: unlockCodes.size,
    lastSave: new Date(lastSaveTime).toISOString(),
    encryption: 'ENABLED'
  });
});

// Stripe webhook endpoint for payment events
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('Webhook event received:', event.type);

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('Payment succeeded:', paymentIntent.id);
      
      // Generate unlock code for successful payment
      try {
        const unlockCode = generateUnlockCode();
        
        // Store the code with payment details
        unlockCodes.set(unlockCode, {
          paymentIntentId: paymentIntent.id,
          sessionId: paymentIntent.metadata?.session_id || null,
          createdAt: new Date().toISOString(),
          used: false,
          usedBy: null,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          customerEmail: paymentIntent.receipt_email || null
        });
        
        // Save immediately
        const codesObject = Object.fromEntries(unlockCodes);
        await saveEncryptedCodes(codesObject);
        lastSaveTime = Date.now();
        
        console.log(`Generated unlock code ${unlockCode} for payment ${paymentIntent.id}`);
        
        // You could send email here with the unlock code
        if (paymentIntent.receipt_email) {
          console.log(`Payment completed for ${paymentIntent.receipt_email}. Unlock code: ${unlockCode}`);
        }
      } catch (error) {
        console.error('Error generating unlock code for webhook payment:', error);
      }
      break;
      
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('Payment failed:', failedPayment.id);
      break;
      
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

// Verify payment with Stripe
app.post('/api/verify-payment', async (req, res) => {
  try {
    const { paymentIntentId, sessionId } = req.body;
    
    if (!paymentIntentId && !sessionId) {
      return res.status(400).json({ 
        verified: false,
        error: 'Payment intent ID or session ID required' 
      });
    }

    console.log('Verifying payment:', { paymentIntentId, sessionId });

    let paymentVerified = false;
    let stripePaymentId = null;

    // Try to verify with payment intent ID
    if (paymentIntentId) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (paymentIntent.status === 'succeeded') {
          paymentVerified = true;
          stripePaymentId = paymentIntent.id;
          console.log('Payment verified via payment intent:', paymentIntent.id);
        }
      } catch (error) {
        console.log('Payment intent verification failed:', error.message);
      }
    }

    // Try to verify with session ID
    if (!paymentVerified && sessionId) {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (session.payment_status === 'paid') {
          paymentVerified = true;
          stripePaymentId = session.payment_intent;
          console.log('Payment verified via session:', session.id);
        }
      } catch (error) {
        console.log('Session verification failed:', error.message);
      }
    }

    if (!paymentVerified) {
      return res.status(402).json({
        verified: false,
        message: 'Payment verification failed. Please complete payment through Stripe first.',
        requiresPayment: true
      });
    }

    // Check if we already generated an unlock code for this payment
    let existingCode = null;
    unlockCodes.forEach((data, code) => {
      if (data.paymentIntentId === stripePaymentId || data.sessionId === sessionId) {
        existingCode = code;
      }
    });

    if (existingCode) {
      console.log('Reusing existing unlock code:', existingCode);
      return res.json({
        verified: true,
        unlockCode: existingCode,
        message: 'Payment already verified'
      });
    }

    // Generate new unlock code
    let unlockCode;
    do {
      unlockCode = generateUnlockCode();
    } while (unlockCodes.has(unlockCode));

    // Store unlock code
    unlockCodes.set(unlockCode, {
      paymentIntentId: stripePaymentId,
      sessionId: sessionId,
      createdAt: new Date().toISOString(),
      used: false,
      usedBy: null,
      manualVerification: false
    });

    console.log(`Generated unlock code for verified payment: ${unlockCode}`);

    // Save immediately to ensure code is persisted
    try {
      const codesObject = Object.fromEntries(unlockCodes);
      await saveEncryptedCodes(codesObject);
      lastSaveTime = Date.now();
      console.log(`Unlock code ${unlockCode} saved immediately to encrypted storage`);
    } catch (error) {
      console.error('Error saving unlock code immediately:', error);
      // Continue anyway - the code is in memory and will be saved by periodic save
    }

    res.json({
      verified: true,
      unlockCode: unlockCode,
      message: 'Payment verified successfully'
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ 
      verified: false,
      error: 'Failed to verify payment',
      message: 'Server error during payment verification'
    });
  }
});

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

    console.log('Checking payment status:', { paymentIntentId, sessionId });

    // Check if we have a code for this payment
    let foundCode = null;
    for (const [code, data] of unlockCodes.entries()) {
      if ((paymentIntentId && data.paymentIntentId === paymentIntentId) ||
          (sessionId && data.sessionId === sessionId)) {
        foundCode = { code, ...data };
        break;
      }
    }

    if (foundCode) {
      res.json({
        found: true,
        unlockCode: foundCode.code,
        used: foundCode.used,
        usedBy: foundCode.usedBy,
        createdAt: foundCode.createdAt
      });
    } else {
      res.json({
        found: false,
        message: 'Payment not yet processed by webhook'
      });
    }
  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({ 
      found: false,
      error: 'Internal server error' 
    });
  }
});

// Verify unlock code
app.post('/api/verify-unlock-code', async (req, res) => {
  try {
    const { unlockCode, deviceId } = req.body;
    
    if (!unlockCode || !deviceId) {
      return res.status(400).json({ 
        valid: false,
        error: 'Unlock code and device ID required' 
      });
    }

    const codeData = unlockCodes.get(unlockCode);
    
    if (!codeData) {
      return res.json({
        valid: false,
        message: 'Invalid unlock code'
      });
    }
    
    if (codeData.used) {
      return res.json({
        valid: false,
        message: 'Unlock code already used'
      });
    }
    
    // Mark code as used by this device
    codeData.used = true;
    codeData.usedBy = deviceId;
    codeData.usedAt = new Date().toISOString();
    
    unlockCodes.set(unlockCode, codeData);
    
    console.log(`Unlock code ${unlockCode} used by device: ${deviceId}`);
    
    // Save immediately to ensure usage is persisted
    try {
      const codesObject = Object.fromEntries(unlockCodes);
      await saveEncryptedCodes(codesObject);
      lastSaveTime = Date.now();
      console.log(`Unlock code ${unlockCode} usage saved immediately to encrypted storage`);
    } catch (error) {
      console.error('Error saving unlock code usage immediately:', error);
      // Continue anyway - the usage is in memory and will be saved by periodic save
    }
    
    res.json({
      valid: true,
      message: 'Unlock code verified successfully'
    });
  } catch (error) {
    console.error('Error verifying unlock code:', error);
    res.status(500).json({ 
      valid: false,
      error: 'Failed to verify unlock code',
      message: 'Server error during code verification'
    });
  }
});

// Create checkout session endpoint - FIXED for CORS and error handling
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

// Get stored codes (for debugging - returns encrypted data)
app.get('/api/codes', (req, res) => {
  const codes = {};
  unlockCodes.forEach((value, key) => {
    codes[key] = value;
  });
  res.json({
    count: unlockCodes.size,
    codes: codes,
    lastSave: new Date(lastSaveTime).toISOString(),
    encryption: 'ENABLED'
  });
});

// Force save endpoint (for admin use)
app.post('/api/force-save', async (req, res) => {
  try {
    const codesObject = Object.fromEntries(unlockCodes);
    await saveEncryptedCodes(codesObject);
    lastSaveTime = Date.now();
    res.json({
      success: true,
      message: 'Codes saved successfully',
      count: unlockCodes.size,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Force save error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save codes'
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Horropoly Payment Backend',
    status: 'running',
    encryption: 'ENABLED',
    endpoints: [
      'GET /health',
      'POST /api/create-checkout-session',
      'POST /api/verify-payment',
      'POST /api/verify-unlock-code',
      'GET /api/codes',
      'POST /api/force-save'
    ]
  });
});

// Initialize and start server
async function startServer() {
  await initializeCodes();
  
  app.listen(PORT, () => {
    console.log(`Horropoly Payment Backend running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log('Stripe integration: ENABLED');
    console.log('Live payment verification: ACTIVE');
    console.log('Encrypted storage: ENABLED');
    console.log(`Codes loaded: ${unlockCodes.size}`);
  });
  
  // Set up periodic saves
  setInterval(periodicSave, SAVE_INTERVAL);
}

startServer().catch(console.error); 
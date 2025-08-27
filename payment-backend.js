const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_51OvK8qFBa4Ju7Uz0Kvfbq0j');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['https://horropoly.com', 'http://localhost:8080', 'http://127.0.0.1:8080'],
  credentials: true
}));
app.use(express.json());

// In-memory storage for unlock codes (in production, use a database)
const unlockCodes = new Map();

// Generate 6-digit alphanumeric code
function generateUnlockCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create payment intent
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 199, // £1.99 in pence
      currency: 'gbp',
      metadata: {
        integration_check: 'accept_a_payment',
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Verify payment and generate unlock code
app.post('/api/verify-payment', async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    
    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment intent ID required' });
    }

    console.log('Verifying payment with ID:', paymentIntentId);

    // Handle manual verification
    if (paymentIntentId.startsWith('manual_verification_')) {
      console.log('Manual verification requested');
      
      // Generate unique unlock code for manual verification
      let unlockCode;
      do {
        unlockCode = generateUnlockCode();
      } while (unlockCodes.has(unlockCode));
      
      // Store unlock code with manual verification info
      unlockCodes.set(unlockCode, {
        paymentIntentId: paymentIntentId,
        sessionId: paymentIntentId,
        createdAt: new Date().toISOString(),
        used: false,
        usedBy: null,
        manualVerification: true
      });
      
      console.log(`Generated unlock code for manual verification: ${unlockCode}`);
      
      return res.json({
        verified: true,
        unlockCode: unlockCode,
        message: 'Manual verification successful'
      });
    }

    // For Stripe payment links, we need to retrieve the session first
    let paymentIntent;
    
    try {
      // Try to retrieve as payment intent first
      paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      console.log('Retrieved as payment intent:', paymentIntent.status);
    } catch (error) {
      console.log('Not a payment intent, trying as checkout session...');
      // If that fails, try to retrieve as checkout session
      try {
        const session = await stripe.checkout.sessions.retrieve(paymentIntentId);
        console.log('Retrieved as checkout session:', session.payment_status);
        
        if (session.payment_intent) {
          paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
          console.log('Retrieved payment intent from session:', paymentIntent.status);
        } else if (session.payment_status === 'paid') {
          // Session is paid but no payment intent (some payment methods)
          console.log('Session is paid, generating unlock code');
          
          let unlockCode;
          do {
            unlockCode = generateUnlockCode();
          } while (unlockCodes.has(unlockCode));
          
          unlockCodes.set(unlockCode, {
            sessionId: paymentIntentId,
            createdAt: new Date().toISOString(),
            used: false,
            usedBy: null
          });
          
          console.log(`Generated unlock code for paid session: ${unlockCode}`);
          
          return res.json({
            verified: true,
            unlockCode: unlockCode,
            message: 'Payment verified successfully'
          });
        } else {
          return res.json({
            verified: false,
            message: 'Payment session not completed'
          });
        }
      } catch (sessionError) {
        console.error('Error retrieving session:', sessionError);
        return res.json({
          verified: false,
          message: 'Invalid payment ID'
        });
      }
    }
    
    if (paymentIntent && paymentIntent.status === 'succeeded') {
      // Generate unique unlock code
      let unlockCode;
      do {
        unlockCode = generateUnlockCode();
      } while (unlockCodes.has(unlockCode)); // Ensure uniqueness
      
      // Store unlock code with payment info
      unlockCodes.set(unlockCode, {
        paymentIntentId: paymentIntent.id,
        sessionId: paymentIntentId,
        createdAt: new Date().toISOString(),
        used: false,
        usedBy: null
      });
      
      console.log(`Generated unlock code: ${unlockCode} for payment: ${paymentIntent.id}`);
      
      res.json({
        verified: true,
        unlockCode: unlockCode,
        message: 'Payment verified successfully'
      });
    } else {
      res.json({
        verified: false,
        message: 'Payment not completed'
      });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// Verify unlock code
app.post('/api/verify-unlock-code', async (req, res) => {
  try {
    const { unlockCode, deviceId } = req.body;
    
    if (!unlockCode || !deviceId) {
      return res.status(400).json({ error: 'Unlock code and device ID required' });
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
    
    res.json({
      valid: true,
      message: 'Unlock code verified successfully'
    });
  } catch (error) {
    console.error('Error verifying unlock code:', error);
    res.status(500).json({ error: 'Failed to verify unlock code' });
  }
});

// Stripe webhook endpoint
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_secret';

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('Payment completed for session:', session.id);
      
      // Generate unlock code for completed payment
      if (session.payment_status === 'paid') {
        let unlockCode;
        do {
          unlockCode = generateUnlockCode();
        } while (unlockCodes.has(unlockCode));
        
        unlockCodes.set(unlockCode, {
          sessionId: session.id,
          paymentIntentId: session.payment_intent,
          createdAt: new Date().toISOString(),
          used: false,
          usedBy: null
        });
        
        console.log(`Generated unlock code: ${unlockCode} for session: ${session.id}`);
      }
      break;
      
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Get stored codes (for debugging)
app.get('/api/codes', (req, res) => {
  const codes = {};
  unlockCodes.forEach((value, key) => {
    codes[key] = value;
  });
  res.json(codes);
});

app.listen(PORT, () => {
  console.log(`Payment backend server running on port ${PORT}`);
}); 
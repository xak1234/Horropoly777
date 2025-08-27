// ==== Payment Verification Backend (Node.js + Express) ====
// This file should be implemented on your backend server

const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
// Render-specific configuration
const isProduction = process.env.NODE_ENV === 'production';

// CORS configuration for Render
app.use(cors({
  origin: isProduction 
    ? ['https://horropoly.com', 'https://www.horropoly.com'] // Your domain
    : ['http://localhost:3000', 'http://localhost:5000', 'http://127.0.0.1:5500'],
  credentials: true
}));
app.use(express.json());

// Payment verification endpoint
app.post('/api/verify-payment', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }
    
    // Verify the Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status === 'paid' && session.status === 'complete') {
      // Payment is valid
      res.json({ 
        verified: true, 
        amount: session.amount_total,
        currency: session.currency,
        customer: session.customer
      });
    } else {
      // Payment not completed
      res.json({ verified: false });
    }
    
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

// Webhook endpoint for Stripe events
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
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
      console.log('Payment completed:', session.id);
      
      // Here you can:
      // 1. Update your database
      // 2. Send confirmation email
      // 3. Grant access to user
      // 4. Record payment in Firebase
      
      break;
      
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('Payment succeeded:', paymentIntent.id);
      break;
      
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
  
  res.json({ received: true });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Payment verification server running on port ${PORT}`);
});

// ==== Environment Variables Needed ====
// STRIPE_SECRET_KEY=sk_test_... (your Stripe secret key)
// STRIPE_WEBHOOK_SECRET=whsec_... (your webhook secret)

// ==== Setup Instructions ====
// 1. Install dependencies: npm install express cors stripe
// 2. Set environment variables
// 3. Configure Stripe webhook endpoint in your Stripe dashboard
// 4. Deploy this backend to your server
// 5. Update the frontend API URL to point to your backend 
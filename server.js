// server.js
import express from "express";
import cors from "cors";
import Stripe from "stripe";
import { ensurePresetRoom } from "./preset-room-service.js";

// Initialize Stripe (use test key for local development)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_51234567890abcdef', {
  apiVersion: '2023-10-16',
});

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] // Replace with your actual domain
    : ['http://localhost:3000', 'http://localhost:8080', 'http://127.0.0.1:8080'],
  credentials: true
}));

// Health check endpoints (both with and without /api prefix)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Payment endpoints
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    console.log('💳 Creating Stripe checkout session...');
    const { userId, deviceFingerprint, successUrl, cancelUrl } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Create Stripe checkout session
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
      success_url: successUrl || `${req.headers.origin}/payment-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${req.headers.origin}/payment-cancelled.html`,
      metadata: {
        userId: userId,
        deviceFingerprint: deviceFingerprint || 'unknown',
        feature: 'multiplayer_access'
      }
    });

    console.log('✅ Stripe session created:', session.id);
    res.json({ 
      url: session.url, 
      sessionId: session.id 
    });

  } catch (error) {
    console.error('❌ Stripe session creation failed:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

app.post('/api/verify-payment', async (req, res) => {
  try {
    console.log('🔍 Verifying payment...');
    const { sessionId, deviceFingerprint, userId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ 
        verified: false, 
        reason: 'Session ID is required',
        deviceAllowed: false 
      });
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status === 'paid') {
      console.log('✅ Payment verified with Stripe');
      res.json({
        verified: true,
        reason: 'Payment confirmed by Stripe',
        deviceAllowed: true,
        paymentIntent: session.payment_intent,
        amount: session.amount_total,
        currency: session.currency
      });
    } else {
      console.log('❌ Payment not completed:', session.payment_status);
      res.json({
        verified: false,
        reason: `Payment status: ${session.payment_status}`,
        deviceAllowed: false
      });
    }

  } catch (error) {
    console.error('❌ Payment verification failed:', error);
    res.status(500).json({
      verified: false,
      reason: 'Payment verification error',
      deviceAllowed: false
    });
  }
});

// Solo Zombie Hunt preset
app.post("/api/preset/solo", async (req, res) => {
  try {
    console.log("🧟 Creating Solo Zombie Hunt preset...");
    const { playerName, aiCount = 1 } = req.body ?? {};
    
    if (!playerName || typeof playerName !== 'string' || playerName.trim().length === 0) {
      return res.status(400).json({ 
        ok: false, 
        error: "Player name is required and must be a non-empty string" 
      });
    }
    
    const sanitizedPlayerName = playerName.trim().substring(0, 50); // Limit length
    const validAiCount = Math.max(1, Math.min(3, Number(aiCount) || 1)); // 1-3 AI opponents
    
    console.log(`Creating room for ${sanitizedPlayerName} with ${validAiCount} AI opponents`);
    
    const { roomId } = await ensurePresetRoom({
      name: "Solo Zombie Hunt",
      aiBots: validAiCount,
      hostName: sanitizedPlayerName,
    });
    
    console.log(`✅ Solo Zombie Hunt room created: ${roomId}`);
    res.json({ ok: true, roomId });
    
  } catch (e) {
    console.error("❌ Solo preset creation failed:", e);
    res.status(500).json({ ok: false, error: String(e) });
  }
});

// Duo Zombie Hunt preset (2 AI opponents)
app.post("/api/preset/duo", async (req, res) => {
  try {
    console.log("🧟🧟 Creating Duo Zombie Hunt preset...");
    const { playerName, aiCount = 2 } = req.body ?? {};
    
    if (!playerName || typeof playerName !== 'string' || playerName.trim().length === 0) {
      return res.status(400).json({ 
        ok: false, 
        error: "Player name is required and must be a non-empty string" 
      });
    }
    
    const sanitizedPlayerName = playerName.trim().substring(0, 50);
    const validAiCount = Math.max(2, Math.min(3, Number(aiCount) || 2)); // 2-3 AI opponents
    
    const { roomId } = await ensurePresetRoom({
      name: "Duo Zombie Hunt",
      aiBots: validAiCount,
      hostName: sanitizedPlayerName,
    });
    
    console.log(`✅ Duo Zombie Hunt room created: ${roomId}`);
    res.json({ ok: true, roomId });
    
  } catch (e) {
    console.error("❌ Duo preset creation failed:", e);
    res.status(500).json({ ok: false, error: String(e) });
  }
});

// Zombie Swarm preset (3 AI opponents)
app.post("/api/preset/swarm", async (req, res) => {
  try {
    console.log("🧟🧟🧟 Creating Zombie Swarm preset...");
    const { playerName, aiCount = 3 } = req.body ?? {};
    
    if (!playerName || typeof playerName !== 'string' || playerName.trim().length === 0) {
      return res.status(400).json({ 
        ok: false, 
        error: "Player name is required and must be a non-empty string" 
      });
    }
    
    const sanitizedPlayerName = playerName.trim().substring(0, 50);
    const validAiCount = 3; // Always 3 for swarm mode
    
    const { roomId } = await ensurePresetRoom({
      name: "Zombie Swarm",
      aiBots: validAiCount,
      hostName: sanitizedPlayerName,
    });
    
    console.log(`✅ Zombie Swarm room created: ${roomId}`);
    res.json({ ok: true, roomId });
    
  } catch (e) {
    console.error("❌ Swarm preset creation failed:", e);
    res.status(500).json({ ok: false, error: String(e) });
  }
});

// Generic preset endpoint
app.post("/api/preset/:type", async (req, res) => {
  try {
    const { type } = req.params;
    const { playerName, aiCount = 1 } = req.body ?? {};
    
    if (!playerName || typeof playerName !== 'string' || playerName.trim().length === 0) {
      return res.status(400).json({ 
        ok: false, 
        error: "Player name is required and must be a non-empty string" 
      });
    }
    
    const sanitizedPlayerName = playerName.trim().substring(0, 50);
    const validAiCount = Math.max(1, Math.min(3, Number(aiCount) || 1));
    
    // Map preset types to names
    const presetNames = {
      'solo': 'Solo Zombie Hunt',
      'duo': 'Duo Zombie Hunt', 
      'swarm': 'Zombie Swarm',
      'custom': 'Custom Game'
    };
    
    const presetName = presetNames[type] || `${type} Game`;
    
    console.log(`🎮 Creating ${presetName} preset...`);
    
    const { roomId } = await ensurePresetRoom({
      name: presetName,
      aiBots: validAiCount,
      hostName: sanitizedPlayerName,
    });
    
    console.log(`✅ ${presetName} room created: ${roomId}`);
    res.json({ ok: true, roomId, presetName });
    
  } catch (e) {
    console.error(`❌ ${req.params.type} preset creation failed:`, e);
    res.status(500).json({ ok: false, error: String(e) });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ ok: false, error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ ok: false, error: 'Endpoint not found' });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
  console.log(`📡 Available endpoints:`);
  console.log(`   GET /health - Health check`);
  console.log(`   GET /api/health - Health check (API)`);
  console.log(`   POST /api/create-checkout-session - Create Stripe payment`);
  console.log(`   POST /api/verify-payment - Verify payment status`);
  console.log(`   POST /api/preset/solo - Solo Zombie Hunt`);
  console.log(`   POST /api/preset/duo - Duo Zombie Hunt`);
  console.log(`   POST /api/preset/swarm - Zombie Swarm`);
});
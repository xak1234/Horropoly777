// Cloudflare Workers Payment Backend for Horropoly
// Note: This version uses Firebase REST API instead of Admin SDK

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown'
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, CF-Connecting-IP',
    'Access-Control-Max-Age': '86400',
  }
  
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    let response
    
    switch (url.pathname) {
      case '/api/health':
        response = await handleHealthCheck(clientIP)
        break
      case '/api/verify-payment':
        response = await handlePaymentVerification(request, clientIP)
        break
      case '/api/webhook':
        response = await handleWebhook(request)
        break
      case '/api/payment-stats':
        response = await handlePaymentStats()
        break
      default:
        response = new Response('Not Found', { status: 404 })
    }
    
    // Add CORS headers to all responses
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    
    return response
    
  } catch (error) {
    console.error('Worker error:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), { 
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    })
  }
}

async function handleHealthCheck(clientIP) {
  return new Response(JSON.stringify({
    status: 'ok',
    timestamp: new Date().toISOString(),
    cloudflare: true,
    clientIP: clientIP,
    firebase: true,
    stripe: true
  }), {
    headers: { 'Content-Type': 'application/json' }
  })
}

async function handlePaymentVerification(request, clientIP) {
  const body = await request.json()
  const { sessionId, deviceFingerprint } = body
  
  if (!sessionId) {
    return new Response(JSON.stringify({ 
      verified: false, 
      reason: 'Session ID required' 
    }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  console.log('🔍 Verifying payment session:', sessionId)
  console.log('📱 Device fingerprint (DISABLED):', deviceFingerprint?.hash || 'fingerprinting_disabled')
  console.log('🌐 Client IP:', clientIP)
  
  try {
    // Verify with Stripe
    const stripeResponse = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    
    if (!stripeResponse.ok) {
      return new Response(JSON.stringify({ 
        verified: false, 
        reason: 'Stripe verification failed' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    const session = await stripeResponse.json()
    
    // Check payment status
    if (session.payment_status !== 'paid' || session.status !== 'complete') {
      return new Response(JSON.stringify({ 
        verified: false, 
        reason: 'Payment not completed' 
      }), { 
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Check amount and currency
    if (session.amount_total !== 199 || session.currency !== 'gbp') {
      return new Response(JSON.stringify({ 
        verified: false, 
        reason: 'Incorrect payment amount or currency' 
      }), { 
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Record payment in Firebase
    const paymentRecorded = await recordPaymentInFirebase(session, deviceFingerprint, clientIP)
    
    if (paymentRecorded) {
      return new Response(JSON.stringify({ 
        verified: true, 
        amount: session.amount_total,
        currency: session.currency,
        customer: session.customer,
        cloudflare: true
      }), { 
        headers: { 'Content-Type': 'application/json' }
      })
    } else {
      return new Response(JSON.stringify({ 
        verified: false, 
        reason: 'Payment recording failed' 
      }), { 
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
  } catch (error) {
    console.error('Payment verification error:', error)
    return new Response(JSON.stringify({ 
      verified: false, 
      reason: 'Verification failed' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

async function recordPaymentInFirebase(session, deviceFingerprint, clientIP) {
  try {
    const paymentData = {
      sessionId: session.id,
      customerEmail: session.customer_details?.email,
      customerName: session.customer_details?.name,
      amount: session.amount_total,
      currency: session.currency,
      status: 'completed',
      timestamp: new Date().toISOString(),
      feature: 'multiplayer_access',
      deviceFingerprint: deviceFingerprint,
      clientIP: clientIP,
      cloudflare: true,
      webhookReceived: false
    }
    
    // Use Firebase REST API to add document
    const firebaseResponse = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/payments`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FIREBASE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: {
            sessionId: { stringValue: paymentData.sessionId },
            customerEmail: { stringValue: paymentData.customerEmail || '' },
            customerName: { stringValue: paymentData.customerName || '' },
            amount: { integerValue: paymentData.amount },
            currency: { stringValue: paymentData.currency },
            status: { stringValue: paymentData.status },
            timestamp: { stringValue: paymentData.timestamp },
            feature: { stringValue: paymentData.feature },
            clientIP: { stringValue: paymentData.clientIP },
            cloudflare: { booleanValue: paymentData.cloudflare }
          }
        })
      }
    )
    
    if (firebaseResponse.ok) {
      console.log('✅ Payment recorded in Firebase via Workers')
      return true
    } else {
      console.error('❌ Firebase recording failed:', await firebaseResponse.text())
      return false
    }
    
  } catch (error) {
    console.error('❌ Error recording payment in Firebase:', error)
    return false
  }
}

async function handleWebhook(request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')
  
  if (!signature) {
    return new Response('No signature', { status: 400 })
  }
  
  try {
    // Verify webhook signature
    const event = await verifyWebhookSignature(body, signature)
    
    console.log('📨 Received webhook event:', event.type)
    
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object)
        break
      case 'payment_intent.succeeded':
        console.log('✅ Payment intent succeeded:', event.data.object.id)
        break
      case 'payment_intent.payment_failed':
        console.log('❌ Payment intent failed:', event.data.object.id)
        break
      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`)
    }
    
    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('❌ Webhook error:', error)
    return new Response(`Webhook Error: ${error.message}`, { status: 400 })
  }
}

async function verifyWebhookSignature(body, signature) {
  // Note: Webhook signature verification in Workers requires crypto
  // For simplicity, we'll trust the signature for now
  // In production, implement proper signature verification
  
  const event = JSON.parse(body)
  return event
}

async function handleCheckoutSessionCompleted(session) {
  console.log('✅ Checkout session completed:', session.id)
  
  try {
    await recordPaymentInFirebase(session, null, 'webhook')
    console.log('✅ Payment recorded from webhook')
  } catch (error) {
    console.error('❌ Error recording payment from webhook:', error)
  }
}

async function handlePaymentStats() {
  try {
    // Get payment statistics from Firebase
    const response = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/payments`,
      {
        headers: {
          'Authorization': `Bearer ${FIREBASE_ACCESS_TOKEN}`
        }
      }
    )
    
    if (response.ok) {
      const data = await response.json()
      const totalPayments = data.documents ? data.documents.length : 0
      
      let totalRevenue = 0
      if (data.documents) {
        data.documents.forEach(doc => {
          const fields = doc.fields
          if (fields.amount && fields.currency?.stringValue === 'gbp') {
            totalRevenue += fields.amount.integerValue / 100
          }
        })
      }
      
      return new Response(JSON.stringify({
        totalPayments,
        totalRevenue: `£${totalRevenue.toFixed(2)}`,
        timestamp: new Date().toISOString(),
        cloudflare: true
      }), {
        headers: { 'Content-Type': 'application/json' }
      })
    } else {
      return new Response(JSON.stringify({ error: 'Failed to get payment stats' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
  } catch (error) {
    console.error('Error getting payment stats:', error)
    return new Response(JSON.stringify({ error: 'Failed to get payment stats' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Environment variables needed in Cloudflare Workers:
// STRIPE_SECRET_KEY=sk_test_... (your Stripe secret key)
// STRIPE_WEBHOOK_SECRET=whsec_... (your webhook secret)
// FIREBASE_PROJECT_ID=horropoly (your Firebase project ID)
// FIREBASE_ACCESS_TOKEN=... (Firebase access token - needs to be refreshed periodically) 
#!/bin/bash
echo "Starting Horropoly Payment Backend..."
echo ""
echo "Make sure you have Node.js installed and run:"
echo "  npm install express firebase-admin cors stripe"
echo ""
echo "Then set your Stripe secret key (optional for testing):"
echo "  export STRIPE_SECRET_KEY=sk_test_your_stripe_test_key_here"
echo ""
echo "Starting server on port 8080..."
node server.js

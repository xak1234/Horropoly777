# 🔧 Backend Deployment Guide - Horropoly Payment System

## 🚀 Quick Deploy to Render

### Step 1: Prepare Your Repository

1. **Ensure these files are in your repository root:**
   - `enhanced-payment-backend.js` ✅
   - `package.json` ✅
   - `package-lock.json` ✅

### Step 2: Deploy to Render

1. **Go to [Render Dashboard](https://dashboard.render.com)**
2. **Click "New +" → "Web Service"**
3. **Connect your GitHub repository**
4. **Configure the service:**

   **Basic Settings:**
   - **Name**: `horropoly-payment-backend`
   - **Environment**: `Node`
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: Leave empty (if files are in root)

   **Build & Deploy:**
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or choose paid if needed)

### Step 3: Set Environment Variables

**In Render Dashboard → Your Service → Environment:**

```
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"horropoly","private_key_id":"YOUR_PRIVATE_KEY_ID","private_key":"-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-fbsvc@horropoly.iam.gserviceaccount.com","client_id":"YOUR_CLIENT_ID","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40horropoly.iam.gserviceaccount.com"}
NODE_ENV=production
PORT=3001
```

### Step 4: Get Your Firebase Service Account Key

1. **Go to [Firebase Console](https://console.firebase.google.com/)**
2. **Select your "horropoly" project**
3. **Go to Project Settings → Service Accounts**
4. **Click "Generate new private key"**
5. **Download the JSON file**
6. **Copy the entire JSON content**
7. **Replace the `FIREBASE_SERVICE_ACCOUNT` value with your actual JSON**

### Step 5: Get Your Stripe Keys

1. **Go to [Stripe Dashboard](https://dashboard.stripe.com/)**
2. **Go to Developers → API Keys**
3. **Copy your Secret Key (starts with `sk_test_` or `sk_live_`)**
4. **Replace `STRIPE_SECRET_KEY` value**

### Step 6: Test the Deployment

1. **Wait for deployment to complete (usually 2-3 minutes)**
2. **Test the health endpoint:**
   ```bash
   curl https://horropoly-payment-backend.onrender.com/api/health
   ```
3. **Expected response:**
   ```json
   {"status":"ok","timestamp":"2025-07-19T16:30:28.120Z"}
   ```

## 🔍 Troubleshooting

### Issue: JSON Parse Error
**Symptoms:** `SyntaxError: Expected property name or '}' in JSON at position 1`

**Solution:**
1. Check that your `FIREBASE_SERVICE_ACCOUNT` environment variable is valid JSON
2. Make sure there are no extra quotes or escaping issues
3. Test your JSON in a JSON validator

### Issue: Backend Not Responding
**Symptoms:** `Cannot GET /` or connection timeout

**Solution:**
1. Check Render logs for errors
2. Ensure `package.json` has correct `main` and `start` script
3. Verify all dependencies are installed

### Issue: CORS Errors
**Symptoms:** `CORS/Network error - backend API not accessible`

**Solution:**
1. Check that your domain is in the CORS origins list
2. Verify the backend URL is correct
3. Check Render logs for CORS configuration

## 📋 Verification Checklist

- [ ] Backend deployed to Render
- [ ] Health endpoint responds: `{"status":"ok"}`
- [ ] Environment variables set correctly
- [ ] Firebase service account key configured
- [ ] Stripe secret key configured
- [ ] CORS allows your domain
- [ ] Payment verification endpoint works

## 🧪 Testing Commands

```bash
# Test health
curl https://horropoly-payment-backend.onrender.com/api/health

# Test payment verification (should fail with test data)
curl -X POST https://horropoly-payment-backend.onrender.com/api/verify-payment \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test","deviceFingerprint":{"hash":"test"},"userId":"test"}'

# Test payment stats
curl https://horropoly-payment-backend.onrender.com/api/payment-stats
```

## 🎯 Expected Results

**Health Check:**
```json
{"status":"ok","timestamp":"2025-07-19T16:30:28.120Z"}
```

**Payment Verification (invalid session):**
```json
{"verified":false,"reason":"Payment not completed"}
```

**Payment Stats:**
```json
{"totalPayments":0,"totalRevenue":0,"activeDevices":0}
```

## 🚨 Common Issues

1. **Environment Variables Not Set**: Check Render dashboard
2. **Firebase JSON Invalid**: Validate JSON format
3. **Stripe Key Wrong**: Use correct test/live key
4. **CORS Issues**: Check domain in CORS configuration
5. **Port Issues**: Render sets PORT automatically

## 📞 Support

If you're still having issues:
1. Check Render logs in the dashboard
2. Verify all environment variables are set
3. Test with the provided test page: `test-backend.html`
4. Ensure your Firebase project is active and accessible

---

**Your Backend URL:** `https://horropoly-payment-backend.onrender.com`
**Firebase Service Account:** `firebase-adminsdk-fbsvc@horropoly.iam.gserviceaccount.com` 
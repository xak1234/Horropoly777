# 🚀 Render Backend Setup Guide

## 📋 **Current Status**
Your Render backend is failing because the `FIREBASE_SERVICE_ACCOUNT` environment variable is not set correctly.

## 🔧 **Step-by-Step Fix**

### **Step 1: Get Your Firebase Service Account Key**

1. **Go to Firebase Console:** https://console.firebase.google.com/
2. **Select your "horropoly" project**
3. **Click the gear icon ⚙️ → Project settings**
4. **Go to "Service accounts" tab**
5. **Click "Generate new private key"**
6. **Download the JSON file**

### **Step 2: Extract the JSON Content**

1. **Open the downloaded JSON file** (should be named like `horropoly-firebase-adminsdk-xxxxx-xxxxxxxxxx.json`)
2. **Select all content** (Ctrl+A)
3. **Copy the entire JSON** (Ctrl+C)

### **Step 3: Set Environment Variables on Render**

1. **Go to Render Dashboard:** https://dashboard.render.com/
2. **Find your service:** `horropoly-payment-backend`
3. **Click on the service name**
4. **Go to "Environment" tab**
5. **Add/Edit these variables:**

#### **Required Environment Variables:**

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `FIREBASE_SERVICE_ACCOUNT` | `{paste the entire JSON here}` | Your Firebase service account JSON |
| `STRIPE_SECRET_KEY` | `sk_live_...` or `sk_test_...` | Your Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Your Stripe webhook secret |
| `NODE_ENV` | `production` | Set to production |

### **Step 4: Example Environment Variables**

Here's what your environment variables should look like:

```
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"horropoly","private_key_id":"abc123...","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-fbsvc@horropoly.iam.gserviceaccount.com","client_id":"123456789012345678901","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40horropoly.iam.gserviceaccount.com"}

STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key_here

STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

NODE_ENV=production
```

### **Step 5: Redeploy**

1. **After setting the environment variables, click "Save"**
2. **Render will automatically redeploy your service**
3. **Wait 2-3 minutes for deployment to complete**

### **Step 6: Test the Backend**

Once deployed, test these endpoints:

```bash
# Health check
curl https://horropoly-payment-backend.onrender.com/api/paid-users

# Payment stats (should work if Firebase is connected)
curl https://horropoly-payment-backend.onrender.com/api/payment-stats
```

## 🔍 **Expected Results**

### **✅ Success Indicators:**
- Backend responds to requests
- No more "Firebase Admin initialization failed" errors
- Payment sessions can be created
- Firebase fraud prevention works

### **❌ If Still Failing:**
- Check Render logs for specific error messages
- Verify the JSON format is correct (no extra spaces, proper quotes)
- Ensure all environment variables are set

## 🚨 **Common Issues & Solutions**

### **Issue: "Invalid PEM formatted message"**
**Solution:** The private key in your JSON might be corrupted. Generate a new service account key.

### **Issue: "Project not found"**
**Solution:** Make sure you're using the correct Firebase project (should be "horropoly").

### **Issue: "Permission denied"**
**Solution:** The service account might not have the right permissions. Go to Firebase Console → Project Settings → Service Accounts → Manage Service Account Permissions.

## 📞 **Need Help?**

If you're still having issues:

1. **Check Render logs** in the dashboard
2. **Verify your Firebase project ID** matches "horropoly"
3. **Ensure your Stripe keys are correct**
4. **Test with a simple environment variable first**

## 🎯 **Next Steps After Fix**

Once the backend is working:

1. **Test payment flow** on horropoly.com
2. **Verify Firebase integration** is working
3. **Check that fraud prevention** is enabled
4. **Monitor payment logs** for any issues

---

**Remember:** The backend needs to be working on Render for the production site to function properly! 
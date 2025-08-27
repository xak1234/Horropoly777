# 🚀 Render Deployment Guide - Live Payment Backend

## **Prerequisites**

1. **Stripe Account** with API keys
2. **Render Account** for hosting
3. **GitHub Repository** with your code

## **Step 1: Get API Keys**

### **Stripe API Key:**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Developers** → **API Keys**
3. Copy your **Secret Key** (starts with `sk_`)

### **Generate Encryption Key:**
Generate a secure 32-character encryption key:
```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```
Or use this online generator: [Random Key Generator](https://www.random.org/strings/?num=1&len=32&digits=on&upperalpha=on&loweralpha=off&unique=on&format=plain&rnd=new)

## **Step 2: Deploy to Render**

### **Option A: Deploy from GitHub**

1. **Push code to GitHub:**
   ```bash
   git add .
   git commit -m "Live payment backend with Stripe integration"
   git push origin main
   ```

2. **Create Render Service:**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click **New** → **Web Service**
   - Connect your GitHub repository
   - Select the repository

3. **Configure Service:**
   - **Name:** `horropoly-payment-backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free (or paid for better performance)

4. **Add Environment Variables:**
   - Click **Environment** tab
   - Add variable: `STRIPE_SECRET_KEY`
   - Value: Your Stripe secret key (starts with `sk_`)
   - Add variable: `ENCRYPTION_KEY`
   - Value: A secure 32-character encryption key (generate one below)

5. **Deploy:**
   - Click **Create Web Service**
   - Wait for deployment to complete

### **Option B: Deploy from Render CLI**

1. **Install Render CLI:**
   ```bash
   npm install -g @render/cli
   ```

2. **Login to Render:**
   ```bash
   render login
   ```

3. **Deploy:**
   ```bash
   render deploy
   ```

## **Step 3: Update Frontend**

Update your frontend to use the new backend URL:

```javascript
const BACKEND_URL = 'https://your-render-service-name.onrender.com';
```

## **Step 4: Test Live Payment Flow**

### **Test with Real Payment:**

1. **Open your game** (`http://localhost:8080/index.html`)
2. **Click "Pay £1.99"** → Opens Stripe
3. **Complete payment** with test card:
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
4. **Return to game** → Should redirect with session ID
5. **Click "I've Completed Payment"** → Should verify and show unlock code
6. **Enter unlock code** → Multiplayer unlocks

### **Test with Manual Verification:**

1. **Complete payment** but don't get redirected back
2. **Click "I've Completed Payment"** → Asks for payment ID
3. **Enter session ID** from Stripe (starts with `cs_`)
4. **Should verify** and show unlock code

## **Step 5: Monitor and Debug**

### **Check Backend Logs:**
- Go to Render Dashboard
- Click your service
- Go to **Logs** tab
- Monitor payment verification attempts

### **Test Backend Health:**
```
https://your-render-service-name.onrender.com/health
```

### **View Generated Codes:**
```
https://your-render-service-name.onrender.com/api/codes
```

## **Environment Variables**

| Variable | Description | Example |
|----------|-------------|---------|
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_test_...` |
| `ENCRYPTION_KEY` | 32-character encryption key for codes | `your-32-char-encryption-key-here` |
| `PORT` | Server port (auto-set by Render) | `3001` |

## **Security Notes**

- ✅ **Stripe secret key** is encrypted in Render
- ✅ **Encryption key** is encrypted in Render
- ✅ **Unlock codes** are AES-256 encrypted on disk
- ✅ **CORS** configured for your domains
- ✅ **Payment verification** with real Stripe API
- ✅ **Device tracking** prevents code sharing
- ✅ **One-time use** unlock codes
- ✅ **Permanent storage** survives server restarts

## **Troubleshooting**

### **Payment Verification Fails:**
- Check Stripe secret key is correct
- Verify payment was actually completed
- Check backend logs for errors

### **CORS Errors:**
- Update CORS origins in backend
- Ensure frontend URL is allowed

### **Backend Won't Start:**
- Check `package.json` has all dependencies
- Verify Node.js version (>=18.0.0)
- Check build logs in Render

## **Production Checklist**

- [ ] Stripe secret key configured
- [ ] Frontend URL updated
- [ ] Payment flow tested
- [ ] Unlock codes working
- [ ] Device tracking working
- [ ] Error handling tested
- [ ] Logs monitored

## **Support**

If you encounter issues:
1. Check Render logs
2. Verify Stripe dashboard
3. Test with Stripe test cards
4. Check CORS configuration 
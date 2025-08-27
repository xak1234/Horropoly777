# 🔑 How to Get Your Firebase Service Account Key

## 📍 Step-by-Step Guide

### Step 1: Go to Firebase Console
1. **Open your browser**
2. **Go to:** https://console.firebase.google.com/
3. **Sign in with your Google account** (the one that owns the horropoly project)

### Step 2: Select Your Project
1. **Look for "horropoly" in the project list**
2. **Click on "horropoly"** to open the project
3. **You should see the Firebase project dashboard**

### Step 3: Access Project Settings
1. **Look for the gear icon ⚙️** (usually in the top-left or top-right)
2. **Click on the gear icon**
3. **Select "Project settings"** from the dropdown menu

### Step 4: Go to Service Accounts Tab
1. **In Project Settings, look for tabs at the top**
2. **Click on "Service accounts"** tab
3. **You should see a section about "Firebase Admin SDK"**

### Step 5: Generate New Private Key
1. **Look for a button that says "Generate new private key"**
2. **Click on "Generate new private key"**
3. **A popup will appear asking for confirmation**
4. **Click "Generate key"** to confirm

### Step 6: Download the JSON File
1. **Your browser will automatically download a JSON file**
2. **The filename will be something like:** `horropoly-firebase-adminsdk-xxxxx-xxxxxxxxxx.json`
3. **Save this file somewhere safe on your computer**

### Step 7: Get the JSON Content
1. **Open the downloaded JSON file** with any text editor (Notepad, VS Code, etc.)
2. **Select all the content** (Ctrl+A)
3. **Copy the entire content** (Ctrl+C)

### Step 8: Set Environment Variable in Render
1. **Go to your Render dashboard:** https://dashboard.render.com/
2. **Find your "horropoly-payment-backend" service**
3. **Click on the service name**
4. **Go to "Environment" tab**
5. **Find the "FIREBASE_SERVICE_ACCOUNT" variable**
6. **Click "Edit" or "Add"**
7. **Paste the entire JSON content** you copied
8. **Click "Save"**

## 🔍 What the JSON File Should Look Like

The downloaded file should contain something like this:

```json
{
  "type": "service_account",
  "project_id": "horropoly",
  "private_key_id": "abc123def456...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@horropoly.iam.gserviceaccount.com",
  "client_id": "123456789012345678901",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40horropoly.iam.gserviceaccount.com"
}
```

## ⚠️ Important Notes

### Security
- **Keep this JSON file secure** - it contains sensitive credentials
- **Don't share it publicly** or commit it to public repositories
- **Only use it in your Render environment variables**

### Your Service Account Email
- **Your service account email should be:** `firebase-adminsdk-fbsvc@horropoly.iam.gserviceaccount.com`
- **If it's different, that's okay** - just make sure you're using the correct project

### Project ID
- **Your project ID should be:** `horropoly`
- **This confirms you're in the right project**

## 🧪 Test After Setting

1. **Wait a few minutes** for Render to redeploy
2. **Test the backend:**
   ```bash
   curl https://horropoly-payment-backend.onrender.com/api/health
   ```
3. **Should return:**
   ```json
   {"status":"ok","timestamp":"2025-07-19T16:30:28.120Z"}
   ```

## 🚨 Common Issues

### Issue: "Generate new private key" button not visible
**Solution:**
- Make sure you're in the "Service accounts" tab
- Look for "Firebase Admin SDK" section
- If you don't see it, you might not have admin access to the project

### Issue: Downloaded file is empty or corrupted
**Solution:**
- Try downloading again
- Check your browser's download settings
- Make sure you have permission to download files

### Issue: JSON content is invalid
**Solution:**
- Make sure you copied the entire content
- Don't add extra quotes or characters
- Test the JSON in a JSON validator

### Issue: Service account email is different
**Solution:**
- That's okay! Use whatever email is in your downloaded JSON
- The important thing is that the project_id is "horropoly"

## 📞 Still Having Issues?

If you can't find the service account section:

1. **Make sure you're the owner** of the Firebase project
2. **Check if you have admin permissions**
3. **Try accessing Firebase Console in an incognito/private window**
4. **Make sure you're signed in with the correct Google account**

## 🎯 Success Indicators

✅ You downloaded a JSON file with "horropoly" in the name
✅ The JSON contains `"project_id": "horropoly"`
✅ The JSON contains `"client_email": "firebase-adminsdk-...@horropoly.iam.gserviceaccount.com"`
✅ You pasted the entire JSON into Render environment variables
✅ The backend health check works after setting the variable

---

**Your Firebase Project:** horropoly
**Your Service Account:** firebase-adminsdk-fbsvc@horropoly.iam.gserviceaccount.com
**Your Backend URL:** https://horropoly-payment-backend.onrender.com 
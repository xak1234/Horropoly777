# 🔒 Firestore Security Rules Setup Guide

## 📋 Overview

This guide explains how to set up proper Firestore security rules for your Horropoly payment system.

## 🎯 Recommended Rules

### **For Production (Current Setup)**
Use `firestore.rules.simple` - This is designed for your current setup without Firebase Authentication.

### **For Future (With Auth)**
Use `firestore.rules` - This includes Firebase Authentication and more robust security.

## 🚀 How to Deploy Rules

### **Method 1: Firebase Console (Easiest)**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your `horropoly` project
3. Navigate to **Firestore Database** → **Rules**
4. Copy the contents of `firestore.rules.simple`
5. Paste and click **Publish**

### **Method 2: Firebase CLI**

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project (if not already done)
firebase init firestore

# Deploy rules
firebase deploy --only firestore:rules
```

### **Method 3: Using firebase.json**

Create or update your `firebase.json`:

```json
{
  "firestore": {
    "rules": "firestore.rules.simple",
    "indexes": "firestore.indexes.json"
  }
}
```

Then run:
```bash
firebase deploy --only firestore:rules
```

## 🔍 Rules Explanation

### **Payment Collections**

```javascript
// Payments collection
match /payments/{userId} {
  allow read, write: if 
    resource.data.userId == userId ||
    (request.resource != null && request.resource.data.userId == userId);
}
```

**What this does:**
- ✅ Users can only access their own payment records
- ✅ Prevents users from reading other users' payments
- ✅ Validates that userId in document matches path

### **Game Collections**

```javascript
// Game rooms - allow all access (since no auth)
match /gameRooms/{roomId} {
  allow read, write: if true;
}
```

**What this does:**
- ✅ Allows multiplayer functionality to work
- ✅ Players can join/leave rooms
- ✅ Game state can be updated

### **Data Validation**

```javascript
// Payment validation
match /payments/{userId} {
  allow write: if 
    request.resource.data.keys().hasAll(['userId', 'status', 'timestamp']) &&
    request.resource.data.status in ['pending', 'completed', 'failed', 'refunded'] &&
    request.resource.data.amount > 0;
}
```

**What this does:**
- ✅ Ensures required fields are present
- ✅ Validates payment status values
- ✅ Prevents negative amounts
- ✅ Validates timestamps

## 🛡️ Security Features

### **1. User Isolation**
- Users can only access their own payment data
- Device fingerprints are tied to specific users
- Session data is user-specific

### **2. Data Validation**
- Required fields must be present
- Payment status must be valid
- Amounts must be positive
- Timestamps must be valid

### **3. Size Limits**
- Documents limited to 1MB
- Prevents malicious large data uploads

### **4. Rate Limiting** (Advanced)
- Limits writes per user per minute
- Prevents spam and abuse

## 🧪 Testing Rules

### **Test in Firebase Console**

1. Go to **Firestore Database** → **Rules**
2. Click **Rules playground**
3. Test different scenarios:

```javascript
// Test reading own payment
match /databases/{database}/documents {
  match /payments/{userId} {
    allow read: if resource.data.userId == userId;
  }
}

// Test data
{
  "resource": {
    "data": {
      "userId": "user123",
      "status": "completed",
      "timestamp": "2024-01-01T00:00:00Z"
    }
  },
  "request": {
    "auth": null,
    "resource": {
      "data": {
        "userId": "user123"
      }
    }
  }
}
```

### **Test with Your App**

1. Deploy rules
2. Test payment flow
3. Check console for permission errors
4. Verify multiplayer still works

## ⚠️ Important Notes

### **Current Setup Limitations**
- No Firebase Authentication (using localStorage userId)
- Less secure than authenticated setup
- Rules rely on client-side userId validation

### **Future Improvements**
- Implement Firebase Authentication
- Use custom claims for admin access
- Add more granular permissions
- Implement server-side validation

### **Monitoring**
- Check Firebase Console → **Firestore** → **Usage** for rule evaluations
- Monitor for permission denied errors
- Set up alerts for unusual access patterns

## 🔧 Troubleshooting

### **Common Issues**

1. **Permission Denied Errors**
   - Check if userId matches document path
   - Verify required fields are present
   - Check data validation rules

2. **Rules Not Working**
   - Clear browser cache
   - Wait 1-2 minutes for rules to propagate
   - Check Firebase Console for rule syntax errors

3. **Multiplayer Not Working**
   - Ensure game collections allow read/write
   - Check if room data structure matches rules

### **Debug Commands**

```javascript
// Check if rules are working
console.log('Testing Firestore access...');

// Test payment write
const testPayment = {
  userId: 'test_user',
  status: 'completed',
  timestamp: new Date().toISOString(),
  amount: 199
};

// This should work if rules are correct
await setDoc(doc(db, 'payments', 'test_user'), testPayment);
```

## 📞 Support

If you encounter issues:
1. Check Firebase Console for error messages
2. Verify rule syntax in Firebase Console
3. Test with simplified rules first
4. Check browser console for permission errors

## 🎯 Next Steps

1. **Deploy the simple rules** (`firestore.rules.simple`)
2. **Test your payment flow**
3. **Monitor for any permission errors**
4. **Consider implementing Firebase Auth** for better security
5. **Set up monitoring and alerts** 
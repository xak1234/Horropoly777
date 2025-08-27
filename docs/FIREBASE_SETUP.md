# Firebase Setup for Horropoly Payment System

## Current Issue

The payment system is working correctly, but there's a Firebase Firestore index issue that needs to be resolved:

```
code: 9,
details: 'The query requires an index. You can create it here: https://console.firebase.google.com/v1/r/project/horropoly/firestore/indexes?create_composite=...'
```

## Solution

### Option 1: Create Index via Firebase Console (Recommended)

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/project/horropoly/firestore/indexes
   - Or click the link in the error message

2. **Create Composite Index**
   - Collection ID: `payments`
   - Fields to index:
     - `customerEmail` (Ascending)
     - `timestamp` (Ascending)
     - `__name__` (Ascending)

3. **Wait for Index to Build**
   - The index will take a few minutes to build
   - You'll see a "Building" status initially
   - Once complete, it will show "Enabled"

### Option 2: Use Firebase CLI

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize Firebase in your project**:
   ```bash
   firebase init firestore
   ```

4. **Deploy the indexes**:
   ```bash
   firebase deploy --only firestore:indexes
   ```

## Payment System Files

The following files have been created to handle payment verification:

### 1. `payment-verification.js`
- Handles payment verification with the backend
- Records payments in Firebase
- Manages payment status in localStorage
- Provides functions for checking payment status

### 2. `payment-test.html`
- Test page for verifying the payment system
- Includes buttons to test payment flow
- Shows real-time logs of payment processing
- Allows manual verification of Firebase records

### 3. `firebase-indexes.json`
- Configuration file for Firestore indexes
- Can be used with Firebase CLI for deployment

## Testing the Payment System

1. **Open the test page**:
   ```
   http://localhost:8000/payment-test.html
   ```

2. **Test the payment flow**:
   - Click "Test Payment (£1.99)"
   - Complete the Stripe checkout
   - Return to the test page
   - Check that payment status updates

3. **Verify Firebase records**:
   - Click "Check Firebase" button
   - Look for payment records in the Firebase console

## Integration with Main Game

To integrate the payment system with your main game:

1. **Import the payment verification module**:
   ```javascript
   import { initPaymentSystem, hasUserPaid } from './payment-verification.js';
   ```

2. **Initialize on page load**:
   ```javascript
   initPaymentSystem();
   ```

3. **Check payment status**:
   ```javascript
   const paid = await hasUserPaid();
   if (paid) {
       // Enable multiplayer features
   }
   ```

4. **Set up success callback**:
   ```javascript
   window.onPaymentSuccess = function() {
       // Update UI to show unlocked features
   };
   ```

## Backend Configuration

The backend is already configured and working. It includes:

- Payment session creation
- Payment verification
- Webhook handling
- Firebase integration

## Troubleshooting

### Payment Not Recording in Firebase
1. Check that Firebase is properly initialized
2. Verify the index is created and enabled
3. Check browser console for errors
4. Ensure the payment verification is successful

### Index Still Building
- Wait for the index to complete building (usually 2-5 minutes)
- Check the Firebase console for index status
- The error will resolve once the index is enabled

### Payment Verification Fails
1. Check that the backend is running
2. Verify the session ID is correct
3. Check network requests in browser dev tools
4. Look for CORS errors

## Security Notes

- All payment processing happens server-side
- Firebase records are used for verification only
- Local storage is used for UI state management
- Webhook verification ensures payment authenticity

## Next Steps

1. Create the Firebase index
2. Test the payment system using the test page
3. Integrate payment checks into your main game
4. Deploy the updated system

The payment system is working correctly - the only issue is the missing Firebase index which will be resolved once you create it in the Firebase console. 
# 🧹 Firebase Purchase Logs Cleanup Guide

This guide explains how to clear all Firebase purchase logs and start fresh with your Horropoly payment system.

## 📋 What Gets Cleared

The cleanup process will delete ALL documents from these Firebase collections:

- **`payments`** - All payment records and transaction history
- **`paymentDevices`** - Device fingerprinting and usage tracking data
- **`paymentSessions`** - Stripe session validation records
- **`failedPayments`** - Failed payment attempt logs

## ⚠️ Important Warnings

- **This action is PERMANENT and cannot be undone**
- All payment history will be lost
- Device tracking data will be reset
- Fraud prevention data will be cleared
- Users will need to re-verify payments

## 🚀 How to Clear Firebase Purchase Logs

### Option 1: Web Interface (Recommended)

1. Open `clear-purchase-logs.html` in your web browser
2. Review the warning message carefully
3. Click the "🗑️ Clear All Purchase Logs" button
4. Wait for the process to complete
5. Review the status messages for confirmation

### Option 2: Command Line (Server-side)

1. Make sure you have the Firebase service account key:
   ```bash
   # Check if firebase-service-account.json exists
   ls firebase-service-account.json
   ```

2. Run the cleanup script:
   ```bash
   npm run clear-logs
   ```

   Or directly:
   ```bash
   node clear-firebase-logs-server.js
   ```

### Option 3: Manual Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your "horropoly" project
3. Navigate to Firestore Database
4. Delete documents from each collection:
   - `payments`
   - `paymentDevices`
   - `paymentSessions`
   - `failedPayments`

## 🔄 After Cleanup

Once the cleanup is complete:

1. **Reset Local Storage**: Clear browser localStorage for all users
2. **Test Payment Flow**: Verify new payments are being recorded
3. **Monitor Logs**: Check that new payment data is being created
4. **Update Analytics**: Reset any payment tracking dashboards

## 📊 Verification

To verify the cleanup was successful:

1. Check Firebase Console - all payment collections should be empty
2. Run a test payment to ensure new records are created
3. Verify device fingerprinting is working for new users
4. Confirm fraud prevention is tracking new devices

## 🛠️ Troubleshooting

### Common Issues

**"Service account not found"**
- Ensure `firebase-service-account.json` is in the project root
- Download from Firebase Console > Project Settings > Service Accounts

**"Permission denied"**
- Check Firebase security rules allow delete operations
- Verify service account has proper permissions

**"Collection not found"**
- This is normal if collections don't exist yet
- New collections will be created when needed

### Recovery

If you accidentally cleared logs and need to restore:

1. **No Automatic Recovery**: Firebase doesn't provide automatic backup restoration
2. **Manual Restoration**: You would need to restore from your own backups
3. **Contact Support**: If you have Firebase support, they may be able to help

## 🔒 Security Considerations

- Only run cleanup scripts in development/testing environments
- Consider backing up data before cleanup in production
- Review Firebase security rules to prevent unauthorized deletions
- Monitor for unusual deletion activity

## 📞 Support

If you encounter issues:

1. Check the console logs for error messages
2. Verify Firebase configuration is correct
3. Ensure you have proper permissions
4. Contact the development team for assistance

---

**Remember**: This is a destructive operation. Always double-check before proceeding! 
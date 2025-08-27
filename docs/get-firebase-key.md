# Getting Your Firebase Service Account Key

## Step-by-Step Guide

### 1. Go to Firebase Console
1. Visit [Firebase Console](https://console.firebase.google.com/)
2. Select your "horropoly" project

### 2. Navigate to Service Accounts
1. Click the gear icon ⚙️ next to "Project Overview"
2. Select "Project settings"
3. Click the "Service accounts" tab

### 3. Generate New Private Key
1. Click "Generate new private key" button
2. Click "Generate key" in the popup
3. Download the JSON file

### 4. Format for Render
1. Open the downloaded JSON file
2. Copy the entire content
3. In Render dashboard, set the `FIREBASE_SERVICE_ACCOUNT` environment variable to this JSON string

## Example JSON Structure
```json
{
  "type": "service_account",
  "project_id": "horropoly",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@horropoly.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40horropoly.iam.gserviceaccount.com"
}
```

## Security Note
- Keep this JSON file secure
- Never commit it to version control
- Only use it in environment variables
- The service account has admin access to your Firebase project

## Testing the Connection
After setting up, you can test if the Firebase connection works by visiting:
`https://your-backend-url.onrender.com/api/health`

You should see `"firebase": true` in the response. 
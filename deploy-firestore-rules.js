const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Deploying Firestore rules...');

try {
  // Check if firebase CLI is installed
  try {
    execSync('firebase --version', { stdio: 'pipe' });
  } catch (error) {
    console.error('❌ Firebase CLI not found. Please install it first:');
    console.error('npm install -g firebase-tools');
    process.exit(1);
  }

  // Deploy Firestore rules
  console.log('📤 Deploying rules to Firebase...');
  execSync('firebase deploy --only firestore:rules', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });

  console.log('✅ Firestore rules deployed successfully!');
  console.log('🔒 The fraud prevention system should now work without permission errors.');

} catch (error) {
  console.error('❌ Error deploying Firestore rules:', error.message);
  console.log('\n📋 Manual deployment steps:');
  console.log('1. Install Firebase CLI: npm install -g firebase-tools');
  console.log('2. Login to Firebase: firebase login');
  console.log('3. Initialize Firebase (if not done): firebase init firestore');
  console.log('4. Deploy rules: firebase deploy --only firestore:rules');
} 
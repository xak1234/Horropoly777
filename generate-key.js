#!/usr/bin/env node

const crypto = require('crypto');

// Generate a secure 32-character encryption key
const encryptionKey = crypto.randomBytes(16).toString('hex');

console.log('🔐 Generated Encryption Key:');
console.log('=============================');
console.log(encryptionKey);
console.log('=============================');
console.log('');
console.log('📝 Instructions:');
console.log('1. Copy this key above');
console.log('2. Add it as ENCRYPTION_KEY in your Render environment variables');
console.log('3. Keep this key secure - it encrypts all unlock codes');
console.log('4. If you lose this key, all existing codes will be inaccessible');
console.log('');
console.log('⚠️  Security Warning:');
console.log('- Never share this key publicly');
console.log('- Store it securely in Render environment variables');
console.log('- Backup this key in a secure location'); 
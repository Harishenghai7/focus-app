/**
 * Generate VAPID Keys for Web Push
 * FREE & OPEN SOURCE - No Firebase Required!
 * 
 * Usage:
 *   node scripts/generate-vapid-keys.js
 * 
 * Output:
 *   Public Key:  Use in REACT_APP_VAPID_PUBLIC_KEY
 *   Private Key: Use in VAPID_PRIVATE_KEY (keep secret!)
 */

const webpush = require('web-push');

console.log('\n🔑 Generating FREE VAPID Keys for Web Push...\n');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('✅ VAPID Keys Generated Successfully!\n');
console.log('=' .repeat(60));
console.log('PUBLIC KEY (safe to share, used in frontend):');
console.log(vapidKeys.publicKey);
console.log('=' .repeat(60));
console.log('\nPRIVATE KEY (KEEP SECRET! Add to environment variables):');
console.log(vapidKeys.privateKey);
console.log('=' .repeat(60));
console.log('\n📋 Add these to your .env file:\n');
console.log('REACT_APP_VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
console.log('VAPID_SUBJECT=mailto:admin@yourdomain.com');
console.log('\n⚠️  WARNING: Never commit the private key to git!\n');
console.log('🚀 Your notification system is now 100% FREE - No Firebase needed!\n');

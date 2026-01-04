#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════════════════════
 * FOCUS MESSAGES - PRE-LAUNCH VERIFICATION SCRIPT
 * ═══════════════════════════════════════════════════════════════════════
 * Run this before deploying to verify all components are in place
 */

const fs = require('fs');
const path = require('path');

console.log('\n🚀 FOCUS MESSAGES - PRE-LAUNCH VERIFICATION\n');
console.log('═'.repeat(60));

let errors = 0;
let warnings = 0;
let passed = 0;

// Helper functions
const checkFile = (filePath, description) => {
    const fullPath = path.join(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
        console.log(`✅ ${description}`);
        passed++;
        return true;
    } else {
        console.log(`❌ ${description} - MISSING: ${filePath}`);
        errors++;
        return false;
    }
};

const checkEnv = (varName) => {
    if (process.env[varName]) {
        console.log(`✅ Environment variable: ${varName}`);
        passed++;
        return true;
    } else {
        console.log(`⚠️  Environment variable: ${varName} - NOT SET`);
        warnings++;
        return false;
    }
};

// Check Core Files
console.log('\n📦 CORE FILES\n');
checkFile('supabase/migrations/100_focus_messages_production.sql', 'Database migration script');
checkFile('MESSAGES_README.md', 'Main README');
checkFile('MESSAGES_DEPLOYMENT_GUIDE.md', 'Deployment guide');

// Check Hooks
console.log('\n🪝 HOOKS\n');
checkFile('src/pages/Messages/hooks/useRealtimeMessages.js', 'Real-time messages hook');
checkFile('src/pages/Messages/hooks/useMessageReactions.js', 'Message reactions hook');
checkFile('src/pages/Messages/hooks/useTypingIndicator.js', 'Typing indicator hook');
checkFile('src/pages/Messages/hooks/usePresence.js', 'Presence hook');

// Check Components
console.log('\n🎨 COMPONENTS\n');
checkFile('src/pages/Messages/components/ChatWindow/EnhancedMessageInput.jsx', 'Enhanced message input');
checkFile('src/pages/Messages/components/ChatWindow/EnhancedMessageBubble.jsx', 'Enhanced message bubble');
checkFile('src/pages/Messages/components/ChatWindow/CompleteChatWindow.jsx', 'Complete chat window (reference)');
checkFile('src/pages/Messages/components/Modals/GifPicker.jsx', 'GIF picker');
checkFile('src/pages/Messages/components/Modals/ShareToMessages.jsx', 'Share to messages');

// Check Existing Components
console.log('\n📚 EXISTING COMPONENTS (Should Already Exist)\n');
checkFile('src/components/messages/StickerPicker.js', 'Sticker picker');
checkFile('src/hooks/useCall.js', 'Call hook');

// Check Environment Variables
console.log('\n🔐 ENVIRONMENT VARIABLES\n');
checkEnv('REACT_APP_SUPABASE_URL');
checkEnv('REACT_APP_SUPABASE_KEY');
checkEnv('REACT_APP_TENOR_API_KEY');

// Check package.json dependencies
console.log('\n📦 DEPENDENCIES\n');
try {
    const packageJson = require('./package.json');
    const requiredDeps = [
        '@supabase/supabase-js',
        'date-fns',
        'react',
        'react-dom'
    ];

    requiredDeps.forEach(dep => {
        if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
            console.log(`✅ ${dep}`);
            passed++;
        } else {
            console.log(`❌ ${dep} - NOT INSTALLED`);
            errors++;
        }
    });
} catch (err) {
    console.log('⚠️  Could not read package.json');
    warnings++;
}

// Summary
console.log('\n' + '═'.repeat(60));
console.log('\n📊 VERIFICATION SUMMARY\n');
console.log(`✅ Passed: ${passed}`);
console.log(`⚠️  Warnings: ${warnings}`);
console.log(`❌ Errors: ${errors}`);

if (errors === 0 && warnings === 0) {
    console.log('\n🎉 ALL CHECKS PASSED! You\'re ready to deploy!\n');
    console.log('Next steps:');
    console.log('1. Run database migration in Supabase Dashboard');
    console.log('2. Create message-media storage bucket');
    console.log('3. Integrate components into your app');
    console.log('4. Test all features');
    console.log('5. Deploy! 🚀\n');
} else if (errors === 0) {
    console.log('\n⚠️  WARNINGS DETECTED\n');
    console.log('You can proceed, but address warnings for full functionality.\n');
    if (!process.env.REACT_APP_TENOR_API_KEY) {
        console.log('⚠️  Get Tenor API key: https://tenor.com/developer/keyregistration\n');
    }
} else {
    console.log('\n❌ ERRORS DETECTED - Please fix before deploying\n');
    console.log('Missing files need to be created or restored.\n');
    process.exit(1);
}

// Additional checks
console.log('═'.repeat(60));
console.log('\n📋 MANUAL CHECKLIST (Complete these manually)\n');
console.log('[ ] Database migration run in Supabase Dashboard');
console.log('[ ] message-media storage bucket created');
console.log('[ ] Storage policies added');
console.log('[ ] Tenor API key obtained and added to .env');
console.log('[ ] Components integrated into ChatPane/ChatWindow');
console.log('[ ] Tested send/receive messages');
console.log('[ ] Tested all message types (text, image, video, GIF, sticker)');
console.log('[ ] Tested reactions');
console.log('[ ] Tested delete (for me / for everyone)');
console.log('[ ] Tested reply');
console.log('[ ] Tested typing indicators');
console.log('[ ] Tested online status');
console.log('[ ] Tested on mobile');
console.log('[ ] No console errors');
console.log('[ ] Performance is smooth\n');

console.log('═'.repeat(60));
console.log('\n💜 Good luck with your launch! You\'ve got this!\n');

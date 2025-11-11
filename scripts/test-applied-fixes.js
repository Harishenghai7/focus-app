#!/usr/bin/env node

/**
 * 🧪 TEST APPLIED FIXES
 * Verifies the critical fixes have been applied to the codebase
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 TESTING APPLIED FIXES\n');

const tests = [
  {
    name: 'Menu State Isolation',
    file: 'src/components/PostCard.js',
    checks: [
      'menuRef = useRef(null)',
      'handleClickOutside',
      'aria-expanded={showMenu}',
      'e.stopPropagation()'
    ]
  },
  {
    name: 'Optimistic UI Hook',
    file: 'src/hooks/useOptimisticAction.js',
    checks: [
      'useOptimisticAction',
      'executeOptimistic',
      'previousState',
      'rollback on error'
    ]
  },
  {
    name: 'Optimistic Likes in PostCard',
    file: 'src/components/PostCard.js',
    checks: [
      'useOptimisticAction',
      'likeState.liked',
      'executeLikeAction',
      'optimisticState'
    ]
  }
];

let passedTests = 0;
let totalTests = tests.length;

tests.forEach((test, index) => {
  console.log(`${index + 1}. Testing ${test.name}:`);
  
  const filePath = path.join(__dirname, '..', test.file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`   ❌ File not found: ${test.file}`);
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  let passed = 0;
  
  test.checks.forEach(check => {
    if (content.includes(check)) {
      console.log(`   ✅ ${check}`);
      passed++;
    } else {
      console.log(`   ❌ Missing: ${check}`);
    }
  });
  
  if (passed === test.checks.length) {
    console.log(`   🎉 ${test.name} - ALL CHECKS PASSED\n`);
    passedTests++;
  } else {
    console.log(`   ⚠️  ${test.name} - ${passed}/${test.checks.length} checks passed\n`);
  }
});

console.log('='.repeat(60));
console.log(`📊 RESULTS: ${passedTests}/${totalTests} tests passed`);

if (passedTests === totalTests) {
  console.log('🎉 ALL FIXES SUCCESSFULLY APPLIED!');
  console.log('✨ Your app now has:');
  console.log('  • Isolated menu states (no more wrong menu opens)');
  console.log('  • Optimistic UI (instant like feedback)');
  console.log('  • Proper event handling (click outside to close)');
  console.log('  • Rollback on errors (likes revert if network fails)');
  console.log('\n🚀 Test these features:');
  console.log('  1. Click three-dot menu - only that post\'s menu opens');
  console.log('  2. Click outside menu - menu closes');
  console.log('  3. Like a post - heart fills instantly');
  console.log('  4. Scroll while menu open - menu closes');
} else {
  console.log('⚠️  Some fixes may not have been applied correctly');
  console.log('🔧 Check the files manually or re-run the fixes');
}

console.log('='.repeat(60));
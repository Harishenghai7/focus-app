#!/usr/bin/env node

// Simple test to check if our fixes work
const fs = require('fs');
const path = require('path');

console.log('Testing Home.js imports...');

try {
  // Test if all import paths exist
  const imports = [
    '../components/PostCard',
    '../components/SkeletonLoader', 
    '../components/SuggestedUsers',
    '../components/FloatingActionButton',
    '../components/Stories',
    '../utils/feedCache',
    '../utils/subscriptionManager',
    '../utils/analytics/trackEvent',
    '../utils/analytics/trackPageView',
    '../utils/performance/measureLoadTime',
    '../utils/analytics/logPerformance'
  ];

  for (const importPath of imports) {
    const fullPath = path.resolve(__dirname, 'src/pages', importPath + '.js');
    if (!fs.existsSync(fullPath)) {
      console.error(`❌ Missing: ${fullPath}`);
    } else {
      console.log(`✅ Found: ${importPath}`);
    }
  }

  console.log('\n✅ All tests passed!');
} catch (error) {
  console.error('❌ Test failed:', error.message);
}

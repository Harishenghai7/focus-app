#!/usr/bin/env node

/**
 * AI-Powered Testing Flow
 * Runs all testing strategies in sequence
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🤖 AI-Powered Testing Flow Starting...\n');

const runCommand = (command, description) => {
  console.log(`🔄 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed\n`);
    return true;
  } catch (error) {
    console.log(`❌ ${description} failed\n`);
    return false;
  }
};

async function runTestingFlow() {
  const results = {};

  // 1. Backend/Supabase Testing
  results.backend = runCommand('npm run test:backend', 'Backend Integration Tests');

  // 2. Build Test
  results.build = runCommand('npm run build', 'Production Build Test');

  // 3. Cypress E2E Tests (if build succeeds)
  if (results.build) {
    results.e2e = runCommand('npm run cypress:run', 'Cypress E2E Tests');
  }

  // 4. Lighthouse Performance Audit
  results.lighthouse = runCommand('npm run lighthouse', 'Lighthouse Performance Audit');

  // 5. Security Audit
  results.security = runCommand('npm audit --audit-level moderate', 'Security Vulnerability Scan');

  // Generate Report
  console.log('📊 AI Testing Results Summary');
  console.log('================================');
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test.toUpperCase()}: ${passed ? 'PASSED' : 'FAILED'}`);
  });

  const allPassed = Object.values(results).every(result => result);
  
  console.log('\n🎯 Overall Status:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  
  if (allPassed) {
    console.log('\n🚀 Ready for deployment!');
    console.log('Next steps:');
    console.log('- npm run deploy:netlify');
    console.log('- npm run deploy:vercel');
  } else {
    console.log('\n🔧 Please fix failing tests before deployment');
  }

  return allPassed;
}

runTestingFlow().catch(console.error);
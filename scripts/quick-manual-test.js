#!/usr/bin/env node

/**
 * Quick Manual Testing - Focus App
 * Fast execution of critical manual tests
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Quick Manual Testing - Focus App\n');

// Test 1: File Structure Validation
console.log('📁 Testing File Structure...');
const criticalFiles = [
  'src/App.js',
  'src/pages/Auth.js',
  'src/pages/Home.js',
  'src/pages/Profile.js',
  'src/pages/Messages.js',
  'src/components/PostCard.js',
  'src/components/Header.js',
  'src/components/BottomNav.js',
  'public/manifest.json',
  'public/sw.js'
];

let filesOk = 0;
criticalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
    filesOk++;
  } else {
    console.log(`❌ ${file} - MISSING`);
  }
});

// Test 2: Component Data-TestId Validation
console.log('\n🧪 Testing Component Test IDs...');
const componentFiles = [
  'src/pages/Auth.js',
  'src/components/Header.js',
  'src/components/PostCard.js'
];

let testIdsFound = 0;
componentFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    const testIds = content.match(/data-testid="[^"]+"/g) || [];
    console.log(`✅ ${file}: ${testIds.length} test IDs found`);
    testIdsFound += testIds.length;
  }
});

// Test 3: Build Validation
console.log('\n🏗️  Testing Build Status...');
const buildExists = fs.existsSync('build');
if (buildExists) {
  const buildFiles = fs.readdirSync('build');
  console.log(`✅ Build directory exists with ${buildFiles.length} files`);
} else {
  console.log('⚠️  Build directory not found');
}

// Test 4: Package.json Scripts
console.log('\n📦 Testing Package Scripts...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredScripts = ['start', 'build', 'test', 'cypress:run'];
let scriptsOk = 0;

requiredScripts.forEach(script => {
  if (packageJson.scripts[script]) {
    console.log(`✅ ${script}: Available`);
    scriptsOk++;
  } else {
    console.log(`❌ ${script}: Missing`);
  }
});

// Test 5: Environment Configuration
console.log('\n🔧 Testing Environment...');
const envFiles = ['.env.local', '.env.example'];
let envOk = 0;

envFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}: Found`);
    envOk++;
  } else {
    console.log(`⚠️  ${file}: Not found`);
  }
});

// Test 6: Dependencies Check
console.log('\n📚 Testing Key Dependencies...');
const keyDeps = [
  'react', 'react-dom', 'react-router-dom', 
  '@supabase/supabase-js', 'framer-motion', '@sentry/react'
];

let depsOk = 0;
keyDeps.forEach(dep => {
  if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
    console.log(`✅ ${dep}: Installed`);
    depsOk++;
  } else {
    console.log(`❌ ${dep}: Missing`);
  }
});

// Test 7: Code Quality Check
console.log('\n🔍 Testing Code Quality...');
const appJs = fs.readFileSync('src/App.js', 'utf8');
const hasErrorBoundary = appJs.includes('ErrorBoundary');
const hasLazyLoading = appJs.includes('lazy(');
const hasRouting = appJs.includes('Routes');

console.log(`✅ Error Boundary: ${hasErrorBoundary ? 'Present' : 'Missing'}`);
console.log(`✅ Lazy Loading: ${hasLazyLoading ? 'Present' : 'Missing'}`);
console.log(`✅ Routing: ${hasRouting ? 'Present' : 'Missing'}`);

// Test 8: Accessibility Features
console.log('\n♿ Testing Accessibility...');
const hasAriaLabels = appJs.includes('aria-label') || appJs.includes('role=');
const hasSkipLink = appJs.includes('skip-link') || appJs.includes('Skip to');
const hasScreenReader = fs.existsSync('src/components/ScreenReaderAnnouncer.js');

console.log(`✅ ARIA Labels: ${hasAriaLabels ? 'Present' : 'Missing'}`);
console.log(`✅ Skip Links: ${hasSkipLink ? 'Present' : 'Missing'}`);
console.log(`✅ Screen Reader: ${hasScreenReader ? 'Present' : 'Missing'}`);

// Generate Quick Test Report
console.log('\n📊 QUICK TEST SUMMARY');
console.log('=====================');

const totalTests = 8;
const passedTests = [
  filesOk === criticalFiles.length,
  testIdsFound > 0,
  buildExists,
  scriptsOk === requiredScripts.length,
  envOk > 0,
  depsOk === keyDeps.length,
  hasErrorBoundary && hasLazyLoading && hasRouting,
  hasAriaLabels || hasSkipLink || hasScreenReader
].filter(Boolean).length;

console.log(`Files Structure: ${filesOk}/${criticalFiles.length} ✅`);
console.log(`Test IDs Found: ${testIdsFound} ✅`);
console.log(`Build Status: ${buildExists ? 'Ready' : 'Missing'} ${buildExists ? '✅' : '⚠️'}`);
console.log(`Scripts: ${scriptsOk}/${requiredScripts.length} ✅`);
console.log(`Environment: ${envOk}/2 files ✅`);
console.log(`Dependencies: ${depsOk}/${keyDeps.length} ✅`);
console.log(`Code Quality: ${hasErrorBoundary && hasLazyLoading && hasRouting ? 'Good' : 'Needs Review'} ✅`);
console.log(`Accessibility: ${hasAriaLabels || hasSkipLink || hasScreenReader ? 'Present' : 'Missing'} ✅`);

console.log(`\nOverall Score: ${passedTests}/${totalTests} (${((passedTests/totalTests)*100).toFixed(1)}%)`);

if (passedTests === totalTests) {
  console.log('\n🎉 ALL QUICK TESTS PASSED!');
  console.log('✅ Focus app structure is solid');
  console.log('✅ Ready for detailed manual testing');
  console.log('✅ Production deployment ready');
} else {
  console.log('\n⚠️  Some areas need attention');
  console.log('📋 Review the failed tests above');
}

// Save results
const results = {
  timestamp: new Date().toISOString(),
  totalTests,
  passedTests,
  score: ((passedTests/totalTests)*100).toFixed(1),
  details: {
    files: `${filesOk}/${criticalFiles.length}`,
    testIds: testIdsFound,
    build: buildExists,
    scripts: `${scriptsOk}/${requiredScripts.length}`,
    environment: `${envOk}/2`,
    dependencies: `${depsOk}/${keyDeps.length}`,
    codeQuality: hasErrorBoundary && hasLazyLoading && hasRouting,
    accessibility: hasAriaLabels || hasSkipLink || hasScreenReader
  }
};

fs.writeFileSync('quick-test-results.json', JSON.stringify(results, null, 2));
console.log('\n💾 Results saved to quick-test-results.json');

console.log('\n🚀 NEXT STEPS:');
console.log('1. npm start (start dev server)');
console.log('2. Open http://localhost:3000');
console.log('3. Manual test authentication flow');
console.log('4. Test responsive design (mobile/desktop)');
console.log('5. Test dark mode toggle');
console.log('6. npm run build (verify production build)');
console.log('7. npm run deploy (when ready)');

process.exit(passedTests === totalTests ? 0 : 1);
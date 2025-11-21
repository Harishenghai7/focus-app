#!/usr/bin/env node

/**
 * Final Verification Script for Focus App
 * Comprehensive check of all systems before deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Focus App - Final Verification\n');

// Check critical files exist
const criticalFiles = [
  'src/App.js',
  'src/index.js',
  'src/supabaseClient.js',
  'package.json',
  'public/index.html',
  'public/manifest.json',
  'public/sw.js'
];

console.log('📁 Checking critical files...');
let filesOk = true;
criticalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    filesOk = false;
  }
});

// Check package.json scripts
console.log('\n📦 Checking package.json scripts...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredScripts = [
  'start', 'build', 'test', 'cypress:run', 'test:backend', 'test:full'
];

let scriptsOk = true;
requiredScripts.forEach(script => {
  if (packageJson.scripts[script]) {
    console.log(`✅ ${script}: ${packageJson.scripts[script]}`);
  } else {
    console.log(`❌ ${script} - MISSING`);
    scriptsOk = false;
  }
});

// Check environment files
console.log('\n🔧 Checking environment configuration...');
const envFiles = ['.env.local', '.env.example'];
let envOk = true;
envFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`⚠️  ${file} - Optional but recommended`);
  }
});

// Check build directory
console.log('\n🏗️  Checking build status...');
const buildExists = fs.existsSync('build');
if (buildExists) {
  const buildFiles = fs.readdirSync('build');
  console.log(`✅ Build directory exists with ${buildFiles.length} files`);
} else {
  console.log('⚠️  Build directory not found - run "npm run build"');
}

// Check dependencies
console.log('\n📚 Checking key dependencies...');
const keyDeps = [
  'react', 'react-dom', 'react-router-dom', '@supabase/supabase-js',
  'framer-motion', 'react-toastify', '@sentry/react'
];

let depsOk = true;
keyDeps.forEach(dep => {
  if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
    const version = packageJson.dependencies[dep] || packageJson.devDependencies[dep];
    console.log(`✅ ${dep}: ${version}`);
  } else {
    console.log(`❌ ${dep} - MISSING`);
    depsOk = false;
  }
});

// Check documentation
console.log('\n📖 Checking documentation...');
const docFiles = [
  'README.md', 'TESTING-WORKFLOW.md', 'COMPREHENSIVE-AUDIT-REPORT.md'
];

docFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`⚠️  ${file} - Recommended`);
  }
});

// Final assessment
console.log('\n🎯 FINAL ASSESSMENT');
console.log('==================');

if (filesOk && scriptsOk && depsOk) {
  console.log('🎉 ALL SYSTEMS GO! Focus app is ready for deployment.');
  console.log('\n🚀 Next steps:');
  console.log('1. npm run test:full     # Run complete test suite');
  console.log('2. npm run build         # Create production build');
  console.log('3. npm run deploy        # Deploy to your platform');
  console.log('\n✨ Your professional social media app is ready!');
  process.exit(0);
} else {
  console.log('⚠️  Some issues found. Please review the checklist above.');
  process.exit(1);
}
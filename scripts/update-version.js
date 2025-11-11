/**
 * Update Version Script
 * Updates version.json with current package version and build info
 */

const fs = require('fs');
const path = require('path');

// Read package.json
const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Read existing version.json or create new one
const versionPath = path.join(__dirname, '..', 'public', 'version.json');
let versionData = {
  releaseNotes: []
};

if (fs.existsSync(versionPath)) {
  versionData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
}

// Update version data
versionData.version = packageJson.version;
versionData.buildDate = new Date().toISOString();
versionData.environment = process.env.REACT_APP_ENV || 'production';

// Add commit SHA if available (from CI/CD)
if (process.env.COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || process.env.NETLIFY_COMMIT_REF) {
  versionData.commit = process.env.COMMIT_SHA || 
                       process.env.VERCEL_GIT_COMMIT_SHA || 
                       process.env.NETLIFY_COMMIT_REF;
}

// Write updated version.json
fs.writeFileSync(versionPath, JSON.stringify(versionData, null, 2));

console.log('✅ Version updated successfully');
console.log(`   Version: ${versionData.version}`);
console.log(`   Build Date: ${versionData.buildDate}`);
console.log(`   Environment: ${versionData.environment}`);
if (versionData.commit) {
  console.log(`   Commit: ${versionData.commit.substring(0, 7)}`);
}

/**
 * Deployment Script
 * Automates the deployment process with pre-flight checks
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const error = (message) => {
  log(`❌ ${message}`, 'red');
};

const success = (message) => {
  log(`✅ ${message}`, 'green');
};

const info = (message) => {
  log(`ℹ️  ${message}`, 'blue');
};

const warning = (message) => {
  log(`⚠️  ${message}`, 'yellow');
};

// Execute command and return output
const exec = (command, options = {}) => {
  try {
    return execSync(command, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options,
    });
  } catch (err) {
    if (!options.ignoreError) {
      throw err;
    }
    return null;
  }
};

// Check if file exists
const fileExists = (filePath) => {
  return fs.existsSync(path.join(__dirname, '..', filePath));
};

// Read file content
const readFile = (filePath) => {
  return fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
};

// Pre-flight checks
const runPreflightChecks = () => {
  log('\n🔍 Running pre-flight checks...', 'cyan');

  const checks = [];

  // Check environment variables
  info('Checking environment variables...');
  const requiredEnvVars = [
    'REACT_APP_SUPABASE_URL',
    'REACT_APP_SUPABASE_ANON_KEY',
  ];

  const envFile = fileExists('.env.production') ? '.env.production' : '.env';
  if (!fileExists(envFile)) {
    error(`Environment file ${envFile} not found`);
    checks.push(false);
  } else {
    const envContent = readFile(envFile);
    const missingVars = requiredEnvVars.filter(
      (varName) => !envContent.includes(varName)
    );

    if (missingVars.length > 0) {
      error(`Missing environment variables: ${missingVars.join(', ')}`);
      checks.push(false);
    } else {
      success('Environment variables configured');
      checks.push(true);
    }
  }

  // Check package.json
  info('Checking package.json...');
  if (!fileExists('package.json')) {
    error('package.json not found');
    checks.push(false);
  } else {
    const packageJson = JSON.parse(readFile('package.json'));
    if (!packageJson.version) {
      error('Version not specified in package.json');
      checks.push(false);
    } else {
      success(`Version: ${packageJson.version}`);
      checks.push(true);
    }
  }

  // Check for uncommitted changes
  info('Checking for uncommitted changes...');
  const gitStatus = exec('git status --porcelain', {
    silent: true,
    ignoreError: true,
  });

  if (gitStatus && gitStatus.trim()) {
    warning('You have uncommitted changes');
    warning('Consider committing before deploying');
    checks.push(true); // Warning, not error
  } else {
    success('No uncommitted changes');
    checks.push(true);
  }

  // Check current branch
  info('Checking current branch...');
  const currentBranch = exec('git rev-parse --abbrev-ref HEAD', {
    silent: true,
    ignoreError: true,
  });

  if (currentBranch && currentBranch.trim() !== 'main') {
    warning(`Current branch: ${currentBranch.trim()}`);
    warning('Consider deploying from main branch');
    checks.push(true); // Warning, not error
  } else {
    success('On main branch');
    checks.push(true);
  }

  // Check node_modules
  info('Checking dependencies...');
  if (!fileExists('node_modules')) {
    error('node_modules not found. Run npm install first');
    checks.push(false);
  } else {
    success('Dependencies installed');
    checks.push(true);
  }

  return checks.every((check) => check);
};

// Run tests
const runTests = () => {
  log('\n🧪 Running tests...', 'cyan');

  try {
    info('Running test suite...');
    exec('npm test -- --run --passWithNoTests', { silent: false });
    success('All tests passed');
    return true;
  } catch (err) {
    error('Tests failed');
    return false;
  }
};

// Build application
const buildApp = () => {
  log('\n🔨 Building application...', 'cyan');

  try {
    info('Running production build...');
    exec('npm run build:prod');
    success('Build completed successfully');
    return true;
  } catch (err) {
    error('Build failed');
    return false;
  }
};

// Check build size
const checkBuildSize = () => {
  log('\n📦 Checking build size...', 'cyan');

  const buildDir = path.join(__dirname, '..', 'build');
  if (!fs.existsSync(buildDir)) {
    error('Build directory not found');
    return false;
  }

  // Get build size
  const getBuildSize = (dir) => {
    let size = 0;
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        size += getBuildSize(filePath);
      } else {
        size += stats.size;
      }
    });

    return size;
  };

  const totalSize = getBuildSize(buildDir);
  const sizeMB = (totalSize / 1024 / 1024).toFixed(2);

  info(`Total build size: ${sizeMB} MB`);

  if (totalSize > 10 * 1024 * 1024) {
    // 10 MB
    warning('Build size is larger than 10 MB');
    warning('Consider optimizing bundle size');
  } else {
    success('Build size is acceptable');
  }

  return true;
};

// Deploy to platform
const deploy = (platform) => {
  log(`\n🚀 Deploying to ${platform}...`, 'cyan');

  try {
    if (platform === 'netlify') {
      info('Deploying to Netlify...');
      exec('netlify deploy --prod');
    } else if (platform === 'vercel') {
      info('Deploying to Vercel...');
      exec('vercel --prod');
    } else {
      error(`Unknown platform: ${platform}`);
      return false;
    }

    success(`Deployed to ${platform} successfully`);
    return true;
  } catch (err) {
    error(`Deployment to ${platform} failed`);
    return false;
  }
};

// Create deployment tag
const createTag = () => {
  log('\n🏷️  Creating deployment tag...', 'cyan');

  try {
    const packageJson = JSON.parse(readFile('package.json'));
    const version = packageJson.version;
    const tagName = `v${version}`;

    info(`Creating tag: ${tagName}`);

    // Check if tag exists
    const existingTag = exec(`git tag -l ${tagName}`, {
      silent: true,
      ignoreError: true,
    });

    if (existingTag && existingTag.trim()) {
      warning(`Tag ${tagName} already exists`);
      return true;
    }

    // Create tag
    exec(`git tag -a ${tagName} -m "Release ${version}"`);
    exec(`git push origin ${tagName}`);

    success(`Tag ${tagName} created and pushed`);
    return true;
  } catch (err) {
    error('Failed to create tag');
    return false;
  }
};

// Main deployment function
const main = async () => {
  log('\n🎯 Focus Deployment Script', 'cyan');
  log('================================\n', 'cyan');

  // Get deployment platform from args
  const platform = process.argv[2] || 'netlify';

  // Run pre-flight checks
  if (!runPreflightChecks()) {
    error('\n❌ Pre-flight checks failed');
    error('Please fix the issues above before deploying');
    process.exit(1);
  }

  success('\n✅ Pre-flight checks passed');

  // Ask for confirmation
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  readline.question(
    '\n⚠️  Ready to deploy to production. Continue? (yes/no): ',
    (answer) => {
      readline.close();

      if (answer.toLowerCase() !== 'yes') {
        warning('\n🛑 Deployment cancelled');
        process.exit(0);
      }

      // Run tests (optional, can be skipped with --skip-tests)
      if (!process.argv.includes('--skip-tests')) {
        if (!runTests()) {
          error('\n❌ Tests failed');
          process.exit(1);
        }
      }

      // Build application
      if (!buildApp()) {
        error('\n❌ Build failed');
        process.exit(1);
      }

      // Check build size
      checkBuildSize();

      // Deploy
      if (!deploy(platform)) {
        error('\n❌ Deployment failed');
        process.exit(1);
      }

      // Create tag (optional, can be skipped with --skip-tag)
      if (!process.argv.includes('--skip-tag')) {
        createTag();
      }

      success('\n🎉 Deployment completed successfully!');
      log('\n📊 Next steps:', 'cyan');
      log('  1. Verify deployment at your production URL');
      log('  2. Check error tracking dashboard');
      log('  3. Monitor analytics for any issues');
      log('  4. Update release notes\n');
    }
  );
};

// Run deployment
main().catch((err) => {
  error(`\n❌ Deployment failed: ${err.message}`);
  process.exit(1);
});

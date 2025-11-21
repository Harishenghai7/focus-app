/**
 * Rollback Script
 * Rolls back to a previous deployment
 */

const { execSync } = require('child_process');
const readline = require('readline');

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

// Execute command
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

// Get recent deployments
const getRecentDeployments = (platform) => {
  log('\n📋 Recent deployments:', 'cyan');

  try {
    if (platform === 'netlify') {
      const output = exec('netlify deploy:list --json', { silent: true });
      const deployments = JSON.parse(output);

      deployments.slice(0, 10).forEach((deploy, index) => {
        const date = new Date(deploy.created_at).toLocaleString();
        const status = deploy.state === 'ready' ? '✅' : '⏳';
        log(`  ${index + 1}. ${status} ${deploy.id} - ${date}`);
      });

      return deployments;
    } else if (platform === 'vercel') {
      const output = exec('vercel list --json', { silent: true });
      const deployments = JSON.parse(output);

      deployments.slice(0, 10).forEach((deploy, index) => {
        const date = new Date(deploy.created).toLocaleString();
        const status = deploy.state === 'READY' ? '✅' : '⏳';
        log(`  ${index + 1}. ${status} ${deploy.uid} - ${date}`);
      });

      return deployments;
    }
  } catch (err) {
    error('Failed to fetch deployments');
    throw err;
  }
};

// Rollback to specific deployment
const rollback = (platform, deploymentId) => {
  log(`\n🔄 Rolling back to deployment: ${deploymentId}`, 'cyan');

  try {
    if (platform === 'netlify') {
      info('Rolling back on Netlify...');
      exec(`netlify deploy:restore ${deploymentId}`);
    } else if (platform === 'vercel') {
      info('Rolling back on Vercel...');
      exec(`vercel rollback ${deploymentId}`);
    }

    success('Rollback completed successfully');
    return true;
  } catch (err) {
    error('Rollback failed');
    return false;
  }
};

// Main rollback function
const main = async () => {
  log('\n🔙 Focus Rollback Script', 'cyan');
  log('================================\n', 'cyan');

  // Get platform from args
  const platform = process.argv[2] || 'netlify';

  if (!['netlify', 'vercel'].includes(platform)) {
    error(`Unknown platform: ${platform}`);
    error('Usage: node scripts/rollback.js [netlify|vercel]');
    process.exit(1);
  }

  // Get recent deployments
  let deployments;
  try {
    deployments = getRecentDeployments(platform);
  } catch (err) {
    error('Failed to fetch deployments');
    process.exit(1);
  }

  if (!deployments || deployments.length === 0) {
    error('No deployments found');
    process.exit(1);
  }

  // Ask user to select deployment
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question(
    '\n🔢 Enter deployment number to rollback to (or "cancel"): ',
    (answer) => {
      if (answer.toLowerCase() === 'cancel') {
        warning('\n🛑 Rollback cancelled');
        rl.close();
        process.exit(0);
      }

      const index = parseInt(answer, 10) - 1;

      if (isNaN(index) || index < 0 || index >= deployments.length) {
        error('\n❌ Invalid deployment number');
        rl.close();
        process.exit(1);
      }

      const deployment = deployments[index];
      const deploymentId =
        platform === 'netlify' ? deployment.id : deployment.uid;

      // Confirm rollback
      rl.question(
        `\n⚠️  Are you sure you want to rollback to ${deploymentId}? (yes/no): `,
        (confirm) => {
          rl.close();

          if (confirm.toLowerCase() !== 'yes') {
            warning('\n🛑 Rollback cancelled');
            process.exit(0);
          }

          // Perform rollback
          if (rollback(platform, deploymentId)) {
            success('\n🎉 Rollback completed successfully!');
            log('\n📊 Next steps:', 'cyan');
            log('  1. Verify rollback at your production URL');
            log('  2. Check error tracking dashboard');
            log('  3. Monitor analytics for any issues');
            log('  4. Investigate the issue that caused the rollback\n');
          } else {
            error('\n❌ Rollback failed');
            process.exit(1);
          }
        }
      );
    }
  );
};

// Run rollback
main().catch((err) => {
  error(`\n❌ Rollback failed: ${err.message}`);
  process.exit(1);
});

const fs = require('fs');
const path = require('path');

// Files to process (from AI testing report)
const filesToProcess = [
  'src/components/EnhancedAIDashboard.js',
  'src/components/IncomingCallListener.js',
  'src/components/OnboardingFlow.js',
  'src/components/OrientationHandler.js',
  'src/components/PushNotificationPrompt.js',
  'src/config/security.js',
  'src/hooks/useWebRTCCall.js',
  'src/index.js',
  'src/pages/Boltz.js',
  'src/pages/Call.js',
  'src/pages/Explore.js',
  'src/pages/Flash.js',
  'src/pages/Settings.js',
  'src/server.js',
  'src/supabaseClient.js'
];

// Utility files with many console.log statements
const utilFiles = [
  'src/utils/aiTracker.js',
  'src/utils/analytics.js',
  'src/utils/apiClient.js',
  'src/utils/apiErrorHandler.js',
  'src/utils/authListener.js',
  'src/utils/autoErrorFixer.js',
  'src/utils/autoTester.js',
  'src/utils/browserCompatibility.js',
  'src/utils/callNotifications.js',
  'src/utils/callSignaling.js',
  'src/utils/errorHandler.js',
  'src/utils/errorLogger.js',
  'src/utils/errorTracking.js',
  'src/utils/feedCache.js',
  'src/utils/fetchOrCreateUser.js',
  'src/utils/insertUser.js',
  'src/utils/logout.js',
  'src/utils/NotificationManager.js',
  'src/utils/notificationPreferences.js',
  'src/utils/offlineManager.js',
  'src/utils/pushNotifications.js',
  'src/utils/queryCache.js',
  'src/utils/reportWebVitals.js',
  'src/utils/rlsPolicyTester.js',
  'src/utils/scheduledPostsPublisher.js',
  'src/utils/serviceWorkerManager.js',
  'src/utils/sessionManager.js',
  'src/utils/subscriptionManager.js',
  'src/utils/twoFactorAuth.js',
  'src/utils/versionManager.js',
  'src/utils/videoUtils.js',
  'src/utils/webrtcService.js'
];

const allFiles = [...filesToProcess, ...utilFiles];

function removeConsoleLogs(content) {
  // Remove console.log, console.warn, console.error statements
  // Handle single line console statements
  content = content.replace(/^\s*console\.(log|warn|error|info|debug)\([^;]*\);\s*$/gm, '');
  
  // Handle multi-line console statements
  content = content.replace(/^\s*console\.(log|warn|error|info|debug)\([^)]*\([^)]*\)[^)]*\);\s*$/gm, '');
  
  // Handle console statements with template literals
  content = content.replace(/^\s*console\.(log|warn|error|info|debug)\(`[^`]*`[^;]*\);\s*$/gm, '');
  
  // Handle console statements with complex arguments
  content = content.replace(/^\s*console\.(log|warn|error|info|debug)\([^;]*;\s*$/gm, '');
  
  // More aggressive pattern for any console statement
  content = content.replace(/^\s*console\.[a-zA-Z]+\([^;]*\);\s*\n?/gm, '');
  
  // Clean up empty lines left behind
  content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  return content;
}

function processFile(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${filePath}`);
    return false;
  }
  
  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    const originalLines = content.split('\n').length;
    const processedContent = removeConsoleLogs(content);
    const newLines = processedContent.split('\n').length;
    
    if (content !== processedContent) {
      fs.writeFileSync(fullPath, processedContent, 'utf8');
      console.log(`✓ Processed ${filePath} (removed ${originalLines - newLines} lines)`);
      return true;
    } else {
      console.log(`- No console logs found in ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🧹 Removing console.log statements from Focus app...\n');
  
  let processedCount = 0;
  let totalFiles = 0;
  
  for (const file of allFiles) {
    totalFiles++;
    if (processFile(file)) {
      processedCount++;
    }
  }
  
  console.log(`\n✨ Complete! Processed ${processedCount}/${totalFiles} files.`);
  console.log('📝 Console.log statements have been removed for production readiness.');
}

if (require.main === module) {
  main();
}

module.exports = { removeConsoleLogs, processFile };
/**
 * Node.js Test Runner for Focus App User Scenario QA
 * Executes comprehensive User A & User B scenario tests
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Verify required environment variables
const requiredEnvVars = [
  'REACT_APP_SUPABASE_URL',
  'REACT_APP_SUPABASE_ANON_KEY'
];

console.log('🔍 Checking environment variables...');
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars);
  console.error('Please check your .env file');
  process.exit(1);
}

console.log('✅ Environment variables loaded');

// Setup Supabase client for Node.js environment
const supabaseConfig = {
  supabaseUrl: process.env.REACT_APP_SUPABASE_URL,
  supabaseKey: process.env.REACT_APP_SUPABASE_ANON_KEY
};

console.log('🔗 Supabase URL:', supabaseConfig.supabaseUrl);

// Import and run the test suite
async function runTests() {
  try {
    console.log('🚀 Starting Focus App QA Test Suite...\n');
    console.log('=' .repeat(80));
    console.log('Focus App - Comprehensive User A & User B Scenario Tests');
    console.log('=' .repeat(80));
    
    // Dynamic import of the test class
    const { default: UserScenarioTester } = await import('./comprehensive-user-scenario-test.js');
    
    // Create test instance
    const tester = new UserScenarioTester();
    
    // Run all tests
    const report = await tester.runAllTests();
    
    // Save report to file
    const reportPath = path.join(__dirname, '..', 'COMPREHENSIVE-QA-REPORT.md');
    fs.writeFileSync(reportPath, report, 'utf8');
    
    console.log('\n📊 Full QA Report:');
    console.log('=' .repeat(80));
    console.log(report);
    console.log('=' .repeat(80));
    
    console.log(`\n💾 Report saved to: ${reportPath}`);
    
    // Determine exit code based on test results
    const readinessScore = tester.testResults.summary.appReadiness;
    const criticalFailures = tester.testResults.summary.failed;
    
    if (readinessScore >= 90 && criticalFailures === 0) {
      console.log('\n🎉 ALL TESTS PASSED! App is production ready!');
      process.exit(0);
    } else if (readinessScore >= 75) {
      console.log('\n⚠️ Some tests failed, but app is mostly functional');
      process.exit(1);
    } else {
      console.log('\n❌ Critical issues found. App needs fixes before deployment');
      process.exit(2);
    }
    
  } catch (error) {
    console.error('\n💥 Test runner failed:', error);
    
    // Create error report
    const errorReport = `
# Focus App QA Test - ERROR REPORT

## Test Execution Failed
**Error:** ${error.message}
**Stack:** ${error.stack}
**Time:** ${new Date().toISOString()}

## Possible Causes:
1. Database connection issues
2. Missing environment variables
3. Network connectivity problems
4. Supabase service issues
5. Code syntax errors

## Next Steps:
1. Check database connection
2. Verify .env file configuration
3. Ensure Supabase project is accessible
4. Check network connectivity
5. Review error logs above

---
*Error occurred during automated QA test execution*
`;

    const errorPath = path.join(__dirname, '..', 'QA-ERROR-REPORT.md');
    fs.writeFileSync(errorPath, errorReport, 'utf8');
    
    console.log(`\n💾 Error report saved to: ${errorPath}`);
    process.exit(3);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  console.log('\n⚠️ Test interrupted by user');
  process.exit(130);
});

process.on('SIGTERM', () => {
  console.log('\n⚠️ Test terminated');
  process.exit(143);
});

// Run tests with proper error handling
runTests().catch(error => {
  console.error('Fatal error in test runner:', error);
  process.exit(4);
});

// Export for testing purposes
export { supabaseConfig };

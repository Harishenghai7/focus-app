#!/usr/bin/env node

/**
 * AI Testing System Runner
 * 
 * This script runs the comprehensive AI testing system that:
 * 1. Analyzes your entire Focus app
 * 2. Reads testing guides and documentation
 * 3. Runs automated tests
 * 4. Checks code quality, security, accessibility, and performance
 * 5. Generates detailed reports with actionable recommendations
 * 
 * Usage: node run-ai-tests.js
 */

const AITestingSystem = require('./ai-testing-system');

console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    🤖 AI TESTING SYSTEM                     ║
║                                                              ║
║  Comprehensive Analysis & Quality Report for Focus App      ║
║                                                              ║
║  This system will analyze:                                   ║
║  • Project structure & dependencies                          ║
║  • Testing guides & documentation                            ║
║  • Automated test results                                    ║
║  • Code quality & best practices                             ║
║  • Security vulnerabilities                                  ║
║  • Accessibility compliance                                  ║
║  • Performance optimization                                  ║
║                                                              ║
║  📊 Generates detailed HTML & JSON reports                   ║
║  🎯 Provides actionable recommendations                      ║
║  🚀 Helps prepare your app for production                    ║
╚══════════════════════════════════════════════════════════════╝
`);

async function main() {
  try {
    const system = new AITestingSystem();
    await system.runComprehensiveAnalysis();
    
    console.log('\n🎉 Analysis complete! Check the generated reports for detailed insights.');
    console.log('\n💡 Pro tip: Open ai-testing-report.html in your browser for the best experience.');
    
  } catch (error) {
    console.error('\n❌ AI Testing System encountered an error:');
    console.error(error.message);
    console.error('\n🔧 Try the following:');
    console.error('   1. Ensure you\'re in the Focus app root directory');
    console.error('   2. Check that all dependencies are installed (npm install)');
    console.error('   3. Verify your project structure is correct');
    process.exit(1);
  }
}

main();
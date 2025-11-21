const ProductionReadinessTester = require('../ai-testing-system/production-readiness-tester');

// Quick test without server - validates file structure and implementation
async function runQuickTest() {
  console.log('⚡ Running Quick Production Test (No Server Required)...\n');
  
  const tester = new ProductionReadinessTester();
  await tester.runCompleteProductionTest();
  
  console.log('\n💡 To run full Cypress tests with UI interactions:');
  console.log('   1. Run: npm start (in one terminal)');
  console.log('   2. Run: npm run test:cypress (in another terminal)');
  console.log('\n📊 Current test validates file structure and code implementation.');
}

if (require.main === module) {
  runQuickTest().catch(console.error);
}

module.exports = runQuickTest;
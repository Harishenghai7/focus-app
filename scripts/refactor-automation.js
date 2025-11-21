#!/usr/bin/env node

/**
 * Focus App Refactoring Automation Script
 * 
 * This script helps automate the refactoring of components, hooks, and utilities
 * to meet modern best practices and coding standards.
 * 
 * Usage:
 *   node scripts/refactor-automation.js --phase [1-7] [--batch size] [--fix]
 * 
 * Examples:
 *   node scripts/refactor-automation.js --phase 1          # Audit components
 *   node scripts/refactor-automation.js --phase 1 --fix    # Fix components
 *   node scripts/refactor-automation.js --phase 2 --batch 5 # Refactor hooks in batch of 5
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PHASE = process.argv[2]?.split('--phase')[1]?.trim() || '1';
const BATCH_SIZE = parseInt(process.argv.find(arg => arg.includes('--batch'))?.split('=')[1] || '3');
const SHOULD_FIX = process.argv.includes('--fix');
const VERBOSE = process.argv.includes('--verbose');

const SRC_DIR = path.join(__dirname, '../src');
const COMPONENTS_DIR = path.join(SRC_DIR, 'components');
const HOOKS_DIR = path.join(SRC_DIR, 'hooks');
const UTILS_DIR = path.join(SRC_DIR, 'utils');

/**
 * Log helper
 */
function log(msg, type = 'INFO') {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${type}]`;
  console.log(`${prefix} ${msg}`);
}

/**
 * Get all JS files in a directory
 */
function getJSFiles(dir) {
  return fs.readdirSync(dir)
    .filter(file => file.endsWith('.js') && !file.includes('.module.css'))
    .sort();
}

/**
 * Audit a file for modernization needs
 */
function auditFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  
  // Check for missing PropTypes
  if (content.includes('export default') && !content.includes('PropTypes') && !content.includes('TypeScript')) {
    issues.push('Missing PropTypes or TypeScript types');
  }
  
  // Check for missing React.memo
  if (content.includes('function ') && content.includes('export default') && !content.includes('React.memo')) {
    issues.push('Component not wrapped in React.memo (may need optimization)');
  }
  
  // Check for missing JSDoc
  if (!content.match(/\/\*\*[\s\S]*?\*\//)) {
    issues.push('Missing JSDoc documentation');
  }
  
  // Check for inline styles
  if (content.includes('style={{') || content.includes('style={')) {
    issues.push('Contains inline styles (should use CSS modules)');
  }
  
  // Check for missing error handling
  if ((content.includes('.then(') || content.includes('async') || content.includes('await')) && 
      !content.includes('catch') && !content.includes('try')) {
    issues.push('Async code without error handling');
  }
  
  // Check for missing cleanup in useEffect
  if (content.includes('useEffect') && !content.includes('return () => {')) {
    issues.push('useEffect may be missing cleanup function');
  }
  
  // Check for console.log
  if (content.includes('console.log')) {
    issues.push('Contains console.log statements');
  }
  
  // Check for hardcoded colors/values
  if (content.match(/#[0-9A-Fa-f]{6}/) || content.match(/px|rem|em/)) {
    issues.push('Contains hardcoded colors or units (should use tokens)');
  }
  
  return issues;
}

/**
 * Generate audit report
 */
function generateAuditReport() {
  log('🔍 PHASE 1: Auditing Components', 'PHASE');
  
  const components = getJSFiles(COMPONENTS_DIR);
  const componentIssues = {};
  
  components.forEach((file, index) => {
    const filePath = path.join(COMPONENTS_DIR, file);
    const issues = auditFile(filePath);
    if (issues.length > 0) {
      componentIssues[file] = issues;
    }
    process.stdout.write(`\r  Processing: ${index + 1}/${components.length}`);
  });
  
  console.log('\n');
  
  log('🔍 PHASE 2: Auditing Hooks', 'PHASE');
  
  const hooks = getJSFiles(HOOKS_DIR);
  const hooksIssues = {};
  
  hooks.forEach((file, index) => {
    const filePath = path.join(HOOKS_DIR, file);
    const issues = auditFile(filePath);
    if (issues.length > 0) {
      hooksIssues[file] = issues;
    }
    process.stdout.write(`\r  Processing: ${index + 1}/${hooks.length}`);
  });
  
  console.log('\n');
  
  log('🔍 PHASE 3: Auditing Utils', 'PHASE');
  
  const utils = getJSFiles(UTILS_DIR);
  const utilsIssues = {};
  
  utils.forEach((file, index) => {
    const filePath = path.join(UTILS_DIR, file);
    const issues = auditFile(filePath);
    if (issues.length > 0) {
      utilsIssues[file] = issues;
    }
    process.stdout.write(`\r  Processing: ${index + 1}/${utils.length}`);
  });
  
  console.log('\n');
  
  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      componentsWithIssues: Object.keys(componentIssues).length,
      hooksWithIssues: Object.keys(hooksIssues).length,
      utilsWithIssues: Object.keys(utilsIssues).length,
      totalFilesAudited: components.length + hooks.length + utils.length
    },
    details: {
      components: componentIssues,
      hooks: hooksIssues,
      utils: utilsIssues
    }
  };
  
  const reportPath = path.join(SRC_DIR, 'REFACTORING_AUDIT.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  log(`✅ Audit complete! Report saved to ${reportPath}`, 'SUCCESS');
  log(`Components with issues: ${report.summary.componentsWithIssues}`, 'INFO');
  log(`Hooks with issues: ${report.summary.hooksWithIssues}`, 'INFO');
  log(`Utils with issues: ${report.summary.utilsWithIssues}`, 'INFO');
  
  return report;
}

/**
 * Show summary of refactoring status
 */
function showSummary() {
  log('📊 REFACTORING STATUS SUMMARY', 'SECTION');
  
  const components = getJSFiles(COMPONENTS_DIR);
  const hooks = getJSFiles(HOOKS_DIR);
  const utils = getJSFiles(UTILS_DIR);
  
  log(`✅ Components: ${components.length} files`, 'STAT');
  log(`✅ Hooks: ${hooks.length} files`, 'STAT');
  log(`✅ Utils: ${utils.length} files`, 'STAT');
  log(`✅ Total Modules: ${components.length + hooks.length + utils.length}`, 'STAT');
  
  console.log('\n');
}

// Main execution
(async () => {
  try {
    log('🚀 Focus App Refactoring Automation', 'START');
    console.log('\n');
    
    showSummary();
    const report = generateAuditReport();
    
    log('Refactoring ready to begin!', 'SUCCESS');
    log('Next steps:');
    log('  1. Review REFACTORING_AUDIT.json for detailed issues', 'INFO');
    log('  2. Start refactoring components: npm run refactor:components', 'INFO');
    log('  3. Then hooks: npm run refactor:hooks', 'INFO');
    log('  4. Then utils: npm run refactor:utils', 'INFO');
    
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'ERROR');
    process.exit(1);
  }
})();

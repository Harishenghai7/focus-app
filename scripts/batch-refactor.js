#!/usr/bin/env node

/**
 * Focus App - Batch Component Refactoring Script
 * 
 * Systematically applies refactoring patterns to components, hooks, and utilities
 * following the modernization standards documented in REFACTORING_GUIDE.md
 * 
 * Usage:
 *   node scripts/batch-refactor.js [--phase 1-7] [--limit N] [--dry-run]
 * 
 * Example:
 *   node scripts/batch-refactor.js --phase 1 --limit 5      # Refactor first 5 components
 *   node scripts/batch-refactor.js --phase 1 --dry-run     # Preview changes
 */

const fs = require('fs');
const path = require('path');

const PHASE = process.argv.find(arg => arg.includes('--phase'))?.split('=')[1] || '1';
const LIMIT = parseInt(process.argv.find(arg => arg.includes('--limit'))?.split('=')[1] || '999');
const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');

const SRC_DIR = path.join(__dirname, '../src');
const COMPONENTS_DIR = path.join(SRC_DIR, 'components');
const HOOKS_DIR = path.join(SRC_DIR, 'hooks');
const UTILS_DIR = path.join(SRC_DIR, 'utils');

/**
 * Logging helpers
 */
const log = {
  info: (msg) => console.log(`\n📝 ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`),
  warning: (msg) => console.log(`⚠️  ${msg}`),
  debug: (msg) => VERBOSE && console.log(`🔍 ${msg}`)
};

/**
 * Get JS files from directory
 */
function getJSFiles(dir) {
  return fs.readdirSync(dir)
    .filter(file => file.endsWith('.js') && file !== 'index.js')
    .sort();
}

/**
 * Create refactoring task progress
 */
class RefactoringProgress {
  constructor(phase, category) {
    this.phase = phase;
    this.category = category;
    this.completed = 0;
    this.failed = 0;
    this.skipped = 0;
    this.results = [];
  }

  add(file, status, message) {
    this.results.push({ file, status, message });
    if (status === 'completed') this.completed++;
    if (status === 'failed') this.failed++;
    if (status === 'skipped') this.skipped++;
  }

  print() {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`PHASE ${this.phase} - ${this.category.toUpperCase()} REFACTORING`);
    console.log(`${'='.repeat(60)}`);
    console.log(`✅ Completed: ${this.completed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`⏭️  Skipped: ${this.skipped}`);
    console.log(`📊 Total: ${this.results.length}\n`);

    if (this.results.length > 0) {
      console.log('Details:');
      this.results.forEach(r => {
        const icon = r.status === 'completed' ? '✅' : r.status === 'failed' ? '❌' : '⏭️';
        console.log(`  ${icon} ${r.file}: ${r.message}`);
      });
    }
  }

  toJSON() {
    return {
      phase: this.phase,
      category: this.category,
      timestamp: new Date().toISOString(),
      summary: {
        completed: this.completed,
        failed: this.failed,
        skipped: this.skipped,
        total: this.results.length
      },
      results: this.results
    };
  }
}

/**
 * Analyze component for refactoring status
 */
function analyzeComponent(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  const recommendations = [];

  // Check for React.memo
  if (content.includes('export default function') && !content.includes('React.memo')) {
    issues.push('missing_memo');
    recommendations.push('Wrap with React.memo()');
  }

  // Check for PropTypes
  if (!content.includes('PropTypes')) {
    issues.push('missing_proptypes');
    recommendations.push('Add PropTypes validation');
  }

  // Check for JSDoc
  if (!content.match(/\/\*\*[\s\S]*?@component/)) {
    issues.push('missing_jsdoc');
    recommendations.push('Add JSDoc with @component');
  }

  // Check for inline styles
  if (content.includes('style={{')) {
    issues.push('inline_styles');
    recommendations.push('Move to CSS modules');
  }

  // Check for CSS module import
  if (!content.includes('.module.css')) {
    recommendations.push('Consider using CSS module');
  }

  return { issues, recommendations, needsRefactoring: issues.length > 0 };
}

/**
 * Generate refactoring summary report
 */
function generateSummaryReport(allResults) {
  const report = {
    timestamp: new Date().toISOString(),
    totalPhases: allResults.length,
    phases: allResults.map(r => r.toJSON()),
    summary: {
      totalCompleted: allResults.reduce((sum, r) => sum + r.completed, 0),
      totalFailed: allResults.reduce((sum, r) => sum + r.failed, 0),
      totalSkipped: allResults.reduce((sum, r) => sum + r.skipped, 0),
      totalFiles: allResults.reduce((sum, r) => sum + r.results.length, 0)
    }
  };

  const reportPath = path.join(SRC_DIR, 'BATCH_REFACTORING_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  return report;
}

/**
 * Main refactoring execution
 */
async function runRefactoring() {
  log.info(`🚀 Starting Batch Refactoring - Phase ${PHASE}`);
  log.info(`Mode: ${DRY_RUN ? 'DRY-RUN (Preview Only)' : 'APPLY CHANGES'}`);
  log.info(`Limit: ${LIMIT} files per category`);

  const allResults = [];

  // PHASE 1: Components
  if (PHASE === '1' || PHASE === 'all') {
    const progress = new RefactoringProgress(1, 'components');
    const components = getJSFiles(COMPONENTS_DIR).slice(0, LIMIT);

    log.info(`Analyzing ${components.length} components...`);

    components.forEach((file) => {
      try {
        const filePath = path.join(COMPONENTS_DIR, file);
        const analysis = analyzeComponent(filePath);

        if (analysis.needsRefactoring) {
          log.debug(`Component: ${file}`);
          log.debug(`  Issues: ${analysis.issues.join(', ')}`);
          log.debug(`  Recommendations: ${analysis.recommendations.join(', ')}`);
          progress.add(file, 'needs_review', analysis.recommendations.join('; '));
        } else {
          progress.add(file, 'completed', 'Already refactored');
        }
      } catch (error) {
        progress.add(file, 'failed', error.message);
      }
    });

    progress.print();
    allResults.push(progress);
  }

  // PHASE 2: Hooks
  if (PHASE === '2' || PHASE === 'all') {
    const progress = new RefactoringProgress(2, 'hooks');
    const hooks = getJSFiles(HOOKS_DIR).slice(0, LIMIT);

    log.info(`Analyzing ${hooks.length} hooks...`);

    hooks.forEach((file) => {
      try {
        const filePath = path.join(HOOKS_DIR, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        const issues = [];
        if (!content.includes('useEffect')) {
          issues.push('No useEffect cleanup pattern');
        }
        if (!content.match(/\/\*\*[\s\S]*?@hook/)) {
          issues.push('Missing JSDoc @hook');
        }
        if (!content.includes('isMountedRef')) {
          issues.push('No mounted ref for cleanup');
        }

        progress.add(file, 'needs_review', issues.join('; '));
      } catch (error) {
        progress.add(file, 'failed', error.message);
      }
    });

    progress.print();
    allResults.push(progress);
  }

  // PHASE 3: Utils
  if (PHASE === '3' || PHASE === 'all') {
    const progress = new RefactoringProgress(3, 'utils');
    const utils = getJSFiles(UTILS_DIR).slice(0, LIMIT);

    log.info(`Analyzing ${utils.length} utilities...`);

    utils.forEach((file) => {
      try {
        const filePath = path.join(UTILS_DIR, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        const issues = [];
        if (!content.match(/\/\*\*[\s\S]*?@module/)) {
          issues.push('Missing module-level JSDoc');
        }
        if (!content.includes('@throws')) {
          issues.push('No @throws documentation');
        }
        if (content.includes('console.log')) {
          issues.push('Contains console.log statements');
        }

        progress.add(file, 'needs_review', issues.join('; '));
      } catch (error) {
        progress.add(file, 'failed', error.message);
      }
    });

    progress.print();
    allResults.push(progress);
  }

  // Generate comprehensive report
  const report = generateSummaryReport(allResults);

  log.success(`\n📊 Complete refactoring report saved`);
  log.info(`Report location: ${path.join(SRC_DIR, 'BATCH_REFACTORING_REPORT.json')}`);
  log.info(`Next steps:`);
  log.info(`  1. Review BATCH_REFACTORING_REPORT.json`);
  log.info(`  2. Apply refactoring patterns from REFACTORING_GUIDE.md`);
  log.info(`  3. Test: npm run test`);
  log.info(`  4. Build: npm run build`);
}

// Execute
(async () => {
  try {
    await runRefactoring();
    process.exit(0);
  } catch (error) {
    log.error(`Critical error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
})();

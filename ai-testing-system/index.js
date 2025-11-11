#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ManualGuideValidator = require('./manual-guide-validator');

class AITestingSystem {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.testResults = {
      timestamp: new Date().toISOString(),
      summary: {},
      issues: [],
      recommendations: [],
      coverage: {},
      performance: {},
      accessibility: {},
      security: {}
    };
  }

  async runComprehensiveAnalysis() {
    console.log('🤖 AI Testing System - Starting Comprehensive Analysis...\n');
    
    try {
      await this.analyzeProjectStructure();
      await this.analyzeTestingGuides();
      await this.validateManualGuide();
      await this.runAutomatedTests();
      await this.analyzeCodeQuality();
      await this.checkAccessibility();
      await this.securityAnalysis();
      await this.performanceAnalysis();
      await this.generateReport();
      
    } catch (error) {
      console.error('❌ Analysis failed:', error.message);
      this.testResults.issues.push({
        type: 'SYSTEM_ERROR',
        severity: 'CRITICAL',
        message: `Analysis system error: ${error.message}`,
        file: 'ai-testing-system',
        line: 0
      });
    }
  }

  async analyzeProjectStructure() {
    console.log('📁 Analyzing project structure...');
    
    const requiredFiles = [
      'package.json',
      'src/index.js',
      'public/index.html',
      'cypress.config.js'
    ];
    
    const missingFiles = [];
    const foundFiles = [];
    
    for (const file of requiredFiles) {
      const filePath = path.join(this.projectRoot, file);
      if (fs.existsSync(filePath)) {
        foundFiles.push(file);
      } else {
        missingFiles.push(file);
        this.testResults.issues.push({
          type: 'MISSING_FILE',
          severity: 'HIGH',
          message: `Required file missing: ${file}`,
          file: file,
          line: 0,
          recommendation: `Create ${file} with appropriate content`
        });
      }
    }
    
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(this.projectRoot, 'package.json'), 'utf8'));
      this.analyzePackageJson(packageJson);
    } catch (error) {
      this.testResults.issues.push({
        type: 'INVALID_PACKAGE_JSON',
        severity: 'HIGH',
        message: 'package.json is invalid or unreadable',
        file: 'package.json',
        line: 0
      });
    }
    
    console.log(`✅ Found ${foundFiles.length} required files`);
    if (missingFiles.length > 0) {
      console.log(`⚠️  Missing ${missingFiles.length} required files`);
    }
  }

  analyzePackageJson(packageJson) {
    const requiredDeps = ['react', 'react-dom'];
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    for (const dep of requiredDeps) {
      if (!deps[dep]) {
        this.testResults.issues.push({
          type: 'MISSING_DEPENDENCY',
          severity: 'HIGH',
          message: `Missing required dependency: ${dep}`,
          file: 'package.json',
          line: 0,
          recommendation: `Run: npm install ${dep}`
        });
      }
    }
  }

  async validateManualGuide() {
    console.log('📋 Validating against Manual Testing Guide...');
    
    const validator = new ManualGuideValidator();
    const validationResults = await validator.generateReport();
    
    // Add validation results to main report
    this.testResults.manualGuideValidation = validationResults;
    
    // Convert missing features to issues
    validationResults.missing.forEach(missing => {
      this.testResults.issues.push({
        type: 'MISSING_FEATURE',
        severity: 'HIGH',
        message: `Missing feature: ${missing.feature}`,
        file: missing.expectedFiles.join(', '),
        line: 0,
        recommendation: `Implement ${missing.feature} as described in Manual Testing Guide`
      });
    });
    
    // Add bugs from validation
    validationResults.bugs.forEach(bug => {
      this.testResults.issues.push({
        type: bug.type,
        severity: bug.severity.toUpperCase(),
        message: bug.message,
        file: 'project',
        line: 0,
        recommendation: bug.recommendation
      });
    });
    
    console.log(`✅ Manual guide validation complete: ${validationResults.summary.implementedFeatures}/${validationResults.summary.totalFeatures} features implemented`);
  }

  async analyzeTestingGuides() {
    console.log('📖 Analyzing testing guides and documentation...');
    
    const guideFiles = [
      'docs/Manual-Testing-Guide.md',
      'docs/USER_GUIDE.md',
      'cypress/e2e'
    ];
    
    for (const guide of guideFiles) {
      const guidePath = path.join(this.projectRoot, guide);
      if (fs.existsSync(guidePath)) {
        if (guide.endsWith('.md')) {
          const content = fs.readFileSync(guidePath, 'utf8');
          this.analyzeTestingGuideContent(guide, content);
        } else if (guide === 'cypress/e2e') {
          this.analyzeCypressTests(guidePath);
        }
      } else {
        this.testResults.issues.push({
          type: 'MISSING_GUIDE',
          severity: 'MEDIUM',
          message: `Testing guide missing: ${guide}`,
          file: guide,
          line: 0,
          recommendation: `Create comprehensive testing guide at ${guide}`
        });
      }
    }
  }

  analyzeTestingGuideContent(fileName, content) {
    const requiredSections = ['authentication', 'navigation', 'functionality'];
    const foundSections = content.toLowerCase();
    
    for (const required of requiredSections) {
      if (!foundSections.includes(required)) {
        this.testResults.issues.push({
          type: 'INCOMPLETE_GUIDE',
          severity: 'MEDIUM',
          message: `Testing guide missing section: ${required}`,
          file: fileName,
          line: 0,
          recommendation: `Add comprehensive ${required} testing section`
        });
      }
    }
  }

  analyzeCypressTests(cypressDir) {
    const testFiles = fs.readdirSync(cypressDir).filter(f => f.endsWith('.cy.js'));
    this.testResults.coverage.testFiles = testFiles.length;
    
    for (const testFile of testFiles) {
      const testPath = path.join(cypressDir, testFile);
      const content = fs.readFileSync(testPath, 'utf8');
      this.analyzeTestFile(testFile, content);
    }
  }

  analyzeTestFile(fileName, content) {
    const hasDescribe = content.includes('describe(');
    const hasIt = content.includes('it(');
    const hasAssertions = content.includes('expect(');
    
    if (!hasDescribe || !hasIt) {
      this.testResults.issues.push({
        type: 'INVALID_TEST_STRUCTURE',
        severity: 'HIGH',
        message: `Test file has invalid structure: ${fileName}`,
        file: `cypress/e2e/${fileName}`,
        line: 0,
        recommendation: 'Use proper describe() and it() blocks'
      });
    }
    
    if (!hasAssertions) {
      this.testResults.issues.push({
        type: 'NO_ASSERTIONS',
        severity: 'HIGH',
        message: `Test file has no assertions: ${fileName}`,
        file: `cypress/e2e/${fileName}`,
        line: 0,
        recommendation: 'Add expect() assertions to verify behavior'
      });
    }
    
    const testCases = (content.match(/it\(/g) || []).length;
    this.testResults.coverage.totalTests = (this.testResults.coverage.totalTests || 0) + testCases;
  }

  async runAutomatedTests() {
    console.log('🧪 Running automated tests...');
    
    try {
      const cypressResult = execSync('npx cypress run --headless --reporter json', {
        cwd: this.projectRoot,
        encoding: 'utf8',
        timeout: 300000
      });
      
      const results = JSON.parse(cypressResult);
      this.processCypressResults(results);
      
    } catch (error) {
      const errorOutput = error.stdout || error.stderr || error.message;
      this.processCypressError(errorOutput);
    }
  }

  processCypressResults(results) {
    if (results.runs) {
      for (const run of results.runs) {
        this.testResults.coverage.passedTests = (this.testResults.coverage.passedTests || 0) + (run.stats?.passes || 0);
        this.testResults.coverage.failedTests = (this.testResults.coverage.failedTests || 0) + (run.stats?.failures || 0);
        
        if (run.tests) {
          for (const test of run.tests) {
            if (test.state === 'failed') {
              this.testResults.issues.push({
                type: 'TEST_FAILURE',
                severity: 'HIGH',
                message: `Test failed: ${test.title}`,
                file: run.spec?.relative || 'unknown',
                line: 0,
                details: test.err?.message || 'No error details',
                recommendation: 'Fix the failing test case'
              });
            }
          }
        }
      }
    }
  }

  processCypressError(errorOutput) {
    if (errorOutput.includes('ECONNREFUSED')) {
      this.testResults.issues.push({
        type: 'SERVER_NOT_RUNNING',
        severity: 'CRITICAL',
        message: 'Application server is not running',
        file: 'server',
        line: 0,
        recommendation: 'Start the application server before running tests'
      });
    }
    
    if (errorOutput.includes('spec files were found')) {
      this.testResults.issues.push({
        type: 'NO_TEST_FILES',
        severity: 'HIGH',
        message: 'No test files found',
        file: 'cypress/e2e',
        line: 0,
        recommendation: 'Create test files in cypress/e2e directory'
      });
    }
  }

  async analyzeCodeQuality() {
    console.log('🔍 Analyzing code quality...');
    
    const srcDir = path.join(this.projectRoot, 'src');
    if (fs.existsSync(srcDir)) {
      this.analyzeSourceCode(srcDir);
    }
  }

  analyzeSourceCode(srcDir) {
    const files = this.getAllFiles(srcDir, ['.js', '.jsx', '.ts', '.tsx']);
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(this.projectRoot, file);
      this.checkCodeIssues(relativePath, content);
    }
  }

  checkCodeIssues(filePath, content) {
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      
      if (line.includes('console.log') && !line.trim().startsWith('//')) {
        this.testResults.issues.push({
          type: 'DEBUG_CODE',
          severity: 'LOW',
          message: 'Console.log statement found',
          file: filePath,
          line: lineNum,
          recommendation: 'Remove console.log statements before production'
        });
      }
      
      if (line.includes('TODO') || line.includes('FIXME')) {
        this.testResults.issues.push({
          type: 'TODO_COMMENT',
          severity: 'LOW',
          message: 'TODO/FIXME comment found',
          file: filePath,
          line: lineNum,
          recommendation: 'Complete or remove TODO items'
        });
      }
    });
  }

  getAllFiles(dir, extensions) {
    let files = [];
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        files = files.concat(this.getAllFiles(fullPath, extensions));
      } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  async checkAccessibility() {
    console.log('♿ Checking accessibility...');
    
    const indexHtml = path.join(this.projectRoot, 'public', 'index.html');
    
    if (fs.existsSync(indexHtml)) {
      const content = fs.readFileSync(indexHtml, 'utf8');
      this.checkHtmlAccessibility(content);
    }
  }

  checkHtmlAccessibility(content) {
    if (!content.includes('lang=')) {
      this.testResults.accessibility.issues = this.testResults.accessibility.issues || [];
      this.testResults.accessibility.issues.push({
        type: 'MISSING_LANG_ATTRIBUTE',
        message: 'HTML lang attribute missing',
        recommendation: 'Add lang attribute to html tag'
      });
    }
  }

  async securityAnalysis() {
    console.log('🔒 Running security analysis...');
    
    const gitignore = path.join(this.projectRoot, '.gitignore');
    if (fs.existsSync(gitignore)) {
      const gitignoreContent = fs.readFileSync(gitignore, 'utf8');
      if (!gitignoreContent.includes('.env')) {
        this.testResults.security.issues = this.testResults.security.issues || [];
        this.testResults.security.issues.push({
          type: 'ENV_NOT_GITIGNORED',
          message: '.env files not in .gitignore',
          recommendation: 'Add .env* to .gitignore'
        });
      }
    }
  }

  async performanceAnalysis() {
    console.log('⚡ Analyzing performance...');
    
    const buildDir = path.join(this.projectRoot, 'build');
    if (fs.existsSync(buildDir)) {
      this.analyzeBuildSize(buildDir);
    }
  }

  analyzeBuildSize(buildDir) {
    try {
      const staticDir = path.join(buildDir, 'static');
      if (fs.existsSync(staticDir)) {
        const jsFiles = this.getAllFiles(staticDir, ['.js']);
        let totalSize = 0;
        
        for (const file of jsFiles) {
          const stats = fs.statSync(file);
          totalSize += stats.size;
        }
        
        this.testResults.performance.bundleSize = totalSize;
        
        if (totalSize > 1024 * 1024) {
          this.testResults.issues.push({
            type: 'LARGE_BUNDLE_SIZE',
            severity: 'MEDIUM',
            message: `Bundle size is large: ${(totalSize / 1024 / 1024).toFixed(2)}MB`,
            file: 'build',
            line: 0,
            recommendation: 'Consider code splitting and lazy loading'
          });
        }
      }
    } catch (error) {
      // Build analysis failed
    }
  }

  async generateReport() {
    console.log('📊 Generating comprehensive report...');
    
    this.testResults.summary = {
      totalIssues: this.testResults.issues.length,
      criticalIssues: this.testResults.issues.filter(i => i.severity === 'CRITICAL').length,
      highIssues: this.testResults.issues.filter(i => i.severity === 'HIGH').length,
      mediumIssues: this.testResults.issues.filter(i => i.severity === 'MEDIUM').length,
      lowIssues: this.testResults.issues.filter(i => i.severity === 'LOW').length,
      testCoverage: this.calculateTestCoverage(),
      overallScore: this.calculateOverallScore()
    };
    
    this.generateRecommendations();
    
    const reportPath = path.join(this.projectRoot, 'ai-testing-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.testResults, null, 2));
    
    const htmlReport = this.generateHtmlReport();
    const htmlReportPath = path.join(this.projectRoot, 'ai-testing-report.html');
    fs.writeFileSync(htmlReportPath, htmlReport);
    
    this.printSummary();
    
    console.log(`\n📄 Detailed reports saved:`);
    console.log(`   JSON: ${reportPath}`);
    console.log(`   HTML: ${htmlReportPath}`);
  }

  calculateTestCoverage() {
    const total = this.testResults.coverage.totalTests || 0;
    const passed = this.testResults.coverage.passedTests || 0;
    return total > 0 ? Math.round((passed / total) * 100) : 0;
  }

  calculateOverallScore() {
    let score = 100;
    
    score -= (this.testResults.summary.criticalIssues * 20);
    score -= (this.testResults.summary.highIssues * 10);
    score -= (this.testResults.summary.mediumIssues * 5);
    score -= (this.testResults.summary.lowIssues * 1);
    
    const coverage = this.calculateTestCoverage();
    if (coverage > 80) score += 10;
    else if (coverage > 60) score += 5;
    
    return Math.max(0, Math.min(100, score));
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.testResults.summary.criticalIssues > 0) {
      recommendations.push({
        priority: 'CRITICAL',
        title: 'Fix Critical Issues First',
        description: `You have ${this.testResults.summary.criticalIssues} critical issues that need immediate attention.`,
        action: 'Review and fix all critical issues before proceeding with other improvements.'
      });
    }
    
    if (this.testResults.summary.testCoverage < 50) {
      recommendations.push({
        priority: 'HIGH',
        title: 'Improve Test Coverage',
        description: `Test coverage is only ${this.testResults.summary.testCoverage}%. This is below recommended levels.`,
        action: 'Add more comprehensive test cases to cover core functionality.'
      });
    }
    
    this.testResults.recommendations = recommendations;
  }

  generateHtmlReport() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Testing Report - Focus App</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .score { font-size: 3em; font-weight: bold; margin: 10px 0; }
        .content { padding: 30px; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
        .issue { background: #f8f9fa; border-left: 4px solid #dc3545; padding: 15px; margin: 10px 0; border-radius: 4px; }
        .issue.high { border-left-color: #dc3545; }
        .issue.medium { border-left-color: #ffc107; }
        .issue.low { border-left-color: #28a745; }
        .issue.critical { border-left-color: #6f42c1; background: #f8f4ff; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .stat { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .stat-number { font-size: 2em; font-weight: bold; color: #667eea; }
        .recommendation { background: #e7f3ff; border: 1px solid #b3d9ff; padding: 15px; margin: 10px 0; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 AI Testing Report</h1>
            <p>Focus App - Generated on ${new Date().toLocaleString()}</p>
            <div class="score">${this.testResults.summary.overallScore}/100</div>
            <p>Overall Quality Score</p>
        </div>
        
        <div class="content">
            <div class="section">
                <h2>📊 Summary Statistics</h2>
                <div class="stats">
                    <div class="stat">
                        <div class="stat-number">${this.testResults.summary.totalIssues}</div>
                        <div>Total Issues</div>
                    </div>
                    <div class="stat">
                        <div class="stat-number">${this.testResults.summary.testCoverage}%</div>
                        <div>Test Coverage</div>
                    </div>
                    <div class="stat">
                        <div class="stat-number">${this.testResults.coverage.totalTests || 0}</div>
                        <div>Total Tests</div>
                    </div>
                    <div class="stat">
                        <div class="stat-number">${this.testResults.coverage.passedTests || 0}</div>
                        <div>Passed Tests</div>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>🎯 Priority Recommendations</h2>
                ${this.testResults.recommendations.map(rec => `
                    <div class="recommendation">
                        <h3>${rec.title}</h3>
                        <p>${rec.description}</p>
                        <strong>Action:</strong> ${rec.action}
                    </div>
                `).join('')}
            </div>
            
            ${this.testResults.manualGuideValidation ? `
            <div class="section">
                <h2>📋 Manual Guide Validation</h2>
                <div class="stats">
                    <div class="stat">
                        <div class="stat-number">${this.testResults.manualGuideValidation.summary.completionRate}%</div>
                        <div>Feature Completion</div>
                    </div>
                    <div class="stat">
                        <div class="stat-number">${this.testResults.manualGuideValidation.summary.implementedFeatures}</div>
                        <div>Implemented Features</div>
                    </div>
                    <div class="stat">
                        <div class="stat-number">${this.testResults.manualGuideValidation.summary.missingFeatures}</div>
                        <div>Missing Features</div>
                    </div>
                </div>
                
                <h3>📋 Feature Groups</h3>
                ${this.testResults.manualGuideValidation.features.map(group => `
                    <div class="recommendation">
                        <h4>${group.name} (${group.implemented}/${group.total})</h4>
                        <div style="margin-left: 20px;">
                            ${group.features.map(feature => `
                                <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                                    <span>${feature.name}</span>
                                    <span style="color: ${feature.status === 'implemented' ? '#28a745' : '#dc3545'}">
                                        ${feature.status.toUpperCase()}
                                    </span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
            ` : ''}
            
            <div class="section">
                <h2>🐛 Issues Found</h2>
                ${this.testResults.issues.map(issue => `
                    <div class="issue ${issue.severity.toLowerCase()}">
                        <h4>${issue.type}: ${issue.message}</h4>
                        <p><strong>File:</strong> ${issue.file} ${issue.line ? `(Line ${issue.line})` : ''}</p>
                        ${issue.details ? `<p><strong>Details:</strong> ${issue.details}</p>` : ''}
                        ${issue.recommendation ? `<p><strong>Recommendation:</strong> ${issue.recommendation}</p>` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('🤖 AI TESTING SYSTEM - ANALYSIS COMPLETE');
    console.log('='.repeat(60));
    console.log(`📊 Overall Score: ${this.testResults.summary.overallScore}/100`);
    console.log(`🐛 Total Issues: ${this.testResults.summary.totalIssues}`);
    console.log(`   ❌ Critical: ${this.testResults.summary.criticalIssues}`);
    console.log(`   🔴 High: ${this.testResults.summary.highIssues}`);
    console.log(`   🟡 Medium: ${this.testResults.summary.mediumIssues}`);
    console.log(`   🟢 Low: ${this.testResults.summary.lowIssues}`);
    console.log(`🧪 Test Coverage: ${this.testResults.summary.testCoverage}%`);
    console.log(`✅ Tests Passed: ${this.testResults.coverage.passedTests || 0}/${this.testResults.coverage.totalTests || 0}`);
    
    if (this.testResults.summary.criticalIssues > 0) {
      console.log('\n🚨 CRITICAL ISSUES REQUIRE IMMEDIATE ATTENTION!');
    } else if (this.testResults.summary.overallScore >= 80) {
      console.log('\n🎉 Great job! Your app is in good shape for production.');
    } else if (this.testResults.summary.overallScore >= 60) {
      console.log('\n👍 Good progress! Address the high-priority issues to improve quality.');
    } else {
      console.log('\n⚠️  Your app needs significant improvements before production deployment.');
    }
    
    console.log('\n📋 Next Steps:');
    this.testResults.recommendations.slice(0, 3).forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec.title}`);
    });
    
    console.log('\n📄 View detailed reports:');
    console.log('   - ai-testing-report.html (Open in browser)');
    console.log('   - ai-testing-report.json (Raw data)');
    console.log('='.repeat(60));
  }
}

if (require.main === module) {
  const system = new AITestingSystem();
  system.runComprehensiveAnalysis().catch(console.error);
}

module.exports = AITestingSystem;
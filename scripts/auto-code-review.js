const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  srcDir: path.join(__dirname, '..', 'src'),
  outputDir: path.join(__dirname, '..', 'review-report'),
  filesToScan: ['.js', '.jsx', '.ts', '.tsx'],
  ignorePatterns: [
    'node_modules',
    'build',
    'dist',
    '.git',
    'coverage',
    '__tests__',
    '.test.',
    '.spec.'
  ]
};

// Common bug patterns to detect
const bugPatterns = [
  {
    name: 'Exposed Credentials',
    pattern: /(dsn|api_key|secret|password|token)s*[:=]s*['"][^'"]+['"]/gi,
    severity: 'CRITICAL',
    fix: 'Move to environment variables'
  },
  {
    name: 'Console.log in Production',
    pattern: /console.(log|warn|error|debug)(/gi,
    severity: 'MEDIUM',
    fix: 'Remove or wrap in development check'
  },
  {
    name: 'Missing Error Handling',
    pattern: /awaits+[^;]+;(?!s*.catch)/g,
    severity: 'HIGH',
    fix: 'Add try-catch or .catch()'
  },
  {
    name: 'Unsafe innerHTML',
    pattern: /dangerouslySetInnerHTML|innerHTMLs*=/gi,
    severity: 'HIGH',
    fix: 'Use safe rendering or sanitize input'
  },
  {
    name: 'Missing Cleanup in useEffect',
    pattern: /useEffect([^)]*)s*;/g,
    severity: 'MEDIUM',
    fix: 'Add return cleanup function'
  },
  {
    name: 'Direct State Mutation',
    pattern: /state.[a-zA-Z]+s*=/g,
    severity: 'HIGH',
    fix: 'Use setState or state update function'
  },
  {
    name: 'Missing Key Prop',
    pattern: /.map([^)]+)s*=>s*<(?!.*key=)/g,
    severity: 'MEDIUM',
    fix: 'Add unique key prop to mapped elements'
  }
];

// Scan files recursively
function scanDirectory(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!config.ignorePatterns.some(pattern => filePath.includes(pattern))) {
        scanDirectory(filePath, fileList);
      }
    } else {
      const ext = path.extname(file);
      if (config.filesToScan.includes(ext)) {
        fileList.push(filePath);
      }
    }
  });
  
  return fileList;
}

// Analyze file for bugs
function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(config.srcDir, filePath);
  const issues = [];
  
  bugPatterns.forEach(pattern => {
    let match;
    const regex = new RegExp(pattern.pattern);
    let lineNumber = 1;
    const lines = content.split('
');
    
    lines.forEach((line, index) => {
      if (regex.test(line)) {
        issues.push({
          file: relativePath,
          line: index + 1,
          severity: pattern.severity,
          issue: pattern.name,
          code: line.trim(),
          fix: pattern.fix
        });
      }
    });
  });
  
  return issues;
}

// Generate report
function generateReport(allIssues) {
  if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true });
  }
  
  const reportPath = path.join(config.outputDir, 'bug-report.md');
  const jsonPath = path.join(config.outputDir, 'bug-report.json');
  
  // Sort by severity
  const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  allIssues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  
  // Generate markdown report
  let markdown = `# 🔍 Focus App - Automated Code Review Report

`;
  markdown += `**Generated:** ${new Date().toLocaleString()}
`;
  markdown += `**Total Issues Found:** ${allIssues.length}

`;
  
  // Summary by severity
  const bySeverity = allIssues.reduce((acc, issue) => {
    acc[issue.severity] = (acc[issue.severity] || 0) + 1;
    return acc;
  }, {});
  
  markdown += `## 📊 Summary

`;
  Object.entries(bySeverity).forEach(([severity, count]) => {
    const emoji = {
      CRITICAL: '🔴',
      HIGH: '🟠',
      MEDIUM: '🟡',
      LOW: '🟢'
    }[severity];
    markdown += `- ${emoji} **${severity}:** ${count} issues
`;
  });
  
  markdown += `
---

`;
  
  // Detailed issues
  markdown += `## 🐛 Detailed Issues

`;
  
  allIssues.forEach((issue, index) => {
    markdown += `### ${index + 1}. ${issue.issue} - ${issue.severity}

`;
    markdown += `**File:** `${issue.file}` (Line ${issue.line})

`;
    markdown += `**Code:**
```javascript
${issue.code}
```

`;
    markdown += `**Fix:** ${issue.fix}

`;
    markdown += `---

`;
  });
  
  fs.writeFileSync(reportPath, markdown);
  fs.writeFileSync(jsonPath, JSON.stringify(allIssues, null, 2));
  
  console.log(`
✅ Report generated:`);
  console.log(`📄 Markdown: ${reportPath}`);
  console.log(`📦 JSON: ${jsonPath}`);
}

// Main execution
console.log('🔍 Starting automated code review...
');

const files = scanDirectory(config.srcDir);
console.log(`📁 Found ${files.length} files to analyze
`);

const allIssues = [];
let filesWithIssues = 0;

files.forEach(file => {
  const issues = analyzeFile(file);
  if (issues.length > 0) {
    filesWithIssues++;
    allIssues.push(...issues);
  }
});

console.log(`
📊 Analysis complete!`);
console.log(` Files scanned: ${files.length}`);
console.log(` Files with issues: ${filesWithIssues}`);
console.log(` Total issues: ${allIssues.length}
`);

generateReport(allIssues);

console.log(`
🎉 Done! Check the review-report folder for details.`);

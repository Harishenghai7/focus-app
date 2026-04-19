/**
 * Connection Checker Script
 * Analyzes all imports in the project to find broken connections and orphaned files
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const results = {
    brokenImports: [],
    missingFiles: [],
    circularDeps: [],
    unusedFiles: [],
    summary: {
        totalFiles: 0,
        totalImports: 0,
        errors: 0,
        unusedFiles: 0
    }
};

// Track all files and their imports
const fileImports = new Map();
const allFiles = new Set();

function getAllJsFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            if (!file.startsWith('.') && file !== 'node_modules') {
                getAllJsFiles(filePath, fileList);
            }
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
            fileList.push(filePath);
            allFiles.add(filePath);
        }
    });

    return fileList;
}

function extractImports(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const imports = [];

    // Match import statements
    const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"]/g;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
        imports.push(match[1]);
    }

    return imports;
}

function resolveImportPath(fromFile, importPath) {
    // Skip node_modules and external packages
    if (!importPath.startsWith('.')) {
        return null; // External dependency
    }

    const fromDir = path.dirname(fromFile);
    let resolved = path.resolve(fromDir, importPath);

    // Try different extensions/resolutions
    const alternatives = [
        '',
        '.js',
        '.jsx',
        '/index.js',
        '/index.jsx'
    ];

    for (const ext of alternatives) {
        const testPath = resolved + ext;
        if (fs.existsSync(testPath) && fs.statSync(testPath).isFile()) {
            return testPath;
        }
    }

    return resolved; // Return unresolved path for error reporting
}

function checkFile(filePath) {
    const imports = extractImports(filePath);
    const fileImportData = {
        path: filePath,
        imports: [],
        errors: []
    };

    imports.forEach(importPath => {
        const resolved = resolveImportPath(filePath, importPath);

        if (resolved) {
            const isExternal = !importPath.startsWith('.');
            if (!isExternal) {
                // It was a relative path, did we find it?
                // resolveImportPath returns the path if found, or the resolved path if NOT found.
                // We need to check if it exists again or rely on our logic slightly differently.
                // My resolveImportPath logic returns a path if it finds a file match with extensions.
                // If it returns the raw resolved path (without extension match), it essentially "failed" if the file doesn't exist there.

                // Let's refine:
                // If it found a file, fs.existsSync(resolved) is true.
                // If it didn't find a file (tried all exts), it returns the base resolved path.
                // But that base resolved path might not exist.

                if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
                    fileImportData.imports.push(resolved);
                } else {
                    fileImportData.errors.push({
                        import: importPath,
                        resolved: resolved,
                        error: 'File not found'
                    });
                    results.brokenImports.push({
                        file: filePath.replace(srcDir, 'src'),
                        import: importPath,
                        resolved: resolved.replace(srcDir, 'src')
                    });
                    results.summary.errors++;
                }
            } else {
                // External package, ignore
            }
            results.summary.totalImports++;
        }
    });

    fileImports.set(filePath, fileImportData);
}

function findOrphans() {
    const importedFiles = new Set();

    // Collect all files that are imported at least once
    fileImports.forEach((data) => {
        data.imports.forEach(imp => importedFiles.add(imp));
    });

    // usage whitelist (entry points, config files, tests)
    const whitelistPatterns = [
        /src\\index\.js$/,
        /src\\index\.css$/,
        /src\\App\.js$/,
        /src\\setupTests\.js$/,
        /src\\reportWebVitals\.js$/,
        /src\\pages\\/, // Pages are usually entry points for routes
        /\.test\.js$/,
        /\.spec\.js$/,
        /src\\lib\\/,   // Lib files might be implicit
        /src\\styles\\/,
        /generated/,
    ];

    allFiles.forEach(file => {
        if (!importedFiles.has(file)) {
            // Check whitelist
            const isEntry = whitelistPatterns.some(p => p.test(file));
            if (!isEntry) {
                results.unusedFiles.push(file.replace(srcDir, 'src'));
            }
        }
    });

    results.summary.unusedFiles = results.unusedFiles.length;
}

function generateReport() {
    findOrphans();

    console.log('\n' + '='.repeat(80));
    console.log('CONNECTION ANALYSIS REPORT');
    console.log('='.repeat(80));

    console.log('\n📊 SUMMARY:');
    console.log(`   Total Files Analyzed: ${results.summary.totalFiles}`);
    console.log(`   Total Imports Found: ${results.summary.totalImports}`);
    console.log(`   Broken Imports: ${results.brokenImports.length}`);
    console.log(`   Potentially Unused Files: ${results.summary.unusedFiles}`);

    if (results.brokenImports.length > 0) {
        console.log('\n❌ BROKEN IMPORTS:');
        console.log('='.repeat(80));

        // Group by file
        const byFile = {};
        results.brokenImports.forEach(item => {
            if (!byFile[item.file]) {
                byFile[item.file] = [];
            }
            byFile[item.file].push(item);
        });

        Object.keys(byFile).forEach(file => {
            console.log(`\n📄 ${file}`);
            byFile[file].forEach(item => {
                console.log(`   ❌ import '${item.import}'`);
                console.log(`      → Expected: ${item.resolved}`);
            });
        });
    } else {
        console.log('\n✅ No broken imports found!');
    }

    if (results.unusedFiles.length > 0) {
        console.log('\n⚠️ POTENTIALLY UNUSED FILES (First 20):');
        console.log('='.repeat(80));
        results.unusedFiles.slice(0, 20).forEach(file => {
            console.log(`   • ${file}`);
        });
        if (results.unusedFiles.length > 20) {
            console.log(`   ... and ${results.unusedFiles.length - 20} more`);
        }
    }

    // Save detailed report
    const reportPath = path.join(__dirname, 'connection-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n📝 Detailed report saved to: connection-report.json`);

    console.log('\n' + '='.repeat(80));
}

// Main execution
console.log('🔍 Scanning project for connection issues...\n');

const allJsFiles = getAllJsFiles(srcDir);
results.summary.totalFiles = allJsFiles.length;

console.log(`Found ${allJsFiles.length} JavaScript files\n`);
console.log('Analyzing imports...\n');

allJsFiles.forEach((file, index) => {
    if (index % 50 === 0) {
        console.log(`Progress: ${index}/${allJsFiles.length} files analyzed...`);
    }
    checkFile(file);
});

console.log(`\nAnalysis complete!`);
generateReport();

// Exit with error code if issues found
process.exit(results.brokenImports.length > 0 ? 1 : 0);

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const srcDir = path.join(rootDir, 'src');

function shouldProcessFile(filePath) {
    const ext = path.extname(filePath);
    return ['.js', '.jsx', '.ts', '.tsx'].includes(ext);
}

function purgeConsoleLogs(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        let modified = false;
        const newLines = lines.map(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith('console.log(') || trimmed.startsWith('console.log (')) {
                modified = true;
                return '';
            }
            return line;
        });

        if (modified) {
            fs.writeFileSync(filePath, newLines.join('\n'));
            return true;
        }
        return false;
    } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message);
        return false;
    }
}

function walkDir(dir, callback) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.git') {
                walkDir(filePath, callback);
            }
        } else if (shouldProcessFile(filePath)) {
            callback(filePath);
        }
    }
}

let modifiedCount = 0;

walkDir(srcDir, (filePath) => {
    if (purgeConsoleLogs(filePath)) {
        modifiedCount++;
        console.log(`Purged: ${filePath}`);
    }
});

console.log(`\nTotal files modified: ${modifiedCount}`);

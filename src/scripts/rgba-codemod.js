const fs = require('fs');
const path = require('path');

const DIRECTORIES_TO_SCAN = [
    path.join(__dirname, '../components'),
    path.join(__dirname, '../pages')
];

// RGB to Variable Mapping
const RGB_MAP = {
    // Sovereign Black Base
    '0,0,0': 'var(--bg-primary-rgb)',
    '0, 0, 0': 'var(--bg-primary-rgb)',
    '10,10,10': 'var(--bg-secondary-rgb)',
    '10, 10, 10': 'var(--bg-secondary-rgb)',
    
    // Lavenders
    '139,92,246': 'var(--primary-rgb)',
    '139, 92, 246': 'var(--primary-rgb)',
    '126,87,194': 'var(--primary-rgb)',
    '126, 87, 194': 'var(--primary-rgb)',
    
    // Status
    '239,68,68': 'var(--error-rgb)',
    '239, 68, 68': 'var(--error-rgb)',
    '16,185,129': 'var(--success-rgb)',
    '16, 185, 129': 'var(--success-rgb)',
    '245,158,11': 'var(--warning-rgb)',
    '245, 158, 11': 'var(--warning-rgb)',
    
    // Whites / Texts
    '255,255,255': 'var(--text-primary-rgb)',
    '255, 255, 255': 'var(--text-primary-rgb)'
};

function getAllCssFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function(file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllCssFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            if (file.endsWith('.css')) {
                arrayOfFiles.push(path.join(dirPath, "/", file));
            }
        }
    });

    return arrayOfFiles;
}

function processFiles() {
    let allCssFiles = [];
    DIRECTORIES_TO_SCAN.forEach(dir => {
        if (fs.existsSync(dir)) {
            allCssFiles = getAllCssFiles(dir, allCssFiles);
        }
    });

    let totalReplacements = 0;

    allCssFiles.forEach(file => {
        let content = fs.readFileSync(file, 'utf8');
        let originalContent = content;
        
        // Match rgba(...) or rgb(...)
        const rgbaRegex = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/g;
        
        content = content.replace(rgbaRegex, (match, r, g, b, a) => {
            const rgbStr = `${r}, ${g}, ${b}`;
            const rgbStrNoSpace = `${r},${g},${b}`;
            
            let mappedVar = RGB_MAP[rgbStr] || RGB_MAP[rgbStrNoSpace];
            
            if (mappedVar) {
                totalReplacements++;
                if (a !== undefined) {
                    return `rgba(${mappedVar}, ${a})`;
                } else {
                    return `rgb(${mappedVar})`; // Assuming the browser will parse rgb(var(--x-rgb)) fine
                }
            }
            
            return match; // return original if no mapping found
        });

        if (content !== originalContent) {
            fs.writeFileSync(file, content, 'utf8');
            console.log(`Updated RGBA in ${path.basename(file)}`);
        }
    });

    console.log(`\nRGBA Theme Codemod Complete! Replaced ${totalReplacements} hardcoded rgb/rgba colors with Universal Theme tokens.`);
}

processFiles();

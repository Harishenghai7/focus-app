const fs = require('fs');
const path = require('path');

const DIRECTORIES_TO_SCAN = [
    path.join(__dirname, '../components'),
    path.join(__dirname, '../pages')
];

// Hex color to Universal Theme Variable Mapping
const COLOR_MAP = {
    // Backgrounds (Sovereign Black Base)
    '#000': 'var(--bg-primary)',
    '#000000': 'var(--bg-primary)',
    '#050505': 'var(--bg-primary)',
    '#111827': 'var(--bg-primary)',
    '#0d0018': 'var(--bg-primary)',
    '#120b24': 'var(--bg-primary)',
    '#0a0a0a': 'var(--bg-secondary)',
    '#111111': 'var(--bg-secondary)',
    '#160d2a': 'var(--bg-secondary)',
    '#1a1a1a': 'var(--bg-secondary)',
    '#1f2937': 'var(--bg-secondary)',
    '#282828': 'var(--bg-secondary)',
    '#1e1235': 'var(--bg-elevated)',
    '#231542': 'var(--bg-elevated)',
    '#1a0f2e': 'var(--bg-elevated)',
    '#3a3a3a': 'var(--bg-elevated)',
    '#4a4a4a': 'var(--bg-elevated)',

    // Texts
    '#fff': 'var(--text-primary)',
    '#ffffff': 'var(--text-primary)',
    '#f3f4f6': 'var(--text-primary)',
    '#f8f9fa': 'var(--text-primary)',
    '#f1f2f6': 'var(--text-primary)',
    '#e2d9f3': 'var(--text-secondary)',
    '#e5e7eb': 'var(--text-secondary)',
    '#d1d5db': 'var(--text-secondary)',
    '#dfe4ea': 'var(--text-secondary)',
    '#9ca3af': 'var(--text-muted)',
    '#6b7280': 'var(--text-muted)',
    '#b8a8d4': 'var(--text-muted)',
    '#4b5563': 'var(--text-muted)',
    '#374151': 'var(--text-muted)',

    // Primary Lavenders
    '#8b5cf6': 'var(--primary)',
    '#7c3aed': 'var(--primary)',
    '#7E57C2': 'var(--primary)',
    '#9333ea': 'var(--primary)',
    '#a855f7': 'var(--primary)',
    '#7e22ce': 'var(--primary)',
    '#6c5ce7': 'var(--primary)',
    '#5b4bc4': 'var(--primary)',
    '#9b87f5': 'var(--primary)',
    '#a78bfa': 'var(--primary-light)',
    '#c4b5fd': 'var(--primary-light)',
    '#B39DDB': 'var(--primary-light)',
    '#e9d5ff': 'var(--primary-light)',
    '#F3E8FF': 'var(--primary-dim)',
    '#6d28d9': 'var(--primary-hover)',
    '#4527A0': 'var(--primary-hover)',
    '#512DA8': 'var(--primary-hover)',

    // Status Colors
    '#ef4444': 'var(--error)',
    '#dc2626': 'var(--error)',
    '#ff3355': 'var(--error)',
    '#fee2e2': 'var(--error-dim)',
    '#fef2f2': 'var(--error-dim)',
    '#10B981': 'var(--success)',
    '#22c55e': 'var(--success)',
    '#4CAF50': 'var(--success)',
    '#00E676': 'var(--success)',
    '#F59E0B': 'var(--warning)',
    '#fbbf24': 'var(--warning)',
    '#FFA000': 'var(--warning)',
    '#FFD700': 'var(--warning)',
    '#3B82F6': 'var(--info)',
    '#0095f6': 'var(--info)',
    '#1877f2': 'var(--info)'
};

// Convert hex to RGB
function hexToRgb(hex) {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
        r = parseInt(hex.substring(1, 3), 16);
        g = parseInt(hex.substring(3, 5), 16);
        b = parseInt(hex.substring(5, 7), 16);
    }
    return [r, g, b];
}

// Convert RGB to HSL
function rgbToHsl(r, g, b) {
    r /= 255, g /= 255, b /= 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
        h = s = 0; // achromatic
    } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h * 360, s * 100, l * 100];
}

// Fallback mapper based on HSL
function getFallbackVariable(hex) {
    const [r, g, b] = hexToRgb(hex);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return hex;
    
    const [h, s, l] = rgbToHsl(r, g, b);
    
    if (l < 15) return 'var(--bg-primary)';
    if (l < 30) return 'var(--bg-secondary)';
    if (l > 90) return 'var(--text-primary)';
    if (l > 75 && s < 20) return 'var(--text-secondary)';
    if (l > 50 && s < 20) return 'var(--text-muted)';
    
    // Purples and Blues
    if (h > 240 && h < 300) {
        if (l > 70) return 'var(--primary-light)';
        if (l < 40) return 'var(--primary-hover)';
        return 'var(--primary)';
    }
    
    // Reds/Pink (Error or Accent)
    if ((h > 330 || h < 20) && s > 40) return 'var(--error)';
    
    // Greens (Success)
    if (h > 100 && h < 160 && s > 40) return 'var(--success)';
    
    // Yellows/Oranges (Warning)
    if (h > 20 && h < 60 && s > 40) return 'var(--warning)';

    // Fallback based on brightness alone
    if (l < 50) return 'var(--glass-bg-solid)';
    return 'var(--text-muted)';
}

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
        
        // Strategy 1: Replace hardcoded Hex colors (case insensitive)
        const hexRegex = /#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})\b/g;
        
        content = content.replace(hexRegex, (match) => {
            const lowerMatch = match.toLowerCase();
            // Try to find exact match
            if (COLOR_MAP[lowerMatch]) {
                totalReplacements++;
                return COLOR_MAP[lowerMatch];
            }
            
            // Check if it's a 3 char hex and expand to 6 to check mapping
            let hexToCheck = lowerMatch;
            if (lowerMatch.length === 4) {
                hexToCheck = '#' + lowerMatch[1] + lowerMatch[1] + lowerMatch[2] + lowerMatch[2] + lowerMatch[3] + lowerMatch[3];
                if (COLOR_MAP[hexToCheck]) {
                    totalReplacements++;
                    return COLOR_MAP[hexToCheck];
                }
            }
            
            // Use intelligent HSL fallback mapper
            const fallback = getFallbackVariable(hexToCheck);
            if (fallback !== hexToCheck) {
                totalReplacements++;
                return fallback;
            }
            
            return match; // return original if no mapping found
        });

        if (content !== originalContent) {
            fs.writeFileSync(file, content, 'utf8');
            console.log(`Updated ${path.basename(file)}`);
        }
    });

    console.log(`\nTheme Codemod Complete! Replaced ${totalReplacements} hardcoded colors with Universal Theme tokens.`);
}

processFiles();

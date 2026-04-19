# Royal Lavender Theme - Batch CSS Refactor Script
Write-Host "🎨 Royal Lavender Theme - Batch CSS Refactor" -ForegroundColor Magenta
Write-Host "============================================`n" -ForegroundColor Magenta

# Define replacement patterns
$colorReplacements = @(
    @{Pattern = 'background:\s*#000000\b'; Replacement = 'background: var(--bg-primary)'},
    @{Pattern = 'background:\s*#000\b'; Replacement = 'background: var(--bg-primary)'},
    @{Pattern = 'background:\s*black\b'; Replacement = 'background: var(--bg-primary)'},
    @{Pattern = 'background:\s*#0a0a0a'; Replacement = 'background: var(--bg-primary)'},
    @{Pattern = 'background:\s*#1a1a1a'; Replacement = 'background: var(--bg-card)'},
    @{Pattern = 'background:\s*#121212'; Replacement = 'background: var(--bg-card)'},
    @{Pattern = 'background-color:\s*#000000\b'; Replacement = 'background-color: var(--bg-primary)'},
    @{Pattern = 'background-color:\s*#000\b'; Replacement = 'background-color: var(--bg-primary)'},
    @{Pattern = 'background-color:\s*black\b'; Replacement = 'background-color: var(--bg-primary)'},
    @{Pattern = 'background-color:\s*#0a0a0a'; Replacement = 'background-color: var(--bg-primary)'},
    @{Pattern = 'background-color:\s*#1a1a1a'; Replacement = 'background-color: var(--bg-card)'},
    @{Pattern = 'color:\s*#fff\b'; Replacement = 'color: var(--text-primary)'},
    @{Pattern = 'color:\s*#ffffff\b'; Replacement = 'color: var(--text-primary)'},
    @{Pattern = 'color:\s*white\b'; Replacement = 'color: var(--text-primary)'}
)

# Get all .module.css files
$cssFiles = Get-ChildItem -Path "src" -Filter "*.module.css" -Recurse
Write-Host "Found $($cssFiles.Count) CSS module files`n" -ForegroundColor Cyan

$refactoredCount = 0

foreach ($file in $cssFiles) {
    try {
        $content = Get-Content $file.FullName -Raw -ErrorAction Stop
        $originalContent = $content
        $changed = $false
        
        foreach ($replacement in $colorReplacements) {
            if ($content -match $replacement.Pattern) {
                $content = $content -replace $replacement.Pattern, $replacement.Replacement
                $changed = $true
            }
        }
        
        if ($changed) {
            Set-Content -Path $file.FullName -Value $content -NoNewline -ErrorAction Stop
            Write-Host "✓ $($file.Name)" -ForegroundColor Green
            $refactoredCount++
        }
    }
    catch {
        Write-Host "✗ Error processing $($file.Name): $_" -ForegroundColor Red
    }
}

Write-Host "`n============================================" -ForegroundColor Magenta
Write-Host "✅ Refactoring Complete!" -ForegroundColor Green
Write-Host "📊 Files Modified: $refactoredCount / $($cssFiles.Count)" -ForegroundColor Cyan

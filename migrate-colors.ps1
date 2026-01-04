# Design System Color Migration Script
# This script updates old color values to new design system values across all CSS module files

$rootPath = "c:\Users\history_creator_2007\focus-app\src\components"

# Color mappings (old -> new)
$colorMappings = @{
    '#8B7FD7' = '#9b87f5'
    '#A99BE6' = '#c4b5fd'
    '#6D61B8' = '#7c3aed'
    'rgba(139, 127, 215' = 'rgba(155, 135, 245'
    '#0A0514' = '#0a0a0a'
    '#1B1139' = '#1a1a1a'
    '#2A1F4D' = '#2a2a2a'
    '#362861' = '#1a1a1a'
    'rgba(10, 5, 20' = 'rgba(10, 10, 10'
    'rgba(27, 17, 57' = 'rgba(26, 26, 26'
    '#4CAF50' = '#10b981'
    '#FF9800' = '#f59e0b'
    '#FF5378' = '#ef4444'
    '#D0CAED' = 'rgba(255, 255, 255, 0.7)'
    '#B9B3ED' = 'rgba(255, 255, 255, 0.6)'
    '#8A84C7' = 'rgba(255, 255, 255, 0.5)'
    '#6B659F' = 'rgba(255, 255, 255, 0.3)'
}

# Get all .module.css files
$cssFiles = Get-ChildItem -Path $rootPath -Filter "*.module.css" -Recurse

$totalFiles = $cssFiles.Count
$updatedFiles = 0

Write-Host "Found $totalFiles CSS module files to process..." -ForegroundColor Cyan

foreach ($file in $cssFiles) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Apply color mappings
    foreach ($oldColor in $colorMappings.Keys) {
        $newColor = $colorMappings[$oldColor]
        if ($content -match [regex]::Escape($oldColor)) {
            $content = $content -replace [regex]::Escape($oldColor), $newColor
        }
    }
    
    # Update transition timing functions
    $content = $content -replace 'transition: all 0\.2s ease', 'transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
    $content = $content -replace 'transition: all 0\.3s ease', 'transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    
    # Save if changed
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $updatedFiles++
        Write-Host "Updated: $($file.Name)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Migration Complete!" -ForegroundColor Cyan
Write-Host "Total files processed: $totalFiles" -ForegroundColor White
Write-Host "Files updated: $updatedFiles" -ForegroundColor Green
Write-Host "Files unchanged: $($totalFiles - $updatedFiles)" -ForegroundColor Yellow

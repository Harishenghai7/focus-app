# Generate Complete Project Directory Structure
$output = @()
$output += "=" * 80
$output += "FOCUS APP - COMPLETE DIRECTORY STRUCTURE"
$output += "Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
$output += "=" * 80
$output += ""

# Function to get directory tree
function Get-DirectoryTree {
    param(
        [string]$Path,
        [string]$Prefix = "",
        [int]$MaxDepth = 10,
        [int]$CurrentDepth = 0
    )
    
    if ($CurrentDepth -ge $MaxDepth) { return }
    
    try {
        $items = Get-ChildItem -Path $Path -Force -ErrorAction SilentlyContinue | 
                 Where-Object { $_.Name -notmatch '^(node_modules|\.git|build)$' }
        
        $items = $items | Sort-Object { -not $_.PSIsContainer }, Name
        
        for ($i = 0; $i -lt $items.Count; $i++) {
            $item = $items[$i]
            $isLast = ($i -eq $items.Count - 1)
            $connector = if ($isLast) { "└── " } else { "├── " }
            
            if ($item.PSIsContainer) {
                $script:output += "$Prefix$connector$($item.Name)\"
                $newPrefix = $Prefix + $(if ($isLast) { "    " } else { "│   " })
                Get-DirectoryTree -Path $item.FullName -Prefix $newPrefix -MaxDepth $MaxDepth -CurrentDepth ($CurrentDepth + 1)
            } else {
                $size = if ($item.Length -lt 1KB) { "$($item.Length) B" }
                        elseif ($item.Length -lt 1MB) { "{0:N2} KB" -f ($item.Length / 1KB) }
                        else { "{0:N2} MB" -f ($item.Length / 1MB) }
                
                $ext = $item.Extension
                $script:output += "$Prefix$connector$($item.Name) [$size]"
            }
        }
    } catch {
        Write-Host "Error accessing: $Path"
    }
}

# Get root directory
$rootPath = "c:\Users\ELCOT\focus-app"
$output += "ROOT: $rootPath"
$output += ""

# Generate tree
Get-DirectoryTree -Path $rootPath -MaxDepth 5

# Save to file
$output | Out-File -FilePath "$rootPath\COMPLETE_DIRECTORY_STRUCTURE.txt" -Encoding UTF8

Write-Host "Directory structure saved to COMPLETE_DIRECTORY_STRUCTURE.txt"

# 🔧 MEMORY LEAK FIX - PowerShell Script
# Run this to kill stuck processes, clear cache, and start fresh

Write-Host "🧹 Cleaning up memory leaks..." -ForegroundColor Cyan

# 1. Kill all node processes (be careful if you have other Node apps running)
Write-Host "Stopping all Node.js processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process nodejs -ErrorAction SilentlyContinue | Stop-Process -Force

# 2. Clear npm cache
Write-Host "Clearing npm cache..." -ForegroundColor Yellow
npm cache clean --force

# 3. Clear React cache
Write-Host "Clearing React build cache..." -ForegroundColor Yellow
Remove-Item -Recurse -Force node_modules/.cache -ErrorAction SilentlyContinue

# 4. Set maximum memory for Node
Write-Host "Setting Node.js memory limit to 16GB..." -ForegroundColor Green
$env:NODE_OPTIONS="--max-old-space-size=16384"

# 5. Start the app
Write-Host "🚀 Starting Focus App with maximum memory..." -ForegroundColor Green
npm start

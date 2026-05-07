# 🔧 RESTART DEV SERVER WITH ALL FIXES
Write-Host "🛑 Stopping all Node processes..." -ForegroundColor Red
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process nodejs -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "🧹 Clearing caches..." -ForegroundColor Yellow
Remove-Item -Recurse -Force node_modules/.cache -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force build -ErrorAction SilentlyContinue
npm cache clean --force

Write-Host "🚀 Starting dev server with 16GB memory..." -ForegroundColor Green
$env:NODE_OPTIONS="--max-old-space-size=16384"
$env:GENERATE_SOURCEMAP="false"
$env:DISABLE_ESLINT_PLUGIN="true"
$env:TSC_COMPILE_ON_ERROR="true"
$env:ESLINT_NO_DEV_ERRORS="true"
npm start

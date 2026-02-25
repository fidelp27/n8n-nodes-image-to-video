$projectDir = "C:\Users\Fidel\Documents\proyectos\n8n-nodes-image-to-video"

Write-Host "=== n8n-nodes-image-to-video: Setup & Build ===" -ForegroundColor Cyan

Set-Location $projectDir

Write-Host "`n[1/2] Installing dependencies (--ignore-scripts to skip pnpm checks)..." -ForegroundColor Yellow
npm install --ignore-scripts
if ($LASTEXITCODE -ne 0) {
    Write-Error "npm install failed. Check your Node.js and internet connection."
    exit 1
}

Write-Host "`n[2/2] Building TypeScript..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed. Check the error output above."
    exit 1
}

Write-Host "`n✅ Build complete! Output is in: $projectDir\dist" -ForegroundColor Green
Write-Host ""
Write-Host "--- Next steps ---" -ForegroundColor Cyan
Write-Host "1. To install into n8n locally (Windows, n8n running as npm global):" -ForegroundColor White
Write-Host "   npm install -g $projectDir" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Or copy the package into n8n's custom nodes directory:" -ForegroundColor White
Write-Host "   Xcopy /E /I `"$projectDir`" `"$env:APPDATA\n8n\custom\n8n-nodes-image-to-video`"" -ForegroundColor Gray
Write-Host "   Then restart n8n and search for 'Image to Video'." -ForegroundColor White
Write-Host ""
Write-Host "3. To publish to npm:" -ForegroundColor White
Write-Host "   npm login" -ForegroundColor Gray
Write-Host "   npm publish --access public" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Submit to n8n community at:" -ForegroundColor White
Write-Host "   https://internal.users.n8n.cloud/form/submit-community-node" -ForegroundColor Gray

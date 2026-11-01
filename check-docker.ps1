# Quick Docker Status Check

Write-Host ""
Write-Host "Checking Docker Desktop..." -ForegroundColor Cyan
Write-Host ""

try {
    docker info | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Docker Desktop is RUNNING" -ForegroundColor Green
        Write-Host ""
        Write-Host "You can now start the server with:" -ForegroundColor White
        Write-Host "  .\start-server.ps1" -ForegroundColor Yellow
    } else {
        throw "Docker not responding"
    }
} catch {
    Write-Host "Docker Desktop is NOT running" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please start Docker Desktop:" -ForegroundColor Yellow
    Write-Host "  1. Open Start Menu" -ForegroundColor White
    Write-Host "  2. Search for Docker Desktop" -ForegroundColor White
    Write-Host "  3. Click to open" -ForegroundColor White
    Write-Host "  4. Wait for it to fully start" -ForegroundColor White
    Write-Host ""
    Write-Host "Then run: .\check-docker.ps1" -ForegroundColor Yellow
}

Write-Host ""

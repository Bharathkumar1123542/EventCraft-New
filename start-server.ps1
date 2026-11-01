#!/usr/bin/env pwsh
# EventCraft Development Server Startup Script

Write-Host "🚀 EventCraft Development Server Setup" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "📦 Checking Docker status..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Desktop is not running!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please start Docker Desktop and run this script again." -ForegroundColor Yellow
    Write-Host "You can start Docker Desktop from:" -ForegroundColor Yellow
    Write-Host "  - Start Menu -> Docker Desktop" -ForegroundColor White
    Write-Host "  - Or wait a moment for it to initialize..." -ForegroundColor White
    Write-Host ""
    Write-Host "Press any key to exit..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

Write-Host ""

# Start PostgreSQL database
Write-Host "🐘 Starting PostgreSQL database..." -ForegroundColor Yellow
docker compose up db -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start database" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Database started" -ForegroundColor Green
Write-Host ""

# Wait for database to be healthy
Write-Host "⏳ Waiting for database to be ready..." -ForegroundColor Yellow
$retries = 0
$maxRetries = 30

while ($retries -lt $maxRetries) {
    $health = docker inspect --format='{{.State.Health.Status}}' eventcraft-db-1 2>$null
    if ($health -eq "healthy") {
        Write-Host "✅ Database is healthy" -ForegroundColor Green
        break
    }
    Start-Sleep -Seconds 1
    $retries++
    Write-Host "." -NoNewline -ForegroundColor Gray
}

if ($retries -eq $maxRetries) {
    Write-Host ""
    Write-Host "❌ Database did not become healthy in time" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host ""

# Run database migrations
Write-Host "🔧 Running database migrations..." -ForegroundColor Yellow
pnpm db:migrate

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to run migrations" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Migrations completed" -ForegroundColor Green
Write-Host ""

# Start the development server
Write-Host "🎨 Starting development server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  Configuration:" -ForegroundColor White
Write-Host "  • LLM Provider: FAKE (no API key needed)" -ForegroundColor White
Write-Host "  • Database: PostgreSQL on localhost:5432" -ForegroundColor White
Write-Host "  • Server: http://localhost:3000" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "✨ You can now verify the frontend UI design!" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""

# Start the development server
pnpm dev

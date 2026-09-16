# KarigarSaathi - Full Stack Development Environment Launcher
# Starts Firebase Emulators + AI Image Studio + Voice Studio + Fair Price Assistant + Vite Frontend

$ErrorActionPreference = 'Continue'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host '=====================================================' -ForegroundColor Cyan
Write-Host '  KarigarSaathi - Full Stack Dev Environment Launcher' -ForegroundColor Cyan
Write-Host '=====================================================' -ForegroundColor Cyan

# 1. Start AI Image Studio (Port 8000)
Write-Host 'Starting AI Image Studio on port 8000...' -ForegroundColor Yellow
$AiImageScript = Join-Path $ScriptDir 'AI\start-ai-service.ps1'
if (Test-Path $AiImageScript) {
    Start-Process powershell -ArgumentList @('-NoExit', '-ExecutionPolicy', 'Bypass', '-File', $AiImageScript)
}

# 2. Start Voice & Multilingual Studio (Port 8001)
Write-Host 'Starting Voice & Multilingual Studio on port 8001...' -ForegroundColor Yellow
$VoiceScript = Join-Path $ScriptDir 'AI\phase14\start-voice-catalogue-service.ps1'
if (Test-Path $VoiceScript) {
    Start-Process powershell -ArgumentList @('-NoExit', '-ExecutionPolicy', 'Bypass', '-File', $VoiceScript)
}

# 3. Start Fair Price ML Service (Port 8002)
Write-Host 'Starting Fair Price ML Service on port 8002...' -ForegroundColor Yellow
$PriceScript = Join-Path $ScriptDir 'AI\phase15\start-fair-price-service.ps1'
if (Test-Path $PriceScript) {
    Start-Process powershell -ArgumentList @('-NoExit', '-ExecutionPolicy', 'Bypass', '-File', $PriceScript)
}

# 4. Start Firebase Emulators
Write-Host 'Starting Firebase Emulators...' -ForegroundColor Yellow
Start-Process npx -WorkingDirectory $ScriptDir -ArgumentList @('firebase', 'emulators:start', '--only', 'auth,firestore,storage')

# 5. Start Vite Frontend
Write-Host 'Starting Vite Frontend on port 3000...' -ForegroundColor Yellow
$FrontendDir = Join-Path $ScriptDir 'frontend\app'
Start-Process npm.cmd -WorkingDirectory $FrontendDir -ArgumentList @('run', 'dev', '--', '--host', '0.0.0.0', '--port', '3000')

Write-Host ''
Write-Host 'All development services launched!' -ForegroundColor Green
Write-Host 'Frontend:              http://localhost:3000' -ForegroundColor Cyan
Write-Host 'AI Image Studio:       http://localhost:8000/health (Docs: http://localhost:8000/api/docs)' -ForegroundColor Cyan
Write-Host 'Voice Studio:          http://localhost:8001/health (Docs: http://localhost:8001/docs)' -ForegroundColor Cyan
Write-Host 'Fair Price Assistant:  http://localhost:8002/health (Docs: http://localhost:8002/docs)' -ForegroundColor Cyan
Write-Host 'Firebase Auth:         http://127.0.0.1:9099' -ForegroundColor Cyan
Write-Host 'Firebase Firestore:    http://127.0.0.1:8085' -ForegroundColor Cyan
Write-Host 'Firebase Storage:      http://127.0.0.1:9199' -ForegroundColor Cyan
Write-Host '=====================================================' -ForegroundColor Cyan

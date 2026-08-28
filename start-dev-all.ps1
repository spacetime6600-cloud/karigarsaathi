# KarigarSaathi - Full Stack Development Environment Launcher
# Starts Firebase Emulators + AI Microservice + Vite Frontend

Continue = 'Continue'
 = Split-Path -Parent System.Management.Automation.InvocationInfo.MyCommand.Path

Write-Host '=====================================================' -ForegroundColor Cyan
Write-Host '  KarigarSaathi - Full Stack Dev Environment Launcher' -ForegroundColor Cyan
Write-Host '=====================================================' -ForegroundColor Cyan

# 1. Start AI Microservice
Write-Host 'Starting AI Microservice on port 8000...' -ForegroundColor Yellow
 = Join-Path  'AI\start-ai-service.ps1'
Start-Process powershell -ArgumentList @('-NoExit', '-ExecutionPolicy', 'Bypass', '-File', )

# 2. Start Firebase Emulators
Write-Host 'Starting Firebase Emulators...' -ForegroundColor Yellow
Start-Process npx -ArgumentList @('firebase', 'emulators:start', '--only', 'auth,firestore,storage')

# 3. Start Vite Frontend
Write-Host 'Starting Vite Frontend on port 3001...' -ForegroundColor Yellow
 = Join-Path  'frontend\app'
Start-Process npm.cmd -WorkingDirectory  -ArgumentList @('run', 'dev', '--', '--host', '0.0.0.0', '--port', '3001')

Write-Host ''
Write-Host 'All development services launched!' -ForegroundColor Green
Write-Host 'Frontend:         http://localhost:3001 or http://10.5.0.2:3001' -ForegroundColor Cyan
Write-Host 'AI Health:        http://localhost:8000/health (0.0.0.0:8000)' -ForegroundColor Cyan
Write-Host 'AI OpenAPI Docs:  http://localhost:8000/api/docs' -ForegroundColor Cyan
Write-Host 'Firebase Auth:    http://127.0.0.1:9099' -ForegroundColor Cyan
Write-Host 'Firestore:        http://127.0.0.1:8080' -ForegroundColor Cyan
Write-Host 'Firebase UI:      http://127.0.0.1:4000' -ForegroundColor Cyan
Write-Host '=====================================================' -ForegroundColor Cyan

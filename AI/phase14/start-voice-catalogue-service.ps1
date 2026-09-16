# KarigarSaathi — Phase 14 Voice & Multilingual Auto-Catalogue Microservice Launcher
# Starts uvicorn server on port 8001 with Faster Whisper speech model and fact-grounded catalogue generator

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$Phase14Dir = Join-Path $ScriptDir "phase14"
Set-Location $Phase14Dir

$VenvPython = Join-Path $Phase14Dir ".venv\Scripts\python.exe"

if (-not (Test-Path $VenvPython)) {
    Write-Error "[Voice Service] Virtual environment not found at $VenvPython. Please run 'python -m venv .venv' and install requirements."
    exit 1
}

# Ensure private upload and database storage directories exist
$DataDir = Join-Path $Phase14Dir "data"
$UploadsDir = Join-Path $Phase14Dir "private\uploads"
if (-not (Test-Path $DataDir)) { New-Item -ItemType Directory -Path $DataDir -Force | Out-Null }
if (-not (Test-Path $UploadsDir)) { New-Item -ItemType Directory -Path $UploadsDir -Force | Out-Null }

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "🎙️  KARIGAR SAATHI — PHASE 14 VOICE & MULTILINGUAL SERVICE" -ForegroundColor Cyan
Write-Host "    Listening on: http://0.0.0.0:8001 (Docs: http://localhost:8001/docs)" -ForegroundColor Green
Write-Host "    Health URL:   http://localhost:8001/health" -ForegroundColor Green
Write-Host "    Languages:    English (en), Hindi (hi), Odia (or), Bengali (bn)" -ForegroundColor Yellow
Write-Host "    Speech Model: Faster Whisper (CPU int8)" -ForegroundColor Yellow
Write-Host "=================================================================" -ForegroundColor Cyan

& $VenvPython -m uvicorn backend.main:app --host 0.0.0.0 --port 8001

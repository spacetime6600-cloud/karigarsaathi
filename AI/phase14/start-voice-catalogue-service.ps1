# KarigarSaathi — Phase 14 Voice & Multilingual Auto-Catalogue Microservice Launcher
# Starts uvicorn server on port 8001 with Faster Whisper speech model and fact-grounded catalogue generator

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location "$ScriptDir\phase14"

$VenvPython = ".\.venv\Scripts\python.exe"

if (-not (Test-Path $VenvPython)) {
    Write-Error "Virtual environment not found at $VenvPython. Please create it and install requirements."
    exit 1
}

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "🎙️  KARIGAR SAATHI — PHASE 14 VOICE & MULTILINGUAL SERVICE" -ForegroundColor Cyan
Write-Host "    Listening on: http://0.0.0.0:8001 (Docs: http://localhost:8001/docs)" -ForegroundColor Green
Write-Host "    Languages: English (en), Hindi (hi), Odia (or), Bengali (bn)" -ForegroundColor Yellow
Write-Host "=================================================================" -ForegroundColor Cyan

& $VenvPython -m uvicorn backend.main:app --host 0.0.0.0 --port 8001

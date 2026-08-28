# KarigarSaathi — Phase 15 Fair Price Assistant Service Launcher
# Port: 8002

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

$venvPython = Join-Path $scriptDir ".venv\Scripts\python.exe"
if (-not (Test-Path $venvPython)) {
    Write-Error "Virtual environment not found at $venvPython. Run 'python -m venv .venv' and 'pip install -r requirements.txt' first."
    exit 1
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "🎙️  Starting KarigarSaathi Phase 15 Fair Price Assistant  " -ForegroundColor Green
Write-Host "    Port: 8002 | Formula: fair-price-rules-v1              " -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan

& $venvPython -m uvicorn backend.main:app --host 0.0.0.0 --port 8002 --reload

# KarigarSaathi - Phase 13 AI Microservice Starter Script
# Starts the Python FastAPI Image Studio on host 0.0.0.0 port 8000

Continue = 'Stop'
 = Split-Path -Parent System.Management.Automation.InvocationInfo.MyCommand.Path

# Determine AI application directory
 = Join-Path  'Phase13\karigarsaathi-ai'
if (-not (Test-Path )) {
     = 
}

Write-Host '=====================================================' -ForegroundColor Cyan
Write-Host '  KarigarSaathi AI Image Studio - Service Launcher   ' -ForegroundColor Cyan
Write-Host '=====================================================' -ForegroundColor Cyan
Write-Host ('[AI Service] Working directory: ' + ) -ForegroundColor Gray

# 1. Check Python Virtual Environment
 = Join-Path  '.venv\Scripts\python.exe'
if (-not (Test-Path )) {
    Write-Host '[AI Service] Creating virtual environment at .venv...' -ForegroundColor Yellow
    python -m venv (Join-Path  '.venv')
}

# 2. Verify and Create Storage Directories
 = @(
    (Join-Path  'storage\originals'),
    (Join-Path  'storage\enhanced'),
    (Join-Path  'storage\previews')
)
foreach ( in ) {
    if (-not (Test-Path )) {
        New-Item -ItemType Directory -Path  -Force | Out-Null
        Write-Host ('[AI Service] Created storage directory: ' + ) -ForegroundColor DarkGray
    }
}

# 3. Check / Create .env configuration
 = Join-Path  '.env'
if (-not (Test-Path )) {
     = Join-Path  '.env.example'
    if (Test-Path ) {
        Copy-Item  
        Write-Host '[AI Service] Created .env from .env.example' -ForegroundColor Yellow
    }
}

Write-Host '[AI Service] Starting FastAPI application on 0.0.0.0:8000...' -ForegroundColor Green
Write-Host '[AI Service] Health Endpoint:   http://0.0.0.0:8000/health (http://localhost:8000/health)' -ForegroundColor Cyan
Write-Host '[AI Service] API Documentation: http://0.0.0.0:8000/api/docs' -ForegroundColor Cyan
Write-Host '[AI Service] Enhancement Path:  POST http://0.0.0.0:8000/v1/enhancements' -ForegroundColor Cyan
Write-Host '=====================================================' -ForegroundColor Cyan

# 4. Launch uvicorn
Push-Location 
try {
    &  -m uvicorn app.main:app --host 0.0.0.0 --port 8000
} finally {
    Pop-Location
}

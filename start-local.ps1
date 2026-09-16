# KarigarSaathi - Start Local Development Stack (Windows PowerShell)
# Launches only missing components, checks readiness, and records PIDs.

$ErrorActionPreference = 'Continue'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

$PidFile = Join-Path $ScriptDir ".local-pids.json"
$Pids = @{}
if (Test-Path $PidFile) {
    try {
        $Pids = Get-Content $PidFile -Raw | ConvertFrom-Json -AsHashtable
    } catch {
        $Pids = @{}
    }
}

function Test-PortListening([int]$Port) {
    $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    return ($null -ne $conn)
}

function Wait-ForUrl([string]$Url, [int]$TimeoutSeconds = 15) {
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    while ($sw.Elapsed.TotalSeconds -lt $TimeoutSeconds) {
        try {
            $req = [System.Net.WebRequest]::Create($Url)
            $req.Timeout = 1500
            $resp = $req.GetResponse()
            $code = [int]$resp.StatusCode
            $resp.Close()
            if ($code -ge 200 -and $code -lt 400) { return $true }
        } catch {
            Start-Sleep -Milliseconds 400
        }
    }
    return $false
}

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "   KARIGAR SAATHI — LOCAL DEVELOPMENT STACK LAUNCHER" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# 1. Firebase Emulators (:9099, :8085, :9199, :4000)
if (-not (Test-PortListening 9099)) {
    Write-Host "[1/5] Starting Firebase Emulators (Auth :9099, Firestore :8085, Storage :9199)..." -ForegroundColor Yellow
    $fbProcess = Start-Process npx -WorkingDirectory $ScriptDir -ArgumentList @('firebase', 'emulators:start', '--project', 'demo-karigarsaathi', '--only', 'auth,firestore,storage') -PassThru -WindowStyle Minimized
    $Pids["firebase"] = $fbProcess.Id
    if (Wait-ForUrl "http://127.0.0.1:4000" 12) {
        Write-Host "      Firebase Emulators Ready (UI: http://127.0.0.1:4000)" -ForegroundColor Green
    } else {
        Write-Host "      Firebase Emulators launched (PID $($fbProcess.Id))" -ForegroundColor DarkGray
    }
} else {
    Write-Host "[1/5] Firebase Emulators already running on :9099, :8085, :9199" -ForegroundColor Green
}

# 2. Phase 13 AI Image Studio (:8000)
if (-not (Test-PortListening 8000)) {
    Write-Host "[2/5] Starting Phase 13 AI Image Studio on :8000..." -ForegroundColor Yellow
    $imgDir = Join-Path $ScriptDir "AI\Phase13\karigarsaathi-ai"
    $imgPython = Join-Path $imgDir ".venv\Scripts\python.exe"
    if (Test-Path $imgPython) {
        $imgProcess = Start-Process $imgPython -WorkingDirectory $imgDir -ArgumentList @('-m', 'uvicorn', 'app.main:app', '--host', '0.0.0.0', '--port', '8000') -PassThru -WindowStyle Minimized
        $Pids["image_service"] = $imgProcess.Id
        if (Wait-ForUrl "http://127.0.0.1:8000/health" 10) {
            Write-Host "      AI Image Studio Ready (http://127.0.0.1:8000/health)" -ForegroundColor Green
        }
    } else {
        Write-Host "      ERROR: Virtualenv not found at $imgPython" -ForegroundColor Red
    }
} else {
    Write-Host "[2/5] Phase 13 AI Image Studio already running on :8000" -ForegroundColor Green
}

# 3. Phase 14 Voice & Multilingual Studio (:8001)
if (-not (Test-PortListening 8001)) {
    Write-Host "[3/5] Starting Phase 14 Voice Studio on :8001..." -ForegroundColor Yellow
    $voiceDir = Join-Path $ScriptDir "AI\phase14\phase14"
    $voicePython = Join-Path $voiceDir ".venv\Scripts\python.exe"
    if (Test-Path $voicePython) {
        $voiceProcess = Start-Process $voicePython -WorkingDirectory $voiceDir -ArgumentList @('-m', 'uvicorn', 'backend.main:app', '--host', '0.0.0.0', '--port', '8001', '--reload') -PassThru -WindowStyle Minimized
        $Pids["voice_service"] = $voiceProcess.Id
        if (Wait-ForUrl "http://127.0.0.1:8001/health" 10) {
            Write-Host "      Voice Studio Ready (http://127.0.0.1:8001/health)" -ForegroundColor Green
        }
    } else {
        Write-Host "      ERROR: Virtualenv not found at $voicePython" -ForegroundColor Red
    }
} else {
    Write-Host "[3/5] Phase 14 Voice Studio already running on :8001" -ForegroundColor Green
}

# 4. Phase 15 Fair Price ML Assistant (:8002)
if (-not (Test-PortListening 8002)) {
    Write-Host "[4/5] Starting Phase 15 Fair Price Assistant on :8002..." -ForegroundColor Yellow
    $priceDir = Join-Path $ScriptDir "AI\phase15"
    $pricePython = Join-Path $priceDir ".venv\Scripts\python.exe"
    if (Test-Path $pricePython) {
        $priceProcess = Start-Process $pricePython -WorkingDirectory $priceDir -ArgumentList @('-m', 'uvicorn', 'backend.main:app', '--host', '0.0.0.0', '--port', '8002', '--reload') -PassThru -WindowStyle Minimized
        $Pids["pricing_service"] = $priceProcess.Id
        if (Wait-ForUrl "http://127.0.0.1:8002/health" 10) {
            Write-Host "      Fair Price Assistant Ready (http://127.0.0.1:8002/health)" -ForegroundColor Green
        }
    } else {
        Write-Host "      ERROR: Virtualenv not found at $pricePython" -ForegroundColor Red
    }
} else {
    Write-Host "[4/5] Phase 15 Fair Price Assistant already running on :8002" -ForegroundColor Green
}

# 5. Vite Frontend (:3000)
if (-not (Test-PortListening 3000)) {
    Write-Host "[5/5] Starting Vite Frontend on :3000..." -ForegroundColor Yellow
    $frontendDir = Join-Path $ScriptDir "frontend\app"
    $feProcess = Start-Process node -WorkingDirectory $frontendDir -ArgumentList @('node_modules\vite\bin\vite.js', '--port', '3000') -PassThru -WindowStyle Minimized
    $Pids["frontend"] = $feProcess.Id
    if (Wait-ForUrl "http://127.0.0.1:3000" 12) {
        Write-Host "      Frontend Ready (http://localhost:3000)" -ForegroundColor Green
    }
} else {
    Write-Host "[5/5] Vite Frontend already running on :3000" -ForegroundColor Green
}

# Save PID tracking
$Pids | ConvertTo-Json | Set-Content $PidFile -Encoding UTF8

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "   ALL KARIGAR SAATHI SERVICES ARE OPERATIONAL" -ForegroundColor Green
Write-Host "   Frontend Application:  http://localhost:3000" -ForegroundColor Cyan
Write-Host "   AI Image Studio:       http://localhost:8000 (Health: :8000/health)" -ForegroundColor Cyan
Write-Host "   AI Voice Studio:       http://localhost:8001 (Health: :8001/health)" -ForegroundColor Cyan
Write-Host "   Fair Price Assistant:  http://localhost:8002 (Health: :8002/health)" -ForegroundColor Cyan
Write-Host "   Firebase Emulator UI:  http://localhost:4000" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

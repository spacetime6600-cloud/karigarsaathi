# KarigarSaathi - Stop Local Development Stack (Windows PowerShell)
# Gracefully stops only project-owned processes, preserving emulator data. Never kills Ollama or system tools.

$ErrorActionPreference = 'SilentlyContinue'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

$PidFile = Join-Path $ScriptDir ".local-pids.json"
$Pids = @{}
if (Test-Path $PidFile) {
    try {
        $Pids = Get-Content $PidFile -Raw | ConvertFrom-Json -AsHashtable
    } catch {
        $Pids = @{}
    }
}

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "   KARIGAR SAATHI — STOPPING LOCAL DEVELOPMENT SERVICES" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# Stop by recorded PID if verified
foreach ($key in $Pids.Keys) {
    $pId = $Pids[$key]
    if ($pId -and ($p = Get-Process -Id $pId -ErrorAction SilentlyContinue)) {
        Write-Host "Stopping $key (PID $pId)..." -ForegroundColor Yellow
        Stop-Process -Id $pId -Force -ErrorAction SilentlyContinue
    }
}

# Clean port listeners for project-specific services only (3000, 8000, 8001, 8002)
# Explicitly NEVER touch port 11434 (Ollama)
$ProjectPorts = @(3000, 8000, 8001, 8002)
foreach ($port in $ProjectPorts) {
    $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    foreach ($conn in $conns) {
        $procId = $conn.OwningProcess
        if ($procId -gt 4) {
            $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
            if ($proc -and $proc.ProcessName -notmatch "ollama") {
                Write-Host "Releasing port $port (PID $procId - $($proc.ProcessName))..." -ForegroundColor Yellow
                Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
            }
        }
    }
}

if (Test-Path $PidFile) {
    Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
}

Write-Host "All project-specific local development services stopped." -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Cyan

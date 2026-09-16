# KarigarSaathi - Status of Local Development Stack
# Checks all ports, process identities, and health endpoints.

$ErrorActionPreference = 'SilentlyContinue'

function Get-PortStatus([int]$Port, [string]$Name, [string]$HealthUrl) {
    $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    $isListening = ($null -ne $conn)
    $pidStr = if ($isListening) { $conn.OwningProcess } else { "-" }
    
    $healthInfo = "-"
    if ($isListening -and $HealthUrl) {
        try {
            $req = [System.Net.WebRequest]::Create($HealthUrl)
            $req.Timeout = 1200
            $resp = $req.GetResponse()
            $code = [int]$resp.StatusCode
            $resp.Close()
            if ($code -ge 200 -and $code -lt 400) {
                $healthInfo = "Healthy (HTTP $code)"
            } else {
                $healthInfo = "HTTP $code"
            }
        } catch {
            $healthInfo = "Unreachable"
        }
    } elseif ($isListening) {
        $healthInfo = "Listening"
    }

    [PSCustomObject]@{
        Component   = $Name
        Port        = $Port
        State       = if ($isListening) { "RUNNING" } else { "STOPPED" }
        PID         = $pidStr
        HealthCheck = $healthInfo
    }
}

Write-Host "==========================================================================================" -ForegroundColor Cyan
Write-Host "                KARIGAR SAATHI -- LOCAL SERVICES STATUS REPORT" -ForegroundColor Cyan
Write-Host "==========================================================================================" -ForegroundColor Cyan

$services = @(
    (Get-PortStatus 3000  "Vite Frontend"             "http://127.0.0.1:3000"),
    (Get-PortStatus 4000  "Firebase Emulator UI"      "http://127.0.0.1:4000"),
    (Get-PortStatus 9099  "Firebase Auth Emulator"    ""),
    (Get-PortStatus 8085  "Firestore Emulator"        ""),
    (Get-PortStatus 9199  "Firebase Storage Emulator" ""),
    (Get-PortStatus 8000  "AI Image Studio"           "http://127.0.0.1:8000/health"),
    (Get-PortStatus 8001  "AI Voice Studio"           "http://127.0.0.1:8001/health"),
    (Get-PortStatus 8002  "Fair Price ML Assistant"   "http://127.0.0.1:8002/health"),
    (Get-PortStatus 11434 "Ollama (Sarvam)"           "http://127.0.0.1:11434/api/tags")
)

$services | Format-Table -AutoSize

Write-Host "==========================================================================================" -ForegroundColor Cyan

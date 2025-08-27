@echo off
setlocal ENABLEDELAYEDEXPANSION

REM === Settings ================================================================================
REM If you want to skip reinstall (lockfile+node_modules removal and npm install), set:
REM   set SKIP_REINSTALL=1
set SKIP_REINSTALL=

REM ==============================================================================================

REM Ensure Node & npm exist
where node >nul 2>&1 || (echo [ERROR] Node.js not found in PATH & exit /b 1)
where npm  >nul 2>&1 || (echo [ERROR] npm not found in PATH & exit /b 1)

REM Script paths
set "HERE=%~dp0"
set "PS1=%HERE%fix-criticals.ps1"

REM Write the PowerShell script (overwrites on each run)
> "%PS1%" (
  echo # fix-criticals.ps1  — PowerShell 5.1+/7+ compatible
  echo # Usage:
  echo #   powershell -ExecutionPolicy Bypass -File .\fix-criticals.ps1 [-FromFile audit.json] [-SkipReinstall]
  echo param(
  echo ^[string^] $FromFile,
  echo ^[switch^] $SkipReinstall
  echo )
  echo $ErrorActionPreference = 'Stop'
  echo function Exec-Text(^[string^] $FileName, ^[string^] $Args^) {
  echo ^    $psi = New-Object System.Diagnostics.ProcessStartInfo
  echo ^    $psi.FileName = $FileName
  echo ^    $psi.Arguments = $Args
  echo ^    $psi.UseShellExecute = $false
  echo ^    $psi.RedirectStandardOutput = $true
  echo ^    $psi.RedirectStandardError = $true
  echo ^    $p = [System.Diagnostics.Process]::Start($psi^)
  echo ^    $out = $p.StandardOutput.ReadToEnd(^)
  echo ^    $err = $p.StandardError.ReadToEnd(^)
  echo ^    $p.WaitForExit(^)
  echo ^    if ($p.ExitCode -ne 0^) { throw "Command failed: $FileName $Args`n$err" }
  echo ^    return $out.Trim(^)
  echo }
  echo function Get-AuditJson {
  echo ^    if ($FromFile) {
  echo ^        if (-not (Test-Path -LiteralPath $FromFile^)) { throw "File not found: $FromFile" }
  echo ^        return Get-Content -LiteralPath $FromFile -Raw ^| ConvertFrom-Json
  echo ^    } else {
  echo ^        $raw = Exec-Text "npm" "audit --json"
  echo ^        return $raw ^| ConvertFrom-Json
  echo ^    }
  echo }
  echo function Get-LatestVersion(^[string^] $Pkg^) {
  echo ^    $ver = Exec-Text "npm" "view $Pkg version"
  echo ^    if (-not $ver^) { throw "Failed to resolve latest version for $Pkg" }
  echo ^    return $ver
  echo }
  echo function Load-PackageJson {
  echo ^    $pkgPath = Join-Path -LiteralPath (Get-Location^) -ChildPath "package.json"
  echo ^    if (-not (Test-Path -LiteralPath $pkgPath^)) { throw "No package.json in current directory." }
  echo ^    $pkgText = Get-Content -LiteralPath $pkgPath -Raw
  echo ^    $pkgObj  = $pkgText ^| ConvertFrom-Json
  echo ^    return ^@{ Path = $pkgPath; Obj = $pkgObj; Text = $pkgText ^}
  echo }
  echo function Save-PackageJson(^[string^] $Path, $Obj^) {
  echo ^    $bak = "$Path.bak"
  echo ^    Copy-Item -LiteralPath $Path -Destination $bak -Force
  echo ^    $json = $Obj ^| ConvertTo-Json -Depth 100
  echo ^    $Utf8NoBom = New-Object System.Text.UTF8Encoding($false^)
  echo ^    [System.IO.File]::WriteAllText($Path, $json + [Environment]::NewLine, $Utf8NoBom^)
  echo }
  echo function Collect-CriticalOverrides($Audit^) {
  echo ^    $overrides = ^@{}
  echo ^    if (-not $Audit -or -not $Audit.vulnerabilities^) { return $overrides }
  echo ^    foreach ($kv in $Audit.vulnerabilities.GetEnumerator(^)^) {
  echo ^        $name = $kv.Key
  echo ^        $entry = $kv.Value
  echo ^        if ($entry.severity -ne "critical"^) { continue }
  echo ^        $target = $null
  echo ^        $fa = $entry.fixAvailable
  echo ^        if ($fa -is [bool] -and $fa -eq $true^) { $target = Get-LatestVersion $name }
  echo ^        elseif ($fa -and ($fa.PSObject.Properties.Name -contains 'version'^) -and $fa.version^) {
  echo ^            if (-not $fa.name -or $fa.name -eq $name^) { $target = [string]$fa.version }
  echo ^        }
  echo ^        if (-not $target^) { $target = Get-LatestVersion $name }
  echo ^        $overrides[$name] = $target
  echo ^    }
  echo ^    return $overrides
  echo }
  echo Write-Host "→ Reading audit report..." -ForegroundColor Cyan
  echo $audit = Get-AuditJson
  echo $pkg = Load-PackageJson
  echo $needed = Collect-CriticalOverrides $audit
  echo if ($needed.Keys.Count -eq 0^) {
  echo ^    Write-Host "✅ No actionable CRITICAL vulnerabilities found." -ForegroundColor Green
  echo ^    exit 0
  echo }
  echo # Merge overrides
  echo if (-not $pkg.Obj.PSObject.Properties.Name -contains 'overrides' -or -not $pkg.Obj.overrides^) {
  echo ^    $pkg.Obj | Add-Member -Name 'overrides' -Type NoteProperty -Value (^@{}^) -Force
  echo }
  echo foreach ($k in $needed.Keys^) { $pkg.Obj.overrides[$k] = $needed[$k] }
  echo Save-PackageJson -Path $pkg.Path -Obj $pkg.Obj
  echo Write-Host "📦 Applied overrides:" -ForegroundColor Yellow
  echo $needed.GetEnumerator(^) ^| ForEach-Object { Write-Host ("  - {0}: {1}" -f $_.Key, $_.Value) }
  echo if (-not $SkipReinstall^) {
  echo ^    Write-Host "`n→ Cleaning lockfile and node_modules..." -ForegroundColor Cyan
  echo ^    if (Test-Path -LiteralPath "package-lock.json"^) { Remove-Item -LiteralPath "package-lock.json" -Force }
  echo ^    if (Test-Path -LiteralPath "node_modules"^) { Remove-Item -LiteralPath "node_modules" -Recurse -Force }
  echo ^    Write-Host "→ npm install (this may take a while)..." -ForegroundColor Cyan
  echo ^    $null = Exec-Text "npm" "install"
  echo ^    Write-Host "→ Re-running npm audit..." -ForegroundColor Cyan
  echo ^    $auditOut = Exec-Text "npm" "audit"
  echo ^    Write-Host $auditOut
  echo } else {
  echo ^    Write-Host "`n(Skipped reinstall as requested.)" -ForegroundColor DarkYellow
  echo }
  echo Write-Host "`nDone." -ForegroundColor Green
)

REM Build PowerShell args
set "PSARGS=-ExecutionPolicy Bypass -File "%PS1%""
if "%~1"=="" goto :RUN
:HASARGS
set "PSARGS=%PSARGS% %*"
:RUN

if defined SKIP_REINSTALL (
  powershell %PSARGS% -SkipReinstall
) else (
  powershell %PSARGS%
)

set EXITCODE=%ERRORLEVEL%
if %EXITCODE% NEQ 0 (
  echo [ERROR] Script failed with exit code %EXITCODE%
  exit /b %EXITCODE%
)

echo.
echo [OK] fix-criticals completed.
exit /b 0

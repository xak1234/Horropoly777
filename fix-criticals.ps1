# fix-criticals.ps1  — PowerShell 5.1+/7+ compatible
# Usage:
#   powershell -ExecutionPolicy Bypass -File .\fix-criticals.ps1 [-FromFile audit.json] [-SkipReinstall]
param(
[string] $FromFile,
[switch] $SkipReinstall
ECHO is off.

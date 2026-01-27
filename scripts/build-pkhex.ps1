# Build PKHeX.Everywhere WASM and copy to Next.js public folder
# Requires: .NET 9.0 SDK

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$PKHeXDir = Join-Path $ProjectRoot "external\PKHeX.Everywhere"
$OutputDir = Join-Path $ProjectRoot "nxrthstack\public\pkhex"

Write-Host "Building PKHeX.Everywhere..." -ForegroundColor Cyan

# Check if submodule exists
if (-not (Test-Path (Join-Path $PKHeXDir "src"))) {
    Write-Host "Initializing PKHeX.Everywhere submodule..." -ForegroundColor Yellow
    Set-Location $ProjectRoot
    git submodule update --init --recursive
}

# Restore and build
Set-Location $PKHeXDir
dotnet restore
Set-Location (Join-Path $PKHeXDir "src\PKHeX.Web")
dotnet publish -c Release -o "..\..\publish"

# Copy to public folder
Write-Host "Copying to public/pkhex..." -ForegroundColor Cyan
if (Test-Path $OutputDir) {
    Remove-Item -Recurse -Force $OutputDir
}
New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
Copy-Item -Recurse -Path (Join-Path $PKHeXDir "publish\wwwroot\*") -Destination $OutputDir

# Fix base href for subdirectory
$indexPath = Join-Path $OutputDir "index.html"
$content = Get-Content $indexPath -Raw
$content = $content -replace '<base href="/"/>', '<base href="/pkhex/"/>'
Set-Content -Path $indexPath -Value $content

$size = (Get-ChildItem -Recurse $OutputDir | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "Done! PKHeX WASM files are now in public/pkhex/" -ForegroundColor Green
Write-Host "Size: $([math]::Round($size, 2)) MB" -ForegroundColor Green

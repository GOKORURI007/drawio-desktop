param(
    [Parameter(Mandatory)][string]$Version,
    [string]$Repository = 'GOKORURI007/drawio-desktop'
)
$ErrorActionPreference = 'Stop'
if ($Version -notmatch '^\d+\.\d+\.\d+(?:\.\d+)?$') { throw "Invalid Scoop version: $Version" }
$archive = "drawio-desktop-$Version-windows-x64.zip"
Push-Location "$PSScriptRoot/../dist/win-unpacked"
try {
    if (!(Test-Path -LiteralPath 'drawio.exe')) { throw 'Missing drawio.exe' }
    if (Test-Path -LiteralPath 'data') { throw 'Package a fresh build without user data' }
    if (Test-Path -LiteralPath "../$archive") { Remove-Item -LiteralPath "../$archive" }
    & 7z a -tzip -mx=5 "../$archive" '.\*'
    if ($LASTEXITCODE) { throw 'ZIP creation failed' }
} finally { Pop-Location }
$dist = "$PSScriptRoot/../dist"
$hash = (Get-FileHash "$dist/$archive" -Algorithm SHA256).Hash.ToLowerInvariant()
@{
    version = $Version
    description = 'Portable draw.io Desktop with local plugin support'
    homepage = "https://github.com/$Repository"
    license = 'GPL-3.0-only'
    architecture = @{ '64bit' = @{ url = "https://github.com/$Repository/releases/download/v$Version/$archive"; hash = $hash } }
    bin = 'drawio.exe'
    shortcuts = @(, @('drawio.exe', 'draw.io Desktop'))
    persist = 'data'
    checkver = @{ github = "https://github.com/$Repository" }
    autoupdate = @{ architecture = @{ '64bit' = @{ url = ('https://github.com/' + $Repository + '/releases/download/v$version/drawio-desktop-$version-windows-x64.zip') } } }
} | ConvertTo-Json -Depth 6 | Set-Content "$dist/drawio-desktop.json" -Encoding utf8

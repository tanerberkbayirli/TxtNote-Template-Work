# Installs the Windows toolchain TxtNote / Tauri needs:
#   Rust (rustup) + Visual Studio 2022 Build Tools (C++).
# WebView2 is already present on this machine via Edge.
# Run from an elevated PowerShell if the Build Tools installer asks for admin.

$ErrorActionPreference = "Stop"

Write-Host "==> Rust (rustup)"
if (Get-Command rustc -ErrorAction SilentlyContinue) {
  Write-Host "    already installed: $(rustc --version)"
} else {
  $dir = Join-Path $env:TEMP "txtnote-setup"
  New-Item -ItemType Directory -Force -Path $dir | Out-Null
  $installer = Join-Path $dir "rustup-init.exe"
  Invoke-WebRequest -Uri "https://static.rust-lang.org/rustup/dist/x86_64-pc-windows-msvc/rustup-init.exe" -OutFile $installer -UseBasicParsing
  & $installer -y --default-toolchain stable --default-host x86_64-pc-windows-msvc
  $env:Path = "$env:USERPROFILE\.cargo\bin;" + $env:Path
  Write-Host "    installed: $(rustc --version)"
}

Write-Host "==> Visual Studio 2022 Build Tools (C++ workload)"
$vswhere = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"
$hasMsvc = $false
if (Test-Path $vswhere) {
  $json = & $vswhere -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -format json | ConvertFrom-Json
  $hasMsvc = $null -ne $json -and @($json).Count -gt 0
}

if ($hasMsvc) {
  Write-Host "    already installed"
} else {
  winget install --id Microsoft.VisualStudio.2022.BuildTools -e --accept-package-agreements --accept-source-agreements --disable-interactivity --override "--wait --quiet --norestart --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
}

Write-Host "Done. Open a new terminal so PATH picks up cargo, then run: npm run desktop:build"

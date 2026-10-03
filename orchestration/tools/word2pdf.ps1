# Convert a DOCX to PDF with its OWN Word COM instance. Prints "WORDPID:<pid>" first so the caller can kill only it.
# usage: powershell -File word2pdf.ps1 -In <docx> -Out <pdf>
param([Parameter(Mandatory=$true)][string]$In, [Parameter(Mandatory=$true)][string]$Out)
$ErrorActionPreference = "Stop"
$before = @(Get-Process WINWORD -ErrorAction SilentlyContinue | ForEach-Object { $_.Id })
$w = $null
try {
  $w = New-Object -ComObject Word.Application
  $w.Visible = $false; $w.DisplayAlerts = 0
  $after = @(Get-Process WINWORD -ErrorAction SilentlyContinue | ForEach-Object { $_.Id })
  $own = @($after | Where-Object { $before -notcontains $_ })
  Write-Output ("WORDPID:" + ($own -join ","))
  [Console]::Out.Flush()
  $d = $w.Documents.Open((Resolve-Path $In).Path, [ref]$false, [ref]$true)
  $d.ExportAsFixedFormat([System.IO.Path]::GetFullPath($Out), 17)
  $d.Close([ref]$false)
  Write-Output "OK"
} finally {
  if ($w) { try { $w.Quit() } catch {} }
}

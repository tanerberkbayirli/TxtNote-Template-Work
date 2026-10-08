param([string]$Docx,[string]$Pdf)
$ErrorActionPreference='Stop'
$Docx=[IO.Path]::GetFullPath($Docx); $Pdf=[IO.Path]::GetFullPath($Pdf)
Unblock-File $Docx
$before = @(Get-Process WINWORD -ErrorAction SilentlyContinue | % Id)
$w = New-Object -ComObject Word.Application
$w.Visible=$false; $w.DisplayAlerts=0
$mine = @(Get-Process WINWORD -ErrorAction SilentlyContinue | ? { $before -notcontains $_.Id } | % Id)
Write-Output "WORD_PID=$mine"; [Console]::Out.Flush()
try {
  $d = $w.Documents.Open($Docx,$false,$true)
  Write-Output "Opened"; [Console]::Out.Flush()
  Write-Output "Pages: $($d.ComputeStatistics(2))"; [Console]::Out.Flush()
  $d.SaveAs2($Pdf,17)
  $d.Close(0)
  Write-Output "Saved exists=$(Test-Path $Pdf)"
} finally { try { $w.Quit() } catch {}; Write-Output 'Done' }

param([string]$docx,[string]$pdf)
Unblock-File $docx
$before = @(Get-Process WINWORD -ErrorAction SilentlyContinue | % Id)
$w = New-Object -ComObject Word.Application
$w.Visible = $false; $w.DisplayAlerts = 0
Start-Sleep 2
$after = @(Get-Process WINWORD -ErrorAction SilentlyContinue | % Id)
$mine = $after | ? { $before -notcontains $_ }
"my pid(s): $mine"
try {
  $d = $w.Documents.Open($docx, $false, $true)
  $d.Repaginate()
  "pages: " + $d.ComputeStatistics(2)
  $d.ExportAsFixedFormat($pdf, 17)
  $d.Close($false)
} finally { $w.Quit(); }

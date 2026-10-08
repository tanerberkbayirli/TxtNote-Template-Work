param([string[]]$pairs)
$before = @(Get-Process WINWORD -ErrorAction SilentlyContinue | % Id)
$w = New-Object -ComObject Word.Application
$w.Visible = $false; $w.DisplayAlerts = 0
Start-Sleep 2
$after = @(Get-Process WINWORD -ErrorAction SilentlyContinue | % Id)
$mine = $after | ? { $before -notcontains $_ }
"my pid(s): $mine"
try {
  foreach ($p in $pairs) {
    $docx,$pdf = $p -split '\|'
    Unblock-File $docx
    $d = $w.Documents.Open($docx, $false, $true)
    $d.Repaginate()
    "$docx pages: " + $d.ComputeStatistics(2)
    $d.ExportAsFixedFormat($pdf, 17)
    $d.Close($false)
  }
} finally { $w.Quit() }

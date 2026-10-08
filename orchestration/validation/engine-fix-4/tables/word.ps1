param([string[]]$names)
$root = $PSScriptRoot
$before = @(Get-Process WINWORD -ErrorAction SilentlyContinue | % Id)
$w = New-Object -ComObject Word.Application
$w.Visible = $false; $w.DisplayAlerts = 0
Start-Sleep 2
$after = @(Get-Process WINWORD -ErrorAction SilentlyContinue | % Id)
"my pid(s): " + ($after | ? { $before -notcontains $_ })
try {
  foreach ($n in ($names -split ",")) {
    $docx = Join-Path $root "$n.docx"; $pdf = Join-Path $root "$n.word.pdf"
    Unblock-File $docx
    $d = $w.Documents.Open($docx, $false, $true)
    $d.Repaginate()
    "$n pages: " + $d.ComputeStatistics(2)
    $d.ExportAsFixedFormat($pdf, 17)
    $d.Close($false)
  }
} finally { $w.Quit() }

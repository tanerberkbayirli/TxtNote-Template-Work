param([string]$dir, [string]$names)
$before = @(Get-Process WINWORD -ErrorAction SilentlyContinue | % Id)
$w = New-Object -ComObject Word.Application
$w.Visible = $false; $w.DisplayAlerts = 0
Start-Sleep 2
"my pid(s): " + (@(Get-Process WINWORD | % Id) | ? { $before -notcontains $_ })
try {
  foreach ($n in ($names -split ",")) {
    $f = Join-Path $dir "$n.docx"; Unblock-File $f
    $d = $w.Documents.Open($f, $false, $true)
    $d.Repaginate()
    $t = $d.Tables(1); $ys = @()
    foreach ($r in $t.Rows) { $ys += [math]::Round($r.Range.Information(6), 2) }
    $pitch = for ($i = 1; $i -lt $ys.Count; $i++) { [math]::Round($ys[$i] - $ys[$i-1], 2) }
    "$n pitches(pt): " + ($pitch -join " ")
    $d.Close($false)
  }
} finally { $w.Quit() }

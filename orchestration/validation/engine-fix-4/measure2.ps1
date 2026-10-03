param([string]$mode, [string]$names)
$root = $PSScriptRoot
$before = @(Get-Process WINWORD -ErrorAction SilentlyContinue | % Id)
$w = New-Object -ComObject Word.Application
$w.Visible = $false; $w.DisplayAlerts = 0
Start-Sleep 2
"my pid(s): " + (@(Get-Process WINWORD | % Id) | ? { $before -notcontains $_ })
try {
  foreach ($n in ($names -split ",")) {
    $f = Join-Path $root "$mode\$n.docx"; Unblock-File $f
    $d = $w.Documents.Open($f, $false, $true)
    $d.Repaginate()
    "=== $mode/$n pages: " + $d.ComputeStatistics(2)
    $ti = 0
    foreach ($t in $d.Tables) {
      $ti++
      if ($t.Rows.Count -lt 3) { continue }
      $cap = $t.Range.Paragraphs(1).Previous(1)
      $capText = if ($cap) { $cap.Range.Text.Trim() } else { "" }
      if ($capText.Length -gt 40) { $capText = $capText.Substring(0,40) }
      $capPage = if ($cap) { $cap.Range.Information(3) } else { 0 }
      $ys = @(); $pgs = @()
      foreach ($r in $t.Rows) { $ys += [math]::Round($r.Range.Information(6), 1); $pgs += $r.Range.Information(3) }
      $p = @(); for ($i = 1; $i -lt $ys.Count; $i++) { if ($pgs[$i] -eq $pgs[$i-1]) { $p += [math]::Round($ys[$i]-$ys[$i-1],1) } }
      $mean = if ($p.Count) { [math]::Round(($p | Measure-Object -Average).Average * 25.4 / 72, 2) } else { 0 }
      "table $ti rows=$($t.Rows.Count) caption='$capText' capPage=$capPage firstRowPage=$($pgs[0]) lastRowPage=$($pgs[-1]) meanRowPitch_mm=$mean"
    }
    $d.Close($false)
  }
} finally { $w.Quit() }

param([string]$names)
$root = $PSScriptRoot
$before = @(Get-Process WINWORD -ErrorAction SilentlyContinue | % Id)
$w = New-Object -ComObject Word.Application
$w.Visible = $false; $w.DisplayAlerts = 0
Start-Sleep 2
$after = @(Get-Process WINWORD -ErrorAction SilentlyContinue | % Id)
"my pid(s): " + ($after | ? { $before -notcontains $_ })
try {
  foreach ($n in ($names -split ",")) {
    $d = $w.Documents.Open((Join-Path $root "$n.docx"), $false, $true)
    $d.Repaginate()
    "$n pages: " + $d.ComputeStatistics(2) + " tables: " + $d.Tables.Count
    $k=0
    foreach ($t in $d.Tables) {
      if ($t.Rows.Count -lt 3 -or $t.Uniform -eq $false -and $t.Rows.Count -lt 3) { continue }
      $ys=@(); $pg=@()
      $max=[Math]::Min($t.Rows.Count,8)
      for ($i=1; $i -le $max; $i++) { $r=$t.Cell($i,1).Range; $r.Collapse(1); $ys += $r.Information(6); $pg += $r.Information(3) }
      $g=@(); for ($i=1;$i -lt $ys.Count;$i++){ if($pg[$i] -eq $pg[$i-1]){ $g += [Math]::Round(($ys[$i]-$ys[$i-1])*25.4/72,2) } }
      "table rows=" + $t.Rows.Count + " page=" + $pg[0] + " gaps_mm=" + ($g -join ",")
      $k++; if ($k -ge 8) { break }
    }
    $d.Close($false)
  }
} finally { $w.Quit() }

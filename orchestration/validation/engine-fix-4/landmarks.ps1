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
    $out = @("pages`t" + $d.ComputeStatistics(2))
    foreach ($p in $d.Paragraphs) {
      $t = $p.Range.Text.Trim()
      if ($t.Length -lt 3) { continue }
      $lvl = $p.OutlineLevel
      if ($lvl -le 4 -or $t -match '^(Tablo|Şekil|Çizelge|Table|Figure) \d') {
        $out += ("" + $p.Range.Information(3) + "`t" + [math]::Round($p.Range.Information(6),1) + "`t" + $t.Substring(0, [math]::Min(60,$t.Length)))
      }
    }
    [IO.File]::WriteAllLines((Join-Path $root "$mode\$n.landmarks.txt"), $out, [Text.Encoding]::UTF8)
    "$n done: " + $out.Count
    $d.Close($false)
  }
} finally { $w.Quit() }

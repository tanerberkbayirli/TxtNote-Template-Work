# Convert a DOCX to PDF with its OWN Word COM instance. Prints "WORDPID:<pid>" first so the caller can kill only it.
# usage: powershell -File word2pdf.ps1 -In <docx> -Out <pdf> [-Refreshed <pdf>] [-FieldDump <json>]
# -FieldDump: JSON {before, after} of every field (code, result) in body, headers and footers as Word loaded them and after the update.
# -Refreshed: after the plain export, update every field (body, TOC, headers/footers) twice with repagination and export that to a second PDF.
param([Parameter(Mandatory=$true)][string]$In, [Parameter(Mandatory=$true)][string]$Out, [string]$Refreshed = "", [string]$FieldDump = "")
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
  function Get-FieldRows($doc) {
    $rows = @()
    foreach ($f in $doc.Fields) { $rows += [pscustomobject]@{ part = "body"; type = [int]$f.Type; code = ("" + $f.Code.Text).Trim(); result = ("" + $f.Result.Text).Trim() } }
    $si = 0
    foreach ($sec in $doc.Sections) {
      $si++
      foreach ($k in 1,2,3) {
        foreach ($pair in @(@("header", $sec.Headers.Item($k)), @("footer", $sec.Footers.Item($k)))) {
          if ($pair[1].Exists) { foreach ($f in $pair[1].Range.Fields) { $rows += [pscustomobject]@{ part = ("{0}{1}.{2}" -f $pair[0], $k, $si); type = [int]$f.Type; code = ("" + $f.Code.Text).Trim(); result = ("" + $f.Result.Text).Trim() } } }
        }
      }
    }
    return ,$rows
  }
  $before = if ($FieldDump) { Get-FieldRows $d } else { @() }
  if ($Refreshed) {
    for ($i = 0; $i -lt 2; $i++) {
      [void]$d.Fields.Update()
      foreach ($t in $d.TablesOfContents) { $t.Update() }
      foreach ($sec in $d.Sections) {
        foreach ($k in 1,2,3) {
          foreach ($hf in @($sec.Headers.Item($k), $sec.Footers.Item($k))) { if ($hf.Exists) { [void]$hf.Range.Fields.Update() } }
        }
      }
      $d.Repaginate()
    }
    $d.ExportAsFixedFormat([System.IO.Path]::GetFullPath($Refreshed), 17)
    if ($FieldDump) { @{ before = $before; after = (Get-FieldRows $d) } | ConvertTo-Json -Depth 5 | Set-Content -Path ([System.IO.Path]::GetFullPath($FieldDump)) -Encoding UTF8 }
    Write-Output "REFRESHED"
  }
  $d.Close([ref]$false)
  Write-Output "OK"
} finally {
  if ($w) { try { $w.Quit() } catch {} }
}

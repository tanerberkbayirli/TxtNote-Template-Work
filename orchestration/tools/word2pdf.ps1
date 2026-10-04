# Convert a DOCX to PDF with its OWN Word COM instance. Prints "WORDPID:<pid>" first so the caller can kill only it.
# usage: powershell -File word2pdf.ps1 -In <docx> -Out <pdf> [-Refreshed <pdf>] [-FieldDump <json>]
# -FieldDump: JSON {before, after} of every field (code, result) in body, headers and footers as Word loaded them and after the update.
# -Refreshed: after the plain export, update every field (body, TOC, headers/footers) twice with repagination and export that to a second PDF.
param([Parameter(Mandatory=$true)][string]$In, [Parameter(Mandatory=$true)][string]$Out, [string]$Refreshed = "", [string]$FieldDump = "", [string]$RenderInfo = "")
$ErrorActionPreference = "Stop"
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class TxtEngineWordProcess {
    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr handle, out uint processId);
}
'@
$before = @(Get-Process WINWORD -ErrorAction SilentlyContinue | ForEach-Object { $_.Id })
$w = $null
$d = $null
$probeDocument = $null
$ownsWord = $false
try {
  $w = New-Object -ComObject Word.Application
  # Word exposes Hwnd on Window, not Application. Require a newly started process before
  # adding the unsaved probe; its window exists inside the hidden automation application.
  $newProcesses = @(Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object { $before -notcontains $_.Id })
  if ($newProcesses.Count -ne 1) { throw "Cannot establish one newly started Word process." }
  $probeDocument = $w.Documents.Add([Type]::Missing, $false, 0, $true)
  [uint32]$wordProcessId = 0
  [void][TxtEngineWordProcess]::GetWindowThreadProcessId([IntPtr]$probeDocument.Windows.Item(1).Hwnd, [ref]$wordProcessId)
  if (!$wordProcessId -or $before -contains $wordProcessId) { throw "Cannot establish a new owned Word process; refusing to render in an existing instance." }
  $ownsWord = $true
  $w.Visible = $false; $w.DisplayAlerts = 0
  Write-Output ("WORDPID:" + $wordProcessId)
  [Console]::Out.Flush()
  $probeDocument.Close([ref]$false)
  [void][System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($probeDocument)
  $probeDocument = $null
  $d = $w.Documents.Open((Resolve-Path $In).Path, [ref]$false, [ref]$true)
  # Complete pagination synchronously before exporting, including the plain cached-field render.
  $d.Repaginate()
  if ($RenderInfo) {
    @{ pid = $wordProcessId; version = $w.Version; build = $w.Build; activePrinter = $w.ActivePrinter;
       compatibilityMode = $d.CompatibilityMode; printBackground = $w.Options.PrintBackground;
       renderedAt = [DateTime]::UtcNow.ToString("o") } | ConvertTo-Json | Set-Content -LiteralPath ([System.IO.Path]::GetFullPath($RenderInfo)) -Encoding UTF8
  }
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
  Write-Output "OK"
} finally {
  if ($probeDocument) { try { $probeDocument.Close([ref]$false) } catch {} }
  if ($d) { try { $d.Close([ref]$false) } catch {} }
  if ($w -and $ownsWord) { try { $w.Quit() } catch {} }
  if ($d) { [void][System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($d) }
  if ($w) { [void][System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($w) }
  if ($probeDocument) { [void][System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($probeDocument) }
}

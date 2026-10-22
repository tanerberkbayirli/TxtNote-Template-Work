# Read-only official legacy DOC -> cached DOCX. Caller owns a 120-second watchdog.
param([Parameter(Mandatory=$true)][string]$In, [Parameter(Mandatory=$true)][string]$Out)
$ErrorActionPreference = 'Stop'
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class TxtSourceWordProcess {
 [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr handle, out uint processId);
}
'@
$before = @(Get-Process WINWORD -ErrorAction SilentlyContinue | ForEach-Object { $_.Id })
$w = $null; $doc = $null; $probe = $null; $owned = $false
try {
  $w = New-Object -ComObject Word.Application
  $newProcesses = @(Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object { $before -notcontains $_.Id })
  if ($newProcesses.Count -ne 1) { throw 'Cannot identify one new owned Word process.' }
  $probe = $w.Documents.Add([Type]::Missing, $false, 0, $true)
  [uint32]$wordPid = 0
  [void][TxtSourceWordProcess]::GetWindowThreadProcessId([IntPtr]$probe.Windows.Item(1).Hwnd, [ref]$wordPid)
  if (!$wordPid -or $before -contains $wordPid) { throw 'Refusing to use an existing Word instance.' }
  $owned = $true
  $w.Visible = $false; $w.DisplayAlerts = 0
  Write-Output ("WORDPID:" + $wordPid); [Console]::Out.Flush()
  $probe.Close([ref]$false); [void][System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($probe); $probe = $null
  $doc = $w.Documents.Open((Resolve-Path -LiteralPath $In).Path, [ref]$false, [ref]$true)
  $doc.SaveAs2([System.IO.Path]::GetFullPath($Out), 16)
  Write-Output 'OK'
} finally {
  if ($probe) { try { $probe.Close([ref]$false) } catch {} }
  if ($doc) { try { $doc.Close([ref]$false) } catch {} }
  if ($w -and $owned) { try { $w.Quit() } catch {} }
  if ($doc) { [void][System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($doc) }
  if ($probe) { [void][System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($probe) }
  if ($w) { [void][System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($w) }
}

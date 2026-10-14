param([Parameter(Mandatory=$true)][string]$In,[Parameter(Mandatory=$true)][string]$OutPrefix)
$ErrorActionPreference='Stop'
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class TxtNoteRoundtripWordProcess {
 [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr handle, out uint processId);
}
'@
$before=@(Get-Process WINWORD -ErrorAction SilentlyContinue | ForEach-Object {$_.Id})
$word=$null
$doc=$null
$ownsWord=$false
$probe=$null
$record=@{source=[System.IO.Path]::GetFullPath($In);status='FAIL'}
try {
  $word=New-Object -ComObject Word.Application
  $new=@(Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object {$before -notcontains $_.Id})
  if ($new.Count -ne 1) {throw 'Cannot establish a new owned Word process'}
  $probe=$word.Documents.Add([Type]::Missing,$false,0,$true)
  [uint32]$actualPid=0
  [void][TxtNoteRoundtripWordProcess]::GetWindowThreadProcessId([IntPtr]$probe.Windows.Item(1).Hwnd,[ref]$actualPid)
  if ($actualPid -ne $new[0].Id -or $before -contains $actualPid) {throw 'Word ownership could not be verified'}
  $ownsWord=$true
  $record.pid=$actualPid
  Write-Output ('WORDPID:'+$record.pid)
  $word.Visible=$false
  $word.DisplayAlerts=0
  $probe.Close([ref]$false)
  [void][System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($probe)
  $probe=$null
  $doc=$word.Documents.Open((Resolve-Path -LiteralPath $In).Path,[ref]$false,[ref]$true)
  $originalText=[string]$doc.Content.Text
  $range=$doc.Content.Duplicate
  $range.Find.ClearFormatting()
  if (!$range.Find.Execute('1.0 1.')) {throw 'Controlled body-edit anchor not found'}
  $range.Collapse(0)
  $position=$range.Start
  $marker=' TXTNOTE_WORD_EDIT_CHECK '
  $range.InsertAfter($marker)
  $record.editVisible=([string]$doc.Content.Text).Contains($marker)
  if (!$record.editVisible) {throw 'Word insertion not visible'}
  [void]$doc.Range($position,$position+$marker.Length).Delete()
  $record.authorTextRestored=([string]$doc.Content.Text -ceq $originalText)
  if (!$record.authorTextRestored) {throw 'Author content differs after reverting the edit'}
  $copy=[System.IO.Path]::GetFullPath($OutPrefix+'.docx')
  $doc.SaveAs2($copy,16)
  $doc.Close([ref]$false)
  [void][System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($doc)
  $doc=$word.Documents.Open($copy,[ref]$false,[ref]$false)
  $record.reopenedAuthorTextEqual=([string]$doc.Content.Text -ceq $originalText)
  if (!$record.reopenedAuthorTextEqual) {throw 'Saved/reopened content differs'}
  for ($i=0;$i -lt 2;$i++) {
    [void]$doc.Fields.Update()
    foreach ($toc in $doc.TablesOfContents) {$toc.Update()}
    foreach ($section in $doc.Sections) {
      foreach ($kind in 1,2,3) {
        foreach ($chrome in @($section.Headers.Item($kind),$section.Footers.Item($kind))) {
          if ($chrome.Exists) {[void]$chrome.Range.Fields.Update()}
        }
      }
    }
    $doc.Repaginate()
  }
  $doc.Save()
  $doc.Close([ref]$false)
  [void][System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($doc)
  $doc=$word.Documents.Open($copy,[ref]$false,[ref]$true)
  $doc.Repaginate()
  $doc.ExportAsFixedFormat([System.IO.Path]::GetFullPath($OutPrefix+'.pdf'),17)
  $record.sourceSha256=(Get-FileHash -LiteralPath $In).Hash
  $record.copySha256=(Get-FileHash -LiteralPath $copy).Hash
  $record.version=$word.Version
  $record.build=$word.Build
  $record.status='PASS'
  Write-Output 'OK'
} catch {
  $record.error=$_.Exception.Message
  throw
} finally {
  if ($probe) {try {$probe.Close([ref]$false)} catch {};[void][System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($probe)}
  if ($doc) {try {$doc.Close([ref]$false)} catch {};[void][System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($doc)}
  if ($word -and $ownsWord) {try {$word.Quit()} catch {}}
  if ($word) {[void][System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($word)}
  $record | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath ($OutPrefix+'.json') -Encoding utf8
}

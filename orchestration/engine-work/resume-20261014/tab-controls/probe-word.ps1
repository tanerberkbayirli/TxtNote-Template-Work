$ErrorActionPreference='Stop'
$word=$null;$doc=$null;$owned=$false
$before=@(Get-Process WINWORD -ErrorAction SilentlyContinue | ForEach-Object Id)
try {
 $word=New-Object -ComObject Word.Application
 $new=@(Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object {$before -notcontains $_.Id})
 if($new.Count -ne 1){throw 'Cannot identify owned Word instance'}
 $owned=$true;$word.Visible=$false;$word.DisplayAlerts=0
 $results=@()
 foreach($twips in @(360,708,1440,'tail')) {
  $doc=$word.Documents.Open((Join-Path $PSScriptRoot "tabs-$twips.docx"),$false,$true);$doc.Repaginate()
  $characters=@()
  foreach($c in $doc.Paragraphs.Item(1).Range.Characters){$characters+=@{text=$c.Text;x=$c.Information(5);y=$c.Information(6)}}
  $doc.ExportAsFixedFormat((Join-Path $PSScriptRoot "tabs-$twips.word.pdf"),17)
  $results+=@{twips=$twips;characters=$characters;lines=$doc.Paragraphs.Item(1).Range.ComputeStatistics(1)}
  $doc.Close([ref]$false);$doc=$null
 }
 $results | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'word.json') -Encoding UTF8
 $kerning=@()
 foreach($kern in @(0,3,30)) {
  $doc=$word.Documents.Open((Join-Path $PSScriptRoot "kern-$kern.docx"),$false,$true);$doc.Repaginate()
  $doc.ExportAsFixedFormat((Join-Path $PSScriptRoot "kern-$kern.word.pdf"),17)
  $kerning+=@{halfPoints=$kern;lines=$doc.Paragraphs.Item(1).Range.ComputeStatistics(1)}
  $doc.Close([ref]$false);$doc=$null
 }
 $kerning | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'kerning-word.json') -Encoding UTF8
} finally {if($owned){if($doc){$doc.Close([ref]$false)};if($word){$word.Quit()}}}

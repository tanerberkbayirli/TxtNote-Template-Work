$ErrorActionPreference='Stop';$word=$null;$doc=$null;$owned=$false
$before=@(Get-Process WINWORD -ErrorAction SilentlyContinue | ForEach-Object Id)
try {
 $word=New-Object -ComObject Word.Application
 $new=@(Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object {$before -notcontains $_.Id})
 if($new.Count -ne 1){throw 'Cannot identify owned Word instance'}
 $owned=$true;$word.Visible=$false;$word.DisplayAlerts=0;$results=@()
 foreach($mode in @('split','whole','exact','header')) {
  $doc=$word.Documents.Open((Join-Path $PSScriptRoot "$mode.docx"),$false,$true);$doc.Repaginate();$rows=@()
  foreach($p in $doc.Tables.Item(1).Range.Paragraphs){if($p.Range.Text -match '^ROW\d+'){ $rows+=@{text=$p.Range.Text;page=$p.Range.Information(3);top=$p.Range.Information(6)} }}
  $doc.ExportAsFixedFormat((Join-Path $PSScriptRoot "$mode.word.pdf"),17)
  $results+=@{mode=$mode;rows=$rows;pages=$doc.ComputeStatistics(2)};$doc.Close([ref]$false);$doc=$null
 }
 $results | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'word.json') -Encoding UTF8
} finally {if($owned){if($doc){$doc.Close([ref]$false)};if($word){$word.Quit()}}}

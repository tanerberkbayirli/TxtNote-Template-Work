$ErrorActionPreference='Stop';$word=$null;$doc=$null;$owned=$false
$before=@(Get-Process WINWORD -ErrorAction SilentlyContinue | ForEach-Object Id)
try {
 Write-Output 'Creating Word'
 $word=New-Object -ComObject Word.Application
 Write-Output 'Created Word'
 $new=@(Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object {$before -notcontains $_.Id})
 if($new.Count -ne 1){throw 'Cannot identify owned Word instance'}
 $owned=$true;Write-Output "WORDPID:$($new[0].Id)";$word.Visible=$false;$word.DisplayAlerts=0;$word.AutomationSecurity=3;$results=@()
 foreach($kind in @('bullet','plain')) {foreach($height in @(602,604,606,608)) {
  $mode="$kind-$height";Write-Output "Opening $mode";$doc=$word.Documents.Open((Join-Path $PSScriptRoot "$mode.docx"),$false,$true);Write-Output 'Opened';$doc.Repaginate()
  $doc.ExportAsFixedFormat((Join-Path $PSScriptRoot "$mode.word.pdf"),17)
  $results+=@{mode=$mode;pages=$doc.ComputeStatistics(2)};$doc.Close([ref]$false);$doc=$null
 }}
 $results | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'word.json') -Encoding UTF8
} finally {if($owned){if($doc){$doc.Close([ref]$false)};if($word){$word.Quit()}}}

$ErrorActionPreference='Stop'
$word=$null;$doc=$null;$owned=$false
$before=@(Get-Process WINWORD -ErrorAction SilentlyContinue | ForEach-Object Id)
try {
  $word=New-Object -ComObject Word.Application
  $new=@(Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object {$before -notcontains $_.Id})
  if($new.Count -ne 1){throw 'Cannot identify owned Word instance'}
  $owned=$true;$word.Visible=$false;$word.DisplayAlerts=0
  Write-Output "WORDPID:$($new[0].Id)"
  $results=@()
  foreach($count in @(0,1,3)) {
    $file=Join-Path $PSScriptRoot "blank-$count.docx"
    $doc=$word.Documents.Open($file,$false,$true)
    $doc.Repaginate()
    $paragraphs=@()
    foreach($p in $doc.Paragraphs) {
      $r=$p.Range
      $paragraphs+=@{text=$r.Text;page=$r.Information(3);top=$r.Information(6);start=$r.Start;end=$r.End}
    }
    $results+=@{blanks=$count;paragraphs=$paragraphs}
    $doc.Close([ref]$false);$doc=$null
  }
  $results | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'word.json') -Encoding UTF8
  $results | ConvertTo-Json -Depth 6
} finally {
  if($owned){if($doc){$doc.Close([ref]$false)};if($word){$word.Quit()}}
}

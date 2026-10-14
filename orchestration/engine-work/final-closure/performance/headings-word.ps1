$ErrorActionPreference='Stop'
$folder=[IO.Path]::GetFullPath('orchestration/engine-work/final-closure/performance')
$prior=@(Get-CimInstance Win32_Process -Filter "Name='WINWORD.EXE'" | ForEach-Object {[int]$_.ProcessId})
$started=Get-Date;$word=$null;$doc=$null;$owned=$false;$report=[ordered]@{status='FAIL';expected=(Get-Content (Join-Path $folder 'headings.expected.json') -Raw | ConvertFrom-Json)}
try {
 $word=New-Object -ComObject Word.Application
 $limit=(Get-Date).AddSeconds(20)
 do {
  Start-Sleep -Milliseconds 200
  $proof=@(Get-CimInstance Win32_Process -Filter "Name='WINWORD.EXE'" | Where-Object {[int]$_.ProcessId -notin $prior -and $_.CreationDate -ge $started.AddSeconds(-2) -and $_.CommandLine -match '/Automation\s+-Embedding'})
 } while($proof.Count -ne 1 -and (Get-Date) -lt $limit)
 if($proof.Count -ne 1){throw 'Owned automation Word process not proven'}
 $owned=$true;$word.Visible=$false;$word.DisplayAlerts=0
 if($word.Documents.Count -ne 0){throw 'Fresh Word process already has documents'}
 $doc=$word.Documents.Open((Join-Path $folder 'headings.docx'),$false,$true)
 $doc.Repaginate();$actual=@()
 foreach($paragraph in $doc.Paragraphs){$text=$paragraph.Range.Text.Trim();if($text -in $report.expected){$actual+=@{text=$text;automaticListLabel=$paragraph.Range.ListFormat.ListString}}}
 $report.actual=$actual;$report.wordVersion=$word.Version;$report.wordBuild=$word.Build;$report.pages=$doc.ComputeStatistics(2)
 $doc.ExportAsFixedFormat((Join-Path $folder 'headings.word.pdf'),17)
 if($actual.Count -eq $report.expected.Count -and @($actual | Where-Object {$_.automaticListLabel}).Count -eq 0){$report.status='PASS'}
}catch{$report.error=$_.ToString()}
finally{
 $noSave=0
 if($doc){$doc.Close([ref]$noSave);[void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($doc)}
 if($word){if($owned){$word.Quit([ref]$noSave)};[void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($word)}
 $report | ConvertTo-Json -Depth 8 | Set-Content (Join-Path $folder 'headings-word.json') -Encoding UTF8
 [GC]::Collect();[GC]::WaitForPendingFinalizers()
}
Write-Output ($report | ConvertTo-Json -Depth 6 -Compress)
if($report.status -ne 'PASS'){exit 1}

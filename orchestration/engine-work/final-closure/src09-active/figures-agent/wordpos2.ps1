param([string]$In,[string]$Out)
$ErrorActionPreference='Stop'
$before=@(Get-Process WINWORD -ErrorAction SilentlyContinue | ForEach-Object {$_.Id})
$w=$null;$d=$null;$owned=$false
try{
 $w=New-Object -ComObject Word.Application
 $started=@(Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object {$before -notcontains $_.Id})
 if($started.Count -ne 1){throw 'no owned'}
 $owned=$true;$w.Visible=$false;$w.DisplayAlerts=0
 $d=$w.Documents.Open($In,$false,$false)
 $res=@()
 $s=$d.Sections(23);$n=$s.Range.Paragraphs.Count
 $res+=[pscustomobject]@{what='before';pages=$d.ComputeStatistics(2);sec24page=$d.Sections(24).Range.Characters(1).Information(3)}
 # X in the sectPr paragraph
 $r=$s.Range.Paragraphs($n).Range;$r.InsertBefore('X')
 $r=$s.Range.Paragraphs($n).Range
 $res+=[pscustomobject]@{what='X in sectPr para';page=$r.Characters(1).Information(3);y=$r.Characters(1).Information(6);pages=$d.ComputeStatistics(2);sec24page=$d.Sections(24).Range.Characters(1).Information(3)}
 # add more blank paragraphs to find capacity
 for($k=1;$k -le 3;$k++){
  $s.Range.Paragraphs($n).Range.InsertParagraphBefore()
  $r=$s.Range.Paragraphs($n+$k).Range
  $res+=[pscustomobject]@{what="extra $k";page=$r.Characters(1).Information(3);y=$r.Characters(1).Information(6);sec24page=$d.Sections(24).Range.Characters(1).Information(3)}
 }
 $res | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $Out -Encoding UTF8
}finally{if($owned){if($d){$d.Close([ref]$false)};if($w){$w.Quit()}}}

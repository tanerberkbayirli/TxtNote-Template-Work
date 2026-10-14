$w=New-Object -ComObject Word.Application
try{
$w.Visible=$false;$w.DisplayAlerts=0
$d=$w.Documents.Open((Resolve-Path 'orchestration/engine-work/final-closure/src09-active/ek2-agent/fit/fitx.docx').Path,[ref]$false,[ref]$true)
$d.Repaginate()
$o=@()
$ci=0
foreach($t in $d.Tables){ $rows=@(); foreach($c in $t.Range.Cells){ $p=$c.Range.Paragraphs.Item(1).Range; $rows+=,@($p.Information(3),$p.Information(6)) }; $o+=,@($ci,$rows); $ci++ }
$o|ConvertTo-Json -Depth 5 -Compress|Set-Content orchestration/engine-work/final-closure/src09-active/ek2-agent/fit/wordx.json
$d.Close([ref]$false)
}finally{ $w.Quit() }

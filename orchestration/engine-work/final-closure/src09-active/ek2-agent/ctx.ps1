$before=@(Get-Process WINWORD -ErrorAction SilentlyContinue | ForEach-Object Id)
$w=New-Object -ComObject Word.Application
try{
$w.Visible=$false;$w.DisplayAlerts=0
$d=$w.Documents.Open((Resolve-Path 'orchestration/engine-work/final-closure/src09-active/ek2-agent/ctx/ctx.docx').Path,[ref]$false,[ref]$true)
$d.Repaginate()
$o=@()
foreach($r in $d.Tables.Item(1).Rows){ $c=$r.Cells.Item(1); $o+=@{y=$c.Range.Paragraphs.Item(1).Range.Information(6); n=$c.Range.Paragraphs.Count; txt=$c.Range.Text.Substring(0,3)} }
$o|ConvertTo-Json -Compress|Set-Content orchestration/engine-work/final-closure/src09-active/ek2-agent/ctx/ctx.json
$d.Close([ref]$false)
}finally{ $w.Quit() }

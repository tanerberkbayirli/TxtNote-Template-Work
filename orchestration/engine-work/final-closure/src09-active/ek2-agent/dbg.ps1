$log='orchestration/engine-work/final-closure/src09-active/ek2-agent/ctx/dbg.log'
function L($m){ "$(Get-Date -Format HH:mm:ss) $m" | Add-Content $log }
L 'start'
$before=@(Get-Process WINWORD -ErrorAction SilentlyContinue | ForEach-Object Id)
$w=New-Object -ComObject Word.Application
L 'created'
$new=@(Get-Process WINWORD | Where-Object {$before -notcontains $_.Id}); L "new=$($new.Id -join ',')"
$w.Visible=$false;$w.DisplayAlerts=0; L 'props'
$d=$w.Documents.Open((Resolve-Path 'orchestration/engine-work/final-closure/src09-active/ek2-agent/ctx/ctx.docx').Path,[ref]$false,[ref]$true)
L 'opened'
$d.ExportAsFixedFormat((Join-Path (Get-Location) 'orchestration/engine-work/final-closure/src09-active/ek2-agent/ctx/ctx.word.pdf'),17)
L 'exported'
$d.Close([ref]$false);$w.Quit();L 'quit'

$ErrorActionPreference='Stop'
$before=@(Get-Process WINWORD -ErrorAction SilentlyContinue | ForEach-Object Id)
$w=$null;$d=$null;$owned=$false
try{
 $w=New-Object -ComObject Word.Application
 $new=@(Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object {$before -notcontains $_.Id})
 if($new.Count -ne 1){throw 'Cannot identify an owned Word process'}
 $owned=$true;$w.Visible=$false;$w.DisplayAlerts=0
 $src09Case=(Get-Content -Raw -Encoding UTF8 orchestration/engine-work/mission01/acceptance-v3.json|ConvertFrom-Json).cases|Where-Object id -eq 'SRC09'
 $d=$w.Documents.Open((Resolve-Path $src09Case.input.path).Path,[ref]$false,[ref]$true)
 $d.Repaginate();$out=@()
 foreach($i in @(21,22,23,24,25,26,31,32)){
  $section=$d.Sections.Item($i);$range=$section.Range.Duplicate;$start=$range.Start;$end=$range.End
  $range.Collapse(1);$pageStart=$range.Information(3);$range.SetRange($end-1,$end-1)
  $out+=@{index=$i;start=$start;end=$end;pageStart=$pageStart;pageEnd=$range.Information(3);sectionStart=$section.PageSetup.SectionStart;orientation=$section.PageSetup.Orientation;text=$section.Range.Text.Substring(0,[Math]::Min(100,$section.Range.Text.Length))}
 }
 $out|ConvertTo-Json -Depth 4|Set-Content -LiteralPath 'orchestration/engine-work/final-closure/src09-active/word-sections.json' -Encoding utf8
}finally{if($d){$d.Close([ref]$false)};if($w -and $owned){$w.Quit()}}

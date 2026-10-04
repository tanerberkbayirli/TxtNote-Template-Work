param([string]$In,[string]$Out)
$ErrorActionPreference="Stop"
$before=@(Get-Process WINWORD -ErrorAction SilentlyContinue|%{$_.Id})
$w=$null
try{
 $w=New-Object -ComObject Word.Application; $w.Visible=$false; $w.DisplayAlerts=0
 $after=@(Get-Process WINWORD -ErrorAction SilentlyContinue|%{$_.Id}); Write-Output ("WORDPID:"+(($after|?{$before -notcontains $_}) -join ",")); [Console]::Out.Flush()
 $doc=$w.Documents.Add()
 $ps=$doc.PageSetup; $ps.PageWidth=600; $ps.LeftMargin=0; $ps.RightMargin=0
 $jobs=Get-Content $In | ConvertFrom-Json
 $res=@()
 $sw=[Diagnostics.Stopwatch]::StartNew()
 foreach($j in $jobs){
  $doc.Content.Text=$j.text
  $r=$doc.Paragraphs(1).Range
  $r.Font.Name=$j.font; $r.Font.Size=$j.size; $r.Font.Kerning=0
  $p=$doc.Paragraphs(1)
  $p.Format.Alignment=$j.align
  $p.Format.SpaceAfter=0; $p.Format.FirstLineIndent=0; $p.Format.LeftIndent=0
  $lo=[double]$j.lo; $hi=[double]$j.hi   # width range: lo -> multi-line, hi -> 1 line
  while(($hi-$lo) -gt 0.04){
    $mid=[math]::Round((($lo+$hi)/2)*20)/20
    if($mid -le $lo -or $mid -ge $hi){break}
    $p.Format.RightIndent=600-$mid
    if($j.pos){$n=$doc.Range([int]$j.pos-1,[int]$j.pos).Information(10)}else{$n=$doc.Paragraphs(1).Range.ComputeStatistics(1)}
    if($n -le 1){$hi=$mid}else{$lo=$mid}
  }
  $res+=[pscustomobject]@{id=$j.id;W=$hi}
  if($sw.Elapsed.TotalSeconds -gt 110){break}
 }
 $res|ConvertTo-Json -Compress|Set-Content $Out
}finally{ if($w){try{$doc.Close([ref]$false)}catch{}; try{$w.Quit()}catch{}} }

param([string]$In,[string]$Out)
$ErrorActionPreference='Stop'
$before=@(Get-Process WINWORD -ErrorAction SilentlyContinue | ForEach-Object {$_.Id})
$w=$null; $d=$null; $owned=$false
try {
 $w=New-Object -ComObject Word.Application
 $started=@(Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object {$before -notcontains $_.Id})
 if($started.Count -ne 1){throw 'Cannot establish a new owned Word process.'}
 $owned=$true; $w.Visible=$false; $w.DisplayAlerts=0
 Write-Output ('WORDPID:'+$started[0].Id)
 $d=$w.Documents.Add(); $d.PageSetup.PageWidth=600; $d.PageSetup.LeftMargin=0; $d.PageSetup.RightMargin=0
 $results=@()
 foreach($j in (Get-Content -LiteralPath $In -Raw -Encoding UTF8 | ConvertFrom-Json)){
  $d.Content.Text=$j.text; $r=$d.Paragraphs(1).Range
  $r.Font.Name=$j.font; $r.Font.Size=$j.size; $r.Font.Kerning=0; $r.Font.Bold=0; $r.Font.Italic=0
  $p=$d.Paragraphs(1); $p.Format.Alignment=0; $p.Format.SpaceAfter=0; $p.Format.FirstLineIndent=0; $p.Format.LeftIndent=0
  $lo=[double]$j.lo; $hi=[double]$j.hi
  while($hi-$lo -gt 0.04){
   $mid=[math]::Round((($lo+$hi)/2)*20)/20
   if($mid -le $lo -or $mid -ge $hi){break}
   $p.Format.RightIndent=600-$mid
   $n=$d.Range([int]$j.pos-1,[int]$j.pos).Information(10)
   if($n -le 1){$hi=$mid}else{$lo=$mid}
  }
  $results+=[pscustomobject]@{id=$j.id;minWidthPt=$hi;maxRejectedWidthPt=$lo;wordBuild=$w.Build;font=$j.font;size=$j.size;position=$j.pos}
 }
 $results | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $Out -Encoding UTF8
}finally{if($owned){if($d){$d.Close([ref]$false)};if($w){$w.Quit()}}}

param([string]$In,[string]$Out)
$ErrorActionPreference='Stop'
$before=@(Get-Process WINWORD -ErrorAction SilentlyContinue | ForEach-Object {$_.Id})
$w=$null;$d=$null;$owned=$false
try{
 $w=New-Object -ComObject Word.Application
 $started=@(Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object {$before -notcontains $_.Id})
 if($started.Count -ne 1){throw 'no owned'}
 $owned=$true;$w.Visible=$false;$w.DisplayAlerts=0
 "WORDPID:"+$started[0].Id
 $d=$w.Documents.Open($In,$false,$true)
 $res=@()
 foreach($si in 23,24){
  $s=$d.Sections($si);$ps=$s.PageSetup
  $res+=[pscustomobject]@{sec=$si;top=$ps.TopMargin;bottom=$ps.BottomMargin;footerDist=$ps.FooterDistance;pageH=$ps.PageHeight;start=$ps.SectionStart;pStart=$s.Range.Information(3)}
  $n=$s.Range.Paragraphs.Count
  $from=[math]::Max(1,$n-7)
  for($i=$from;$i -le $n;$i++){
   $p=$s.Range.Paragraphs($i);$r=$p.Range
   $res+=[pscustomobject]@{sec=$si;i=$i;n=$n;page=$r.Information(3);y=$r.Information(6);sa=$p.SpaceAfter;sb=$p.SpaceBefore;ls=$p.LineSpacing;rule=$p.LineSpacingRule;fs=$r.Font.Size;style=$p.Style.NameLocal;txt=$r.Text.Substring(0,[math]::Min(20,$r.Text.Length))}
  }
 }
 $res | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $Out -Encoding UTF8
}finally{if($owned){if($d){$d.Close([ref]$false)};if($w){$w.Quit()}}}

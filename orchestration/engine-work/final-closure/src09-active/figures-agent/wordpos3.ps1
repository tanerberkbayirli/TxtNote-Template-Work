param([string]$In,[string]$Out)
$ErrorActionPreference='Stop'
$before=@(Get-Process WINWORD -ErrorAction SilentlyContinue | ForEach-Object {$_.Id})
$w=$null;$d=$null;$owned=$false
try{
 $w=New-Object -ComObject Word.Application
 $started=@(Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object {$before -notcontains $_.Id})
 if($started.Count -ne 1){throw 'no owned'}
 $owned=$true;$w.Visible=$false;$w.DisplayAlerts=0
 $d=$w.Documents.Open($In,$false,$true)
 $res=@()
 $s=$d.Sections(25)
 $n=$s.Range.Paragraphs.Count
 for($i=1;$i -le $n;$i++){
  $p=$s.Range.Paragraphs($i);$r=$p.Range
  $pg=$r.Information(3)
  if($pg -ge 96 -and $pg -le 98){
   $res+=[pscustomobject]@{i=$i;page=$pg;y=$r.Information(6);sa=$p.SpaceAfter;sb=$p.SpaceBefore;ls=$p.LineSpacing;rule=$p.LineSpacingRule;shapes=$r.ShapeRange.Count;len=$r.Text.Length;txt=$r.Text.Substring(0,[math]::Min(15,$r.Text.Length))}
  }
  if($pg -gt 98){break}
 }
 $res | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $Out -Encoding UTF8
}finally{if($owned){if($d){$d.Close([ref]$false)};if($w){$w.Quit()}}}

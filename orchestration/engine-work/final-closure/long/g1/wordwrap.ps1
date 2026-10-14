param([string]$In,[string]$Out)
$ErrorActionPreference='Stop'
$before=@(Get-Process WINWORD -ErrorAction SilentlyContinue | ForEach-Object {$_.Id})
$w=$null;$d=$null;$owned=$false
try{
 $w=New-Object -ComObject Word.Application
 $started=@(Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object {$before -notcontains $_.Id})
 if($started.Count -ne 1){throw 'no owned word'}
 $owned=$true;$w.Visible=$false;$w.DisplayAlerts=0
 $d=$w.Documents.Open($In,$false,$false)
 $d.Repaginate()
 $r=$d.GoTo(1,1,48); $rng=$d.Range($r.Start,$d.GoTo(1,1,49).Start)
 $paras=@($rng.Paragraphs)
 $res=@()
 # find paragraph index with 6 shapes at y~381.6
 $target=$null;$idx=0
 for($i=0;$i -lt $paras.Count;$i++){ $pr=$paras[$i].Range; if([math]::Abs($pr.Information(6)-381.6) -lt 1.0 -and $pr.ShapeRange.Count -eq 6){$target=$paras[$i];$idx=$i;break} }
 if(-not $target){throw 'target not found'}
 $next=$paras[$idx+1]
 $res+=[pscustomobject]@{step='base';nextY=$next.Range.Information(6);shapes=$target.Range.ShapeRange.Count}
 $sr=$target.Range.ShapeRange
 $info=@()
 for($k=1;$k -le $sr.Count;$k++){ $s=$sr.Item($k); $info+=[pscustomobject]@{k=$k;wrap=$s.WrapFormat.Type;l=$s.Left;t=$s.Top;w=$s.Width;h=$s.Height;relH=$s.RelativeHorizontalPosition;relV=$s.RelativeVerticalPosition;dT=$s.WrapFormat.DistanceTop;dB=$s.WrapFormat.DistanceBottom;dL=$s.WrapFormat.DistanceLeft;dR=$s.WrapFormat.DistanceRight;side=$s.WrapFormat.Side} }
 $res+=[pscustomobject]@{step='shapes';info=$info}
 # toggle each shape to none and see nextY
 for($k=1;$k -le $sr.Count;$k++){
   $s=$target.Range.ShapeRange.Item($k); $old=$s.WrapFormat.Type
   $s.WrapFormat.Type=3
   $d.Repaginate()
   $res+=[pscustomobject]@{step="shape$k->none";nextY=$paras[$idx+1].Range.Information(6)}
   $s.WrapFormat.Type=$old
 }
 $res | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $Out -Encoding UTF8
}finally{if($owned){if($d){$d.Close([ref]$false)};if($w){$w.Quit()}}}

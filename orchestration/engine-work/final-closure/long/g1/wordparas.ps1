param([string]$In,[string]$Out,[int]$From,[int]$To)
$ErrorActionPreference='Stop'
$before=@(Get-Process WINWORD -ErrorAction SilentlyContinue | ForEach-Object {$_.Id})
$w=$null;$d=$null;$owned=$false
try{
 $w=New-Object -ComObject Word.Application
 $started=@(Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object {$before -notcontains $_.Id})
 if($started.Count -ne 1){throw 'no owned word'}
 $owned=$true;$w.Visible=$false;$w.DisplayAlerts=0
 $d=$w.Documents.Open($In,$false,$true)
 $d.Repaginate()
 $res=@()
 $r=$d.GoTo(1,1,$From); $startPos=$r.Start
 $r2=$d.GoTo(1,1,$To+1); $endPos=$r2.Start
 $rng=$d.Range($startPos,$endPos)
 $i=0
 foreach($p in $rng.Paragraphs){
   $pr=$p.Range
   $res+=[pscustomobject]@{pg=$pr.Information(3);y=$pr.Information(6);t=$pr.Text.Substring(0,[Math]::Min(25,$pr.Text.Length)) -replace "[\r\n\a]",'|';sb=$p.Format.SpaceBefore;sa=$p.Format.SpaceAfter;kn=$p.Format.KeepWithNext;kt=$p.Format.KeepTogether;shapes=$pr.ShapeRange.Count;inl=$pr.InlineShapes.Count}
   $i++; if($i -gt 400){break}
 }
 $res | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $Out -Encoding UTF8
}finally{if($owned){if($d){$d.Close([ref]$false)};if($w){$w.Quit()}}}

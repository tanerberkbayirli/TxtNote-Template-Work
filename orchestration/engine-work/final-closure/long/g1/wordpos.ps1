param([string]$In,[string]$Out,[string]$Pages)
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
 $np=$d.ComputeStatistics(2)
 $res+=[pscustomobject]@{pages=$np}
 $want=@($Pages -split ',' | ForEach-Object {[int]$_})
 foreach($pg in $want){
   $r=$d.GoTo(1,1,$pg)   # wdGoToPage, wdGoToAbsolute
   $r.Collapse(1)
   $para=$r.Paragraphs(1)
   $res+=[pscustomobject]@{page=$pg;y=$r.Information(6);style=$para.Style.NameLocal;before=$para.Format.SpaceBefore;rule=$para.Format.LineSpacingRule;ls=$para.Format.LineSpacing;text=$para.Range.Text.Substring(0,[Math]::Min(30,$para.Range.Text.Length))}
 }
 $res | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $Out -Encoding UTF8
}finally{if($owned){if($d){$d.Close([ref]$false)};if($w){$w.Quit()}}}

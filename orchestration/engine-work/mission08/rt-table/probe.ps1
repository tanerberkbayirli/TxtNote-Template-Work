param([string]$In)
$ErrorActionPreference="Stop"
$before=@(Get-Process WINWORD -ErrorAction SilentlyContinue|%{$_.Id})
$w=$null;$d=$null
try{
 $w=New-Object -ComObject Word.Application; $w.Visible=$false; $w.DisplayAlerts=0
 $new=@(Get-Process WINWORD -ErrorAction SilentlyContinue|?{$before -notcontains $_.Id})
 "WORDPID:"+($new|%{$_.Id})
 $d=$w.Documents.Open((Resolve-Path $In).Path,[ref]$false,[ref]$true)
 "tables="+$d.Tables.Count
 $t=$d.Tables.Item(1)
 "uniform="+$t.Uniform+" rows="+$t.Rows.Count
 
 foreach($i in 1..3){ $r=$t.Rows.Item($i); "row{0} allowBreak={1} heading={2}" -f $i,$r.AllowBreakAcrossPages,$r.HeadingFormat }
}finally{ if($d){$d.Close([ref]$false)}; if($w){$w.Quit()} }

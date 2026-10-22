param($name,$repair)
$r=(Resolve-Path "orchestration/artifacts/aku-cografya-lisans/render").Path
$w=$null
try{
 $w=New-Object -ComObject Word.Application; $w.Visible=$false; $w.DisplayAlerts=0
 $m=[Type]::Missing
 $d=$w.Documents.Open("$r\$name.docx",$false,$true,$false,$m,$m,$m,$m,$m,$m,$m,$m,[bool]$repair)
 Write-Output ("opened pages=" + $d.ComputeStatistics(2))
 if($repair){ $d.ExportAsFixedFormat("$r\$name-word.pdf",17) }
 $d.Close($false)
} catch { Write-Output ("ERR " + $_.Exception.Message.Substring(0,60)) } finally { if($w){$w.Quit()} }

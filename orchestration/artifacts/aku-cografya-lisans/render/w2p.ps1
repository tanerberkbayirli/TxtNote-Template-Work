$r=(Resolve-Path "orchestration/artifacts/aku-cografya-lisans/render").Path
$w=$null
try{
 $w=New-Object -ComObject Word.Application; $w.Visible=$false; $w.DisplayAlerts=0
 $d=$w.Documents.Open("$r\cog2c.docx",[ref]$false,[ref]$false)
 $d.ExportAsFixedFormat("$r\cog2-word.pdf",17)
 $d.Close([ref]$false)
} finally { if($w){$w.Quit()} }

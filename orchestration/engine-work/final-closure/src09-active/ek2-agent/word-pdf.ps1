param([string]$In,[string]$Out)
$ErrorActionPreference='Stop'
$before=@(Get-Process WINWORD -ErrorAction SilentlyContinue | ForEach-Object Id)
$w=$null;$d=$null;$owned=$false
try{
 $w=New-Object -ComObject Word.Application
 $new=@(Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object {$before -notcontains $_.Id})
 if($new.Count -ne 1){throw 'Cannot identify an owned Word process'}
 $owned=$true;$w.Visible=$false;$w.DisplayAlerts=0
 $d=$w.Documents.Open((Resolve-Path $In).Path,[ref]$false,[ref]$true)
 $d.ExportAsFixedFormat((Join-Path (Get-Location) $Out),17)
}finally{if($d){$d.Close([ref]$false)};if($w -and $owned){$w.Quit()}}

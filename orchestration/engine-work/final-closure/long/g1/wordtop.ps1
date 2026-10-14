param([string]$Out)
$ErrorActionPreference='Stop'
$before=@(Get-Process WINWORD -ErrorAction SilentlyContinue | ForEach-Object {$_.Id})
$w=$null;$d=$null;$owned=$false
try{
 $w=New-Object -ComObject Word.Application
 $started=@(Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object {$before -notcontains $_.Id})
 if($started.Count -ne 1){throw 'no owned word'}
 $owned=$true;$w.Visible=$false;$w.DisplayAlerts=0
 $d=$w.Documents.Add()
 $d.PageSetup.TopMargin=70.9;$d.PageSetup.BottomMargin=70.9;$d.PageSetup.LeftMargin=113.4;$d.PageSetup.RightMargin=70.9;$d.PageSetup.HeaderDistance=35.45
 $res=@()
 foreach($case in @(@('before0-single-12',0,12,1,0),@('before72-m15-13b',72,13,1.5,1),@('before72-single-13b',72,13,1,1),@('before72-m15-12',72,12,1.5,0),@('before36-m15-13b',36,13,1.5,1),@('before12-m15-12',12,12,1.5,0),@('before6-m15-12',6,12,1.5,0))){
  $d.Content.Text='Test baslik'
  $p=$d.Paragraphs(1);$r=$p.Range;$r.Font.Name='Times New Roman';$r.Font.Size=[single]$case[2];$r.Font.Bold=[int]$case[4]
  $p.Format.SpaceBefore=[single]$case[1];$p.Format.SpaceAfter=0;$p.Format.LineSpacingRule=5;$p.Format.LineSpacing=[single](12*[double]$case[3])
  $y=$d.Range(0,1).Information(6)
  $res+=[pscustomobject]@{id=$case[0];y=$y}
 }
 # section-start case: second section, new page
 $d.Content.Text='A'+[char]12+'Test baslik'
 $res | ConvertTo-Json | Set-Content -LiteralPath $Out -Encoding UTF8
}finally{if($owned){if($d){$d.Close([ref]$false)};if($w){$w.Quit()}}}

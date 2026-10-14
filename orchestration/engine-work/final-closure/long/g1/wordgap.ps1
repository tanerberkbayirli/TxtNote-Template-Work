param([string]$Out)
$ErrorActionPreference='Stop'
$before=@(Get-Process WINWORD -ErrorAction SilentlyContinue | ForEach-Object {$_.Id})
$w=$null;$d=$null;$owned=$false
try{
 $w=New-Object -ComObject Word.Application
 $started=@(Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object {$before -notcontains $_.Id})
 if($started.Count -ne 1){throw 'no owned word'}
 $owned=$true;$w.Visible=$false;$w.DisplayAlerts=0
 $res=@()
 foreach($case in @(@(6,6,6,6),@(6,6,12,6),@(0,6,12,0),@(6,0,6,0),@(0,12,0,12),@(12,0,0,12),@(0,0,12,12),@(6,6,0,6))){
  $d=$w.Documents.Add()
  $d.PageSetup.TopMargin=70.9;$d.PageSetup.BottomMargin=70.9;$d.PageSetup.LeftMargin=113.4;$d.PageSetup.RightMargin=70.9
  $n=$d.Styles.Item(-1);$n.Font.Name='Times New Roman';$n.Font.Size=12;$n.ParagraphFormat.SpaceBefore=0;$n.ParagraphFormat.SpaceAfter=0;$n.ParagraphFormat.LineSpacingRule=5;$n.ParagraphFormat.LineSpacing=18
  $d.Content.Text='Para one'
  $d.Content.InsertParagraphAfter()
  $d.Paragraphs(2).Range.InsertBefore('Para two')
  $p1=$d.Paragraphs(1);$p2=$d.Paragraphs(2)
  $p1.Format.SpaceBefore=[single]$case[0];$p1.Format.SpaceAfter=[single]$case[1]
  $p2.Format.SpaceBefore=[single]$case[2];$p2.Format.SpaceAfter=[single]$case[3]
  $y1=$p1.Range.Information(6);$y2=$p2.Range.Information(6)
  $res+=[pscustomobject]@{p1before=$case[0];p1after=$case[1];p2before=$case[2];p2after=$case[3];y1=$y1;y2=$y2;gap=[math]::Round($y2-$y1-20.7,2)}
  $d.Close([ref]$false);$d=$null
 }
 $res | ConvertTo-Json | Set-Content -LiteralPath $Out -Encoding UTF8
}finally{if($owned){if($d){$d.Close([ref]$false)};if($w){$w.Quit()}}}

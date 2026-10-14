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
 foreach($case in @(@('next',2,72,6,6),@('odd',5,72,6,6),@('next',2,72,0,0),@('next',2,72,6,0),@('next',2,72,0,6),@('next',2,36,6,6),@('next',2,12,6,6),@('next',2,72,12,12),@('next',2,72,6,12),@('continuous',3,72,6,6))){
  $d=$w.Documents.Add()
  $d.PageSetup.TopMargin=70.9;$d.PageSetup.BottomMargin=70.9;$d.PageSetup.LeftMargin=113.4;$d.PageSetup.RightMargin=70.9
  $n=$d.Styles.Item(-1);$n.Font.Name='Times New Roman';$n.Font.Size=12;$n.ParagraphFormat.SpaceBefore=[single]$case[3];$n.ParagraphFormat.SpaceAfter=[single]$case[4];$n.ParagraphFormat.LineSpacingRule=5;$n.ParagraphFormat.LineSpacing=18
  $d.Content.Text='Filler paragraph'
  $d.Content.InsertParagraphAfter()
  $r=$d.Paragraphs(2).Range
  $r.InsertBreak([int]$case[1])
  $cnt=$d.Paragraphs.Count
  $h=$d.Paragraphs($cnt)
  $h.Range.InsertBefore('Heading')
  $h=$d.Paragraphs($d.Paragraphs.Count)
  $h.Format.SpaceBefore=[single]$case[2];$h.Range.Font.Bold=-1;$h.Range.Font.Size=13
  $y=$h.Range.Information(6);$pg=$h.Range.Information(3)
  $res+=[pscustomobject]@{kind=$case[0];headingBefore=$case[2];normalBefore=$case[3];normalAfter=$case[4];y=$y;page=$pg;txt=$h.Range.Text}
  $d.Close([ref]$false);$d=$null
 }
 $res | ConvertTo-Json | Set-Content -LiteralPath $Out -Encoding UTF8
}finally{if($owned){if($d){$d.Close([ref]$false)};if($w){$w.Quit()}}}

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
 foreach($case in @(@('natural',72,0,6),@('natural',72,0,0),@('natural',36,0,6),@('natural',12,0,6),@('natural',6,0,6),@('natural',0,0,6),@('pbb',72,1,6),@('pbb',72,1,0),@('natural',72,0,12))){
  $d=$w.Documents.Add()
  $d.PageSetup.TopMargin=70.9;$d.PageSetup.BottomMargin=70.9;$d.PageSetup.LeftMargin=113.4;$d.PageSetup.RightMargin=70.9
  $n=$d.Styles.Item(-1);$n.Font.Name='Times New Roman';$n.Font.Size=12;$n.ParagraphFormat.SpaceBefore=[single]$case[3];$n.ParagraphFormat.SpaceAfter=6;$n.ParagraphFormat.LineSpacingRule=5;$n.ParagraphFormat.LineSpacing=18
  $d.Content.Text='x'
  $kind=$case[0]
  $y=$null;$pg=$null
  if($kind -eq 'pbb'){
    $d.Content.InsertParagraphAfter();$d.Paragraphs(2).Range.Text='Heading'
    $h=$d.Paragraphs(2);$h.Format.SpaceBefore=[single]$case[1];$h.Format.PageBreakBefore=-1;$h.Range.Font.Bold=-1;$h.Range.Font.Size=13
    $y=$h.Range.Information(6);$pg=$h.Range.Information(3)
  } else {
    $i=1
    while($true){
      $d.Content.InsertParagraphAfter();$i++
      $d.Paragraphs($i).Range.Text='Filler '+$i
      $d.Content.InsertParagraphAfter();$i++
      $d.Paragraphs($i).Range.Text='Heading'
      $h=$d.Paragraphs($i);$h.Format.SpaceBefore=[single]$case[1];$h.Range.Font.Bold=-1;$h.Range.Font.Size=13
      $pg=$h.Range.Information(3)
      if($pg -ge 2){ $y=$h.Range.Information(6); break }
      # remove heading formatting and reuse as filler
      $h.Format.SpaceBefore=[single]$case[3];$h.Range.Font.Bold=0;$h.Range.Font.Size=12;$h.Range.Text='Filler'
      if($i -gt 80){break}
    }
  }
  $res+=[pscustomobject]@{kind=$kind;headingBefore=$case[1];normalBefore=$case[3];y=$y;page=$pg}
  $d.Close([ref]$false);$d=$null
 }
 $res | ConvertTo-Json | Set-Content -LiteralPath $Out -Encoding UTF8
}finally{if($owned){if($d){$d.Close([ref]$false)};if($w){$w.Quit()}}}

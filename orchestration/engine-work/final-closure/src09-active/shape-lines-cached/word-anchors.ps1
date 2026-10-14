$ErrorActionPreference='Stop'
$before=@(Get-Process WINWORD -ErrorAction SilentlyContinue | ForEach-Object Id)
$w=$null;$d=$null;$owned=$false
try{
 $w=New-Object -ComObject Word.Application
 $new=@(Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object {$before -notcontains $_.Id})
 if($new.Count -ne 1){throw 'Cannot identify an owned Word process'}
 $owned=$true;$w.Visible=$false;$w.DisplayAlerts=0
 $src09Case=(Get-Content -Raw -Encoding UTF8 orchestration/engine-work/mission01/acceptance-v3.json|ConvertFrom-Json).cases|Where-Object id -eq 'SRC09'
 $d=$w.Documents.Open((Resolve-Path $src09Case.input.path).Path,[ref]$false,[ref]$true)
 $d.Repaginate();$out=@()
 foreach($s in $d.Shapes){
  $text='';try{if($s.TextFrame.HasText){$text=$s.TextFrame.TextRange.Text}}catch{}
  if($text -match 'Sosyal|Problem' -or ($s.Anchor.Start -ge 50369 -and $s.Anchor.Start -le 50420) -or ($s.Anchor.Start -ge 112650 -and $s.Anchor.Start -le 112800)){
   $anchor=$s.Anchor
   $out+=@{text=$text;top=$s.Top;left=$s.Left;height=$s.Height;width=$s.Width;vFrom=$s.RelativeVerticalPosition;hFrom=$s.RelativeHorizontalPosition;wrap=$s.WrapFormat.Type;anchorStart=$anchor.Start;anchorY=$anchor.Information(6);page=$anchor.Information(3);paraId=[regex]::Match($anchor.Paragraphs.Item(1).Range.WordOpenXML,'w14:paraId="([^"]+)"').Groups[1].Value}
  }
 }
 $out|ConvertTo-Json -Depth 4|Set-Content -LiteralPath 'orchestration/engine-work/final-closure/src09-active/shape-lines-cached/word-anchors.json' -Encoding utf8
}finally{if($d){$d.Close([ref]$false)};if($w -and $owned){$w.Quit()}}

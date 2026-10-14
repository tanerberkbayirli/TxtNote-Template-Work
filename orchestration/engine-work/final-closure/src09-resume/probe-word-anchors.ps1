$ErrorActionPreference='Stop'
$oldIds=@(Get-Process WINWORD -ErrorAction SilentlyContinue | ForEach-Object {$_.Id})
$word=$null
$doc=$null
$owned=$false
try {
  $word=New-Object -ComObject Word.Application
  $new=@(Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object {$oldIds -notcontains $_.Id})
  if($new.Count -ne 1){throw 'Cannot identify one owned Word process'}
  $owned=$true
  $word.Visible=$false
  $word.DisplayAlerts=0
  $acceptance=Get-Content orchestration/engine-work/mission01/acceptance-v3.json -Raw -Encoding utf8 | ConvertFrom-Json
  $case=$acceptance.cases | Where-Object {$_.id -eq 'SRC09'}
  $inputPath=if($case.input){$case.input.path}else{$case.inputs[0].path}
  $doc=$word.Documents.Open((Resolve-Path $inputPath).Path,$false,$true)
  $doc.Repaginate()
  $range=$doc.Content.Duplicate
  $find=$range.Find
  $find.ClearFormatting()
  $find.Text=([char]0x15e)+'ekil 2.6.'
  while($find.Execute()){
    if($range.Information(3) -eq 48){break}
    $range.Collapse(0)
  }
  if($range.Information(3) -ne 48){throw 'Caption on page48 not found'}
  $range.MoveStart(4,-15) | Out-Null
  $rows=@()
  foreach($paragraph in $range.Paragraphs){
    $r=$paragraph.Range
    $word.ActiveWindow.ScrollIntoView($r,$true)
    $rows+=@{text=$r.Text.Substring(0,[Math]::Min(60,$r.Text.Length));start=$r.Start;page=$r.Information(3);y=$r.Information(6);line=$paragraph.Format.LineSpacing;markSize=$r.Characters.Last.Font.Size;xml=$r.WordOpenXML}
  }
  $shapes=@()
  foreach($shape in $doc.Shapes){
    $anchor=$shape.Anchor
    $pageNumber=$anchor.Information(3)
    if($pageNumber -ne 48){continue}
    $word.ActiveWindow.ScrollIntoView($anchor,$true)
    $shapes+=@{name=$shape.Name;anchorStart=$anchor.Start;anchorY=$anchor.Information(6);top=$shape.Top;left=$shape.Left;width=$shape.Width;height=$shape.Height;wrap=$shape.WrapFormat.Type;distTop=$shape.WrapFormat.DistanceTop;distBottom=$shape.WrapFormat.DistanceBottom}
  }
  @{pid=$new[0].Id;rows=$rows;shapes=$shapes} | ConvertTo-Json -Depth 8 | Set-Content orchestration/engine-work/final-closure/src09-resume/word-anchors.json -Encoding utf8
  Write-Output 'Word anchor probe saved'
} finally {
  if($doc){$doc.Close([ref]$false)}
  if($word -and $owned){$word.Quit()}
}

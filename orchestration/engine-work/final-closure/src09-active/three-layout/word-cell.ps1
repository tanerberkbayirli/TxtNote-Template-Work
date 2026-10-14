$ErrorActionPreference='Stop'
$before=@(Get-Process WINWORD -ErrorAction SilentlyContinue | ForEach-Object Id)
$w=$null;$d=$null;$owned=$false
try{
 $w=New-Object -ComObject Word.Application
 $new=@(Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object {$before -notcontains $_.Id})
 if($new.Count -ne 1){throw 'Cannot identify an owned Word process'}
 $owned=$true;$w.Visible=$false;$w.DisplayAlerts=0
 $d=$w.Documents.Open((Resolve-Path 'orchestration/engine-work/final-closure/long/table-only-source.docx').Path,[ref]$false,[ref]$true)
 $d.Repaginate();$out=@()
 foreach($rc in @(@(30,3),@(25,2),@(25,3))){
 $cell=$d.Tables.Item(1).Cell($rc[0],$rc[1])
 foreach($p in $cell.Range.Paragraphs){$out+=@{cell="$($rc[0]),$($rc[1])";text=$p.Range.Text;font=$p.Range.Font.Name;size=$p.Range.Font.Size;line=$p.Format.LineSpacing;rule=$p.Format.LineSpacingRule;before=$p.Format.SpaceBefore;after=$p.Format.SpaceAfter;y=$p.Range.Information(6);page=$p.Range.Information(3)}}
 }
 $out|ConvertTo-Json -Depth 4|Set-Content -LiteralPath 'orchestration/engine-work/final-closure/src09-active/three-layout/word-cells.json' -Encoding utf8
}finally{if($d){$d.Close([ref]$false)};if($w -and $owned){$w.Quit()}}

$ErrorActionPreference='Stop'
$before=@(Get-Process WINWORD -ErrorAction SilentlyContinue | ForEach-Object Id)
$w=$null;$d=$null;$owned=$false
try{
 $w=New-Object -ComObject Word.Application
 $new=@(Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object {$before -notcontains $_.Id})
 if($new.Count -ne 1){throw 'Cannot identify an owned Word process'}
 $owned=$true;$w.Visible=$false;$w.DisplayAlerts=0
 $src=(Get-Content orchestration/engine-work/final-closure/src09-active/ek2-agent/path.txt -Raw -Encoding utf8).Trim()
 $path=(Get-ChildItem -Recurse -Filter 'Yasar_Lisansustu_Tez_Sablonu_TR_2024-11-19.docx' Butun-Sablonlar | Select-Object -First 1).FullName
 $d=$w.Documents.Open($path,[ref]$false,[ref]$true)
 $d.Repaginate()
 $res=@()
 foreach($t in $d.Tables){
   try{ if($t.Range.Text -match 'Chowdury ve Hossain' -and $t.Range.Text -match 'ilin'){ 
     $n=$t.Rows.Count
     $res+=@{rows=$n;page=$t.Range.Information(3)}
     foreach($cell in $t.Range.Cells){ if($cell.RowIndex -ge 7 -and $cell.RowIndex -le 9){
       $ps=@(); foreach($p in $cell.Range.Paragraphs){ $ps+=@{y=$p.Range.Information(6);pg=$p.Range.Information(3);b=$p.Format.SpaceBefore;a=$p.Format.SpaceAfter;l=$p.Format.LineSpacing;rule=$p.Format.LineSpacingRule;sz=$p.Range.Font.Size;st=$p.Style.NameLocal;txt=$p.Range.Text.Substring(0,[Math]::Min(8,$p.Range.Text.Length))} }
       $res+=@{r=$cell.RowIndex;c=$cell.ColumnIndex;h=$cell.Height;hr=$cell.HeightRule;va=$cell.VerticalAlignment;ps=$ps} } }
     break } }catch{$res+=@{err=$_.Exception.Message}}
 }
 $res|ConvertTo-Json -Depth 6|Set-Content -LiteralPath 'orchestration/engine-work/final-closure/src09-active/ek2-agent/word-row.json' -Encoding utf8
}finally{if($d){$d.Close([ref]$false)};if($w -and $owned){$w.Quit()}}

param([string]$InputDoc='orchestration/engine-work/final-closure/long/native-drawings.docx',[string]$OutputDoc='orchestration/engine-work/final-closure/long/native-edited.docx',[string]$Report='orchestration/engine-work/final-closure/long/word-native-edit.json')
$ErrorActionPreference='Stop'
$word=$null;$doc=$null;$probe=$null;$owns=$false
$result=@{status='FAIL'}
try {
 $before=@(Get-Process WINWORD -ErrorAction SilentlyContinue|ForEach-Object {$_.Id})
 $word=New-Object -ComObject Word.Application
 $created=@(Get-Process WINWORD -ErrorAction SilentlyContinue|Where-Object {$_.Id -notin $before})
 if($created.Count -ne 1){throw 'Cannot establish one owned Word instance'}
 $owns=$true;$result.pid=$created[0].Id;Write-Output ('WORDPID:'+$result.pid)
 $word.Visible=$false;$word.DisplayAlerts=0
 $result.stage='open'; $doc=$word.Documents.Open((Resolve-Path $InputDoc).Path,[ref]$false,[ref]$false)
 $result.shapes=$doc.Shapes.Count;$result.inlineShapes=$doc.InlineShapes.Count;$result.equations=$doc.OMaths.Count
 $edited=$false
 foreach($shape in $doc.InlineShapes){
  try { if($shape.HasSmartArt -and $shape.SmartArt.AllNodes.Count -gt 0){$node=$shape.SmartArt.AllNodes.Item(1);$result.originalText=$node.TextFrame2.TextRange.Text;$result.stage='edit-smartart';$node.TextFrame2.TextRange.Text='Word edit proof';$edited=$true;break} }catch{}
 }
 if(!$edited){foreach($shape in $doc.Shapes){try{if($shape.TextFrame.HasText){$result.originalText=$shape.TextFrame.TextRange.Text;$shape.TextFrame.TextRange.Text='Word edit proof';$edited=$true;break}}catch{}}}
 if(!$edited){throw 'No editable source drawing text found'}
 if($result.equations -lt 1){throw 'Native Word equation missing'}
 $out=[System.IO.Path]::GetFullPath($OutputDoc)
 $result.stage='save'; $doc.SaveAs2([ref]$out,[ref]16)
 $doc.Close([ref]$false);[void][System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($doc);$doc=$null
 $result.stage='reopen'; $doc=$word.Documents.Open($out,[ref]$false,[ref]$true)
 $result.reopenedShapes=$doc.Shapes.Count;$result.reopenedInlineShapes=$doc.InlineShapes.Count;$result.reopenedEquations=$doc.OMaths.Count
 $result.editedText='Word edit proof'
 $result.status='PASS'
}catch{$result.error=$_.Exception.Message}
finally{
 if($doc){try{$doc.Close([ref]$false)}catch{};[void][System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($doc)}
 if($word){if($owns){try{$word.Quit()}catch{}};[void][System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($word)}
 $result|ConvertTo-Json -Depth 5|Set-Content $Report -Encoding UTF8
}
Write-Output ($result|ConvertTo-Json -Compress)
if($result.status -ne 'PASS'){exit 1}

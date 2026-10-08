$ErrorActionPreference='Stop'
$folder=[IO.Path]::GetFullPath('orchestration/validation')
$docx=Join-Path $folder 'word-native-toc-prototype.docx'; $pdf=Join-Path $folder 'word-native-toc-prototype.pdf'
$started=Get-Date; $prior=@(Get-CimInstance Win32_Process -Filter "Name='WINWORD.EXE'" | ForEach-Object { [int]$_.ProcessId })
$word=$null; $doc=$null; $owned=$false; $ownedPid=$null
$report=[ordered]@{startedAt=$started.ToString('o');priorWordPids=$prior;ownedPid=$null;results=@();closed=$false}
function Find-Owned($priorPids,$startedAt){$ps=@(Get-CimInstance Win32_Process -Filter "Name='WINWORD.EXE'" | Where-Object{[int]$_.ProcessId -notin $priorPids -and $_.CreationDate -and ([datetime]$_.CreationDate) -ge $startedAt.AddSeconds(-2)}); if($ps.Count -ne 1){return $null};$p=$ps[0];if($p.ExecutablePath -ne 'C:\Program Files\Microsoft Office\Root\Office16\WINWORD.EXE' -or $p.CommandLine -notmatch '/Automation\s+-Embedding'){return $null};return $p}
try{
 $word=New-Object -ComObject Word.Application;$until=(Get-Date).AddSeconds(20);do{Start-Sleep -Milliseconds 300;$proof=Find-Owned $prior $started}while($null -eq $proof -and (Get-Date) -lt $until);if($null -eq $proof){throw 'Word ownership not proven'};$owned=$true;$ownedPid=[int]$proof.ProcessId;$report.ownedPid=$ownedPid;$report.processProof=[ordered]@{pid=$proof.ProcessId;parent=$proof.ParentProcessId;created=$proof.CreationDate;path=$proof.ExecutablePath;command=$proof.CommandLine;session=$proof.SessionId};if([int]$word.Documents.Count -ne 0){throw 'New Word had existing documents'}
 $word.Visible=$false;$word.DisplayAlerts=0;$doc=$word.Documents.Add();$sel=$word.Selection
 $sel.Style=-2;$sel.TypeText('Original heading title');$sel.TypeParagraph();$sel.Style=-2;$sel.TypeText('Second heading');$sel.TypeParagraph();$sel.Style=-1;$sel.TypeText('body text');$sel.TypeParagraph()
 $rng=$doc.Range(0,0);$toc=$doc.TablesOfContents.Add($rng,$true,1,3,$false,'',$true,$true,'',$true,$false,$true);$toc.Update();$report.headingTocBefore=$toc.Range.Text
 $end=$doc.Content.End-1;$rng=$doc.Range($end,$end);[void]$rng.Fields.Add($rng,9,'Static snapshot row \f A \l 1',$false);$sel=$word.Selection;$sel.EndKey(6);$sel.TypeParagraph();$end=$doc.Content.End-1;$rng=$doc.Range($end,$end);[void]$rng.Fields.Add($rng,9,'{ REF sourceHeading } \f B \l 1',$false);$sel=$word.Selection;$sel.EndKey(6);$sel.TypeParagraph();$rng=$doc.Range(0,0);$tocA=$doc.TablesOfContents.Add($rng,$false,1,9,$true,'A',$true,$true,'' ,$true,$false,$true);$tocA.Update();$report.tcTocInitial=$tocA.Range.Text
 $doc.Bookmarks.Add('sourceHeading',$doc.Paragraphs.Item(1).Range) | Out-Null
 $doc.Repaginate();$toc.Update();$report.headingTocInitial=$toc.Range.Text
 $target=$doc.Content.Duplicate;$find=$target.Find;$find.Text='Original heading title';$find.Forward=$true;$find.Wrap=0;if(-not $find.Execute()){throw 'Could not locate initial heading'};$target.Text='Changed heading title';$report.renameVerified=$doc.Content.Text.Contains('Changed heading title') -and -not $doc.Content.Text.Contains('Original heading title');$doc.Repaginate();$toc.Update();$tocA.Update();$report.headingTocAfterRename=$toc.Range.Text;$report.tcTocAfterRename=$tocA.Range.Text
 $report.tcFieldCodes=@($doc.Fields|ForEach-Object{[ordered]@{code=$_.Code.Text;result=$_.Result.Text}})
 $doc.SaveAs2($docx,16);$doc.ExportAsFixedFormat($pdf,17);$report.bodyText=$doc.Content.Text
}catch{$report.error=$_.ToString();Write-Output ("ERROR "+$_.ToString())}finally{$noSave=0;if($doc){$doc.Close([ref]$noSave);[void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($doc)};if($word){if($owned){$word.Quit([ref]$noSave)};[void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($word)};[GC]::Collect();[GC]::WaitForPendingFinalizers();if($ownedPid){$deadline=(Get-Date).AddSeconds(20);do{Start-Sleep -Milliseconds 500;$left=Get-CimInstance Win32_Process -Filter "ProcessId=$ownedPid" -ErrorAction SilentlyContinue}while($null -ne $left -and (Get-Date) -lt $deadline);$report.closed=$null -eq $left};$report|ConvertTo-Json -Depth 7|Set-Content -LiteralPath (Join-Path $folder 'word-native-toc-prototype-report.json') -Encoding utf8}



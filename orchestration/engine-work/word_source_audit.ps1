param([Parameter(Mandatory=$true)][string]$In, [Parameter(Mandatory=$true)][string]$Out, [string]$ReferencePdf='')
$ErrorActionPreference = 'Stop'
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class MissionWordProcess {
    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr handle, out uint processId);
}
'@
$previous = @(Get-Process WINWORD -ErrorAction SilentlyContinue | ForEach-Object { $_.Id })
$app = $null; $doc = $null; $probe = $null; $owned = $false
function Location($range) {
    $first = $range.Duplicate; $first.Collapse(1)
    $last = $range.Duplicate; $last.Collapse(0)
    $result = @{ start = [int]$range.Start; end = [int]$range.End; storyType = [int]$range.StoryType;
        firstPhysicalPage = [int]$first.Information(3); lastPhysicalPage = [int]$last.Information(3) }
    [void][System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($first)
    [void][System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($last)
    return $result
}
try {
    $app = New-Object -ComObject Word.Application
    $new = @(Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object { $previous -notcontains $_.Id })
    if ($new.Count -ne 1) { throw 'Cannot establish a newly owned Word process' }
    $probe = $app.Documents.Add([Type]::Missing, $false, 0, $true)
    [uint32]$wordProcessId = 0
    [void][MissionWordProcess]::GetWindowThreadProcessId([IntPtr]$probe.Windows.Item(1).Hwnd, [ref]$wordProcessId)
    if (!$wordProcessId -or $previous -contains $wordProcessId) { throw 'Refusing to use an existing Word process' }
    $owned = $true; $app.Visible = $false; $app.DisplayAlerts = 0
    Write-Output ("WORDPID:" + $wordProcessId); [Console]::Out.Flush()
    $probe.Close([ref]$false); [void][System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($probe); $probe=$null
    $doc = $app.Documents.Open((Resolve-Path -LiteralPath $In).Path, [ref]$false, [ref]$true)
    $doc.Repaginate()
    if ($ReferencePdf) {$doc.ExportAsFixedFormat([System.IO.Path]::GetFullPath($ReferencePdf),17); $doc.Repaginate()}
    $rows = @(); $counts = @{}
    foreach ($kind in @('Tables','OMaths','InlineShapes','Footnotes','Endnotes','Fields','Sections')) {
        $collection = $doc.$kind
        $counts[$kind]=[int]$collection.Count
        # Record representative locations without thousands of cross-process calls.
        # All native XML feature locations remain available in native-index.json.
        $indices=@(1..([Math]::Min(4,$collection.Count)) | Where-Object {$_ -ge 1 -and $_ -le $collection.Count})
        if ($collection.Count -gt 4) {$indices += $collection.Count}
        foreach ($i in $indices) {
            $item = $collection.Item($i)
            $range = if ($kind -eq 'Fields') { $item.Result } else { $item.Range }
            $loc = Location $range
            $text = [string]$range.Text
            $row = @{ kind=$kind; ordinal=$i; locator=("Word.{0}[{1}]" -f $kind,$i); location=$loc;
                textPrefix=$text.Substring(0,[Math]::Min(180,$text.Length)) }
            if ($kind -eq 'Fields') { $row.code = [string]$item.Code.Text }
            if ($kind -eq 'Footnotes' -or $kind -eq 'Endnotes') { $row.referenceLocation = Location $item.Reference }
            if ($kind -eq 'Tables') { $row.nestingLevel = [int]$item.NestingLevel }
            if ($kind -eq 'Sections') {
                $row.geometry = @{ widthPt=[double]$item.PageSetup.PageWidth; heightPt=[double]$item.PageSetup.PageHeight;
                    topPt=[double]$item.PageSetup.TopMargin; bottomPt=[double]$item.PageSetup.BottomMargin;
                    leftPt=[double]$item.PageSetup.LeftMargin; rightPt=[double]$item.PageSetup.RightMargin }
            }
            $rows += $row
            [void][System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($range)
            [void][System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($item)
        }
        [void][System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($collection)
    }
    $counts['Shapes']=[int]$doc.Shapes.Count
    $shapeIndices=@(1..([Math]::Min(4,$doc.Shapes.Count)) | Where-Object {$_ -ge 1 -and $_ -le $doc.Shapes.Count})
    if ($doc.Shapes.Count -gt 4) {$shapeIndices += $doc.Shapes.Count}
    foreach ($i in $shapeIndices) {
        $shape=$doc.Shapes.Item($i)
        $rows += @{kind='Shapes';ordinal=$i;locator=("Word.Shapes[{0}].Anchor" -f $i);location=(Location $shape.Anchor)}
        [void][System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($shape)
    }
    $stream=[System.IO.File]::OpenRead((Resolve-Path -LiteralPath $In).Path)
    $hasher=[System.Security.Cryptography.SHA256]::Create()
    try { $sourceHash=[BitConverter]::ToString($hasher.ComputeHash($stream)).Replace('-','').ToLowerInvariant() }
    finally {$stream.Dispose();$hasher.Dispose()}
    $result = @{ status='AUDITED'; source=(Resolve-Path -LiteralPath $In).Path;
        sha256=$sourceHash;
        physicalPages=[int]$doc.ComputeStatistics(2); wordPid=$wordProcessId; wordVersion=$app.Version; wordBuild=$app.Build;
        paragraphs=[int]$doc.Paragraphs.Count; listParagraphs=[int]$doc.ListParagraphs.Count; features=$rows;
        featureCollectionCounts=$counts; sampling='First four and final object of each Word collection; complete native XML positions are indexed separately.';
        referencePdf=$ReferencePdf; activePrinter=$app.ActivePrinter;
        pageDefinition='Word WdInformation=3 physical page from document start; not adjusted displayed page label';
        acceptance='Read-only source feature/page reference; no TxtEngine acceptance'; auditedAt=[DateTime]::UtcNow.ToString('o') }
    $result | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $Out -Encoding UTF8
    Write-Output ("AUDITED features=" + $rows.Count)
} catch {
    Write-Output ('AUDIT_FAILURE:' + $_.ScriptStackTrace)
    throw
} finally {
    if ($probe) {try {$probe.Close([ref]$false)} catch {}}
    if ($doc) {try {$doc.Close([ref]$false)} catch {}}
    if ($app -and $owned) {try {$app.Quit()} catch {}}
    if ($doc) {[void][System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($doc)}
    if ($app) {[void][System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($app)}
}

param(
    [Parameter(Mandatory=$true)][string]$DocumentPath,
    [Parameter(Mandatory=$true)][string]$PdfPath,
    [Parameter(Mandatory=$true)][string]$ReportPath
)
$ErrorActionPreference = 'Stop'
$report = [ordered]@{ status='FAIL'; document=[IO.Path]::GetFullPath($DocumentPath); pdf=[IO.Path]::GetFullPath($PdfPath); rendered=$false; shapes=@(); cleanExit=$false }
$word = $null
$document = $null
$prior = @(Get-Process WINWORD -ErrorAction SilentlyContinue | ForEach-Object { $_.Id })
$created = @()
try {
    $word = New-Object -ComObject Word.Application
    $created = @(Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object { $_.Id -notin $prior })
    $word.Visible = $false
    $word.DisplayAlerts = 0
    $word.AutomationSecurity = 3
    $report.wordVersion = $word.Version
    # Open read-only, do not update fields, add a recent-file entry or save changes.
    $document = $word.Documents.Open($report.document, $false, $true, $false)
    $document.Repaginate()
    $report.pages = $document.ComputeStatistics(2)
    $report.sections = $document.Sections.Count
    $report.tables = @()
    for ($i=1; $i -le $document.Tables.Count; $i++) {
        $table = $document.Tables.Item($i)
        if ($table.Range.Text -match 'Değişken|Bilgi') {
            $start=$table.Range.Duplicate; $end=$table.Range.Duplicate
            $collapseStart=1; $collapseEnd=0; $start.Collapse([ref]$collapseStart); $end.Collapse([ref]$collapseEnd)
            $cell=$table.Cell(1,1); $text=$cell.Range
            $report.tables += [ordered]@{ text=$table.Range.Text.Substring(0,[Math]::Min(90,$table.Range.Text.Length)); startPage=$start.Information(3); endPage=$end.Information(3); topMm=$start.Information(6)*25.4/72; bottomMm=$end.Information(6)*25.4/72; cellFont=$text.Font.Name; cellSize=$text.Font.Size; linePt=$text.ParagraphFormat.LineSpacing; lineRule=$text.ParagraphFormat.LineSpacingRule; padTopPt=$cell.TopPadding; padBottomPt=$cell.BottomPadding }
            foreach ($com in @($text,$cell,$start,$end)) { [void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($com) }
        }
        [void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($table)
    }
    for ($i=1; $i -le $document.Shapes.Count; $i++) {
        $shape = $document.Shapes.Item($i)
        $entry = [ordered]@{ name=$shape.Name; type=$shape.Type; xMm=[double]$shape.Left*25.4/72; yMm=[double]$shape.Top*25.4/72; widthMm=[double]$shape.Width*25.4/72; heightMm=[double]$shape.Height*25.4/72; horizontalReference=$shape.RelativeHorizontalPosition; verticalReference=$shape.RelativeVerticalPosition }
        if ($shape.TextFrame.HasText) {
            $range = $shape.TextFrame.TextRange
            $entry.text = $range.Text.TrimEnd([char]13)
            $entry.font = $range.Font.Name
            $entry.fontSizePt = $range.Font.Size
            [void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($range)
        }
        $report.shapes += $entry
        [void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($shape)
    }
    [IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($report.pdf)) | Out-Null
    $document.ExportAsFixedFormat($report.pdf,17)
    if (-not (Test-Path -LiteralPath $report.pdf) -or (Get-Item -LiteralPath $report.pdf).Length -lt 1000) { throw 'Word did not produce a PDF.' }
    $report.rendered = $true
    $report.status = 'PASS'
} catch { $report.error = $_.Exception.Message; $report.errorLine = $_.InvocationInfo.ScriptLineNumber }
finally {
    $noSave = 0
    if ($document) { $document.Close([ref]$noSave); [void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($document) }
    if ($word) { $word.Quit([ref]$noSave); [void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($word) }
    [GC]::Collect(); [GC]::WaitForPendingFinalizers()
    $clean = $true
    foreach ($process in $created) { if (-not $process.HasExited -and -not $process.WaitForExit(15000)) { $clean = $false } }
    $report.cleanExit = $clean
    if (-not $clean) { $report.status='FAIL'; $report.error='Verification Word instance did not close.' }
    $fullReport = [IO.Path]::GetFullPath($ReportPath)
    [IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($fullReport)) | Out-Null
    $report | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $fullReport -Encoding utf8
    $report | ConvertTo-Json -Depth 8
}
if ($report.status -ne 'PASS') { exit 1 }

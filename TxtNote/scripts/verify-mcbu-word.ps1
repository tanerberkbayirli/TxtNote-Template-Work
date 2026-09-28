param(
    [Parameter(Mandatory = $true)][string]$DocumentPath,
    [string]$ReportPath = 'output/font-compliance/word.json'
)
$ErrorActionPreference = 'Stop'
$report = [ordered]@{
    available = $false; renderPerformed = $false; status = "UNVERIFIED $([char]0x2014) ENVIRONMENT LIMITATION"
    document = [IO.Path]::GetFullPath($DocumentPath); pageCount = $null; sectionCount = $null
    numberingSanity = $false; sections = @(); processCleanlyClosed = $false
}
$word = $null
$document = $null
$priorProcesses = @(Get-Process WINWORD -ErrorAction SilentlyContinue | ForEach-Object { $_.Id })
$createdProcesses = @()
try {
    $registration = Get-ItemProperty 'Registry::HKEY_CLASSES_ROOT\Word.Application\CLSID' -ErrorAction SilentlyContinue
    $type = [Type]::GetTypeFromProgID('Word.Application')
    $report.registryClsid = if ($registration) { $registration.'(default)' } else { $null }
    if ($registration -and $type) {
        $report.available = $true
        $server = Get-ItemProperty "Registry::HKEY_CLASSES_ROOT\CLSID\$($report.registryClsid)\LocalServer32" -ErrorAction SilentlyContinue
        $report.localServer = if ($server) { $server.'(default)' } else { $null }
        $report.stage = 'Activation'
        $word = New-Object -ComObject Word.Application
        $createdProcesses = @(Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object { $_.Id -notin $priorProcesses })
        $word.Visible = $false
        $word.DisplayAlerts = 0
        $word.AutomationSecurity = 3
        $report.wordVersion = $word.Version
        # Read-only, no recent-file entry, no save and no field/TOC rewriting.
        $report.stage = 'Open'
        $document = $word.Documents.Open($report.document, $false, $true, $false)
        $report.stage = 'Repaginate'
        $document.Repaginate()
        $report.pageCount = $document.ComputeStatistics(2) # wdStatisticPages
        $report.sectionCount = $document.Sections.Count
        $sections = @()
        for ($index = 1; $index -le $report.sectionCount; $index++) {
            $section = $document.Sections.Item($index)
            $range = $section.Range.Duplicate
            $collapseStart = 1
            $range.Collapse([ref]$collapseStart) # wdCollapseStart
            $footer = $section.Footers.Item(1) # wdHeaderFooterPrimary
            $numbers = $footer.PageNumbers
            $count = $numbers.Count
            $sections += [ordered]@{
                index = $index; physicalStart = $range.Information(3); logicalStart = $range.Information(1)
                footerNumberCount = $count
                numberStyle = if ($count) { $numbers.NumberStyle } else { $null }
                restart = if ($count) { $numbers.RestartNumberingAtSection } else { $null }
                startingNumber = if ($count) { $numbers.StartingNumber } else { $null }
            }
            foreach ($com in @($numbers, $footer, $range, $section)) { [void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($com) }
        }
        $report.sections = $sections
        $roman = @($sections | Where-Object { $_.footerNumberCount -gt 0 -and $_.numberStyle -eq 1 -and $_.restart -and $_.startingNumber -eq 1 -and $_.logicalStart -eq 1 }) # uppercase Roman
        $arabic = @($sections | Where-Object { $_.footerNumberCount -gt 0 -and $_.numberStyle -eq 0 -and $_.restart -and $_.startingNumber -eq 1 -and $_.logicalStart -eq 1 })
        $report.renderPerformed = $true
        if ($report.pageCount -lt 1 -or $report.sectionCount -lt 13) { throw 'Word page/section count sanity failed.' }
        if (-not $roman.Count -or -not $arabic.Count -or $roman[0].index -ge $arabic[0].index -or $roman[0].physicalStart -ge $arabic[0].physicalStart) { throw 'Word Roman-to-Arabic numbering sanity failed.' }
        $report.numberingSanity = $true
        $report.status = 'PASS'
    }
} catch {
    $report.error = $_.Exception.Message
    $report.errorLine = $_.InvocationInfo.ScriptLineNumber
    if ($report.renderPerformed -or $report.stage -in @('Open', 'Repaginate')) { $report.status = 'FAIL' }
} finally {
    $noSave = 0
    if ($document) { $document.Close([ref]$noSave); [void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($document); $document = $null }
    if ($word) { $word.Quit([ref]$noSave); [void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($word); $word = $null }
    [GC]::Collect(); [GC]::WaitForPendingFinalizers(); [GC]::Collect()
    $clean = $true
    foreach ($process in $createdProcesses) { if (-not $process.HasExited -and -not $process.WaitForExit(15000)) { $clean = $false } }
    $report.processCleanlyClosed = $clean
    if (-not $clean) { $report.status = 'FAIL'; $report.error = 'Verification Word process did not exit after Quit.' }
    $fullReportPath = [IO.Path]::GetFullPath($ReportPath)
    [IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($fullReportPath)) | Out-Null
    $report | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $fullReportPath -Encoding utf8
    $report | ConvertTo-Json -Depth 8
}
if ($report.status -eq 'FAIL') { exit 1 }

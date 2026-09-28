$ErrorActionPreference = 'Stop'
$taskWord = $null
$taskDoc = $null
$reports = @()
$noSave = 0
try {
    $taskWord = New-Object -ComObject Word.Application
    $taskWord.Visible = $false
    $taskWord.DisplayAlerts = 0
    $taskWord.AutomationSecurity = 3
    foreach ($name in @('before-short', 'after-short', 'before-long', 'after-long')) {
        $path = (Resolve-Path -LiteralPath "output/blank-pages/$name.docx").Path
        $taskDoc = $taskWord.Documents.Open($path, $false, $true, $false)
        $taskDoc.Repaginate()
        $count = $taskDoc.ComputeStatistics(2)
        $blank = @()
        for ($page = 1; $page -le $count; $page++) {
            $start = $taskDoc.GoTo(1, 1, $page).Start
            $end = if ($page -lt $count) { $taskDoc.GoTo(1, 1, ($page + 1)).Start } else { $taskDoc.Content.End }
            $text = $taskDoc.Range($start, $end).Text -replace '[\s\x00-\x1f]', ''
            if (-not $text) { $blank += $page }
        }
        $sections = @()
        foreach ($index in @(3, 15, 17, 18)) {
            $range = $taskDoc.Sections.Item($index).Range.Duplicate
            $range.Collapse(1)
            $sections += @{ index = $index; physical = $range.Information(3); logical = $range.Information(1) }
        }
        $reports += @{ name = $name; pages = $count; blankPages = $blank; starts = $sections }
        $taskDoc.Close([ref]$noSave)
        [void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($taskDoc)
        $taskDoc = $null
    }
    foreach ($kind in @('short', 'long')) {
        $before = $reports | Where-Object { $_.name -eq "before-$kind" }
        $after = $reports | Where-Object { $_.name -eq "after-$kind" }
        if ($after.blankPages.Count -ne 0 -or $after.pages -ne ($before.pages - 1)) { throw "Word blank-page regression: $kind" }
        if ($after.starts[0].logical -ne 1 -or $after.starts[1].logical -ne 1) { throw 'Word numbering restart failed' }
    }
    @{ status = 'PASS'; documents = $reports; saved = $false } | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath output/blank-pages/word-render.json -Encoding utf8
    $reports | ConvertTo-Json -Depth 8
} finally {
    if ($taskDoc) { $taskDoc.Close([ref]$noSave); [void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($taskDoc) }
    if ($taskWord) { $taskWord.Quit([ref]$noSave); [void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($taskWord) }
    [GC]::Collect(); [GC]::WaitForPendingFinalizers()
}

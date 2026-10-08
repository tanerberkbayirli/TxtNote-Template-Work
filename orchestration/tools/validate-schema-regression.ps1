param([string]$Directory = 'orchestration/validation/word-compat/phase-5.1')
$ErrorActionPreference = 'Stop'
$phaseDir = [System.IO.Path]::GetFullPath($Directory)
$repoRoot = (Get-Location).Path
$baseline = Get-Content -LiteralPath 'orchestration/validation/phase4-close/acceptance.json' -Raw | ConvertFrom-Json
$index = @{}
foreach ($entry in $baseline.wordRegression.reports) {
  $report = Get-Content -LiteralPath $entry.report -Raw | ConvertFrom-Json
  foreach ($variant in $report.variants.PSObject.Properties) {
    $index[($entry.target + '/' + $variant.Name)] = $variant.Value.docx
  }
}
$schemaDir = Join-Path $phaseDir 'schema'
[void][System.IO.Directory]::CreateDirectory($schemaDir)
$rows = @()
foreach ($target in Get-ChildItem -LiteralPath (Join-Path $phaseDir 'regression') -Directory | Sort-Object Name) {
  foreach ($docx in Get-ChildItem -LiteralPath (Join-Path $target.FullName 'run') -Filter '*.docx' -File | Sort-Object Name) {
    $variant = $docx.BaseName
    $out = Join-Path $schemaDir ($target.Name + '.' + $variant + '.json')
    & powershell -NoProfile -ExecutionPolicy Bypass -File 'orchestration/tools/validate-openxml.ps1' -In $docx.FullName -Out $out | Out-Null
    $current = Get-Content -LiteralPath $out -Raw | ConvertFrom-Json
    $oldPath = $index[($target.Name + '/' + $variant)]
    $old = $null
    $oldOut = $null
    if ($oldPath -and (Test-Path -LiteralPath $oldPath)) {
      $oldOut = Join-Path $schemaDir ($target.Name + '.' + $variant + '.baseline.json')
      & powershell -NoProfile -ExecutionPolicy Bypass -File 'orchestration/tools/validate-openxml.ps1' -In $oldPath -Out $oldOut | Out-Null
      $old = Get-Content -LiteralPath $oldOut -Raw | ConvertFrom-Json
    }
    $currentFamilies = @($current.errors | ForEach-Object { $_.id + ': ' + $_.description } | Sort-Object -Unique)
    $oldFamilies = @($old.errors | ForEach-Object { $_.id + ': ' + $_.description } | Sort-Object -Unique)
    $newFamilies = @($currentFamilies | Where-Object { $oldFamilies -notcontains $_ })
    $rows += @{ target = $target.Name; variant = $variant; status = $current.status; errorCount = $current.errorCount;
      report = $out; inputSha256 = $current.inputSha256; baselineReport = $oldOut; baselineStatus = $old.status;
      baselineErrorCount = $old.errorCount; newErrorDescriptions = $newFamilies; errorFamilies = $currentFamilies }
  }
}
@{ status = $(if (@($rows | Where-Object { $_.status -ne 'PASS' }).Count) { 'FAIL' } else { 'PASS' });
   sdkVersion = '2.9.1.0'; schemaProfile = 'Office2016'; variants = $rows.Count; results = $rows;
   note = 'Independent SDK schema acceptance; Word open/layout PASS does not override these errors. Baseline comparison distinguishes pre-existing findings.'
} | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $phaseDir 'schema-manifest.json') -Encoding UTF8
Write-Output ("Schema variants: " + $rows.Count)

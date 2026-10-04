param([Parameter(Mandatory=$true)][string]$Run, [string]$Revision = '8176503db8688ec019a3304da7437ac135f72cbd')
$ErrorActionPreference = 'Stop'
$phase2Log = Join-Path $PSScriptRoot ($Run + '.log')
$phase2Entries = @()
$phase2Totals = [ordered]@{ PASS=0; FAIL=0; INFO=0; SKIPPED=0; CONFLICT=0 }
$phase2EmptyDiff = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
$phase2KnownFailures = @('J03-Arial-10-justify-line-breaks','J03-Arial-10-justify-last-line-words','J04-Arial-12-justify-line-breaks')
foreach ($phase2Line in Get-Content -LiteralPath $phase2Log) {
  $phase2Match = [regex]::Match($phase2Line, '^([^:]+):.* -> (.+\.json)$')
  if (!$phase2Match.Success) { continue }
  $phase2Path = $phase2Match.Groups[2].Value.Trim()
  $phase2Report = Get-Content -LiteralPath $phase2Path -Raw | ConvertFrom-Json
  if ($phase2Report.sourceProvenance.revision -ne $Revision -or $phase2Report.sourceProvenance.trackedDiffSha256 -ne $phase2EmptyDiff) { throw "Unexpected source snapshot: $phase2Path" }
  foreach ($phase2Status in @($phase2Totals.Keys)) { $phase2Totals[$phase2Status] += [int]$phase2Report.counts.$phase2Status }
  $phase2Failures = @($phase2Report.checks | Where-Object { $_.status -notin @('PASS','INFO') })
  if ($phase2Report.target -eq 'engine-word-justify') {
    if ((($phase2Failures.id | Sort-Object) -join ',') -ne (($phase2KnownFailures | Sort-Object) -join ',')) { throw 'Justification failures differ from accepted baseline' }
  } elseif ($phase2Failures.Count) { throw "Unexpected failing checks: $phase2Path" }
  $phase2Environments = [ordered]@{}
  foreach ($phase2Variant in $phase2Report.variants.PSObject.Properties) {
    if (!$phase2Variant.Value.wordRenderInfo) { throw "Missing Word runtime provenance: $phase2Path / $($phase2Variant.Name)" }
    $phase2Environments[$phase2Variant.Name] = $phase2Variant.Value.wordRenderInfo
  }
  $phase2ExportAudit = @()
  if ($Run -eq 'final-run-2') {
    $phase2ExpectedExports = 2 * @($phase2Report.variants.PSObject.Properties).Count
    $phase2CommandLog = Join-Path (Split-Path -Parent $phase2Path) 'run/check.log'
    $phase2ExportAudit = @(Get-Content -LiteralPath $phase2CommandLog | Where-Object { $_ -match '^export .+: status ' } | Select-Object -Last $phase2ExpectedExports)
    if ($phase2ExportAudit.Count -ne $phase2ExpectedExports -or @($phase2ExportAudit | Where-Object { $_ -notmatch ': status 0$' -or $_ -match '\(retry\)' }).Count) { throw "Final two runs contain an export failure or retry: $phase2CommandLog" }
  }
  $phase2Entries += [ordered]@{ target=$phase2Report.target; report=$phase2Path; reportSha256=(Get-FileHash -LiteralPath $phase2Path -Algorithm SHA256).Hash.ToLower(); counts=$phase2Report.counts; sourceProvenance=$phase2Report.sourceProvenance; checksSha256=$phase2Report.checksSha256; artifactSha256=$phase2Report.artifactSha256; wordEnvironment=$phase2Environments; finalTwoRunExportAudit=$phase2ExportAudit; failures=$phase2Failures }
}
if ($phase2Entries.Count -ne 14 -or !(Select-String -LiteralPath $phase2Log -SimpleMatch '--all: 14 targets, 1 with FAIL/error' -Quiet)) { throw 'Incomplete full regression run' }
[ordered]@{ run=$Run; codeRevision=$Revision; command='node orchestration/tools/check.mjs --all --word'; targetCount=14; counts=$phase2Totals; mandatoryGate='PASS'; overallCheckerExit=1; deferredFailureTarget='engine-word-justify'; reports=$phase2Entries } | ConvertTo-Json -Depth 25 | Set-Content -LiteralPath (Join-Path $PSScriptRoot ($Run + '.json')) -Encoding UTF8
Write-Output ($Run + ': ' + ($phase2Totals | ConvertTo-Json -Compress))

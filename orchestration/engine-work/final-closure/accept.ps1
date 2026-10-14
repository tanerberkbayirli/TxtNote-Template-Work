param(
  [ValidateSet('base','browser','word','sbe','schema')][string]$Stage = 'base',
  [string]$BaseUrl = 'http://127.0.0.1:5200',
  [ValidatePattern('^[a-zA-Z0-9-]+$')][string]$Run = 'final'
)
$ErrorActionPreference = 'Stop'
$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../..'))
$outputRoot = Join-Path $PSScriptRoot $Run
[void][System.IO.Directory]::CreateDirectory($outputRoot)
Set-Location -LiteralPath $projectRoot
$env:PSExecutionPolicyPreference = 'Bypass'
$env:PLAYWRIGHT_MODULE = Join-Path $projectRoot 'orchestration/tools/node_modules/playwright'
$env:THESIS_BROWSER_EXECUTABLE = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
$env:CHECK_PYTHON = 'C:/Users/CASPER/AppData/Local/Programs/Python/Python313/python.exe'
$env:PYTHONUTF8 = '1'
$env:PYTHONIOENCODING = 'utf-8'
$env:CHECK_EXPORT_JOBS = '1'
$env:THESIS_BASE_URL = $BaseUrl
$fingerprintBefore = Join-Path $outputRoot ($Stage + '-inputs-before.json')
& node (Join-Path $PSScriptRoot 'fingerprint.mjs') $fingerprintBefore
if ($LASTEXITCODE -ne 0) { throw 'Cannot fingerprint acceptance inputs' }
$gates = @()
function Invoke-ClosureGate([string]$Name, [string]$Executable, [string[]]$Arguments) {
  $started = [DateTime]::UtcNow
  $gateLog = Join-Path $outputRoot ($Name + '.log')
  $ErrorActionPreference = 'Continue'
  $global:LASTEXITCODE = $null
  & $Executable @Arguments *> $gateLog
  $exitCode = $LASTEXITCODE
  if ($null -eq $exitCode) { $exitCode = 1 }
  $script:gates += @{ name=$Name; exitCode=$exitCode; startedAt=$started.ToString('o');
    seconds=([DateTime]::UtcNow-$started).TotalSeconds; log=$gateLog;
    executable=$Executable; arguments=$Arguments; workingDirectory=(Get-Location).Path }
  ConvertTo-Json -InputObject @($script:gates) -Depth 6 |
    Set-Content -LiteralPath (Join-Path $outputRoot ($Stage + '-gates.json')) -Encoding UTF8
  Write-Output ($Name + ': exit ' + $exitCode)
}
if ($Stage -eq 'base') {
  Set-Location -LiteralPath (Join-Path $projectRoot 'TxtNote/frontend')
  Invoke-ClosureGate 'unit' 'npm.cmd' @('test')
  Invoke-ClosureGate 'extra-unit' 'node' @('--test','../../engine/src/layoutPdfMathbb.test.js','../../engine/src/templates/afsu-lee.test.js')
  Invoke-ClosureGate 'build' 'npm.cmd' @('run','build')
  Set-Location -LiteralPath (Join-Path $projectRoot 'TxtNote/src-tauri')
  Invoke-ClosureGate 'desktop-font-unit' 'cargo' @('test','--offline','--lib','system_fonts::tests')
  Set-Location -LiteralPath $projectRoot
  Invoke-ClosureGate 'checker-unit' $env:CHECK_PYTHON @('-m','unittest','orchestration/tools/test_conformance.py')
}
if ($Stage -eq 'word') {
  Invoke-ClosureGate 'all-word' 'node' @('orchestration/tools/check.mjs','--all','--word',
    '--out',($outputRoot+'/all-word'),'--manifest',($outputRoot+'/all-word-manifest.json'))
  $manifest = Get-Content -LiteralPath (Join-Path $outputRoot 'all-word-manifest.json') -Raw | ConvertFrom-Json
  $skipped = @($manifest.targets | Where-Object { $_.counts.SKIPPED -gt 0 })
  if ($skipped.Count) {
    Write-Output ('Required acceptance remains incomplete: skipped checks in ' + ($skipped.target -join ', '))
    $script:gates += @{ name='word-skipped-checks'; exitCode=1 }
  }
}
if ($Stage -eq 'browser') {
  try {
    Remove-Item Env:SPECIAL_MATRIX_TARGETS,Env:SPECIAL_MATRIX_VARIANTS,Env:SPECIAL_FAMILY_TARGETS -ErrorAction SilentlyContinue
    $env:SPECIAL_MATRIX_OUT = Join-Path $outputRoot 'special-matrix'
    Invoke-ClosureGate 'special-matrix' 'node' @('orchestration/engine-work/final-closure/special/matrix.mjs')
    $env:SPECIAL_FAMILY_OUT = Join-Path $outputRoot 'special-families'
    Invoke-ClosureGate 'special-families' 'node' @('orchestration/engine-work/final-closure/special/families.mjs')
    Invoke-ClosureGate 'special-families-compare' $env:CHECK_PYTHON @('orchestration/engine-work/final-closure/special/compare-families.py')
    $env:LONG_MEASURE_OUT = Join-Path $outputRoot 'long'
    foreach ($id in @('SRC09','SRC10')) {
      Invoke-ClosureGate ('fixture-'+$id) 'node' @('orchestration/engine-work/mission07_fixture.mjs',$id)
      Invoke-ClosureGate ('long-'+$id) 'node' @('orchestration/engine-work/final-closure/long/measure.mjs',$id)
      # Order-aware page-opening and text-coverage comparison against the real Word PDF; page totals alone are never accepted.
      Invoke-ClosureGate ('breaks-'+$id) $env:CHECK_PYTHON @('-I','orchestration/engine-work/final-closure/long/compare-breaks.py',$id,$env:LONG_MEASURE_OUT,($env:LONG_MEASURE_OUT+'/'+$id+'.breaks.json'))
    }
    $env:PERFORMANCE_OUT = Join-Path $outputRoot 'performance'
    Invoke-ClosureGate 'benchmark-SRC09' 'node' @('orchestration/engine-work/final-closure/performance/benchmark.mjs','SRC09',$BaseUrl)
    Invoke-ClosureGate 'interact-SRC10' 'node' @('orchestration/engine-work/final-closure/performance/interact.mjs','SRC10',$BaseUrl)
  } finally {
    Remove-Item Env:SPECIAL_MATRIX_OUT,Env:SPECIAL_FAMILY_OUT,Env:LONG_MEASURE_OUT,Env:PERFORMANCE_OUT -ErrorAction SilentlyContinue
  }
}
if ($Stage -eq 'sbe') {
  try {
    foreach ($rate in @(1,4)) {
      $env:EXPORT_CPU_THROTTLE = [string]$rate
      foreach ($iteration in 1..5) {
        $name = 'sbe-cpu' + $rate + '-' + $iteration
        Invoke-ClosureGate $name 'node' @('orchestration/tools/check.mjs','--target','aku-sbe',
          '--out',($outputRoot+'/'+$name))
      }
    }
  } finally { Remove-Item Env:EXPORT_CPU_THROTTLE -ErrorAction SilentlyContinue }
}
if ($Stage -eq 'schema') {
  $schemaRoot = Join-Path $outputRoot 'schema'
  [void][System.IO.Directory]::CreateDirectory($schemaRoot)
  $rows = @()
  $manifest = Get-Content -LiteralPath (Join-Path $outputRoot 'all-word-manifest.json') -Raw | ConvertFrom-Json
  foreach ($target in $manifest.targets) {
    if (!$target.report) { throw ('Missing acceptance report: ' + $target.target) }
    $targetReport = Get-Content -LiteralPath $target.report -Raw | ConvertFrom-Json
    foreach ($variant in $targetReport.variants.PSObject.Properties) {
      $documentPath = $variant.Value.docx
      if (!$documentPath -or !(Test-Path -LiteralPath $documentPath)) {
        throw ('Missing DOCX: ' + $target.target + '/' + $variant.Name)
      }
      $name = $target.target + './' + $variant.Name
      $reportPath = Join-Path $schemaRoot ($name + '.json')
      Invoke-ClosureGate $name 'powershell' @('-NoProfile','-ExecutionPolicy','Bypass','-File',
        'orchestration/tools/validate-openxml.ps1','-In',$documentPath,'-Out',$reportPath)
      $report = Get-Content -LiteralPath $reportPath -Raw | ConvertFrom-Json
      $rows += @{ name=$name; status=$report.status; errorCount=$report.errorCount;
        report=$reportPath; inputSha256=$report.inputSha256 }
    }
  }
  # The long-title and performance gates also produce real production DOCX files.
  $additionalDocuments = @(Get-ChildItem -LiteralPath (Join-Path $outputRoot 'special-families') -Filter '*.docx') +
    @(Get-Item -LiteralPath (Join-Path $outputRoot 'performance/benchmark-SRC09.docx'))
  foreach ($document in $additionalDocuments) {
    $name = 'additional.' + $document.BaseName
    $reportPath = Join-Path $schemaRoot ($name + '.json')
    Invoke-ClosureGate $name 'powershell' @('-NoProfile','-ExecutionPolicy','Bypass','-File',
      'orchestration/tools/validate-openxml.ps1','-In',$document.FullName,'-Out',$reportPath)
    $report = Get-Content -LiteralPath $reportPath -Raw | ConvertFrom-Json
    $rows += @{ name=$name; status=$report.status; errorCount=$report.errorCount;
      report=$reportPath; inputSha256=$report.inputSha256 }
  }
  ConvertTo-Json -InputObject @($rows) -Depth 5 |
    Set-Content -LiteralPath (Join-Path $outputRoot 'schema-manifest.json') -Encoding UTF8
  if (!$rows.Count -or @($rows | Where-Object { $_.status -ne 'PASS' }).Count) { exit 1 }
}
$fingerprintAfter = Join-Path $outputRoot ($Stage + '-inputs-after.json')
& node (Join-Path $PSScriptRoot 'fingerprint.mjs') $fingerprintAfter
if ($LASTEXITCODE -ne 0) { throw 'Cannot fingerprint acceptance inputs' }
$beforeHash = (Get-Content -LiteralPath $fingerprintBefore -Raw | ConvertFrom-Json).sha256
$afterHash = (Get-Content -LiteralPath $fingerprintAfter -Raw | ConvertFrom-Json).sha256
if ($beforeHash -ne $afterHash) { throw 'Acceptance inputs changed during this stage; evidence must be rerun' }
if (@($gates | Where-Object { $_.exitCode -ne 0 }).Count) { exit 1 }

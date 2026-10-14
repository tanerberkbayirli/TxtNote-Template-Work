param([ValidateSet('base','all','word','sbe')][string]$Stage = 'base', [ValidatePattern('^[a-zA-Z0-9-]+$')][string]$RunName = 'resume-final')
$ErrorActionPreference = 'Stop'
$root = 'C:/Users/CASPER/Desktop/TxtNote-Template-Work'
Set-Location -LiteralPath $root
$out = Join-Path $root ('orchestration/engine-work/mission08/' + $RunName)
[void][System.IO.Directory]::CreateDirectory($out)
$env:PLAYWRIGHT_MODULE = Join-Path $root 'orchestration/tools/node_modules/playwright'
$env:THESIS_BROWSER_EXECUTABLE = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
$env:CHECK_PYTHON = 'C:/Users/CASPER/AppData/Local/Programs/Python/Python313/python.exe'
$env:CHECK_EXPORT_JOBS = '1'
$env:THESIS_BASE_URL = 'http://127.0.0.1:5177'
$rows = @()
function Invoke-Gate([string]$Name, [string]$Executable, [string[]]$Arguments) {
  $started = [DateTime]::UtcNow
  $log = Join-Path $out ($Name + '.log')
  $ErrorActionPreference = 'Continue'
  & $Executable @Arguments *> $log
  $code = $LASTEXITCODE
  $script:rows += @{ name=$Name; exitCode=$code; startedAt=$started.ToString('o'); seconds=([DateTime]::UtcNow-$started).TotalSeconds; log=$log }
  ConvertTo-Json -InputObject @($script:rows) -Depth 5 | Set-Content -LiteralPath (Join-Path $out ($Stage + '-gates.json')) -Encoding UTF8
  Write-Output ($Name + ': exit ' + $code)
}
if ($Stage -eq 'base') {
  Set-Location -LiteralPath (Join-Path $root 'TxtNote/frontend')
  Invoke-Gate 'unit' 'npm.cmd' @('test')
  Invoke-Gate 'build' 'npm.cmd' @('run','build')
  Set-Location -LiteralPath $root
  if (@($rows | Where-Object { $_.exitCode -ne 0 }).Count) { exit 1 }
}
if ($Stage -eq 'base' -or $Stage -eq 'all') {
  Invoke-Gate 'all' 'node' @('orchestration/tools/check.mjs','--all','--out',($out+'/all'),'--manifest',($out+'/all.json'))
}
if ($Stage -eq 'word') {
  Invoke-Gate 'word' 'node' @('orchestration/tools/check.mjs','--all','--targets','engine-word-justify,engine-word-pagefit,engine-word-parity,engine-word-structure,engine-word-style-precedence,phase52-justify','--word','--out',($out+'/word'),'--manifest',($out+'/word.json'))
}
if ($Stage -eq 'sbe') {
  foreach ($rate in @(1,4)) {
    $env:EXPORT_CPU_THROTTLE = [string]$rate
    foreach ($iteration in 1..5) {
      $name = 'sbe-cpu' + $rate + '-' + $iteration
      Invoke-Gate $name 'node' @('orchestration/tools/check.mjs','--target','aku-sbe','--out',($out+'/'+$name))
    }
  }
  Remove-Item Env:EXPORT_CPU_THROTTLE
}
if (@($rows | Where-Object { $_.exitCode -ne 0 }).Count) { exit 1 }

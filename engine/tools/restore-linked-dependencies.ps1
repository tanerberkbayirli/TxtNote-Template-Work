param(
  [string]$RelativeSource = 'orchestration/engine-work/final-closure/src09-active/ek2-agent/tree/TxtNote/frontend/node_modules',
  [string]$RelativeTarget = 'TxtNote/frontend/node_modules',
  [string]$BackupName = 'linked-node-modules'
)
$ErrorActionPreference = 'Stop'
$layoutRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$dependencySource = Join-Path $layoutRoot $RelativeSource
$dependencyTarget = Join-Path $layoutRoot $RelativeTarget
$dependencyBackup = Join-Path $layoutRoot ('orchestration/relocation-backups/' + $BackupName)
foreach ($candidate in @($dependencySource, $dependencyTarget, $dependencyBackup)) {
  if (-not [System.IO.Path]::GetFullPath($candidate).StartsWith($layoutRoot + '\')) { throw 'Outside workspace' }
}
if (Test-Path -LiteralPath $dependencyBackup) { throw 'Recovery already recorded; refusing to run again.' }
if (([System.IO.File]::GetAttributes($dependencySource) -band [System.IO.FileAttributes]::ReparsePoint) -ne 0) {
  throw 'Refusing to restore from a directory link.'
}
$restoredFiles = 0
$duplicates = @()
function Restore-DependencyEntry([string]$Source, [string]$Destination) {
  if ([System.IO.Directory]::Exists($Source)) {
    if (-not (Test-Path -LiteralPath $Destination)) {
      [System.IO.Directory]::Move($Source, $Destination)
      $script:restoredFiles++
    } else {
      foreach ($entry in [System.IO.Directory]::EnumerateFileSystemEntries($Source)) {
        Restore-DependencyEntry $entry (Join-Path $Destination ([System.IO.Path]::GetFileName($entry)))
      }
    }
  } elseif (-not (Test-Path -LiteralPath $Destination)) {
    [System.IO.File]::Move($Source, $Destination)
    $script:restoredFiles++
  } else {
    $script:duplicates += @{ source=$Source; destination=$Destination;
      equal=((Get-FileHash -LiteralPath $Source -Algorithm SHA256).Hash -eq (Get-FileHash -LiteralPath $Destination -Algorithm SHA256).Hash) }
  }
}
Restore-DependencyEntry $dependencySource $dependencyTarget
[void][System.IO.Directory]::CreateDirectory([System.IO.Path]::GetDirectoryName($dependencyBackup))
[System.IO.Directory]::Move($dependencySource, $dependencyBackup)
@{ restoredEntries=$restoredFiles; preservedDuplicates=$duplicates } | ConvertTo-Json -Depth 5 |
  Set-Content -LiteralPath (Join-Path $layoutRoot ('orchestration/relocation-backups/' + $BackupName + '-restore.json')) -Encoding UTF8
Write-Output "Restored $restoredFiles dependency entries; preserved $($duplicates.Count) existing files in backup"

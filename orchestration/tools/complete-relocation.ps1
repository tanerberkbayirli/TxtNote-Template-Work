$ErrorActionPreference = 'Stop'
$layoutRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$layoutManifest = Get-Content -LiteralPath (Join-Path $layoutRoot 'orchestration/relocation-map.json') -Raw | ConvertFrom-Json
if (Test-Path -LiteralPath (Join-Path $layoutRoot 'engine/src/engine.js')) {
  throw 'Layout already migrated; refusing to move the production engine into the archive.'
}

function Assert-WorkspacePath([string]$Path) {
  $resolved = [System.IO.Path]::GetFullPath($Path)
  if (-not $resolved.StartsWith($layoutRoot + '\', [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Path outside workspace refused: $resolved"
  }
  return $resolved
}

function Move-WorkspaceEntry([string]$Source, [string]$Destination) {
  $Source = Assert-WorkspacePath $Source
  $Destination = Assert-WorkspacePath $Destination
  if (-not (Test-Path -LiteralPath $Source)) {
    if (Test-Path -LiteralPath $Destination) { return }
    throw "Missing source: $Source"
  }
  [void][System.IO.Directory]::CreateDirectory([System.IO.Path]::GetDirectoryName($Destination))
  if ([System.IO.Directory]::Exists($Source)) {
    if (-not (Test-Path -LiteralPath $Destination)) {
      # Atomic directory rename on the same volume; no recursive copy of exports.
      [System.IO.Directory]::Move($Source, $Destination)
      return
    }
    if (([System.IO.File]::GetAttributes($Source) -band [System.IO.FileAttributes]::ReparsePoint) -ne 0) {
      throw "Existing destination for a directory link refused: $Destination"
    }
    if (-not [System.IO.Directory]::Exists($Destination)) { throw "Conflicting destination: $Destination" }
    foreach ($entry in [System.IO.Directory]::EnumerateFileSystemEntries($Source)) {
      Move-WorkspaceEntry $entry (Join-Path $Destination ([System.IO.Path]::GetFileName($entry)))
    }
    # Non-recursive: only an empty source directory can be removed.
    [System.IO.Directory]::Delete($Source, $false)
  } else {
    if (Test-Path -LiteralPath $Destination) { throw "Existing file refused: $Destination" }
    Move-Item -LiteralPath $Source -Destination $Destination -ErrorAction Stop
  }
}

$layoutMovedDirectories = @()
foreach ($layoutMove in $layoutManifest.moves) {
  $layoutSourceRelative = $layoutMove.from
  foreach ($layoutPrevious in $layoutMovedDirectories) {
    if ($layoutSourceRelative.StartsWith($layoutPrevious.from + '/')) {
      $layoutSourceRelative = $layoutPrevious.to + $layoutSourceRelative.Substring($layoutPrevious.from.Length)
      break
    }
  }
  Move-WorkspaceEntry (Join-Path $layoutRoot $layoutSourceRelative) (Join-Path $layoutRoot $layoutMove.to)
  if ($layoutMove.directory) { $layoutMovedDirectories += $layoutMove }
}
Write-Output "Moved $($layoutManifest.moves.Count) entries within $layoutRoot"

# Read-only renderer provenance. Do not query a running user's Word instance.
$ErrorActionPreference = 'Stop'
$paths = @("$env:WINDIR/Fonts", "$env:LOCALAPPDATA/Microsoft/Windows/Fonts")
$fonts = @($paths | Where-Object { Test-Path -LiteralPath $_ } | ForEach-Object {
  Get-ChildItem -LiteralPath $_ -File | Where-Object { $_.Extension -in '.ttf','.otf','.ttc' } |
    Sort-Object FullName | ForEach-Object {
      $stream = [System.IO.File]::OpenRead($_.FullName)
      $hasher = [System.Security.Cryptography.SHA256]::Create()
      try { $digest = [BitConverter]::ToString($hasher.ComputeHash($stream)).Replace('-','').ToLowerInvariant() }
      finally { $stream.Dispose(); $hasher.Dispose() }
      @{ path = $_.FullName; sha256 = $digest }
    }
})
@{ schemaVersion = 1; platform = [Environment]::OSVersion.VersionString;
   culture = (Get-Culture).Name; uiCulture = (Get-UICulture).Name;
   decimalSeparator = (Get-Culture).NumberFormat.NumberDecimalSeparator;
   fonts = $fonts } | ConvertTo-Json -Depth 5 -Compress

# Read-only SDK schema validation; independent from Word rendering and OPC checks.
param([Parameter(Mandatory=$true)][string]$In, [Parameter(Mandatory=$true)][string]$Out)
$ErrorActionPreference = 'Stop'
$sdkPath = 'C:/Program Files/Microsoft Office/root/Office16/ADDINS/Microsoft Power Query for Excel Integrated/bin/DocumentFormat.OpenXml.dll'
$document = $null
$result = @{ status = 'UNAVAILABLE'; input = [System.IO.Path]::GetFullPath($In); schema = 'Office2016'; errors = @() }
try {
  if (!(Test-Path -LiteralPath $sdkPath)) { throw 'Open XML SDK assembly not found' }
  Add-Type -AssemblyName WindowsBase
  [void][System.Reflection.Assembly]::LoadFrom($sdkPath)
  $result.sdkPath = $sdkPath
  $result.sdkVersion = [System.Reflection.AssemblyName]::GetAssemblyName($sdkPath).Version.ToString()
  $stream = [System.IO.File]::OpenRead($result.input)
  $hasher = [System.Security.Cryptography.SHA256]::Create()
  try { $result.inputSha256 = [BitConverter]::ToString($hasher.ComputeHash($stream)).Replace('-','').ToLowerInvariant() }
  finally { $stream.Dispose(); $hasher.Dispose() }
  $document = [DocumentFormat.OpenXml.Packaging.WordprocessingDocument]::Open($result.input, $false)
  $validator = New-Object DocumentFormat.OpenXml.Validation.OpenXmlValidator([DocumentFormat.OpenXml.FileFormatVersions]::Office2016)
  $rows = @($validator.Validate($document) | ForEach-Object {
    @{ id = $_.Id; description = $_.Description; part = [string]$_.Part.Uri; xpath = [string]$_.Path.XPath }
  })
  $result.errors = $rows
  $result.errorCount = $rows.Count
  $result.status = if ($rows.Count) { 'FAIL' } else { 'PASS' }
} catch { $result.reason = $_.Exception.Message }
finally { if ($document) { $document.Dispose() } }
$result | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath ([System.IO.Path]::GetFullPath($Out)) -Encoding UTF8
Write-Output ("SDK_SCHEMA:{0} errors={1}" -f $result.status, $result.errorCount)
if ($result.status -ne 'PASS') { exit 1 }

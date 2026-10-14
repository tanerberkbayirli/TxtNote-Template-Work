$ErrorActionPreference = 'Stop'
$reviewDir = $PSScriptRoot
$sourceResults = @()
$homeUrl = 'https://lee.mcbu.edu.tr/'
try {
  $homeResponse = Invoke-WebRequest -Uri $homeUrl -TimeoutSec 25
  $homeResponse.Content | Set-Content -LiteralPath (Join-Path $reviewDir 'lee-home.html') -Encoding utf8
  $links = @($homeResponse.Links | Where-Object { $_.outerHTML -match 'Tez|tez|Klavuz|Kılavuz' } | ForEach-Object { @{href=$_.href; html=$_.outerHTML} })
  $sourceResults += @{url=$homeUrl;status=[int]$homeResponse.StatusCode;bytes=$homeResponse.RawContentLength;links=$links}
} catch { $sourceResults += @{url=$homeUrl;error=$_.Exception.Message} }
$downloads = @(
  @{url='https://lee.mcbu.edu.tr/WebSiteContent/66/ShareFileGallery/ShareFileGallery-JUIK221020251432.docx';file='official-live-lee.docx'},
  @{url='https://tip.mcbu.edu.tr/db_images/file/asistantezyazimkilavuzu-43TR.pdf';file='official-live-tip.pdf'}
)
foreach ($item in $downloads) {
  $target = Join-Path $reviewDir $item.file
  try {
    $docResponse = Invoke-WebRequest -Uri $item.url -TimeoutSec 25 -OutFile $target -PassThru
    $signature = [System.IO.File]::ReadAllBytes($target)
    $valid = if ($item.file.EndsWith('.docx')) { $signature.Length -gt 2 -and $signature[0] -eq 80 -and $signature[1] -eq 75 } else { [System.Text.Encoding]::ASCII.GetString($signature,0,[Math]::Min(4,$signature.Length)) -eq '%PDF' }
    $sourceResults += @{url=$item.url;status=[int]$docResponse.StatusCode;validFileSignature=$valid;bytes=$signature.Length;sha256=(Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash;lastModified=[string]$docResponse.Headers['Last-Modified']}
  } catch { $sourceResults += @{url=$item.url;error=$_.Exception.Message} }
}
$result = @{checkedAtUtc=[DateTime]::UtcNow.ToString('o');sources=$sourceResults}
$result | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $reviewDir 'live-sources.json') -Encoding utf8
$result | ConvertTo-Json -Depth 8

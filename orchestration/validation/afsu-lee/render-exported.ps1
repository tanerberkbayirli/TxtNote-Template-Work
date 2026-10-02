$ErrorActionPreference = 'Stop'
Write-Output "Starting Word exports under $PSScriptRoot"
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
try {
  foreach ($name in @('master-final-self', 'phd-final-self')) {
    $source = Join-Path $PSScriptRoot "$name.docx"
    $destination = Join-Path $PSScriptRoot "$name-word.pdf"
    Write-Output "Opening $source"
    $document = $word.Documents.Open($source, $false, $true)
    try {
      $document.ExportAsFixedFormat($destination, 17)
      Write-Output "Rendered $destination; exists=$(Test-Path $destination)"
    } finally { $document.Close($false) }
  }
}
finally { $word.Quit(); Write-Output 'Word quit' }

$ErrorActionPreference = 'Stop'
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
try {
  foreach ($name in @('master-filled-source', 'phd-filled-source')) {
    $source = Join-Path $PSScriptRoot "source-filled\$name.docx"
    $destination = Join-Path $PSScriptRoot "source-filled\$name.pdf"
    $document = $word.Documents.Open($source, $false, $true)
    try { $document.ExportAsFixedFormat($destination, 17) }
    finally { $document.Close($false) }
  }
}
finally { $word.Quit() }

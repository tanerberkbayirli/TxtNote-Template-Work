$ErrorActionPreference = 'Stop'
$path = (Resolve-Path 'orchestration/artifacts/aku-isg-tezsiz-proje/source/isg.docx').Path
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
try {
  $doc = $word.Documents.Open($path, $false, $true)
  try {
    for ($si = 1; $si -le $doc.Sections.Count; $si++) {
      $section = $doc.Sections.Item($si)
      foreach ($type in @(1,2,3)) {
        $footer = $section.Footers.Item($type)
        if ($footer.Exists) {
          Write-Output "SECTION $si FOOTER $type"
          $paras = $footer.Range.Paragraphs
          for ($pi = 1; $pi -le $paras.Count; $pi++) {
            $p = $paras.Item($pi)
            $fmt = $p.Format
            $font = $p.Range.Font
            $txt = $p.Range.Text.Replace("`r", '<CR>').Replace("`a", '<CELL>')
            $vertical = $p.Range.Information(12)
            Write-Output "P$pi text=[$txt] style=[$($p.Style.NameLocal)] font=[$($font.Name)] size=$($font.Size) lineRule=$($fmt.LineSpacingRule) lineSpacing=$($fmt.LineSpacing) before=$($fmt.SpaceBefore) after=$($fmt.SpaceAfter) topPt=$vertical"
          }
        }
      }
    }
  } finally { $doc.Close(0) }
} finally { $word.Quit() }

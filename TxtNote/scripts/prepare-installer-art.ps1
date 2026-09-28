# Builds the split-panel bitmap used by the NSIS setup page.
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$iconPath = Join-Path $root "src-tauri\icons\icon.png"
$wordPath = Join-Path $root "frontend\src\assets\brand\txtnote.png"
$outPath = Join-Path $root "src-tauri\windows\setup-bg.bmp"
$panelPath = Join-Path $root "src-tauri\windows\brand-panel.bmp"

$W = 1680
$H = 1000
$left = 640

$bmp = New-Object System.Drawing.Bitmap $W, $H, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

$paper = [System.Drawing.Color]::FromArgb(245, 245, 245)
$muted = [System.Drawing.Color]::FromArgb(148, 148, 148)
$hairline = [System.Drawing.Color]::FromArgb(28, 28, 28)
$g.Clear($paper)
$g.FillRectangle([System.Drawing.Brushes]::Black, 0, 0, $left, $H)
$g.FillRectangle((New-Object System.Drawing.SolidBrush $hairline), ($left - 1), 0, 1, $H)

$iconImg = [System.Drawing.Image]::FromFile($iconPath)
$iconSize = 220
$ix = [int](($left - $iconSize) / 2)
$iy = 268
$g.DrawImage($iconImg, $ix, $iy, $iconSize, $iconSize)
$iconImg.Dispose()

$wordImg = [System.Drawing.Image]::FromFile($wordPath)
$wmW = 470
$wmH = [int]([Math]::Round($wordImg.Height * $wmW / [double]$wordImg.Width))
$wx = [int](($left - $wmW) / 2)
$wy = $iy + $iconSize + 40
$g.DrawImage($wordImg, $wx, $wy, $wmW, $wmH)
$wordImg.Dispose()

$font = New-Object System.Drawing.Font "Segoe UI", 15, ([System.Drawing.FontStyle]::Regular), ([System.Drawing.GraphicsUnit]::Pixel)
$brush = New-Object System.Drawing.SolidBrush $muted
$sf = New-Object System.Drawing.StringFormat
$sf.Alignment = [System.Drawing.StringAlignment]::Center
$sf.LineAlignment = [System.Drawing.StringAlignment]::Near
$rect = New-Object System.Drawing.RectangleF 48, ($wy + $wmH + 28), ($left - 96), 80
$tag = "Notlar{0}n {1}nce senin cihaz{0}nda kal{0}r." -f [char]0x0131, [char]0x00F6
$g.DrawString($tag, $font, $brush, $rect, $sf)

function Save-Bmp24([System.Drawing.Bitmap]$src, [string]$path, [int]$x, [int]$y, [int]$w, [int]$h) {
  $rect = New-Object System.Drawing.Rectangle $x, $y, $w, $h
  $clone = $src.Clone($rect, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
  $clone.Save($path, [System.Drawing.Imaging.ImageFormat]::Bmp)
  $clone.Dispose()
}

Save-Bmp24 $bmp $outPath 0 0 $W $H
Save-Bmp24 $bmp $panelPath 0 0 $left $H

$font.Dispose()
$brush.Dispose()
$sf.Dispose()
$g.Dispose()
$bmp.Dispose()
Write-Host "Wrote $outPath"
Write-Host "Wrote $panelPath"

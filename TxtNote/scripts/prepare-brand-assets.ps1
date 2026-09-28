# Prepares TxtNote shortcut icons and wordmark bitmaps from the dropped source PNGs.
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$txtSrc = Join-Path $root "logo txt.png"
$wordSrc = Join-Path $root "logo txtnote.png"
if (-not (Test-Path $txtSrc)) { $txtSrc = Join-Path $root "src-tauri\icons\txt.png" }
if (-not (Test-Path $wordSrc)) { $wordSrc = Join-Path $root "src-tauri\icons\txtnote.png" }

$iconsDir = Join-Path $root "src-tauri\icons"
$windowsDir = Join-Path $root "src-tauri\windows"
$brandDir = Join-Path $root "frontend\public\brand"
New-Item -ItemType Directory -Force -Path $iconsDir, $windowsDir, $brandDir | Out-Null

function Get-ContentBounds([System.Drawing.Bitmap]$bitmap, [int]$threshold = 18) {
  $minX = $bitmap.Width
  $minY = $bitmap.Height
  $maxX = -1
  $maxY = -1
  for ($y = 0; $y -lt $bitmap.Height; $y++) {
    for ($x = 0; $x -lt $bitmap.Width; $x++) {
      $c = $bitmap.GetPixel($x, $y)
      if ($c.R -gt $threshold -or $c.G -gt $threshold -or $c.B -gt $threshold) {
        if ($x -lt $minX) { $minX = $x }
        if ($y -lt $minY) { $minY = $y }
        if ($x -gt $maxX) { $maxX = $x }
        if ($y -gt $maxY) { $maxY = $y }
      }
    }
  }
  if ($maxX -lt 0) {
    return New-Object System.Drawing.Rectangle 0, 0, $bitmap.Width, $bitmap.Height
  }
  return New-Object System.Drawing.Rectangle $minX, $minY, ($maxX - $minX + 1), ($maxY - $minY + 1)
}

function Copy-Crop([System.Drawing.Bitmap]$src, [System.Drawing.Rectangle]$rect, [int]$pad) {
  $x = [Math]::Max(0, $rect.X - $pad)
  $y = [Math]::Max(0, $rect.Y - $pad)
  $w = [Math]::Min($src.Width - $x, $rect.Width + (2 * $pad))
  $h = [Math]::Min($src.Height - $y, $rect.Height + (2 * $pad))
  $cropRect = New-Object System.Drawing.Rectangle $x, $y, $w, $h
  return $src.Clone($cropRect, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
}

function New-SquareIcon([System.Drawing.Bitmap]$src, [int]$size) {
  $side = [Math]::Max($src.Width, $src.Height)
  $square = New-Object System.Drawing.Bitmap $side, $side
  $g = [System.Drawing.Graphics]::FromImage($square)
  $g.Clear([System.Drawing.Color]::Black)
  $ox = [int](($side - $src.Width) / 2)
  $oy = [int](($side - $src.Height) / 2)
  $g.DrawImage($src, $ox, $oy, $src.Width, $src.Height)
  $g.Dispose()

  $dst = New-Object System.Drawing.Bitmap $size, $size
  $g2 = [System.Drawing.Graphics]::FromImage($dst)
  $g2.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g2.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g2.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g2.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $g2.Clear([System.Drawing.Color]::Black)
  $g2.DrawImage($square, 0, 0, $size, $size)
  $g2.Dispose()
  $square.Dispose()
  return $dst
}

function New-TransparentWordmark([System.Drawing.Bitmap]$src) {
  $dst = New-Object System.Drawing.Bitmap $src.Width, $src.Height
  for ($y = 0; $y -lt $src.Height; $y++) {
    for ($x = 0; $x -lt $src.Width; $x++) {
      $c = $src.GetPixel($x, $y)
      $a = [int][Math]::Max([Math]::Max($c.R, $c.G), $c.B)
      $dst.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($a, 255, 255, 255))
    }
  }
  return $dst
}

function Save-Png([System.Drawing.Bitmap]$bmp, [string]$path) {
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
}

function Save-Bmp24([System.Drawing.Bitmap]$src, [string]$path, [int]$w, [int]$h) {
  $dst = New-Object System.Drawing.Bitmap $w, $h, ([System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
  $g = [System.Drawing.Graphics]::FromImage($dst)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.Clear([System.Drawing.Color]::Black)
  $scale = [Math]::Min(($w - 16) / [double]$src.Width, ($h - 16) / [double]$src.Height)
  $dw = [int]($src.Width * $scale)
  $dh = [int]($src.Height * $scale)
  $dx = [int](($w - $dw) / 2)
  $dy = [int](($h - $dh) / 2)
  $g.DrawImage($src, $dx, $dy, $dw, $dh)
  $g.Dispose()
  $dst.Save($path, [System.Drawing.Imaging.ImageFormat]::Bmp)
  $dst.Dispose()
}

Write-Host "Loading sources..."
$txtImg = [System.Drawing.Image]::FromFile($txtSrc)
$wordImg = [System.Drawing.Image]::FromFile($wordSrc)
$txtBmp = New-Object System.Drawing.Bitmap $txtImg
$wordBmp = New-Object System.Drawing.Bitmap $wordImg
$txtImg.Dispose()
$wordImg.Dispose()

$txtBounds = Get-ContentBounds $txtBmp 22
$wordBounds = Get-ContentBounds $wordBmp 22
Write-Host ("TXT bounds: {0}" -f $txtBounds)
Write-Host ("Wordmark bounds: {0}" -f $wordBounds)

$txtCrop = Copy-Crop $txtBmp $txtBounds 18
$wordCrop = Copy-Crop $wordBmp $wordBounds 12
$txtBmp.Dispose()
$wordBmp.Dispose()

# Keep the original mark next to generated icons.
Copy-Item -Force $txtSrc (Join-Path $iconsDir "txt.png")
Copy-Item -Force $wordSrc (Join-Path $brandDir "txtnote-source.png")

$icon1024 = New-SquareIcon $txtCrop 1024
$icon256 = New-SquareIcon $txtCrop 256
$icon128 = New-SquareIcon $txtCrop 128
$icon32 = New-SquareIcon $txtCrop 32
Save-Png $icon1024 (Join-Path $iconsDir "icon.png")
Save-Png $icon256 (Join-Path $iconsDir "128x128@2x.png")
Save-Png $icon128 (Join-Path $iconsDir "128x128.png")
Save-Png $icon32 (Join-Path $iconsDir "32x32.png")
Save-Png $icon128 (Join-Path $brandDir "txt.png")
$icon1024.Dispose()
$icon256.Dispose()
$icon128.Dispose()
$icon32.Dispose()
$txtCrop.Dispose()

$wordClear = New-TransparentWordmark $wordCrop
Save-Png $wordClear (Join-Path $brandDir "txtnote.png")
Save-Bmp24 $wordCrop (Join-Path $windowsDir "wordmark.bmp") 480 90
Save-Bmp24 $wordCrop (Join-Path $windowsDir "header.bmp") 150 57
$wordClear.Dispose()
$wordCrop.Dispose()

# Node builds a multi-size ICO from the generated PNGs.
$icoScript = Join-Path $env:TEMP "txtnote-ico.mjs"
@"
import fs from "node:fs";

function pngsToIco(buffers) {
  const count = buffers.length;
  const headerSize = 6 + 16 * count;
  let offset = headerSize;
  const dirs = [];
  for (const buf of buffers) {
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    dirs.push({
      width: width >= 256 ? 0 : width,
      height: height >= 256 ? 0 : height,
      size: buf.length,
      offset,
    });
    offset += buf.length;
  }
  const out = Buffer.alloc(offset);
  out.writeUInt16LE(0, 0);
  out.writeUInt16LE(1, 2);
  out.writeUInt16LE(count, 4);
  let dirOff = 6;
  for (const d of dirs) {
    out.writeUInt8(d.width, dirOff);
    out.writeUInt8(d.height, dirOff + 1);
    out.writeUInt8(0, dirOff + 2);
    out.writeUInt8(0, dirOff + 3);
    out.writeUInt16LE(1, dirOff + 4);
    out.writeUInt16LE(32, dirOff + 6);
    out.writeUInt32LE(d.size, dirOff + 8);
    out.writeUInt32LE(d.offset, dirOff + 12);
    dirOff += 16;
  }
  let dataOff = headerSize;
  for (const buf of buffers) {
    buf.copy(out, dataOff);
    dataOff += buf.length;
  }
  return out;
}

const dir = process.argv[2];
const files = ["32x32.png", "128x128.png", "128x128@2x.png"].map((name) =>
  fs.readFileSync(dir + "/" + name),
);
fs.writeFileSync(dir + "/icon.ico", pngsToIco(files));
"@ | Set-Content -Encoding UTF8 $icoScript

node $icoScript $iconsDir
Remove-Item $icoScript -Force

Write-Host "Brand assets ready."

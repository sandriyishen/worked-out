# Generates the app icons from the source art with a pure square crop (no padding/border).
# Run from this folder:  .\make-icon.ps1
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName PresentationCore, WindowsBase

# --- Crop config (baked in) -------------------------------------------------
# Source is 672x384. A 384x384 square is the largest full-height crop. CropX is
# panned left of centre (128 vs the centred 144) so the whole thumbs-up hand —
# whose left edge sits at ~x182 in the source — keeps a comfortable margin.
# Note: the source art has her hair running to the very top edge (y=0), so there
# is no headroom to reveal above it without adding canvas; this is a pure crop.
$Src    = Join-Path $PSScriptRoot 'anime-thumbsup-medium.webp'
$CropX  = 128; $CropY = 0; $CropW = 384; $CropH = 384
$Size   = 1024
$Out    = Join-Path $PSScriptRoot '..\icon.png'
$Copies = @('..\adaptive-icon.png', '..\splash-icon.png')

$uri = New-Object System.Uri($Src)
$dec = [System.Windows.Media.Imaging.BitmapDecoder]::Create($uri, [System.Windows.Media.Imaging.BitmapCreateOptions]::None, [System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad)
$frame = $dec.Frames[0]

$rect = New-Object System.Windows.Int32Rect $CropX, $CropY, $CropW, $CropH
$cropped = New-Object System.Windows.Media.Imaging.CroppedBitmap $frame, $rect

$dv = New-Object System.Windows.Media.DrawingVisual
[System.Windows.Media.RenderOptions]::SetBitmapScalingMode($dv, [System.Windows.Media.BitmapScalingMode]::HighQuality)
$dc = $dv.RenderOpen()
$dc.DrawImage($cropped, (New-Object System.Windows.Rect 0, 0, $Size, $Size))
$dc.Close()

$rtb = New-Object System.Windows.Media.Imaging.RenderTargetBitmap $Size, $Size, 96, 96, ([System.Windows.Media.PixelFormats]::Pbgra32)
$rtb.Render($dv)
$enc = New-Object System.Windows.Media.Imaging.PngBitmapEncoder
$enc.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($rtb))

$abs = [System.IO.Path]::GetFullPath($Out)
$fs = [System.IO.File]::Create($abs); $enc.Save($fs); $fs.Close()
foreach ($c in $Copies) {
  Copy-Item $abs ([System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot $c))) -Force
}
"Wrote icon.png + $($Copies.Count) copies ($Size x $Size) from crop $CropX,$CropY $CropW x $CropH"

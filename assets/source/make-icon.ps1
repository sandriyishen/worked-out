param(
  [Parameter(Mandatory=$true)][string]$Src,
  [Parameter(Mandatory=$true)][string]$OutPath,
  [int]$CropX = 0, [int]$CropY = 0, [int]$CropW = 0, [int]$CropH = 0,
  [int]$Size = 1024,
  [double]$Pad = 1.0,
  [string]$Bg = ""
)
Add-Type -AssemblyName PresentationCore
Add-Type -AssemblyName PresentationFramework
Add-Type -AssemblyName WindowsBase

$uri = New-Object System.Uri($Src)
$dec = [System.Windows.Media.Imaging.BitmapDecoder]::Create($uri,[System.Windows.Media.Imaging.BitmapCreateOptions]::None,[System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad)
$frame = $dec.Frames[0]
if ($CropW -le 0) { $CropW = $frame.PixelWidth }
if ($CropH -le 0) { $CropH = $frame.PixelHeight }

$rect = New-Object System.Windows.Int32Rect $CropX,$CropY,$CropW,$CropH
$cropped = New-Object System.Windows.Media.Imaging.CroppedBitmap $frame, $rect

$content = [int][math]::Round($Size * $Pad)
$offset = ($Size - $content) / 2.0

$dv = New-Object System.Windows.Media.DrawingVisual
[System.Windows.Media.RenderOptions]::SetBitmapScalingMode($dv,[System.Windows.Media.BitmapScalingMode]::HighQuality)
$dc = $dv.RenderOpen()
if ($Bg -ne "") {
  $col = [System.Windows.Media.ColorConverter]::ConvertFromString($Bg)
  $brush = New-Object System.Windows.Media.SolidColorBrush $col
  $dc.DrawRectangle($brush, $null, (New-Object System.Windows.Rect 0,0,$Size,$Size))
}
$dc.DrawImage($cropped, (New-Object System.Windows.Rect $offset,$offset,$content,$content))
$dc.Close()

$rtb = New-Object System.Windows.Media.Imaging.RenderTargetBitmap $Size,$Size,96,96,([System.Windows.Media.PixelFormats]::Pbgra32)
$rtb.Render($dv)
$enc = New-Object System.Windows.Media.Imaging.PngBitmapEncoder
$enc.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($rtb))
$fsout = [System.IO.File]::Create($OutPath)
$enc.Save($fsout)
$fsout.Close()
"Wrote {0} ({1}x{1}) from crop {2},{3} {4}x{5}" -f $OutPath,$Size,$CropX,$CropY,$CropW,$CropH

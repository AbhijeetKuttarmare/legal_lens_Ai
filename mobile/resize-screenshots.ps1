Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = "Stop"

$srcDir = "c:\Users\abhij\Desktop\LegalLens\legal_lens_Ai\mobile"
$outDir = "c:\Users\abhij\Desktop\LegalLens\legal_lens_Ai\mobile\store-screenshots\iphone-6.5"
[int]$targetW = 1284
[int]$targetH = 2778

$map = @{
  "newhome1.png" = "01-Home.png"
  "login1.png"   = "02-SignIn.png"
  "report4.png"  = "03-Upload.png"
  "sub1.png"     = "04-Subscription.png"
}

foreach ($src in $map.Keys) {
  $srcPath = Join-Path $srcDir $src
  $outPath = Join-Path $outDir $map[$src]

  $img = [System.Drawing.Image]::FromFile($srcPath)
  [int]$srcW = $img.Width
  [int]$srcH = $img.Height

  $scale = [Math]::Max([double]$targetW / $srcW, [double]$targetH / $srcH)
  [int]$scaledW = [Math]::Ceiling($srcW * $scale)
  [int]$scaledH = [Math]::Ceiling($srcH * $scale)

  $rgbFormat = [System.Drawing.Imaging.PixelFormat]::Format24bppRgb
  $scaledBmp = New-Object -TypeName System.Drawing.Bitmap -ArgumentList $scaledW, $scaledH, $rgbFormat
  $g = [System.Drawing.Graphics]::FromImage($scaledBmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.DrawImage($img, 0, 0, $scaledW, $scaledH)
  $g.Dispose()
  $img.Dispose()

  [int]$cropX = [Math]::Floor(($scaledW - $targetW) / 2)
  [int]$cropY = [Math]::Floor(($scaledH - $targetH) / 2)
  $srcRect = New-Object -TypeName System.Drawing.Rectangle -ArgumentList $cropX, $cropY, $targetW, $targetH

  $finalBmp = New-Object -TypeName System.Drawing.Bitmap -ArgumentList $targetW, $targetH, $rgbFormat
  $g2 = [System.Drawing.Graphics]::FromImage($finalBmp)
  $destRect = New-Object -TypeName System.Drawing.Rectangle -ArgumentList 0, 0, $targetW, $targetH
  $g2.DrawImage($scaledBmp, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
  $g2.Dispose()
  $scaledBmp.Dispose()

  $finalBmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $finalBmp.Dispose()

  Write-Output "OK: $src -> $($map[$src])  (scaled to $scaledW x $scaledH, cropped to $targetW x $targetH)"
}

# Load drawing assembly
Add-Type -AssemblyName System.Drawing

$srcPath = Join-Path $PSScriptRoot "public\logo.png"
$dstPath = Join-Path $PSScriptRoot "public\logo.png"

if (-not (Test-Path $srcPath)) {
    Write-Error "Source image not found at $srcPath"
    exit 1
}

$srcImg = [System.Drawing.Bitmap]::FromFile($srcPath)
$width = $srcImg.Width
$height = $srcImg.Height
$dstImg = New-Object System.Drawing.Bitmap ($width, $height)

# Target Gradient Start and End (Sage & Cream Theme: Deep Forest Green to Sage Green)
$r1, $g1, $b1 = 58, 86, 64       # #3A5640 Deep Forest Green (Primary)
$r2, $g2, $b2 = 143, 181, 150    # #8FB596 Sage Green (Primary Soft / Accent)

Write-Host "Converting logo ($width x $height) to Sage & Forest Green palette gradient..."

for ($y = 0; $y -lt $height; $y++) {
    for ($x = 0; $x -lt $width; $x++) {
        $pixel = $srcImg.GetPixel($x, $y)
        $alpha = $pixel.A
        
        if ($alpha -gt 0) {
            # Normalize original pixel brightness (to preserve shading)
            # Since the original is light lavender, we normalize relative to a typical lavender intensity (around 200)
            $origIntensity = ($pixel.R + $pixel.G + $pixel.B) / 3.0
            $intensityFactor = $origIntensity / 220.0
            if ($intensityFactor -gt 1.2) { $intensityFactor = 1.2 }
            
            # Position-based gradient ratio (top-left to bottom-right)
            $ratio = ($x + $y) / ($width + $height)
            
            # Interpolate base gradient colors
            $baseR = $r1 + ($r2 - $r1) * $ratio
            $baseG = $g1 + ($g2 - $g1) * $ratio
            $baseB = $b1 + ($b2 - $b1) * $ratio
            
            # Apply intensity factor to preserve details/shading
            $newR = [math]::Min(255, [math]::Max(0, [int]($baseR * $intensityFactor)))
            $newG = [math]::Min(255, [math]::Max(0, [int]($baseG * $intensityFactor)))
            $newB = [math]::Min(255, [math]::Max(0, [int]($baseB * $intensityFactor)))
            
            $newColor = [System.Drawing.Color]::FromArgb($alpha, $newR, $newG, $newB)
            $dstImg.SetPixel($x, $y, $newColor)
        } else {
            $dstImg.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        }
    }
}

$dstImg.Save($dstPath, [System.Drawing.Imaging.ImageFormat]::Png)
$srcImg.Dispose()
$dstImg.Dispose()

Write-Host "Logo successfully converted and saved to $dstPath"

# App icon source

The app icons (`assets/icon.png`, `assets/adaptive-icon.png`, `assets/splash-icon.png`)
are generated from the source art in this folder.

## Source

- `anime-thumbsup-medium.webp` — primary source, 672×384. (Downloaded from StockCake as
  `...-medium.jpg`, but the bytes are actually WebP — renamed here for clarity.)
- `anime-thumbsup-small.jpg` — lower-res JPEG variant, 330×184. Kept as a fallback.

Both are StockCake images, free for commercial use. Swap in a higher-resolution original
here if one becomes available — 384px tall is upscaled to 1024 for the icon, so it's a
touch soft up close.

## Regenerating

`make-icon.ps1` decodes the source (via Windows WIC, which reads WebP), center-crops a
square, scales to the target size, and writes a PNG. Run from this folder:

```powershell
# Square app icon (full-bleed) — used for icon.png and adaptive-icon.png
.\make-icon.ps1 -Src .\anime-thumbsup-medium.webp -OutPath ..\icon.png         -CropX 144 -CropY 0 -CropW 384 -CropH 384 -Size 1024
Copy-Item ..\icon.png ..\adaptive-icon.png -Force
Copy-Item ..\icon.png ..\splash-icon.png   -Force
```

The crop `144,0 384×384` is the centered square of the 672×384 source — keeps the face,
grin, and thumbs-up in frame and trims the side background. Adjust `-CropX` to pan
left/right, or shrink `-CropW`/`-CropH` (and re-center `-CropX`) to zoom in tighter.

Optional flags for a padded variant on a solid background (e.g. a safer Android
foreground): `-Pad 0.7 -Bg "#0C7BC4"` scales the crop to 70% and centers it on the color.

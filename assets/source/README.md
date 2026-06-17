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

`make-icon.ps1` is self-contained: it decodes the source (via Windows WIC, which reads
WebP), takes a pure square crop, scales it to 1024×1024, writes `icon.png`, and copies that
to `adaptive-icon.png` and `splash-icon.png`. The crop is baked into the script. Run from
this folder:

```powershell
.\make-icon.ps1
```

The crop is `128,0 384×384` — the largest full-height square of the 672×384 source, panned
slightly left of centre so the whole thumbs-up hand stays in frame. To re-frame, edit the
`$CropX`/`$CropY`/`$CropW`/`$CropH` constants at the top of the script.

Note: the source art has her hair running to the very top edge (y=0), so a crop can't add
headroom above it — that would require a higher / wider-framed source image.

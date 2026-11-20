#!/usr/bin/env python3
"""Generate Android launcher icons from the user's existing BrokenGPT icon."""
from pathlib import Path
import sys
from PIL import Image, ImageDraw

if len(sys.argv) != 3:
    raise SystemExit("Usage: generate-android-icons.py SOURCE_PNG ANDROID_RES_DIR")

source_path = Path(sys.argv[1])
res_dir = Path(sys.argv[2])
if not source_path.is_file():
    raise SystemExit(f"Icon file not found: {source_path}")

with Image.open(source_path) as opened:
    source = opened.convert("RGBA")

# Use the supplied square artwork without changing its design.
densities = {
    "mdpi": (48, 108),
    "hdpi": (72, 162),
    "xhdpi": (96, 216),
    "xxhdpi": (144, 324),
    "xxxhdpi": (192, 432),
}

for density, (legacy_size, adaptive_size) in densities.items():
    folder = res_dir / f"mipmap-{density}"
    folder.mkdir(parents=True, exist_ok=True)

    legacy = source.resize((legacy_size, legacy_size), Image.Resampling.LANCZOS)
    legacy.save(folder / "ic_launcher.png", optimize=True)

    round_icon = legacy.copy()
    mask = Image.new("L", (legacy_size, legacy_size), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, legacy_size - 1, legacy_size - 1), fill=255)
    round_icon.putalpha(mask)
    round_icon.save(folder / "ic_launcher_round.png", optimize=True)

    # Adaptive foreground keeps the whole logo inside the launcher safe zone.
    canvas = Image.new("RGBA", (adaptive_size, adaptive_size), (0, 0, 0, 0))
    inner_size = int(adaptive_size * 0.70)
    foreground = source.copy()
    foreground.thumbnail((inner_size, inner_size), Image.Resampling.LANCZOS)
    x = (adaptive_size - foreground.width) // 2
    y = (adaptive_size - foreground.height) // 2
    canvas.alpha_composite(foreground, (x, y))
    canvas.save(folder / "ic_launcher_foreground.png", optimize=True)

adaptive_dir = res_dir / "mipmap-anydpi-v26"
adaptive_dir.mkdir(parents=True, exist_ok=True)
adaptive_xml = '''<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
'''
(adaptive_dir / "ic_launcher.xml").write_text(adaptive_xml, encoding="utf-8")
(adaptive_dir / "ic_launcher_round.xml").write_text(adaptive_xml, encoding="utf-8")

values_dir = res_dir / "values"
values_dir.mkdir(parents=True, exist_ok=True)
(values_dir / "ic_launcher_background.xml").write_text(
    '''<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#080808</color>
</resources>
''',
    encoding="utf-8",
)
print("Generated Android launcher icons from the existing BrokenGPT icon.")

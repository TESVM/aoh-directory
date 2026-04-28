#!/bin/sh

set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
ICON_SRC="$ROOT_DIR/branding/mobile/app-icon-1024.png"
SPLASH_SRC="$ROOT_DIR/branding/mobile/splash-2732.png"

require_file() {
  if [ ! -f "$1" ]; then
    echo "Missing file: $1" >&2
    exit 1
  fi
}

require_file "$ICON_SRC"
require_file "$SPLASH_SRC"

copy_file() {
  src="$1"
  dest="$2"
  cp "$src" "$dest"
  echo "Updated $dest"
}

resize_png() {
  src="$1"
  dest="$2"
  width="$3"
  height="$4"
  sips -z "$height" "$width" "$src" --out "$dest" >/dev/null
  echo "Updated $dest (${width}x${height})"
}

copy_file "$ICON_SRC" "$ROOT_DIR/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png"
copy_file "$SPLASH_SRC" "$ROOT_DIR/ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732.png"
copy_file "$SPLASH_SRC" "$ROOT_DIR/ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-1.png"
copy_file "$SPLASH_SRC" "$ROOT_DIR/ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-2.png"

resize_png "$SPLASH_SRC" "$ROOT_DIR/android/app/src/main/res/drawable/splash.png" 320 480
resize_png "$SPLASH_SRC" "$ROOT_DIR/android/app/src/main/res/drawable-port-mdpi/splash.png" 320 480
resize_png "$SPLASH_SRC" "$ROOT_DIR/android/app/src/main/res/drawable-port-hdpi/splash.png" 480 800
resize_png "$SPLASH_SRC" "$ROOT_DIR/android/app/src/main/res/drawable-port-xhdpi/splash.png" 720 1280
resize_png "$SPLASH_SRC" "$ROOT_DIR/android/app/src/main/res/drawable-port-xxhdpi/splash.png" 960 1600
resize_png "$SPLASH_SRC" "$ROOT_DIR/android/app/src/main/res/drawable-port-xxxhdpi/splash.png" 1280 1920
resize_png "$SPLASH_SRC" "$ROOT_DIR/android/app/src/main/res/drawable-land-mdpi/splash.png" 480 320
resize_png "$SPLASH_SRC" "$ROOT_DIR/android/app/src/main/res/drawable-land-hdpi/splash.png" 800 480
resize_png "$SPLASH_SRC" "$ROOT_DIR/android/app/src/main/res/drawable-land-xhdpi/splash.png" 1280 720
resize_png "$SPLASH_SRC" "$ROOT_DIR/android/app/src/main/res/drawable-land-xxhdpi/splash.png" 1600 960
resize_png "$SPLASH_SRC" "$ROOT_DIR/android/app/src/main/res/drawable-land-xxxhdpi/splash.png" 1920 1280

resize_png "$ICON_SRC" "$ROOT_DIR/android/app/src/main/res/mipmap-mdpi/ic_launcher.png" 48 48
resize_png "$ICON_SRC" "$ROOT_DIR/android/app/src/main/res/mipmap-hdpi/ic_launcher.png" 72 72
resize_png "$ICON_SRC" "$ROOT_DIR/android/app/src/main/res/mipmap-xhdpi/ic_launcher.png" 96 96
resize_png "$ICON_SRC" "$ROOT_DIR/android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png" 144 144
resize_png "$ICON_SRC" "$ROOT_DIR/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png" 192 192
resize_png "$ICON_SRC" "$ROOT_DIR/android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png" 48 48
resize_png "$ICON_SRC" "$ROOT_DIR/android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png" 72 72
resize_png "$ICON_SRC" "$ROOT_DIR/android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png" 96 96
resize_png "$ICON_SRC" "$ROOT_DIR/android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png" 144 144
resize_png "$ICON_SRC" "$ROOT_DIR/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png" 192 192
resize_png "$ICON_SRC" "$ROOT_DIR/android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png" 108 108
resize_png "$ICON_SRC" "$ROOT_DIR/android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png" 162 162
resize_png "$ICON_SRC" "$ROOT_DIR/android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png" 216 216
resize_png "$ICON_SRC" "$ROOT_DIR/android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png" 324 324
resize_png "$ICON_SRC" "$ROOT_DIR/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png" 432 432

echo "Mobile assets installed."
echo "Next: run 'npx cap sync' to refresh the native project metadata."

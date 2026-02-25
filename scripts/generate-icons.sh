#!/bin/bash
# generate-icons.sh — Create all Chrome extension icon sizes from a source image
#
# Usage:
#   ./scripts/generate-icons.sh [source_image]
#
# If no source image is provided, defaults to icon.png in the project root.
# Outputs icon16.png, icon48.png, icon128.png into the icons/ folder.
#
# Requires: sips (macOS built-in)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ICONS_DIR="$PROJECT_DIR/icons"
SOURCE="${1:-$PROJECT_DIR/icon.png}"

SIZES=(16 48 128)

if [[ ! -f "$SOURCE" ]]; then
  echo "Error: Source image not found: $SOURCE"
  echo "Usage: $0 [path/to/icon.png]"
  exit 1
fi

mkdir -p "$ICONS_DIR"

echo "Source: $SOURCE"
echo "Output: $ICONS_DIR/"
echo ""

for size in "${SIZES[@]}"; do
  out="$ICONS_DIR/icon${size}.png"
  cp "$SOURCE" "$out"
  sips -z "$size" "$size" "$out" --out "$out" >/dev/null 2>&1
  actual=$(sips -g pixelWidth "$out" 2>/dev/null | tail -1 | awk '{print $2}')
  echo "  icon${size}.png  ${actual:-$size}x${actual:-$size}px  $(wc -c < "$out" | tr -d ' ') bytes"
done

echo ""
echo "Done. Icons ready in $ICONS_DIR/"

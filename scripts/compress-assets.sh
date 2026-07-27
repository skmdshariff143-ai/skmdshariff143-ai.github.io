#!/bin/bash

# Portability setup for Windows environments
echo "=========================================================="
echo "           Certificate Asset Compression Script           "
echo "=========================================================="

# Check for imagemagick's convert/mogrify and ghostscript
MISSING_TOOLS=0
if ! command -v convert &> /dev/null && ! command -v mogrify &> /dev/null && ! command -v magick &> /dev/null; then
    echo "⚠️  [Warning]: ImageMagick (convert / mogrify / magick) was not found in the system PATH."
    MISSING_TOOLS=1
fi

if ! command -v gs &> /dev/null && ! command -v gswin64c &> /dev/null; then
    echo "⚠️  [Warning]: Ghostscript (gs / gswin64c) was not found in the system PATH."
    MISSING_TOOLS=1
fi

if [ $MISSING_TOOLS -eq 1 ]; then
    echo ""
    echo "💡 [Recommendation]: To install these tools on Windows, run in an Administrator command prompt:"
    echo "   choco install imagemagick ghostscript"
    echo "   Or download them from:"
    echo "   - ImageMagick: https://imagemagick.org/script/download.php"
    echo "   - Ghostscript: https://ghostscript.com/releases/gsdnld.html"
    echo ""
    echo "🔄 [Fallback]: Running compression via python-fallback engine (Pillow + PyMuPDF)..."
else
    echo "✅ System tools 'imagemagick' and 'ghostscript' are available."
fi

# Run the Python fallback script to compress images, PDFs, generate thumbnails and build the report.html
if command -v python &> /dev/null; then
    python compress_assets.py
else
    echo "❌ Error: Python is required to run the compression engine. Please install Python."
    exit 1
fi

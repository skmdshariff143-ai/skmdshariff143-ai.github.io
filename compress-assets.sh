#!/bin/bash

# Define paths
CERT_DIR="assets/certificates"
BACKUP_DIR="assets/certificates-backup"

# Ensure the source directory exists
if [ ! -d "$CERT_DIR" ]; then
    echo "Error: Directory $CERT_DIR does not exist."
    exit 1
fi

# Function to get directory size in a cross-platform way
get_dir_size() {
    if command -v du &> /dev/null; then
        du -sh "$1" | cut -f1
    else
        # Fallback if du is not available
        echo "unknown"
    fi
}

# Print folder size before compression
size_before=$(get_dir_size "$CERT_DIR")
echo "=== Asset Compression ==="
echo "Original folder size of $CERT_DIR: $size_before"

# Create backup directory
echo "Creating backup to $BACKUP_DIR..."
mkdir -p "$BACKUP_DIR"
cp -r "$CERT_DIR"/* "$BACKUP_DIR"/

# Compress JPG/JPEG files to 80% quality
echo "Compressing JPG and JPEG images..."
# Check for ImageMagick mogrify or magick
if command -v mogrify &> /dev/null; then
    mogrify -quality 80 "$CERT_DIR"/*.jpg "$CERT_DIR"/*.jpeg 2>/dev/null
    echo "Compressed images using mogrify."
elif command -v magick &> /dev/null; then
    magick mogrify -quality 80 "$CERT_DIR"/*.jpg "$CERT_DIR"/*.jpeg 2>/dev/null
    echo "Compressed images using magick mogrify."
else
    echo "Warning: ImageMagick (mogrify or magick) not found. Skipping image compression."
fi

# Compress PDF files using Ghostscript with /ebook settings
echo "Compressing PDF files..."
# Determine gs command
GS_CMD=""
if command -v gs &> /dev/null; then
    GS_CMD="gs"
elif command -v gswin64c &> /dev/null; then
    GS_CMD="gswin64c"
fi

if [ -n "$GS_CMD" ]; then
    for pdf_file in "$CERT_DIR"/*.pdf; do
        if [ -f "$pdf_file" ]; then
            temp_pdf="${pdf_file%.pdf}-temp.pdf"
            $GS_CMD -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/ebook -dNOPAUSE -dQUIET -dBATCH -sOutputFile="$temp_pdf" "$pdf_file"
            if [ -f "$temp_pdf" ] && [ -s "$temp_pdf" ]; then
                mv "$temp_pdf" "$pdf_file"
            else
                rm -f "$temp_pdf"
            fi
        fi
    done
    echo "Compressed PDFs using Ghostscript."
else
    echo "Warning: Ghostscript (gs or gswin64c) not found. Skipping PDF compression."
fi

# Print folder size after compression
size_after=$(get_dir_size "$CERT_DIR")
echo "Compressed folder size of $CERT_DIR: $size_after"
echo "Backup preserved at: $BACKUP_DIR"
echo "=== Done ==="

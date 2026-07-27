#!/bin/bash

# Target directory
CERT_DIR="assets/certificates"

# List of the 15 PDFs
PDFS=(
    "aws-data-engineering.pdf"
    "aws_academy_graduate___data_engineering___training_badge_badge20260327-32-qr179v.pdf"
    "shaik-mahammad-sharif_20261772946116-(1).pdf"
    "gen-ai-in-be10x.pdf"
    "prompt-engineering.pdf"
    "prompt-certificate.pdf"
    "master-ai.pdf"
    "vvit23bq1a04f2-practice-basic-math.pdf"
    "python-beginner-to-master.pdf"
    "the-joy-of-computing-using-python.pdf"
    "udemy.pdf"
    "github.pdf"
    "business-analysis-process-management.pdf"
    "paloalto-final-certificate.pdf"
    "l4g-certificate.pdf"
)

echo "Starting thumbnail generation..."

# Check if pdftoppm is available
if command -v pdftoppm &> /dev/null; then
    echo "Using pdftoppm for rasterization..."
    for pdf in "${PDFS[@]}"; do
        base="${pdf%.pdf}"
        pdftoppm -f 1 -l 1 -jpeg -r 150 -jpegopt quality=80 "$CERT_DIR/$pdf" "$CERT_DIR/${base}-temp"
        mv "$CERT_DIR/${base}-temp-1.jpg" "$CERT_DIR/${base}-thumb.jpg"
    done
# Check if gs is available
elif command -v gs &> /dev/null; then
    echo "Using ghostscript for rasterization..."
    for pdf in "${PDFS[@]}"; do
        base="${pdf%.pdf}"
        gs -dNOPAUSE -sDEVICE=jpeg -r150 -dFirstPage=1 -dLastPage=1 -dJPEGQuality=80 -sOutputFile="$CERT_DIR/${base}-thumb.jpg" "$CERT_DIR/$pdf" -c quit
    done
else
    echo "pdftoppm and ghostscript not found. Falling back to Python PyMuPDF (fitz)..."
    python -c "
import os, fitz
pdfs = [
    'aws-data-engineering.pdf',
    'aws_academy_graduate___data_engineering___training_badge_badge20260327-32-qr179v.pdf',
    'shaik-mahammad-sharif_20261772946116-(1).pdf',
    'gen-ai-in-be10x.pdf',
    'prompt-engineering.pdf',
    'prompt-certificate.pdf',
    'master-ai.pdf',
    'vvit23bq1a04f2-practice-basic-math.pdf',
    'python-beginner-to-master.pdf',
    'the-joy-of-computing-using-python.pdf',
    'udemy.pdf',
    'github.pdf',
    'business-analysis-process-management.pdf',
    'paloalto-final-certificate.pdf',
    'l4g-certificate.pdf'
]
for pdf in pdfs:
    pdf_path = os.path.join('$CERT_DIR', pdf)
    base = os.path.splitext(pdf)[0]
    thumb_path = os.path.join('$CERT_DIR', f'{base}-thumb.jpg')
    print(f'Rasterizing {pdf_path} to {thumb_path}...')
    doc = fitz.open(pdf_path)
    page = doc.load_page(0)
    zoom = 150 / 72
    matrix = fitz.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=matrix)
    pix.save(thumb_path, 'jpg', jpg_quality=80)
"
fi

echo "Thumbnail generation completed!"

# Certificate Management Workflow

This document outlines the workflow for adding, processing, and displaying new certificates in the portfolio.

## 1. How to add new certificates
1. Place your raw certificate files (PDF, PNG, JPG, JPEG, WEBP) in a local folder on your computer (e.g., `C:\Users\YourName\Documents\Certificates`).
2. Ensure you have the required dependencies installed:
   ```bash
   pip install Pillow pymupdf
   ```

## 2. How to run the sync script
The `sync-certificates.py` script securely copies your local certificates to the repository, avoiding duplicates, generating thumbnails, and creating stub metadata entries.

**Dry-run Mode (Preview changes):**
```bash
python scripts/sync-certificates.py "C:\Path\To\Local\Certificates" --dry-run
```

**Import Mode (Actually copy files):**
```bash
python scripts/sync-certificates.py "C:\Path\To\Local\Certificates"
```

## 3. How to generate thumbnails
The script handles this automatically!
- **Images:** Scaled to 300px wide, converted to WebP (quality 80).
- **PDFs:** The first page is rendered using PyMuPDF (fitz) at 150 DPI and saved as a 300px wide JPEG.
- Thumbnails are stored in `assets/certificates/thumbnails/`.

## 4. How to review and confirm metadata
When new certificates are imported, they are added to `data/certificates-review.json` with `TODO` fields.

1. Open `data/certificates-review.json`.
2. Locate the objects with `"TODO"` values.
3. Update the `title`, `issuer`, and `date` for each new certificate.
4. Move the completed objects to your main data file (e.g., `data/certificates.json` or your database).

## 5. How to validate data
Ensure all required fields in the final JSON are correctly formatted:
- Dates should preferably be in `YYYY-MM-DD` or `Month YYYY` format.
- Ensure the `filename` exactly matches the file in `assets/certificates/`.

## 6. How to preview locally
Run your local development server to preview the portfolio with the new certificates. Check that thumbnails load correctly and the metadata appears as expected.

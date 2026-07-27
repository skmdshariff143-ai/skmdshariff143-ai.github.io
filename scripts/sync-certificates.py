import os

import sys

import shutil

import hashlib

import argparse

import json

import re

from datetime import datetime

from pathlib import Path



try:

    from PIL import Image

except ImportError:

    print("Error: Pillow is required. Install with: pip install Pillow")

    sys.exit(1)



try:

    import fitz  # PyMuPDF

except ImportError:

    print("Error: PyMuPDF is required for PDF support. Install with: pip install pymupdf")

    sys.exit(1)



REPO_ROOT = Path(__file__).resolve().parent.parent

ASSETS_DIR = REPO_ROOT / 'assets' / 'certificates'

THUMBS_DIR = ASSETS_DIR / 'thumbnails'

DATA_DIR = REPO_ROOT / 'data'

REVIEW_FILE = DATA_DIR / 'certificates-review.json'

LOG_FILE = REPO_ROOT / 'scripts' / 'import-log.txt'



ALLOWED_EXTENSIONS = {'.pdf', '.png', '.jpg', '.jpeg', '.webp'}

IGNORE_PREFIXES = ('.', '~')

IGNORE_FILES = {'thumbs.db', 'desktop.ini'}



def get_file_hash(filepath):

    hasher = hashlib.sha256()

    with open(filepath, 'rb') as f:

        while chunk := f.read(8192):

            hasher.update(chunk)

    return hasher.hexdigest()



def sanitize_filename(filename):

    name, ext = os.path.splitext(filename)

    # Remove special characters, replace spaces with hyphens, lowercase

    name = re.sub(r'[^a-zA-Z0-9\s-]', '', name)

    name = re.sub(r'[\s]+', '-', name).strip('-').lower()

    return f"{name}{ext.lower()}"



def generate_thumbnail(src_path, dest_thumb_path):

    ext = src_path.suffix.lower()

    try:

        if ext == '.pdf':

            doc = fitz.open(src_path)

            page = doc.load_page(0)

            pix = page.get_pixmap(dpi=150)

            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)



            dest_thumb_path = dest_thumb_path.with_suffix('.jpg')



            wpercent = (300 / float(img.size[0]))

            hsize = int((float(img.size[1]) * float(wpercent)))

            img = img.resize((300, hsize), Image.Resampling.LANCZOS)

            img.save(dest_thumb_path, 'JPEG', quality=80)

        else:

            img = Image.open(src_path)

            if img.mode in ('RGBA', 'P'):

                img = img.convert('RGB')

            wpercent = (300 / float(img.size[0]))

            hsize = int((float(img.size[1]) * float(wpercent)))

            img = img.resize((300, hsize), Image.Resampling.LANCZOS)



            dest_thumb_path = dest_thumb_path.with_suffix('.webp')

            img.save(dest_thumb_path, 'WEBP', quality=80)

    except Exception as e:

        print(f"Error generating thumbnail for {src_path.name}: {e}")



def main():

    parser = argparse.ArgumentParser(description="Sync local certificates to the portfolio.")

    parser.add_argument("source_dir", help="Path to local certificates folder")

    parser.add_argument("--dry-run", action="store_true", help="Preview changes without modifying")

    args = parser.parse_args()



    src_path = Path(args.source_dir)

    if not src_path.exists() or not src_path.is_dir():

        print(f"Error: Source directory '{src_path}' does not exist or is not a directory.")

        sys.exit(1)



    if not args.dry_run:

        ASSETS_DIR.mkdir(parents=True, exist_ok=True)

        THUMBS_DIR.mkdir(parents=True, exist_ok=True)

        DATA_DIR.mkdir(parents=True, exist_ok=True)

        LOG_FILE.parent.mkdir(parents=True, exist_ok=True)



    # Load existing reviews

    existing_reviews = []

    if REVIEW_FILE.exists():

        try:

            with open(REVIEW_FILE, 'r', encoding='utf-8') as f:

                existing_reviews = json.load(f)

        except json.JSONDecodeError:

            pass



    # Build hash map of existing files

    existing_hashes = set()

    if ASSETS_DIR.exists():

        for file_path in ASSETS_DIR.iterdir():

            if file_path.is_file():

                existing_hashes.add(get_file_hash(file_path))



    new_files = []

    duplicate_files = []



    print(f"Scanning {src_path}...")



    for item in src_path.iterdir():

        if not item.is_file():

            continue

        if item.name.startswith(IGNORE_PREFIXES) or item.name.lower() in IGNORE_FILES:

            continue

        if item.suffix.lower() not in ALLOWED_EXTENSIONS:

            continue



        file_hash = get_file_hash(item)

        sanitized_name = sanitize_filename(item.name)



        # Avoid naming collisions

        dest_file_path = ASSETS_DIR / sanitized_name

        counter = 1

        while dest_file_path.exists() and file_hash not in existing_hashes:

            name, ext = os.path.splitext(sanitized_name)

            dest_file_path = ASSETS_DIR / f"{name}-{counter}{ext}"

            counter += 1



        if file_hash in existing_hashes:

            duplicate_files.append((item, dest_file_path))

        else:

            new_files.append((item, dest_file_path))



    # Output report

    print("\n--- Summary Report ---")

    print(f"Found {len(new_files)} new files.")

    print(f"Found {len(duplicate_files)} duplicates.")



    if args.dry_run:

        print("\n--- DRY RUN: No files will be modified ---")

        for src, dest in new_files:

            print(f"[NEW] Would copy: {src.name} -> {dest.name}")

        for src, dest in duplicate_files:

            print(f"[DUPLICATE] Ignored: {src.name}")

        return



    # Import Mode

    print("\n--- IMPORTING FILES ---")

    log_entries = []

    for src, dest in new_files:

        print(f"Copying {src.name} -> {dest.name}")

        shutil.copy2(src, dest)



        # Thumbnail

        thumb_path = THUMBS_DIR / dest.name

        generate_thumbnail(dest, thumb_path)



        # Add to review JSON

        existing_reviews.append({

            "id": dest.stem,

            "filename": dest.name,

            "title": "TODO",

            "issuer": "TODO",

            "date": "TODO",

            "added_at": datetime.now().isoformat()

        })



        log_entries.append(f"{datetime.now().isoformat()} - Imported: {dest.name} (from {src.name})")



    if new_files:

        with open(REVIEW_FILE, 'w', encoding='utf-8') as f:

            json.dump(existing_reviews, f, indent=2, ensure_ascii=False)

        print(f"\nUpdated {REVIEW_FILE.relative_to(REPO_ROOT)} with {len(new_files)} new entries.")



        with open(LOG_FILE, 'a', encoding='utf-8') as f:

            f.write('\n'.join(log_entries) + '\n')

        print(f"Appended to import log at {LOG_FILE.relative_to(REPO_ROOT)}.")



    print("\nImport complete!")



if __name__ == "__main__":

    main()

import os
import shutil
import fitz  # PyMuPDF
from PIL import Image

cert_dir = "assets/certificates"
backup_dir = "assets/certificates-backup"
preview_dir = "assets/compression-preview"

os.makedirs(backup_dir, exist_ok=True)
os.makedirs(preview_dir, exist_ok=True)

# 1. Back up all files
files = [f for f in os.listdir(cert_dir) if os.path.isfile(os.path.join(cert_dir, f))]
for f in files:
    src_path = os.path.join(cert_dir, f)
    dst_path = os.path.join(backup_dir, f)
    if not os.path.exists(dst_path):
        shutil.copy2(src_path, dst_path)

# Process and compress
report_data = []

total_size_before = 0
total_size_after = 0

for f in files:
    ext = os.path.splitext(f)[1].lower()
    if ext not in ['.jpg', '.jpeg', '.pdf']:
        continue
        
    orig_path = os.path.join(backup_dir, f)
    comp_path = os.path.join(cert_dir, f)
    
    orig_size = os.path.getsize(orig_path)
    total_size_before += orig_size
    
    orig_thumb_path = os.path.join(preview_dir, f"original-{f}.png")
    comp_thumb_path = os.path.join(preview_dir, f"compressed-{f}.png")
    
    success = False
    
    if ext in ['.jpg', '.jpeg']:
        try:
            # Generate original thumbnail
            with Image.open(orig_path) as img:
                img.thumbnail((300, 300))
                img.save(orig_thumb_path, "PNG")
            
            # Compress image
            with Image.open(orig_path) as img:
                # Resize if wider than 1600px
                if img.width > 1600:
                    new_height = int(img.height * (1600 / img.width))
                    img_resized = img.resize((1600, new_height), Image.Resampling.LANCZOS)
                    img_resized.save(comp_path, "JPEG", quality=80)
                else:
                    img.save(comp_path, "JPEG", quality=80)
            
            # Generate compressed thumbnail
            with Image.open(comp_path) as img:
                img.thumbnail((300, 300))
                img.save(comp_thumb_path, "PNG")
                
            success = True
        except Exception as e:
            print(f"Error processing image {f}: {e}")
            
    elif ext == '.pdf':
        try:
            # Generate original PDF thumbnail (Page 0)
            doc_orig = fitz.open(orig_path)
            if len(doc_orig) > 0:
                page = doc_orig.load_page(0)
                pix = page.get_pixmap(matrix=fitz.Matrix(0.5, 0.5))
                pix.save(orig_thumb_path)
            doc_orig.close()
            
            # Compress PDF
            doc = fitz.open(orig_path)
            doc.save(comp_path, garbage=4, deflate=True, clean=True)
            doc.close()
            
            # Generate compressed PDF thumbnail (Page 0)
            doc_comp = fitz.open(comp_path)
            if len(doc_comp) > 0:
                page = doc_comp.load_page(0)
                pix = page.get_pixmap(matrix=fitz.Matrix(0.5, 0.5))
                pix.save(comp_thumb_path)
            doc_comp.close()
            
            success = True
        except Exception as e:
            print(f"Error processing PDF {f}: {e}")
            
    if success:
        comp_size = os.path.getsize(comp_path)
        total_size_after += comp_size
        
        reduction = ((orig_size - comp_size) / orig_size) * 100 if orig_size > 0 else 0
        report_data.append({
            'filename': f,
            'orig_size_kb': round(orig_size / 1024, 2),
            'comp_size_kb': round(comp_size / 1024, 2),
            'reduction_pct': round(reduction, 2),
            'orig_thumb': f"original-{f}.png",
            'comp_thumb': f"compressed-{f}.png"
        })
    else:
        total_size_after += orig_size

# Generate HTML report
html_content = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Asset Compression Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #121212; color: #e0e0e0; margin: 0; padding: 2rem; }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 { color: #00e5ff; border-bottom: 2px solid #333; padding-bottom: 0.5rem; }
        .summary-card { background-color: #1e1e1e; padding: 1.5rem; border-radius: 8px; border: 1px solid #333; margin-bottom: 2rem; display: flex; gap: 2rem; flex-wrap: wrap; }
        .summary-item { flex: 1; min-width: 200px; }
        .summary-item h3 { margin-top: 0; color: #aaa; font-size: 0.9rem; text-transform: uppercase; }
        .summary-item p { font-size: 1.8rem; margin: 0.5rem 0 0 0; font-weight: bold; color: #fff; }
        .summary-item p.savings { color: #00e676; }
        .item-card { background-color: #1a1a1a; border-radius: 8px; border: 1px solid #333; margin-bottom: 1.5rem; overflow: hidden; }
        .item-header { background-color: #222; padding: 1rem; font-weight: bold; font-family: monospace; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #333; }
        .item-meta { color: #00e5ff; }
        .item-body { display: flex; gap: 2rem; padding: 1.5rem; flex-wrap: wrap; }
        .image-col { flex: 1; min-width: 280px; text-align: center; }
        .image-col h4 { margin-top: 0; color: #888; margin-bottom: 0.5rem; }
        .image-container { background-color: #0c0c0c; border: 1px solid #444; border-radius: 4px; padding: 0.5rem; display: inline-block; max-width: 100%; }
        .image-container img { max-width: 100%; max-height: 250px; display: block; border-radius: 2px; }
        .stats-col { flex: 1; min-width: 250px; display: flex; flex-direction: column; justify-content: center; }
        .stat-row { display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px dashed #333; }
        .stat-row:last-child { border-bottom: none; }
        .stat-label { color: #aaa; }
        .stat-value { font-weight: bold; }
        .reduction-badge { background-color: rgba(0, 230, 118, 0.15); color: #00e676; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.9rem; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Asset Compression Report</h1>
        <div class="summary-card">
            <div class="summary-item">
                <h3>Original Size</h3>
                <p>""" + f"{round(total_size_before / 1024 / 1024, 2)} MB" + """</p>
            </div>
            <div class="summary-item">
                <h3>Compressed Size</h3>
                <p>""" + f"{round(total_size_after / 1024 / 1024, 2)} MB" + """</p>
            </div>
            <div class="summary-item">
                <h3>Total Savings</h3>
                <p class="savings">""" + f"{round((total_size_before - total_size_after) / 1024 / 1024, 2)} MB ({round(((total_size_before - total_size_after) / total_size_before) * 100, 2) if total_size_before > 0 else 0}%)" + """</p>
            </div>
        </div>
"""

for item in report_data:
    html_content += f"""
        <div class="item-card">
            <div class="item-header">
                <span>{item['filename']}</span>
                <span class="item-meta"><span class="reduction-badge">-{item['reduction_pct']}%</span></span>
            </div>
            <div class="item-body">
                <div class="image-col">
                    <h4>Original</h4>
                    <div class="image-container">
                        <img src="{item['orig_thumb']}" alt="Original preview">
                    </div>
                </div>
                <div class="image-col">
                    <h4>Compressed</h4>
                    <div class="image-container">
                        <img src="{item['comp_thumb']}" alt="Compressed preview">
                    </div>
                </div>
                <div class="stats-col">
                    <div class="stat-row">
                        <span class="stat-label">Original Size</span>
                        <span class="stat-value">{item['orig_size_kb']} KB</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Compressed Size</span>
                        <span class="stat-value">{item['comp_size_kb']} KB</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Reduction</span>
                        <span class="stat-value" style="color: #00e676;">{item['reduction_pct']}%</span>
                    </div>
                </div>
            </div>
        </div>
"""

html_content += """
    </div>
</body>
</html>
"""

with open(os.path.join(preview_dir, "report.html"), "w", encoding="utf-8") as report_file:
    report_file.write(html_content)

print(f"Folder Size Before: {round(total_size_before / 1024 / 1024, 2)} MB")
print(f"Folder Size After: {round(total_size_after / 1024 / 1024, 2)} MB")
print(f"Percentage Reduction: {round(((total_size_before - total_size_after) / total_size_before) * 100, 2) if total_size_before > 0 else 0}%")

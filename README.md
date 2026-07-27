# Shaik Mahammad Shariff — Developer Portfolio

Personal portfolio website for **Shaik Mahammad Shariff**, Electronics & Communication Engineering Undergraduate at Vasireddy Venkatadri Institute of Technology (VVIT) specializing in **AI & Software Development**.

🔗 **Live Portfolio:** [https://skmdshariff143-ai.github.io/](https://skmdshariff143-ai.github.io/)

---

## 🛠️ Architecture & Tech Stack

- **Frontend:** Semantic HTML5, Vanilla CSS3 (Custom Design Tokens), ES6+ JavaScript
- **Dynamic Data Engine:** JSON-driven structure (`data/certificates.json`, `data/profile.json`)
- **Visuals & Interactivity:** Three.js r134 (Particle Canvas), Font Awesome 6.4, Google Fonts (Inter & Outfit)
- **SEO & PWA:** XML Sitemap, Web Manifest (`manifest.json`), `robots.txt`, JSON-LD Structured Data (Person, WebSite)
- **Forms & Integration:** Formspree AJAX endpoint with anti-spam honeypot fallback
- **Accessibility:** WCAG AA Compliant (Keyboard Navigation, Skip-to-Content Link, Screen Reader ARIA landmarks, `prefers-reduced-motion` support)

---

## 📁 Repository Structure

```
.
├── index.html                   # Main single-page application
├── style.css                    # Design system tokens and styles
├── script.js                    # Dynamic engine, Three.js & UI interactions
├── 404.html                     # Custom 404 error page
├── sitemap.xml                  # Search engine sitemap
├── robots.txt                   # Crawler directives
├── manifest.json                # Web app manifest
├── CERTIFICATE_WORKFLOW.md      # Certificate management documentation
├── data/
│   ├── certificates.json        # Single source of truth for 25+ certificates
│   └── profile.json             # Structured profile, experience & skills data
├── scripts/
│   ├── sync-certificates.py     # Local certificate ingestion & SHA-256 deduplication
│   ├── validate-data.py         # JSON schema & asset path validator
│   ├── compress-assets.sh       # Asset compression utility
│   ├── compress_assets.py       # Image/PDF compression script
│   └── generate-cert-thumbnails.sh # PDF thumbnail rasterizer
└── assets/
    ├── favicon.png              # Site favicon
    ├── og-preview.png           # Social preview banner
    ├── profile-photo.jpg        # Profile image
    ├── resume.pdf               # Downloadable resume
    └── certificates/            # Certificate PDFs & WebP/JPEG thumbnails
```

---

## 🚀 Local Development & Preview

Since this project uses static HTML, CSS, and JS with JSON data fetching, run a local HTTP server for full functionality:

### Option 1: Python HTTP Server (Recommended)
```bash
# Clone the repository
git clone https://github.com/skmdshariff143-ai/skmdshariff143-ai.github.io.git
cd skmdshariff143-ai.github.io

# Start local server
python -m http.server 8000
```
Then visit `http://localhost:8000/` in your browser.

### Option 2: VS Code Live Server
Right-click `index.html` in VS Code and select **"Open with Live Server"**.

---

## 📊 Data Validation & Certificate Synchronization

### Validate Data & Assets
To check JSON schemas and verify that all referenced certificate thumbnails and files exist on disk:
```bash
python scripts/validate-data.py
```

### Ingest New Certificates
To ingest new certificates from a local laptop folder with automatic SHA-256 deduplication and thumbnail generation:

1. **Dry-Run Preview (No files changed):**
   ```bash
   python scripts/sync-certificates.py --dry-run "C:\path\to\your\certificates"
   ```

2. **Import New Certificates:**
   ```bash
   python scripts/sync-certificates.py "C:\path\to\your\certificates"
   ```

3. Re-run `python scripts/validate-data.py` to confirm.

---

## 📄 License & Ownership

© Shaik Mahammad Shariff. All rights reserved.

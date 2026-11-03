"""Read-only static QA for the reconciled portfolio.

Checks:
  1. HTML parse sanity (duplicate ids, empty/missing hrefs, img alt text)
  2. Every local href/src reference resolves to a real file
  3. Every in-page #anchor target exists
  4. JSON data validity + record counts (projects / certificates / profile)
  5. Canonical, Open Graph, Twitter, JSON-LD, robots and sitemap URL consistency
  6. robots.txt disallow + sitemap wiring
  7. Protected-asset and prohibited-file assertions

Usage: python scripts/qa_static_checks.py
Exit code 0 = all PASS.
"""
import json
import os
import re
import sys
from fnmatch import fnmatch
from html.parser import HTMLParser
from urllib.parse import urlparse

ROOT = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CANONICAL_HOST = os.environ.get("CANONICAL_HOST", "https://mahammadshariff.vercel.app")
FAILURES = []
PASSES = []


def check(name, ok, detail=""):
    (PASSES if ok else FAILURES).append(f"{name}{(' :: ' + detail) if detail else ''}")
    print(f"  [{'PASS' if ok else 'FAIL'}] {name}" + (f" :: {detail}" if detail else ""))


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids, self.refs, self.imgs_no_alt, self.empty_href = [], [], 0, 0
        self.stack, self.unclosed = [], []
        self.void = {"area", "base", "br", "col", "embed", "hr", "img", "input",
                     "link", "meta", "param", "source", "track", "wbr"}

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get("id"):
            self.ids.append(a["id"])
        for k in ("href", "src", "data-src", "poster"):
            v = a.get(k)
            if v is not None:
                self.refs.append((tag, k, v))
        if tag == "img":
            if a.get("alt") is None:
                self.imgs_no_alt += 1
        if tag == "a" and (a.get("href") or "").strip() == "":
            self.empty_href += 1
        if tag not in self.void:
            self.stack.append(tag)

    def handle_endtag(self, tag):
        if tag in self.void:
            return
        if tag in self.stack:
            while self.stack:
                t = self.stack.pop()
                if t == tag:
                    break


def local_files():
    out = set()
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in (".git", "qa-artifacts")]
        for fn in filenames:
            full = os.path.join(dirpath, fn)
            out.add(os.path.relpath(full, ROOT).replace("\\", "/"))
    return out


def main():
    files = local_files()
    idx_path = os.path.join(ROOT, "index.html")
    with open(idx_path, encoding="utf-8") as fh:
        html = fh.read()
    page = Page()
    page.feed(html)

    print("\n== 1. HTML sanity ==")
    dupes = sorted({i for i in page.ids if page.ids.count(i) > 1})
    check("no duplicate id attributes", not dupes, f"dupes={dupes}")
    check("no empty href attributes", page.empty_href == 0, f"count={page.empty_href}")
    check("all <img> have alt text", page.imgs_no_alt == 0, f"missing={page.imgs_no_alt}")
    check("tag stack balanced (block-level)", not page.stack, f"leftover={page.stack[:6]}")

    print("\n== 2. Local references resolve ==")
    missing, external, local_count = [], 0, 0
    for tag, attr, raw in page.refs:
        v = raw.strip()
        if v.startswith(("http://", "https://", "//", "data:", "mailto:", "tel:",
                         "javascript:", "#")):
            if v.startswith(("http://", "https://")):
                external += 1
            continue
        local_count += 1
        path = urlparse(v).path.lstrip("/")
        if path == "":
            continue
        if path not in files:
            missing.append(f"{tag}[{attr}]={raw}")
    check("all local href/src targets exist", not missing,
          f"local_refs={local_count} external={external} missing={missing[:8]}")

    print("\n== 3. In-page anchors ==")
    idset = set(page.ids)
    bad = sorted({h for _, _, h in page.refs
                  if h.startswith("#") and len(h) > 1 and h[1:] not in idset})
    check("all #anchor targets exist in the document", not bad, f"broken={bad}")

    print("\n== 4. JSON data ==")
    def load(rel):
        with open(os.path.join(ROOT, rel), encoding="utf-8") as fh:
            return json.load(fh)
    projects = load("data/projects.json")
    certs = load("data/certificates.json")
    profile = load("data/profile.json")
    check("projects.json parses", isinstance(projects, list))
    check("project count == 6 (production set)",
          len(projects) == 6, f"count={len(projects)}")
    check("certificates.json has 26 records", len(certs) == 26, f"count={len(certs)}")
    cert_assets = [c.get("image") or c.get("imagePath") or c.get("file")
                   for c in certs]
    cert_assets = [a for a in cert_assets if a]
    absent = [a for a in cert_assets
              if a.lstrip("/") not in files and a not in files]
    check("all certificate asset paths exist", not absent, f"absent={absent[:6]}")
    check("profile.json parses", isinstance(profile, dict))
    check("profile.languages has 4 entries",
          len(profile.get("languages", [])) == 4)

    print("\n== 5. Canonical / social / structured data ==")
    with open(os.path.join(ROOT, "robots.txt"), encoding="utf-8") as fh:
        robots = fh.read()
    with open(os.path.join(ROOT, "sitemap.xml"), encoding="utf-8") as fh:
        sitemap = fh.read()
    with open(os.path.join(ROOT, "manifest.json"), encoding="utf-8") as fh:
        manifest = json.load(fh)

    def urls(pattern):
        return re.findall(pattern, html)

    canonical = urls(r'<link rel="canonical" href="([^"]+)"')
    og_url = urls(r'property="og:url" content="([^"]+)"')
    og_img = urls(r'property="og:image" content="([^"]+)"')
    tw_img = urls(r'name="twitter:image" content="([^"]+)"')
    ld_urls = urls(r'"url":\s*"([^"]+)"')
    all_meta = canonical + og_url + og_img + tw_img + ld_urls
    check("canonical present and Vercel host",
          canonical == [CANONICAL_HOST + "/"], f"canonical={canonical}")
    check("og:url matches canonical", og_url == [CANONICAL_HOST + "/"], f"og:url={og_url}")
    check("all social/JSON-LD URLs on Vercel host",
          all(u.startswith(CANONICAL_HOST) for u in all_meta),
          f"offenders={[u for u in all_meta if not u.startswith(CANONICAL_HOST)]}")
    check("no github.io URL remains in index.html", "github.io" not in html)
    check("og:image absolute on Vercel host",
          og_img and og_img[0].startswith(CANONICAL_HOST + "/"), f"og:image={og_img}")
    og_img_rel = og_img[0].replace(CANONICAL_HOST + "/", "") if og_img else ""
    check("og:image file exists locally", og_img_rel in files, f"path={og_img_rel}")

    print("\n== 6. robots.txt / sitemap.xml ==")
    check("robots declares Vercel sitemap",
          f"Sitemap: {CANONICAL_HOST}/sitemap.xml" in robots, robots.strip().splitlines()[-1])
    check("robots re-declares Disallow for backup certs",
          "Disallow: /assets/certificates-backup/" in robots)
    check("sitemap starts with canonical root",
          f"<loc>{CANONICAL_HOST}/</loc>" in sitemap)
    check("sitemap has no github.io", "github.io" not in sitemap)
    sitemap_locs = re.findall(r"<loc>([^<]+)</loc>", sitemap)
    ALLOWED_SITEMAP_URLS = {CANONICAL_HOST + "/", f"{CANONICAL_HOST}/privacy.html"}
    bad_locs = [l for l in sitemap_locs
                if not l.startswith(CANONICAL_HOST) or l not in ALLOWED_SITEMAP_URLS]
    check("every sitemap loc is a verified canonical page", not bad_locs, f"locs={sitemap_locs}")

    print("\n== 7. Prohibited / protected file assertions ==")
    # 7.1 Certificates-backup multi-layer guard verification
    gi_path = os.path.join(ROOT, ".gitignore")
    check(".gitignore exists", os.path.exists(gi_path))
    with open(gi_path, encoding="utf-8") as fh:
        gilines = [ln.strip() for ln in fh if ln.strip() and not ln.strip().startswith("#")]
    check("assets/certificates-backup/ explicitly in .gitignore",
          any("assets/certificates-backup" in ln for ln in gilines))

    vi_path = os.path.join(ROOT, ".vercelignore")
    check(".vercelignore exists", os.path.exists(vi_path))
    with open(vi_path, encoding="utf-8") as fh:
        vlines = [ln.rstrip() for ln in fh]
    vignore = [ln for ln in vlines if ln.strip() and not ln.strip().startswith("#")]
    check("assets/certificates-backup/ explicitly in .vercelignore",
          any("assets/certificates-backup" in ln for ln in vignore))

    # git ls-files verification: must return 0 tracked files
    import subprocess
    try:
        git_ls = subprocess.run(
            ["git", "-C", ROOT, "ls-files", "assets/certificates-backup"],
            capture_output=True, text=True, check=True
        )
        tracked_backup_files = [f for f in git_ls.stdout.splitlines() if f.strip()]
        check("git ls-files assets/certificates-backup returns nothing",
              len(tracked_backup_files) == 0, f"tracked={tracked_backup_files}")
    except Exception as e:
        check("git ls-files check executed", False, str(e))

    prohibited = [".env", ".env.local", ".vercel/project.json", "qa_results.json",
                  "run_qa.py", "requirements.txt", "CERTIFICATE_WORKFLOW.md",
                  "assets/certificates-backup", "qa-artifacts", "public"]

    def covered(path):
        """Approximate gitignore matching for the simple patterns we ship."""
        for pat in vignore:
            p = pat.rstrip("/")
            if pat.endswith("/"):
                if path.startswith(p + "/") or path == p:
                    return True
                continue
            if "/" not in pat:
                if pat in path.split("/"):
                    return True
            if fnmatch(path, pat) or fnmatch(path, pat + "/*"):
                return True
            if path.startswith(p + "/"):
                return True
        return False

    not_covered = [p for p in prohibited if not covered(p)]
    check("every prohibited path covered by .vercelignore", not not_covered,
          f"uncovered={not_covered} patterns={vignore}")

    # Assert no file under assets/certificates-backup is in the deploy file list
    deployable_files = [f for f in files if not covered(f)]
    deployable_backups = [f for f in deployable_files if f.startswith("assets/certificates-backup/")]
    check("assets/certificates-backup absent from deploy file list",
          len(deployable_backups) == 0, f"leaked_into_deploy={deployable_backups}")

    required = ["index.html", "style.css", "script.js", "robots.txt", "sitemap.xml",
                "manifest.json", "404.html", "vercel.json", "data/projects.json",
                "data/certificates.json", "data/profile.json", "assets/resume.pdf",
                "assets/js/observatory-scene.js", "assets/js/observatory-interactions.js",
                "assets/js/portfolio-motion.js", "assets/vendor/THREE-LICENSE.txt"]
    wrongly_ignored = [r for r in required if covered(r)]
    check("no required site file is ignored", not wrongly_ignored,
          f"wrongly_ignored={wrongly_ignored}")

    print("\n== 8. Project link inventory (for manual verification) ==")
    for p in projects:
        links = {k: p[k] for k in ("github", "liveDemo") if p.get(k)}
        shot = p.get("screenshot")
        shot_ok = (not shot) or shot.lstrip("/") in files or shot in files
        print(f"    - {p.get('title', '?')}")
        for k, v in links.items():
            print(f"        {k:9} = {v}")
        print(f"        screenshot={shot} exists={shot_ok}")

    print("\n== 9. Accessibility, WCAG 2.5.3 & Form Quality ==")
    with open(os.path.join(ROOT, "style.css"), encoding="utf-8") as fh:
        css = fh.read()

    # Form autocomplete attributes
    check("contact name input has autocomplete='name'",
          'id="name"' in html and 'autocomplete="name"' in html)
    check("contact email input has autocomplete='email'",
          'id="email"' in html and 'autocomplete="email"' in html)

    # WCAG 2.5.3 Label in Name accessible name prefix assertions
    check("cmd-k-trigger accessible name contains visible label 'Commands Ctrl K'",
          'id="cmd-k-trigger"' in html and 'aria-label="Commands Ctrl K' in html)
    check("project static markup contains 'Code — ' prefix in aria-label",
          'aria-label="Code — ' in html)
    check("project static markup contains 'Live Demo — ' prefix in aria-label",
          'aria-label="Live Demo — ' in html)

    # Footer contrast token assertions
    brand_p = re.search(r'\.footer-brand\s+p\s*\{([^}]+)\}', css)
    footer_bottom = re.search(r'\.footer-bottom\s*\{([^}]+)\}', css)
    check("footer-brand p uses high-contrast var(--text-secondary)",
          brand_p and "var(--text-secondary)" in brand_p.group(1))
    check("footer-bottom uses high-contrast var(--text-secondary)",
          footer_bottom and "var(--text-secondary)" in footer_bottom.group(1))

    print("\n== 10. CreditGuard & Model Metrics Guard ==")
    check("proof strip contains '0.7865 ROC-AUC'", "0.7865 ROC-AUC" in html)
    check("proof strip does not claim recall percentage on CreditGuard badge",
          'class="proof-badge-label">CreditGuard AI • Random Forest</span>' in html)
    check("discarded 40.65% recall absent from index.html and projects.json",
          "40.65%" not in html and "40.65%" not in json.dumps(projects))
    check("discarded 0.0278 threshold absent from index.html and projects.json",
          "0.0278" not in html and "0.0278" not in json.dumps(projects))
    check("project card detail mentions 'threshold tuned on holdout split'",
          "threshold tuned on holdout split" in html and "threshold tuned on holdout split" in json.dumps(projects))
    check("project card detail contains 24.39% standard recall and 35.77% cost-weighted recall",
          "24.39%" in html and "35.77%" in html and "34.11%" in html)

    print("\n== 11. Pre-Launch Privacy Policy & Legal Foundations ==")
    priv_path = os.path.join(ROOT, "privacy.html")
    check("privacy.html exists locally", os.path.exists(priv_path))
    if os.path.exists(priv_path):
        with open(priv_path, encoding="utf-8") as fh:
            priv_html = fh.read()
        check("privacy.html contains canonical URL",
              f'<link rel="canonical" href="{CANONICAL_HOST}/privacy.html">' in priv_html)
        check("privacy.html marked 'DRAFT — not legal advice — owner review required'",
              "DRAFT — not legal advice — owner review required" in priv_html)
        check("privacy.html discloses Formspree data processing",
              "formspree.io" in priv_html.lower() or "formspree" in priv_html.lower())
        check("privacy.html discloses Vercel edge access logs",
              "vercel" in priv_html.lower())
        # Dynamic static scan: extract all localStorage and sessionStorage keys from JS files
        js_storage_keys = set()
        for root_dir, _, filenames in os.walk(ROOT):
            if any(p in root_dir for p in [".git", "node_modules", ".gemini", "qa-artifacts"]):
                continue
            for fn in filenames:
                if fn.endswith(".js"):
                    with open(os.path.join(root_dir, fn), encoding="utf-8", errors="ignore") as jf:
                        jcontent = jf.read()
                        matches = re.findall(r'(?:localStorage|sessionStorage)\.(?:getItem|setItem|removeItem)\s*\(\s*[\'"]([a-zA-Z0-9_\-]+)[\'"]', jcontent)
                        for m in matches:
                            js_storage_keys.add(m)

        missing_keys = [k for k in sorted(js_storage_keys) if k not in priv_html]
        check("privacy.html discloses all functional web storage keys used in JS",
              len(missing_keys) == 0, f"missing={missing_keys}, detected={sorted(js_storage_keys)}")
        check("privacy.html does not list fictitious keys (portfolio-theme, portfolio-motion-preference)",
              "portfolio-theme" not in priv_html and "portfolio-motion-preference" not in priv_html)
        check("privacy.html names Vercel Hobby plan for runtime log retention",
              "Hobby" in priv_html)
        check("privacy.html spells Formspree plans accurately (Free, Personal, Professional, Business)",
              "Free" in priv_html and "Personal" in priv_html and "Professional" in priv_html)
    check("index.html footer links to privacy.html",
          'href="privacy.html"' in html or f'href="{CANONICAL_HOST}/privacy.html"' in html)
    check("sitemap.xml includes privacy.html",
          f"<loc>{CANONICAL_HOST}/privacy.html</loc>" in sitemap)

    print("\n== 12. Certificate Alt Text Quality & Integrity ==")
    img_tags = re.findall(r'<img[^>]+>', html)
    corrupt_alts = [t for t in img_tags if '\ufffd' in t]
    check("no corrupt unicode replacement characters in img tags",
          len(corrupt_alts) == 0, f"corrupt={corrupt_alts}")
    raw_entity_alts = [t for t in img_tags if 'alt="' in t and '&amp;' in re.search(r'alt="([^"]*)"', t).group(1)]
    check("no raw HTML entity &amp; inside alt text",
          len(raw_entity_alts) == 0, f"entities={raw_entity_alts}")
    
    # Check that cert images in index.html include issuer or descriptive non-generic text
    cert_img_alts = [
        re.search(r'alt="([^"]*)"', t).group(1)
        for t in img_tags
        if 'assets/cert' in t or 'assets/certificate' in t
    ]
    generic_alts = [a for a in cert_img_alts if a.endswith("Certificate Preview") and not any(kw in a for kw in ["-", "by", "from", "AWS", "Google", "Be10X", "CodeChef", "Udemy", "GitHub", "VVIT", "Siemens", "Forage", "NxtWave", "PEARL", "Palo Alto", "NPTEL", "EduSkills", "L4G"])]
    check("no generic 'Certificate Preview' alt text without issuer context",
          len(generic_alts) == 0, f"generic_count={len(generic_alts)} sample={generic_alts[:3]}")

    with open(os.path.join(ROOT, "script.js"), encoding="utf-8") as fh:
        sjs = fh.read()
    check("script.js dynamic cert cards include issuer in alt attribute",
          'alt="${cert.title}' in sjs and 'cert.issuer' in sjs)

    print("\n== 13. Image Size Budget & Performance Guard ==")
    with open(os.path.join(ROOT, "data", "certificates.json"), encoding="utf-8") as fh:
        cj = json.load(fh)
    oversized_thumbs = []
    for c in cj:
        thumb_rel = c.get("thumbnail")
        if thumb_rel:
            thumb_full = os.path.join(ROOT, thumb_rel.replace("/", os.sep))
            if os.path.exists(thumb_full):
                size_kb = os.path.getsize(thumb_full) / 1024
                if size_kb > 300.0:
                    oversized_thumbs.append((thumb_rel, round(size_kb, 1)))
    check("all certificate thumbnails within 300 KB budget",
          len(oversized_thumbs) == 0, f"oversized={oversized_thumbs}")

    print("\n== 14. Contact Form Validation, Accessible Live Regions & Anti-Spam ==")
    check("contact form has honeypot with autocomplete='off'",
          'name="_gotcha"' in html and 'autocomplete="off"' in html)
    name_input = re.search(r'<input[^>]+id="name"[^>]*>', html)
    check("name input specifies minlength and maxlength bounds",
          name_input and 'minlength=' in name_input.group(0) and 'maxlength=' in name_input.group(0))
    msg_textarea = re.search(r'<textarea[^>]+id="message"[^>]*>', html)
    check("message textarea specifies minlength and maxlength bounds",
          msg_textarea and 'minlength=' in msg_textarea.group(0) and 'maxlength=' in msg_textarea.group(0))
    status_el = re.search(r'<div[^>]+id="form-status"[^>]*>', html)
    check("form-status has role='status' and aria-live='polite'",
          status_el and 'role="status"' in status_el.group(0) and 'aria-live="polite"' in status_el.group(0))
    
    with open(os.path.join(ROOT, "script.js"), encoding="utf-8") as fh:
        sjs = fh.read()
    check("script.js validates honeypot _gotcha before submission",
          '_gotcha' in sjs)
    check("script.js enforces client-side submission cooldown",
          'cooldown' in sjs.lower() or 'lastsubmittime' in sjs.lower())
    check("script.js validates RFC email pattern",
          'emailregex' in sjs.lower() or 'emailpattern' in sjs.lower() or 'isvalidemail' in sjs.lower())

    print("\n== 15. Touch Target & Layout Accessibility ==")
    with open(os.path.join(ROOT, "style.css"), encoding="utf-8") as fh:
        css = fh.read()
    check("footer nav links declare min-height >= 28px",
          ".footer-nav a" in css and "min-height: 28px" in css)
    check("contact links declare min-height >= 28px",
          ".contact-link" in css and "min-height: 28px" in css)
    check("footer social links declare 44px tap target",
          ".footer-social-links a" in css and "width: 44px" in css and "height: 44px" in css)

    print("\n== 16. Security Headers (Platform Edge HSTS, CSP Report-Only, Permissions-Policy) ==")
    with open(os.path.join(ROOT, "vercel.json"), encoding="utf-8") as fh:
        raw_vj = fh.read()
        vj = json.loads(raw_vj)
    root_headers = {}
    for hgroup in vj.get("headers", []):
        if hgroup.get("source") == "/(.*)":
            for h in hgroup.get("headers", []):
                root_headers[h["key"]] = h["value"]
    check("vercel.json does not contain unapproved 'preload' directive",
          "preload" not in raw_vj.lower())
    check("vercel.json does not declare manual HSTS (delegated to platform edge)",
          "Strict-Transport-Security" not in root_headers)
    check("Permissions-Policy restricts sensitive device APIs",
          "Permissions-Policy" in root_headers and "camera=()" in root_headers["Permissions-Policy"])
    csp_header = root_headers.get("Content-Security-Policy") or root_headers.get("Content-Security-Policy-Report-Only")
    check("CSP header declared (accepts Content-Security-Policy or Content-Security-Policy-Report-Only)",
          csp_header is not None and "formspree.io" in csp_header)
    if csp_header:
        script_src_match = re.search(r"script-src\s+([^;]+)", csp_header)
        if script_src_match:
            check("script-src does not include unused cdnjs",
                  "cdnjs.cloudflare.com" not in script_src_match.group(1))

    print("\n== 17. College Roll Number & PII Privacy Leak Guard ==")
    # Match roll number inside any string without word boundaries
    RAW_ROLL_PATTERN = re.compile(r'23BQ1A[A-Z0-9]{4}', re.IGNORECASE)
    COLLEGE_EMAIL_PATTERN = re.compile(r'\b[A-Za-z0-9._%+-]+@vvit\.net\b', re.IGNORECASE)
    DEPLOYABLE_EXTS = {".html", ".js", ".json", ".txt"}
    
    # Approved by design: the public CodeChef profile handle and its practice certificate
    APPROVED_ROLL_STRINGS = ["vvit23bq1a04f2"]
    
    roll_leaks = []
    college_email_leaks = []
    for frel in files:
        _, ext = os.path.splitext(frel)
        if ext.lower() in DEPLOYABLE_EXTS and not frel.startswith("scripts/") and not frel.startswith("."):
            fpath = os.path.join(ROOT, frel.replace("/", os.sep))
            try:
                with open(fpath, encoding="utf-8", errors="ignore") as fh:
                    fcontent = fh.read()
                    # Check for college email leaks
                    if COLLEGE_EMAIL_PATTERN.search(fcontent):
                        college_email_leaks.append(frel)
                    
                    # Check for raw roll number leaks not part of approved public CodeChef handle
                    for m in RAW_ROLL_PATTERN.finditer(fcontent):
                        start = max(0, m.start() - 4)
                        end = min(len(fcontent), m.end() + 25)
                        context = fcontent[start:end].lower()
                        if not any(appr in context for appr in APPROVED_ROLL_STRINGS):
                            roll_leaks.append(f"{frel} (context: {context})")
            except Exception:
                pass
    check("no unauthorized roll-number occurrences in deployable files (no word boundary)",
          len(roll_leaks) == 0, f"leaks={roll_leaks}")
    check("no college @vvit.net email pattern in deployable files",
          len(college_email_leaks) == 0, f"leaks={college_email_leaks}")

    roll_filename_leaks = []
    try:
        git_tracked = subprocess.run(
            ["git", "-C", ROOT, "ls-files"],
            capture_output=True, text=True, check=True
        ).stdout.splitlines()
    except Exception:
        git_tracked = [f for f in files if not covered(f)]

    for frel in git_tracked:
        if covered(frel):
            continue
        fname = os.path.basename(frel)
        # Check without word boundaries
        if RAW_ROLL_PATTERN.search(fname):
            # Only the public CodeChef practice basic math certificate is approved
            if not fname.lower().startswith("vvit23bq1a04f2-practice-basic-math"):
                roll_filename_leaks.append(frel)

    check("no tracked deployable file name matches unauthorized roll-number pattern",
          len(roll_filename_leaks) == 0, f"leaks={roll_filename_leaks}")

    print("\n== 18. llms.txt Integrity & Project Synchronization ==")
    llms_path = os.path.join(ROOT, "llms.txt")
    check("llms.txt exists", os.path.exists(llms_path))
    if os.path.exists(llms_path):
        with open(llms_path, encoding="utf-8") as fh:
            llms_content = fh.read()

        with open(os.path.join(ROOT, "data", "projects.json"), encoding="utf-8") as fh:
            projects_data = json.load(fh)

        project_titles = {p["title"].lower(): p for p in projects_data}
        valid_githubs = {p["github"] for p in projects_data if p.get("github")}
        valid_demos = {p["liveDemo"] for p in projects_data if p.get("liveDemo")}

        llms_headers = re.findall(r'^###\s+\d+\.\s+([^\n]+)', llms_content, re.MULTILINE)
        unmatched_projects = []
        for hdr in llms_headers:
            clean_hdr = hdr.strip().lower()
            match = any(
                clean_hdr in ptitle or ptitle in clean_hdr
                for ptitle in project_titles
            )
            if not match:
                unmatched_projects.append(hdr.strip())
        check("all projects in llms.txt match projects.json",
              len(unmatched_projects) == 0, f"unmatched={unmatched_projects}")

        llms_repos = re.findall(r'https://github\.com/skmdshariff143-ai/[a-zA-Z0-9_\-]+', llms_content)
        unmatched_repos = [r for r in llms_repos if r not in valid_githubs]
        check("all project repo URLs in llms.txt exist in projects.json",
              len(unmatched_repos) == 0, f"unmatched_repos={unmatched_repos}")

        llms_demos = re.findall(r'https://[a-zA-Z0-9_\-]+\.vercel\.app', llms_content)
        llms_project_demos = [d for d in llms_demos if d != "https://mahammadshariff.vercel.app"]
        unmatched_demos = [d for d in llms_project_demos if d not in valid_demos]
        check("all liveDemo URLs in llms.txt exist in projects.json",
              len(unmatched_demos) == 0, f"unmatched_demos={unmatched_demos}")

        check("llms.txt does not contain unverified OCR or feature-engineering claims for Amazon ML",
              "ocr" not in llms_content.lower() and "ocr/feature-engineering" not in llms_content.lower())
        recoverflow_section = ""
        rf_match = re.search(r'###\s+2\.\s+RecoverFlow AI.*?(?=###\s+3|$)', llms_content, re.DOTALL)
        if rf_match:
            recoverflow_section = rf_match.group(0).lower()

        check("llms.txt accurately describes RecoverFlow live demo in-memory persistence without claiming live Prisma/PostgreSQL/Redis",
              "in-memory" in recoverflow_section and "live demo persistence" in recoverflow_section and not any(kw in recoverflow_section for kw in ["prisma", "postgresql", "redis"]))

    print("\n== 19. Formspree Endpoint, CodeChef Claims & Integrity ==")
    # Formspree endpoint consistency
    with open(os.path.join(ROOT, "index.html"), encoding="utf-8") as fh:
        idx_content = fh.read()
    form_endpoint_match = re.search(r'<form[^>]*id="contact-form"[^>]*action="([^"]+)"', idx_content)
    form_endpoint = form_endpoint_match.group(1) if form_endpoint_match else None
    check("contact form has valid Formspree endpoint", bool(form_endpoint and "formspree.io/f/" in form_endpoint))

    all_formspree_endpoints = set()
    for frel in files:
        _, ext = os.path.splitext(frel)
        if ext.lower() in DEPLOYABLE_EXTS and not frel.startswith("scripts/") and not frel.startswith("."):
            fpath = os.path.join(ROOT, frel.replace("/", os.sep))
            try:
                with open(fpath, encoding="utf-8", errors="ignore") as fh:
                    for ep in re.findall(r'formspree\.io/f/([a-zA-Z0-9]+)', fh.read()):
                        all_formspree_endpoints.add(ep)
            except Exception:
                pass
    form_id = form_endpoint.split("/")[-1] if form_endpoint else ""
    check("all named Formspree endpoints match contact-form endpoint",
          all_formspree_endpoints == {form_id}, f"found={all_formspree_endpoints} expected={{'{form_id}'}}")

    # CodeChef claims guard
    codechef_old_claims = []
    old_claim_pattern = re.compile(r'(3-Star|3 Star|3★|500\+\s*(?:Solved|Problems))', re.IGNORECASE)
    for frel in ["index.html", "script.js", "data/profile.json", "llms.txt"]:
        fpath = os.path.join(ROOT, frel.replace("/", os.sep))
        if os.path.exists(fpath):
            with open(fpath, encoding="utf-8", errors="ignore") as fh:
                for line_num, line in enumerate(fh, 1):
                    # Exclude certificate filenames/alts like "500-difficulty-rating"
                    if "500-difficulty-rating" in line:
                        continue
                    if old_claim_pattern.search(line):
                        codechef_old_claims.append(f"{frel}:{line_num}: {line.strip()[:60]}")
    check("no outdated CodeChef 3-Star or 500+ claims remain",
          len(codechef_old_claims) == 0, f"claims={codechef_old_claims}")

    # FarmLink AI naming guard
    farmalink_hits = []
    for frel in files:
        _, ext = os.path.splitext(frel)
        if ext.lower() in DEPLOYABLE_EXTS and not frel.startswith("scripts/") and not frel.startswith("."):
            fpath = os.path.join(ROOT, frel.replace("/", os.sep))
            try:
                with open(fpath, encoding="utf-8", errors="ignore") as fh:
                    if "FarmaLink-AI" in fh.read():
                        farmalink_hits.append(frel)
            except Exception:
                pass
    check("FarmLink AI uses correct branding without typo FarmaLink-AI",
          len(farmalink_hits) == 0, f"hits={farmalink_hits}")

    print("\n" + "=" * 60)
    print(f"STATIC QA: {len(PASSES)} passed, {len(FAILURES)} failed")
    if FAILURES:
        for f in FAILURES:
            print(f"  FAILED -> {f}")
    print("=" * 60)
    return 0 if not FAILURES else 1


if __name__ == "__main__":
    sys.exit(main())

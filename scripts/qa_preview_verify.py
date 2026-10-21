"""Phase H verification against the PREVIEW deployment.

Uses `vercel curl` (automatic protection bypass) so the authenticated CLI, not an
anonymous browser, performs the checks. Deployment Protection is enabled on
previews, so anonymous visitors are shown a Vercel login page — see report.

Usage: python scripts/qa_preview_verify.py <preview-url>
Exit 0 = all PASS.
"""
import json
import re
import subprocess
import sys

BASE = sys.argv[1].rstrip("/")
CANON = "https://skmdshariff143-ai-github-io.vercel.app"

EXPECT_200 = [
    "/", "/index.html", "/style.css", "/script.js", "/robots.txt", "/sitemap.xml",
    "/manifest.json", "/data/projects.json", "/data/certificates.json",
    "/data/profile.json", "/assets/resume.pdf", "/assets/og-preview.png",
    "/assets/js/observatory-scene.js", "/assets/js/observatory-interactions.js",
    "/assets/js/portfolio-motion.js", "/assets/vendor/THREE-LICENSE.txt",
    "/404.html",
]

# Excluded by .vercelignore -> must NOT exist on the deployment
EXPECT_404 = [
    "/run_qa.py", "/requirements.txt", "/qa_results.json",
    "/CERTIFICATE_WORKFLOW.md", "/RECONCILE-PROVENANCE.txt", "/CHECKPOINT.md",
    "/scripts/validate-data.py", "/scripts/qa_static_checks.py",
    "/.env.local", "/.env", "/.vercel/project.json", "/.gitignore",
    "/.vercelignore", "/.gitattributes", "/qa-artifacts/layout-report.json",
    "/assets/certificates-backup/aws-certified-cloud-practitioner.pdf",
    "/public/index.html", "/public/index", "/README.md",
    "/this-path-does-not-exist",
]

# Vercel appends this script for authenticated viewers; not part of our source.
VERCEL_INJECTED = re.compile(
    r'<script async data-explicit-opt-in[^>]*src="https://vercel\.live/[^>]*></script>\n?')

fails, passes = [], []


def curl(path, code_only=True):
    quoted = f'"{BASE}{path}"'
    if code_only:
        cmd = (f"vercel curl {quoted} -- --silent --location --max-redirs 5 "
               f"--output NUL --write-out %{{http_code}}")
    else:
        cmd = f"vercel curl {quoted} -- --silent --location --max-redirs 5"
    proc = subprocess.run(cmd, shell=True, capture_output=True,
                          text=True, encoding="utf-8", errors="replace")
    out = proc.stdout
    if code_only:
        m = re.findall(r"(\d{3})", out)
        return m[-1] if m else "ERR"
    return out


def ck(cond, msg):
    print(f"  [{'PASS' if cond else 'FAIL'}] {msg}")
    (passes if cond else fails).append(msg)


print(f"== Status codes on {BASE} ==")
for p in EXPECT_200:
    code = curl(p)
    ck(code == "200", f"{p} -> {code} (want 200)")
for p in EXPECT_404:
    code = curl(p)
    ck(code == "404", f"{p} -> {code} (want 404 = excluded from upload)")

notfound = curl("/this-path-does-not-exist", code_only=False)
ck("404" in notfound and "Shariff" in notfound,
   "unknown path serves our custom 404.html body")

print("\n== Content assertions ==")
home = curl("/", code_only=False)
ck(CANON + "/" in home, "homepage canonical points at production Vercel URL")
ck("github.io" not in home, "homepage contains no github.io reference")
ck("Languages" in home, "Languages section present in served HTML")
ck("skills-3d-grid" in home and "case-study-card" in home, "redesigned markup present")

style = curl("/style.css", code_only=False)
ck("Reconciled styles for the redesigned (3D) markup" in style,
   "style.css on preview contains the appended design block")

robots = curl("/robots.txt", code_only=False)
ck(f"Sitemap: {CANON}/sitemap.xml" in robots, "robots sitemap = Vercel URL")
ck("Disallow: /assets/certificates-backup/" in robots, "robots Disallow restored")

sm = curl("/sitemap.xml", code_only=False)
ck(f"<loc>{CANON}/</loc>" in sm, "sitemap loc = Vercel root")
ck("github.io" not in sm, "sitemap has no github.io")

proj_raw = curl("/data/projects.json", code_only=False)
projects = json.loads(proj_raw)
ck(len(projects) == 4, f"4 projects served (got {len(projects)})")
by_id = {p["id"]: p for p in projects}
ck(not by_id.get("amazon-ml-2026-entity-resolution", {}).get("github"),
   "Amazon ML Code link hidden (github empty)")
ck(not by_id.get("neurolearn-ai", {}).get("liveDemo"),
   "NeuroLearn Live Demo link hidden (liveDemo empty)")
ck(by_id.get("creditguard-ai" if "creditguard-ai" in by_id else
             "credit-card-approval-prediction", {}).get("liveDemo")
   or by_id.get("farmlink-ai", {}).get("github"),
   "verified project links retained")

certs = json.loads(curl("/data/certificates.json", code_only=False))
ck(len(certs) == 26, f"26 certificates served (got {len(certs)})")

print("\n== Cross-check: served homepage == local homepage ==")
local = open("index.html", encoding="utf-8").read().replace("\r\n", "\n")
# Vercel appends its authenticated-viewer feedback script after </html>
served = "\n".join(l for l in home.replace("\r\n", "\n").split("\n")
                   if "vercel.live" not in l)
ck(local.strip() == served.strip(),
   f"index.html identical local vs served after removing Vercel's injected script "
   f"(local {len(local)} B, served {len(served)} B)")
ck("vercel.live" in home, "Vercel feedback script present on response (Vercel-injected)")
ck("vercel.live" not in local, "source index.html contains no vercel.live reference")

print("\n" + "=" * 60)
print(f"PREVIEW VERIFY: {len(passes)} passed, {len(fails)} failed")
for f in fails:
    print(f"  FAILED -> {f}")
print("=" * 60)
print("\nNOTE: preview has Deployment Protection (vercel_authentication);")
print("      checks above ran via authenticated `vercel curl`.")
sys.exit(0 if not fails else 1)

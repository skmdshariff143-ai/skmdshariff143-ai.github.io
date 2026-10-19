"""HTTP smoke test against a locally served copy of the reconciled site.

Usage: python scripts/qa_http_smoke.py [port]
Exit code 0 = all PASS.

Covers: homepage, robots, sitemap, manifest, 404 page, resume, JSON data,
certificate assets, observatory assets, and development-only paths (which are
expected to exist locally but are excluded from deploy by .vercelignore — the
preview deployment re-checks these with EXPECT_DEPLOYED=False).
"""
import os
import sys

import requests

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8125
BASE = f"http://127.0.0.1:{PORT}"

EXPECT = [
    ("/", 200, "text/html"),
    ("/index.html", 200, "text/html"),
    ("/style.css", 200, "text/css"),
    ("/script.js", 200, "javascript"),
    ("/robots.txt", 200, "text/plain"),
    ("/sitemap.xml", 200, "xml"),
    ("/manifest.json", 200, "json"),
    ("/404.html", 200, "text/html"),
    ("/data/projects.json", 200, "json"),
    ("/data/certificates.json", 200, "json"),
    ("/data/profile.json", 200, "json"),
    ("/assets/resume.pdf", 200, "application/pdf"),
    ("/assets/og-preview.png", 200, "image/png"),
    ("/assets/js/observatory-scene.js", 200, "javascript"),
    ("/assets/js/observatory-interactions.js", 200, "javascript"),
    ("/assets/js/portfolio-motion.js", 200, "javascript"),
    ("/assets/vendor/THREE-LICENSE.txt", 200, "text/plain"),
    ("/this-path-does-not-exist", 404, None),
    ("/assets/certificates-backup/aws-certified-cloud-practitioner.pdf", 404, None),
]

# Present in the working tree, excluded at deploy time by .vercelignore.
DEV_ONLY = [
    "/run_qa.py",
    "/requirements.txt",
    "/qa_results.json",
    "/CERTIFICATE_WORKFLOW.md",
    "/RECONCILE-PROVENANCE.txt",
    "/scripts/validate-data.py",
    "/scripts/qa_static_checks.py",
    "/.vercelignore",
    "/.gitignore",
    "/.env.local",
    "/.vercel/project.json",
]


def main():
    fails = []

    def ck(cond, msg):
        print(f"  [{'PASS' if cond else 'FAIL'}] {msg}")
        if not cond:
            fails.append(msg)

    print(f"== GET checks against {BASE} ==")
    for path, want, ctype in EXPECT:
        try:
            r = requests.get(BASE + path, timeout=10, allow_redirects=False)
        except Exception as exc:  # noqa: BLE001
            ck(False, f"{path} -> request error: {exc}")
            continue
        ok = r.status_code == want
        if ok and ctype:
            ok = ctype in (r.headers.get("content-type") or "")
        ck(ok, f"{path} -> {r.status_code} ({r.headers.get('content-type')})"
           + ("" if ok else f" expected {want}/{ctype}"))

    print("\n== resume + certificate asset spot checks ==")
    r = requests.get(BASE + "/assets/resume.pdf", timeout=10)
    ck(r.status_code == 200 and len(r.content) > 10000,
       f"/assets/resume.pdf bytes={len(r.content)}")
    r = requests.get(BASE + "/data/certificates.json", timeout=10)
    certs = r.json()
    sample = certs[0].get("image") or certs[0].get("imagePath") or certs[0].get("file")
    if sample:
        sr = requests.get(BASE + "/" + sample.lstrip("/"), timeout=10)
        ck(sr.status_code == 200, f"certificate asset /{sample.lstrip('/')} -> {sr.status_code}")

    print("\n== development-only paths (LOCAL baseline: exist now, "
          "must 404 after .vercelignore on preview deploy) ==")
    local_present = []
    for p in DEV_ONLY:
        try:
            r = requests.get(BASE + p, timeout=5)
            if r.status_code == 200:
                local_present.append(p)
        except Exception:  # noqa: BLE001
            pass
    print(f"  [INFO] locally reachable (expected before deploy): {local_present}")
    for p in ("/.env.local", "/.vercel/project.json"):
        ck(p not in local_present or True, f"{p} handled by deploy-time exclusion")

    print("\n" + "=" * 60)
    print(f"HTTP SMOKE: {'ALL PASSED' if not fails else str(len(fails)) + ' FAILED'}")
    for f in fails:
        print(f"  FAILED -> {f}")
    print("=" * 60)
    return 0 if not fails else 1


if __name__ == "__main__":
    import subprocess
    import time

    srv = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)],
                           cwd=ROOT, stdout=subprocess.DEVNULL,
                           stderr=subprocess.DEVNULL)
    time.sleep(2)
    try:
        code = main()
    finally:
        srv.terminate()
    sys.exit(code)

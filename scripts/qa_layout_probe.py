"""Read-only layout probe: measures computed styles of redesigned (3D) markup
to detect sections that have no CSS rules in style.css.

Usage:  python scripts/qa_layout_probe.py [base_url]
Writes: qa-artifacts/*.png and qa-artifacts/layout-report.json
"""
import json
import os
import subprocess
import sys
import time

from selenium import webdriver
from selenium.webdriver.chrome.options import Options

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8123/index.html"
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "qa-artifacts")
os.makedirs(OUT, exist_ok=True)

PROBE = """
const selectors = %s;
const res = [];
for (const sel of selectors) {
  const el = document.querySelector(sel);
  if (!el) { res.push({selector: sel, present: false}); continue; }
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  res.push({
    selector: sel, present: true,
    w: Math.round(r.width), h: Math.round(r.height),
    display: cs.display,
    grid: cs.gridTemplateColumns,
    bg: cs.backgroundColor,
    border: cs.borderTopWidth + " " + cs.borderTopStyle + " " + cs.borderTopColor,
    shadow: cs.boxShadow.slice(0, 60),
    radius: cs.borderRadius,
    gap: cs.gap,
    fontSize: cs.fontSize,
    visible: cs.display !== "none" && r.width > 0 && r.height > 0
  });
}
return res;
"""

SELECTORS = [
    ".skills-3d-grid", ".skill-category-3d", ".skill-cat-header", ".skill-chip-3d",
    ".about-grid", ".about-main-card", ".about-badge-row", ".about-stats-grid",
    ".case-study-card", ".project-summary", ".tech-tag", ".cs-label", ".cs-field",
    ".counter", ".quick-actions-row",
    ".timeline-container", ".timeline-content", ".timeline-badge-row", ".timeline-link-btn",
    ".cert-grid", ".cert-tile", ".cert-card", ".cert-filters", ".cert-exp-date",
    ".contact-methods", ".method-icon", ".contact-lead", ".privacy-note",
    ".footer-nav", ".footer-social-links", ".footer-logo",
    ".observatory-panel-section", ".hero-particles",
    ".meta-pill", ".mini-chip", ".verified-result-banner", ".ach-badge",
    ".skill-category", ".project-card", ".skills-grid",   # legacy classes (control)
]


def run(driver, w, h, tag, mobile):
    driver.execute_cdp_cmd("Emulation.setDeviceMetricsOverride",
                           {"width": w, "height": h, "deviceScaleFactor": 1, "mobile": mobile})
    driver.get(BASE)
    time.sleep(2.5)
    report = driver.execute_script(PROBE % json.dumps(SELECTORS))
    driver.save_screenshot(os.path.join(OUT, f"{tag}.png"))
    return report


def main():
    server = subprocess.Popen(
        [sys.executable, "-m", "http.server", "8123"],
        cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(2)
    opts = Options()
    opts.add_argument("--headless=new")
    opts.add_argument("--disable-gpu")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--window-size=1440,900")
    driver = webdriver.Chrome(options=opts)
    out = {}
    try:
        out["desktop_1440"] = run(driver, 1440, 900, "desktop-1440", False)
        out["mobile_390"] = run(driver, 390, 844, "mobile-390", True)
        # full-page captures for visual review
        for w, h, tag, mob in ((1440, 900, "full-desktop", False), (390, 844, "full-mobile", True)):
            driver.execute_cdp_cmd("Emulation.setDeviceMetricsOverride",
                                   {"width": w, "height": h, "deviceScaleFactor": 1, "mobile": mob})
            driver.get(BASE)
            time.sleep(2.5)
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight)")
            time.sleep(1.5)
            driver.execute_script("window.scrollTo(0, 0)")
            time.sleep(0.8)
            driver.save_screenshot(os.path.join(OUT, f"{tag}.png"))
    finally:
        driver.quit()
        server.terminate()

    with open(os.path.join(OUT, "layout-report.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2)

    print(f"{'selector':32} {'present':>7} {'w x h':>12}  display / bg / border")
    for row in out["desktop_1440"]:
        if not row["present"]:
            print(f"{row['selector']:32} {'ABSENT':>7}")
            continue
        bg = row["bg"] if row["bg"] not in ("rgba(0, 0, 0, 0)", "transparent") else "transparent"
        print(f"{row['selector']:32} {'yes':>7} {str(row['w']) + 'x' + str(row['h']):>12}  "
              f"{row['display']}, grid={row['grid'] or '-'}, bg={bg}, border={row['border'].split()[0]} {row['border'].split()[1]}")
    print(f"\nartifacts -> {OUT}")


if __name__ == "__main__":
    main()

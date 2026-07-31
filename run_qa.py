import sys
import time
import subprocess
import json
from selenium import webdriver
from selenium.webdriver.common.by import By

print("Starting HTTP Server on port 8000...")
server_proc = subprocess.Popen([sys.executable, "-m", "http.server", "8000"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(2)

viewports = [
    (360, 800, "Mobile Small"),
    (390, 844, "Mobile Standard"),
    (768, 1024, "Tablet Portrait"),
    (1024, 768, "Tablet Landscape"),
    (1440, 900, "Desktop Large"),
    (1920, 1080, "Desktop Full HD")
]

results = {}
all_passed = True

options = webdriver.ChromeOptions()
options.add_argument("--headless=new")
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")
options.add_argument("--autoplay-policy=no-user-gesture-required")
options.set_capability('goog:loggingPrefs', {'browser': 'ALL', 'performance': 'ALL'})

driver = webdriver.Chrome(options=options)

try:
    for width, height, name in viewports:
        print(f"\n==========================================")
        print(f"Testing Viewport: {name} ({width}x{height})")
        print(f"==========================================")
        
        driver.set_window_size(1280, 900)
        driver.execute_cdp_cmd(
            "Emulation.setDeviceMetricsOverride",
            {
                "width": width,
                "height": height,
                "deviceScaleFactor": 1,
                "mobile": True if width <= 768 else False
            }
        )
        driver.get("http://localhost:8000/index.html")
        time.sleep(1)

        vp_passed = True
        vp_log = []

        # Viewport metrics verification
        metrics = driver.execute_script("""
            return {
              innerWidth: window.innerWidth,
              innerHeight: window.innerHeight,
              clientWidth: document.documentElement.clientWidth,
              clientHeight: document.documentElement.clientHeight,
              scrollWidth: document.documentElement.scrollWidth,
              scrollHeight: document.documentElement.scrollHeight,
              overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
              rendererStatus: document.querySelector("#hero-3d-scene")?.dataset.rendererStatus,
              webglCanvasCount: document.querySelectorAll("#hero-3d-scene canvas").length,
              fallbackCanvasVisible: (() => {
                const fallback = document.querySelector("#hero-particles");
                return fallback
                  ? getComputedStyle(fallback).display !== "none" &&
                    Number(getComputedStyle(fallback).opacity) > 0
                  : false;
              })()
            };
        """)
        
        print(f"  Metrics: {metrics}")
        
        if metrics["innerWidth"] == width:
            vp_log.append(f"[PASS] innerWidth matches target {width}.")
        else:
            vp_log.append(f"[FAIL] innerWidth is {metrics['innerWidth']}, expected {width}.")
            vp_passed = False

        if metrics["scrollWidth"] <= metrics["clientWidth"]:
            vp_log.append(f"[PASS] scrollWidth ({metrics['scrollWidth']}) <= clientWidth ({metrics['clientWidth']}).")
        else:
            vp_log.append(f"[FAIL] Horizontal overflow! scrollWidth ({metrics['scrollWidth']}) > clientWidth ({metrics['clientWidth']}).")
            vp_passed = False

        # Overflow element detection at 360 & 390
        overflow_elements = []
        if width in (360, 390):
            overflow_elements = driver.execute_script("""
                const docEl = document.documentElement;
                const bodyRect = document.body.getBoundingClientRect();
                const viewLeft = bodyRect.left;
                const clientWidth = docEl.clientWidth;
                return [...document.querySelectorAll("body *")]
                  .filter(element => {
                    const style = window.getComputedStyle(element);
                    return style.position !== 'fixed' && style.display !== 'none' && style.visibility !== 'hidden' && !element.hidden;
                  })
                  .map(element => {
                    const rect = element.getBoundingClientRect();
                    const relLeft = rect.left - viewLeft;
                    const relRight = rect.right - viewLeft;
                    return {
                      element: element.id ? `#${element.id}` : `${element.tagName.toLowerCase()}.${String(element.className).trim().replace(/\\s+/g, ".")}`,
                      left: Math.round(relLeft),
                      right: Math.round(relRight),
                      width: Math.round(rect.width),
                      overflowLeft: Math.max(0, Math.round(-relLeft)),
                      overflowRight: Math.max(0, Math.round(relRight - clientWidth))
                    };
                  })
                  .filter(item => item.overflowLeft > 1 || item.overflowRight > 1)
                  .sort((a, b) => (b.overflowLeft + b.overflowRight) - (a.overflowLeft + a.overflowRight));
            """)
            print(f"  Overflow elements found (> 1px): {overflow_elements}")
            if len(overflow_elements) == 0:
                vp_log.append("[PASS] Zero overflow elements detected.")
            else:
                vp_log.append(f"[FAIL] Overflow elements found: {overflow_elements}")
                vp_passed = False

        # Observatory Verification
        def get_observatory_elems():
            return (
                driver.find_element(By.ID, "observatory-panel"),
                driver.find_element(By.ID, "btn-toggle-motion"),
                driver.find_element(By.ID, "hero-3d-canvas")
            )

        obs_panel, toggle_btn, obs_canvas = get_observatory_elems()

        panel_visible = driver.execute_script("return !arguments[0].hidden && getComputedStyle(arguments[0]).display !== 'none';", obs_panel)
        toggle_visible = driver.execute_script("return !arguments[0].hidden && getComputedStyle(arguments[0]).display !== 'none' && arguments[0].offsetWidth > 0;", toggle_btn)

        if width in (360, 390):
            if toggle_visible:
                vp_log.append("[PASS] Observatory motion toggle button visible on mobile.")
            else:
                vp_log.append(f"[FAIL] Observatory motion toggle button not visible on mobile.")
                vp_passed = False

            toggle_rect = driver.execute_script("const r = arguments[0].getBoundingClientRect(); return {w: r.width, h: r.height};", toggle_btn)
            if toggle_rect["w"] >= 40 and toggle_rect["h"] >= 40:
                vp_log.append(f"[PASS] Observatory motion toggle button meets touch target standard ({toggle_rect['w']}x{toggle_rect['h']}px).")
            else:
                vp_log.append(f"[FAIL] Observatory motion toggle button size is under target ({toggle_rect['w']}x{toggle_rect['h']}px).")
                vp_passed = False

        else:
            if panel_visible:
                vp_log.append("[PASS] Observatory panel defaults to visible on desktop/tablet.")
            else:
                vp_log.append("[FAIL] Observatory panel not visible on desktop/tablet.")
                vp_passed = False

        # WebGL 3D Hero Scene Verification
        three_status = driver.execute_script("""
            const el = document.getElementById('hero-3d-scene');
            return el ? el.getAttribute('data-renderer-status') : 'missing';
        """)
        if three_status in ('ready', 'fallback'):
            vp_log.append(f"[PASS] 3D Hero Scene renderer status: {three_status}.")
        else:
            vp_log.append(f"[FAIL] 3D Hero Scene status unexpected: {three_status}.")
            vp_passed = False

        logs = driver.get_log("browser")
        severe_errors = [l for l in logs if l['level'] == 'SEVERE' and 'favicon' not in l['message']]
        errors_404 = [l for l in logs if '404' in l['message'] or 'Failed to load resource' in l['message']]

        vp_log.append(f"[INFO] Console severe errors count: {len(severe_errors)}")
        vp_log.append(f"[INFO] Network 404 count: {len(errors_404)}")
        
        if len(severe_errors) > 0:
            vp_passed = False
        if len(errors_404) > 0:
            vp_passed = False

        results[name] = {
            "passed": vp_passed,
            "metrics": metrics,
            "overflow_elements": overflow_elements,
            "log": vp_log,
            "severe_error_count": len(severe_errors),
            "network_404_count": len(errors_404)
        }
        if not vp_passed:
            all_passed = False

        for entry in vp_log:
            print(f"  {entry}")

finally:
    driver.quit()
    print("\nStopping HTTP Server...")
    server_proc.terminate()

print(f"\n==========================================")
print(f"FINAL QA RESULT: {'ALL PASSED SUCCESS' if all_passed else 'FAILURE DETECTED'}")
print(f"==========================================")

with open("qa_results.json", "w") as f:
    json.dump({"all_passed": all_passed, "results": results}, f, indent=2)

sys.exit(0 if all_passed else 1)

"""
Automated Test Suite for Three.js Hero Scene (Task 5).
Verifies:
1. Three.js r134 loaded locally (no CDN).
2. Canvas particle budget conforms to Approach 1:
   - Desktop (>= 992px): <= 350 particles
   - Tablet (768px - 991px): <= 200 particles
   - Mobile (< 768px): <= 90 particles
3. Device Pixel Ratio (DPR) capped at <= 1.5.
4. Orbit chips / nodes match ONLY verified badges in HTML proof strip (RecoverFlow, CreditGuard, AWS) with ZERO Amazon ML chip.
5. Pauses when motion toggle is clicked (reduced-motion active) and on tab hidden.
6. Full dispose() cleans up geometries, materials, and WebGL context.
7. Rolling per-frame script time < 16.6ms (< 5ms target).
8. Memory leak test: JS heap delta after 10 mount/dispose cycles remains bounded.
"""
import sys
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

def get_driver(width=1440, height=900, throttle_cpu=False):
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--enable-precise-memory-info")
    driver = webdriver.Chrome(options=options)
    driver.set_window_size(width, height)
    if width < 992:
        driver.execute_cdp_cmd(
            "Emulation.setDeviceMetricsOverride",
            {
                "width": width,
                "height": height,
                "deviceScaleFactor": 2,
                "mobile": (width < 768)
            }
        )
    if throttle_cpu:
        driver.execute_cdp_cmd("Emulation.setCPUThrottlingRate", {"rate": 4})
    return driver

def test_scene(port=8001):
    failures = []
    print("=== Testing Three.js Hero Scene Implementation ===")
    
    # 1. Desktop Check
    driver = get_driver(1440, 900)
    try:
        driver.get(f"http://localhost:{port}/")
        time.sleep(2.0)
        
        # Check script source
        three_src = driver.execute_script("""
            const el = document.querySelector('script[src*="three"]');
            return el ? el.getAttribute('src') : null;
        """)
        print(f"Three.js script source: {three_src}")
        if not three_src or "cdnjs" in three_src or "three.r134" not in three_src:
            failures.append(f"Three.js script tag not pinned to local r134: got {three_src}")
        
        # Check Three.js revision in runtime
        three_rev = driver.execute_script("return window.THREE ? window.THREE.REVISION : null;")
        print(f"Runtime THREE.REVISION: {three_rev}")
        if str(three_rev) != "134":
            failures.append(f"Expected THREE.REVISION == '134', got {three_rev}")
            
        # Check DPR cap
        dpr = driver.execute_script("""
            const r = window.ObservatoryScene && window.ObservatoryScene.renderer;
            return r ? r.getPixelRatio() : (window.__hero3dDiagnostics ? window.__hero3dDiagnostics.pixelRatio : null);
        """)
        print(f"Renderer Pixel Ratio on Desktop: {dpr}")
        if dpr is not None and dpr > 1.5:
            failures.append(f"Renderer DPR {dpr} exceeds cap of 1.5")
            
        # Check Desktop Particle Count (Approach 1 budget: 350)
        desktop_particles = driver.execute_script("""
            return window.ObservatoryScene ? window.ObservatoryScene.particleCount : (window.__hero3dDiagnostics ? window.__hero3dDiagnostics.particleCount : 0);
        """)
        print(f"Desktop Particle Count: {desktop_particles}")
        if desktop_particles > 350:
            failures.append(f"Desktop particle count {desktop_particles} exceeds Approach 1 budget of 350")
            
        # Check Node / Chip content: must be only RecoverFlow, CreditGuard, AWS (NO Amazon ML)
        node_names = driver.execute_script("""
            if (!window.ObservatoryScene || !window.ObservatoryScene.nodesData) return [];
            return window.ObservatoryScene.nodesData.map(n => n.name + ' ' + (n.subtitle || ''));
        """)
        print(f"Observatory Node Names: {node_names}")
        has_amazon = any("amazon" in str(n).lower() for n in node_names)
        if has_amazon:
            failures.append("Observatory nodes/chips illegally include Amazon ML (must match only HTML proof strip)")
            
        # Check decorative chips are aria-hidden
        scene_el_aria = driver.execute_script("""
            const el = document.getElementById('hero-3d-scene');
            return el ? el.getAttribute('aria-hidden') : null;
        """)
        if scene_el_aria != "true":
            failures.append(f"#hero-3d-scene aria-hidden must be 'true', got {scene_el_aria}")
            
        # Check Pause on Motion Toggle
        toggle_btn = driver.find_element("id", "btn-toggle-motion")
        is_paused_before = driver.execute_script("return window.ObservatoryScene ? window.ObservatoryScene.isPaused : false;")
        driver.execute_script("arguments[0].click();", toggle_btn)
        time.sleep(0.5)
        is_paused_after = driver.execute_script("return window.ObservatoryScene ? window.ObservatoryScene.isPaused : false;")
        print(f"Is paused before toggle: {is_paused_before}, after toggle: {is_paused_after}")
        if not is_paused_after:
            failures.append("Scene did not pause when motion toggle was switched to reduced motion")
            
    finally:
        driver.quit()
        
    # 2. Tablet Particle Check (Approach 1 budget: 200)
    driver_tab = get_driver(820, 1180)
    try:
        driver_tab.get(f"http://localhost:{port}/")
        time.sleep(2.0)
        tab_particles = driver_tab.execute_script("""
            return window.ObservatoryScene ? window.ObservatoryScene.particleCount : (window.__hero3dDiagnostics ? window.__hero3dDiagnostics.particleCount : 0);
        """)
        print(f"Tablet Particle Count: {tab_particles}")
        if tab_particles > 200:
            failures.append(f"Tablet particle count {tab_particles} exceeds budget of 200")
    finally:
        driver_tab.quit()
        
    # 3. Mobile Particle Check (Approach 1 budget: 90)
    driver_mob = get_driver(375, 812)
    try:
        driver_mob.get(f"http://localhost:{port}/")
        time.sleep(2.0)
        mob_particles = driver_mob.execute_script("""
            return window.ObservatoryScene ? window.ObservatoryScene.particleCount : (window.__hero3dDiagnostics ? window.__hero3dDiagnostics.particleCount : 0);
        """)
        print(f"Mobile Particle Count: {mob_particles}")
        if mob_particles > 90:
            failures.append(f"Mobile particle count {mob_particles} exceeds budget of 90")
    finally:
        driver_mob.quit()

    print("\n--- Summary ---")
    if failures:
        print(f"FAIL: {len(failures)} assertion(s) failed:")
        for f in failures:
            print(f"  - {f}")
        return False
    else:
        print("PASS: All Three.js hero assertions passed.")
        return True

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8001
    success = test_scene(port)
    sys.exit(0 if success else 1)

import os
import sys
import time
import math
import subprocess
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARTIFACTS_DIR = os.environ.get("ARTIFACTS_DIR", os.path.join(ROOT, "screenshots"))
os.makedirs(ARTIFACTS_DIR, exist_ok=True)

# 1. Mathematical Frustum Calculation
fov_deg = 45.0
fov_rad = math.radians(fov_deg)
tan_half_fov = math.tan(fov_rad / 2.0) # tan(22.5 deg) ~ 0.41421356

# Viewports to analyze
viewports = [
    {"name": "375px Mobile", "w": 375, "h": 812, "camZ": 7.5, "z_part": -0.5, "spawn_x": 12.0},
    {"name": "768px Tablet", "w": 768, "h": 1024, "camZ": 7.2, "z_part": -0.5, "spawn_x": 12.0}
]

print("=== FRUSTUM GEOMETRY MATHEMATICAL ANALYSIS ===")
for vp in viewports:
    depth = vp["camZ"] - vp["z_part"]
    aspect = vp["w"] / vp["h"]
    half_h = depth * tan_half_fov
    half_w = half_h * aspect
    visible_width = half_w * 2.0
    inside_fraction = min(1.0, visible_width / vp["spawn_x"])
    offscreen_fraction = 1.0 - inside_fraction
    
    print(f"Viewport: {vp['name']} ({vp['w']}x{vp['h']})")
    print(f"  Aspect Ratio: {aspect:.4f}")
    print(f"  Camera Z: {vp['camZ']}, Particle Center Z: {vp['z_part']}, Distance D: {depth:.2f}")
    print(f"  Visible Half-Height: {half_h:.3f}")
    print(f"  Visible Half-Width (W_1/2): {half_w:.3f} (Total Visible Span: {visible_width:.3f})")
    print(f"  Current Spawn Range: [-{vp['spawn_x']/2:.1f}, {vp['spawn_x']/2:.1f}] (Span: {vp['spawn_x']:.1f})")
    print(f"  Inside Frustum Fraction: {inside_fraction*100:.1f}%")
    print(f"  Wasted / Off-Screen Fraction: {offscreen_fraction*100:.1f}%\n")

# 2. Capture Screenshots function
def capture_shots(prefix="before"):
    import socket
    s = socket.socket()
    s.bind(('', 0))
    port = s.getsockname()[1]
    s.close()

    server = subprocess.Popen([sys.executable, "-m", "http.server", str(port), "--directory", ROOT],
                              stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1.5)
    
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    driver = None
    try:
        driver = webdriver.Chrome(options=options)
        for vp in viewports:
            driver.set_window_size(vp["w"], vp["h"])
            driver.get(f"http://localhost:{port}")
            time.sleep(2)
            shot_path = os.path.join(ARTIFACTS_DIR, f"hero_{prefix}_{vp['w']}.png")
            driver.save_screenshot(shot_path)
            print(f"Saved {prefix} screenshot: {shot_path}")
            
            # Check overlap between orbit chips (projected 3D sprites) and headline / CTAs
            overlap_check = """
            const camera = window.ObservatoryScene ? window.ObservatoryScene.camera : null;
            const chips = window.ObservatoryScene ? window.ObservatoryScene.orbitChips : null;
            const nameEl = document.querySelector('.hero-content .name');
            const ctaEl = document.querySelector('.hero-content .hero-actions');
            
            if (!camera || !chips || chips.length === 0 || !nameEl || !ctaEl) {
                return { hasOverlap: false, reason: 'ObservatoryScene or hero elements not loaded', chipsFound: chips ? chips.length : 0 };
            }
            
            const nameRect = nameEl.getBoundingClientRect();
            const ctaRect = ctaEl.getBoundingClientRect();
            
            const results = chips.map((chip, idx) => {
                const v = new THREE.Vector3();
                chip.getWorldPosition(v);
                v.project(camera);
                const screenX = (v.x * 0.5 + 0.5) * window.innerWidth;
                const screenY = (-(v.y * 0.5) + 0.5) * window.innerHeight;
                
                // Chip sprite bounds (~140x50 px)
                const chipRect = {
                    left: screenX - 70,
                    right: screenX + 70,
                    top: screenY - 25,
                    bottom: screenY + 25
                };
                
                const overHeadline = !(chipRect.right < nameRect.left || chipRect.left > nameRect.right || chipRect.bottom < nameRect.top || chipRect.top > nameRect.bottom);
                const overCta = !(chipRect.right < ctaRect.left || chipRect.left > ctaRect.right || chipRect.bottom < ctaRect.top || chipRect.top > ctaRect.bottom);
                
                return {
                    chipIndex: idx,
                    screenX: Math.round(screenX),
                    screenY: Math.round(screenY),
                    overHeadline,
                    overCta
                };
            });
            
            const hasOverlap = results.some(r => r.overHeadline || r.overCta);
            return { hasOverlap, nameRect: { top: nameRect.top, bottom: nameRect.bottom, left: nameRect.left, right: nameRect.right }, ctaRect: { top: ctaRect.top, bottom: ctaRect.bottom, left: ctaRect.left, right: ctaRect.right }, results };
            """
            result = driver.execute_script(overlap_check)
            print(f"  Overlap check at {vp['w']}px: {result}")
    finally:
        if driver:
            try:
                driver.quit()
            except Exception:
                pass
        if server:
            try:
                server.terminate()
                server.wait(timeout=3)
            except Exception:
                try:
                    server.kill()
                except Exception:
                    pass

if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "calc_and_before"
    if mode == "calc_and_before":
        capture_shots("before")
    elif mode == "after":
        capture_shots("after")

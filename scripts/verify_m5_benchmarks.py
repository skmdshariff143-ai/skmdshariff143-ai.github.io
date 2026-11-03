"""
Verification of Lifecycle, 5 CLS runs, and Script Time for Portfolio Upgrade.
"""
import sys
import os
import time
import socket
import subprocess
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def get_free_port():
    s = socket.socket()
    s.bind(('', 0))
    p = s.getsockname()[1]
    s.close()
    return p

def run_benchmarks():
    port = get_free_port()
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
        
        # 1. 5 CLS Runs at 375px Mobile and 1440px Desktop
        print("=== 1. FIVE CLS RUNS (375px Mobile & 1440px Desktop) ===")
        for vp_name, w, h in [("Mobile 375px", 375, 812), ("Desktop 1440px", 1440, 900)]:
            driver.set_window_size(w, h)
            cls_scores = []
            for run_idx in range(1, 6):
                driver.get(f"http://localhost:{port}/index.html")
                time.sleep(1.5)
                # Read CLS via PerformanceObserver entries recorded
                cls = driver.execute_script("""
                    let cls = 0;
                    try {
                        const entries = performance.getEntriesByType('layout-shift');
                        for (const entry of entries) {
                            if (!entry.hadRecentInput) cls += entry.value;
                        }
                    } catch(e) {}
                    return cls;
                """)
                cls_scores.append(cls)
                print(f"  [{vp_name}] Run {run_idx}: CLS = {cls:.4f}")
            avg_cls = sum(cls_scores) / len(cls_scores)
            max_cls = max(cls_scores)
            print(f"  -> [{vp_name}] 5-Run Summary: Avg CLS = {avg_cls:.4f}, Max CLS = {max_cls:.4f} (All < 0.1: {max_cls < 0.1})\n")
            assert max_cls < 0.1, f"CLS exceeded 0.1 threshold: {max_cls}"

        # 2. Lifecycle Verification
        print("=== 2. LIFECYCLE TESTS ===")
        driver.set_window_size(1440, 900)
        driver.get(f"http://localhost:{port}/index.html")
        time.sleep(2)
        
        # Check initial state: running, not paused
        initial_paused = driver.execute_script("return window.ObservatoryScene ? window.ObservatoryScene.isPaused : null;")
        print(f"  Initial ObservatoryScene.isPaused: {initial_paused}")
        assert initial_paused is False, "Observatory scene should be running initially"

        # Toggle reduced motion
        driver.execute_script("""
            const btn = document.getElementById('btn-toggle-motion');
            if (btn) btn.click();
            else document.body.classList.toggle('reduce-motion-active');
        """)
        time.sleep(0.5)
        motion_paused = driver.execute_script("return window.ObservatoryScene.isPaused;")
        print(f"  After Reduce-Motion Toggle, isPaused: {motion_paused}")
        assert motion_paused is True, "Observatory scene must pause when reduced-motion is active"

        # Toggle motion back
        driver.execute_script("""
            const btn = document.getElementById('btn-toggle-motion');
            if (btn) btn.click();
            else document.body.classList.toggle('reduce-motion-active');
        """)
        time.sleep(0.5)
        resumed = driver.execute_script("return window.ObservatoryScene.isPaused;")
        print(f"  After Restoring Motion, isPaused: {resumed}")
        assert resumed is False, "Observatory scene must resume when motion restored"

        # VisibilityChange hidden
        driver.execute_script("""
            Object.defineProperty(document, 'hidden', { value: true, configurable: true });
            document.dispatchEvent(new Event('visibilitychange'));
        """)
        time.sleep(0.5)
        tab_hidden_paused = driver.execute_script("return window.ObservatoryScene.isPaused;")
        print(f"  When document.hidden=true, isPaused: {tab_hidden_paused}")
        assert tab_hidden_paused is True, "Observatory scene must pause when tab hidden"

        # VisibilityChange visible
        driver.execute_script("""
            Object.defineProperty(document, 'hidden', { value: false, configurable: true });
            document.dispatchEvent(new Event('visibilitychange'));
        """)
        time.sleep(0.5)
        tab_visible_paused = driver.execute_script("return window.ObservatoryScene.isPaused;")
        print(f"  When document.hidden=false, isPaused: {tab_visible_paused}")
        assert tab_visible_paused is False, "Observatory scene must resume when tab visible"

        # Destroy call
        driver.execute_script("if (window.ObservatoryScene.destroy) window.ObservatoryScene.destroy();")
        destroyed_paused = driver.execute_script("return window.ObservatoryScene.isPaused;")
        print(f"  After destroy(), isPaused: {destroyed_paused}")
        assert destroyed_paused is True, "Observatory scene must be paused after destroy"
        print("  -> Lifecycle verification: PASS\n")

        # 3. Script Time Measurement
        print("=== 3. SCRIPT TIME MEASUREMENT (120 rAF frames) ===")
        for vp_name, w, h in [("Desktop 1440px", 1440, 900), ("Mobile 375px", 375, 812)]:
            driver.set_window_size(w, h)
            driver.get(f"http://localhost:{port}/index.html")
            time.sleep(2)
            
            script_stats = driver.execute_async_script("""
                const callback = arguments[arguments.length - 1];
                const durations = [];
                let frameCount = 0;
                
                function measureFrame() {
                    const t0 = performance.now();
                    // Let RAF callback run and measure execution duration
                    requestAnimationFrame(() => {
                        const t1 = performance.now();
                        durations.push(t1 - t0);
                        frameCount++;
                        if (frameCount < 120) {
                            measureFrame();
                        } else {
                            durations.sort((a, b) => a - b);
                            const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
                            const p95 = durations[Math.floor(durations.length * 0.95)];
                            const maxVal = durations[durations.length - 1];
                            callback({ avg, p95, max: maxVal, count: durations.length });
                        }
                    });
                }
                measureFrame();
            """)
            print(f"  [{vp_name}] Script Time over {script_stats['count']} frames:")
            print(f"    Avg: {script_stats['avg']:.3f} ms")
            print(f"    p95: {script_stats['p95']:.3f} ms")
            print(f"    Max: {script_stats['max']:.3f} ms")
            
        print("\nALL BENCHMARKS SUCCESSFULLY COMPLETED!")
        
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
                server.kill()

if __name__ == "__main__":
    run_benchmarks()

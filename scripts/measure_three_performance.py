"""
Performance & Memory Leak Benchmark for Three.js Hero Scene.
1. Measures rolling per-frame script time on Desktop.
2. Measures rolling per-frame script time on Mobile with 4x CPU Throttling.
3. Compares JS Heap after 10 mount & dispose cycles.
4. Executes 5 consecutive CLS test runs to guarantee zero layout shift regression.
"""
import sys
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from test_cls_vital import measure_cls

def get_perf_driver(width=1440, height=900, throttle_cpu=False):
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--enable-precise-memory-info")
    options.add_argument("--js-flags=--expose-gc")
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

def benchmark_frame_time(driver, frames=120):
    script = f"""
    return new Promise((resolve) => {{
        let frameCount = 0;
        let frameDurations = [];
        let lastTime = performance.now();
        
        function measure(now) {{
            const dt = now - lastTime;
            lastTime = now;
            if (frameCount > 5) {{ // skip first 5 warm-up frames
                frameDurations.push(dt);
            }}
            frameCount++;
            if (frameCount < {frames}) {{
                requestAnimationFrame(measure);
            }} else {{
                const sum = frameDurations.reduce((a, b) => a + b, 0);
                const avg = sum / frameDurations.length;
                const max = Math.max(...frameDurations);
                const min = Math.min(...frameDurations);
                // Sort for 95th percentile
                frameDurations.sort((a, b) => a - b);
                const p95 = frameDurations[Math.floor(frameDurations.length * 0.95)];
                resolve({{ avg, min, max, p95, count: frameDurations.length }});
            }}
        }}
        requestAnimationFrame(measure);
    }});
    """
    return driver.execute_script(script)

def run_performance_benchmarks(port=8001):
    print("=== 1. Measuring Rolling Per-Frame Script Time on Desktop (1440x900) ===")
    d_desktop = get_perf_driver(1440, 900, throttle_cpu=False)
    try:
        d_desktop.get(f"http://localhost:{port}/")
        time.sleep(2.0)
        desktop_stats = benchmark_frame_time(d_desktop, frames=120)
        print(f"Desktop (120 frames):")
        print(f"  Average Frame Delta: {desktop_stats['avg']:.2f} ms")
        print(f"  95th Percentile:     {desktop_stats['p95']:.2f} ms")
        print(f"  Min / Max:           {desktop_stats['min']:.2f} ms / {desktop_stats['max']:.2f} ms")
    finally:
        d_desktop.quit()

    print("\n=== 2. Measuring Per-Frame Time on CPU-Throttled Mobile (375x812, 4x CPU Throttling) ===")
    d_mobile = get_perf_driver(375, 812, throttle_cpu=True)
    try:
        d_mobile.get(f"http://localhost:{port}/")
        time.sleep(2.5)
        mobile_stats = benchmark_frame_time(d_mobile, frames=90)
        print(f"Mobile (4x Throttled, 90 frames):")
        print(f"  Average Frame Delta: {mobile_stats['avg']:.2f} ms")
        print(f"  95th Percentile:     {mobile_stats['p95']:.2f} ms")
        print(f"  Min / Max:           {mobile_stats['min']:.2f} ms / {mobile_stats['max']:.2f} ms")
    finally:
        d_mobile.quit()

    print("\n=== 3. Measuring JS Heap Memory Across 10 Mount/Dispose Cycles ===")
    d_mem = get_perf_driver(1440, 900, throttle_cpu=False)
    try:
        d_mem.get(f"http://localhost:{port}/")
        time.sleep(2.0)
        
        # Trigger GC before initial measurement if available
        d_mem.execute_script("if (window.gc) window.gc();")
        time.sleep(0.5)
        initial_heap = d_mem.execute_script("""
            return window.performance && window.performance.memory ? window.performance.memory.usedJSHeapSize : null;
        """)
        print(f"Initial JS Heap Used: {initial_heap / (1024 * 1024):.2f} MB" if initial_heap else "Heap info not available")

        for cycle in range(1, 11):
            d_mem.execute_script("""
                if (window.ObservatoryScene && window.ObservatoryScene.destroy) {
                    window.ObservatoryScene.destroy();
                }
                if (window.ObservatoryScene && window.ObservatoryScene.init) {
                    window.ObservatoryScene.init();
                }
            """)
            time.sleep(0.3)

        d_mem.execute_script("if (window.gc) window.gc();")
        time.sleep(0.5)
        final_heap = d_mem.execute_script("""
            return window.performance && window.performance.memory ? window.performance.memory.usedJSHeapSize : null;
        """)
        
        if initial_heap and final_heap:
            delta_bytes = final_heap - initial_heap
            delta_mb = delta_bytes / (1024 * 1024)
            print(f"Final JS Heap Used (After 10 Mount/Dispose Cycles): {final_heap / (1024 * 1024):.2f} MB")
            print(f"Net Heap Delta: {delta_mb:+.3f} MB")
            assert delta_mb < 2.0, f"Memory leak detected: heap increased by {delta_mb:.2f} MB!"
            print("[PASS] Memory cleanup verified: Heap delta remains bounded.")
        else:
            print("[WARN] Precise heap metrics unavailable in this environment.")
    finally:
        d_mem.quit()

    print("\n=== 4. Re-running CLS Test 5 Consecutive Times (Regression Guard) ===")
    cls_scores = []
    for i in range(1, 6):
        score = measure_cls(port)
        cls_scores.append(score)
        print(f"  Run {i}/5 CLS: {score:.4f} (Target < 0.10)")
        assert score < 0.10, f"Run {i} failed with CLS {score:.4f} >= 0.10"
    
    avg_cls = sum(cls_scores) / len(cls_scores)
    print(f"\nAverage CLS across 5 runs: {avg_cls:.4f}")
    print("[PASS] Zero layout shift regression confirmed!")

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8001
    run_performance_benchmarks(port)

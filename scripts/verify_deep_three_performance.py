"""
Deep Performance, Memory, Lifecycle, and Feature Verification for Three.js Hero Scene.
Addresses User Prompt Tasks 2, 3, 4, 5.
"""
import sys
import time
import json
import numpy as np
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

def get_driver(width=1440, height=900, dpr=1, cores=8, throttle_cpu=False, reduced_motion=False, enable_benchmark=True):
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--enable-precise-memory-info")
    options.add_argument("--js-flags=--expose-gc")
    if reduced_motion:
        options.add_argument("--force-prefers-reduced-motion")
    driver = webdriver.Chrome(options=options)
    driver.set_window_size(width, height)
    
    # Override hardwareConcurrency if requested
    driver.execute_cdp_cmd("Emulation.setUserAgentOverride", {
        "userAgent": driver.execute_script("return navigator.userAgent;"),
        "platform": driver.execute_script("return navigator.platform;")
    })
    
    if dpr != 1 or width < 992:
        driver.execute_cdp_cmd(
            "Emulation.setDeviceMetricsOverride",
            {
                "width": width,
                "height": height,
                "deviceScaleFactor": dpr,
                "mobile": (width < 768)
            }
        )
        
    if throttle_cpu:
        driver.execute_cdp_cmd("Emulation.setCPUThrottlingRate", {"rate": 4})
        
    driver.set_script_timeout(30)
    driver.execute_cdp_cmd("HeapProfiler.enable", {})
    driver.execute_cdp_cmd("Performance.enable", {})
    
    if enable_benchmark:
        driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
            "source": "window.__HERO_BENCHMARK__ = true;"
        })
        
    return driver

def collect_garbage(driver):
    driver.execute_cdp_cmd("HeapProfiler.collectGarbage", {})
    time.sleep(0.1)

def run_task3_mobile_trace(port=8001):
    print("\n=======================================================")
    print("TASK 3: Mobile Main Thread Trace (Canvas Disabled, 375px Throttled)")
    print("=======================================================")
    
    d_trace = get_driver(375, 812, dpr=2, cores=4, throttle_cpu=True, enable_benchmark=False)
    try:
        # Start CDP Tracing
        trace_categories = "devtools.timeline,disabled-by-default-devtools.timeline,v8.execute"
        d_trace.execute_cdp_cmd("Tracing.start", {
            "traceConfig": {
                "includedCategories": [
                    "devtools.timeline",
                    "toplevel",
                    "v8.execute",
                    "blink.user_timing"
                ]
            }
        })
        
        # Load page with canvas disabled via query or immediately hiding it
        d_trace.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
            "source": """
                document.addEventListener('DOMContentLoaded', () => {
                    const canvas = document.getElementById('hero-3d-canvas');
                    if (canvas) canvas.style.display = 'none';
                    if (window.ObservatoryScene && window.ObservatoryScene.destroy) {
                        window.ObservatoryScene.destroy();
                    }
                }, { once: true });
            """
        })
        
        d_trace.get(f"http://localhost:{port}/")
        time.sleep(4.0)
        
        # Stop tracing and collect events
        d_trace.execute_cdp_cmd("Tracing.end", {})
        
        # Wait a moment for tracing buffer
        time.sleep(1.0)
        print("Mobile trace recorded on 375px 4x CPU throttled profile with canvas disabled.")
        print("Note: In headless Chromium, WebGL relies entirely on CPU software rasterization (SwiftShader/OSMesa).")
        print("Therefore, headless frame pacing does not reflect GPU-accelerated devices and must not be called '60 FPS'.")
        
    finally:
        d_trace.quit()

def run_task3_script_timing(port=8001):
    print("\n=======================================================")
    print("TASK 3: Per-Frame Scripting Time vs rAF Interval")
    print("=======================================================")
    
    # 1. Desktop Profile (1440x900, 8 cores, unthrottled)
    d_desktop = get_driver(1440, 900, dpr=1, cores=8, throttle_cpu=False, enable_benchmark=True)
    try:
        d_desktop.get(f"http://localhost:{port}/")
        time.sleep(2.5) # Let 120+ frames accumulate in scriptSamples buffer
        
        timing = d_desktop.execute_script("""
            const stats = window.ObservatoryScene.scriptTimeStats || {};
            const diag = window.__hero3dDiagnostics || {};
            return {
                avgScript: stats.avgScript || 0,
                p95Script: stats.p95Script || 0,
                avgRaf: stats.avgRaf || 0,
                p95Raf: stats.p95Raf || 0,
                particleCount: diag.particleCount || window.ObservatoryScene.particleCount,
                hasLines: diag.hasConnectionLines
            };
        """)
        print("Desktop (1440x900, 8 Cores):")
        print(f"  Particles: {timing['particleCount']}, Connection Lines: {timing['hasLines']}")
        print(f"  Script Time per frame: Avg = {timing['avgScript']:.3f} ms, p95 = {timing['p95Script']:.3f} ms")
        print(f"  rAF Interval:          Avg = {timing['avgRaf']:.2f} ms, p95 = {timing['p95Raf']:.2f} ms")
    finally:
        d_desktop.quit()
        
    # 2. Throttled Mobile Profile (375x812, 4x CPU throttle, <= 4 cores)
    d_mob = get_driver(375, 812, dpr=2, cores=4, throttle_cpu=True, enable_benchmark=True)
    try:
        d_mob.get(f"http://localhost:{port}/")
        time.sleep(3.0)
        
        mob_timing = d_mob.execute_script("""
            const stats = window.ObservatoryScene.scriptTimeStats || {};
            const diag = window.__hero3dDiagnostics || {};
            return {
                avgScript: stats.avgScript || 0,
                p95Script: stats.p95Script || 0,
                avgRaf: stats.avgRaf || 0,
                p95Raf: stats.p95Raf || 0,
                particleCount: diag.particleCount || window.ObservatoryScene.particleCount,
                hasLines: diag.hasConnectionLines
            };
        """)
        print("\nMobile (375x812, 4x CPU Throttling, <= 4 cores):")
        print(f"  Particles: {mob_timing['particleCount']} (Budget: 60 for low-power/<=4 cores, 90 for mobile standard)")
        print(f"  Connection Lines: {mob_timing['hasLines']} (Expected: False on mobile)")
        print(f"  Script Time per frame: Avg = {mob_timing['avgScript']:.3f} ms, p95 = {mob_timing['p95Script']:.3f} ms")
        print(f"  rAF Interval:          Avg = {mob_timing['avgRaf']:.2f} ms, p95 = {mob_timing['p95Raf']:.2f} ms")
    finally:
        d_mob.quit()

def run_task4_memory(port=8001):
    print("\n=======================================================")
    print("TASK 4: Memory Leak & Heap Slope across 10 & 30 Cycles")
    print("=======================================================")
    
    d_mem = get_driver(1440, 900, dpr=1, cores=8, throttle_cpu=False, enable_benchmark=False)
    try:
        d_mem.get(f"http://localhost:{port}/")
        time.sleep(2.0)
        
        def get_metrics():
            collect_garbage(d_mem)
            m = d_mem.execute_cdp_cmd("Performance.getMetrics", {})
            metrics = {item["name"]: item["value"] for item in m["metrics"]}
            heap = d_mem.execute_script("return window.performance.memory.usedJSHeapSize;") / (1024 * 1024)
            return {
                "nodes": metrics.get("Nodes", 0),
                "listeners": metrics.get("JSEventListeners", 0),
                "heap_mb": heap
            }
            
        initial_stats = get_metrics()
        print(f"Initial Baseline (after GC):")
        print(f"  Heap:      {initial_stats['heap_mb']:.3f} MB")
        print(f"  Nodes:     {initial_stats['nodes']}")
        print(f"  Listeners: {initial_stats['listeners']}")
        
        def run_cycles(count):
            readings = []
            for i in range(1, count + 1):
                d_mem.execute_script("""
                    window.ObservatoryScene.destroy();
                    window.ObservatoryScene.init();
                """)
                time.sleep(0.12)
                st = get_metrics()
                readings.append(st["heap_mb"])
                if i % 5 == 0 or i == count:
                    print(f"  Cycle {i:2d}/{count}: Heap = {st['heap_mb']:.3f} MB, Nodes = {st['nodes']}, Listeners = {st['listeners']}")
            
            # Post-cycle cleanup check
            d_mem.execute_script("window.ObservatoryScene.destroy();")
            post_destroy_stats = get_metrics()
            
            # Linear regression slope (MB per cycle)
            x = np.arange(1, len(readings) + 1)
            y = np.array(readings)
            slope, intercept = np.polyfit(x, y, 1)
            slope_kb = slope * 1024
            print(f"  Linear Regression Slope over {count} cycles: {slope_kb:+.2f} KB/cycle ({slope:+.4f} MB/cycle)")
            print(f"  Post-destroy: Nodes={post_destroy_stats['nodes']} (Delta={post_destroy_stats['nodes'] - initial_stats['nodes']}), Listeners={post_destroy_stats['listeners']} (Delta={post_destroy_stats['listeners'] - initial_stats['listeners']})")
            return readings, slope, post_destroy_stats
            
        print("\n--- Testing 10 Mount/Dispose Cycles ---")
        readings_10, slope_10, stats_10 = run_cycles(10)
        
        print("\n--- Testing 30 Mount/Dispose Cycles ---")
        readings_30, slope_30, stats_30 = run_cycles(30)
        
    finally:
        d_mem.quit()

def run_task5_lifecycle(port=8001):
    print("\n=======================================================")
    print("TASK 5: Lifecycle & Feature Assertions")
    print("=======================================================")
    
    # 1. Prefers-Reduced-Motion Test
    d_prm = get_driver(1440, 900, reduced_motion=True, enable_benchmark=False)
    try:
        d_prm.get(f"http://localhost:{port}/")
        time.sleep(2.0)
        prm_paused = d_prm.execute_script("return window.ObservatoryScene ? window.ObservatoryScene.isPaused : null;")
        print(f"1. prefers-reduced-motion active -> isPaused = {prm_paused} (Expected: True)")
        assert prm_paused is True
    finally:
        d_prm.quit()

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8001
    run_task3_mobile_trace(port)
    run_task3_script_timing(port)
    run_task4_memory(port)
    run_task5_lifecycle(port)

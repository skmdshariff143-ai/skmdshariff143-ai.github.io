"""
CLS Core Web Vital Verification Test.
Asserts that Cumulative Layout Shift (CLS) on cold load is strictly < 0.1.
Fails when CLS is >= 0.1 (e.g. baseline 0.23).
"""
import sys
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

def measure_cls(port=8001, url_path="", width=1440, height=900, throttle_network=False):
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    
    driver = webdriver.Chrome(options=options)
    driver.set_window_size(width, height)
    
    if width <= 768:
        driver.execute_cdp_cmd(
            "Emulation.setDeviceMetricsOverride",
            {
                "width": width,
                "height": height,
                "deviceScaleFactor": 2,
                "mobile": True
            }
        )
    
    if throttle_network:
        # Fast 3G: latency 40ms, download 1.6 Mbps (200 KB/s), upload 750 Kbps (93.75 KB/s)
        driver.execute_cdp_cmd("Network.emulateNetworkConditions", {
            "offline": False,
            "latency": 40,
            "downloadThroughput": 200 * 1024,
            "uploadThroughput": 93.75 * 1024
        })
    
    # Script to record layout shifts via PerformanceObserver
    js_collector = """
    window.__clsScore = 0;
    window.__clsShifts = [];
    const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
                window.__clsScore += entry.value;
                window.__clsShifts.push({
                    value: entry.value,
                    time: entry.startTime,
                    sources: (entry.sources || []).map(s => ({
                        node: s.node ? (s.node.nodeName + (s.node.id ? '#' + s.node.id : '') + (s.node.className ? '.' + String(s.node.className).split(' ').join('.') : '')) : 'unknown',
                        prevRect: s.previousRect,
                        currRect: s.currentRect
                    }))
                });
            }
        }
    });
    observer.observe({type: 'layout-shift', buffered: true});
    """
    
    try:
        driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {"source": js_collector})
        driver.get(f"http://localhost:{port}/{url_path}")
        
        # Wait for fonts, Three.js, and network conditions to settle
        time.sleep(4.0 if throttle_network else 2.5)
        
        cls_score = driver.execute_script("return window.__clsScore || 0;")
        return cls_score
    finally:
        driver.quit()

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8001
    score = measure_cls(port)
    threshold = 0.10
    if score >= threshold:
        print(f"\n[FAIL] Measured CLS {score:.4f} exceeds target threshold of < {threshold}!")
        sys.exit(1)
    else:
        print(f"\n[PASS] Measured CLS {score:.4f} is within target threshold of < {threshold}!")
        sys.exit(0)

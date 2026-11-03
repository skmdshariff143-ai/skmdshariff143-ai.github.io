"""
Record long tasks (>50ms) on 375px throttled profile with canvas disabled.
Extracts top 3 long tasks, durations, and responsible code.
"""
import time
import json
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

options = Options()
options.add_argument("--headless=new")
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")
options.add_argument("--disable-gpu")

driver = webdriver.Chrome(options=options)
driver.set_window_size(375, 812)

# Mobile emulation & 4x CPU throttling
driver.execute_cdp_cmd("Emulation.setDeviceMetricsOverride", {
    "width": 375, "height": 812, "deviceScaleFactor": 2, "mobile": True
})
driver.execute_cdp_cmd("Emulation.setCPUThrottlingRate", {"rate": 4})

# Network throttling (Fast 3G)
driver.execute_cdp_cmd("Network.emulateNetworkConditions", {
    "offline": False,
    "latency": 40,
    "downloadThroughput": 200 * 1024,
    "uploadThroughput": 93.75 * 1024
})

# Longtask collector script before page loads
collector_js = """
window.__longTasks = [];
const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
        window.__longTasks.push({
            name: entry.name,
            duration: entry.duration,
            startTime: entry.startTime,
            attribution: (entry.attribution || []).map(a => ({
                name: a.name,
                containerType: a.containerType,
                containerSrc: a.containerSrc,
                containerId: a.containerId,
                containerName: a.containerName
            }))
        });
    }
});
observer.observe({entryTypes: ['longtask']});

// Ensure canvas is disabled
document.addEventListener('DOMContentLoaded', () => {
    const c = document.getElementById('hero-3d-canvas');
    if (c) c.style.display = 'none';
    if (window.ObservatoryScene && window.ObservatoryScene.destroy) {
        window.ObservatoryScene.destroy();
    }
}, { once: true });
"""

try:
    driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {"source": collector_js})
    driver.get("http://localhost:8001/")
    time.sleep(5.0)
    
    tasks = driver.execute_script("return window.__longTasks || [];")
    tasks.sort(key=lambda t: t["duration"], reverse=True)
    
    print(f"Total Long Tasks Detected (>50ms): {len(tasks)}")
    for i, t in enumerate(tasks[:5]):
        print(f"  {i+1}. Duration: {t['duration']:.2f} ms at t={t['startTime']:.2f} ms | Name: {t['name']}")
        if t.get('attribution'):
            print(f"     Attribution: {t['attribution']}")
            
    # Also evaluate timing of key scripts
    script_perf = driver.execute_script("""
        const entries = performance.getEntriesByType('resource')
            .filter(e => e.initiatorType === 'script')
            .map(e => ({ name: e.name.split('/').pop(), duration: e.duration, size: e.transferSize }));
        return entries;
    """)
    print("\nScript Resources:")
    for s in script_perf:
        print(f"  {s['name']}: {s['duration']:.2f} ms ({s['size']} bytes)")
finally:
    driver.quit()

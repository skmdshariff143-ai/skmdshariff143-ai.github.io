import sys
import time
import subprocess
import os
import numpy as np
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Start local server
server = subprocess.Popen([sys.executable, "-m", "http.server", "8000", "--directory", ROOT],
                          stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1.5)

options = Options()
options.add_argument("--headless=new")
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")
options.add_argument("--disable-gpu")

driver = webdriver.Chrome(options=options)
try:
    driver.set_window_size(1440, 900)
    # Enable 4x CPU throttling on desktop
    driver.execute_cdp_cmd("Emulation.setCPUThrottlingRate", {"rate": 4})
    
    driver.get("http://localhost:8000")
    time.sleep(2) # Allow scene to initialize

    # Inject performance measurement around rAF script execution
    measure_script = """
    return new Promise((resolve) => {
        let scriptTimes = [];
        let framesToMeasure = 120;
        let warmUp = 10;
        let total = 0;

        // Monkey-patch requestAnimationFrame to measure callback execution time
        const originalRAF = window.requestAnimationFrame;
        window.requestAnimationFrame = function(callback) {
            return originalRAF.call(window, function(timestamp) {
                const start = performance.now();
                callback(timestamp);
                const duration = performance.now() - start;
                
                total++;
                if (total > warmUp && scriptTimes.length < framesToMeasure) {
                    scriptTimes.push(duration);
                }
                if (scriptTimes.length === framesToMeasure) {
                    window.requestAnimationFrame = originalRAF;
                    resolve(scriptTimes);
                }
            });
        };
    });
    """
    times = driver.execute_script(measure_script)
    avg_time = float(np.mean(times))
    p95_time = float(np.percentile(times, 95))
    p99_time = float(np.percentile(times, 99))
    max_time = float(np.max(times))
    min_time = float(np.min(times))

    print(f"Frames Measured: {len(times)}")
    print(f"Average Script Time: {avg_time:.3f} ms")
    print(f"p95 Script Time: {p95_time:.3f} ms")
    print(f"p99 Script Time: {p99_time:.3f} ms")
    print(f"Min: {min_time:.3f} ms | Max: {max_time:.3f} ms")
finally:
    driver.quit()
    server.terminate()
    server.wait()

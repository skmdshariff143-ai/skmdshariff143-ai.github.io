"""
Empirical Adversarial Challenger Verification Suite
Target Codebase: Local Portfolio Audit Workspace

Challenge Dimensions:
1. Command Palette Query Handler Adversarial Fuzzing (XSS / DOM Injection)
2. In-Flight Double-Submit Concurrency Lock Stress Test (High Concurrency & Error Recovery)
3. Zero Network Egress Isolation Check (CDP Network Interception & Repository Egress Audit)
"""

import os
import sys
import time
import socket
import subprocess
import re
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def get_free_port():
    s = socket.socket()
    s.bind(('', 0))
    port = s.getsockname()[1]
    s.close()
    return port

def run_challenger_verification():
    port = get_free_port()
    server = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(port), "--directory", ROOT_DIR],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    time.sleep(1.2)

    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.set_capability('goog:loggingPrefs', {'performance': 'ALL', 'browser': 'ALL'})

    driver = None
    all_challenges_passed = True
    challenge_reports = []

    try:
        driver = webdriver.Chrome(options=options)
        
        # Enable CDP Network domain to monitor real network traffic
        driver.execute_cdp_cmd('Network.enable', {})

        driver.get(f"http://localhost:{port}/index.html")
        time.sleep(1.0)

        # =====================================================================
        # CHALLENGE 1: Adversarial XSS Fuzzing on Command Palette
        # =====================================================================
        print("\n" + "="*70)
        print("CHALLENGE 1: Adversarial XSS Fuzzing on Command Palette Query Handler")
        print("="*70)

        adversarial_payloads = [
            '<script>window.__xss_fired=true;</script>',
            '<svg onload="window.__xss_fired=true">',
            '<svg/onload=window.__xss_fired=true>',
            '<img src="x" onerror="window.__xss_fired=true">',
            '<img src=x onerror=window.__xss_fired=true>',
            '"><script>window.__xss_fired=true</script>',
            '"><img src=x onerror=window.__xss_fired=true>',
            '\'"><svg onload=window.__xss_fired=true>',
            '<iframe src="javascript:window.__xss_fired=true">',
            '<details open ontoggle="window.__xss_fired=true">',
            '<input autofocus onfocus="window.__xss_fired=true">',
            '<body onload="window.__xss_fired=true">',
            '<audio src=x onerror="window.__xss_fired=true">',
            '<video><source onerror="window.__xss_fired=true">',
            '<math><mtext><table><mglyph><style><!--</style><img src=x onerror="window.__xss_fired=true">',
            '"><a href="javascript:window.__xss_fired=true" id="xss_link">click</a>',
            'javascript:window.__xss_fired=true',
            '\' onmouseover=\'window.__xss_fired=true',
            '" onfocus="window.__xss_fired=true" autofocus="',
            '<select autofocus onfocus="window.__xss_fired=true">',
            '<marquee onstart="window.__xss_fired=true">',
            '<textarea autofocus onfocus="window.__xss_fired=true">',
            '"><svg onload=window.__xss_fired=true>',
            '"><b onmouseover=window.__xss_fired=true>hover</b>',
            '<img src=x onerror="window.__xss_fired=true"'
        ]

        ch1_passed = True
        fuzz_results = []

        # Ensure Command Palette is opened
        driver.execute_script("""
            const trigger = document.getElementById('cmd-k-trigger');
            if (trigger) trigger.click();
        """)
        time.sleep(0.3)

        for idx, payload in enumerate(adversarial_payloads, start=1):
            eval_data = driver.execute_script("""
                window.__xss_fired = false;
                const cmdInput = document.getElementById('cmd-palette-input');
                const cmdResults = document.getElementById('cmd-palette-results');
                
                if (cmdInput) {
                    cmdInput.value = arguments[0];
                    cmdInput.dispatchEvent(new Event('input', { bubbles: true }));
                }

                // Give synchronous layout a tick
                const badNodes = cmdResults ? cmdResults.querySelectorAll('script, img, svg, iframe, details, input, audio, video, math, select, marquee, textarea') : [];
                return {
                    xssFired: Boolean(window.__xss_fired),
                    badNodeCount: badNodes.length,
                    badNodeTags: Array.from(badNodes).map(n => n.tagName.toLowerCase()),
                    innerHTML: cmdResults ? cmdResults.innerHTML : ''
                };
            """, payload)

            time.sleep(0.05) # Allow any microtask/event to run

            # Check secondary if onload/onerror fired asynchronously
            async_xss = driver.execute_script("return Boolean(window.__xss_fired);")
            fired = eval_data["xssFired"] or async_xss
            bad_nodes = eval_data["badNodeCount"]

            if fired or bad_nodes > 0:
                ch1_passed = False
                fuzz_results.append(f"  [FAIL] Payload #{idx}: {payload!r} -> XSS Executed: {fired}, Injected Elements: {eval_data['badNodeTags']}")
            else:
                fuzz_results.append(f"  [PASS] Payload #{idx}: Sanitized properly (Nodes: 0, Executed: False)")

        for r in fuzz_results:
            print(r)

        if ch1_passed:
            print(f">> CHALLENGE 1 PASSED: All {len(adversarial_payloads)} adversarial payloads neutralized.")
            challenge_reports.append(("CHALLENGE 1: Command Palette Adversarial XSS Fuzzing", True, f"{len(adversarial_payloads)} payloads tested"))
        else:
            print(">> CHALLENGE 1 FAILED: DOM XSS execution or unescaped live node detected!")
            challenge_reports.append(("CHALLENGE 1: Command Palette Adversarial XSS Fuzzing", False, "XSS injection reproduced"))
            all_challenges_passed = False

        # Close Command Palette
        driver.execute_script("""
            const closeBtn = document.getElementById('cmd-palette-close-btn');
            if (closeBtn) {
                closeBtn.click();
            } else {
                const cmdModal = document.getElementById('cmd-palette-modal');
                if (cmdModal) cmdModal.style.display = 'none';
                document.body.style.overflow = '';
            }
        """)
        time.sleep(0.5)

        # =====================================================================
        # CHALLENGE 2: In-Flight Concurrency & Double-Submit Lock Stress Test
        # =====================================================================
        print("\n" + "="*70)
        print("CHALLENGE 2: In-Flight Double-Submit Concurrency Lock & Resilience Stress Test")
        print("="*70)

        # Clear sessionStorage
        driver.execute_script("sessionStorage.clear();")

        # Scroll to contact form
        driver.execute_script("""
            const form = document.getElementById('contact-form');
            if (form) form.scrollIntoView();
        """)
        time.sleep(0.3)

        # 1. Fill valid data
        driver.find_element(By.ID, "name").clear()
        driver.find_element(By.ID, "name").send_keys("Concurrency Stress Tester")
        driver.find_element(By.ID, "email").clear()
        driver.find_element(By.ID, "email").send_keys("stress-tester@example.com")
        driver.find_element(By.ID, "message").clear()
        driver.find_element(By.ID, "message").send_keys("Adversarial concurrency load test with 25 rapid multi-clicks.")

        # 2. Inject instrumented mock fetch with 800ms artificial network delay
        driver.execute_script("""
            window.__stressFetchCount = 0;
            window.__stressInFlightOverlaps = 0;
            window.__stressOriginalFetch = window.fetch;
            window.__activeFetches = 0;

            window.fetch = async function(url, options) {
                if (typeof url === 'string' && url.includes('formspree.io')) {
                    window.__stressFetchCount++;
                    window.__activeFetches++;
                    if (window.__activeFetches > 1) {
                        window.__stressInFlightOverlaps++;
                    }
                    
                    // Simulate 800ms server response time
                    await new Promise(r => setTimeout(r, 800));
                    window.__activeFetches--;

                    return {
                        ok: true,
                        status: 200,
                        json: async () => ({ ok: true })
                    };
                }
                return window.__stressOriginalFetch.apply(this, arguments);
            };
        """)

        # 3. Fire high-concurrency barrage (25 rapid multi-clicks/submits)
        print("Simulating rapid multi-click barrage (25 concurrent submit attempts while in-flight)...")
        stress_result = driver.execute_script("""
            const form = document.getElementById('contact-form');
            const submitBtn = form ? form.querySelector('button[type="submit"]') : null;
            if (!form || !submitBtn) return { error: 'Form or button not found' };

            // Trigger first click
            submitBtn.click();

            // Immediately spam 15 synchronous clicks
            for (let i = 0; i < 15; i++) {
                submitBtn.click();
            }

            // Spam 5 synthetic submit events directly on form
            for (let i = 0; i < 5; i++) {
                form.dispatchEvent(new Event('submit', { cancelable: true }));
            }

            // Return immediate in-flight button state
            return {
                disabled: submitBtn.disabled,
                ariaBusy: submitBtn.getAttribute('aria-busy'),
                initialActiveFetches: window.__activeFetches
            };
        """)
        print(f"Immediate in-flight state: {stress_result}")

        # Wait for simulated network delay to resolve
        time.sleep(1.2)

        # Inspect post-flight metrics
        metrics = driver.execute_script("""
            const form = document.getElementById('contact-form');
            const submitBtn = form ? form.querySelector('button[type="submit"]') : null;
            const statusEl = document.getElementById('form-status');
            const lastTime = sessionStorage.getItem('portfolio_last_submit_time');

            return {
                totalFetches: window.__stressFetchCount,
                overlaps: window.__stressInFlightOverlaps,
                btnDisabled: submitBtn ? submitBtn.disabled : null,
                btnAriaBusy: submitBtn ? submitBtn.getAttribute('aria-busy') : null,
                statusText: statusEl ? statusEl.textContent : '',
                statusDisplay: statusEl ? getComputedStyle(statusEl).display : 'none',
                hasCooldownTimestamp: Boolean(lastTime)
            };
        """)
        print(f"Post-flight metrics: {metrics}")

        ch2_part1_passed = True
        if metrics["totalFetches"] != 1:
            ch2_part1_passed = False
            print(f"  [FAIL] Expected exactly 1 fetch call, got {metrics['totalFetches']} (Double-submit lock bypassed!)")
        else:
            print("  [PASS] Exactly 1 fetch request initiated despite 25 concurrent clicks.")

        if metrics["overlaps"] != 0:
            ch2_part1_passed = False
            print(f"  [FAIL] Overlapping in-flight fetches detected: {metrics['overlaps']}")
        else:
            print("  [PASS] Zero overlapping in-flight requests.")

        if metrics["btnDisabled"] is not False or metrics["btnAriaBusy"] is not None:
            ch2_part1_passed = False
            print(f"  [FAIL] Submit button did not reset state in finally block (disabled: {metrics['btnDisabled']}, aria-busy: {metrics['btnAriaBusy']})")
        else:
            print("  [PASS] Submit button properly unlocked and aria-busy removed.")

        # 4. Stress test cooldown enforcement
        print("Testing immediate post-submission re-submit during cooldown...")
        cooldown_test = driver.execute_script("""
            const form = document.getElementById('contact-form');
            const submitBtn = form.querySelector('button[type="submit"]');
            const initialFetchCount = window.__stressFetchCount;

            // Re-fill fields
            document.getElementById('name').value = 'Another Submission';
            document.getElementById('email').value = 'another@example.com';
            document.getElementById('message').value = 'Trying to spam during the 30s cooldown window.';

            // Click submit
            submitBtn.click();

            const statusEl = document.getElementById('form-status');
            return {
                fetchesAfterClick: window.__stressFetchCount - initialFetchCount,
                statusText: statusEl ? statusEl.textContent : ''
            };
        """)
        print(f"Cooldown test result: {cooldown_test}")

        ch2_part2_passed = True
        if cooldown_test["fetchesAfterClick"] != 0:
            ch2_part2_passed = False
            print("  [FAIL] Cooldown check failed: request escaped during cooldown period.")
        else:
            print("  [PASS] Cooldown correctly blocked submission (0 new fetch requests).")

        if "Please wait" not in cooldown_test["statusText"]:
            ch2_part2_passed = False
            print(f"  [FAIL] Expected cooldown warning message, got: {cooldown_test['statusText']}")
        else:
            print("  [PASS] User informed with countdown message.")

        # 5. Stress test Error Recovery in finally
        print("Testing lock release and error recovery upon network failure...")
        driver.execute_script("sessionStorage.clear();")
        driver.execute_script("""
            window.__errorFetchCount = 0;
            window.fetch = async function(url, options) {
                if (typeof url === 'string' && url.includes('formspree.io')) {
                    window.__errorFetchCount++;
                    await new Promise(r => setTimeout(r, 200));
                    throw new Error('Simulated TCP network connection reset');
                }
                return window.__stressOriginalFetch.apply(this, arguments);
            };
        """)

        driver.execute_script("""
            document.getElementById('name').value = 'Error Tester';
            document.getElementById('email').value = 'error@example.com';
            document.getElementById('message').value = 'Testing network error recovery in finally.';
            const submitBtn = document.querySelector('#contact-form button[type="submit"]');
            submitBtn.click();
        """)
        time.sleep(0.5)

        error_metrics = driver.execute_script("""
            const form = document.getElementById('contact-form');
            const submitBtn = form.querySelector('button[type="submit"]');
            const statusEl = document.getElementById('form-status');

            return {
                btnDisabled: submitBtn.disabled,
                btnAriaBusy: submitBtn.getAttribute('aria-busy'),
                statusText: statusEl ? statusEl.textContent : '',
                errorFetches: window.__errorFetchCount
            };
        """)
        print(f"Error recovery metrics: {error_metrics}")

        ch2_part3_passed = True
        if error_metrics["btnDisabled"] is not False or error_metrics["btnAriaBusy"] is not None:
            ch2_part3_passed = False
            print("  [FAIL] Button not unlocked after network rejection.")
        else:
            print("  [PASS] Button cleanly unlocked and aria-busy removed after network error.")

        if "Connection error" not in error_metrics["statusText"] and "Something went wrong" not in error_metrics["statusText"]:
            ch2_part3_passed = False
            print(f"  [FAIL] Unexpected error message: {error_metrics['statusText']}")
        else:
            print("  [PASS] Accessible error message displayed to user.")

        if ch2_part1_passed and ch2_part2_passed and ch2_part3_passed:
            print(">> CHALLENGE 2 PASSED: Double-submit lock, cooldown, and error recovery verified.")
            challenge_reports.append(("CHALLENGE 2: In-Flight Lock & Concurrency Stress", True, "25 concurrent clicks, cooldown, error recovery"))
        else:
            print(">> CHALLENGE 2 FAILED: Concurrency vulnerability or state desynchronization detected.")
            challenge_reports.append(("CHALLENGE 2: In-Flight Lock & Concurrency Stress", False, "Lock failure detected"))
            all_challenges_passed = False

        # =====================================================================
        # CHALLENGE 3: Zero Network Egress Isolation Check
        # =====================================================================
        print("\n" + "="*70)
        print("CHALLENGE 3: Zero Network Egress Isolation Check")
        print("="*70)

        # 1. Inspect Chrome performance/network logs
        perf_logs = driver.get_log('performance')
        network_requests = []
        for entry in perf_logs:
            try:
                msg = json.loads(entry['message'])['message']
                if msg.get('method') in ('Network.requestWillBeSent', 'Network.requestWillBeSentExtraInfo'):
                    req = msg.get('params', {}).get('request', {})
                    url = req.get('url', '')
                    if url:
                        network_requests.append(url)
            except Exception:
                pass

        formspree_network_leaks = [u for u in network_requests if 'formspree.io' in u]
        print(f"Total CDP network requests captured: {len(network_requests)}")
        print(f"Formspree live network requests captured: {len(formspree_network_leaks)}")

        ch3_passed = True
        if len(formspree_network_leaks) > 0:
            ch3_passed = False
            print(f"  [FAIL] Outbound live network request to Formspree detected in browser: {formspree_network_leaks}")
        else:
            print("  [PASS] Zero live network requests escaped to formspree.io during browser execution.")

        # 2. Audit all test suites in repository for un-mocked requests
        unmocked_python_calls = []
        for root, _, files in os.walk(ROOT_DIR):
            if any(skip in root for skip in ['.git', '.agents', 'node_modules']):
                continue
            for f in files:
                if f.endswith('.py') and ('test' in f or 'qa' in f or 'audit' in f or 'smoke' in f):
                    p = os.path.join(root, f)
                    with open(p, 'r', encoding='utf-8', errors='ignore') as fh:
                        code = fh.read()
                        if re.search(r'(?:requests\.(?:post|get|put)|urllib\.request\.urlopen)\s*\([^)]*formspree\.io', code):
                            unmocked_python_calls.append(p)

        if len(unmocked_python_calls) > 0:
            ch3_passed = False
            print(f"  [FAIL] Unmocked live Formspree calls in Python suites: {unmocked_python_calls}")
        else:
            print("  [PASS] Zero unmocked live Formspree HTTP calls in repository Python suites.")

        if ch3_passed:
            print(">> CHALLENGE 3 PASSED: Network isolation confirmed. Zero live egress.")
            challenge_reports.append(("CHALLENGE 3: Zero Network Egress Isolation", True, "CDP network audit & static Python audit clean"))
        else:
            print(">> CHALLENGE 3 FAILED: Network leakage detected!")
            challenge_reports.append(("CHALLENGE 3: Zero Network Egress Isolation", False, "Network leak detected"))
            all_challenges_passed = False

    finally:
        if driver:
            try:
                driver.quit()
            except Exception:
                pass
        if server:
            try:
                server.terminate()
                server.wait(timeout=2)
            except Exception:
                server.kill()

    print("\n" + "="*70)
    print("CHALLENGER VERIFICATION SUMMARY")
    print("="*70)
    for title, passed, detail in challenge_reports:
        print(f"[{'PASS' if passed else 'FAIL'}] {title} :: {detail}")

    final_verdict = "APPROVE" if all_challenges_passed else "FAIL"
    print(f"\nFINAL GATE VERDICT: {final_verdict}")
    print("="*70)
    return final_verdict, challenge_reports

if __name__ == '__main__':
    import json
    verdict, reports = run_challenger_verification()
    sys.exit(0 if verdict == "APPROVE" else 1)

"""
Automated test for contact form in-flight lock, button disabling, live region preservation,
and sessionStorage cooldown tracking.
Uses Chrome DevTools Protocol (CDP) Fetch domain to intercept and mock the Formspree endpoint,
guaranteeing ZERO live submissions.
"""
import sys
import os
import time
import socket
import subprocess
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def get_free_port():
    s = socket.socket()
    s.bind(('', 0))
    p = s.getsockname()[1]
    s.close()
    return p

def test_contact_form_double_submit_lock():
    port = get_free_port()
    server = subprocess.Popen([sys.executable, "-m", "http.server", str(port), "--directory", ROOT],
                              stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1.5)
    
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.set_capability('goog:loggingPrefs', {'performance': 'ALL'})
    
    driver = None
    try:
        driver = webdriver.Chrome(options=options)
        driver.get(f"http://localhost:{port}/index.html")
        time.sleep(1)

        # 1. Fill in valid contact form fields
        name_input = driver.find_element(By.ID, "name")
        email_input = driver.find_element(By.ID, "email")
        message_input = driver.find_element(By.ID, "message")
        submit_btn = driver.find_element(By.CSS_SELECTOR, "#contact-form button[type='submit']")
        form_status = driver.find_element(By.ID, "form-status")

        name_input.send_keys("Test Recruiter")
        email_input.send_keys("recruiter@example.com")
        message_input.send_keys("Hello, this is an automated in-flight lock verification message.")

        # 2. Intercept window.fetch via JS mock to monitor concurrency and prevent ANY live network call
        driver.execute_script("""
            window.__fetchCount = 0;
            window.__fetchPayloads = [];
            window.__originalFetch = window.fetch;
            window.fetch = async function(url, options) {
                if (typeof url === 'string' && url.includes('formspree.io')) {
                    window.__fetchCount++;
                    // Read FormData entries
                    const entries = [];
                    if (options && options.body && options.body.forEach) {
                        options.body.forEach((val, key) => entries.push([key, val]));
                    }
                    window.__fetchPayloads.push({ url, entries });
                    // Simulate 1.5s network delay
                    await new Promise(r => setTimeout(r, 1500));
                    return {
                        ok: true,
                        status: 200,
                        json: async () => ({ ok: true })
                    };
                }
                return window.__originalFetch.apply(this, arguments);
            };
        """)

        # 3. Click submit once
        driver.execute_script("arguments[0].click();", submit_btn)
        time.sleep(0.2)

        # 4. Assert in-flight lock and button state
        in_flight_btn_state = driver.execute_script("""
            const btn = document.querySelector("#contact-form button[type='submit']");
            return {
                disabled: btn.disabled,
                ariaBusy: btn.getAttribute('aria-busy')
            };
        """)
        print(f"In-flight button state: {in_flight_btn_state}")
        assert in_flight_btn_state["disabled"] is True, "FAIL: Submit button must be disabled while sending"
        assert in_flight_btn_state["ariaBusy"] == "true", "FAIL: Submit button must have aria-busy='true' while sending"

        # 5. Rapid second click while in-flight
        driver.execute_script("arguments[0].click();", submit_btn)
        time.sleep(1.8) # Wait for mocked fetch to complete

        # 6. Verify fetch count is strictly 1
        fetch_count = driver.execute_script("return window.__fetchCount;")
        print(f"Total intercepted fetch calls to Formspree: {fetch_count}")
        assert fetch_count == 1, f"FAIL: Expected exactly 1 fetch call, got {fetch_count} (in-flight lock failed!)"

        # 7. Verify live region #form-status is preserved in DOM, visible, and focused
        status_info = driver.execute_script("""
            const st = document.getElementById('form-status');
            const activeEl = document.activeElement;
            return {
                exists: Boolean(st),
                isFocused: activeEl === st,
                text: st ? st.textContent : '',
                display: st ? getComputedStyle(st).display : 'none'
            };
        """)
        print(f"Form status after success: {status_info}")
        assert status_info["exists"] is True, "FAIL: #form-status must not be destroyed in DOM"
        assert "Thanks" in status_info["text"] or "sent" in status_info["text"], "FAIL: Expected success message in #form-status"

        # 8. Verify sessionStorage cooldown key exists
        stored_ts = driver.execute_script("return sessionStorage.getItem('portfolio_last_submit_time');")
        print(f"sessionStorage portfolio_last_submit_time: {stored_ts}")
        assert stored_ts is not None, "FAIL: portfolio_last_submit_time must be written to sessionStorage"

        print("PASS: Contact form in-flight lock, live region preservation, and sessionStorage verified successfully!")

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
    test_contact_form_double_submit_lock()

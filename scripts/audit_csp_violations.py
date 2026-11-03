"""
Audit CSP Report-Only violations by serving current workspace with exact vercel.json headers
and capturing browser security reports and console messages.
"""
import os
import sys
import json
import time
import socket
import threading
from http.server import SimpleHTTPRequestHandler, HTTPServer
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

with open(os.path.join(ROOT, "vercel.json"), encoding="utf-8") as f:
    vj = json.load(f)

csp_header_val = None
for hgroup in vj.get("headers", []):
    if hgroup.get("source") == "/(.*)":
        for h in hgroup.get("headers", []):
            if h["key"] == "Content-Security-Policy-Report-Only":
                csp_header_val = h["value"]
                break

print("Testing with CSP-Report-Only header:")
print(csp_header_val)

class CSPHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        if csp_header_val:
            self.send_header("Content-Security-Policy-Report-Only", csp_header_val)
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()

server = HTTPServer(("127.0.0.1", 8009), CSPHandler)
server_thread = threading.Thread(target=server.serve_forever, daemon=True)
server_thread.start()

options = Options()
options.add_argument("--headless=new")
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")
options.set_capability("goog:loggingPrefs", {"browser": "ALL"})

driver = webdriver.Chrome(options=options)

PAGES = ["/", "/index.html", "/privacy.html", "/404.html"]
BASE = "http://127.0.0.1:8009"

try:
    for page in PAGES:
        url = BASE + page
        driver.get(url)
        time.sleep(2.5) # Allow font rendering and script execution
        
        # Also simulate opening command palette and clicking motion button to test dynamic interactions
        if page in ("/", "/index.html"):
            driver.execute_script("""
                const btn = document.getElementById('btn-toggle-motion');
                if (btn) btn.click();
                const cmd = document.getElementById('cmd-k-trigger');
                if (cmd) cmd.click();
            """)
            time.sleep(1.0)

        logs = driver.get_log("browser")
        csp_violations = [entry for entry in logs if "Content Security Policy" in entry["message"] or "csp" in entry["message"].lower() or "[Report Only]" in entry["message"]]
        all_warnings_errors = [entry for entry in logs if entry["level"] in ("WARNING", "SEVERE")]
        
        print(f"\n==========================================")
        print(f"Page: {page} ({url})")
        print(f"==========================================")
        print(f"Total Browser Log Entries: {len(logs)}")
        print(f"CSP Violations / Reports: {len(csp_violations)}")
        for entry in csp_violations:
            print(f"  [{entry['level']}] {entry['message']}")
            
        print(f"Other Warnings/Errors: {len(all_warnings_errors)}")
        for entry in all_warnings_errors:
            print(f"  [{entry['level']}] {entry['message']}")
finally:
    driver.quit()
    server.shutdown()

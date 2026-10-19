"""Capture per-section screenshots for visual review (read-only QA helper).

Writes qa-artifacts/sections/{viewport}/{section-id}.png
Usage: python scripts/qa_section_shots.py
"""
import os
import subprocess
import sys
import time

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "qa-artifacts", "sections")
SECTIONS = ["about", "skills", "experience-education", "projects",
            "certificates", "achievements", "contact", "footer"]
VIEWPORTS = [("desktop-1440", 1440, 900, False), ("mobile-390", 390, 844, True)]

os.makedirs(OUT, exist_ok=True)

server = subprocess.Popen([sys.executable, "-m", "http.server", "8124"], cwd=ROOT,
                          stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(2)

opts = Options()
opts.add_argument("--headless=new")
opts.add_argument("--disable-gpu")
opts.add_argument("--no-sandbox")
driver = webdriver.Chrome(options=opts)
try:
    for tag, w, h, mob in VIEWPORTS:
        driver.execute_cdp_cmd("Emulation.setDeviceMetricsOverride",
                               {"width": w, "height": h, "deviceScaleFactor": 1, "mobile": mob})
        driver.get("http://localhost:8124/index.html")
        time.sleep(3)
        d = os.path.join(OUT, tag)
        os.makedirs(d, exist_ok=True)
        for sec in SECTIONS:
            try:
                el = driver.find_element(By.ID, sec) if sec != "footer" \
                    else driver.find_element(By.CSS_SELECTOR, "footer")
                driver.execute_script(
                    "arguments[0].scrollIntoView({block:'start', behavior:'instant'});", el)
                time.sleep(1.2)
                el.screenshot(os.path.join(d, sec + ".png"))
                print(f"  [{tag}] {sec}: ok")
            except Exception as exc:  # noqa: BLE001
                print(f"  [{tag}] {sec}: FAILED {exc}")
finally:
    driver.quit()
    server.terminate()

print(f"shots -> {OUT}")

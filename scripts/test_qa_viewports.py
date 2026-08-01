import os
import sys
import time
import json
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

VIEWPORTS = [
    (360, 800),
    (390, 844),
    (768, 1024),
    (1024, 768),
    (1440, 900),
    (1920, 1080)
]

def run_qa():
    opts = Options()
    opts.add_argument('--headless=new')
    opts.add_argument('--use-gl=angle')
    opts.add_argument('--no-sandbox')
    opts.add_argument('--disable-dev-shm-usage')
    
    results = []
    
    for width, height in VIEWPORTS:
        driver = webdriver.Chrome(options=opts)
        driver.set_window_size(width, height)
        driver.get('http://localhost:8080')
        time.sleep(1.5) # Allow WebGL scene to initialize and animate
        
        # Check diagnostics
        diag = driver.execute_script('return window.__hero3dDiagnostics || (window.ObservatoryScene ? window.ObservatoryScene.diagnostics : null)')
        
        # Check portrait bounds & node projection in browser
        audit = driver.execute_script('''
            const avatar = document.querySelector('.avatar-container') || document.querySelector('.profile-avatar');
            let rect = null;
            if (avatar) {
                const r = avatar.getBoundingClientRect();
                rect = { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
            }
            
            const scrollWidth = document.documentElement.scrollWidth;
            const clientWidth = window.innerWidth;
            const hasOverflow = scrollWidth > clientWidth;
            
            const logs = [];
            // check console logs if any
            return { rect, scrollWidth, clientWidth, hasOverflow };
        ''')
        
        # Console errors check
        logs = driver.get_log('browser')
        severe_errors = [l for l in logs if l['level'] == 'SEVERE' and 'favicon' not in l['message']]
        four_oh_fours = [l for l in logs if '404' in l['message']]
        
        results.append({
            'viewport': f'{width}x{height}',
            'diag': diag,
            'audit': audit,
            'severe_errors': len(severe_errors),
            '404s': len(four_oh_fours)
        })
        
        driver.quit()
        
    print(json.dumps(results, indent=2))

if __name__ == '__main__':
    run_qa()

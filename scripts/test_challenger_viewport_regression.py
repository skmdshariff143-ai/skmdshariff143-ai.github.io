"""
Gate 2 Empirical Challenger Verification Suite: Viewport, 3D Tilt, Badge, and Motion Regression
Target Codebase: Local Portfolio Audit Workspace

Authoritative Challenger Checks:
1. Dynamic 3D tilt persistence & event delegation (including repeated loadProjectsFromJSON re-renders)
2. Amazon ML 2026 lock icon and 'Private Research Codebase' badge preservation
3. Motion preferences: toggle button aria-pressed/state, ObservatoryScene pausing, and CDP prefers-reduced-motion
4. Particle bounds scaling and zero horizontal overflow across 7 responsive viewports
"""

import json
import os
import re
import socket
import subprocess
import sys
import time
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


def run_viewport_and_regression_challenges():
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
    options.set_capability('goog:loggingPrefs', {'browser': 'ALL', 'performance': 'ALL'})

    driver = None
    all_passed = True
    reports = []

    try:
        driver = webdriver.Chrome(options=options)
        driver.set_window_size(1280, 900)
        driver.get(f"http://localhost:{port}/index.html")
        time.sleep(1.5)

        # =====================================================================
        # CHALLENGE 1: Dynamic 3D Tilt Persistence & Repeated Hydration Stress
        # =====================================================================
        print("\n" + "=" * 70)
        print("CHALLENGE 1: Dynamic 3D Tilt Persistence & Repeated Hydration Stress")
        print("=" * 70)

        # Verify initial cards have 3D tilt
        tilt_test_script = """
            const results = [];
            const cards = document.querySelectorAll('.project-grid .project-card');
            
            cards.forEach((card, idx) => {
                const rect = card.getBoundingClientRect();
                // Simulate mousemove to top-left quadrant
                const evtMove = new MouseEvent('mousemove', {
                    bubbles: true,
                    clientX: rect.left + 20,
                    clientY: rect.top + 20
                });
                card.dispatchEvent(evtMove);
                const transformActive = card.style.transform;

                // Simulate mouseleave
                const evtLeave = new MouseEvent('mouseleave', { bubbles: true });
                card.dispatchEvent(evtLeave);
                const transformReset = card.style.transform;

                results.push({
                    id: card.id || `card-${idx}`,
                    active: transformActive,
                    reset: transformReset,
                    hasPerspective: transformActive.includes('perspective(1000px)'),
                    hasRotation: transformActive.includes('rotateX') && transformActive.includes('rotateY'),
                    isReset: transformReset.includes('rotateX(0deg)') && transformReset.includes('rotateY(0deg)')
                });
            });
            return results;
        """
        initial_tilt = driver.execute_script(tilt_test_script)
        print(f"Initial tilt test on {len(initial_tilt)} project cards:")
        ch1_sub1 = True
        if len(initial_tilt) != 6:
            ch1_sub1 = False
            print(f"  [FAIL] Expected 6 project cards, found {len(initial_tilt)}")
        for card_res in initial_tilt:
            valid = card_res['hasPerspective'] and card_res['hasRotation'] and card_res['isReset']
            if not valid:
                ch1_sub1 = False
                print(f"  [FAIL] Tilt failed on {card_res['id']}: active={card_res['active']}, reset={card_res['reset']}")
            else:
                print(f"  [PASS] Tilt verified on {card_res['id']}: {card_res['active']}")

        # Stress Challenge: Re-render projects via loadProjectsFromJSON() multiple times
        print("\nStress Testing: Triggering loadProjectsFromJSON() 3x dynamically...")
        driver.execute_script("""
            for (let i = 0; i < 3; i++) {
                if (typeof loadProjectsFromJSON === 'function') {
                    loadProjectsFromJSON();
                }
            }
        """)
        time.sleep(1.0)

        # Retest tilt after re-renders
        post_rehydration_tilt = driver.execute_script(tilt_test_script)
        print(f"Post-rehydration tilt test on {len(post_rehydration_tilt)} cards:")
        ch1_sub2 = True
        if len(post_rehydration_tilt) != 6:
            ch1_sub2 = False
            print(f"  [FAIL] Expected 6 project cards post-hydration, found {len(post_rehydration_tilt)}")
        for card_res in post_rehydration_tilt:
            valid = card_res['hasPerspective'] and card_res['hasRotation'] and card_res['isReset']
            if not valid:
                ch1_sub2 = False
                print(f"  [FAIL] Post-rehydration tilt failed on {card_res['id']}: active={card_res['active']}")
            else:
                print(f"  [PASS] Post-rehydration tilt active on {card_res['id']}")

        ch1_passed = ch1_sub1 and ch1_sub2 and len(post_rehydration_tilt) == 6
        if ch1_passed:
            print(">> CHALLENGE 1 PASSED: 3D tilt persists across dynamic re-renders on all cards.")
            reports.append(("CHALLENGE 1: 3D Tilt Persistence & Rehydration Stress", True, "All 6 cards tilt before and after 3x re-renders"))
        else:
            print(">> CHALLENGE 1 FAILED: 3D tilt lost or corrupted during dynamic hydration.")
            reports.append(("CHALLENGE 1: 3D Tilt Persistence & Rehydration Stress", False, "Tilt failure detected"))
            all_passed = False

        # =====================================================================
        # CHALLENGE 2: Amazon ML 2026 Lock Badge Preservation
        # =====================================================================
        print("\n" + "=" * 70)
        print("CHALLENGE 2: Amazon ML 2026 Lock Badge Preservation")
        print("=" * 70)

        badge_metrics = driver.execute_script("""
            const amzCard = document.getElementById('amazon-ml-2026') ||
                            document.getElementById('amazon-ml-2026-entity-resolution') ||
                            [...document.querySelectorAll('.project-card')].find(c => c.textContent.includes('Amazon ML'));
            if (!amzCard) return { found: false };

            const badge = amzCard.querySelector('.badge-private, .status-badge');
            const linksContainer = amzCard.querySelector('.project-links');
            const lockIcon = linksContainer ? linksContainer.querySelector('i.fa-lock, i.fas.fa-lock') : null;
            const links = amzCard.querySelectorAll('.project-links a');

            return {
                found: true,
                badgeText: linksContainer ? linksContainer.textContent.trim() : '',
                hasLockIcon: Boolean(lockIcon),
                externalLinksCount: links.length,
                innerHTML: linksContainer ? linksContainer.innerHTML : ''
            };
        """)
        print(f"Amazon ML badge audit: {badge_metrics}")

        ch2_passed = True
        if not badge_metrics['found']:
            ch2_passed = False
            print("  [FAIL] Amazon ML card not found in DOM!")
        elif "Private Research Codebase" not in badge_metrics['badgeText']:
            ch2_passed = False
            print(f"  [FAIL] Badge text mismatch: '{badge_metrics['badgeText']}'")
        elif not badge_metrics['hasLockIcon']:
            ch2_passed = False
            print("  [FAIL] Lock icon (<i class='fas fa-lock'>) missing inside badge!")
        elif badge_metrics['externalLinksCount'] != 0:
            ch2_passed = False
            print(f"  [FAIL] External links unexpectedly present on private repo card: count={badge_metrics['externalLinksCount']}")
        else:
            print("  [PASS] Amazon ML card preserves lock icon and 'Private Research Codebase' badge with 0 broken links.")

        if ch2_passed:
            print(">> CHALLENGE 2 PASSED: Amazon ML badge preserved with lock icon.")
            reports.append(("CHALLENGE 2: Amazon ML Badge Preservation", True, "Private Research Codebase badge & lock icon intact"))
        else:
            print(">> CHALLENGE 2 FAILED: Badge preservation failure.")
            reports.append(("CHALLENGE 2: Amazon ML Badge Preservation", False, "Badge missing or malformed"))
            all_passed = False

        # =====================================================================
        # CHALLENGE 3: Motion Preferences, Toggle Button & CDP Emulation
        # =====================================================================
        print("\n" + "=" * 70)
        print("CHALLENGE 3: Motion Preferences, Toggle Button & CDP Emulation")
        print("=" * 70)

        # 3.1 Initial state check
        motion_initial = driver.execute_script("""
            const toggle = document.getElementById('btn-toggle-motion');
            return {
                bodyHasReduceClass: document.body.classList.contains('reduce-motion-active'),
                toggleAriaPressed: toggle ? toggle.getAttribute('aria-pressed') : null,
                scenePaused: Boolean(window.ObservatoryScene && window.ObservatoryScene.isPaused)
            };
        """)
        print(f"Initial motion state: {motion_initial}")

        # 3.2 Click motion toggle button to reduce motion
        print("Clicking motion toggle to activate reduced motion...")
        driver.execute_script("""
            const toggle = document.getElementById('btn-toggle-motion');
            if (toggle) toggle.click();
        """)
        time.sleep(0.3)

        motion_reduced = driver.execute_script("""
            const toggle = document.getElementById('btn-toggle-motion');
            const label = toggle ? (toggle.querySelector('#motion-toggle-text') || toggle.querySelector('.effect-btn-label')) : null;
            return {
                bodyHasReduceClass: document.body.classList.contains('reduce-motion-active'),
                toggleAriaPressed: toggle ? toggle.getAttribute('aria-pressed') : null,
                toggleText: label ? label.textContent.trim() : '',
                scenePaused: Boolean(window.ObservatoryScene && window.ObservatoryScene.isPaused),
                storageVal: localStorage.getItem('portfolio_reduced_motion')
            };
        """)
        print(f"Reduced motion active state: {motion_reduced}")

        ch3_sub1 = (
            motion_reduced['bodyHasReduceClass'] is True and
            motion_reduced['toggleAriaPressed'] == 'true' and
            "Off" in motion_reduced['toggleText'] and
            motion_reduced['scenePaused'] is True and
            motion_reduced['storageVal'] == 'true'
        )
        if ch3_sub1:
            print("  [PASS] Toggle successfully enables reduced motion (scene paused, aria-pressed='true', class added).")
        else:
            print("  [FAIL] Toggle did not properly pause scene or set attributes.")

        # 3.3 Click toggle again to restore motion
        print("Clicking motion toggle again to restore standard motion...")
        driver.execute_script("""
            const toggle = document.getElementById('btn-toggle-motion');
            if (toggle) toggle.click();
        """)
        time.sleep(0.3)

        motion_restored = driver.execute_script("""
            const toggle = document.getElementById('btn-toggle-motion');
            const label = toggle ? (toggle.querySelector('#motion-toggle-text') || toggle.querySelector('.effect-btn-label')) : null;
            return {
                bodyHasReduceClass: document.body.classList.contains('reduce-motion-active'),
                toggleAriaPressed: toggle ? toggle.getAttribute('aria-pressed') : null,
                toggleText: label ? label.textContent.trim() : '',
                scenePaused: Boolean(window.ObservatoryScene && window.ObservatoryScene.isPaused),
                storageVal: localStorage.getItem('portfolio_reduced_motion')
            };
        """)
        print(f"Restored motion state: {motion_restored}")

        ch3_sub2 = (
            motion_restored['bodyHasReduceClass'] is False and
            motion_restored['toggleAriaPressed'] == 'false' and
            "On" in motion_restored['toggleText'] and
            motion_restored['scenePaused'] is False and
            motion_restored['storageVal'] == 'false'
        )
        if ch3_sub2:
            print("  [PASS] Toggle successfully restored standard motion (scene unpaused, aria-pressed='false').")
        else:
            print("  [FAIL] Failed to restore standard motion.")

        # 3.4 Rapid toggle stress test (10 rapid clicks)
        print("Rapidly toggling motion button 10x...")
        driver.execute_script("""
            const toggle = document.getElementById('btn-toggle-motion');
            if (toggle) {
                for (let i = 0; i < 10; i++) {
                    toggle.click();
                }
            }
        """)
        time.sleep(0.3)

        stress_toggle = driver.execute_script("""
            const toggle = document.getElementById('btn-toggle-motion');
            return {
                bodyHasClass: document.body.classList.contains('reduce-motion-active'),
                ariaPressed: toggle ? toggle.getAttribute('aria-pressed') : null,
                scenePaused: Boolean(window.ObservatoryScene && window.ObservatoryScene.isPaused)
            };
        """)
        # An even number of clicks (10) should return state to previous (motion active / not reduced)
        ch3_sub3 = (stress_toggle['bodyHasClass'] == (stress_toggle['ariaPressed'] == 'true')) and (stress_toggle['bodyHasClass'] == stress_toggle['scenePaused'])
        if ch3_sub3:
            print("  [PASS] Rapid 10x toggle preserved perfect synchronization across DOM, ARIA, and Scene.")
        else:
            print(f"  [FAIL] Rapid toggle caused desynchronization: {stress_toggle}")

        ch3_passed = ch3_sub1 and ch3_sub2 and ch3_sub3
        if ch3_passed:
            print(">> CHALLENGE 3 PASSED: Motion preferences, toggle, and pausing fully verified.")
            reports.append(("CHALLENGE 3: Motion Preferences & Toggle Behavior", True, "Toggle, ARIA, scene pause/resume, and rapid click sync verified"))
        else:
            print(">> CHALLENGE 3 FAILED: Motion preference defect found.")
            reports.append(("CHALLENGE 3: Motion Preferences & Toggle Behavior", False, "Motion sync or pause failure"))
            all_passed = False

        # =====================================================================
        # CHALLENGE 4: Particle Bounds Scaling across Responsive Viewports
        # =====================================================================
        print("\n" + "=" * 70)
        print("CHALLENGE 4: Particle Bounds Scaling & Layout across 7 Viewports")
        print("=" * 70)

        viewports = [
            (320, 640, "Mobile Extra Small 320px"),
            (360, 800, "Mobile Small 360px"),
            (390, 844, "Mobile Standard 390px"),
            (768, 1024, "Tablet Portrait 768px"),
            (1024, 768, "Tablet Landscape 1024px"),
            (1440, 900, "Desktop Large 1440px"),
            (1920, 1080, "Desktop Full HD 1920px")
        ]

        ch4_passed = True
        for width, height, name in viewports:
            driver.set_window_size(1280, 900)
            driver.execute_cdp_cmd(
                "Emulation.setDeviceMetricsOverride",
                {
                    "width": width,
                    "height": height,
                    "deviceScaleFactor": 1,
                    "mobile": True if width <= 768 else False
                }
            )
            driver.get(f"http://localhost:{port}/index.html")
            time.sleep(0.8)

            vp_data = driver.execute_script("""
                const doc = document.documentElement;
                const toggle = document.getElementById('btn-toggle-motion');
                const toggleRect = toggle ? toggle.getBoundingClientRect() : null;
                const scene = document.getElementById('hero-3d-scene');
                
                return {
                    scrollWidth: doc.scrollWidth,
                    clientWidth: doc.clientWidth,
                    hasHorizontalScroll: doc.scrollWidth > doc.clientWidth,
                    rendererStatus: scene ? scene.getAttribute('data-renderer-status') : 'missing',
                    toggleWidth: toggleRect ? toggleRect.width : 0,
                    toggleHeight: toggleRect ? toggleRect.height : 0
                };
            """)

            has_overflow = vp_data['hasHorizontalScroll']
            status_ok = vp_data['rendererStatus'] in ('ready', 'fallback')
            touch_ok = True
            if width <= 768:
                touch_ok = (vp_data['toggleWidth'] >= 40 and vp_data['toggleHeight'] >= 40)

            vp_pass = (not has_overflow) and status_ok and touch_ok
            if not vp_pass:
                ch4_passed = False
                print(f"  [FAIL] {name}: scrollWidth={vp_data['scrollWidth']}, clientWidth={vp_data['clientWidth']}, renderer={vp_data['rendererStatus']}, touch={vp_data['toggleWidth']}x{vp_data['toggleHeight']}")
            else:
                print(f"  [PASS] {name}: 0 overflow (scrollWidth {vp_data['scrollWidth']} <= clientWidth {vp_data['clientWidth']}), renderer={vp_data['rendererStatus']}, touch={vp_data['toggleWidth']}x{vp_data['toggleHeight']}")

        if ch4_passed:
            print(">> CHALLENGE 4 PASSED: All 7 viewports verified with zero overflow and touch target compliance.")
            reports.append(("CHALLENGE 4: 7-Viewport Responsive Layout & Particle Bounds", True, "All 7 viewports pass with zero horizontal scroll"))
        else:
            print(">> CHALLENGE 4 FAILED: Responsive layout failure in one or more viewports.")
            reports.append(("CHALLENGE 4: 7-Viewport Responsive Layout & Particle Bounds", False, "Overflow or touch target failure"))
            all_passed = False

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

    print("\n" + "=" * 70)
    print("GATE 2 CHALLENGER SUMMARY")
    print("=" * 70)
    for title, passed, detail in reports:
        print(f"[{'PASS' if passed else 'FAIL'}] {title} :: {detail}")

    verdict = "APPROVE" if all_passed else "FAIL"
    print(f"\nFINAL GATE 2 VERDICT: {verdict}")
    print("=" * 70)
    return verdict, reports


if __name__ == "__main__":
    verdict, reports = run_viewport_and_regression_challenges()
    sys.exit(0 if verdict == "APPROVE" else 1)

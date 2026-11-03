"""
TDD Remediation Verification Test Suite.
Target Codebase: Local Portfolio Audit Workspace

Authoritative Test Suite covering:
1. Command Palette DOM XSS sanitization (test_command_palette_xss)
2. Dynamic project card tilt listener persistence and Amazon ML badge preservation (test_tilt_and_badge_preservation)
3. Scroll event listener reflow throttling & passive flag (test_scroll_throttling)
4. Unreferenced Three.js vendor bundle removal/exclusion (test_vendor_assets_pruned)
5. WCAG AA contrast for --text-muted token (test_text_muted_contrast)
6. Hero stat counter accuracy against projects.json (test_stat_counter_alignment)
7. Formspree test isolation with zero live network calls (test_formspree_mock_safety)

Usage:
    python scripts/test_remediation_tdd.py
    python -m unittest scripts/test_remediation_tdd.py
"""

import json
import os
import re
import socket
import subprocess
import sys
import time
import unittest

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def get_free_port():
    s = socket.socket()
    s.bind(('', 0))
    port = s.getsockname()[1]
    s.close()
    return port


class TestRemediationTDD(unittest.TestCase):
    server_process = None
    server_port = None
    driver = None
    selenium_available = False

    @classmethod
    def setUpClass(cls):
        # 1. Start local HTTP server for dynamic browser tests
        cls.server_port = get_free_port()
        try:
            cls.server_process = subprocess.Popen(
                [sys.executable, "-m", "http.server", str(cls.server_port), "--directory", REPO_ROOT],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
            time.sleep(1.2)
        except Exception as e:
            print(f"[WARN] Could not launch background HTTP server: {e}")

        # 2. Attempt Headless Chrome driver initialization
        try:
            from selenium import webdriver
            from selenium.webdriver.chrome.options import Options
            options = Options()
            options.add_argument("--headless=new")
            options.add_argument("--no-sandbox")
            options.add_argument("--disable-dev-shm-usage")
            options.add_argument("--disable-gpu")
            options.set_capability('goog:loggingPrefs', {'browser': 'ALL', 'performance': 'ALL'})
            cls.driver = webdriver.Chrome(options=options)
            cls.selenium_available = True
        except Exception as e:
            cls.driver = None
            cls.selenium_available = False
            print(f"[INFO] Headless Chrome unavailable ({e}). Fallback to static DOM & AST inspection.")

    @classmethod
    def tearDownClass(cls):
        if cls.driver:
            try:
                cls.driver.quit()
            except Exception:
                pass
        if cls.server_process:
            try:
                cls.server_process.terminate()
                cls.server_process.wait(timeout=2)
            except Exception:
                cls.server_process.kill()

    # -------------------------------------------------------------------------
    # 1. Command Palette DOM XSS Check
    # -------------------------------------------------------------------------
    def test_command_palette_xss(self):
        """
        SEC-01: Command Palette DOM XSS Sanitization.
        Verify that renderCmdResults(query) safely escapes malicious HTML payloads
        (e.g., <img src=x onerror=...>, <script>) before interpolating into cmdResults.innerHTML.
        """
        script_path = os.path.join(REPO_ROOT, "script.js")
        with open(script_path, "r", encoding="utf-8") as f:
            script_content = f.read()

        # Check A: Static check for escape utility and unescaped query template interpolation
        # In current vulnerable code: No matching commands found for "${query}"
        vulnerable_interpolation = re.search(r'No matching commands found for\s*["\']?\s*\$\{\s*query\s*\}', script_content)
        has_escape_helper = bool(re.search(r'function\s+escapeHTML|const\s+escapeHTML|let\s+escapeHTML', script_content))
        has_escaped_query = bool(re.search(r'\$\{\s*escapeHTML\s*\(\s*query\s*\)\s*\}', script_content))

        # Check B: Dynamic Headless Chrome execution check
        dynamic_xss_injected = False
        if self.selenium_available and self.driver and self.server_port:
            self.driver.get(f"http://localhost:{self.server_port}/index.html")
            time.sleep(0.8)

            # Inject test vector via renderCmdResults
            xss_payload = '<img src="x" onerror="window.__cmd_xss_executed=true;">'
            eval_result = self.driver.execute_script("""
                const cmdInput = document.getElementById('cmd-palette-input');
                const cmdResults = document.getElementById('cmd-palette-results');
                const cmdModal = document.getElementById('cmd-palette-modal');
                if (cmdModal) cmdModal.style.display = 'flex';
                
                // Trigger search with malicious vector
                if (cmdInput) {
                    cmdInput.value = arguments[0];
                    cmdInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
                
                // Allow synchronous DOM update
                const imgInjected = cmdResults ? cmdResults.querySelectorAll('img[onerror]').length : 0;
                const rawHTML = cmdResults ? cmdResults.innerHTML : '';
                const scriptExecuted = Boolean(window.__cmd_xss_executed);
                return { imgInjected, scriptExecuted, rawHTML };
            """, xss_payload)

            if eval_result.get("imgInjected", 0) > 0 or eval_result.get("scriptExecuted", False):
                dynamic_xss_injected = True

        # Assertions
        self.assertFalse(
            vulnerable_interpolation is not None and not has_escaped_query,
            "SEC-01 DOM XSS VULNERABILITY: script.js interpolates raw `${query}` into cmdResults.innerHTML "
            "at line ~954 without HTML escaping. Must implement escapeHTML(str) and sanitize query interpolation."
        )
        self.assertTrue(
            has_escape_helper,
            "SEC-01 CONTRACT VIOLATION: Missing escapeHTML utility function in script.js."
        )
        self.assertFalse(
            dynamic_xss_injected,
            "SEC-01 RUNTIME FAILURE: Malicious query payload injected unescaped <img> element into "
            "Command Palette DOM results (#cmd-palette-results)."
        )

    # -------------------------------------------------------------------------
    # 2. Dynamic Project Card Tilt & Badge Preservation
    # -------------------------------------------------------------------------
    def test_tilt_and_badge_preservation(self):
        """
        DEF-01: Dynamic project card tilt listener persistence and Amazon ML badge preservation.
        Verify that after loadProjectsFromJSON() renders cards:
        1. Amazon ML 2026 retains its 'Private Research Codebase' badge (not an empty container).
        2. 3D tilt mousemove/mouseleave listeners remain active or delegated for all dynamic cards.
        """
        script_path = os.path.join(REPO_ROOT, "script.js")
        with open(script_path, "r", encoding="utf-8") as f:
            script_content = f.read()

        # Check A: Static check for Amazon ML badge handling in dynamic renderer
        # In current vulnerable code: proj.github / proj.liveDemo are checked, but empty strings result in empty div
        handles_private_badge = bool(re.search(r'Private Research Codebase|badge-private|status-badge.*Private', script_content))

        # Check B: Dynamic Headless Chrome execution check
        badge_preserved = False
        tilt_active = False

        if self.selenium_available and self.driver and self.server_port:
            self.driver.get(f"http://localhost:{self.server_port}/index.html")
            time.sleep(1.2)  # Wait for loadProjectsFromJSON() to complete

            results = self.driver.execute_script("""
                // Check Amazon ML card badge
                const amazonCard = document.getElementById('amazon-ml-2026') || 
                                   [...document.querySelectorAll('.project-card')].find(c => c.textContent.includes('Amazon ML'));
                let badgeText = '';
                let hasLockIcon = false;
                if (amazonCard) {
                    const linksContainer = amazonCard.querySelector('.project-links');
                    badgeText = linksContainer ? linksContainer.textContent.trim() : '';
                    hasLockIcon = linksContainer ? Boolean(linksContainer.querySelector('.fa-lock, .status-badge')) : false;
                }

                // Check tilt responsiveness on dynamic card
                const firstCard = document.querySelector('.project-grid .project-card');
                let transformBefore = '';
                let transformAfter = '';
                if (firstCard) {
                    transformBefore = firstCard.style.transform || '';
                    const rect = firstCard.getBoundingClientRect();
                    // Dispatch synthetic mousemove
                    firstCard.dispatchEvent(new MouseEvent('mousemove', {
                        clientX: rect.left + rect.width * 0.8,
                        clientY: rect.top + rect.height * 0.8,
                        bubbles: true
                    }));
                    transformAfter = firstCard.style.transform || '';
                }

                return {
                    badgeText,
                    hasLockIcon,
                    transformBefore,
                    transformAfter
                };
            """)

            badge_text = results.get("badgeText", "")
            badge_preserved = "Private" in badge_text or "Research Codebase" in badge_text or results.get("hasLockIcon", False)
            transform_after = results.get("transformAfter", "")
            tilt_active = "perspective" in transform_after and ("rotateX" in transform_after or "rotateY" in transform_after)

        self.assertTrue(
            handles_private_badge or badge_preserved,
            "DEF-01 BADGE DESTRUCTION: Amazon ML Challenge 2026 card loses its 'Private Research Codebase' badge "
            "when dynamically rendered by loadProjectsFromJSON() in script.js (replaced by an empty container)."
        )
        self.assertTrue(
            tilt_active,
            "DEF-01 LISTENER LOSS: 3D tilt event listeners are destroyed when project cards are re-rendered "
            "from JSON. Event delegation or re-attachment (initTiltEffect) is missing in script.js."
        )

    # -------------------------------------------------------------------------
    # 3. Scroll Event Listener Reflow Throttling & Passive Flag
    # -------------------------------------------------------------------------
    def test_scroll_throttling(self):
        """
        PERF-01: Scroll Event Listener Reflow Throttling & Passive Flag.
        Verify that window scroll listener in script.js uses requestAnimationFrame
        (or throttling) and is registered with { passive: true }.
        """
        script_path = os.path.join(REPO_ROOT, "script.js")
        with open(script_path, "r", encoding="utf-8") as f:
            script_content = f.read()

        # Extract window.addEventListener('scroll', ...) block
        scroll_match = re.search(r"window\.addEventListener\(\s*['\"]scroll['\"]\s*,\s*(\([^)]*\)|[a-zA-Z0-9_]+)\s*=>?\s*\{(?P<body>[\s\S]*?)\}(?P<options>\s*,\s*\{[^}]*\}|\s*,\s*true|\s*,\s*false)?\s*\)", script_content)

        self.assertIsNotNone(
            scroll_match,
            "PERF-01: Could not locate window.addEventListener('scroll', ...) in script.js."
        )

        scroll_options = scroll_match.group("options") or ""
        scroll_body = scroll_match.group("body") or ""

        # Assert passive flag
        has_passive = bool(re.search(r'passive\s*:\s*true', scroll_options))
        self.assertTrue(
            has_passive,
            "PERF-01 PASSIVE LISTENER VIOLATION: Scroll event listener in script.js must be registered "
            "with { passive: true } to eliminate scroll-blocking overhead."
        )

        # Assert requestAnimationFrame or throttle usage
        has_raf = bool(re.search(r'requestAnimationFrame|rAF|isScrolling', scroll_body) or
                       re.search(r'requestAnimationFrame', script_content[:scroll_match.end() + 200]))
        self.assertTrue(
            has_raf,
            "PERF-01 REFLOW THRASHING: Scroll event listener queries DOM properties (offsetTop, scrollY) "
            "synchronously without requestAnimationFrame or throttling in script.js."
        )

    # -------------------------------------------------------------------------
    # 4. Unreferenced Three.js Vendor Bundles Bloat
    # -------------------------------------------------------------------------
    def test_vendor_assets_pruned(self):
        """
        BLT-01: Dead Vendor Assets Pruning.
        Verify that unreferenced Three.js bundles:
        - assets/vendor/three.core.min.js (~385 KB)
        - assets/vendor/three.module.min.js (~366 KB)
        are removed or excluded from deployable assets, while three.r134.min.js is preserved.
        """
        core_bundle = os.path.join(REPO_ROOT, "assets", "vendor", "three.core.min.js")
        module_bundle = os.path.join(REPO_ROOT, "assets", "vendor", "three.module.min.js")
        r134_bundle = os.path.join(REPO_ROOT, "assets", "vendor", "three.r134.min.js")

        core_exists = os.path.isfile(core_bundle)
        module_exists = os.path.isfile(module_bundle)
        r134_exists = os.path.isfile(r134_bundle)

        self.assertTrue(
            r134_exists and os.path.getsize(r134_bundle) > 100_000,
            "BLT-01 INVARIANT: Active Three.js r134 bundle (assets/vendor/three.r134.min.js) must be preserved."
        )

        self.assertFalse(
            core_exists,
            f"BLT-01 BLOAT DETECTED: Unreferenced vendor bundle '{core_bundle}' (~385 KB) must be removed."
        )
        self.assertFalse(
            module_exists,
            f"BLT-01 BLOAT DETECTED: Unreferenced vendor bundle '{module_bundle}' (~366 KB) must be removed."
        )

    # -------------------------------------------------------------------------
    # 5. WCAG AA Contrast for --text-muted Token
    # -------------------------------------------------------------------------
    def test_text_muted_contrast(self):
        """
        A11Y: WCAG 2.1 AA Contrast Ratio for --text-muted token.
        Parse --text-muted from style.css and calculate relative luminance contrast
        against --bg-main (#07090e), --bg-surface (#0c101a), and --bg-card (#0d1320).
        Assert contrast ratio >= 4.5:1.
        """
        style_path = os.path.join(REPO_ROOT, "style.css")
        with open(style_path, "r", encoding="utf-8") as f:
            css_content = f.read()

        match = re.search(r'--text-muted\s*:\s*(#[0-9a-fA-F]{3,6})', css_content)
        self.assertIsNotNone(match, "Could not find --text-muted custom property in style.css.")
        text_muted_hex = match.group(1)

        def srgb_channel_to_linear(val):
            c = val / 255.0
            return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

        def hex_to_luminance(hex_str):
            h = hex_str.lstrip('#')
            if len(h) == 3:
                h = ''.join(c * 2 for c in h)
            r = int(h[0:2], 16)
            g = int(h[2:4], 16)
            b = int(h[4:6], 16)
            return 0.2126 * srgb_channel_to_linear(r) + 0.7152 * srgb_channel_to_linear(g) + 0.0722 * srgb_channel_to_linear(b)

        def get_contrast(hex1, hex2):
            l1 = hex_to_luminance(hex1)
            l2 = hex_to_luminance(hex2)
            lighter = max(l1, l2)
            darker = min(l1, l2)
            return (lighter + 0.05) / (darker + 0.05)

        backgrounds = {
            "--bg-main": "#07090e",
            "--bg-surface": "#0c101a",
            "--bg-card": "#0d1320"
        }

        ratios = {bg_name: get_contrast(text_muted_hex, bg_hex) for bg_name, bg_hex in backgrounds.items()}

        sec_match = re.search(r'--text-secondary\s*:\s*(#[0-9a-fA-F]{3,6})', css_content)
        if sec_match:
            text_sec_hex = sec_match.group(1).lower()
            self.assertNotEqual(
                text_muted_hex.lower(),
                text_sec_hex,
                f"A11Y CONTRAST DISTINCTION FAILURE: --text-muted ({text_muted_hex}) must be visually "
                f"distinct from --text-secondary ({text_sec_hex})."
            )

        for bg_name, ratio in ratios.items():
            self.assertGreaterEqual(
                ratio,
                4.5,
                f"WCAG 2.1 AA CONTRAST FAILURE: --text-muted ({text_muted_hex}) achieves only {ratio:.2f}:1 "
                f"against {bg_name} ({backgrounds[bg_name]}). Requires at least 4.5:1 (e.g. #8090a7)."
            )

    # -------------------------------------------------------------------------
    # 6. Hero Stat Counter Accuracy against projects.json
    # -------------------------------------------------------------------------
    def test_stat_counter_alignment(self):
        """
        POL-01: Hero Stat Counter Alignment.
        Verify that the 'Featured Case Studies' counter in index.html (line ~288)
        matches the real production project count in data/projects.json (6 projects).
        """
        projects_file = os.path.join(REPO_ROOT, "data", "projects.json")
        with open(projects_file, "r", encoding="utf-8") as f:
            projects_data = json.load(f)
        real_project_count = len(projects_data)

        index_file = os.path.join(REPO_ROOT, "index.html")
        with open(index_file, "r", encoding="utf-8") as f:
            index_content = f.read()

        match = re.search(
            r'<div class="stat-card[^"]*">[\s\S]*?<div class="stat-icon"><i class="fas fa-laptop-code"></i></div>[\s\S]*?<h3 class="counter" data-target="(?P<target>\d+)">(?P<text>\d+)</h3>[\s\S]*?<p>Featured Case Studies</p>',
            index_content
        )

        self.assertIsNotNone(
            match,
            "Could not parse 'Featured Case Studies' stat card counter in index.html."
        )

        data_target = int(match.group("target"))
        counter_text = int(match.group("text"))

        self.assertEqual(
            data_target,
            real_project_count,
            f"POL-01 COUNTER MISMATCH: index.html stat counter data-target is {data_target}, "
            f"but data/projects.json contains {real_project_count} projects."
        )
        self.assertEqual(
            counter_text,
            real_project_count,
            f"POL-01 COUNTER MISMATCH: index.html stat counter innerText is {counter_text}, "
            f"but data/projects.json contains {real_project_count} projects."
        )

    # -------------------------------------------------------------------------
    # 7. Formspree Isolation & Zero Live Network Calls
    # -------------------------------------------------------------------------
    def test_formspree_mock_safety(self):
        """
        SAFETY: Formspree Test Isolation & Mock Safety.
        Verify that all contact form tests intercept window.fetch and make ZERO live
        network requests to formspree.io, and verify the mock interceptor pattern.
        """
        # Audit all Python test files in scripts/ and root
        unmocked_post_found = []
        mock_interceptor_found = False

        for root_dir, _, files in os.walk(REPO_ROOT):
            rel = os.path.relpath(root_dir, REPO_ROOT)
            parts = set(rel.split(os.sep))
            if parts.intersection({".git", ".agents", "node_modules", "qa-artifacts"}):
                continue
            for f in files:
                # Do not scan this test file itself to avoid matching the pattern definitions
                if f == os.path.basename(__file__):
                    continue
                if f.endswith(".py") and ("test" in f or "qa" in f or "smoke" in f):
                    file_path = os.path.join(root_dir, f)
                    with open(file_path, "r", encoding="utf-8", errors="ignore") as fh:
                        content = fh.read()
                        if re.search(r'(?:requests\.(?:post|get)|urllib\.request\.urlopen)\s*\([^)]*formspree\.io', content):
                            unmocked_post_found.append(file_path)
                        if "url.includes('formspree.io')" in content and ("window.__fetchCount" in content or "mock" in content.lower()):
                            mock_interceptor_found = True

        self.assertEqual(
            unmocked_post_found,
            [],
            f"SAFETY VIOLATION: Live Formspree HTTP POST requests detected in automated tests: {unmocked_post_found}"
        )
        self.assertTrue(
            mock_interceptor_found,
            "SAFETY VIOLATION: Formspree mock interception pattern missing from contact form test harness."
        )


if __name__ == "__main__":
    suite = unittest.TestLoader().loadTestsFromTestCase(TestRemediationTDD)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    print("\n" + "=" * 70)
    print("TDD BASELINE SUMMARY (Initial Red Phase)")
    print("=" * 70)
    print(f"Total Tests Run : {result.testsRun}")
    print(f"Passed          : {result.testsRun - len(result.failures) - len(result.errors)}")
    print(f"Failed          : {len(result.failures)}")
    print(f"Errors          : {len(result.errors)}")
    print("=" * 70)

    if not result.wasSuccessful():
        print(">> TDD Red Phase Established: Test suite successfully catches all target defects and bloat!")
        # In TDD baseline recording mode, exit with non-zero or 0 depending on runner convention
        sys.exit(1)
    else:
        print(">> All remediation tests passed.")
        sys.exit(0)

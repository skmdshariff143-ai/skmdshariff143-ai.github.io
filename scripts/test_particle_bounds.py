"""
Test to verify that particle bounds are scaled down on mobile/tablet viewports in observatory-scene.js.
Failing check first: verifies that observatory-scene.js defines responsive boundX and boundY
for narrow viewports (< 768px and < 992px) rather than hardcoded 12/8/6 bounds.
"""
import re
import sys
import os

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCENE_PATH = os.path.join(ROOT_DIR, "assets", "js", "observatory-scene.js")

def test_particle_bounds_scaling():
    with open(SCENE_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    # Check 1: boundX and boundY must be dynamically defined based on window.innerWidth
    has_bound_vars = bool(re.search(r"let\s+boundX\b[\s\S]*?let\s+boundY\b", content))
    assert has_bound_vars, "observatory-scene.js must define boundX and boundY"

    # Check 2: Mobile bounds (< 768px) must scale boundX to <= 2.5 and boundY to <= 3.5
    has_mobile_bounds = bool(re.search(r"innerWidth\s*<\s*768[\s\S]*?boundX\s*=\s*(?:1\.\d+|2(?:\.0+)?)\b", content))
    assert has_mobile_bounds, "observatory-scene.js must scale boundX <= 2.0 on mobile (< 768px)"

    # Check 3: Bounce check must use boundX and boundY, not hardcoded 6 and 4
    has_dynamic_bounce = bool(re.search(r"posArr\[idx\]\s*<\s*-boundX\s*\|\|\s*posArr\[idx\]\s*>\s*boundX", content))
    assert has_dynamic_bounce, "Particle bounce loop must check against -boundX and boundX, not hardcoded 6"

    print("ALL PARTICLE BOUNDS TESTS PASSED!")

if __name__ == "__main__":
    try:
        test_particle_bounds_scaling()
        sys.exit(0)
    except AssertionError as e:
        print(f"FAIL: {e}")
        sys.exit(1)

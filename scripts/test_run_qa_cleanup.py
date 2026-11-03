"""
Test that simulates driver failure during run_qa.py startup
and asserts that port 8000 is cleanly freed immediately.
Fails against unpatched run_qa.py because server_proc is started outside try/finally.
"""
import sys
import os
import socket
import subprocess
import time

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RUN_QA_PATH = os.path.join(ROOT_DIR, "run_qa.py")

def is_port_in_use(port=8000):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        res = s.connect_ex(('127.0.0.1', port))
        return res == 0

def test_driver_failure_cleanup():
    # Make sure port 8000 is free initially
    if is_port_in_use(8000):
        print("Warning: Port 8000 already in use, waiting for it to free...")
        time.sleep(2)

    # Run run_qa.py with an environment variable or mocked driver that triggers an error during driver creation
    cmd = [
        sys.executable,
        "-c",
        f"""
import sys
from unittest.mock import patch

# Mock webdriver.Chrome to raise an error during driver creation
with patch('selenium.webdriver.Chrome', side_effect=RuntimeError('Simulated Chrome Driver Crash')):
    try:
        import run_qa
    except RuntimeError as e:
        print(f"Caught expected simulated crash: {{e}}")
"""
    ]
    
    proc = subprocess.Popen(cmd, cwd=ROOT_DIR, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    stdout, stderr = proc.communicate(timeout=10)
    print("Test subprocess stdout:", stdout)
    if stderr:
        print("Test subprocess stderr:", stderr)

    # Assert that port 8000 is NOT in use (server_proc was cleanly terminated in finally block)
    port_used = is_port_in_use(8000)
    print(f"Port 8000 in use after driver failure: {port_used}")
    assert not port_used, "FAIL: Port 8000 is still bound! Server was orphaned on driver failure."
    print("PASS: Port 8000 is completely free after simulated driver crash.")

if __name__ == "__main__":
    test_driver_failure_cleanup()

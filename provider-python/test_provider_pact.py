import pytest
import threading
import requests
import uvicorn
from pact import Verifier
from app import app, USERS
import os

BROKER_URL = os.getenv("BROKER_URL", "http://16.171.160.56:9292")
BUILD_URL = os.getenv("BUILD_URL")


def check_broker():
    try:
        res = requests.get(BROKER_URL)
        if res.status_code != 200:
            raise Exception(f"Bad status: {res.status_code}")
        print("Pact Broker is up")
    except Exception as e:
        pytest.exit(f"Pact Broker not reachable: {e}", returncode=1)

class UvicornServer(threading.Thread):
    def __init__(self, port: int = 5000):
        super().__init__(daemon=True)
        self.port = port
        self.started = threading.Event()
        config = uvicorn.Config(app, host="127.0.0.1", port=port, log_level="error")
        self.server = uvicorn.Server(config)
        self.server.config.setup_event_loop()

    def run(self):
        self.server.config.setup_event_loop()
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(self.server.serve())

    def start_and_wait(self):
        self.start()
        import time; time.sleep(1.5)


def setup_provider_state(state: str):
    """Called by the Pact verifier before each interaction."""
    if state == "users exist":
        pass
    elif state == "user with id 1 exists":
        pass
    elif state == "user with id 999 does not exist":
        USERS[:] = [u for u in USERS if u["id"] != 999]



PACT_DIR = os.path.join(os.path.dirname(__file__), "..", "consumer-node", "pacts")
PROVIDER_URL = "http://127.0.0.1:5000"


@pytest.fixture(scope="module", autouse=True)
def provider_server():
    server = UvicornServer(port=5000)
    server.start_and_wait()
    yield


def test_pact_with_consumer():
    check_broker()
    verifier = Verifier(
        provider="provider-python",
        provider_base_url=PROVIDER_URL,
    )

    output, logs = verifier.verify_with_broker(
        broker_url="http://16.171.160.56:9292",
        provider="provider-python",
        consumer_version_selectors=[{"latest": True}],
        publish_verification_results=True,
        provider_version=os.getenv("GITHUB_SHA", "dev"),
        build_url = BUILD_URL,
        verbose=True,
    )
    
    assert output == 0, f"Pact verification FAILED.\nThe Provider does not satisfy the Consumer Node contract.\n {logs}"



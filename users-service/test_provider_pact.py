
import subprocess

import pytest
import asyncio
import threading
import time
import os
import requests
import uvicorn
from pact import Verifier
from app import app, _users

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


class BackgroundServer(threading.Thread):
    def __init__(self, port: int = 5000):
        super().__init__(daemon=True)
        self.port = port
        config = uvicorn.Config(app, host="127.0.0.1", port=port, log_level="error")
        self.server = uvicorn.Server(config)

    def run(self):
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(self.server.serve())


@pytest.fixture(scope="module", autouse=True)
def running_server():
    server = BackgroundServer(port=5000)
    server.start()
    time.sleep(1.5)
    yield


PROVIDER_STATES = {
    "user 1 exists": lambda: _ensure_user({"id": 1, "name": "Alice Nguyen", "email": "alice@example.com"}),
    "user 2 exists": lambda: _ensure_user({"id": 2, "name": "Bob Smith", "email": "bob@example.com"}),
    "user 999 does not exist": lambda: _remove_user(999),
    "user 42 does not exist":  lambda: _remove_user(42),
}


def _ensure_user(user: dict):
    if not any(u["id"] == user["id"] for u in _users):
        _users.append(user)


def _remove_user(user_id: int):
    _users[:] = [u for u in _users if u["id"] != user_id]


PROVIDER_URL = "http://127.0.0.1:5000"


def test_pact_verification_against_orders_service():
    """
    Verifies that this Users service satisfies every interaction
    declared in the Orders service's pact file via Pact Broker.
    """
    check_broker()
    verifier = Verifier(
        provider="users-service",
        provider_base_url=PROVIDER_URL,
    )

    output, logs = verifier.verify_with_broker(
        broker_url="http://16.171.160.56:9292",
        provider="users-service",
        consumer_version_selectors=[{"latest": True}],
        publish_version ="1.0.0",
        publish_verification_results=True,
        provider_version="1.0.0",
        # provider_version=os.getenv("GITHUB_SHA", "dev"),  # ✅ REQUIRED
        verbose=True,
        # build_url = BUILD_URL
    )
    
    print(logs)
    

    assert output == 0, (
        "Pact verification FAILED.\n"
        "Check logs above for mismatch details.\n"
    )
        
    # assert output == 0, f"Pact verification FAILED.\nThe Users service does not satisfy the Orders service contract.\n {logs}"
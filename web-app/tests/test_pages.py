from pathlib import Path
import pytest
from flask import Flask
from pages import pages

WEB_APP_DIR = Path(__file__).resolve().parent.parent
VALID_ID = "6650a1f2c3d4e5f6a7b8c9d0"


@pytest.fixture
def app():
    flask_app = Flask(__name__, root_path=str(WEB_APP_DIR))
    flask_app.config["TESTING"] = True
    flask_app.register_blueprint(pages)
    return flask_app


def test_dashboard_renders(client):
    response = client.get("/")
    assert response.status_code == 200
    assert b'id="filler-chart"' in response.data


def test_record_renders(client):
    response = client.get("/record")
    assert response.status_code == 200
    assert b'id="record-btn"' in response.data


def test_session_valid_id_renders(client):
    response = client.get(f"/sessions/{VALID_ID}")
    assert response.status_code == 200
    assert VALID_ID.encode() in response.data


def test_session_invalid_id_returns_404(client):
    response = client.get("/sessions/not-an-id")
    assert response.status_code == 404


def test_nav_links_present(client):
    response = client.get("/record")
    assert b'href="/"' in response.data
    assert b'href="/record"' in response.data

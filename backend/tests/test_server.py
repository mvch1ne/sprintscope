"""Tests for backend/server.py — uses stub cv2 + rtmlib from conftest.py."""
import json
import io
import pytest
from httpx import AsyncClient, ASGITransport


@pytest.fixture(scope="module")
def app():
    # Import after stubs are registered in conftest
    from server import app as _app
    return _app


@pytest.fixture
async def client(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


# ── /health ───────────────────────────────────────────────────────────────────

async def test_health(client):
    r = await client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


# ── /infer/video ──────────────────────────────────────────────────────────────

async def test_infer_video_streams_progress_then_result(client):
    """Upload a dummy file; expect SSE progress events followed by a result event."""
    dummy_video = io.BytesIO(b"\x00" * 64)
    dummy_video.name = "test.mp4"

    r = await client.post(
        "/infer/video",
        files={"file": ("test.mp4", dummy_video, "video/mp4")},
    )
    assert r.status_code == 200
    assert "text/event-stream" in r.headers["content-type"]

    # Parse SSE lines
    events = []
    for line in r.text.splitlines():
        if line.startswith("data: "):
            events.append(json.loads(line[6:]))

    assert len(events) > 0, "No SSE events received"

    progress_events = [e for e in events if e.get("type") == "progress"]
    result_events = [e for e in events if e.get("type") == "result"]

    assert len(progress_events) > 0, "Expected at least one progress event"
    assert len(result_events) == 1, "Expected exactly one result event"

    result = result_events[0]
    assert "fps" in result
    assert "frames" in result
    assert "n_kpts" in result
    assert result["n_kpts"] == 133
    assert isinstance(result["frames"], list)


async def test_infer_video_result_frame_shape(client):
    """Each frame in the result should be a flat list of 133*6 floats (2D + 3D)."""
    dummy_video = io.BytesIO(b"\x00" * 64)

    r = await client.post(
        "/infer/video",
        files={"file": ("test.mp4", dummy_video, "video/mp4")},
    )

    events = []
    for line in r.text.splitlines():
        if line.startswith("data: "):
            events.append(json.loads(line[6:]))

    result = next(e for e in events if e.get("type") == "result")
    n_kpts = result["n_kpts"]
    expected_len = n_kpts * 3 + n_kpts * 3  # flat2d + flat3d

    for frame_data in result["frames"]:
        assert len(frame_data) == expected_len, (
            f"Frame has {len(frame_data)} values, expected {expected_len}"
        )


async def test_infer_video_progress_fields(client):
    """Progress events must include required telemetry fields."""
    dummy_video = io.BytesIO(b"\x00" * 64)

    r = await client.post(
        "/infer/video",
        files={"file": ("test.mp4", dummy_video, "video/mp4")},
    )

    for line in r.text.splitlines():
        if line.startswith("data: "):
            event = json.loads(line[6:])
            if event.get("type") == "progress":
                for field in ("frame", "total", "pct", "fps", "elapsed", "eta"):
                    assert field in event, f"Missing field '{field}' in progress event"
                break

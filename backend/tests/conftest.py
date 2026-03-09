"""Stub out heavy ML dependencies so tests run without GPU/model files."""
import sys
import types
import numpy as np
import pytest


def _make_stub_module(name: str) -> types.ModuleType:
    mod = types.ModuleType(name)
    sys.modules[name] = mod
    return mod


# ── cv2 stub ──────────────────────────────────────────────────────────────────
cv2_mod = _make_stub_module("cv2")
cv2_mod.CAP_PROP_FPS = 5
cv2_mod.CAP_PROP_FRAME_WIDTH = 3
cv2_mod.CAP_PROP_FRAME_HEIGHT = 4
cv2_mod.CAP_PROP_FRAME_COUNT = 7


class _FakeCap:
    """Minimal VideoCapture stub: yields 3 frames of 4×4 black pixels."""

    def __init__(self, path: str):
        self._frames = 3
        self._idx = 0

    def isOpened(self):
        return True

    def get(self, prop):
        return {
            cv2_mod.CAP_PROP_FPS: 30.0,
            cv2_mod.CAP_PROP_FRAME_WIDTH: 64.0,
            cv2_mod.CAP_PROP_FRAME_HEIGHT: 64.0,
            cv2_mod.CAP_PROP_FRAME_COUNT: float(self._frames),
        }.get(prop, 0.0)

    def read(self):
        if self._idx < self._frames:
            self._idx += 1
            return True, np.zeros((64, 64, 3), dtype=np.uint8)
        return False, None

    def release(self):
        pass


cv2_mod.VideoCapture = _FakeCap

# ── rtmlib stub ───────────────────────────────────────────────────────────────
rtmlib_mod = _make_stub_module("rtmlib")


class _FakeWholebody3d:
    pass


class _FakePoseTracker:
    """Returns deterministic zero keypoints for any frame."""

    def __init__(self, *args, **kwargs):
        self._n = 133

    def __call__(self, frame):
        n = self._n
        kp2d = np.zeros((1, n, 2))
        kp3d = np.zeros((1, n, 3))
        scores = np.zeros((1, n))
        simcc = None
        return kp3d, scores, simcc, kp2d


rtmlib_mod.PoseTracker = _FakePoseTracker
rtmlib_mod.Wholebody3d = _FakeWholebody3d

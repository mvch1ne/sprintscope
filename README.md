SprintLab is a web application I made to help sprinters perform kinematic analysis on their training videos so they can gain insights and improve their performance. It's a React single-page app built with TypeScript, and coupled with a Python backend built with FastAPI and RTMLib for highly accurate, research-level pose estimation and tracking of body landmarks. I also added Three.js for a 3D view because I thought it would look really cool.

The app lets users upload videos, calibrate real-world distances and compute performance metrics like ground contact times, stride length, joint angles, linear and angular velocities, acceleration, etc. All this from just a video!

This project is very personal to me. As an athlete and engineer from Ghana, West Africa, where biomechanics labs are pretty much non-existent. I looked around for a tool to help level the playing field...and realized that I had to build it myself. This tool is open to everyone worldwide, but my major motivation is to help bridge the resource gap in underdeveloped parts of the world, like Africa. I'm excited to see how it helps athletes everywhere.

---

## Testing

SprintLab follows a test-driven development approach. Both the frontend and backend have independent test suites that run without needing a camera, GPU, or any ML model files.

### Frontend — Vitest

**Stack:** [Vitest](https://vitest.dev/) · jsdom · @testing-library/react

**Test files:**

| File | What it covers |
|---|---|
| `frontend/src/components/dashboard/__tests__/sprintMath.test.ts` | Pure math functions: `angleDeg`, `segAngleDeg`, `segInclineDeg`, `smooth`, `derivative`, `buildSeries` |
| `frontend/src/components/dashboard/__tests__/sprintMetrics.contacts.test.ts` | Ground contact detection: single contacts, duration filtering, stable IDs, calibrated CoM distance |

Pure biomechanics math lives in `frontend/src/components/dashboard/sprintMath.ts` — framework-free, fully testable. The React hook `useSprintMetrics.ts` imports from it.

**Run the tests:**

```bash
cd frontend

# One-shot (CI)
npm test

# Watch mode (development)
npm run test:watch

# Interactive browser UI
npm run test:ui
```

**Current result:** 26 tests, 2 test files, all passing.

---

### Backend — pytest

**Stack:** [pytest](https://docs.pytest.org/) · pytest-asyncio · httpx (ASGI transport)

The test suite stubs out `cv2` and `rtmlib` entirely in `backend/tests/conftest.py`, so tests run instantly without any model downloads or GPU.

**Test file:**

| File | What it covers |
|---|---|
| `backend/tests/test_server.py` | `GET /health` response · SSE stream structure · per-frame keypoint array shape · progress event fields |

**Install test dependencies (first time):**

```bash
cd backend
pip install pytest pytest-asyncio httpx
# or install everything at once:
pip install -r requirements.txt
```

**Run the tests:**

```bash
cd backend
python -m pytest
```

**Current result:** 4 tests, all passing.

---

### Running both suites

```bash
# Frontend
cd frontend && npm test

# Backend
cd backend && python -m pytest
```

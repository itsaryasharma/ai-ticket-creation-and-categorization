"""
main_api.py — FastAPI entry point
Run from ui/backend/:  uvicorn main_api:app --reload --port 8000
"""
from __future__ import annotations

import sys
from pathlib import Path

# ── PATH BOOTSTRAP ────────────────────────────────────────────────────
# Makes main.py (in project root) importable from here
_BACKEND_DIR  = Path(__file__).resolve().parent
_PROJECT_ROOT = _BACKEND_DIR.parents[1]

for p in [str(_BACKEND_DIR), str(_PROJECT_ROOT)]:
    if p not in sys.path:
        sys.path.insert(0, p)

# ── INIT DB ───────────────────────────────────────────────────────────
from database import init_db
init_db()

# ── FASTAPI APP ───────────────────────────────────────────────────────
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.auth    import router as auth_router
from routes.tickets import router as tickets_router
from routes.admin   import router as admin_router

app = FastAPI(
    title="AI Ticket System API",
    description="AI-powered IT ticket creation and categorization",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# Allow Next.js dev server (port 3000) and production domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── ROUTERS ───────────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(tickets_router)
app.include_router(admin_router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "2.0.0"}


# ── DEV RUNNER ────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    print("\n" + "=" * 55)
    print("  AI Ticket System — FastAPI v2.0")
    print("=" * 55)
    print("  API:   http://localhost:8000")
    print("  Docs:  http://localhost:8000/api/docs")
    print("=" * 55 + "\n")
    uvicorn.run("main_api:app", host="0.0.0.0", port=8000, reload=True)

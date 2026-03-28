"""
database.py — SQLite abstraction layer
Designed to be Supabase-ready: swap `USE_SUPABASE=true` in .env.
"""
from __future__ import annotations

import json
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
import os

load_dotenv(Path(__file__).parent / ".env")

DB_PATH = Path(__file__).parent / "data" / "app.db"
DB_PATH.parent.mkdir(exist_ok=True)

# ── INIT SCHEMA ─────────────────────────────────────────────────────
SCHEMA = """
PRAGMA journal_mode=WAL;

CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    email       TEXT UNIQUE NOT NULL,
    password    TEXT NOT NULL,
    full_name   TEXT,
    role        TEXT NOT NULL DEFAULT 'user',
    created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tickets (
    id          TEXT PRIMARY KEY,
    ticket_id   TEXT UNIQUE NOT NULL,
    user_id     TEXT REFERENCES users(id),
    title       TEXT NOT NULL,
    description TEXT NOT NULL,
    category    TEXT NOT NULL,
    priority    TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'OPEN',
    entities    TEXT DEFAULT '[]',
    confidence  REAL DEFAULT 0.0,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ticket_messages (
    id          TEXT PRIMARY KEY,
    ticket_id   TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    user_id     TEXT REFERENCES users(id),
    content     TEXT NOT NULL,
    is_admin    INTEGER DEFAULT 0,
    created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS logs (
    id          TEXT PRIMARY KEY,
    actor_id    TEXT REFERENCES users(id),
    action      TEXT NOT NULL,
    target_id   TEXT,
    metadata    TEXT DEFAULT '{}',
    created_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tickets_user    ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status  ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_created ON tickets(created_at DESC);
"""


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    conn = get_conn()
    conn.executescript(SCHEMA)
    conn.commit()
    conn.close()


def now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")


def new_id() -> str:
    return str(uuid.uuid4())


# ── USERS ────────────────────────────────────────────────────────────
def get_user_by_email(email: str) -> dict | None:
    with get_conn() as c:
        row = c.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        return dict(row) if row else None


def get_user_by_id(uid: str) -> dict | None:
    with get_conn() as c:
        row = c.execute("SELECT * FROM users WHERE id = ?", (uid,)).fetchone()
        return dict(row) if row else None


def create_user(email: str, hashed_pw: str, full_name: str | None = None, role: str = "user") -> dict:
    uid = new_id()
    ts  = now_iso()
    with get_conn() as c:
        c.execute(
            "INSERT INTO users (id, email, password, full_name, role, created_at) VALUES (?,?,?,?,?,?)",
            (uid, email, hashed_pw, full_name, role, ts)
        )
        c.commit()
    return {"id": uid, "email": email, "full_name": full_name, "role": role, "created_at": ts}


def list_users(page: int = 1, page_size: int = 20) -> tuple[list[dict], int]:
    offset = (page - 1) * page_size
    with get_conn() as c:
        total = c.execute("SELECT COUNT(*) FROM users").fetchone()[0]
        rows  = c.execute(
            "SELECT id, email, full_name, role, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?",
            (page_size, offset)
        ).fetchall()
    return [dict(r) for r in rows], total


def update_user_role(uid: str, role: str):
    with get_conn() as c:
        c.execute("UPDATE users SET role = ? WHERE id = ?", (role, uid))
        c.commit()


# ── TICKETS ──────────────────────────────────────────────────────────
def save_ticket(ai_output: dict, user_id: str | None = None) -> dict:
    uid  = new_id()
    ts   = now_iso()
    ent  = json.dumps(ai_output["body"]["ai_extracted_entities"])
    with get_conn() as c:
        c.execute(
            """INSERT INTO tickets
               (id, ticket_id, user_id, title, description, category, priority,
                status, entities, confidence, created_at, updated_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""",
            (
                uid,
                ai_output["ticket_id"],
                user_id,
                ai_output["header"]["title"],
                ai_output["body"]["description"],
                ai_output["header"]["category"],
                ai_output["header"]["priority"],
                ai_output["header"]["status"],
                ent,
                ai_output["metadata"]["ai_confidence"],
                ai_output["metadata"]["timestamp"],
                ts,
            )
        )
        c.commit()
    return get_ticket_by_id(uid)  # type: ignore


def get_ticket_by_id(ticket_uuid: str) -> dict | None:
    with get_conn() as c:
        row = c.execute("SELECT * FROM tickets WHERE id = ?", (ticket_uuid,)).fetchone()
        return dict(row) if row else None


def get_ticket_by_ticket_id(ticket_id: str) -> dict | None:
    with get_conn() as c:
        row = c.execute("SELECT * FROM tickets WHERE ticket_id = ?", (ticket_id,)).fetchone()
        return dict(row) if row else None


def list_tickets(
    user_id: str | None = None,
    status: str | None = None,
    category: str | None = None,
    search: str | None = None,
    page: int = 1,
    page_size: int = 20,
    admin: bool = False,
) -> tuple[list[dict], int]:
    clauses, params = [], []

    if not admin and user_id:
        clauses.append("user_id = ?")
        params.append(user_id)
    if status:
        clauses.append("status LIKE ?")
        params.append(f"%{status}%")
    if category:
        clauses.append("category = ?")
        params.append(category)
    if search:
        clauses.append("(ticket_id LIKE ? OR title LIKE ?)")
        params += [f"%{search}%", f"%{search}%"]

    where = ("WHERE " + " AND ".join(clauses)) if clauses else ""
    offset = (page - 1) * page_size

    with get_conn() as c:
        total = c.execute(f"SELECT COUNT(*) FROM tickets {where}", params).fetchone()[0]
        rows  = c.execute(
            f"SELECT * FROM tickets {where} ORDER BY created_at DESC LIMIT ? OFFSET ?",
            params + [page_size, offset]
        ).fetchall()
    return [dict(r) for r in rows], total


def update_ticket(ticket_uuid: str, fields: dict) -> dict | None:
    allowed = {"title", "description", "category", "priority", "status"}
    updates = {k: v for k, v in fields.items() if k in allowed and v is not None}
    if not updates:
        return get_ticket_by_id(ticket_uuid)

    updates["updated_at"] = now_iso()
    set_clause = ", ".join(f"{k} = ?" for k in updates)
    values = list(updates.values()) + [ticket_uuid]

    with get_conn() as c:
        c.execute(f"UPDATE tickets SET {set_clause} WHERE id = ?", values)
        c.commit()
    return get_ticket_by_id(ticket_uuid)


# ── ANALYTICS ────────────────────────────────────────────────────────
def get_analytics() -> dict:
    with get_conn() as c:
        total = c.execute("SELECT COUNT(*) FROM tickets").fetchone()[0]
        avg   = c.execute("SELECT AVG(confidence) FROM tickets").fetchone()[0] or 0.0
        by_cat = c.execute(
            "SELECT category, COUNT(*) as count FROM tickets GROUP BY category ORDER BY count DESC"
        ).fetchall()
        statuses = c.execute(
            "SELECT status, COUNT(*) as count FROM tickets GROUP BY status"
        ).fetchall()

    def cnt(keyword: str) -> int:
        for row in statuses:
            if keyword.lower() in row["status"].lower():
                return row["count"]
        return 0

    return {
        "total": total,
        "open": cnt("OPEN"),
        "in_progress": cnt("IN_PROGRESS"),
        "resolved": cnt("RESOLVED"),
        "closed": cnt("CLOSED"),
        "manual_review": cnt("MANUAL_REVIEW"),
        "avg_confidence": round(avg, 4),
        "by_category": [{"category": r["category"], "count": r["count"]} for r in by_cat],
    }


# ── LOGS ─────────────────────────────────────────────────────────────
def add_log(actor_id: str | None, action: str, target_id: str | None = None, meta: dict | None = None):
    with get_conn() as c:
        c.execute(
            "INSERT INTO logs (id, actor_id, action, target_id, metadata, created_at) VALUES (?,?,?,?,?,?)",
            (new_id(), actor_id, action, target_id, json.dumps(meta or {}), now_iso())
        )
        c.commit()


def list_logs(page: int = 1, page_size: int = 30) -> tuple[list[dict], int]:
    offset = (page - 1) * page_size
    with get_conn() as c:
        total = c.execute("SELECT COUNT(*) FROM logs").fetchone()[0]
        rows  = c.execute(
            "SELECT * FROM logs ORDER BY created_at DESC LIMIT ? OFFSET ?",
            (page_size, offset)
        ).fetchall()
    return [dict(r) for r in rows], total

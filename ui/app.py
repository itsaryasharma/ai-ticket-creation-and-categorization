"""
app.py — Flask API + Template Server
--------------------------------------
Entry point for the AI Ticket System UI.
Imports create_it_ticket() from the parent directory's main.py.

Usage (from the ui/ folder):
    python app.py

Then open: http://localhost:5000
Admin panel: http://localhost:5000/admin
"""

import sys
import json
import sqlite3
from pathlib import Path
from functools import wraps
from flask import (
    Flask, request, jsonify, render_template,
    session, redirect, url_for, abort
)

# ---------------------------------------------------------------------------
# PATH BOOTSTRAP — make parent dir importable so main.py is reachable
# ---------------------------------------------------------------------------
UI_DIR = Path(__file__).resolve().parent          # .../ui/
PROJECT_ROOT = UI_DIR.parent                       # .../ai-ticket-creation-and-categorization/

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from main import create_it_ticket  # noqa: E402  (import after path fix)

# ---------------------------------------------------------------------------
# APP CONFIG
# ---------------------------------------------------------------------------
app = Flask(__name__)
app.secret_key = "AI-TICKET-DEMO-SECRET-2026"     # change in production

DB_PATH = UI_DIR / "tickets.db"

# Hardcoded admin credentials (demo only)
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

# ---------------------------------------------------------------------------
# DATABASE HELPERS
# ---------------------------------------------------------------------------

def get_db():
    """Open a SQLite connection with row_factory for dict-like access."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def row_to_dict(row):
    """Convert a sqlite3.Row to a plain dict; parse entities JSON."""
    d = dict(row)
    try:
        d["entities"] = json.loads(d.get("entities", "[]"))
    except (json.JSONDecodeError, TypeError):
        d["entities"] = []
    return d


def save_ticket(ticket: dict):
    """Persist a ticket dict (from create_it_ticket) to the database."""
    conn = get_db()
    try:
        conn.execute(
            """
            INSERT OR REPLACE INTO tickets
                (ticket_id, title, description, category, priority,
                 status, entities, confidence, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                ticket["ticket_id"],
                ticket["header"]["title"],
                ticket["body"]["description"],
                ticket["header"]["category"],
                ticket["header"]["priority"],
                ticket["header"]["status"],
                json.dumps(ticket["body"]["ai_extracted_entities"]),
                ticket["metadata"]["ai_confidence"],
                ticket["metadata"]["timestamp"],
            ),
        )
        conn.commit()
    finally:
        conn.close()

# ---------------------------------------------------------------------------
# AUTH DECORATOR
# ---------------------------------------------------------------------------

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get("admin_logged_in"):
            return redirect(url_for("admin_login_page"))
        return f(*args, **kwargs)
    return decorated

# ---------------------------------------------------------------------------
# PAGE ROUTES (serve HTML templates)
# ---------------------------------------------------------------------------

@app.route("/")
def root():
    return redirect(url_for("landing"))


@app.route("/portal")
def index():
    return render_template("index.html")


@app.route("/landing")
def landing():
    """Landing page shown after logout — choose User or Admin access."""
    return render_template("landing.html")


@app.route("/admin")
@admin_required
def admin_dashboard():
    return render_template("admin_dashboard.html")


@app.route("/admin/login")
@app.route("/admin-login")   # extra hidden alias
def admin_login_page():
    if session.get("admin_logged_in"):
        return redirect(url_for("admin_dashboard"))
    return render_template("admin_login.html")


@app.route("/admin/ticket/<ticket_id>")
@admin_required
def admin_ticket_detail(ticket_id):
    return render_template("admin_ticket.html", ticket_id=ticket_id)

# ---------------------------------------------------------------------------
# API — AUTH
# ---------------------------------------------------------------------------

@app.route("/api/admin/login", methods=["POST"])
def admin_login():
    data = request.get_json(force=True)
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()

    if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
        session["admin_logged_in"] = True
        return jsonify({"success": True})
    return jsonify({"success": False, "error": "Invalid credentials"}), 401


@app.route("/api/admin/logout", methods=["POST"])
def admin_logout():
    session.clear()
    return jsonify({"success": True, "redirect": "/landing"})

# ---------------------------------------------------------------------------
# API — TICKET ENDPOINTS
# ---------------------------------------------------------------------------

@app.route("/api/create-ticket", methods=["POST"])
def create_ticket():
    """
    POST /api/create-ticket
    Body: { "description": "..." }
    Calls create_it_ticket(), stores in DB, returns full ticket JSON.
    """
    data = request.get_json(force=True)
    description = (data.get("description") or "").strip()

    if not description:
        return jsonify({"error": "Description cannot be empty."}), 400

    try:
        ticket = create_it_ticket(description)
    except Exception as exc:
        return jsonify({"error": f"AI engine error: {str(exc)}"}), 500

    try:
        save_ticket(ticket)
    except Exception as exc:
        return jsonify({"error": f"Database error: {str(exc)}"}), 500

    return jsonify(ticket), 201


@app.route("/api/ticket/<ticket_id>", methods=["GET"])
def get_ticket(ticket_id):
    """GET /api/ticket/<id> — fetch a single ticket."""
    conn = get_db()
    try:
        row = conn.execute(
            "SELECT * FROM tickets WHERE ticket_id = ?", (ticket_id,)
        ).fetchone()
    finally:
        conn.close()

    if row is None:
        return jsonify({"error": f"Ticket '{ticket_id}' not found."}), 404

    return jsonify(row_to_dict(row))


@app.route("/api/tickets", methods=["GET"])
def list_tickets():
    """
    GET /api/tickets            — all tickets (newest first)
    GET /api/tickets?status=OPEN — filter by status substring
    """
    status_filter = request.args.get("status", "").strip()
    conn = get_db()
    try:
        if status_filter:
            # Use LIKE so "OPEN" matches "OPEN (AUTO_ASSIGN)" etc.
            rows = conn.execute(
                "SELECT * FROM tickets WHERE status LIKE ? ORDER BY timestamp DESC",
                (f"%{status_filter}%",),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM tickets ORDER BY timestamp DESC"
            ).fetchall()
    finally:
        conn.close()

    return jsonify([row_to_dict(r) for r in rows])


@app.route("/api/ticket/update", methods=["PUT"])
@admin_required
def update_ticket():
    """
    PUT /api/ticket/update
    Body: { "ticket_id": "TIC-...", "status": "...", "category": "...",
            "title": "...", "priority": "..." }
    Admin-only. Updates any combination of editable fields.
    """
    data = request.get_json(force=True)
    ticket_id = (data.get("ticket_id") or "").strip()

    if not ticket_id:
        return jsonify({"error": "ticket_id is required."}), 400

    # Collect all editable fields
    editable = {
        "status":   (data.get("status")   or "").strip(),
        "category": (data.get("category") or "").strip(),
        "title":    (data.get("title")    or "").strip(),
        "priority": (data.get("priority") or "").strip(),
    }

    fields, values = [], []
    for col, val in editable.items():
        if val:
            fields.append(f"{col} = ?")
            values.append(val)

    if not fields:
        return jsonify({"error": "Nothing to update."}), 400

    conn = get_db()
    try:
        values.append(ticket_id)
        conn.execute(
            f"UPDATE tickets SET {', '.join(fields)} WHERE ticket_id = ?",
            values,
        )
        conn.commit()
        changed = conn.execute("SELECT changes()").fetchone()[0]
    finally:
        conn.close()

    if changed == 0:
        return jsonify({"error": "Ticket not found."}), 404

    return jsonify({"success": True, "ticket_id": ticket_id})

# ---------------------------------------------------------------------------
# RUN
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    # Auto-initialise DB if it doesn't exist yet
    if not DB_PATH.exists():
        from db_setup import init_db
        init_db()

    print("\n" + "=" * 55)
    print("  AI TICKET SYSTEM — Flask Server Starting")
    print("=" * 55)
    print(f"  App:       http://localhost:5000")
    print(f"  Admin:     http://localhost:5000/admin")
    print(f"  Database:  {DB_PATH}")
    print("=" * 55 + "\n")

    app.run(debug=True, port=5000)

"""
db_setup.py
-----------
Run this script ONCE before starting the Flask app.
Creates the SQLite database and the 'tickets' table inside ui/tickets.db.

Usage:
    cd ui
    python db_setup.py
"""

import sqlite3
from pathlib import Path

# Database lives alongside this script, inside the ui/ folder
DB_PATH = Path(__file__).resolve().parent / "tickets.db"


def init_db():
    print(f"[DB SETUP] Initializing database at: {DB_PATH}")
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tickets (
            ticket_id   TEXT PRIMARY KEY,
            title       TEXT NOT NULL,
            description TEXT NOT NULL,
            category    TEXT NOT NULL,
            priority    TEXT NOT NULL,
            status      TEXT NOT NULL,
            entities    TEXT NOT NULL DEFAULT '[]',
            confidence  REAL NOT NULL DEFAULT 0.0,
            timestamp   TEXT NOT NULL
        )
    """)

    conn.commit()
    conn.close()
    print("[DB SETUP] Table 'tickets' ready. ✓")


if __name__ == "__main__":
    init_db()

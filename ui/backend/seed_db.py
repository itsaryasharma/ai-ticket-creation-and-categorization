"""
seed_db.py — Auto-seed default admin and user accounts on startup.

Reads credentials from environment variables so they are never hardcoded.
Safe to run multiple times — skips creation if the account already exists.

Environment variables (set these on Render):
  ADMIN_EMAIL      default: admin@ticketai.com
  ADMIN_PASSWORD   default: Admin@1234  (CHANGE THIS in production!)
  ADMIN_NAME       default: Admin
  SEED_USER_EMAIL  default: user@ticketai.com
  SEED_USER_PASSWORD default: User@1234  (CHANGE THIS in production!)
  SEED_USER_NAME   default: Demo User
"""
from __future__ import annotations

import os
import database as db
from auth_utils import hash_password


def seed():
    """Create default admin + user accounts if they don't already exist."""

    # ── Admin account ──────────────────────────────────────────────────
    admin_email    = os.getenv("ADMIN_EMAIL",    "admin@ticketai.com")
    admin_password = os.getenv("ADMIN_PASSWORD", "Admin@1234")
    admin_name     = os.getenv("ADMIN_NAME",     "Admin")

    if not db.get_user_by_email(admin_email):
        db.create_user(
            email      = admin_email,
            hashed_pw  = hash_password(admin_password),
            full_name  = admin_name,
            role       = "admin",
        )
        print(f"[seed] ✅ Admin account created: {admin_email}")
    else:
        print(f"[seed] ℹ️  Admin account already exists: {admin_email}")

    # ── Demo user account ──────────────────────────────────────────────
    user_email    = os.getenv("SEED_USER_EMAIL",    "user@ticketai.com")
    user_password = os.getenv("SEED_USER_PASSWORD", "User@1234")
    user_name     = os.getenv("SEED_USER_NAME",     "Demo User")

    if not db.get_user_by_email(user_email):
        db.create_user(
            email      = user_email,
            hashed_pw  = hash_password(user_password),
            full_name  = user_name,
            role       = "user",
        )
        print(f"[seed] ✅ User account created: {user_email}")
    else:
        print(f"[seed] ℹ️  User account already exists: {user_email}")


if __name__ == "__main__":
    # Allow running directly: python seed_db.py
    db.init_db()
    seed()
    print("[seed] Done.")

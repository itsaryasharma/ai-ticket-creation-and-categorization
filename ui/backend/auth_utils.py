"""
auth_utils.py — JWT + password hashing utilities
Uses bcrypt directly (avoids passlib + bcrypt>=4.x incompatibility)
"""
from __future__ import annotations

import os
import bcrypt
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt  # noqa: F401 (re-exported)

SECRET_KEY = os.getenv("JWT_SECRET", "CHANGE_ME_IN_PRODUCTION_AI_TICKET_2026")
ALGORITHM  = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours


def hash_password(password: str) -> str:
    """Hash a plain-text password with bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plain-text password against a bcrypt hash."""
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False




def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    """Raises JWTError if invalid/expired."""
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

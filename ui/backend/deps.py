"""
deps.py — FastAPI dependency injection
get_current_user, require_admin reusable in all routes.
"""
from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from auth_utils import decode_token
from database import get_user_by_id
from jose import JWTError

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(token)
        user_id: str | None = payload.get("sub")
        if not user_id:
            raise credentials_exc
    except JWTError:
        raise credentials_exc

    user = get_user_by_id(user_id)
    if not user:
        raise credentials_exc
    return user


async def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

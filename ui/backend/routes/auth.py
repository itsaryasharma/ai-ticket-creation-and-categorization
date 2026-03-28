"""
routes/auth.py — Register, Login, Logout, Me
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm

import sys
sys.path.insert(0, str(__import__("pathlib").Path(__file__).resolve().parents[1]))

from auth_utils import hash_password, verify_password, create_access_token
from database import get_user_by_email, create_user, get_user_by_id
from deps import get_current_user
from models import RegisterRequest, LoginRequest, AuthResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse)
async def register(req: RegisterRequest):
    if get_user_by_email(req.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed = hash_password(req.password)
    user   = create_user(req.email, hashed, req.full_name)
    token  = create_access_token({"sub": user["id"], "role": user["role"]})
    return AuthResponse(
        access_token=token,
        user_id=user["id"],
        email=user["email"],
        role=user["role"],
        full_name=user.get("full_name"),
    )


@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    user = get_user_by_email(req.email)
    if not user or not verify_password(req.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    token = create_access_token({"sub": user["id"], "role": user["role"]})
    return AuthResponse(
        access_token=token,
        user_id=user["id"],
        email=user["email"],
        role=user["role"],
        full_name=user.get("full_name"),
    )


# OAuth2 form-compatible login (used by Swagger UI)
@router.post("/token", include_in_schema=False)
async def login_form(form: OAuth2PasswordRequestForm = Depends()):
    user = get_user_by_email(form.username)
    if not user or not verify_password(form.password, user["password"]):
        raise HTTPException(status_code=401, detail="Incorrect credentials")
    token = create_access_token({"sub": user["id"], "role": user["role"]})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me")
async def me(current_user: dict = Depends(get_current_user)):
    return {
        "id":        current_user["id"],
        "email":     current_user["email"],
        "full_name": current_user.get("full_name"),
        "role":      current_user["role"],
    }

"""
models.py — Pydantic v2 schemas
All request/response types for the FastAPI backend.
"""
from __future__ import annotations
from typing import Any
from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime


# ── AUTH ────────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    role: str
    full_name: str | None = None


# ── TICKETS ─────────────────────────────────────────────────────────
class Entity(BaseModel):
    text: str
    label: str
    start: int
    end: int


class TicketHeader(BaseModel):
    title: str
    category: str
    priority: str
    status: str


class TicketBody(BaseModel):
    description: str
    ai_extracted_entities: list[Entity] = []


class TicketMetadata(BaseModel):
    ai_confidence: float
    system: str
    timestamp: str


class TicketAIOutput(BaseModel):
    """Matches main.py output format exactly."""
    ticket_id: str
    header: TicketHeader
    body: TicketBody
    metadata: TicketMetadata


class TicketRow(BaseModel):
    """Database row — returned in list/detail views."""
    id: str
    ticket_id: str
    user_id: str | None
    title: str
    description: str
    category: str
    priority: str
    status: str
    entities: list[Entity] = []
    confidence: float
    created_at: str
    updated_at: str

    @field_validator("entities", mode="before")
    @classmethod
    def parse_entities(cls, v: Any) -> list[Entity]:
        import json
        if isinstance(v, str):
            try:
                v = json.loads(v)
            except Exception:
                return []
        if isinstance(v, list):
            return v
        return []


class CreateTicketRequest(BaseModel):
    description: str


class UpdateTicketRequest(BaseModel):
    title:       str | None = None
    description: str | None = None
    category:    str | None = None
    priority:    str | None = None
    status:      str | None = None


class PaginatedTickets(BaseModel):
    items: list[TicketRow]
    total: int
    page: int
    page_size: int
    pages: int


# ── ANALYTICS ───────────────────────────────────────────────────────
class CategoryStat(BaseModel):
    category: str
    count: int


class AnalyticsSummary(BaseModel):
    total: int
    open: int
    in_progress: int
    resolved: int
    closed: int
    manual_review: int
    avg_confidence: float
    by_category: list[CategoryStat]


# ── USERS ────────────────────────────────────────────────────────────
class UserProfile(BaseModel):
    id: str
    email: str
    full_name: str | None
    role: str
    created_at: str


class UpdateRoleRequest(BaseModel):
    role: str   # "user" | "admin"

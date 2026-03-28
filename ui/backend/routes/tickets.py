"""
routes/tickets.py — User-facing ticket endpoints
"""
from __future__ import annotations

import sys
from pathlib import Path
from fastapi import APIRouter, HTTPException, Depends, Query

# Path bootstrap: let us import create_it_ticket from main.py
_PROJECT_ROOT = Path(__file__).resolve().parents[3]
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

# Also add backend root for local imports
_BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(_BACKEND_ROOT))

from main import create_it_ticket

import database as db
from deps import get_current_user
from models import (
    CreateTicketRequest,
    UpdateTicketRequest,
    TicketRow,
    PaginatedTickets,
)

router = APIRouter(prefix="/api/tickets", tags=["tickets"])


@router.post("", status_code=201)
async def create_ticket(
    req: CreateTicketRequest,
    current_user: dict = Depends(get_current_user),
):
    if not req.description.strip():
        raise HTTPException(status_code=400, detail="Description cannot be empty")

    try:
        ai_output = create_it_ticket(req.description)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"AI engine error: {exc}")

    try:
        ticket = db.save_ticket(ai_output, user_id=current_user["id"])
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Database error: {exc}")

    db.add_log(current_user["id"], "ticket.created", target_id=ticket["id"])
    return {"ticket": ticket, "ai_output": ai_output}


@router.get("", response_model=PaginatedTickets)
async def list_my_tickets(
    status:    str | None = Query(None),
    page:      int        = Query(1, ge=1),
    page_size: int        = Query(10, ge=1, le=100),
    current_user: dict    = Depends(get_current_user),
):
    rows, total = db.list_tickets(
        user_id=current_user["id"],
        status=status,
        page=page,
        page_size=page_size,
    )
    pages = max(1, -(-total // page_size))  # ceiling div
    return PaginatedTickets(
        items=[TicketRow(**r) for r in rows],
        total=total, page=page, page_size=page_size, pages=pages,
    )


@router.get("/{ticket_id}", response_model=TicketRow)
async def get_ticket(
    ticket_id: str,
    current_user: dict = Depends(get_current_user),
):
    t = db.get_ticket_by_id(ticket_id) or db.get_ticket_by_ticket_id(ticket_id)
    if not t:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if current_user["role"] != "admin" and t.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    return t


@router.put("/{ticket_id}", response_model=TicketRow)
async def update_ticket(
    ticket_id: str,
    req: UpdateTicketRequest,
    current_user: dict = Depends(get_current_user),
):
    t = db.get_ticket_by_id(ticket_id) or db.get_ticket_by_ticket_id(ticket_id)
    if not t:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if current_user["role"] != "admin" and t.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    updated = db.update_ticket(t["id"], req.model_dump(exclude_none=True))
    db.add_log(current_user["id"], "ticket.updated", target_id=t["id"],
               meta=req.model_dump(exclude_none=True))
    return updated

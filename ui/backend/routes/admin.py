"""
routes/admin.py — Admin-only endpoints
"""
from __future__ import annotations

import sys
from pathlib import Path

_BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(_BACKEND_ROOT))

from fastapi import APIRouter, HTTPException, Depends, Query
import database as db
from deps import require_admin
from models import PaginatedTickets, TicketRow, UpdateTicketRequest, UpdateRoleRequest, AnalyticsSummary

router = APIRouter(prefix="/api/admin", tags=["admin"])


# ── TICKETS ───────────────────────────────────────────────────────────
@router.get("/tickets", response_model=PaginatedTickets)
async def admin_list_tickets(
    status:    str | None = Query(None),
    category:  str | None = Query(None),
    search:    str | None = Query(None),
    page:      int        = Query(1, ge=1),
    page_size: int        = Query(20, ge=1, le=100),
    _: dict               = Depends(require_admin),
):
    rows, total = db.list_tickets(
        status=status, category=category, search=search,
        page=page, page_size=page_size, admin=True,
    )
    pages = max(1, -(-total // page_size))
    return PaginatedTickets(
        items=[TicketRow(**r) for r in rows],
        total=total, page=page, page_size=page_size, pages=pages,
    )


@router.get("/tickets/{ticket_id}", response_model=TicketRow)
async def admin_get_ticket(ticket_id: str, _: dict = Depends(require_admin)):
    t = db.get_ticket_by_id(ticket_id) or db.get_ticket_by_ticket_id(ticket_id)
    if not t:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return t


@router.put("/tickets/{ticket_id}", response_model=TicketRow)
async def admin_update_ticket(
    ticket_id: str,
    req: UpdateTicketRequest,
    admin: dict = Depends(require_admin),
):
    t = db.get_ticket_by_id(ticket_id) or db.get_ticket_by_ticket_id(ticket_id)
    if not t:
        raise HTTPException(status_code=404, detail="Ticket not found")
    updated = db.update_ticket(t["id"], req.model_dump(exclude_none=True))
    db.add_log(admin["id"], "admin.ticket.updated", target_id=t["id"],
               meta=req.model_dump(exclude_none=True))
    return updated


@router.delete("/tickets/{ticket_id}", status_code=204)
async def admin_delete_ticket(ticket_id: str, admin: dict = Depends(require_admin)):
    t = db.get_ticket_by_id(ticket_id) or db.get_ticket_by_ticket_id(ticket_id)
    if not t:
        raise HTTPException(status_code=404, detail="Ticket not found")
    from database import get_conn
    with get_conn() as c:
        c.execute("DELETE FROM tickets WHERE id = ?", (t["id"],))
        c.commit()
    db.add_log(admin["id"], "admin.ticket.deleted", target_id=t["id"])


# ── ANALYTICS ─────────────────────────────────────────────────────────
@router.get("/analytics", response_model=AnalyticsSummary)
async def analytics(_: dict = Depends(require_admin)):
    return db.get_analytics()


# ── USERS ──────────────────────────────────────────────────────────────
@router.get("/users")
async def list_users(
    page:      int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    _: dict        = Depends(require_admin),
):
    users, total = db.list_users(page, page_size)
    pages = max(1, -(-total // page_size))
    return {"items": users, "total": total, "page": page, "page_size": page_size, "pages": pages}


@router.put("/users/{user_id}/role")
async def update_role(
    user_id: str,
    req: UpdateRoleRequest,
    admin: dict = Depends(require_admin),
):
    if req.role not in ("user", "admin"):
        raise HTTPException(status_code=400, detail="Role must be 'user' or 'admin'")
    db.update_user_role(user_id, req.role)
    db.add_log(admin["id"], "admin.role.updated", target_id=user_id, meta={"role": req.role})
    return {"success": True}


# ── LOGS ───────────────────────────────────────────────────────────────
@router.get("/logs")
async def activity_logs(
    page:      int = Query(1, ge=1),
    page_size: int = Query(30, ge=1, le=100),
    _: dict        = Depends(require_admin),
):
    logs, total = db.list_logs(page, page_size)
    return {"items": logs, "total": total}

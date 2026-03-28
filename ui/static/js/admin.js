/**
 * admin.js — Admin Panel Logic (Redesigned)
 * Handles: login, dashboard table + sidebar filters + search,
 *          ticket detail load, full save-all-changes action,
 *          logout → /landing redirect
 */

// ── SHARED HELPERS ─────────────────────────────────────────────
let _toastTimer = null;
function showToast(msg, type = "") {
  const t = document.getElementById("toast");
  if (!t) return;
  clearTimeout(_toastTimer);
  t.textContent = msg;
  t.className = "toast" + (type ? " " + type : "");
  t.classList.remove("hidden");
  _toastTimer = setTimeout(() => t.classList.add("hidden"), 3400);
}
function showEl(id)  { document.getElementById(id)?.classList.remove("hidden"); }
function hideEl(id)  { document.getElementById(id)?.classList.add("hidden"); }
function setText(id, v) { const e = document.getElementById(id); if (e) e.textContent = v || "—"; }
function escHtml(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
function setLoading(btnId, spinId, on) {
  const btn = document.getElementById(btnId);
  const sp  = document.getElementById(spinId);
  if (btn) btn.disabled = on;
  if (sp)  sp.classList.toggle("hidden", !on);
}

function applyPriorityBadge(el, priority) {
  if (!el) return;
  el.textContent = priority;
  el.className = "priority-badge";
  const p = (priority || "").toLowerCase();
  if (p.includes("p1"))      el.classList.add("p1");
  else if (p.includes("p2")) el.classList.add("p2");
  else                       el.classList.add("p3");
}

function applyStatusBadge(el, status) {
  if (!el) return;
  el.textContent = status;
  el.className = "status-badge";
  const s = (status || "").toLowerCase();
  if      (s.includes("in_progress"))   el.classList.add("s-inprogress");
  else if (s.includes("closed"))        el.classList.add("s-closed");
  else if (s.includes("resolved"))      el.classList.add("s-resolved");
  else if (s.includes("transferred"))   el.classList.add("s-transferred");
  else if (s.includes("manual_review")) el.classList.add("s-manual");
  else                                  el.classList.add("s-open");
}

/** Format "YYYY-MM-DD HH:MM:SS" → { date: "26 Mar 2026", time: "6:04 PM" } */
function splitTimestamp(ts) {
  if (!ts) return { date: "—", time: "—" };
  const [datePart, timePart] = ts.split(" ");
  const d = new Date(datePart + "T" + (timePart || "00:00:00"));
  const date = `${d.getDate()} ${d.toLocaleString("en-GB",{month:"short"})} ${d.getFullYear()}`;
  let time = "—";
  if (timePart) {
    const [h, m] = timePart.split(":");
    const hour = parseInt(h, 10);
    time = `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
  }
  return { date, time };
}

// ── ADMIN LOGOUT ───────────────────────────────────────────────
async function adminLogout() {
  try {
    const res  = await fetch("/api/admin/logout", { method: "POST" });
    const data = await res.json();
    window.location.href = data.redirect || "/landing";
  } catch {
    window.location.href = "/landing";
  }
}

// ═══════════════════════════════════════════════════════════════
//  ADMIN LOGIN PAGE
// ═══════════════════════════════════════════════════════════════
async function handleLogin(event) {
  event.preventDefault();
  const username = document.getElementById("username")?.value.trim();
  const password = document.getElementById("password")?.value.trim();

  hideEl("login-error");
  setLoading("login-btn", "login-spinner", true);

  try {
    const res  = await fetch("/api/admin/login", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ username, password }),
    });
    const data = await res.json();

    if (res.ok && data.success) {
      showToast("Login successful!", "success");
      setTimeout(() => { window.location.href = "/admin"; }, 500);
    } else {
      document.getElementById("error-msg").textContent = data.error || "Invalid credentials.";
      showEl("login-error");
    }
  } catch {
    showToast("Network error. Is the server running?", "error");
  } finally {
    setLoading("login-btn", "login-spinner", false);
  }
}

// ═══════════════════════════════════════════════════════════════
//  ADMIN DASHBOARD
// ═══════════════════════════════════════════════════════════════
let _allTickets   = [];   // full list cached for search
let _currentFilter = "";  // current status filter

async function loadTickets(statusFilter) {
  _currentFilter = statusFilter || "";
  showEl("table-loading");
  hideEl("empty-state");

  const url = _currentFilter
    ? `/api/tickets?status=${encodeURIComponent(_currentFilter)}`
    : "/api/tickets";

  try {
    const res     = await fetch(url);
    _allTickets   = await res.json();
    renderTable(_allTickets);
  } catch {
    showToast("Failed to load tickets.", "error");
  } finally {
    hideEl("table-loading");
  }
}

function onSearch() {
  const q = (document.getElementById("search-input")?.value || "").trim().toUpperCase();
  const filtered = q ? _allTickets.filter(t => t.ticket_id.includes(q)) : _allTickets;
  renderTable(filtered);
}

function renderTable(tickets) {
  const tbody = document.getElementById("tickets-tbody");
  if (!tbody) return;

  const count = document.getElementById("ticket-count");
  if (count) count.textContent = tickets.length === 1 ? "1" : `${tickets.length}`;

  if (tickets.length === 0) {
    showEl("empty-state");
    if (tbody) tbody.innerHTML = "";
    return;
  }
  hideEl("empty-state");

  tbody.innerHTML = tickets.map(t => {
    const pClass = t.priority.toLowerCase().includes("p1") ? "p1"
                 : t.priority.toLowerCase().includes("p2") ? "p2" : "p3";

    const sClass = (() => {
      const s = (t.status || "").toLowerCase();
      if (s.includes("in_progress"))   return "s-inprogress";
      if (s.includes("closed"))        return "s-closed";
      if (s.includes("resolved"))      return "s-resolved";
      if (s.includes("transferred"))   return "s-transferred";
      if (s.includes("manual_review")) return "s-manual";
      return "s-open";
    })();

    const { date, time } = splitTimestamp(t.timestamp);

    return `
      <tr>
        <td class="tid-cell">${escHtml(t.ticket_id)}</td>
        <td class="title-cell" title="${escHtml(t.title)}">${escHtml(t.title)}</td>
        <td>${escHtml(t.category)}</td>
        <td><span class="priority-badge ${pClass}">${escHtml(t.priority)}</span></td>
        <td><span class="status-badge ${sClass}">${escHtml(t.status)}</span></td>
        <td class="ts-date">${date}</td>
        <td class="ts-time">${time}</td>
        <td>
          <button class="btn btn-outline btn-sm"
            onclick="window.location.href='/admin/ticket/${encodeURIComponent(t.ticket_id)}'">
            View
          </button>
        </td>
      </tr>`;
  }).join("");
}

function applyFilter(btn, status) {
  document.querySelectorAll(".asb-item").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  document.getElementById("search-input") && (document.getElementById("search-input").value = "");
  loadTickets(status);
}

// Auto-load on dashboard
if (document.getElementById("tickets-tbody")) {
  loadTickets("");
}

// ═══════════════════════════════════════════════════════════════
//  ADMIN TICKET DETAIL
// ═══════════════════════════════════════════════════════════════
if (typeof TICKET_ID !== "undefined") {
  loadTicketDetail(TICKET_ID);
}

async function loadTicketDetail(id) {
  hideEl("detail-content");
  hideEl("detail-error");

  try {
    const res = await fetch(`/api/ticket/${encodeURIComponent(id)}`);
    const t   = await res.json();

    if (!res.ok) {
      document.getElementById("detail-error-msg").textContent = t.error || "Ticket not found.";
      showEl("detail-error");
      hideEl("detail-loading");
      return;
    }

    populateDetail(t);
    hideEl("detail-loading");
    showEl("detail-content");
  } catch {
    document.getElementById("detail-error-msg").textContent = "Network error loading ticket.";
    showEl("detail-error");
    hideEl("detail-loading");
  }
}

function populateDetail(t) {
  // IDs and badges
  setText("d-ticket-id",   t.ticket_id);
  setText("d-title",       t.title);
  setText("d-category",    t.category);
  setText("d-status-text", t.status);
  setText("d-description", t.description);

  applyPriorityBadge(document.getElementById("d-priority"),     t.priority);
  applyStatusBadge(document.getElementById("d-status-badge"),   t.status);

  // Formatted date + time separately
  const { date, time } = splitTimestamp(t.timestamp);
  setText("d-date", date);
  setText("d-time", time);

  // Confidence bar
  const pct = Math.round((t.confidence || 0) * 100);
  setText("d-confidence", `${pct}%`);
  const bar = document.getElementById("d-conf-bar");
  if (bar) bar.style.width = `${pct}%`;

  // Pre-fill edit form
  const ef = v => document.getElementById(v);
  if (ef("edit-title"))    ef("edit-title").value    = t.title    || "";
  if (ef("edit-category")) ef("edit-category").value = t.category  || "";
  if (ef("edit-priority")) ef("edit-priority").value = t.priority  || "";
  if (ef("edit-status"))   ef("edit-status").value   = t.status    || "";

  // Entity chips (text only — no labels/positions)
  const entities = Array.isArray(t.entities) ? t.entities : [];
  const chipsWrap = document.getElementById("entity-chips");
  const noEnt     = document.getElementById("no-entities");

  if (entities.length === 0) {
    noEnt?.classList.remove("hidden");
    if (chipsWrap) chipsWrap.innerHTML = "";
  } else {
    noEnt?.classList.add("hidden");
    if (chipsWrap) {
      chipsWrap.innerHTML = entities
        .map(e => `<span class="entity-chip-text">${escHtml(e.text)}</span>`)
        .join("");
    }
  }
}

// ── SAVE ALL CHANGES (single button for all fields) ───────────
async function saveChanges() {
  if (typeof TICKET_ID === "undefined") return;

  const payload = {
    ticket_id: TICKET_ID,
    title:     document.getElementById("edit-title")?.value.trim()    || "",
    category:  document.getElementById("edit-category")?.value.trim() || "",
    priority:  document.getElementById("edit-priority")?.value.trim() || "",
    status:    document.getElementById("edit-status")?.value.trim()   || "",
  };

  // Remove empty values — only send fields that were actually chosen
  Object.keys(payload).forEach(k => { if (!payload[k] && k !== "ticket_id") delete payload[k]; });

  setLoading("save-btn", "save-spinner", true);

  try {
    const res  = await fetch("/api/ticket/update", {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });
    const data = await res.json();

    if (res.ok && data.success) {
      // Refresh the displayed values without full reload
      if (payload.title)    setText("d-title",       payload.title);
      if (payload.category) setText("d-category",    payload.category);
      if (payload.priority) applyPriorityBadge(document.getElementById("d-priority"), payload.priority);
      if (payload.status) {
        applyStatusBadge(document.getElementById("d-status-badge"), payload.status);
        setText("d-status-text", payload.status);
      }
      showToast("Ticket updated successfully!", "success");
    } else {
      showToast(data.error || "Update failed.", "error");
    }
  } catch {
    showToast("Network error.", "error");
  } finally {
    setLoading("save-btn", "save-spinner", false);
  }
}

// ── MARK RESOLVED (shortcut) ──────────────────────────────────
async function markResolved() {
  if (typeof TICKET_ID === "undefined") return;

  try {
    const res  = await fetch("/api/ticket/update", {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ ticket_id: TICKET_ID, status: "RESOLVED" }),
    });
    const data = await res.json();

    if (res.ok && data.success) {
      applyStatusBadge(document.getElementById("d-status-badge"), "RESOLVED");
      setText("d-status-text", "RESOLVED");
      const sel = document.getElementById("edit-status");
      if (sel) sel.value = "RESOLVED";
      showToast("Ticket marked as RESOLVED.", "success");
    } else {
      showToast(data.error || "Update failed.", "error");
    }
  } catch {
    showToast("Network error.", "error");
  }
}

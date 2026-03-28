/**
 * main.js — User Portal Logic (Redesigned)
 * Raise Ticket: show ONLY success + Ticket ID
 * Track Ticket: show Title, Category, Priority, Status, Timestamp ONLY
 */

// ── CHAR COUNTER ──────────────────────────────────────────────
const issueInput = document.getElementById("issue-input");
if (issueInput) {
  issueInput.addEventListener("input", () => {
    document.getElementById("char-count").textContent = issueInput.value.length;
  });
}

// ── TAB SWITCHING ─────────────────────────────────────────────
function switchTab(tab) {
  document.getElementById("panel-raise").classList.toggle("hidden", tab !== "raise");
  document.getElementById("panel-track").classList.toggle("hidden", tab !== "track");
  document.getElementById("tab-raise").classList.toggle("active", tab === "raise");
  document.getElementById("tab-track").classList.toggle("active", tab === "track");
}

// ── RAISE TICKET ──────────────────────────────────────────────
async function raiseTicket() {
  const description = (issueInput?.value || "").trim();
  if (!description) {
    showToast("Please describe your issue first.", "error");
    issueInput?.focus();
    return;
  }

  setLoading("raise-btn", "raise-spinner", true);
  hideEl("success-card");

  try {
    const res  = await fetch("/api/create-ticket", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ description }),
    });
    const data = await res.json();

    if (!res.ok) {
      showToast(data.error || "Failed to create ticket.", "error");
      return;
    }

    // Show ONLY the success card with ticket ID
    setText("res-ticket-id", data.ticket_id);
    showEl("success-card");
    hideEl("raise-form-card");
    showToast("Ticket created successfully!", "success");

    // Store ID for "Track This Ticket" button
    window._lastTicketId = data.ticket_id;
  } catch (err) {
    showToast("Network error. Is the server running?", "error");
  } finally {
    setLoading("raise-btn", "raise-spinner", false);
  }
}

function resetForm() {
  showEl("raise-form-card");
  hideEl("success-card");
  if (issueInput) {
    issueInput.value = "";
    document.getElementById("char-count").textContent = "0";
  }
  window._lastTicketId = null;
}

function trackThisTicket() {
  // Pre-fill the track input and switch tab
  const id = window._lastTicketId;
  switchTab("track");
  if (id) {
    const inp = document.getElementById("track-input");
    if (inp) inp.value = id;
    trackTicket();
  }
}

// ── COPY TICKET ID ────────────────────────────────────────────
function copyTicketId() {
  const id = document.getElementById("res-ticket-id")?.textContent;
  if (!id || id === "—") return;
  navigator.clipboard.writeText(id).then(() => {
    showToast(`Copied: ${id}`, "success");
    const btn = document.getElementById("copy-btn");
    if (btn) { btn.textContent = "✓ Copied"; setTimeout(() => { btn.textContent = "📋 Copy"; }, 2000); }
  }).catch(() => showToast("Copy failed — please copy manually.", "error"));
}

// ── TRACK TICKET ──────────────────────────────────────────────
async function trackTicket() {
  const id = (document.getElementById("track-input")?.value || "").trim().toUpperCase();
  if (!id) { showToast("Please enter a Ticket ID.", "error"); return; }

  setLoading("track-btn", "track-spinner", true);
  hideEl("track-result");

  try {
    const res  = await fetch(`/api/ticket/${encodeURIComponent(id)}`);
    const data = await res.json();

    if (!res.ok) {
      showToast(data.error || "Ticket not found.", "error");
      return;
    }

    renderTrackResult(data);
  } catch (err) {
    showToast("Network error.", "error");
  } finally {
    setLoading("track-btn", "track-spinner", false);
  }
}

function renderTrackResult(t) {
  setText("trk-ticket-id", t.ticket_id);
  setText("trk-title",     t.title);
  setText("trk-category",  t.category);
  setText("trk-timestamp", formatTimestamp(t.timestamp));

  applyPriorityBadge("trk-priority", t.priority);
  applyStatusBadge("trk-status",     t.status);

  showEl("track-result");
  document.getElementById("track-result")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// ── SHARED HELPERS ─────────────────────────────────────────────
function applyPriorityBadge(id, priority) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = priority;
  el.className = "priority-badge";
  const p = (priority || "").toLowerCase();
  if (p.includes("p1")) el.classList.add("p1");
  else if (p.includes("p2")) el.classList.add("p2");
  else el.classList.add("p3");
}

function applyStatusBadge(id, status) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = status;
  el.className = "status-badge";
  const s = (status || "").toLowerCase();
  if      (s.includes("in_progress"))    el.classList.add("s-inprogress");
  else if (s.includes("closed"))         el.classList.add("s-closed");
  else if (s.includes("resolved"))       el.classList.add("s-resolved");
  else if (s.includes("transferred"))    el.classList.add("s-transferred");
  else if (s.includes("manual_review"))  el.classList.add("s-manual");
  else                                   el.classList.add("s-open");
}

function formatTimestamp(ts) {
  if (!ts) return "—";
  // ts is "YYYY-MM-DD HH:MM:SS"
  const [datePart, timePart] = ts.split(" ");
  if (!datePart) return ts;
  const d = new Date(datePart + "T" + (timePart || "00:00:00"));
  const day   = d.getDate();
  const month = d.toLocaleString("en-GB", { month: "short" });
  const year  = d.getFullYear();
  const time  = timePart
    ? (() => {
        const [h, m] = timePart.split(":");
        const hour   = parseInt(h, 10);
        const ampm   = hour >= 12 ? "PM" : "AM";
        const h12    = hour % 12 || 12;
        return `${h12}:${m} ${ampm}`;
      })()
    : "";
  return `${day} ${month} ${year}${time ? ", " + time : ""}`;
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value || "—";
}
function showEl(id)  { document.getElementById(id)?.classList.remove("hidden"); }
function hideEl(id)  { document.getElementById(id)?.classList.add("hidden"); }
function setLoading(btnId, spinId, on) {
  const btn = document.getElementById(btnId);
  const sp  = document.getElementById(spinId);
  if (btn) btn.disabled = on;
  if (sp)  sp.classList.toggle("hidden", !on);
}

// ── TOAST ──────────────────────────────────────────────────────
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

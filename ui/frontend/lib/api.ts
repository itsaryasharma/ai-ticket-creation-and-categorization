/**
 * lib/api.ts — Typed API client for FastAPI backend
 * All calls go to http://localhost:8000 in dev
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function getAuthHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Request failed");
  }
  // 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── AUTH ────────────────────────────────────────────────────────────────────
export interface AuthPayload {
  access_token: string;
  token_type: string;
  user_id: string;
  email: string;
  role: string;
  full_name?: string;
}

export const api = {
  auth: {
    register: (body: { email: string; password: string; full_name?: string }) =>
      request<AuthPayload>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(body),
      }),

    login: (body: { email: string; password: string }) =>
      request<AuthPayload>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(body),
      }),

    me: () => request<{ id: string; email: string; full_name?: string; role: string }>("/api/auth/me"),
  },

  // ── USER TICKETS ──────────────────────────────────────────────────────────
  tickets: {
    create: (description: string) =>
      request<{ ticket: Ticket; ai_output: AIOutput }>("/api/tickets", {
        method: "POST",
        body: JSON.stringify({ description }),
      }),

    list: (params?: { status?: string; page?: number; page_size?: number }) => {
      const q = new URLSearchParams();
      if (params?.status) q.set("status", params.status);
      if (params?.page) q.set("page", String(params.page));
      if (params?.page_size) q.set("page_size", String(params.page_size));
      return request<PaginatedTickets>(`/api/tickets?${q}`);
    },

    get: (id: string) => request<Ticket>(`/api/tickets/${id}`),

    update: (id: string, body: Partial<Pick<Ticket, "title" | "category" | "priority" | "status">>) =>
      request<Ticket>(`/api/tickets/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
  },

  // ── ADMIN ─────────────────────────────────────────────────────────────────
  admin: {
    listTickets: (params?: {
      status?: string; category?: string; search?: string;
      page?: number; page_size?: number;
    }) => {
      const q = new URLSearchParams();
      if (params?.status)   q.set("status",    params.status);
      if (params?.category) q.set("category",  params.category);
      if (params?.search)   q.set("search",    params.search);
      if (params?.page)     q.set("page",      String(params.page));
      if (params?.page_size) q.set("page_size", String(params.page_size));
      return request<PaginatedTickets>(`/api/admin/tickets?${q}`);
    },

    getTicket: (id: string) => request<Ticket>(`/api/admin/tickets/${id}`),

    updateTicket: (id: string, body: Partial<Pick<Ticket, "title" | "description" | "category" | "priority" | "status">>) =>
      request<Ticket>(`/api/admin/tickets/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),

    deleteTicket: (id: string) =>
      request<void>(`/api/admin/tickets/${id}`, { method: "DELETE" }),

    analytics: () => request<Analytics>("/api/admin/analytics"),

    listUsers: (params?: { page?: number }) => {
      const q = new URLSearchParams();
      if (params?.page) q.set("page", String(params.page));
      return request<{ items: UserProfile[]; total: number }>(`/api/admin/users?${q}`);
    },

    updateRole: (userId: string, role: "user" | "admin") =>
      request<{ success: boolean }>(`/api/admin/users/${userId}/role`, {
        method: "PUT",
        body: JSON.stringify({ role }),
      }),

    logs: () => request<{ items: ActivityLog[]; total: number }>("/api/admin/logs"),
  },

  health: () => request<{ status: string }>("/api/health"),
};

// ── TYPES (from models.py) ─────────────────────────────────────────────────
export interface Entity {
  text: string;
  label: string;
  start: number;
  end: number;
}

export interface Ticket {
  id: string;
  ticket_id: string;
  user_id: string | null;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  entities: Entity[];
  confidence: number;
  created_at: string;
  updated_at: string;
}

export interface PaginatedTickets {
  items: Ticket[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface AIOutput {
  ticket_id: string;
  header: { title: string; category: string; priority: string; status: string };
  body: { description: string; ai_extracted_entities: Entity[] };
  metadata: { ai_confidence: number; system: string; timestamp: string };
}

export interface Analytics {
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
  manual_review: number;
  avg_confidence: number;
  by_category: { category: string; count: number }[];
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  actor_id: string;
  action: string;
  target_id?: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

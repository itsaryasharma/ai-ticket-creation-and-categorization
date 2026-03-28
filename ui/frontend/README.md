# TicketAI — Frontend

Modern, production-grade frontend for the AI-Powered IT Ticket System. Built with **Next.js 14** (App Router), **TypeScript**, **Tailwind CSS**, and **ShadCN UI**.

---

## Tech Stack

| Technology | Purpose |
|---|---|
| **Next.js 14** (App Router) | React framework, file-based routing, SSR/CSR |
| **TypeScript** | Static typing throughout |
| **Tailwind CSS v4** | Utility-first styling |
| **ShadCN UI** | Accessible, composable UI components |
| **TanStack Query v5** | Server state management, caching, mutations |
| **Framer Motion** | Smooth animations and transitions |
| **next-themes** | Dark / Light mode system |
| **Sonner** | Toast notifications |
| **Lucide React** | Icon set |

---

## Folder Structure

```
frontend/
├── app/
│   ├── layout.tsx              # Root layout – mounts Providers
│   ├── page.tsx                # / → redirects to /landing
│   ├── landing/
│   │   └── page.tsx            # Public landing page
│   ├── login/
│   │   └── page.tsx            # Login page
│   ├── register/
│   │   └── page.tsx            # Registration page
│   ├── dashboard/
│   │   ├── layout.tsx          # Auth guard + sidebar layout
│   │   └── page.tsx            # User dashboard (raise ticket, tracker, history)
│   ├── tickets/
│   │   ├── layout.tsx          # Auth guard + sidebar layout
│   │   ├── page.tsx            # User ticket list
│   │   └── [id]/
│   │       └── page.tsx        # User ticket detail (read + clean view)
│   └── admin/
│       ├── layout.tsx          # Admin-only auth guard + sidebar layout
│       ├── page.tsx            # Admin dashboard (analytics, table, inline status update)
│       └── tickets/
│           └── [id]/
│               └── page.tsx    # Admin ticket detail (full edit, save)
├── components/
│   ├── layout/
│   │   └── AppSidebar.tsx      # Shared sidebar (nav, user info, logout)
│   ├── shared/
│   │   └── Badges.tsx          # PriorityBadge, StatusBadge, EntityChip, ConfidenceBar
│   ├── auth/
│   │   └── AuthCard.tsx        # Shared glass card for login/register
│   └── ui/                     # ShadCN components (auto-generated)
├── context/
│   └── AuthContext.tsx         # Global auth state (user, token, login, logout, isAdmin)
├── lib/
│   ├── api.ts                  # All API functions + TypeScript types
│   ├── providers.tsx           # Wraps app: QueryClient, ThemeProvider, AuthProvider, Toaster
│   └── utils.ts                # cn() utility
├── public/
└── .env.local                  # NEXT_PUBLIC_API_URL
```

---

## Environment Variables

Create `.env.local` in the `frontend/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Running Locally

```bash
# From the project root
cd ui/frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs on **http://localhost:3000**

> The FastAPI backend must also be running on **http://localhost:8000**. See root README.

---

## How Frontend Connects to Backend

All API calls are defined in `lib/api.ts`. The base URL is read from `NEXT_PUBLIC_API_URL`.

```typescript
// lib/api.ts — example
const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("access_token");
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
```

### Key API Endpoints Used

| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/register` | POST | Create user account |
| `/api/auth/login` | POST | Login → returns JWT |
| `/api/tickets` | POST | Raise ticket (AI processes) |
| `/api/tickets` | GET | List current user's tickets |
| `/api/tickets/{id}` | GET | Get single ticket |
| `/api/admin/tickets` | GET | Admin: list all tickets |
| `/api/admin/tickets/{id}` | GET | Admin: get ticket detail |
| `/api/admin/tickets/{id}` | PUT | Admin: update ticket fields |
| `/api/admin/analytics` | GET | Admin: summary statistics |

---

## Authentication Flow

1. **Login** → `POST /api/auth/login` → JWT returned
2. JWT stored in `localStorage` as `access_token`
3. `AuthContext` decodes token → stores `user`, `role`
4. `isAdmin` computed from `role === "admin"`
5. Dashboard/Tickets layouts redirect to `/login` if not authenticated
6. Admin layout redirects to `/dashboard` if not admin

---

## Role-Based Access

| Role | Access |
|---|---|
| `user` | Dashboard, My Tickets, Ticket Detail (read-only) |
| `admin` | All user pages + Admin Dashboard + Admin Ticket Edit |

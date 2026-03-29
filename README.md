# TicketAI — AI-Powered IT Ticket Creation and Categorization

<div align="center">

**Transform unstructured IT complaints into structured, prioritized support tickets — automatically.**

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue?style=flat-square)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688?style=flat-square)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?style=flat-square)](https://tailwindcss.com)

</div>

---

## Problem Statement

IT support teams deal with a high volume of unstructured complaints daily — emails, chat messages, verbal reports. Manually reading, categorizing, prioritizing, and routing each ticket wastes significant time and leads to:

- Tickets filed in wrong categories
- Critical issues getting buried in low-priority queues
- Inconsistent priority assignment across teams
- Slow response and resolution times

---

## Solution

**TicketAI** is an AI-driven IT ticket intelligence system that:

1. Accepts a plain-language issue description from any user
2. Automatically **classifies** it into one of 6 IT support categories
3. **Extracts key entities** (software, hardware, people, errors) from the description
4. **Assigns priority** (P1 Critical / P2 Medium / P3 Low) based on issue severity
5. Generates a **structured, traceable ticket** instantly
6. Provides admins with full **edit, override, and management** capabilities

---

## Key Features

### For Users
- 🎫 Raise a ticket by simply describing the problem in plain text
- 🔍 Track ticket status using the Ticket ID
- 📋 View full ticket history with status and priority

### For Admins
- 📊 Analytics dashboard — total, open, resolved, manual review counts
- 🗂️ Filter tickets by status and category
- ✏️ Edit any ticket field (title, description, category, priority, status)
- 🔄 Update ticket status inline from the ticket table
- 🧩 View AI-extracted entities in clean label:text format

### AI Engine
- 📐 **SVM Classification** — Trained on IT support data, classifies into 6 categories
- 🏷️ **Named Entity Recognition (spaCy)** — Extracts software, hardware, person, error entities
- ⚡ **Priority Automation** — Business rules + ML confidence thresholds
- ❓ **Confidence Scoring** — Low-confidence tickets flagged for manual review

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          USER BROWSER                            │
│          Next.js 14 · TypeScript · Tailwind · ShadCN            │
└───────────────────────────┬─────────────────────────────────────┘
                            │  HTTP/REST (JWT Bearer)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                         FastAPI (port 8000)                      │
│   /api/auth  ·  /api/tickets  ·  /api/admin  ·  /api/docs       │
└──────────┬──────────────────────────────────────────────────────┘
           │                                 │
           ▼                                 ▼
┌──────────────────┐               ┌─────────────────────────────┐
│   SQLite DB      │               │       AI Engine (Python)     │
│  (WAL mode)      │               │   main.py → create_it_ticket │
│  Users · Tickets │               │   SVM + spaCy NER + Rules    │
└──────────────────┘               └─────────────────────────────┘
```

---

## Tech Stack

### Backend
| Component | Technology |
|---|---|
| API Framework | FastAPI (Python) |
| Authentication | JWT via `python-jose`, passwords via `bcrypt` |
| Database | SQLite (WAL mode) — Supabase-ready |
| AI Classification | Scikit-learn SVM |
| Entity Extraction | spaCy NER |
| Validation | Pydantic v2 |

### Frontend
| Component | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + ShadCN UI |
| State Management | TanStack Query v5 + React Context |
| Animations | Framer Motion |
| Theme | next-themes (dark/light) |
| Notifications | Sonner |

---

## Project Structure

```
ai-ticket-creation-and-categorization/
├── main.py                  # Core AI engine — create_it_ticket()
├── model/
│   ├── classification/      # Trained SVM model + inference
│   └── ner/                 # spaCy NER model + training
├── data/                    # Training data and datasets
├── ui/
│   ├── backend/             # FastAPI application
│   │   ├── main_api.py      # App entry point + CORS + router mounts
│   │   ├── routes/
│   │   │   ├── auth.py      # /api/auth — register, login
│   │   │   ├── tickets.py   # /api/tickets — user ticket CRUD
│   │   │   └── admin.py     # /api/admin — admin dashboard, analytics
│   │   ├── database.py      # SQLite connection, all DB operations
│   │   ├── models.py        # Pydantic request/response schemas
│   │   ├── auth_utils.py    # bcrypt hash/verify, JWT creation
│   │   └── deps.py          # FastAPI dependencies (auth, admin guard)
│   └── frontend/            # Next.js application (see ui/frontend/README.md)
└── README.md
```

---

## Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+
- Git

### 1. Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/ai-ticket-creation-and-categorization.git
cd ai-ticket-creation-and-categorization
```

### 2. Backend Setup

```bash
# Create and activate virtual environment
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate

# Install dependencies
pip install fastapi uvicorn passlib python-jose[cryptography] python-multipart \
            pydantic[email] bcrypt scikit-learn spacy

# Create backend .env (optional — defaults work for local dev)
echo "JWT_SECRET=your-secret-key-here" > ui/backend/.env

# Start the backend
cd ui/backend
uvicorn main_api:app --reload --port 8000
```

Backend runs at: **http://localhost:8000**  
API Docs (Swagger): **http://localhost:8000/api/docs**

### 3. Frontend Setup

```bash
# In a new terminal
cd ui/frontend

# Install dependencies
npm install

# Create environment file
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Start dev server
npm run dev
```

Frontend runs at: **http://localhost:3000**

### 4. Create Admin Account

```bash
# Register normally at http://localhost:3000/login
# Then promote to admin:
.venv\Scripts\python.exe -c "
import sys; sys.path.insert(0, 'ui/backend')
from database import get_conn, update_user_role
with get_conn() as c:
    users = c.execute('SELECT id, email FROM users').fetchall()
    for u in users:
        print(u['email'], u['id'])
    # Promote your user:
    update_user_role('YOUR_USER_UUID_HERE', 'admin')
    print('Done')
"
```

---

## Demo Flow

1. **Landing page** → `http://localhost:3000` (or `/landing`)
2. **Register** → Create an account
3. **Dashboard** → Describe an IT issue (e.g. *"My VPN disconnects every 30 minutes on Windows 11"*)
4. **Ticket Created** → Ticket ID shown, copy for tracking
5. **Track** → Enter ticket ID in the tracker → see category, priority, status
6. **My Tickets** → Full ticket list with click-through detail
7. **Admin** (after promotion) → Full analytics dashboard, inline status updates, ticket editing

---

## AI Output Format

Every ticket generated by `main.py` follows this structure:

```json
{
  "ticket_id": "TIC-A1B2C3D4",
  "header": {
    "title": "Network Issue: VPN disconnects on Windows 11",
    "category": "Network Issue",
    "priority": "P1 - Critical",
    "status": "OPEN (AUTO_ASSIGN)"
  },
  "body": {
    "description": "User input text...",
    "ai_extracted_entities": [
      {"text": "VPN", "label": "SOFTWARE", "start": 3, "end": 6},
      {"text": "Windows 11", "label": "OS", "start": 28, "end": 38}
    ]
  },
  "metadata": {
    "ai_confidence": 0.87,
    "system": "Hybrid-IT-Support-v3.0",
    "timestamp": "2026-03-27 01:05:00"
  }
}
```

This JSON is the **single source of truth** — stored in SQLite and served directly to the frontend.

---

## License

This project was developed as part of the **Infosys Springboard 6.0 AI Internship Program**.

---

<div align="center">
Built with ❤️ using FastAPI · Next.js 14 · Python AI/ML
</div>

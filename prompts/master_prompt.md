# AI Operations Platform — Master Project Prompt
**Version:** 1.0  
**Stack:** React + Node.js + Python FastAPI + LangGraph  
**Scope:** Internship project — demo-ready, all free tiers

---

## What You Are Building

An AI-powered operations platform for Indian SMBs. Businesses connect their WhatsApp, upload leads via Excel, feed the AI their company knowledge base, and autonomous agents handle outbound lead engagement, customer support, appointment booking, and content/marketing generation — all from one dashboard.

---

## Monorepo Structure

```
/ai-ops-platform
├── /frontend          React 18 + Vite + Tailwind CSS + Framer Motion + GSAP
├── /backend           Node.js + Express + Prisma ORM + PostgreSQL
├── /ai-service        Python 3.11 + FastAPI + LangGraph + LangChain + ChromaDB
├── .env.example
├── .gitignore
└── README.md
```

**Strict separation of concerns:**
- `/frontend` — UI only. No business logic. Talks to `/backend` via REST + SSE.
- `/backend` — API gateway, auth, data layer, WhatsApp webhook handler, job scheduler. Never imports from `/ai-service` directly — communicates via HTTP.
- `/ai-service` — All AI logic. LangGraph agents, RAG pipeline, embeddings. Knows nothing about auth or the frontend.

---

## Core Modules

### Module 1 — Lead Engagement Agent (Primary)
1. Business uploads `.xlsx` / `.csv` file of leads
2. Frontend parses file with SheetJS, shows column mapping UI
3. Business maps: Name column, Phone column, any custom fields
4. Backend validates phones (E.164 format), checks for duplicates
5. Campaign configured: agent tone, send time window, follow-up schedule, KB attached
6. On launch — backend queues outbound messages, sends via Twilio WhatsApp Sandbox
7. Lead receives message, replies — Twilio webhook fires to `/webhook/whatsapp/incoming`
8. Backend identifies lead, calls AI service `/agent/message`
9. LangGraph agent loads conversation state (PostgresSaver), generates contextual reply
10. Agent uses RAG tool to answer from business knowledge base
11. Qualification score updates silently (0–4) after every message
12. Score >= 3 OR lead says "call me / speak to someone" → hot lead detected
13. Backend notifies sales rep (dashboard alert + SSE push)
14. Sales rep clicks "Take Over" → agent pauses, rep types in same thread
15. Follow-up scheduler: if no reply Day 1, Day 3, Day 7 → send template message

### Module 2 — Conversation Agent (Support + Internal FAQ)
- Same LangGraph graph as Lead Agent, different system prompt + KB injected at runtime
- Mode: Customer Support — handles inbound product/order/complaint queries
- Mode: Internal FAQ — answers employee questions from HR/policy docs
- Escalates unresolved queries with full thread context

### Module 3 — Appointment Booking Agent
- Connects Google Calendar via OAuth 2.0
- Reads real-time available slots
- Books, reschedules, cancels via WhatsApp chat
- Sends confirmation + reminders (24hr, 1hr before)

### Module 4 — Content & Marketing Studio
- Mode A: Campaign Generator — brief input → full multi-platform campaign package
- Mode B: Content Repurposing — blog/transcript/topic → platform-specific posts
- Outputs: WhatsApp broadcast, Instagram caption, LinkedIn post, Google Business, SMS, email section
- Content calendar suggestion per piece
- Copy-to-clipboard per output block

### Module 5 — Knowledge Base (Shared)
- PDF / doc / URL upload per business
- Auto-chunked, embedded (Mistral Embed), stored in ChromaDB
- Isolated collection per business (UUID-based collection names)
- On re-upload: delete old collection, re-embed fresh — never append stale chunks
- All agents retrieve from this shared KB

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion, GSAP |
| Backend | Node.js, Express, Prisma ORM, PostgreSQL (Supabase free) |
| AI Service | Python 3.11, FastAPI, LangGraph, LangChain Core |
| LLM | Gemini 2.5 Flash (`gemini-2.5-flash`) |
| Embeddings | Mistral Embed (`mistral-embed`) |
| Vector DB | ChromaDB (persistent local client) |
| WhatsApp | Twilio WhatsApp Sandbox (free) + Simulated chat UI |
| Auth | Custom JWT (access token 15min + refresh token 7d) |
| Real-time | SSE (Server-Sent Events) for activity feed + agent typing |
| Scheduler | node-cron for follow-up jobs |
| Calendar | Google Calendar API (OAuth 2.0) |
| File Storage | Cloudinary (free tier) |
| State Mgmt | Zustand (frontend) |
| Data Fetching | TanStack React Query |
| Icons | Lucide React |
| Charts | Recharts |

---

## Critical LangChain Rules

**NEVER use `langchain_community`** — it is deprecated in this environment.  
Always use direct library imports:

```python
# CORRECT
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_mistralai import MistralAIEmbeddings
from langchain_core.tools import tool
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate
import chromadb                          # direct chromadb import
from pypdf import PdfReader              # direct pypdf import

# NEVER
from langchain_community.llms import ...
from langchain_community.embeddings import ...
from langchain_community.vectorstores import ...
```

ChromaDB collection names must be UUID-based:
```python
import uuid
collection_name = f"kb_{str(uuid.uuid4()).replace('-', '_')}"
```

---

## Environment Variables

```env
# /backend/.env
DATABASE_URL=postgresql://...
JWT_SECRET=your_secret_key
JWT_REFRESH_SECRET=your_refresh_secret
AI_SERVICE_URL=http://localhost:8000
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
CLOUDINARY_URL=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
PORT=3001

# /ai-service/.env
GEMINI_API_KEY=...
MISTRAL_API_KEY=...
DATABASE_URL=postgresql://...   # same DB — for PostgresSaver checkpointing
CHROMA_PERSIST_PATH=./chroma_db
PORT=8000
```

---

## Inter-Service Communication

```
Frontend (3000)  ←→  Backend (3001)  ←→  AI Service (8000)
                          ↕
                     PostgreSQL
                          ↕
                   AI Service (8000)
                          ↕
                      ChromaDB
```

Backend calls AI service:
```js
// backend/services/agentService.js
const response = await fetch(`${process.env.AI_SERVICE_URL}/agent/message`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ thread_id, business_id, lead_id, message, kb_id })
});
```

AI service returns:
```json
{
  "reply": "string",
  "stage": "nurturing | qualified | cold | handoff",
  "qualification_score": 2,
  "needs_human": false,
  "intent_signals": ["asked_price", "mentioned_timeline"]
}
```

---

## SSE — Real-time Events

Backend maintains SSE connections per business. Pushes events when:
- Agent qualifies a lead
- Hot lead detected
- New message received
- Agent generates a reply
- Campaign completes

```js
// backend/routes/events.js
app.get('/api/events', authMiddleware, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const clientId = req.user.businessId;
  clients.set(clientId, res);

  req.on('close', () => clients.delete(clientId));
});

// Push event anywhere in backend:
const pushEvent = (businessId, type, data) => {
  const client = clients.get(businessId);
  if (client) client.write(`data: ${JSON.stringify({ type, data })}\n\n`);
};
```

```js
// frontend — connect once in App.jsx
const es = new EventSource('/api/events', { withCredentials: true });
es.onmessage = (e) => {
  const { type, data } = JSON.parse(e.data);
  useActivityStore.getState().push({ type, data, timestamp: Date.now() });
};
```

---

## Demo Mode

Include a "Load Demo Data" button on the dashboard that:
1. Loads a pre-built solar company (SolarBright, Ahmedabad)
2. Pre-populates 5 sample leads with different statuses
3. Pre-loads a knowledge base with solar product info
4. Has one active campaign with sample conversation history

This makes the internship demo instant — no live configuration needed.

---

## What NOT to Build (Out of Scope)

- No multi-tenancy (single business for demo)
- No Razorpay billing
- No BullMQ / Redis (use node-cron + async)
- No Pinecone (ChromaDB is sufficient)
- No AWS (Railway + Supabase free tiers)
- No HR/Hiring Agent
- No Invoice Follow-up Agent
- No Review/Reputation Agent
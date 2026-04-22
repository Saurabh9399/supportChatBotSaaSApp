# SupportAI

> **Production-grade, multi-tenant AI customer support platform.**  
> Each tenant gets a fully isolated workspace with their own knowledge base, AI chatbot, conversation history, and analytics dashboard.

---

## ✨ Features

| Feature | Details |
|---|---|
| 🤖 **Streaming AI** | Groq `llama-3.3-70b-versatile` streams tokens in real time with a typing effect |
| 📚 **RAG Pipeline** | Upload docs → auto-chunk → Jina AI embeddings → Supabase pgvector search |
| 🏢 **Multi-tenancy** | Full data isolation per tenant via Clerk organisations |
| 🔐 **Auth** | Clerk sign-in / sign-up with organisation switching |
| 💬 **Chat Widget** | Floating widget (full-screen on mobile, panel on desktop) |
| 📂 **Conversation Viewer** | Full thread history with Mark as Resolved workflow |
| 📊 **Analytics** | Messages/day bar chart, resolution rate, top events |
| ⚙️ **Settings** | Per-tenant system prompt, chatbot name, and welcome message |
| 📱 **Responsive** | Mobile-first — hamburger nav, full-screen chat, adaptive grids |
| 🏗️ **Clean Architecture** | Modules, services, typed API responses, zero `any` |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 14](https://nextjs.org) (App Router) |
| **Language** | TypeScript 5 (strict mode) |
| **Styling** | Tailwind CSS 3 |
| **Auth** | [Clerk](https://clerk.com) |
| **Database** | [Supabase](https://supabase.com) (PostgreSQL + pgvector) |
| **AI Chat** | [Groq](https://groq.com) — `llama-3.3-70b-versatile` |
| **Embeddings** | [Jina AI](https://jina.ai) — `jina-embeddings-v2-base-en` (768 dims) |
| **Package Manager** | pnpm 9 |
| **Runtime** | Node.js 22 LTS |

---

## 📁 Project Structure

```
chatSupportSaaSApp/
├── app/                          # Next.js App Router pages & API routes
│   ├── api/
│   │   ├── chat/                 # POST — streaming AI chat
│   │   ├── documents/            # GET, POST, DELETE — knowledge base
│   │   ├── analytics/            # GET — dashboard metrics
│   │   ├── conversations/[id]/   # PATCH — update session status
│   │   └── settings/             # GET, PATCH — tenant settings
│   ├── dashboard/
│   │   ├── page.tsx              # Overview with real stats
│   │   ├── conversations/        # Session list + detail viewer
│   │   ├── analytics/            # Charts and event tracking
│   │   ├── documents/            # Knowledge base management
│   │   └── settings/             # System prompt editor
│   └── page.tsx                  # Public landing page
│
├── modules/                      # Feature modules (clean architecture)
│   ├── chat/                     # Chat widget, hook, streaming service
│   ├── documents/                # Upload, chunking, embedding pipeline
│   ├── analytics/                # Event tracking, dashboard metrics
│   ├── conversations/            # Resolve button component
│   ├── dashboard/                # Stats, recent sessions, system status
│   └── settings/                 # Tenant settings service + form UI
│
├── services/
│   ├── ai/                       # AI provider abstraction (Groq, OpenAI, xAI, Mock)
│   └── embeddings/               # Embedding service (Jina AI / OpenAI)
│
├── components/
│   ├── layout/                   # DashboardLayout, MobileNav, ActiveLink, DesktopUserMenu
│   └── ui/                       # Card, Badge, Button (design system)
│
├── lib/                          # Core utilities
│   ├── db.ts                     # Supabase client
│   ├── errors.ts                 # Custom error hierarchy
│   ├── api-response.ts           # Standardised API response wrappers
│   ├── logger.ts                 # Structured logging
│   ├── rate-limiter.ts           # In-memory rate limiting
│   └── utils.ts                  # cn(), generateId(), sanitizeInput()
│
├── config/                       # App-wide configuration constants
├── types/                        # Shared TypeScript types + Supabase schema
├── middleware.ts                 # Clerk auth + tenant injection
└── supabase/migrations/          # SQL schema (pgvector, RLS, match_documents RPC)
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 22
- pnpm ≥ 9 (`npm install -g pnpm`)
- A [Supabase](https://supabase.com) project
- A [Clerk](https://clerk.com) application
- A [Groq](https://console.groq.com) API key
- A [Jina AI](https://jina.ai) API key

### 1. Clone and install

```bash
git clone https://github.com/your-username/chatSupportSaaSApp.git
cd chatSupportSaaSApp
pnpm install
```

### 2. Set up environment variables

Create a `.env.local` file in the root:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# AI (Groq)
AI_PROVIDER=groq
AI_MODEL_ID=llama-3.3-70b-versatile
GROQ_API_KEY=gsk_...

# Embeddings (Jina AI)
EMBEDDING_PROVIDER=jina
EMBEDDING_MODEL_ID=jina-embeddings-v2-base-en
JINA_API_KEY=jina_...
```

### 3. Run the Supabase migration

Open your Supabase project → **SQL Editor** → paste and run the contents of:

```
supabase/migrations/001_initial_schema.sql
```

This creates all tables, enables `pgvector`, and sets up the `match_documents` RPC function.

### 4. Start the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🗄️ Database Schema

```sql
tenants            -- Clerk org_id as PK, stores settings JSON
chat_sessions      -- One per conversation (status: active | resolved | abandoned)
chat_messages      -- All user + AI messages, linked to session
documents          -- Uploaded knowledge base files (metadata)
document_chunks    -- Text chunks with vector(768) embeddings
analytics_events   -- Event log (message_sent, document_uploaded, session_resolved …)
```

The `match_documents` RPC function performs cosine-similarity vector search:

```sql
SELECT * FROM match_documents(
  query_embedding  := <768-dim vector>,
  match_threshold  := 0.5,
  match_count      := 3,
  p_tenant_id      := 'demo-tenant-001'
);
```

---

## 🤖 How RAG Works

```
User sends message
       ↓
Jina AI embeds the query → 768-dim vector
       ↓
Supabase pgvector cosine search → top 3 relevant chunks
       ↓
Chunks injected as system context into Groq prompt
       ↓
Groq streams response token by token → typing effect in UI
       ↓
Full response + session saved to Supabase (fire-and-forget)
```

---

## ⚙️ AI Provider Switching

The AI layer is fully abstracted. Switch providers by changing `.env.local`:

```env
# Groq (default)
AI_PROVIDER=groq
AI_MODEL_ID=llama-3.3-70b-versatile
GROQ_API_KEY=gsk_...

# OpenAI
AI_PROVIDER=openai
AI_MODEL_ID=gpt-4o-mini
OPENAI_API_KEY=sk-...

# xAI (Grok)
AI_PROVIDER=xai
AI_MODEL_ID=grok-3
XAI_API_KEY=xai-...

# Mock (no API key needed — for local dev)
AI_PROVIDER=mock
```

---

## 📜 Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Production build
pnpm start        # Start production server
pnpm type-check   # Run TypeScript compiler (no emit)
pnpm lint         # Run ESLint
```

---

## 🌐 Deployment (Vercel)

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add all environment variables from `.env.local`
4. Deploy — zero config needed, Next.js is auto-detected

---

## 📄 License

MIT — feel free to use this as a foundation for your own SaaS product.

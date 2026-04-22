-- ─────────────────────────────────────────────────────────────────────────────
-- SupportAI — Initial Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
--
-- Design note: tenant_id is stored as TEXT (not UUID FK) so that Clerk's
-- org IDs (org_xxx) can be used directly without a pre-existing tenants row.
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable pgvector extension for semantic search
create extension if not exists vector;

-- ─── TENANTS (optional profile — not required for other tables) ──────────────
create table if not exists tenants (
  id            text primary key,          -- Clerk org_id (org_xxx)
  name          text not null,
  slug          text not null unique,
  plan          text not null default 'free',
  settings      jsonb not null default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ─── CHAT SESSIONS ───────────────────────────────────────────────────────────
create table if not exists chat_sessions (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   text not null,               -- Clerk org_id or custom string
  visitor_id  text not null,
  status      text not null default 'active' check (status in ('active','resolved','abandoned')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists chat_sessions_tenant_idx on chat_sessions(tenant_id);

-- ─── CHAT MESSAGES ───────────────────────────────────────────────────────────
create table if not exists chat_messages (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references chat_sessions(id) on delete cascade,
  tenant_id   text not null,
  role        text not null check (role in ('user','assistant','system')),
  content     text not null,
  created_at  timestamptz not null default now()
);
create index if not exists chat_messages_session_idx  on chat_messages(session_id);
create index if not exists chat_messages_tenant_idx   on chat_messages(tenant_id);
create index if not exists chat_messages_created_idx  on chat_messages(created_at desc);

-- ─── DOCUMENTS (knowledge base) ──────────────────────────────────────────────
create table if not exists documents (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    text not null,               -- Clerk org_id or custom string
  name         text not null,
  file_path    text not null,
  file_size    bigint not null default 0,
  mime_type    text not null default 'text/plain',
  status       text not null default 'processing' check (status in ('processing','ready','failed')),
  chunk_count  integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists documents_tenant_idx on documents(tenant_id);

-- ─── DOCUMENT CHUNKS (with vector embeddings) ────────────────────────────────
create table if not exists document_chunks (
  id            uuid primary key default gen_random_uuid(),
  document_id   uuid not null references documents(id) on delete cascade,
  tenant_id     text not null,
  content       text not null,
  embedding     vector(768),                -- jina-embeddings-v2-base-en dimensions
  chunk_index   integer not null,
  metadata      jsonb not null default '{}',
  created_at    timestamptz not null default now()
);
create index if not exists doc_chunks_tenant_idx    on document_chunks(tenant_id);
create index if not exists doc_chunks_document_idx  on document_chunks(document_id);
-- HNSW index for fast approximate nearest-neighbor search
create index if not exists doc_chunks_embedding_idx
  on document_chunks using hnsw (embedding vector_cosine_ops);

-- ─── ANALYTICS EVENTS ────────────────────────────────────────────────────────
create table if not exists analytics_events (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   text not null,
  session_id  uuid,
  event_type  text not null,
  metadata    jsonb not null default '{}',
  created_at  timestamptz not null default now()
);
create index if not exists analytics_events_tenant_idx   on analytics_events(tenant_id);
create index if not exists analytics_events_type_idx     on analytics_events(tenant_id, event_type);
create index if not exists analytics_events_created_idx  on analytics_events(created_at desc);

-- ─── VECTOR SEARCH RPC ───────────────────────────────────────────────────────
create or replace function match_documents (
  query_embedding  vector(768),
  match_threshold  float,
  match_count      int,
  p_tenant_id      text
)
returns table (
  id           uuid,
  document_id  uuid,
  content      text,
  score        float
)
language sql stable
as $$
  select
    dc.id,
    dc.document_id,
    dc.content,
    1 - (dc.embedding <=> query_embedding) as score
  from document_chunks dc
  where
    dc.tenant_id = p_tenant_id
    and dc.embedding is not null
    and 1 - (dc.embedding <=> query_embedding) > match_threshold
  order by dc.embedding <=> query_embedding
  limit match_count;
$$;

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────────────────
alter table tenants            enable row level security;
alter table chat_sessions      enable row level security;
alter table chat_messages      enable row level security;
alter table documents          enable row level security;
alter table document_chunks    enable row level security;
alter table analytics_events   enable row level security;

-- Service role bypasses RLS — our server uses the service-role key, so all
-- server-side operations work without per-table policies.

-- ─── updated_at triggers ─────────────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create or replace trigger tenants_updated_at
  before update on tenants for each row execute function set_updated_at();
create or replace trigger chat_sessions_updated_at
  before update on chat_sessions for each row execute function set_updated_at();
create or replace trigger documents_updated_at
  before update on documents for each row execute function set_updated_at();

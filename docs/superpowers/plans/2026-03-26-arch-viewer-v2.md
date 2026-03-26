# Arch Viewer v2 — Iteration 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the architecture viewer with React Flow custom nodes matching reference HTML quality, PostgreSQL storage, and basic drag-to-reposition.

**Architecture:** New skill generates React Flow-compatible JSON → MCP pushes to FastAPI backend → stores in PostgreSQL JSONB → React Flow frontend renders custom nodes with reference-quality styling. Three components: skill, backend, frontend.

**Tech Stack:** React Flow, React 18, TypeScript, Vite 5, Tailwind CSS 3, FastAPI, PostgreSQL 16, asyncpg, SQLAlchemy, FastMCP, Docker Compose.

**Spec:** `docs/superpowers/specs/2026-03-26-arch-viewer-v2-design.md`

---

## File Structure

```
intelligent-arch-viewer/
├── docker-compose.yml                    # postgres + backend + frontend
├── .env.example                          # POSTGRES_PASSWORD
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py                       # FastAPI app, startup, CORS
│   │   ├── config.py                     # Pydantic Settings
│   │   ├── db.py                         # async engine, session model, table creation
│   │   └── routes.py                     # 5 REST endpoints
│   └── tests/
│       ├── conftest.py                   # test DB fixtures
│       └── test_routes.py                # route tests
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── tsconfig.json
│   └── src/
│       ├── index.css                     # Tailwind directives
│       ├── main.tsx                      # entry + BrowserRouter
│       ├── App.tsx                       # routes
│       ├── api.ts                        # REST client (axios)
│       ├── types.ts                      # TypeScript types
│       └── components/
│           ├── Canvas.tsx                # React Flow wrapper + drag save
│           ├── EmptyState.tsx            # shown when no session
│           └── nodes/
│               ├── index.ts             # nodeTypes registry
│               ├── nodeStyles.ts        # shared color/style constants
│               ├── KafkaBrokerNode.tsx
│               ├── RedisCacheNode.tsx
│               ├── PostgresDBNode.tsx
│               ├── APIServiceNode.tsx
│               ├── ClientNode.tsx
│               ├── ExternalNode.tsx
│               └── ContainerNode.tsx
├── mcp-server/
│   ├── requirements.txt
│   └── server.py                         # 3 MCP tools
└── skills/
    └── intelligent-arch-creator-v2/
        └── skill.md
```

---

### Task 1: Clean slate + Docker Compose + PostgreSQL

**Files:**
- Create: `docker-compose.yml`
- Create: `.env.example`

**Important:** Before starting, the existing `backend/`, `frontend/`, and `mcp-server/` directories contain v1 code. We are rebuilding from scratch. Delete the contents of these directories (keep the directories themselves). Do NOT delete `docs/`, `skills/intelligent-arch-creator/` (the v1 skill), `.claude/`, or `CLAUDE.md`.

- [ ] **Step 1: Clean v1 code**

```bash
rm -rf backend/* frontend/* mcp-server/*
```

- [ ] **Step 2: Create .env.example**

```env
POSTGRES_PASSWORD=dev
```

- [ ] **Step 3: Create docker-compose.yml**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: arch_viewer
      POSTGRES_USER: arch
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-dev}
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "15432:5432"
    healthcheck:
      test: ["CMD-ONLY", "pg_isready", "-U", "arch", "-d", "arch_viewer"]
      interval: 5s
      retries: 5

  backend:
    build: ./backend
    ports:
      - "18000:8000"
    environment:
      DATABASE_URL: postgresql+asyncpg://arch:${POSTGRES_PASSWORD:-dev}@postgres:5432/arch_viewer
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./backend/app:/app/app

  frontend:
    build: ./frontend
    ports:
      - "13000:13000"
    environment:
      VITE_API_URL: http://localhost:18000
    volumes:
      - ./frontend/src:/app/src
    depends_on:
      - backend

volumes:
  pgdata:
```

- [ ] **Step 4: Commit**

```bash
git add docker-compose.yml .env.example
git commit -m "feat(v2): docker compose with postgres, backend, frontend services"
```

---

### Task 2: Backend — FastAPI + PostgreSQL + models

**Files:**
- Create: `backend/Dockerfile`
- Create: `backend/requirements.txt`
- Create: `backend/app/__init__.py`
- Create: `backend/app/config.py`
- Create: `backend/app/db.py`
- Create: `backend/app/main.py`

- [ ] **Step 1: Create backend/requirements.txt**

```
fastapi==0.115.6
uvicorn[standard]==0.34.0
sqlalchemy[asyncio]==2.0.36
asyncpg==0.30.0
pydantic-settings==2.7.0
httpx==0.28.1
pytest==8.3.4
pytest-asyncio==0.25.0
```

- [ ] **Step 2: Create backend/Dockerfile**

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

- [ ] **Step 3: Create backend/app/__init__.py**

Empty file.

- [ ] **Step 4: Create backend/app/config.py**

```python
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://arch:dev@localhost:5432/arch_viewer"

    model_config = {"env_prefix": ""}


settings = Settings()
```

- [ ] **Step 5: Create backend/app/db.py**

```python
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, String, Text, text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings

engine = create_async_engine(settings.database_url)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class Session(Base):
    __tablename__ = "sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(Text, nullable=False, default="Untitled")
    data = Column(JSONB, nullable=False)
    detected_stack = Column(ARRAY(String), server_default=text("'{}'"))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
```

- [ ] **Step 6: Create backend/app/main.py**

```python
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="Arch Viewer", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}
```

- [ ] **Step 7: Verify backend starts locally**

```bash
cd backend && pip install -r requirements.txt
# Requires running postgres — skip if not available locally, will test in Docker
```

- [ ] **Step 8: Commit**

```bash
git add backend/
git commit -m "feat(v2): backend skeleton — FastAPI, PostgreSQL models, health endpoint"
```

---

### Task 3: Backend — API routes + tests

**Files:**
- Create: `backend/app/routes.py`
- Modify: `backend/app/main.py` (add router import)
- Create: `backend/tests/__init__.py`
- Create: `backend/tests/conftest.py`
- Create: `backend/tests/test_routes.py`

- [ ] **Step 1: Create backend/app/routes.py**

```python
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy import select

from app.db import Session, async_session

router = APIRouter(prefix="/api")


class CreateSessionRequest(BaseModel):
    title: str = "Untitled"
    data: dict
    detected_stack: list[str] = []


class UpdateSessionRequest(BaseModel):
    title: str | None = None
    data: dict | None = None


class SessionResponse(BaseModel):
    id: UUID
    title: str
    data: dict
    detected_stack: list[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


@router.post("/sessions", response_model=SessionResponse, status_code=201)
async def create_session(req: CreateSessionRequest):
    async with async_session() as db:
        session = Session(
            title=req.title,
            data=req.data,
            detected_stack=req.detected_stack,
        )
        db.add(session)
        await db.commit()
        await db.refresh(session)
        return session


@router.get("/sessions", response_model=list[SessionResponse])
async def list_sessions():
    async with async_session() as db:
        result = await db.execute(
            select(Session).order_by(Session.created_at.desc())
        )
        return result.scalars().all()


@router.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session(session_id: UUID):
    async with async_session() as db:
        session = await db.get(Session, session_id)
        if not session:
            raise HTTPException(404, "Session not found")
        return session


@router.patch("/sessions/{session_id}", response_model=SessionResponse)
async def update_session(session_id: UUID, req: UpdateSessionRequest):
    async with async_session() as db:
        session = await db.get(Session, session_id)
        if not session:
            raise HTTPException(404, "Session not found")
        if req.title is not None:
            session.title = req.title
        if req.data is not None:
            session.data = req.data
        session.updated_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(session)
        return session
```

- [ ] **Step 2: Wire router into main.py**

Add to `backend/app/main.py` after the health endpoint:

```python
from app.routes import router

app.include_router(router)
```

- [ ] **Step 3: Create backend/tests/__init__.py**

Empty file.

- [ ] **Step 4: Create backend/tests/conftest.py**

```python
import asyncio

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.db import Base, async_session as prod_session
from app.main import app

# Use the same DB for tests (tables recreated per session)
TEST_DB_URL = "postgresql+asyncpg://arch:dev@localhost:15432/arch_viewer"


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def setup_db():
    engine = create_async_engine(TEST_DB_URL)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest.fixture
async def client(setup_db):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
```

- [ ] **Step 5: Create backend/tests/test_routes.py**

```python
import pytest


@pytest.mark.asyncio
async def test_health(client):
    resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_create_session(client):
    resp = await client.post("/api/sessions", json={
        "title": "Test Architecture",
        "data": {"nodes": [], "edges": []},
        "detected_stack": ["fastapi", "redis"],
    })
    assert resp.status_code == 201
    body = resp.json()
    assert body["title"] == "Test Architecture"
    assert body["data"] == {"nodes": [], "edges": []}
    assert body["detected_stack"] == ["fastapi", "redis"]
    assert "id" in body


@pytest.mark.asyncio
async def test_get_session(client):
    # Create first
    create_resp = await client.post("/api/sessions", json={
        "title": "Get Test",
        "data": {"nodes": [{"id": "n1"}], "edges": []},
    })
    session_id = create_resp.json()["id"]

    # Fetch
    resp = await client.get(f"/api/sessions/{session_id}")
    assert resp.status_code == 200
    assert resp.json()["title"] == "Get Test"
    assert resp.json()["data"]["nodes"][0]["id"] == "n1"


@pytest.mark.asyncio
async def test_get_session_not_found(client):
    resp = await client.get("/api/sessions/00000000-0000-0000-0000-000000000000")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_patch_session(client):
    # Create
    create_resp = await client.post("/api/sessions", json={
        "title": "Patch Test",
        "data": {"nodes": [{"id": "n1", "position": {"x": 0, "y": 0}}], "edges": []},
    })
    session_id = create_resp.json()["id"]

    # Patch — update node position
    resp = await client.patch(f"/api/sessions/{session_id}", json={
        "data": {"nodes": [{"id": "n1", "position": {"x": 100, "y": 200}}], "edges": []},
    })
    assert resp.status_code == 200
    assert resp.json()["data"]["nodes"][0]["position"] == {"x": 100, "y": 200}


@pytest.mark.asyncio
async def test_list_sessions(client):
    resp = await client.get("/api/sessions")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
    assert len(resp.json()) > 0
```

- [ ] **Step 6: Run tests (requires postgres on port 15432)**

```bash
cd backend && python -m pytest tests/ -v
```

Expected: 5 tests PASS.

- [ ] **Step 7: Commit**

```bash
git add backend/
git commit -m "feat(v2): backend API routes + tests — CRUD for sessions with JSONB"
```

---

### Task 4: Frontend — Vite + React Flow + Tailwind setup

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/index.html`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tailwind.config.js`
- Create: `frontend/postcss.config.js`
- Create: `frontend/tsconfig.json`
- Create: `frontend/Dockerfile`
- Create: `frontend/src/index.css`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/types.ts`
- Create: `frontend/src/api.ts`

- [ ] **Step 1: Create frontend/package.json**

```json
{
  "name": "arch-viewer",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@xyflow/react": "^12.4.0",
    "axios": "^1.7.9",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.28.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.16",
    "typescript": "^5.7.2",
    "vite": "^5.4.11"
  }
}
```

Note: React Flow v12 uses the `@xyflow/react` package name.

- [ ] **Step 2: Create frontend/index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Arch Viewer</title>
  </head>
  <body class="bg-[#0a0a0f] text-[#c9d1e0]">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 3: Create frontend/vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 13000,
    host: '0.0.0.0',
  },
})
```

- [ ] **Step 4: Create frontend/tailwind.config.js**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

- [ ] **Step 5: Create frontend/postcss.config.js**

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 6: Create frontend/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  },
  "include": ["src"]
}
```

- [ ] **Step 7: Create frontend/Dockerfile**

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
EXPOSE 13000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "13000"]
```

- [ ] **Step 8: Create frontend/src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 9: Create frontend/src/types.ts**

```typescript
export interface ArchSession {
  id: string
  title: string
  data: {
    nodes: ArchNode[]
    edges: ArchEdge[]
  }
  detected_stack: string[]
  created_at: string
  updated_at: string
}

export interface ArchNode {
  id: string
  type: string
  position: { x: number; y: number }
  data: Record<string, unknown>
}

export interface ArchEdge {
  id: string
  source: string
  target: string
  label?: string
  animated?: boolean
  style?: Record<string, string | number>
}
```

- [ ] **Step 10: Create frontend/src/api.ts**

```typescript
import axios from 'axios'
import type { ArchSession } from './types'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:18000',
})

export const getSession = (id: string) =>
  api.get<ArchSession>(`/api/sessions/${id}`).then((r) => r.data)

export const patchSession = (id: string, data: Partial<Pick<ArchSession, 'title' | 'data'>>) =>
  api.patch<ArchSession>(`/api/sessions/${id}`, data).then((r) => r.data)

export const listSessions = () =>
  api.get<ArchSession[]>('/api/sessions').then((r) => r.data)
```

- [ ] **Step 11: Create frontend/src/main.tsx**

```tsx
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')
createRoot(root).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)
```

- [ ] **Step 12: Create frontend/src/App.tsx**

```tsx
import { Routes, Route } from 'react-router-dom'
import { Canvas } from './components/Canvas'
import { EmptyState } from './components/EmptyState'

export default function App() {
  return (
    <Routes>
      <Route path="/session/:sessionId" element={<Canvas />} />
      <Route path="*" element={<EmptyState />} />
    </Routes>
  )
}
```

- [ ] **Step 13: Create frontend/src/components/EmptyState.tsx**

```tsx
export function EmptyState() {
  return (
    <div className="flex items-center justify-center h-screen bg-[#0a0a0f]">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[#c9d1e0] mb-2">arch-viewer</h1>
        <p className="text-[#6b7280] text-sm">
          Push an architecture via MCP to get started
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 14: Create placeholder frontend/src/components/Canvas.tsx**

```tsx
import { useParams } from 'react-router-dom'

export function Canvas() {
  const { sessionId } = useParams<{ sessionId: string }>()
  return (
    <div className="flex items-center justify-center h-screen bg-[#0a0a0f]">
      <p className="text-[#6b7280]">Loading session {sessionId}...</p>
    </div>
  )
}
```

- [ ] **Step 15: Install deps and typecheck**

```bash
cd frontend && npm install && npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 16: Commit**

```bash
git add frontend/
git commit -m "feat(v2): frontend setup — Vite, React Flow, Tailwind, routing shell"
```

---

### Task 5: Frontend — Custom node types (all 7)

**Files:**
- Create: `frontend/src/components/nodes/nodeStyles.ts`
- Create: `frontend/src/components/nodes/KafkaBrokerNode.tsx`
- Create: `frontend/src/components/nodes/RedisCacheNode.tsx`
- Create: `frontend/src/components/nodes/PostgresDBNode.tsx`
- Create: `frontend/src/components/nodes/APIServiceNode.tsx`
- Create: `frontend/src/components/nodes/ClientNode.tsx`
- Create: `frontend/src/components/nodes/ExternalNode.tsx`
- Create: `frontend/src/components/nodes/ContainerNode.tsx`
- Create: `frontend/src/components/nodes/index.ts`

- [ ] **Step 1: Create frontend/src/components/nodes/nodeStyles.ts**

```typescript
export const CATEGORY_STYLES = {
  messaging: {
    border: '#f87171',
    fill: 'rgba(248,113,113,0.15)',
    headerFill: 'rgba(239,68,68,0.25)',
    text: '#fca5a5',
    accent: '#ef4444',
  },
  database: {
    border: '#60a5fa',
    fill: 'rgba(96,165,250,0.15)',
    headerFill: 'rgba(59,130,246,0.25)',
    text: '#93c5fd',
    accent: '#3b82f6',
  },
  cache: {
    border: '#f87171',
    fill: 'rgba(248,113,113,0.15)',
    headerFill: 'rgba(239,68,68,0.25)',
    text: '#fca5a5',
    accent: '#ef4444',
  },
  api: {
    border: '#34d399',
    fill: 'rgba(52,211,153,0.15)',
    headerFill: 'rgba(5,150,105,0.25)',
    text: '#6ee7b7',
    accent: '#059669',
  },
  infrastructure: {
    border: '#38bdf8',
    fill: 'rgba(56,189,248,0.15)',
    headerFill: 'rgba(14,165,233,0.25)',
    text: '#7dd3fc',
    accent: '#0ea5e9',
  },
  client: {
    border: '#a78bfa',
    fill: 'rgba(167,139,250,0.15)',
    headerFill: 'rgba(139,92,246,0.25)',
    text: '#c4b5fd',
    accent: '#8b5cf6',
  },
  external: {
    border: '#9ca3af',
    fill: 'rgba(156,163,175,0.1)',
    headerFill: 'rgba(107,114,128,0.2)',
    text: '#d1d5db',
    accent: '#6b7280',
  },
} as const

export type Category = keyof typeof CATEGORY_STYLES
```

- [ ] **Step 2: Create frontend/src/components/nodes/KafkaBrokerNode.tsx**

```tsx
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { CATEGORY_STYLES } from './nodeStyles'

interface KafkaBrokerData {
  label: string
  subtitle?: string
  topics?: Array<{ name: string; partitions: number }>
}

export function KafkaBrokerNode({ data }: NodeProps) {
  const d = data as unknown as KafkaBrokerData
  const s = CATEGORY_STYLES.messaging

  return (
    <div
      className="rounded-lg overflow-hidden min-w-[200px]"
      style={{ background: '#0f1117', border: `2px solid ${s.border}` }}
    >
      <Handle type="target" position={Position.Top} className="!bg-[#f87171]" />
      <Handle type="target" position={Position.Left} className="!bg-[#f87171]" />

      {/* Header */}
      <div
        className="px-3 py-2 flex items-center gap-2"
        style={{ background: s.headerFill, borderBottom: `1px solid ${s.border}` }}
      >
        <span className="font-bold text-sm" style={{ color: s.text }}>{d.label}</span>
        {d.subtitle && <span className="text-xs text-[#6b7280]">{d.subtitle}</span>}
      </div>

      {/* Topics */}
      {d.topics && d.topics.length > 0 && (
        <div className="p-2 flex flex-col gap-1.5">
          {d.topics.map((topic) => (
            <div
              key={topic.name}
              className="flex items-center gap-2 rounded-full px-2.5 py-1"
              style={{ background: s.fill, border: `1.5px solid ${s.border}50` }}
            >
              <div className="flex gap-0.5">
                {Array.from({ length: Math.min(topic.partitions, 5) }).map((_, i) => (
                  <div
                    key={i}
                    className="w-[18px] h-[14px] rounded-sm flex items-center justify-center"
                    style={{
                      background: `${s.accent}30`,
                      border: `1px solid ${s.accent}50`,
                      fontSize: 7,
                      color: s.text,
                    }}
                  >
                    P{i}
                  </div>
                ))}
              </div>
              <span className="text-[11px] font-medium" style={{ color: s.text }}>
                {topic.name}
              </span>
            </div>
          ))}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-[#f87171]" />
      <Handle type="source" position={Position.Right} className="!bg-[#f87171]" />
    </div>
  )
}
```

- [ ] **Step 3: Create frontend/src/components/nodes/RedisCacheNode.tsx**

```tsx
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { CATEGORY_STYLES } from './nodeStyles'

interface RedisCacheData {
  label: string
  role?: string
  details?: string[]
}

export function RedisCacheNode({ data }: NodeProps) {
  const d = data as unknown as RedisCacheData
  const s = CATEGORY_STYLES.cache

  return (
    <div className="min-w-[160px]">
      <Handle type="target" position={Position.Top} className="!bg-[#f87171]" />
      <Handle type="target" position={Position.Left} className="!bg-[#f87171]" />

      {/* Top ellipse */}
      <div
        className="h-5 rounded-[50%] -mb-1 relative z-10"
        style={{ background: `${s.accent}30`, border: `2px solid ${s.border}` }}
      />
      {/* Body */}
      <div
        className="px-4 py-3 text-center"
        style={{
          background: '#0f1117',
          borderLeft: `2px solid ${s.border}`,
          borderRight: `2px solid ${s.border}`,
        }}
      >
        <div className="font-bold text-sm" style={{ color: s.text }}>{d.label}</div>
        {d.role && (
          <div className="text-[11px] mt-0.5" style={{ color: s.border }}>
            [{d.role}]
          </div>
        )}
        {d.details && d.details.length > 0 && (
          <div className="mt-2 space-y-0.5">
            {d.details.map((detail, i) => (
              <div key={i} className="text-[10px] text-[#6b7280]">{detail}</div>
            ))}
          </div>
        )}
      </div>
      {/* Bottom ellipse */}
      <div
        className="h-5 rounded-[50%] -mt-1 relative z-10"
        style={{ background: `${s.accent}20`, border: `2px solid ${s.border}` }}
      />

      <Handle type="source" position={Position.Bottom} className="!bg-[#f87171]" />
      <Handle type="source" position={Position.Right} className="!bg-[#f87171]" />
    </div>
  )
}
```

- [ ] **Step 4: Create frontend/src/components/nodes/PostgresDBNode.tsx**

```tsx
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { CATEGORY_STYLES } from './nodeStyles'

interface PostgresDBData {
  label: string
  subtitle?: string
  tables?: string[]
  role?: string
}

export function PostgresDBNode({ data }: NodeProps) {
  const d = data as unknown as PostgresDBData
  const s = CATEGORY_STYLES.database

  return (
    <div className="min-w-[160px]">
      <Handle type="target" position={Position.Top} className="!bg-[#60a5fa]" />
      <Handle type="target" position={Position.Left} className="!bg-[#60a5fa]" />

      <div
        className="h-[18px] rounded-[50%] -mb-1 relative z-10"
        style={{ background: `${s.accent}30`, border: `2px solid ${s.border}` }}
      />
      <div
        className="px-4 py-3 text-center"
        style={{
          background: '#0f1117',
          borderLeft: `2px solid ${s.border}`,
          borderRight: `2px solid ${s.border}`,
        }}
      >
        <div className="font-bold text-sm" style={{ color: s.text }}>{d.label}</div>
        {d.subtitle && <div className="text-[10px]" style={{ color: s.border }}>{d.subtitle}</div>}
        {d.tables && d.tables.length > 0 && (
          <div className="mt-2 pt-1 border-t border-dashed" style={{ borderColor: `${s.border}40` }}>
            <div className="text-[10px] text-[#6b7280]">{d.tables.join(' · ')}</div>
          </div>
        )}
        {d.role && <div className="text-[9px] mt-1" style={{ color: '#f59e0b' }}>{d.role}</div>}
      </div>
      <div
        className="h-[18px] rounded-[50%] -mt-1 relative z-10"
        style={{ background: `${s.accent}20`, border: `2px solid ${s.border}` }}
      />

      <Handle type="source" position={Position.Bottom} className="!bg-[#60a5fa]" />
      <Handle type="source" position={Position.Right} className="!bg-[#60a5fa]" />
    </div>
  )
}
```

- [ ] **Step 5: Create frontend/src/components/nodes/APIServiceNode.tsx**

```tsx
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { CATEGORY_STYLES } from './nodeStyles'

interface APIServiceData {
  label: string
  step?: number
  endpoints?: string[]
  mode?: string
  framework?: string
}

export function APIServiceNode({ data }: NodeProps) {
  const d = data as unknown as APIServiceData
  const s = CATEGORY_STYLES.api

  return (
    <div
      className="rounded-lg min-w-[180px] p-3"
      style={{ background: s.fill, border: `2px solid ${s.border}` }}
    >
      <Handle type="target" position={Position.Top} className="!bg-[#34d399]" />
      <Handle type="target" position={Position.Left} className="!bg-[#34d399]" />

      <div className="flex items-center gap-2 mb-2">
        {d.step != null && (
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded"
            style={{ background: s.accent, color: 'white' }}
          >
            {d.step}
          </span>
        )}
        <span className="font-bold text-sm" style={{ color: s.text }}>{d.label}</span>
      </div>

      {d.framework && (
        <div className="text-[10px] mb-1.5" style={{ color: s.accent }}>{d.framework}</div>
      )}

      {d.endpoints && d.endpoints.length > 0 && (
        <div className="text-[11px] leading-relaxed text-[#9ca3af]">
          {d.endpoints.map((ep, i) => (
            <div key={i}>{ep}</div>
          ))}
        </div>
      )}

      {d.mode && (
        <div
          className="mt-2 pt-1.5 text-[10px] border-t"
          style={{ color: s.border, borderColor: `${s.border}30` }}
        >
          {d.mode}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-[#34d399]" />
      <Handle type="source" position={Position.Right} className="!bg-[#34d399]" />
    </div>
  )
}
```

- [ ] **Step 6: Create frontend/src/components/nodes/ClientNode.tsx**

```tsx
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { CATEGORY_STYLES } from './nodeStyles'

interface ClientData {
  label: string
  subtitle?: string
  details?: string[]
}

export function ClientNode({ data }: NodeProps) {
  const d = data as unknown as ClientData
  const s = CATEGORY_STYLES.client

  return (
    <div
      className="rounded-lg min-w-[140px] p-3 text-center"
      style={{ background: '#0f1117', border: `2px solid ${s.border}` }}
    >
      <Handle type="target" position={Position.Top} className="!bg-[#a78bfa]" />
      <Handle type="target" position={Position.Left} className="!bg-[#a78bfa]" />

      <div
        className="w-9 h-9 rounded-full mx-auto mb-2 flex items-center justify-center"
        style={{ border: `1.5px solid ${s.border}` }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={s.border} strokeWidth="2">
          <rect x="5" y="2" width="14" height="20" rx="2" />
          <line x1="12" y1="18" x2="12" y2="18.01" />
        </svg>
      </div>
      <div className="font-bold text-[13px]" style={{ color: s.text }}>{d.label}</div>
      {d.subtitle && <div className="text-[10px]" style={{ color: s.border }}>{d.subtitle}</div>}
      {d.details && (
        <div className="mt-1 text-[10px] text-[#6b7280]">
          {d.details.map((line, i) => <div key={i}>{line}</div>)}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-[#a78bfa]" />
      <Handle type="source" position={Position.Right} className="!bg-[#a78bfa]" />
    </div>
  )
}
```

- [ ] **Step 7: Create frontend/src/components/nodes/ExternalNode.tsx**

```tsx
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { CATEGORY_STYLES } from './nodeStyles'

interface ExternalData {
  label: string
  provider?: string
  details?: string[]
}

export function ExternalNode({ data }: NodeProps) {
  const d = data as unknown as ExternalData
  const s = CATEGORY_STYLES.external

  return (
    <div
      className="rounded-2xl min-w-[140px] p-3 text-center"
      style={{ background: '#0f1117', border: `2px solid ${s.border}` }}
    >
      <Handle type="target" position={Position.Top} className="!bg-[#9ca3af]" />
      <Handle type="target" position={Position.Left} className="!bg-[#9ca3af]" />

      <div className="font-bold text-[13px]" style={{ color: s.text }}>{d.label}</div>
      {d.provider && <div className="text-[10px]" style={{ color: s.border }}>{d.provider}</div>}
      {d.details && (
        <div className="mt-1 text-[10px] text-[#6b7280]">
          {d.details.map((line, i) => <div key={i}>{line}</div>)}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-[#9ca3af]" />
      <Handle type="source" position={Position.Right} className="!bg-[#9ca3af]" />
    </div>
  )
}
```

- [ ] **Step 8: Create frontend/src/components/nodes/ContainerNode.tsx**

```tsx
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { CATEGORY_STYLES, type Category } from './nodeStyles'

interface ContainerData {
  label: string
  subtitle?: string
  category?: Category
  children?: Array<{ name: string; detail?: string }>
}

export function ContainerNode({ data }: NodeProps) {
  const d = data as unknown as ContainerData
  const s = CATEGORY_STYLES[d.category ?? 'infrastructure']

  return (
    <div
      className="rounded-lg overflow-hidden min-w-[200px]"
      style={{ background: '#0f1117', border: `2px solid ${s.border}` }}
    >
      <Handle type="target" position={Position.Top} className="!bg-[#38bdf8]" />
      <Handle type="target" position={Position.Left} className="!bg-[#38bdf8]" />

      <div
        className="px-3 py-2 flex items-center gap-2"
        style={{ background: s.headerFill, borderBottom: `1px solid ${s.border}` }}
      >
        <span className="font-bold text-sm" style={{ color: s.text }}>{d.label}</span>
        {d.subtitle && <span className="text-xs text-[#6b7280]">{d.subtitle}</span>}
      </div>

      {d.children && d.children.length > 0 && (
        <div className="p-2 space-y-1.5">
          {d.children.map((child) => (
            <div
              key={child.name}
              className="rounded px-2.5 py-1.5"
              style={{ background: s.fill, border: `1px solid ${s.border}40` }}
            >
              <div className="text-[11px] font-medium" style={{ color: s.text }}>{child.name}</div>
              {child.detail && (
                <div className="text-[10px] text-[#6b7280]">{child.detail}</div>
              )}
            </div>
          ))}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-[#38bdf8]" />
      <Handle type="source" position={Position.Right} className="!bg-[#38bdf8]" />
    </div>
  )
}
```

- [ ] **Step 9: Create frontend/src/components/nodes/index.ts**

```typescript
import type { NodeTypes } from '@xyflow/react'
import { KafkaBrokerNode } from './KafkaBrokerNode'
import { RedisCacheNode } from './RedisCacheNode'
import { PostgresDBNode } from './PostgresDBNode'
import { APIServiceNode } from './APIServiceNode'
import { ClientNode } from './ClientNode'
import { ExternalNode } from './ExternalNode'
import { ContainerNode } from './ContainerNode'

export const nodeTypes: NodeTypes = {
  kafka_broker: KafkaBrokerNode,
  redis_cache: RedisCacheNode,
  postgres_db: PostgresDBNode,
  api_service: APIServiceNode,
  client_actor: ClientNode,
  external_service: ExternalNode,
  container_box: ContainerNode,
}
```

- [ ] **Step 10: Typecheck**

```bash
cd frontend && npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 11: Commit**

```bash
git add frontend/src/components/nodes/
git commit -m "feat(v2): 7 custom React Flow node types — reference-quality rendering"
```

---

### Task 6: Frontend — Canvas with session loading + drag save

**Files:**
- Modify: `frontend/src/components/Canvas.tsx` (replace placeholder)

- [ ] **Step 1: Replace frontend/src/components/Canvas.tsx**

```tsx
import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type OnNodesChange,
  type NodeDragHandler,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { nodeTypes } from './nodes'
import { getSession, patchSession } from '../api'
import type { ArchSession } from '../types'

export function Canvas() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [session, setSession] = useState<ArchSession | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  // Load session on mount
  useEffect(() => {
    if (!sessionId) return
    getSession(sessionId)
      .then((data) => {
        setSession(data)
        setNodes(data.data.nodes as Node[])
        setEdges(data.data.edges as Edge[])
      })
      .catch((err) => setError(err.message))
  }, [sessionId, setNodes, setEdges])

  // Save positions after drag
  const onNodeDragStop: NodeDragHandler = useCallback(
    (_event, _node) => {
      if (!sessionId) return
      // Debounce: save the current nodes state
      const currentNodes = nodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: n.data,
      }))
      const currentEdges = edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        animated: e.animated,
        style: e.style,
      }))
      patchSession(sessionId, { data: { nodes: currentNodes, edges: currentEdges } }).catch(
        (err) => console.error('Failed to save positions:', err)
      )
    },
    [sessionId, nodes, edges]
  )

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0f]">
        <p className="text-red-400">Error: {error}</p>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen bg-[#0a0a0f]">
      {/* Top bar */}
      <div className="h-12 bg-[#161b27] border-b border-[#1e2430] flex items-center px-4 gap-3">
        <span className="text-[#7c9adb] font-bold text-sm">arch-viewer</span>
        {session && (
          <>
            <span className="text-[#c9d1e0] text-sm">{session.title}</span>
            <div className="flex gap-1.5 ml-2">
              {session.detected_stack.map((tech) => (
                <span
                  key={tech}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#1e2430] text-[#9ca3af]"
                >
                  {tech}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Canvas */}
      <div className="h-[calc(100vh-48px)]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          defaultEdgeOptions={{
            style: { stroke: '#4b5563', strokeWidth: 2 },
            type: 'smoothstep',
          }}
          style={{ background: '#0a0a0f' }}
        >
          <Background color="#1e2430" gap={20} />
          <Controls
            style={{ background: '#161b27', border: '1px solid #1e2430', borderRadius: 8 }}
          />
          <MiniMap
            style={{ background: '#161b27', border: '1px solid #1e2430' }}
            nodeColor="#1e2430"
            maskColor="rgba(0,0,0,0.5)"
          />
        </ReactFlow>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

```bash
cd frontend && npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/Canvas.tsx
git commit -m "feat(v2): React Flow canvas — session loading, drag-to-save, fitView"
```

---

### Task 7: MCP Server

**Files:**
- Create: `mcp-server/requirements.txt`
- Create: `mcp-server/server.py`

- [ ] **Step 1: Create mcp-server/requirements.txt**

```
mcp[cli]>=1.2.0
httpx>=0.28.0
```

- [ ] **Step 2: Create mcp-server/server.py**

```python
import json
import os

import httpx
from mcp.server.fastmcp import FastMCP

BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:18000")

mcp = FastMCP("arch-viewer")


@mcp.tool()
async def check_app_health() -> str:
    """Check if the Arch Viewer app is running and healthy."""
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{BACKEND_URL}/health", timeout=5, follow_redirects=True)
            if resp.status_code == 200:
                return "Arch Viewer is healthy and running."
            return f"Arch Viewer returned status {resp.status_code}"
    except Exception as e:
        return f"Arch Viewer is not reachable: {e}"


@mcp.tool()
async def push_architecture(architecture_json: str) -> str:
    """Push a generated architecture to the Arch Viewer app.

    Args:
        architecture_json: JSON string with title, detected_stack, nodes, edges.
    """
    try:
        data = json.loads(architecture_json)
    except json.JSONDecodeError as e:
        return f"Invalid JSON: {e}"

    title = data.get("title", "Untitled")
    detected_stack = data.get("detected_stack", [])
    nodes = data.get("nodes", [])
    edges = data.get("edges", [])

    payload = {
        "title": title,
        "detected_stack": detected_stack,
        "data": {"nodes": nodes, "edges": edges},
    }

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{BACKEND_URL}/api/sessions",
                json=payload,
                timeout=10,
                follow_redirects=True,
            )
            if resp.status_code == 201:
                session = resp.json()
                session_id = session["id"]
                return (
                    f"Architecture pushed successfully.\n"
                    f"Open in browser: http://localhost:13000/session/{session_id}\n"
                    f"Session ID: {session_id}"
                )
            return f"Backend returned {resp.status_code}: {resp.text}"
    except Exception as e:
        return f"Failed to push: {e}"


@mcp.tool()
async def list_sessions() -> str:
    """List all architecture sessions."""
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{BACKEND_URL}/api/sessions",
                timeout=5,
                follow_redirects=True,
            )
            sessions = resp.json()
            if not sessions:
                return "No sessions found."
            lines = [f"Found {len(sessions)} session(s):\n"]
            for s in sessions:
                lines.append(f"  - {s['title']} (ID: {s['id']}, created: {s['created_at']})")
            return "\n".join(lines)
    except Exception as e:
        return f"Failed to list sessions: {e}"


if __name__ == "__main__":
    mcp.run(transport="stdio")
```

- [ ] **Step 3: Set up venv**

```bash
python3 -m venv mcp-server/venv
mcp-server/venv/bin/pip install -r mcp-server/requirements.txt
```

- [ ] **Step 4: Commit**

```bash
git add mcp-server/
git commit -m "feat(v2): MCP server — 3 tools (health, push, list)"
```

---

### Task 8: Update .claude.json for MCP

**Files:**
- Modify: `.claude.json`

- [ ] **Step 1: Update .claude.json**

```json
{
  "mcpServers": {
    "arch-viewer": {
      "command": "/Users/sathwick/my-office/learning-projects/intelligent-arch-viewer/mcp-server/venv/bin/python",
      "args": ["/Users/sathwick/my-office/learning-projects/intelligent-arch-viewer/mcp-server/server.py"],
      "env": {
        "BACKEND_URL": "http://localhost:18000"
      }
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add .claude.json
git commit -m "feat(v2): update MCP config for v2 server"
```

---

### Task 9: Skill file — intelligent-arch-creator-v2

**Files:**
- Create: `skills/intelligent-arch-creator-v2/skill.md`

- [ ] **Step 1: Create skills/intelligent-arch-creator-v2/skill.md**

```markdown
---
name: intelligent-arch-creator-v2
description: Scan a codebase and generate an interactive architecture diagram in the Arch Viewer app.
---

# Intelligent Architecture Creator v2

You are an architecture analysis agent. Your job is to scan the current codebase and generate a structured architecture diagram that gets pushed to the Arch Viewer app for interactive visualization.

## Prerequisites

Before generating, call `check_app_health()` to verify the viewer is running. If it's not, tell the user to run `docker compose up` in the intelligent-arch-viewer project.

## Process

### 1. Scan the codebase

Read files in this priority order:
1. `docker-compose.yml`, `Dockerfile*` — infrastructure components
2. Entry points: `main.py`, `app.py`, `index.ts`, `server.ts`
3. Config files: `.env*`, `config.*`, `settings.*`
4. Route/handler files: `routes/`, `api/`, `handlers/`
5. Model/schema files: `models/`, `schemas/`, `db/`
6. Service files: `services/`, `consumers/`, `workers/`

### 2. Detect the tech stack

Identify technologies from imports, configs, and docker services:
- **Kafka**: `aiokafka`, `confluent-kafka`, kafka in docker-compose
- **Redis**: `redis`, `aioredis`, redis in docker-compose
- **PostgreSQL**: `asyncpg`, `psycopg2`, postgres in docker-compose
- **API frameworks**: FastAPI, Flask, Express, etc.

### 3. Generate architecture JSON

Output a JSON object with this exact structure. Positions are in pixels — place nodes thoughtfully with ~150px spacing between related components, ~300px between layers.

```json
{
  "title": "Project Name — Short Description",
  "detected_stack": ["fastapi", "kafka", "redis", "postgres"],
  "nodes": [
    {
      "id": "unique-id",
      "type": "kafka_broker | redis_cache | postgres_db | api_service | client_actor | external_service | container_box",
      "position": { "x": 100, "y": 200 },
      "data": {
        "label": "Component Name",
        // type-specific fields:
        // kafka_broker: subtitle, topics: [{name, partitions}]
        // redis_cache: role, details: [string]
        // postgres_db: subtitle, tables: [string], role
        // api_service: step, endpoints: [string], mode, framework
        // client_actor: subtitle, details: [string]
        // external_service: provider, details: [string]
        // container_box: subtitle, category, children: [{name, detail}]
      }
    }
  ],
  "edges": [
    {
      "id": "edge-id",
      "source": "source-node-id",
      "target": "target-node-id",
      "label": "publish | consume | HTTP | GEOSEARCH | etc.",
      "animated": false,
      "style": { "stroke": "#color", "strokeDasharray": "5 3" }
    }
  ]
}
```

### 4. Push to viewer

Call `push_architecture(json_string)` with the JSON stringified. The tool returns a URL — share it with the user.

## Node Type Guide

| Type | Use For | Key Data Fields |
|------|---------|----------------|
| `kafka_broker` | Kafka clusters | `topics: [{name, partitions}]` |
| `redis_cache` | Redis instances | `role` (Cache/PubSub/State), `details` |
| `postgres_db` | PostgreSQL/databases | `tables`, `subtitle` (port), `role` |
| `api_service` | HTTP services, consumers, workers | `endpoints`, `step` number, `mode` |
| `client_actor` | Browser, mobile, CLI clients | `subtitle`, `details` |
| `external_service` | Third-party APIs, CDNs | `provider`, `details` |
| `container_box` | Logical groupings (service boundary) | `category`, `children: [{name, detail}]` |

## Edge Style Guide

| Pattern | Style |
|---------|-------|
| Sync HTTP call | `{ "stroke": "#34d399" }` (solid green) |
| Kafka publish | `{ "stroke": "#f59e0b" }`, `animated: true` |
| Kafka consume | `{ "stroke": "#f59e0b", "strokeDasharray": "5 3" }` |
| Redis read/write | `{ "stroke": "#f87171" }` |
| Database query | `{ "stroke": "#60a5fa" }` |
| WebSocket | `{ "stroke": "#a78bfa", "strokeDasharray": "5 3" }` |

## Layout Tips

- Place clients on the left (x: 50-150)
- API services in the center-left (x: 250-400)
- Message brokers in the center (x: 400-600)
- Databases/caches on the right (x: 650-850)
- Vertical spacing: ~120px between nodes in the same column
- Use step numbers on API service nodes to show request flow order
```

- [ ] **Step 2: Commit**

```bash
git add skills/intelligent-arch-creator-v2/
git commit -m "feat(v2): new skill — intelligent-arch-creator-v2 with React Flow output"
```

---

### Task 10: End-to-end smoke test

- [ ] **Step 1: Start all services**

```bash
docker compose up --build
```

Wait for all three services (postgres, backend, frontend) to be healthy.

- [ ] **Step 2: Verify health**

```bash
curl http://localhost:18000/health
```

Expected: `{"status":"ok"}`

- [ ] **Step 3: Push test architecture via curl**

```bash
curl -X POST http://localhost:18000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test — Delivery Service",
    "detected_stack": ["fastapi", "kafka", "redis", "postgres"],
    "data": {
      "nodes": [
        {"id": "client", "type": "client_actor", "position": {"x": 50, "y": 200}, "data": {"label": "Customer App", "subtitle": "React · Vite :5905", "details": ["Map · WS client", "Places orders"]}},
        {"id": "api", "type": "api_service", "position": {"x": 300, "y": 150}, "data": {"label": "HTTP Router", "step": 1, "endpoints": ["POST /orders/place", "GEOSEARCH + atomic assign", "INSERT order (Postgres)"], "mode": "sync request-response"}},
        {"id": "kafka", "type": "kafka_broker", "position": {"x": 500, "y": 350}, "data": {"label": "Kafka Broker", "subtitle": ":9192", "topics": [{"name": "gps_events", "partitions": 3}, {"name": "dispatch_events", "partitions": 3}]}},
        {"id": "redis", "type": "redis_cache", "position": {"x": 650, "y": 100}, "data": {"label": "Redis", "role": "Geo Cache", "details": ["GEOSEARCH · assign state", "geo:riders · rider:{id}:state"]}},
        {"id": "postgres", "type": "postgres_db", "position": {"x": 700, "y": 300}, "data": {"label": "PostgreSQL", "subtitle": "PostGIS :5432", "tables": ["orders", "riders"], "role": "source of truth"}}
      ],
      "edges": [
        {"id": "e1", "source": "client", "target": "api", "label": "HTTP", "style": {"stroke": "#34d399"}},
        {"id": "e2", "source": "api", "target": "redis", "label": "GEOSEARCH", "style": {"stroke": "#f87171", "strokeDasharray": "5 3"}},
        {"id": "e3", "source": "api", "target": "kafka", "label": "publish", "animated": true, "style": {"stroke": "#f59e0b"}},
        {"id": "e4", "source": "api", "target": "postgres", "label": "INSERT", "style": {"stroke": "#60a5fa"}}
      ]
    }
  }'
```

Note the returned session ID.

- [ ] **Step 4: Open in browser**

Open `http://localhost:13000/session/{id}` — verify:
- Nodes render with proper shapes, colors, internal details
- Edges show with labels and correct styles
- Pan and zoom work
- Dragging a node saves position (reload to verify)

- [ ] **Step 5: Test via MCP**

In Claude Code, run:
```
> Use arch-viewer to check if the app is healthy
```

Then:
```
> Use arch-viewer to list sessions
```

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat(v2): iteration 1 complete — generate, render, drag"
```

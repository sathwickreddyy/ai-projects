CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLES
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE projects (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name         TEXT UNIQUE NOT NULL,
    path         TEXT NOT NULL,
    description  TEXT,
    last_scanned TIMESTAMPTZ,
    file_index   JSONB DEFAULT '{}',
    metadata     JSONB DEFAULT '{}',
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE architectures (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name       TEXT DEFAULT 'Default',
    nodes      JSONB DEFAULT '[]',
    edges      JSONB DEFAULT '[]',
    layout     JSONB DEFAULT '{}',
    mode       TEXT DEFAULT 'stage_diagram',
    theme      JSONB DEFAULT '{}',
    version    INT DEFAULT 1,
    is_active  BOOL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_preferences (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scope      TEXT DEFAULT 'global',
    key        TEXT NOT NULL,
    value      JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(scope, key)
);

CREATE TABLE component_library (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name          TEXT UNIQUE NOT NULL,
    category      TEXT NOT NULL,
    icon          TEXT NOT NULL,
    color         TEXT NOT NULL,
    border_color  TEXT NOT NULL,
    default_props JSONB DEFAULT '{}',
    keywords      TEXT[] DEFAULT '{}',
    sort_order    INT DEFAULT 0
);

CREATE TABLE skills (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT UNIQUE NOT NULL,
    description     TEXT NOT NULL,
    prompt_snippet  TEXT NOT NULL,
    trigger_pattern TEXT[] DEFAULT '{}',
    scope           TEXT DEFAULT 'global',
    approved_at     TIMESTAMPTZ DEFAULT NOW(),
    approved_by     TEXT DEFAULT 'user',
    active          BOOL DEFAULT TRUE
);

CREATE TABLE claude_reviews (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    architecture_id UUID REFERENCES architectures(id) ON DELETE CASCADE,
    prompt          TEXT NOT NULL,
    feedback        JSONB NOT NULL,
    applied         BOOL DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE change_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    architecture_id UUID REFERENCES architectures(id) ON DELETE CASCADE,
    change_type     TEXT NOT NULL,
    payload         JSONB NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- SEEDS: component_library
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO component_library (name, category, icon, color, border_color, keywords, sort_order) VALUES
-- queue
('Kafka',         'queue',          '📨', '#ef4444', '#f87171', ARRAY['kafka','confluent','topic','consumer','producer'], 1),
('RabbitMQ',      'queue',          '🐰', '#f97316', '#fb923c', ARRAY['rabbitmq','amqp','exchange'], 2),
('AWS SQS',       'queue',          '📬', '#eab308', '#facc15', ARRAY['sqs','aws','simple queue'], 3),
('Redis Streams', 'queue',          '⚡', '#dc2626', '#f87171', ARRAY['redis stream','xadd','xread'], 4),
-- database
('PostgreSQL',    'database',       '🐘', '#3b82f6', '#60a5fa', ARRAY['postgres','postgresql','asyncpg'], 10),
('Redis',         'database',       '🔴', '#ef4444', '#f87171', ARRAY['redis','cache','aioredis'], 11),
('MongoDB',       'database',       '🍃', '#22c55e', '#4ade80', ARRAY['mongo','mongodb','pymongo'], 12),
('Cassandra',     'database',       '👁',  '#8b5cf6', '#a78bfa', ARRAY['cassandra','cql'], 13),
('Elasticsearch', 'database',       '🔍', '#f59e0b', '#fbbf24', ARRAY['elasticsearch','opensearch'], 14),
('ClickHouse',    'database',       '📊', '#06b6d4', '#22d3ee', ARRAY['clickhouse','olap'], 15),
-- api
('FastAPI',       'api',            '⚡', '#059669', '#34d399', ARRAY['fastapi','uvicorn','@app.'], 20),
('GraphQL',       'api',            '🔮', '#e11d48', '#fb7185', ARRAY['graphql','strawberry'], 21),
('gRPC',          'api',            '🔗', '#7c3aed', '#a78bfa', ARRAY['grpc','protobuf'], 22),
('REST Gateway',  'api',            '🚪', '#0891b2', '#22d3ee', ARRAY['gateway','nginx','kong'], 23),
('WebSocket',     'api',            '🔌', '#16a34a', '#4ade80', ARRAY['websocket','ws','socketio'], 24),
-- infrastructure
('Docker',        'infrastructure', '🐳', '#0ea5e9', '#38bdf8', ARRAY['docker','dockerfile'], 30),
('Nginx',         'infrastructure', '🟩', '#15803d', '#4ade80', ARRAY['nginx','proxy_pass'], 31),
('Kubernetes',    'infrastructure', '☸',  '#3b82f6', '#60a5fa', ARRAY['kubernetes','k8s','helm'], 32),
('Load Balancer', 'infrastructure', '⚖',  '#6366f1', '#818cf8', ARRAY['load balancer','haproxy'], 33),
('AWS S3',        'infrastructure', '🪣', '#f59e0b', '#fbbf24', ARRAY['s3','boto3','minio'], 34),
('Celery',        'infrastructure', '🌿', '#84cc16', '#a3e635', ARRAY['celery','@task','worker'], 35);

-- ─────────────────────────────────────────────────────────────────────────────
-- SEEDS: user_preferences
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO user_preferences (scope, key, value) VALUES
('global', 'default_mode',      '"stage_diagram"'),
('global', 'theme_preference',  '"dark"'),
('global', 'layout_direction',  '"TB"'),
('global', 'show_data_flow',    'true'),
('global', 'export_formats',    '["png","mermaid","drawio"]'),
('global', 'auto_scan_on_open', 'true');

-- ─────────────────────────────────────────────────────────────────────────────
-- SEEDS: skills
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO skills (name, description, prompt_snippet, trigger_pattern, approved_by) VALUES
(
  'always_show_data_direction',
  'Always label edges with data direction and protocol',
  'Always label every connection with the protocol and direction (e.g. "HTTP POST ->", "Kafka topic ->"). Never leave an edge unlabeled.',
  ARRAY['always'],
  'system'
),
(
  'kafka_dlq_pattern',
  'Suggest Dead Letter Queue whenever Kafka is detected',
  'When Kafka is present in the architecture, always suggest adding a Dead Letter Queue (DLQ) consumer unless the user has explicitly disabled it.',
  ARRAY['kafka','confluent'],
  'system'
),
(
  'separate_read_write_paths',
  'Suggest read/write path separation for DB + cache systems',
  'For any system with both a database and a cache, suggest separating the read path (cache -> DB replica) from the write path (DB primary) if not already shown.',
  ARRAY['redis','postgres','mongodb'],
  'system'
);

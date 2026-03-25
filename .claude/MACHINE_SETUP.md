# Machine-Specific Setup

## Laptop (Pro subscription — cli mode)

IMPORTANT: cli mode requires the backend to run on the HOST machine, not inside Docker.
The claude binary is a macOS executable and will not run in a Linux container.

Option A — run backend on host (cli mode):
  .env:
    CLAUDE_AUTH_MODE=cli

  # Install backend deps on host
  cd backend && pip install -r requirements.txt
  # Start postgres only in Docker
  docker compose up postgres
  # Run backend directly
  PROJECTS_DIR=./projects DATABASE_URL=postgresql+asyncpg://arch:arch_secret@localhost:5432/arch_platform \
    uvicorn app.main:app --reload --port 8000

Option B — use api mode in Docker (simpler):
  .env:
    CLAUDE_AUTH_MODE=api
    ANTHROPIC_API_KEY=sk-ant-...
  docker compose up

Verify:
  curl http://localhost:8000/health
  # -> {"status":"ok","auth_mode":"cli","model":"claude-sonnet-4-20250514"}

## Mac Mini (AWS Bedrock — bedrock mode)

.env:
  CLAUDE_AUTH_MODE=bedrock
  AWS_ACCESS_KEY_ID=your-key
  AWS_SECRET_ACCESS_KEY=your-secret
  AWS_REGION=us-east-1
  BEDROCK_MODEL_ID=anthropic.claude-sonnet-4-5-v1

Requirements:
  - AWS credentials with bedrock:InvokeModel permission
  - No Claude CLI needed

Start:
  docker compose up

Verify:
  curl http://localhost:8000/health
  # -> {"status":"ok","auth_mode":"bedrock","model":"anthropic.claude-sonnet-4-5-v1"}

## Any machine (direct API key — api mode)

.env:
  CLAUDE_AUTH_MODE=api
  ANTHROPIC_API_KEY=sk-ant-...

Start:
  docker compose up

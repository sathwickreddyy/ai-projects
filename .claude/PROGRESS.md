# PROGRESS.md — file checklist

## .claude/ memory files
[x] .claude/MEMORY.md
[x] .claude/APPROACHES.md
[x] .claude/REVISIONS.md
[x] .claude/PROGRESS.md
[x] .claude/CONSTRAINTS.md

## Root
[x] .env.example  (updated: dual auth mode vars)
[x] docker-compose.yml  (updated: auth env vars + CLI volume)

## postgres/
[x] postgres/init.sql

## backend/
[x] backend/Dockerfile
[x] backend/requirements.txt  (updated: added boto3)
[x] backend/app/__init__.py
[x] backend/app/main.py
[x] backend/app/core/config.py  (updated: multi-mode auth + validate_auth)
[x] backend/app/db/session.py
[x] backend/app/api/projects.py
[x] backend/app/api/architectures.py
[x] backend/app/api/components.py
[x] backend/app/api/preferences.py
[x] backend/app/api/skills.py
[x] backend/app/api/claude.py
[x] backend/app/api/ws.py
[x] backend/app/services/scanner.py
[x] backend/app/services/claude_service.py  (updated: three-driver auth routing)
[x] backend/app/services/watcher.py

## frontend/
[x] frontend/Dockerfile
[x] frontend/package.json
[x] frontend/vite.config.ts
[x] frontend/tsconfig.json
[x] frontend/tailwind.config.js
[x] frontend/index.html
[x] frontend/src/main.tsx
[x] frontend/src/App.tsx
[x] frontend/src/api/client.ts
[x] frontend/src/types/index.ts
[x] frontend/src/stores/appStore.ts
[x] frontend/src/hooks/useArchitecture.ts
[x] frontend/src/hooks/useClaudeReview.ts
[x] frontend/src/hooks/useProjects.ts
[x] frontend/src/components/layout/AppShell.tsx
[x] frontend/src/components/layout/TopBar.tsx
[x] frontend/src/components/palette/ComponentPalette.tsx
[x] frontend/src/components/canvas/ArchCanvas.tsx
[x] frontend/src/components/canvas/CustomNode.tsx
[x] frontend/src/components/canvas/CustomEdge.tsx
[x] frontend/src/components/canvas/ModeToggle.tsx
[x] frontend/src/components/panels/RightPanel.tsx
[x] frontend/src/components/panels/ReviewPanel.tsx
[x] frontend/src/components/panels/PreferencesPanel.tsx
[x] frontend/src/components/panels/SkillsPanel.tsx
[x] frontend/src/components/panels/ExportPanel.tsx

## mcp-server/
[x] mcp-server/Dockerfile
[x] mcp-server/requirements.txt
[x] mcp-server/server.py

## projects/sample-fastapi-app/
[x] projects/sample-fastapi-app/docker-compose.yml
[x] projects/sample-fastapi-app/main.py
[x] projects/sample-fastapi-app/requirements.txt
[x] projects/sample-fastapi-app/README.md
[x] projects/sample-fastapi-app/.env.example
[x] projects/sample-fastapi-app/services/order_service.py
[x] projects/sample-fastapi-app/services/notification_service.py

## STATUS: ALL FILES COMPLETE [x]

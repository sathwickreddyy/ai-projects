import asyncio
import logging
import os
import time
from pathlib import Path

from sqlalchemy import text, update
from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer

from app.core.config import settings
from app.db.session import AsyncSessionLocal, Project

logger = logging.getLogger(__name__)

_last_event: dict[str, float] = {}
DEBOUNCE_SECONDS = 3.0


async def _mark_stale(project_name: str) -> None:
    async with AsyncSessionLocal() as db:
        await db.execute(
            update(Project)
            .where(Project.name == project_name)
            .values(metadata_=text("jsonb_set(COALESCE(metadata, '{}'), '{stale}', 'true')"))
        )
        await db.commit()
    logger.info("Marked project %s as stale", project_name)


class ProjectWatcherHandler(FileSystemEventHandler):
    def __init__(self, projects_dir: str, loop: asyncio.AbstractEventLoop) -> None:
        self.projects_dir = projects_dir
        self.loop = loop

    def _extract_project_name(self, path: str) -> str | None:
        try:
            rel = Path(path).relative_to(self.projects_dir)
            return rel.parts[0]
        except (ValueError, IndexError):
            return None

    def on_any_event(self, event) -> None:
        if event.is_directory:
            return
        project_name = self._extract_project_name(event.src_path)
        if not project_name:
            return

        now = time.time()
        last = _last_event.get(project_name, 0)
        if now - last < DEBOUNCE_SECONDS:
            return
        _last_event[project_name] = now

        asyncio.run_coroutine_threadsafe(_mark_stale(project_name), self.loop)


def run() -> None:
    projects_dir = settings.PROJECTS_DIR
    if not os.path.isdir(projects_dir):
        logger.warning("PROJECTS_DIR %s does not exist, watcher idle", projects_dir)
        return

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    handler = ProjectWatcherHandler(projects_dir, loop)
    observer = Observer()
    observer.schedule(handler, projects_dir, recursive=True)
    observer.start()
    logger.info("Watching %s for changes", projects_dir)

    try:
        loop.run_forever()
    except KeyboardInterrupt:
        observer.stop()
    observer.join()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run()

"""One model process across extraction and generation, including separate Next workers."""
from pathlib import Path
from filelock import FileLock


def model_lock():
    folder = Path(__file__).resolve().parent.parent / '.local-ai'
    folder.mkdir(exist_ok=True)
    return FileLock(folder / 'worker.lock', timeout=0)

"""Bootstrap local dependencies, build the UI, and serve both parts together."""
import os
from pathlib import Path
import subprocess
import sys
import venv

ROOT = Path(__file__).resolve().parent
ENV = ROOT / ".venv"
PYTHON = ENV / ("Scripts/python.exe" if os.name == "nt" else "bin/python")
FRONTEND = ROOT / "frontend"


def run(command, cwd=ROOT):
    if os.name == "nt" and command[0] == "npm":
        subprocess.run(subprocess.list2cmdline(["npm.cmd", *command[1:]]),
                       cwd=cwd, check=True, shell=True)
    else:
        subprocess.run(command, cwd=cwd, check=True)


def main():
    if not PYTHON.exists():
        venv.EnvBuilder(with_pip=True).create(ENV)
    if Path(sys.executable).resolve() != PYTHON.resolve():
        run([str(PYTHON), str(Path(__file__).resolve())])
        return
    run([str(PYTHON), "-m", "pip", "install", "-r", str(ROOT / "requirements.txt")])
    if not (FRONTEND / "node_modules").is_dir():
        run(["npm", "install"], cwd=FRONTEND)
    run(["npm", "run", "build"], cwd=FRONTEND)
    run([str(PYTHON), "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8000"], cwd=ROOT)


if __name__ == "__main__":
    main()

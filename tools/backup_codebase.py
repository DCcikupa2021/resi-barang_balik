#!/usr/bin/env python3
"""
backup_codebase.py — Regenerasi codebase.md dari isi folder proyek.

Pemakaian (dari root proyek):
    python tools/backup_codebase.py

Dipanggil OTOMATIS setiap selesai ubah kode (lihat .clinerules bagian 2).
File codebase.md hasil generate jangan diedit manual.
"""
import datetime
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT = os.path.join(ROOT, "codebase.md")

EXCLUDE_DIRS = {".git", "node_modules", "__pycache__", ".vscode", ".idea", ".cline",
                ".venv", "venv", ".cache"}
EXCLUDE_FILES = {"codebase.md"}
INCLUDE_EXT = {".md", ".js", ".css", ".html", ".json", ".py", ".gs", ".sql",
               ".txt", ".yml", ".yaml"}
MAX_BYTES = 300_000  # per file; file lebih besar dicatat tapi isi tidak ditempel

LANG = {
    ".js": "javascript", ".css": "css", ".html": "html", ".json": "json",
    ".py": "python", ".gs": "javascript", ".sql": "sql", ".md": "markdown",
    ".yml": "yaml", ".yaml": "yaml", ".txt": "text",
}


def iter_files():
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = sorted(d for d in dirnames if d not in EXCLUDE_DIRS)
        for name in sorted(filenames):
            if name in EXCLUDE_FILES:
                continue
            path = os.path.join(dirpath, name)
            rel = os.path.relpath(path, ROOT).replace(os.sep, "/")
            ext = os.path.splitext(name)[1].lower()
            if ext not in INCLUDE_EXT and name != ".clinerules":
                continue
            yield rel, path, ext


def main():
    files = sorted(iter_files())
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    lines = [
        "# Codebase Backup",
        "",
        f"_Auto-generated oleh `tools/backup_codebase.py` — {now}_",
        "",
        "> **Jangan edit file ini manual.** Jalankan ulang script setiap ada perubahan kode:",
        "> `python tools/backup_codebase.py`",
        "",
        "## Indeks File",
        "",
    ]
    for rel, _, _ in files:
        lines.append(f"- [`{rel}`](#{rel.replace('/', '').replace('.', '').lower()})")
    lines.append("")

    for rel, path, ext in files:
        lines += [f"## {rel}", ""]
        try:
            if os.path.getsize(path) > MAX_BYTES:
                lines += ["_File terlalu besar untuk ditempel — backup dilewati._", ""]
                continue
            with open(path, "r", encoding="utf-8", errors="replace") as f:
                content = f.read().rstrip()
            lang = LANG.get(ext, "text")
            lines += [f"```{lang}", content, "```", ""]
        except OSError as e:
            lines += [f"_Gagal membaca: {e}_", ""]

    with open(OUTPUT, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"OK: {len(files)} file dibackup -> {OUTPUT}")


if __name__ == "__main__":
    main()

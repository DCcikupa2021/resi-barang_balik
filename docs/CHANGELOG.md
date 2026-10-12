# CHANGELOG — Log Perubahan resi-barang_balik

> **Format ini WAJIB diisi setiap ada perubahan kode/struktur/alur** (lihat `.clinerules`).
> Entri baru selalu di **paling atas**. Pasangkan dengan entri identik di `changes.json`.
>
> Tipe: `documentation` | `feature` | `fix` | `refactor` | `config` | `flow`

---

## [2026-10-12] — feature — Implementasi aplikasi PWA lengkap

**Deskripsi:**
Pembuatan seluruh aplikasi + setup data:

- **Supabase (via MCP)**: tabel `resi` dibuat di Project 1 (`bpyoeudcvpwrofllwfdd`,
  ap-southeast-2): 24 kolom, unique index `no_order` (anti-numpuk), index `no_resi` &
  `resi_barang_balik`, RLS read-only untuk role `anon`. Backup DDL: `supabase/schema.sql`.
- **Frontend PWA**: `index.html` (2 box container, Tailwind CDN, dark-mode anti-kedip),
  `style.css` (tema SweetAlert2 + panel kamera), `app.js` (load sekali → index in-memory →
  scan instan; SweetAlert2 loading/hasil/error; kamera html5-qrcode; toggle dark/light +
  localStorage; auto-refresh 10 menit), `config.js` (URL + publishable key).
- **PWA**: `manifest.json` + `sw.js` (cache shell `resi-pwa-v1`, network-first Supabase)
  + 5 ikon PNG via `tools/generate_icons.py` (Pillow).
- **GAS**: `gas/Code.gs` — sync tab "All" → Supabase (upsert `on_conflict=no_order`,
  dedup No Order, cleanup baris hilang), guard jam 08.00–17.00 WIB,
  `setupTriggers()` / `testSync()` / `doGet()` (cek status).
- **README.md**: panduan lengkap deploy GAS + buat akun GitHub + push + GitHub Pages + PWA.
- **PRD** naik ke **v0.2** dengan penambahan **FR-08 (PWA)**.

**Validasi:**
`node --check` lolos untuk `app.js`, `sw.js`, `config.js`; tabel diverifikasi via SQL.

**File terdampak:**
`index.html`, `style.css`, `app.js`, `config.js`, `manifest.json`, `sw.js`,
`icons/*` (5 PNG), `supabase/schema.sql`, `gas/Code.gs`, `README.md`,
`tools/generate_icons.py`, `PRD.md`, `docs/CHANGELOG.md`, `docs/changes.json`, `struktur.md`

**Catatan alur:**
Data flow final: Sheet → GAS (08–17, upsert+cleanup) → Supabase → frontend fetch sekali
→ index in-memory → hasil scan instan. Pencocokan 3 kolom (No Order / No Resi /
Resi barang Balik) → tampilkan Feedback.

---

## [2026-10-12] — documentation — Inisialisasi dokumentasi proyek

**Deskripsi:**
Pembuatan fondasi dokumentasi sebelum implementasi kode:

- `PRD.md` — Product Requirements Document v0.1: ringkasan produk, alur utama,
  FR-01..FR-07 (tanpa login, scan 3 kolom → Feedback, sinkron GAS jam 08–17 upsert
  anti-numpuk, responsif 320px+, dark/light mode, GitHub Pages), arsitektur data,
  skema tabel `resi`, stack, setup, risiko.
- `.clinerules` — aturan kerja: wajib baca PRD/struktur/CHANGELOG sebelum ngoding;
  dokumentasi otomatis setiap perubahan; stack tetap (HTML + Tailwind CDN + vanilla JS,
  SweetAlert2, html5-qrcode); batasan keamanan (tanpa service role key di frontend).
- `struktur.md` — peta file (fase dokumentasi + target implementasi).
- `codebase.md` — backup otomatis via `tools/backup_codebase.py`.
- `docs/CHANGELOG.md` + `docs/changes.json` — sistem log perubahan ganda (MD + JSON).
- `tools/backup_codebase.py` — script Python generator backup kode.

**File terdampak:**
`PRD.md`, `.clinerules`, `struktur.md`, `codebase.md`, `docs/CHANGELOG.md`,
`docs/changes.json`, `tools/backup_codebase.py`

**Catatan alur:**
Belum ada kode aplikasi; sheet sudah diverifikasi (header 21 kolom, tab "All"
gid 1625321251), Supabase Project 1 (`bpyoeudcvpwrofllwfdd`) terverifikasi kosong.

---

<!-- TEMPLATE ENTRI BARU:
## [YYYY-MM-DD] — <tipe> — <Judul singkat>

**Deskripsi:**
<apa yang berubah dan kenapa>

**File terdampak:**
`file1`, `file2`

**Catatan alur:**
<perubahan alur/logika, jika ada>
-->

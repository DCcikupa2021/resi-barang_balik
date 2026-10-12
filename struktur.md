# struktur.md — Peta Struktur Proyek

> Dokumen ini **wajib diperbarui** setiap kali file ditambah/dihapus/dipindah
> (lihat `.clinerules` bagian 2).

## Struktur saat ini (2026-10-12 — fase implementasi PWA selesai)

```
resi-barang_balik/
├── PRD.md                 ← Product Requirements Document v0.2 (sumber requirements)
├── .clinerules            ← Aturan kerja otomatis Cline (dokumentasi + teknis)
├── struktur.md            ← Dokumen ini (peta file)
├── codebase.md            ← Backup seluruh isi kode (AUTO-GENERATED, jangan diedit manual)
├── README.md              ← Panduan setup: GAS + GitHub + GitHub Pages + PWA
├── index.html             ← UI: Box 1 (Scan Resi) + Box 2 (Hasil), Tailwind CDN, dark-mode anti-kedip
├── style.css              ← Tema SweetAlert2, panel kamera, safe-area, animasi hasil
├── app.js                 ← Load sekali → index in-memory → scan instan; SweetAlert2; kamera; tema
├── config.js              ← SUPABASE_URL + publishable key (aman, RLS read-only)
├── manifest.json          ← Manifest PWA (standalone, ikon 192/512/maskable)
├── sw.js                  ← Service Worker (cache v1; shell cache-first, Supabase network-first)
├── icons/                 ← Ikon PWA hasil tools/generate_icons.py (5 PNG)
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── icon-maskable-512.png
│   ├── apple-touch-icon.png
│   └── favicon-32.png
├── supabase/
│   └── schema.sql         ← Backup DDL tabel resi (sudah dijalankan via MCP)
├── gas/
│   └── Code.gs            ← Sync Sheet "All" → Supabase (upsert+cleanup, guard 08–17 WIB)
├── docs/
│   ├── CHANGELOG.md       ← Log perubahan (Markdown)
│   └── changes.json       ← Log perubahan (JSON)
└── tools/
    ├── backup_codebase.py ← Regenerate codebase.md
    └── generate_icons.py  ← Generate ikon PWA (Pillow)
```

## Peran file inti

| File | Peran |
|---|---|
| `index.html` | Struktur 2 box container; head memuat Tailwind CDN + konfigurasi dark mode class + font + SweetAlert2 + html5-qrcode |
| `style.css` | Nilai konfigurasi Tailwind (darkMode: 'class', tema, warna badge per Feedback) |
| `app.js` | Satu-satunya logika JS; jalur: `loadData()` → `buildIndex()` → `search()` → `renderResult()` |
| `config.js` | Konfigurasi aman (tanpa rahasia) |
| `gas/Code.gs` | Satu-satunya tempat service role key (via Script Properties) |
| `codebase.md` | Snapshot backup — selalu bisa diregenerasi, tidak jadi sumber edit |

## File yang TIDAK boleh ada
- `node_modules/`, `package.json`, bundler config (tanpa build step)
- File berisi service role key / kredensial rahasia apa pun di root

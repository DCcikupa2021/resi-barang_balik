# PRD — Aplikasi Cek Resi Barang Balik

| | |
|---|---|
| Versi | 0.2 |
| Tanggal | 2026-10-12 |
| Status | Disetujui — siap implementasi |
| Hosting | GitHub Pages (static, HTTPS) |

## 1. Ringkasan Produk

Aplikasi web **statis** untuk cek status/feedback resi (khususnya resi barang balik)
dengan cara **scan barcode lewat kamera HP** atau **input manual**. Sumber kebenaran
adalah Google Sheet (tab "All"), di-sinkronkan ke **Supabase** oleh **Google Apps
Script**, lalu dimuat sekali ke browser sehingga hasil scan muncul **instan**.

**Tanpa halaman login** — user langsung masuk ke tampilan utama.

## 2. Sasaran & Ukuran Sukses

- Scan/input → hasil **Feedback tampil instan** (lookup in-memory, tanpa jaringan).
- Supabase **tidak pernah menumpuk** walau sync berjalan berkali-kali (upsert by `no_order`).
- **Full support** HP Android 320px, tablet, laptop/PC — tidak ada elemen terpotong.
- **Dark & light mode**, preferensi tema tersimpan.
- Sinkronisasi data **hanya jam 08.00–17.00 WIB** setiap hari.

## 3. Pengguna

Operator/CS yang menangani resi barang balik marketplace (Shopee dkk). Mayoritas
akses via HP, sebagian tablet/laptop.

## 4. Alur Utama Aplikasi

1. Buka aplikasi → data dimuat sekali dari Supabase (± 1000 baris, ± 150 KB) → SweetAlert2 loading.
2. Box 1: scan barcode (kamera) **atau** ketik manual → Enter/tombol Cari → SweetAlert2 loading "Mencari data resi...".
3. Nilai dibersihkan (trim + uppercase) lalu dicocokkan ke kolom: **No Order**, **No Resi**, **Resi barang Balik**.
4. Cocok → Box 2 tampilkan **Feedback** + detail. Tidak cocok → pesan "Resi tidak ditemukan". Multi-match → tampilkan semua.
5. Auto-refresh background tiap 10 menit + tombol refresh manual.
6. Info "Data terakhir sinkron: HH:MM" (dari `updated_at`) supaya user tahu kesegaran data.

## 5. Fitur (Functional Requirements)

### FR-01 — Tanpa login
Tidak ada halaman login/registrasi. Langsung ke tampilan utama.

### FR-02 — Box 1: Scan Resi
- Input manual + tombol Cari / Enter.
- Tombol 📷 kamera → library `html5-qrcode` (CDN) → scan barcode/QR.
- Pencocokan ke **3 kolom sekaligus**: `No Order` | `No Resi` | `Resi barang Balik`
  (case-insensitive, trim spasi) — user tidak perlu memilih kolom.
- Izin kamera ditolak / gagal → SweetAlert2 error yang jelas.
- Kamera hanya jalan di HTTPS/localhost (GitHub Pages ✅, `file://` ❌).

### FR-03 — Box 2: Hasil
- Info utama: kolom **Feedback** sebagai badge besar, **color-coded per jenis**:
  Asuransi = amber/kuning, Barang Balik = ungu, Kurang Kirim = oranye, Batal = merah.
- Detail pendukung: kolom sumber hasil match, No Order, Ekspedisi, Kota,
  Nominal Transaksi, Status Tiket.
- State: loading (SweetAlert2), ditemukan, tidak ditemukan, multi-match, error jaringan.

### FR-04 — Sinkronisasi Google Sheet → Supabase
- Pelaku: `gas/Code.gs`.
- Jadwal: trigger `onEdit` + timer tiap 5 menit, **dibatasi jam 08.00–17.00 WIB**
  (`SYNC_START_HOUR` / `SYNC_END_HOUR`, mudah diubah di baris atas script).
- Metode: baca tab "All" (gid 1625321251) → POST ke Supabase REST dengan
  `on_conflict=no_order` + `Prefer: resolution=merge-duplicates` (**upsert — anti numpuk**).
- Auto-cleanup: baris yang dihapus dari sheet ikut terhapus dari Supabase.
- **Service role key disimpan di Script Properties GAS** — tidak pernah di kode/frontend.

### FR-05 — Tata letak responsif (mobile-first)
- Minimal didukung **lebar 320px** (HP Android entry) — tidak ada elemen terpotong.
- ≤ 640px (HP): Box 1 & Box 2 bertumpuk vertikal.
- 641–1024px (Tablet): lebar diperluas proporsional, tidak kekecilan.
- > 1024px (Laptop/PC): Box 1 & Box 2 berdampingan 2 kolom, max-width ± 900px, center.
- Tanpa tinggi fixed (`min-h-dvh`), teks panjang (resi) pakai `break-all`.
- Tombol/input ukuran tap-friendly (min 44px).

### FR-06 — Tema Dark / Light
- Toggle 🌙/☀️ di header; Tailwind `dark:` variant dengan **strategy `class`**.
- Preferensi disimpan di `localStorage`; saat pertama buka mengikuti `prefers-color-scheme`.
- Berlaku untuk semua elemen **termasuk SweetAlert2**. Badge warna tetap kontras di kedua tema.

### FR-07 — Hosting GitHub Pages
- Murni statis: `index.html`, `style.css`, `app.js`, `config.js` — tanpa build step.

### FR-08 — PWA (Progressive Web App) *(ditambahkan v0.2)*
- `manifest.json`: nama "Cek Resi Barang Balik", display standalone, theme color indigo,
  ikon 192/512/maskable (generated via `tools/generate_icons.py`, Pillow).
- `sw.js` service worker (cache versi `resi-pwa-v1`):
  - app shell → cache-first (update dengan naikkan versi `CACHE`);
  - request Supabase → network-first + fallback cache (data terakhir tetap tampil offline).
- Bisa dipasang di HP via "Add to Home screen"; `start_url`/`scope` relatif (`"./"`)
  agar cocok untuk GitHub Pages project site (`/resi-barang_balik/`).

## 6. Arsitektur Data

```
Google Sheet tab "All" (gid 1625321251)
   │   GAS Code.gs — onEdit + timer 5 menit, JAM 08.00–17.00 WIB
   │   upsert on_conflict=no_order (anti numpuk) + cleanup
   ▼
Supabase (Project 1, ref bpyoeudcvpwrofllwfdd, region ap-southeast-2)
   │   frontend fetch sekali (anon key, RLS read-only)
   ▼
Index di memori browser (Map dari 3 kolom scan → baris)
   │   scan/input → lookup in-memory → HASIL INSTAN
   ▼
Box 2 (Feedback + detail)
```

## 7. Skema Data Supabase — tabel `resi`

21 kolom mengikuti persis header tab "All":
`No, Marketplace, Submit data, Tgl Order, Bulan, No Order, Lokasi, Ekspedisi,
No Resi, Resi barang Balik, Provinsi, Kota, Nominal Transaksi, Topic, Feedback,
Status Tiket, Reason, Action DC, Asuransi JNE, Duplikat, Update Reason`

- `id` uuid PK default gen_random_uuid()
- `no_order` **TEXT UNIQUE NOT NULL** ← kunci anti-duplikasi (target upsert)
- `no_resi`, `resi_barang_balik` TEXT + index (dasar pencarian)
- `feedback` TEXT — kolom yang ditampilkan di Box 2
- `updated_at` timestamptz default now() — untuk info "terakhir sinkron"
- **RLS aktif**: role `anon` hanya boleh `SELECT`.

## 8. Stack Teknologi

| Lapisan | Teknologi |
|---|---|
| Markup/Style | HTML5 + Tailwind CSS **Play CDN** (strategy class) + Google Fonts (Plus Jakarta Sans) |
| Logic | Vanilla JavaScript (tanpa framework, tanpa build) |
| Alert/loading | SweetAlert2 (CDN) |
| Scan barcode | html5-qrcode (CDN) |
| Database | Supabase — Project 1 (`bpyoeudcvpwrofllwfdd`, ap-southeast-2) |
| Sinkronisasi | Google Apps Script (`gas/Code.gs`) |
| Data source | Google Sheet ID `1wlp-OSIPVaEXUWqPm2JnEHPNSgET1938GT9u2WjwaOs`, tab "All" gid `1625321251` |
| Hosting | GitHub Pages |

## 9. Persyaratan Non-Fungsional
- Performa: load awal < 3 detik; hasil scan instan setelah data termuat.
- Keamanan: anon/publishable key read-only (RLS); service role key hanya di Script Properties GAS.
- Ketersediaan di luar jam sync: data tetap tampil (hasil sync terakhir) + freshness ditampilkan.
- Kuota: ± 1000 baris — jauh di bawah batas free tier Supabase.

## 10. Asumsi & Batasan
- Google Sheet tetap bisa dibaca GAS (otorisasi via Apps Script, bukan link publik).
- Tidak ada di versi ini: login, edit data dari aplikasi, notifikasi real-time.
- Jika ada `no_order` duplikat di sheet → ambil baris pertama + tampilkan catatan jumlah duplikat.
- CSV export Google tidak dipakai di frontend (diblokir CORS).

## 11. Langkah Setup & Deployment
1. Supabase: jalankan `supabase/schema.sql` (tabel + unique + index + RLS) — via MCP/Cline.
2. Ambil **Service Role Key** & **Publishable Key** Project 1 (dashboard → Settings → API).
3. Google Sheet → Extensions → Apps Script → paste `gas/Code.gs` → Project Settings
   tambah Script Properties: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
4. Deploy sebagai Web App (Execute as: Me, Access: Anyone) + jalankan fungsi pasang trigger.
5. Isi `config.js` (URL + publishable key) → test scan dengan resi contoh
   (`JT06800191264` / `251114P43GJNR6`).
6. Push ke GitHub → aktifkan GitHub Pages.

## 12. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Cold start GAS lambat | Frontend query langsung ke Supabase — GAS hanya untuk sync |
| Data numpuk di Supabase | Upsert `on_conflict=no_order` + cleanup |
| Sheet private / berubah struktur | Verifikasi header via CSV export; guard kolom wajib di Code.gs |
| Kamera gagal (HTTP/file://) | Hosting HTTPS (GitHub Pages); fallback input manual + pesan jelas |
| Sync berhenti (luar jam/trigger mati) | Tampilkan "terakhir sinkron"; README panduan cek trigger |

---
_Setiap perubahan requirements wajib memperbarui dokumen ini + versi di tabel atas._


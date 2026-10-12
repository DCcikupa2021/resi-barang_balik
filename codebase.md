# Codebase Backup

_Auto-generated oleh `tools/backup_codebase.py` — 2026-10-12 16:30:12_

> **Jangan edit file ini manual.** Jalankan ulang script setiap ada perubahan kode:
> `python tools/backup_codebase.py`

## Indeks File

- [`.clinerules`](#clinerules)
- [`PRD.md`](#prdmd)
- [`README.md`](#readmemd)
- [`app.js`](#appjs)
- [`config.js`](#configjs)
- [`docs/CHANGELOG.md`](#docschangelogmd)
- [`docs/changes.json`](#docschangesjson)
- [`gas/Code.gs`](#gascodegs)
- [`index.html`](#indexhtml)
- [`manifest.json`](#manifestjson)
- [`struktur.md`](#strukturmd)
- [`style.css`](#stylecss)
- [`supabase/schema.sql`](#supabaseschemasql)
- [`sw.js`](#swjs)
- [`tools/backup_codebase.py`](#toolsbackup_codebasepy)
- [`tools/generate_icons.py`](#toolsgenerate_iconspy)

## .clinerules

```text
# .clinerules — Aturan Kerja Proyek resi-barang_balik

## 1. Wajib baca sebelum ubah kode
1. `PRD.md` — requirements & keputusan desain.
2. `struktur.md` — peta file.
3. `docs/CHANGELOG.md` — riwayat perubahan terakhir.

## 2. Dokumentasi OTOMATIS (wajib setiap ada perubahan)
Setiap kali mengubah **kode, struktur, atau alur aplikasi**, WAJIB dalam satu sesi yang sama:
1. Append entri ke `docs/CHANGELOG.md` (tanggal, tipe, deskripsi, file terdampak).
2. Append entri identik ke `docs/changes.json` (array `log`, field: `id`, `date`, `type`,
   `description`, `files`, `author`). Format JSON harus valid.
3. Struktur file berubah? → perbarui `struktur.md`.
4. Regenerasi backup kode: jalankan `python tools/backup_codebase.py`
   (menulis ulang `codebase.md` — **jangan edit codebase.md manual**).
5. Requirements berubah? → perbarui `PRD.md` + naikkan versi PRD.
   Jenis tipe entri: `documentation` | `feature` | `fix` | `refactor` | `config` | `flow`.

**Jangan pernah mengubah kode tanpa memperbarui dokumentasi.**

## 3. Aturan teknis (stack tetap — jangan diganti tanpa diskusi)
- **HTML + Tailwind Play CDN + vanilla JS. Tanpa build step, tanpa framework**
  (React/Vue/Next/dll dilarang).
- Library hanya dari CDN yang sudah ditetapkan: **SweetAlert2**, **html5-qrcode**,
  **Tailwind**, **Google Fonts (Plus Jakarta Sans)**.
- `config.js` hanya berisi URL + anon/publishable key Supabase.
  **JANGAN PERNAH** menaruh service role key di file frontend.
- Kunci unik anti-duplikasi Supabase: kolom **`no_order`**
  (upsert `on_conflict=no_order`, `Prefer: resolution=merge-duplicates`).
- Pencarian cocok ke kolom: **`no_order`, `no_resi`, `resi_barang_balik`**
  (case-insensitive, trim). Hasil ditampilkan dari kolom **`feedback`**.
- Sinkron GAS **hanya 08.00–17.00** (`SYNC_START_HOUR`/`SYNC_END_HOUR` di `Code.gs`).
- Tailwind dark mode: **strategy `class`**; persist di localStorage.
- Responsif minimal **320px**; tanpa fixed height (`min-h-dvh`); teks panjang `break-all`.
- SweetAlert2 dipakai untuk **semua** state loading/hasil/error.
- Bahasa dokumen & komunikasi: **Indonesia**. Komentar kode: Indonesia ringkas.
- Hosting: **GitHub Pages** (HTTPS). Data source: Google Sheet tab "All" gid `1625321251`.

## 4. Konvensi kode
- Satu file JS/CSS statis per fungsi (lihat `struktur.md`); jangan bikin bundler.
- Konsisten pakai prefix class Tailwind + helper kecil di `app.js`
  (mis. `esc()` untuk escaping HTML).
- Selesai edit → verifikasi: buka `index.html`, test scan manual + kamera bila memungkinkan.
```

## PRD.md

```markdown
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
```

## README.md

```markdown
# 📦 Cek Resi Barang Balik — PWA

Aplikasi web **PWA** untuk cek feedback resi barang balik: **scan barcode lewat kamera HP**
atau **input manual** (No Order / No Resi / Resi Barang Balik), hasil = kolom **Feedback**
dari Google Sheet. Data di-supervise Supabase supaya scan **instan** tanpa delay.

> Requirements lengkap: [`PRD.md`](PRD.md) • Struktur: [`struktur.md`](struktur.md) •
> Log perubahan: [`docs/CHANGELOG.md`](docs/CHANGELOG.md)

## ✨ Fitur
- 🔍 Scan kamera (html5-qrcode) + input manual — cocok ke 3 kolom sekaligus
- ⚡ Hasil instan (data di-index di memori browser)
- 🎨 Tailwind modern, **dark/light mode**, responsive 320px+ (HP s/d PC)
- 🔔 Loading & notifikasi SweetAlert2 (termasuk state tidak ditemukan/error)
- 📲 **PWA** — bisa dipasang di HP (Add to Home Screen), cache offline
- 🔒 Aman: anon key read-only (RLS), service role key hanya di GAS

## 🗂 Struktur File
```
index.html   UI (2 box: Scan Resi + Hasil)     sw.js        service worker (PWA)
style.css    custom style + tema SweetAlert2   manifest.json manifest PWA
app.js       logika scan/index/render          config.js    URL + anon key Supabase
gas/Code.gs  sinkron Sheet -> Supabase         supabase/schema.sql (backup DDL)
tools/       backup & generator ikon           icons/       ikon PWA
```

## 🔄 Cara Kerja Data
```
Google Sheet (tab "All") --GAS 08.00-17.00 (upsert, anti numpuk)--> Supabase
Supabase --fetch sekali saat buka app--> index memori browser --scan--> hasil instan
```

---

## 1️⃣ Setup Google Apps Script (sinkronisasi)

Supabase tabel `resi` sudah dibuat (Project 1). Tinggal pasang GAS:

1. Buka Google Sheet -> **Extensions -> Apps Script**.
2. Hapus isi Code.gs, **paste seluruh isi `gas/Code.gs`** dari repo ini, save.
3. **Project Settings (⚙) -> Script Properties** -> tambah 2 properti:
   | Nama | Nilai |
   |---|---|
   | `SUPABASE_URL` | `https://bpyoeudcvpwrofllwfdd.supabase.co` |
   | `SUPABASE_SERVICE_ROLE_KEY` | service role key dari [dashboard Supabase](https://supabase.com/dashboard) -> Project 1 -> Settings -> API -> `service_role` (secret!) |
4. **Deploy -> New deployment -> Web app**:
   - Execute as: **Me**  •  Who access: **Anyone**
   - Setelah deploy, **salin URL Web App** (bisa dibuka untuk cek status: `{"ok":true,...}`).
5. Di editor Apps Script: pilih fungsi **`setupTriggers`** -> **Run** (sekali saja) ->
   setujui izin. Trigger 5 menit + onEdit aktif.
6. Test: jalankan **`testSync`** -> cek log (Executions) -> seharusnya "Sync selesai: N baris".
7. Verifikasi data masuk: buka app, info sinkron harus menampilkan jumlah resi + waktu.

> Jam sync: **08.00–17.00 WIB** (ubah `SYNC_START_HOUR`/`SYNC_END_HOUR` di Code.gs).
> Sinkron jalan otomatis onEdit + tiap 5 menit selama jam kerja.

## 2️⃣ GitHub & GitHub Pages (hosting)

### a. Buat akun GitHub (sekali saja)
1. Buka **https://github.com/signup**
2. Isi email, buat password, pilih username (disarankan: **`dccikupa`** — huruf kecil,
   tanpa spasi; kalau sudah dipakai tambahkan angka, mis. `dccikupa1`).
3. Verifikasi email -> akun jadi.

### b. Bikin repository
1. Login -> klik **+** (kanan atas) -> **New repository**
2. Repository name: **`resi-barang_balik`** -> **Public** -> centang
   **Add a README file** -> **Create repository**.

### c. Push kode dari PC (sekali lagi untuk update berikutnya tinggal `git push`)
> Kode lokal sudah di-commit dengan profil **DC Cikupa**. Tinggal hubungkan:

```bash
# 1. (Opsional) sesuaikan email dengan akun GitHub kamu
git config user.email "email-kamu@contoh.com"

# 2. hubungkan ke repo remote (ganti USERNAME dengan username GitHub kamu)
git remote add origin https://github.com/USERNAME/resi-barang_balik.git
git branch -M main

# 3. push (saat diminta login, pilih "Sign in with your browser")
git push -u origin main
```

### d. Aktifkan GitHub Pages
1. Buka repo -> **Settings -> Pages** (sidebar kiri)
2. Source: **Deploy from a branch** -> Branch: **main** / **/ (root)** -> **Save**.
3. Tunggu 1-2 menit. Aplikasi live di:
   `https://USERNAME.github.io/resi-barang_balik/`

## 3️⃣ Install sebagai PWA di HP
1. Buka URL aplikasi di Chrome HP (harus HTTPS — sudah otomatis di GitHub Pages).
2. Menu ⋮ -> **Add to Home screen** / **Pasang aplikasi**.
3. Ikon "Resi Balik" muncul di layar utama; buka seperti app biasa (fullscreen, offline-ready).

## 🧪 Test Cepat
| Skenario | Input contoh | Ekspektasi |
|---|---|---|
| Match No Order | `251114P43GJNR6` | Feedback: **Asuransi** |
| Match No Resi | `JT06800191264` | Feedback: **Asuransi** |
| Match Resi Barang Balik | `JT08276483165` | Feedback: **Asuransi** |
| Tidak ada | `AAAA9999` | "Resi tidak ditemukan" |
| Kamera | tombol 📷 | Scan barcode -> hasil langsung muncul |

## ❓ Troubleshooting
| Masalah | Solusi |
|---|---|
| "Belum ada data — pastikan GAS sudah sync" | Jalankan `testSync` di Apps Script; cek Script Properties terisi |
| "Gagal memuat data" di app | Cek koneksi; cek URL Supabase & anon key di `config.js` |
| Kamera tidak bisa dibuka | Harus HTTPS + izin kamera; `file://` tidak mendukung kamera |
| Data tidak muncul padahal ada di sheet | Cek header sheet tidak berubah nama; cek log GAS ada error |
| Update aplikasi tidak muncul di HP | Hard reload / clear cache; kalau ubah file statis, naikkan versi `CACHE` di `sw.js` |

## 🧾 Aturan Proyek
Setiap ubah kode **wajib** update dokumentasi (`.clinerules`): `docs/CHANGELOG.md`,
`docs/changes.json`, `struktur.md`, lalu jalankan `python tools/backup_codebase.py`.
```

## app.js

```javascript
/**
 * app.js — logika utama PWA cek resi (lihat PRD.md FR-02/03/06/08)
 * Alur: loadData() -> buildIndex() -> cari() -> tampilkanHasil()
 * Data dimuat sekali dari Supabase lalu di-index in-memory => scan instan.
 */
(function () {
  "use strict";

  const CFG = window.APP_CONFIG || {};

  /** Kolom yang bisa di-scan/di-input (PRD FR-02) */
  const KEY_KOLOM = [
    ["no_order", "No Order"],
    ["no_resi", "No Resi"],
    ["resi_barang_balik", "Resi barang Balik"],
  ];

  /** key normal (UPPER+trim) -> array { row, source } */
  const INDEX = new Map();
  let lastSync = "";
  let cariSedangJalan = false;
  let scanner = null;

  const $ = (s) => document.querySelector(s);
  const norm = (v) => String(v == null ? "" : v).trim().toUpperCase();

  /** Escape HTML — semua data dari sheet wajib lewat sini (anti XSS) */
  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );
  }

  /** Format nominal jadi Rupiah kalau berupa angka polos */
  function fmtRp(v) {
    const s = String(v == null ? "" : v).trim();
    if (!s) return "";
    if (/^\d+(\.\d+)?$/.test(s)) return "Rp" + Number(s).toLocaleString("id-ID");
    return s;
  }

  /** Ambil semua baris dari Supabase (anon key, RLS read-only) */
  async function fetchRows() {
    const url = CFG.SUPABASE_URL + "/rest/v1/resi?select=*&order=no_order.asc";
    const res = await fetch(url, {
      headers: {
        apikey: CFG.SUPABASE_ANON_KEY,
        Authorization: "Bearer " + CFG.SUPABASE_ANON_KEY,
      },
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.json();
  }

  /** Susun index in-memory dari 3 kolom scan */
  function buildIndex(rows) {
    INDEX.clear();
    lastSync = "";
    for (const row of rows) {
      if (row.updated_at && row.updated_at > lastSync) lastSync = row.updated_at;
      for (const [kol, label] of KEY_KOLOM) {
        const k = norm(row[kol]);
        if (!k) continue;
        if (!INDEX.has(k)) INDEX.set(k, []);
        const arr = INDEX.get(k);
        if (!arr.some((h) => h.row.id === row.id)) arr.push({ row: row, source: label });
      }
    }
    renderInfoSync(rows.length);
  }

  /** Info "terakhir sinkron" di bawah Box 2 (PRD FR-03 / Alur #6) */
  function renderInfoSync(jumlah) {
    const el = $("#info-sync");
    if (!jumlah) {
      el.textContent = "⚠ Belum ada data — pastikan GAS sudah sync (jam 08–17)";
      return;
    }
    let waktu = "";
    if (lastSync) {
      const d = new Date(lastSync);
      waktu = d.toLocaleString("id-ID", {
        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
      });
    }
    el.textContent = jumlah.toLocaleString("id-ID") + " resi • Sinkron " + (waktu || "-");
  }

  /** Muat data dari Supabase; silent=true untuk refresh background */
  async function loadData(silent) {
    if (!silent) {
      Swal.fire({
        title: "Memuat data resi…",
        text: "Mengambil data dari Supabase",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });
    }
    try {
      const rows = await fetchRows();
      buildIndex(rows);
      if (!silent) Swal.close();
      return true;
    } catch (err) {
      console.error("Load data gagal:", err);
      $("#info-sync").textContent = "⚠ Gagal memuat data — coba Refresh";
      if (!silent) {
        Swal.fire({
          icon: "error",
          title: "Gagal memuat data",
          text: "Cek koneksi internet, lalu tekan tombol Refresh.",
          confirmButtonText: "Mengerti",
        });
      }
      return false;
    }
  }

  /** Cari exact-match (sudah dinormalisasi) di index */
  function cari(q) {
    return INDEX.get(norm(q)) || [];
  }

  // ====== RENDER BOX 2 ======

  function badgeFeedback(fb) {
    const f = norm(fb);
    if (f.includes("ASURANSI")) return "bg-amber-100 text-amber-900 dark:bg-amber-400/20 dark:text-amber-300";
    if (f.includes("BARANG BALIK")) return "bg-violet-100 text-violet-900 dark:bg-violet-400/20 dark:text-violet-300";
    if (f.includes("KURANG KIRIM")) return "bg-orange-100 text-orange-900 dark:bg-orange-400/20 dark:text-orange-300";
    if (f.includes("BATAL")) return "bg-rose-100 text-rose-900 dark:bg-rose-400/20 dark:text-rose-300";
    return "bg-sky-100 text-sky-900 dark:bg-sky-400/20 dark:text-sky-300";
  }

  /** Satu baris detail (label : nilai) */
  function baris(label, nilai, mono) {
    const v = String(nilai == null ? "" : nilai).trim();
    if (!v) return "";
    return (
      '<div class="flex gap-2 justify-between items-baseline">' +
      '<dt class="shrink-0 text-slate-500 dark:text-slate-400">' + esc(label) + "</dt>" +
      '<dd class="text-right font-semibold break-all' + (mono ? " font-mono text-[13px]" : "") + '">' +
      esc(v) + "</dd></div>"
    );
  }

  function kartuHasil(hit, i, total) {
    const r = hit.row;
    const fb = String(r.feedback || "").trim() || "—";
    return (
      '<article class="hasil-baru rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/50 p-4">' +
      (total > 1
        ? '<p class="text-xs font-bold text-slate-400 mb-2">HASIL ' + (i + 1) + " DARI " + total + "</p>"
        : "") +
      '<p class="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Feedback</p>' +
      '<span class="inline-block mt-1.5 px-4 py-2 rounded-xl text-lg font-extrabold break-words ' +
      badgeFeedback(fb) + '">' + esc(fb) + "</span>" +
      '<dl class="mt-4 grid gap-1.5 text-sm">' +
      baris("Ketemu di", hit.source) +
      baris("No Order", r.no_order, true) +
      baris("No Resi", r.no_resi, true) +
      baris("Resi Balik", r.resi_barang_balik, true) +
      baris("Marketplace", r.marketplace) +
      baris("Ekspedisi", r.ekspedisi) +
      baris("Kota", [r.kota, r.provinsi].filter(Boolean).join(", ")) +
      baris("Nominal", fmtRp(r.nominal_transaksi)) +
      baris("Status Tiket", r.status_tiket) +
      "</dl></article>"
    );
  }

  function tampilkanHasil(hits, q) {
    const box = $("#hasil");
    if (!hits.length) {
      box.innerHTML =
        '<div class="hasil-baru text-center py-10 px-4">' +
        '<div class="text-5xl mb-3" aria-hidden="true">🔍</div>' +
        '<p class="font-bold text-amber-600 dark:text-amber-400">Resi tidak ditemukan</p>' +
        '<p class="text-sm text-slate-500 dark:text-slate-400 mt-1 break-all">“' + esc(q) +
        '” tidak ada di data. Periksa lagi atau tunggu sinkron berikutnya.</p></div>';
      return;
    }
    box.innerHTML = hits.map((h, i) => kartuHasil(h, i, hits.length)).join("");
  }

  // ====== ALUR PENCARIAN (loading SweetAlert2 — PRD FR-03) ======
  async function handleCari(q) {
    q = String(q == null ? "" : q).trim();
    if (!q) {
      Swal.fire({ icon: "info", title: "Isi dulu resinya", timer: 1500, showConfirmButton: false });
      return;
    }
    if (cariSedangJalan) return;
    cariSedangJalan = true;
    Swal.fire({
      title: "Mencari data resi…",
      text: q,
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });
    if (INDEX.size === 0) await loadData(true); // pastikan data siap (baru buka app)
    const hits = cari(q);
    Swal.close();
    tampilkanHasil(hits, q);
    $("#input-resi").value = q;
    cariSedangJalan = false;
  }

  // ====== KAMERA (html5-qrcode) ======
  async function bukaKamera() {
    if (typeof Html5Qrcode === "undefined") {
      Swal.fire({ icon: "error", title: "Library kamera belum termuat", text: "Cek koneksi internet lalu muat ulang halaman." });
      return;
    }
    $("#panel-kamera").classList.remove("hidden");
    if (!scanner) scanner = new Html5Qrcode("reader", { verbose: false });
    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 160 } },
        (text) => {
          $("#input-resi").value = text;
          handleCari(text);
          tutupKamera();
        },
        () => {} // callback error per-frame diabaikan
      );
    } catch (err) {
      console.error("Kamera gagal:", err);
      tutupKamera();
      Swal.fire({
        icon: "error",
        title: "Kamera tidak bisa dibuka",
        text: "Berikan izin kamera, dan buka halaman lewat HTTPS (GitHub Pages). Input manual tetap bisa dipakai.",
      });
    }
  }

  async function tutupKamera() {
    $("#panel-kamera").classList.add("hidden");
    if (scanner) {
      try { await scanner.stop(); } catch (e) { /* sudah berhenti */ }
    }
  }

  // ====== TEMA DARK/LIGHT (PRD FR-06) ======
  function initTema() {
    const gelap = document.documentElement.classList.contains("dark");
    $("#icon-theme").textContent = gelap ? "☀️" : "🌙";
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", gelap ? "#0f172a" : "#6366f1");
  }

  function toggleTema() {
    const gelap = document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", gelap ? "dark" : "light");
    initTema();
  }

  // ====== INIT + EVENT ======
  $("#form-cari").addEventListener("submit", (e) => {
    e.preventDefault();
    handleCari($("#input-resi").value);
  });
  $("#btn-kamera").addEventListener("click", bukaKamera);
  $("#btn-tutup-kamera").addEventListener("click", tutupKamera);
  $("#btn-refresh").addEventListener("click", () => loadData(false));
  $("#btn-theme").addEventListener("click", toggleTema);

  initTema();
  loadData(false);

  // Auto-refresh background (PRD Alur #5)
  setInterval(() => loadData(true), CFG.REFRESH_INTERVAL_MS || 10 * 60 * 1000);

  // PWA: daftarkan service worker (PRD FR-08)
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch((err) => console.warn("SW gagal:", err));
    });
  }
})();
```

## config.js

```javascript
/**
 * config.js — Konfigurasi aman aplikasi (tanpa rahasia).
 * RLS Supabase memastikan anon key hanya bisa BACA. Lihat PRD.md §8.
 */
window.APP_CONFIG = {
  /** URL project Supabase (Project 1, region ap-southeast-2) */
  SUPABASE_URL: "https://bpyoeudcvpwrofllwfdd.supabase.co",
  /** Publishable key (aman terekspos di frontend) */
  SUPABASE_ANON_KEY:
    "sb_publishable_2cJhmMAvH5DF1lS5-GXG1A_Lr9Gx7yi",
  /** Auto-refresh data p_background (ms) — PRD FR-04/Alur #5 */
  REFRESH_INTERVAL_MS: 10 * 60 * 1000,
};
```

## docs/CHANGELOG.md

```markdown
# CHANGELOG — Log Perubahan resi-barang_balik

> **Format ini WAJIB diisi setiap ada perubahan kode/struktur/alur** (lihat `.clinerules`).
> Entri baru selalu di **paling atas**. Pasangkan dengan entri identik di `changes.json`.
>
> Tipe: `documentation` | `feature` | `fix` | `refactor` | `config` | `flow`

---

## [2026-10-12] — fix — Backup codebase kebaca folder .venv

**Deskripsi:**
`tools/backup_codebase.py` ikut membackup isi `.venv/` (436 file, kebanyakan pip).
Diperbaiki: `.venv`, `venv`, `.cache` ditambahkan ke `EXCLUDE_DIRS`; ditambah `.gitignore`
biar folder virtualenv/cache nggak pernah masuk git. `codebase.md` diregenerasi (16 file).

**File terdampak:**
`tools/backup_codebase.py`, `.gitignore`, `codebase.md`

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
```

## docs/changes.json

```json
{
  "project": "resi-barang_balik",
  "description": "Log perubahan otomatis proyek. Entri WAJIB ditambahkan setiap ada perubahan kode/struktur/alur (lihat .clinerules). Selalu sinkron dengan docs/CHANGELOG.md.",
  "entry_schema": {
    "id": "integer, urut naik",
    "date": "YYYY-MM-DD",
    "type": "documentation | feature | fix | refactor | config | flow",
    "description": "string, penjelasan perubahan",
    "files": ["array file terdampak"],
    "author": "string"
  },
  "log": [
    {
      "id": 1,
      "date": "2026-10-12",
      "type": "documentation",
      "description": "Inisialisasi dokumentasi proyek: PRD.md v0.1 (requirements lengkap: tanpa login, scan 3 kolom No Order/No Resi/Resi barang Balik → Feedback, sinkron GAS jam 08.00-17.00 WIB upsert anti-numpuk, responsif 320px+, dark/light mode, SweetAlert2, GitHub Pages), .clinerules (aturan dokumentasi otomatis + stack tetap), struktur.md (peta file), codebase.md (backup via tools/backup_codebase.py), sistem log ganda CHANGELOG.md + changes.json.",
      "files": [
        "PRD.md",
        ".clinerules",
        "struktur.md",
        "codebase.md",
        "docs/CHANGELOG.md",
        "docs/changes.json",
        "tools/backup_codebase.py"
      ],
      "author": "Cline"
    },
    {
      "id": 2,
      "date": "2026-10-12",
      "type": "feature",
      "description": "Implementasi aplikasi PWA lengkap: tabel Supabase resi via MCP (Project 1 bpyoeudcvpwrofllwfdd, unique no_order, RLS anon read-only), frontend PWA (index.html Tailwind 2 box, app.js index-in-memory scan instan + SweetAlert2 + kamera html5-qrcode + dark mode + auto-refresh 10menit, style.css, config.js), PWA (manifest.json, sw.js cache resi-pwa-v1, 5 ikon PNG via tools/generate_icons.py), gas/Code.gs (sync upsert on_conflict=no_order + dedup + cleanup + guard jam 08-17 WIB + setupTriggers/testSync/doGet), README.md panduan deploy GAS & GitHub Pages, PRD naik v0.2 (FR-08 PWA). Validasi: node --check app.js/sw.js/config.js OK.",
      "files": [
        "index.html",
        "style.css",
        "app.js",
        "config.js",
        "manifest.json",
        "sw.js",
        "icons/icon-192.png",
        "icons/icon-512.png",
        "icons/icon-maskable-512.png",
        "icons/apple-touch-icon.png",
        "icons/favicon-32.png",
        "supabase/schema.sql",
        "gas/Code.gs",
        "README.md",
        "tools/generate_icons.py",
        "PRD.md",
        "docs/CHANGELOG.md",
        "docs/changes.json",
        "struktur.md"
      ],
      "author": "Cline"
    },
    {
      "id": 3,
      "date": "2026-10-12",
      "type": "fix",
      "description": "Backup codebase kebaca folder .venv (436 file) - tambahkan .venv/venv/.cache ke EXCLUDE_DIRS di tools/backup_codebase.py, buat .gitignore (tanpa meng-ignore dirinya sendiri), regenerate codebase.md (16 file bersih).",
      "files": [
        "tools/backup_codebase.py",
        ".gitignore",
        "codebase.md"
      ],
      "author": "Cline"
    }
  ],
  "next_id": 4
}
```

## gas/Code.gs

```javascript
/**
 * Code.gs — Sinkronisasi Google Sheet tab "All" -> Supabase (tabel public.resi)
 *
 * CARA PAKAI:
 * 1. Buka Google Sheet -> Extensions -> Apps Script, paste file ini.
 * 2. Project Settings -> Script Properties, tambah:
 *      SUPABASE_URL              = https://bpyoeudcvpwrofllwfdd.supabase.co
 *      SUPABASE_SERVICE_ROLE_KEY = (service role key dari dashboard Supabase)
 * 3. Deploy -> New deployment -> Web app
 *      Execute as : Me
 *      Who access : Anyone
 * 4. Jalankan fungsi setupTriggers() SEKALI (Execution config -> pilih setupTriggers).
 * 5. Test: jalankan testSync() atau buka URL web app (doGet) untuk cek status.
 *
 * Sync berjalan OTOMATIS: onEdit + timer tiap 5 menit, DIBATASI jam
 * SYNC_START_HOUR - SYNC_END_HOUR (lihat bawah). Upsert by no_order =>
 * data TIDAK MENUMUK walau sync berkali-kali.
 */

var SHEET_NAME = 'All';        // nama tab sumber data
var SYNC_START_HOUR = 8;       // jam mulai sync (WIB)
var SYNC_END_HOUR = 17;        // jam berhenti sync (exclusive)
var CHUNK = 200;               // ukuran batch upsert

// Pemetaan header sheet -> kolom snake_case di Supabase (PRD §7)
var KOLOM = {
  'No': 'no',
  'Marketplace': 'marketplace',
  'Submit data': 'submit_data',
  'Tgl Order': 'tgl_order',
  'Bulan': 'bulan',
  'No Order': 'no_order',
  'Lokasi': 'lokasi',
  'Ekspedisi': 'ekspedisi',
  'No Resi': 'no_resi',
  'Resi barang Balik': 'resi_barang_balik',
  'Provinsi': 'provinsi',
  'Kota': 'kota',
  'Nominal Transaksi': 'nominal_transaksi',
  'Topic': 'topic',
  'Feedback': 'feedback',
  'Status Tiket': 'status_tiket',
  'Reason': 'reason',
  'Action DC': 'action_dc',
  'Asuransi JNE': 'asuransi_jne',
  'Duplikat': 'duplikat',
  'Update Reason': 'update_reason'
};

/** Baca konfigurasi dari Script Properties (RAHASIA — jangan tempel di kode!) */
function cfg_() {
  var p = PropertiesService.getScriptProperties();
  var url = p.getProperty('SUPABASE_URL');
  var key = p.getProperty('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) {
    throw new Error('Script Properties SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum diisi.');
  }
  return { url: String(url).replace(/\/+$/, ''), key: String(key) };
}

/** Fungsi utama sinkronisasi — dipanggil trigger onEdit & timer 5 menit */
function syncSheetToSupabase() {
  // Guard jam kerja: di luar 08.00-17.00 tidak ada tembakan ke Supabase
  var jam = new Date().getHours();
  if (jam < SYNC_START_HOUR || jam >= SYNC_END_HOUR) {
    Logger.log('Diluar jam sync (jam %s), dilewati.', jam);
    return;
  }

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error('Sheet "' + SHEET_NAME + '" tidak ditemukan.');
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) {
    Logger.log('Tidak ada baris data.');
    return;
  }
  var headers = values[0].map(function (h) { return String(h).trim(); });

  var nowIso = new Date().toISOString();
  var seen = {};   // dedup: No Order duplikat di sheet -> baris pertama menang
  var rows = [];

  for (var i = 1; i < values.length; i++) {
    var obj = { synced_at: nowIso, updated_at: nowIso };
    var adaIsi = false;
    for (var c = 0; c < headers.length; c++) {
      var kol = KOLOM[headers[c]];
      if (!kol) continue;
      var v = values[i][c];
      if (v instanceof Date) {
        v = Utilities.formatDate(v, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');
      }
      v = String(v).trim();
      obj[kol] = v;
      if (v !== '' && kol !== 'no') adaIsi = true;
    }
    if (!adaIsi) continue; // baris kosong dilewati

    // Kunci unik anti-duplikasi (fallback kalau No Order kosong)
    if (!obj.no_order) {
      obj.no_order = obj.no_resi ? ('NORESI:' + obj.no_resi) : ('ROW:' + (i + 1));
    }
    if (seen[obj.no_order]) {
      Logger.log('No Order %s duplikat di baris sheet %d — dilewati.', obj.no_order, i + 1);
      continue;
    }
    seen[obj.no_order] = true;
    rows.push(obj);
  }

  if (!rows.length) {
    Logger.log('Tidak ada baris valid untuk sync.');
    return;
  }

  var conf = cfg_();
  var hdr = {
    'apikey': conf.key,
    'Authorization': 'Bearer ' + conf.key,
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates,return=minimal'
  };

  // UPSERT per chunk — on_conflict=no_order => update in-place, tidak numpuk
  for (var s = 0; s < rows.length; s += CHUNK) {
    var part = rows.slice(s, s + CHUNK);
    var res = UrlFetchApp.fetch(conf.url + '/rest/v1/resi?on_conflict=no_order', {
      method: 'post',
      contentType: 'application/json',
      headers: hdr,
      payload: JSON.stringify(part),
      muteHttpExceptions: true
    });
    var code = res.getResponseCode();
    if (code >= 300) {
      throw new Error('Upsert gagal HTTP ' + code + ': ' + res.getContentText());
    }
  }

  // CLEANUP: hapus baris Supabase yang tidak ikut sync ini (dihapus dari sheet)
  var delHdr = { 'apikey': conf.key, 'Authorization': 'Bearer ' + conf.key };
  [
    '/rest/v1/resi?synced_at=lt.' + encodeURIComponent(nowIso),
    '/rest/v1/resi?synced_at=is.null'
  ].forEach(function (q) {
    var del = UrlFetchApp.fetch(conf.url + q, {
      method: 'delete',
      headers: delHdr,
      muteHttpExceptions: true
    });
    if (del.getResponseCode() >= 300) {
      Logger.log('Cleanup gagal HTTP %s: %s', del.getResponseCode(), del.getContentText());
    }
  });

  Logger.log('Sync selesai: %s baris diupsert.', rows.length);
}

// ====== TRIGGER & UTILITAS ======

/** Jalankan SEKALI setelah deploy: pasang trigger 5 menit + onEdit */
function setupTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('syncSheetToSupabase').timeBased().everyMinutes(5).create();
  ScriptApp.newTrigger('syncSheetToSupabase')
    .forSpreadsheet(SpreadsheetApp.getActive()).onEdit().create();
  Logger.log('Trigger terpasang: tiap 5 menit + onEdit (jam 08-17 WIB).');
}

/** Test sync manual dari editor Apps Script */
function testSync() {
  syncSheetToSupabase();
}

/** Web app GET: cek kesehatan + jumlah baris di Supabase */
function doGet() {
  try {
    var conf = cfg_();
    var res = UrlFetchApp.fetch(conf.url + '/rest/v1/resi?select=id', {
      headers: {
        apikey: conf.key,
        'Authorization': 'Bearer ' + conf.key,
        'Prefer': 'count=exact'
      },
      muteHttpExceptions: true
    });
    var range = res.getHeaders()['content-range'] || '';
    var total = range.split('/')[1] || '?';
    return json_({ ok: true, supabase_rows: total, sync_hours: SYNC_START_HOUR + '-' + SYNC_END_HOUR });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## index.html

```html
<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="#6366f1" />
  <meta name="description" content="Cek feedback resi barang balik — scan barcode atau input No Order / No Resi / Resi Barang Balik." />
  <title>Cek Resi Barang Balik</title>

  <!-- PWA -->
  <link rel="manifest" href="manifest.json" />
  <link rel="icon" href="icons/favicon-32.png" type="image/png" />
  <link rel="apple-touch-icon" href="icons/apple-touch-icon.png" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

  <!-- Font -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

  <!-- Tailwind (Play CDN, strategy class) -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: "class",
      theme: {
        extend: {
          fontFamily: { sans: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"] },
        },
      },
    };
    // Terapkan tema sebelum paint (anti kedip) — PRD FR-06
    (function () {
      var t = localStorage.getItem("theme");
      if (t === "dark" || (!t && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
        document.documentElement.classList.add("dark");
      }
    })();
  </script>

  <!-- SweetAlert2 + style -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css" />
  <link rel="stylesheet" href="style.css" />
</head>
<body class="min-h-dvh font-sans bg-gradient-to-br from-slate-100 via-indigo-50 to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-cyan-950 text-slate-800 dark:text-slate-100 antialiased">

  <!-- HEADER -->
  <header class="px-4 pt-6 pb-2 mx-auto max-w-5xl flex items-start justify-between gap-3">
    <div class="flex items-center gap-3 min-w-0">
      <div class="shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 shadow-lg shadow-indigo-500/30 grid place-items-center text-white text-2xl" aria-hidden="true">📦</div>
      <div class="min-w-0">
        <h1 class="text-xl sm:text-2xl font-extrabold tracking-tight leading-tight">
          Cek Resi <span class="bg-gradient-to-r from-indigo-500 to-cyan-400 bg-clip-text text-transparent">Barang Balik</span>
        </h1>
        <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Scan atau ketik resi — feedback langsung muncul</p>
      </div>
    </div>
    <button id="btn-theme" type="button" aria-label="Ganti tema gelap/terang"
      class="shrink-0 w-11 h-11 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm grid place-items-center text-lg hover:scale-105 active:scale-95 transition">
      <span id="icon-theme">🌙</span>
    </button>
  </header>

  <!-- MAIN: 1 kolom di HP, 2 kolom berdampingan di laptop (PRD FR-05) -->
  <main class="px-4 pb-10 pt-4 mx-auto max-w-5xl grid gap-5 lg:grid-cols-2 items-start">

    <!-- ============ BOX 1 — SCAN RESI ============ -->
    <section aria-labelledby="judul-scan"
      class="rounded-3xl bg-white/85 dark:bg-slate-800/85 backdrop-blur border border-white/60 dark:border-slate-700 shadow-xl shadow-slate-900/5 p-5 sm:p-6">
      <h2 id="judul-scan" class="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-indigo-600 dark:text-cyan-400 mb-4">
        <span aria-hidden="true">🔍</span> Scan Resi
      </h2>

      <form id="form-cari" class="flex flex-col sm:flex-row gap-2.5" autocomplete="off">
        <label for="input-resi" class="sr-only">No Order / No Resi / Resi Barang Balik</label>
        <input id="input-resi" name="resi" type="text" autocapitalize="characters" spellcheck="false"
          placeholder="No Order / No Resi / Resi Balik…"
          class="min-h-[48px] flex-1 w-full min-w-0 rounded-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 text-base font-semibold tracking-wide uppercase placeholder:normal-case placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/30 dark:focus:ring-cyan-500/30" />
        <button type="submit"
          class="min-h-[48px] px-6 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-400 text-white font-bold shadow-lg shadow-indigo-500/30 hover:opacity-90 active:scale-95 transition">
          Cari
        </button>
      </form>

      <div class="mt-3 flex flex-wrap items-center gap-2">
        <button id="btn-kamera" type="button"
          class="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-2xl bg-indigo-50 dark:bg-slate-900/60 border border-indigo-200 dark:border-slate-700 text-indigo-700 dark:text-cyan-300 text-sm font-semibold hover:bg-indigo-100 dark:hover:bg-slate-900 transition">
          <span aria-hidden="true">📷</span> Scan pakai kamera
        </button>
        <span class="text-xs text-slate-400 dark:text-slate-500">Ketik lalu Enter, atau scan barcode</span>
      </div>

      <!-- Panel kamera (dibuka saat tombol kamera ditekan) -->
      <div id="panel-kamera" class="hidden mt-4">
        <div class="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black">
          <div id="reader" class="w-full min-h-[220px]"></div>
        </div>
        <button id="btn-tutup-kamera" type="button"
          class="mt-3 inline-flex items-center gap-2 min-h-[44px] px-4 rounded-2xl bg-rose-50 dark:bg-slate-900/60 border border-rose-200 dark:border-slate-700 text-rose-700 dark:text-rose-300 text-sm font-semibold">
          ✕ Tutup kamera
        </button>
      </div>

      <p class="mt-4 text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
        Pencocokan otomatis ke kolom <b>No Order</b>, <b>No Resi</b>, dan <b>Resi barang Balik</b>.
        Kamera butuh koneksi HTTPS (aman di GitHub Pages).
      </p>
    </section>

    <!-- ============ BOX 2 — HASIL ============ -->
    <section aria-labelledby="judul-hasil"
      class="rounded-3xl bg-white/85 dark:bg-slate-800/85 backdrop-blur border border-white/60 dark:border-slate-700 shadow-xl shadow-slate-900/5 p-5 sm:p-6">
      <h2 id="judul-hasil" class="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-indigo-600 dark:text-cyan-400 mb-4">
        <span aria-hidden="true">📦</span> Hasil
      </h2>

      <div id="hasil">
        <div class="text-center py-10 px-4">
          <div class="text-5xl mb-3" aria-hidden="true">🧭</div>
          <p class="font-semibold text-slate-500 dark:text-slate-400">Belum ada pencarian</p>
          <p class="text-sm text-slate-400 dark:text-slate-500 mt-1">Scan barcode atau ketik resi di kotak sebelah</p>
        </div>
      </div>

      <div class="mt-4 pt-3 border-t border-slate-200/70 dark:border-slate-700 flex items-center justify-between gap-2 text-xs">
        <span id="info-sync" class="text-slate-400 dark:text-slate-500">Memuat data…</span>
        <button id="btn-refresh" type="button" title="Muat ulang data"
          class="inline-flex items-center gap-1 min-h-[36px] px-3 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-200 dark:hover:bg-slate-900 transition">
          <span aria-hidden="true">⟳</span> Refresh
        </button>
      </div>
    </section>

  </main>

  <footer class="pb-8 text-center text-[11px] text-slate-400 dark:text-slate-600 px-4">
    Data dari Google Sheet • Sinkron 08.00–17.00 WIB • Bisa dipasang sebagai aplikasi (Add to Home Screen)
  </footer>

  <!-- Library + aplikasi -->
  <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
  <script src="https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js"></script>
  <script src="config.js"></script>
  <script src="app.js"></script>
</body>
</html>
```

## manifest.json

```json
{
  "name": "Cek Resi Barang Balik",
  "short_name": "Resi Balik",
  "description": "Cek feedback resi barang balik: scan barcode atau input No Order / No Resi / Resi Barang Balik.",
  "id": "./",
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#0f172a",
  "theme_color": "#6366f1",
  "lang": "id",
  "categories": ["business", "productivity"],
  "icons": [
    {
      "src": "icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "icons/icon-maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

## struktur.md

```markdown
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
```

## style.css

```css
/* style.css — override & komponen khusus (di-load setelah Tailwind CDN) */

/* === Transisi tema: halus tapi nggak bikin animasi aneh saat scroll === */
body { transition: background-color .25s ease, color .25s ease; }

/* === SweetAlert2 senada tema (PRD FR-06) === */
.swal2-popup {
  border-radius: 1.25rem !important;
  font-family: "Plus Jakarta Sans", system-ui, sans-serif !important;
  box-shadow: 0 25px 50px -12px rgb(0 0 0 / .25);
  border: 1px solid rgb(148 163 184 / .25);
}
.swal2-title { font-weight: 800 !important; }
.swal2-confirm { border-radius: .9rem !important; font-weight: 700 !important; }
html.dark .swal2-popup { background: #1e293b; color: #f1f5f9; }
html.dark .swal2-title { color: #f8fafc; }
html.dark .swal2-html-container { color: #cbd5e1; }
html.dark .swal2-icon { background: transparent; }

/* === Animasi kemunculan hasil === */
@keyframes hasil-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: none; }
}
.hasil-baru { animation: hasil-in .25s ease-out; }

/* === Panel kamera html5-qrcode === */
#reader { background: #000; }
#reader video { width: 100% !important; border-radius: 0; }
#reader__scan_region { min-height: 220px; background: transparent; }
#reader img[alt="Info icon"] { display: none !important; } /* sembunyikan ikon izin bawaan */
#reader__dashboard {
  background: rgb(15 23 42 / .85) !important;
  border-radius: 0 0 1rem 1rem;
  padding: .5rem !important;
}
#reader__dashboard button {
  border-radius: .75rem !important;
  min-height: 40px;
  background: #6366f1 !important;
  border: none !important;
  color: #fff !important;
  font-weight: 700 !important;
}
#reader__dashboard span, #reader__dashboard select, #reader__dashboard input {
  color: #e2e8f0 !important;
}

/* === Safe area HP (notch/bilah bawah) === */
footer { padding-bottom: calc(2rem + env(safe-area-inset-bottom, 0px)); }

/* === Input resi: teks panjang tetap kebaca (PRD FR-05) === */
#input-resi { max-width: 100%; }
```

## supabase/schema.sql

```sql
-- schema.sql — Backup DDL Supabase tabel `resi` (Project 1: bpyoeudcvpwrofllwfdd)
-- Sumber kebenaran tetap Google Sheet; tabel ini diisi oleh gas/Code.gs (upsert).
-- Sudah dijalankan via Cline MCP pada 2026-10-12 — file ini cadangan dokumentasi.

create table if not exists public.resi (
  id uuid primary key default gen_random_uuid(),
  no_order text not null,          -- kunci anti-duplikasi (upsert on_conflict)
  no text,
  marketplace text,
  submit_data text,
  tgl_order text,
  bulan text,
  lokasi text,
  ekspedisi text,
  no_resi text,                    -- kolom scan
  resi_barang_balik text,          -- kolom scan
  provinsi text,
  kota text,
  nominal_transaksi text,
  topic text,
  feedback text,                   -- kolom utama yang ditampilkan di Box 2
  status_tiket text,
  reason text,
  action_dc text,
  asuransi_jne text,
  duplikat text,
  update_reason text,
  synced_at timestamptz,           -- penanda sync terakhir per baris (untuk cleanup)
  updated_at timestamptz not null default now()
);

-- Kunci anti-duplikasi + index kolom scan
create unique index if not exists resi_no_order_key on public.resi (no_order);
create index if not exists resi_no_resi_idx on public.resi (no_resi);
create index if not exists resi_resi_barang_balik_idx on public.resi (resi_barang_balik);

-- RLS: anon (frontend) hanya boleh baca
alter table public.resi enable row level security;

drop policy if exists "anon read resi" on public.resi;
create policy "anon read resi" on public.resi
  for select to anon using (true);

grant select on public.resi to anon;
```

## sw.js

```javascript
/**
 * sw.js — Service Worker PWA (PRD FR-08).
 * Strategi:
 *  - App shell  : cache-first (file statis jarang berubah; update lewat versi CACHE)
 *  - Supabase   : network-first + fallback cache (data terakhir tetap tampil offline)
 *  - CDN (Tailwind/SweetAlert2/html5-qrcode/Fonts): lewat saja (biar HTTP cache browser)
 * SELALU naikkan versi CACHE saat rilis perubahan!
 */
const CACHE = "resi-pwa-v1";
const SHELL = [
  "./",
  "index.html",
  "style.css",
  "app.js",
  "config.js",
  "manifest.json",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/apple-touch-icon.png",
  "icons/favicon-32.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Data Supabase: network-first, fallback ke cache kalau offline/gagal
  if (url.hostname.endsWith(".supabase.co")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Same-origin (app shell): cache-first, fallback network
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req, { ignoreSearch: req.mode === "navigate" }).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            if (res.ok && req.mode !== "navigate") {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
            }
            return res;
          })
      )
    );
    return;
  }

  // Lainnya (CDN dsb): biarkan jaringan
});
```

## tools/backup_codebase.py

```python
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
```

## tools/generate_icons.py

```python
"""
generate_icons.py — Generate ikon PWA (PNG) pakai Pillow.

Pemakaian:  python tools/generate_icons.py
Output:     icons/icon-192.png, icons/icon-512.png, icons/icon-maskable-512.png,
            icons/apple-touch-icon.png, icons/favicon-32.png
"""
import os

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "icons")
os.makedirs(OUT, exist_ok=True)

TOP = (99, 102, 241)    # indigo-500
BOT = (34, 211, 238)    # cyan-400
WHITE = (255, 255, 255, 255)

FONT_CANDIDATES = [
    r"C:\Windows\Fonts\segoeuib.ttf",
    r"C:\Windows\Fonts\arialbd.ttf",
    "DejaVuSans-Bold.ttf",
]


def _font(size):
    for p in FONT_CANDIDATES:
        try:
            return ImageFont.truetype(p, size)
        except OSError:
            continue
    return ImageFont.load_default()


def gradient(size):
    """Gradient diagonal indigo -> cyan."""
    img = Image.new("RGB", (size, size))
    px = img.load()
    for y in range(size):
        for x in range(size):
            t = (x / size + y / size) / 2
            px[x, y] = tuple(int(TOP[i] + (BOT[i] - TOP[i]) * t) for i in range(3))
    return img.convert("RGBA")


def draw_icon(size, maskable=False, text=True):
    """Ikon: gradient + ikon paket (box) + teks RESI."""
    img = gradient(size)
    d = ImageDraw.Draw(img)
    s = size

    # Maskable butuh safe zone ( elemen penting di dalam lingkaran 80% )
    box = int(s * (0.50 if maskable else 0.42))
    x0 = (s - box) // 2
    y0 = (s - box) // 2 - (int(s * 0.07) if text and not maskable else 0)
    y0 = max(y0, int(s * 0.08))

    lw = max(4, int(s * 0.035))
    d.rounded_rectangle([x0, y0, x0 + box, y0 + box],
                        radius=int(s * 0.07), outline=WHITE, width=lw)
    # Garis tutup box (lid)
    lid_y = y0 + int(box * 0.32)
    d.line([x0 + lw, lid_y, x0 + box - lw, lid_y], fill=WHITE, width=lw)
    # Strip tape vertikal
    cx = x0 + box // 2
    d.line([cx, y0 + lw, cx, lid_y], fill=WHITE, width=lw)

    if text and s >= 128:
        fnt = _font(int(s * 0.14))
        label = "RESI"
        tb = d.textbbox((0, 0), label, font=fnt)
        tw, th = tb[2] - tb[0], tb[3] - tb[1]
        tx = (s - tw) // 2 - tb[0]
        ty = y0 + box + int(s * 0.05)
        if ty + th <= s - int(s * 0.04):
            d.text((tx, ty), label, font=fnt, fill=WHITE)
    return img


def save(img, name):
    path = os.path.join(OUT, name)
    img.save(path, "PNG")
    print("OK:", os.path.relpath(path, ROOT))


def main():
    save(draw_icon(192), "icon-192.png")
    save(draw_icon(512), "icon-512.png")
    save(draw_icon(512, maskable=True), "icon-maskable-512.png")
    save(draw_icon(180), "apple-touch-icon.png")
    save(draw_icon(32, text=False), "favicon-32.png")


if __name__ == "__main__":
    main()
```

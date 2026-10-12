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

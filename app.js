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
  let lastLoadAt = 0;
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

  /** Masukkan 1 baris ke index in-memory (dipakai buildIndex & fallback cariLangsung) */
  function indexRow(row) {
    for (const [kol, label] of KEY_KOLOM) {
      const k = norm(row[kol]);
      if (!k) continue;
      if (!INDEX.has(k)) INDEX.set(k, []);
      const arr = INDEX.get(k);
      if (!arr.some((h) => h.row.id === row.id)) arr.push({ row: row, source: label });
    }
    if (row.updated_at && row.updated_at > lastSync) lastSync = row.updated_at;
  }

  /** Susun index in-memory dari 3 kolom scan */
  function buildIndex(rows) {
    INDEX.clear();
    lastSync = "";
    for (const row of rows) indexRow(row);
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
      lastLoadAt = Date.now();
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

  /** Kolom mana yang value-nya cocok (buat label "Ketemu di") */
  function sumberKolom(row, v) {
    for (const [kol, label] of KEY_KOLOM) {
      if (norm(row[kol]) === v) return label;
    }
    return "-";
  }

  /**
   * Fallback: tanya Supabase LANGSUNG kalau nggak ada di index lokal
   * (data baru disync setelah app dibuka / app lama kebuka).
   * ilike tanpa wildcard = exact case-insensitive.
   */
  async function cariLangsung(q) {
    const v = encodeURIComponent(norm(q));
    const url =
      CFG.SUPABASE_URL +
      "/rest/v1/resi?select=*&or=(no_order.ilike." + v +
      ",no_resi.ilike." + v +
      ",resi_barang_balik.ilike." + v + ")";
    const res = await fetch(url, {
      headers: {
        apikey: CFG.SUPABASE_ANON_KEY,
        Authorization: "Bearer " + CFG.SUPABASE_ANON_KEY,
      },
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const rows2 = await res.json();
    rows2.forEach(indexRow); // index lokal ikut ke-update biar scan berikutnya instan
    return rows2.map((row) => ({ row: row, source: sumberKolom(row, norm(q)) }));
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
    let hits = cari(q);
    // Fallback: kalau nggak ada di index lokal, tanya Supabase langsung (data terbaru)
    if (!hits.length) {
      try {
        hits = await cariLangsung(q);
      } catch (err) {
        console.warn("Fallback cari langsung gagal:", err);
      }
    }
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

  // Refresh saat tab/PWA kembali aktif — cegah data basi kalau app lama kebuka
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && Date.now() - lastLoadAt > 2 * 60 * 1000) {
      loadData(true);
    }
  });

  // PWA: daftarkan service worker (PRD FR-08)
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch((err) => console.warn("SW gagal:", err));
    });
  }
})();



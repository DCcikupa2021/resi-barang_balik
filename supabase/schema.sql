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

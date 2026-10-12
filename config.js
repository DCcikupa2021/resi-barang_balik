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

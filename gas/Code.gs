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
  // Guard jam kerja: di luar 08.00-17.00 WIB tidak ada tembakan ke Supabase.
  // Dihitung eksplisit WIB (Asia/Jakarta) supaya benar walau timezone project GAS UTC.
  var jam = parseInt(Utilities.formatDate(new Date(), 'Asia/Jakarta', 'H'), 10);
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


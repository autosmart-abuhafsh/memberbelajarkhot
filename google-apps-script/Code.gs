/**
 * ============================================================================
 * FILE 1: Code.gs — SERVER API UTAMA (doGet & doPost) BELAJAR KHOT
 * ============================================================================
 * Cara Pemasangan di Google Apps Script:
 * 1. Buka Google Spreadsheet Anda -> klik menu Extensions (Ekstensi) -> Apps Script.
 * 2. Pada file `Code.gs`, hapus seluruh kode bawaan lalu tempelkan (Paste) kode ini.
 * 3. Buat file kedua bernama `Setup.gs` (klik tanda "+" -> Script) dan tempelkan kode Setup.gs.
 * 4. Jalankan fungsi `setupDatabaseSheets` sekali, lalu klik:
 *    Deploy -> New deployment -> Pilih jenis "Web app":
 *    - Execute as: Me (Email Anda)
 *    - Who has access: Anyone (Siapa saja)
 * 5. Salin Web App URL (berakhiran /exec) ke Pengaturan Lembaga Belajar Khot / Vercel.
 */

function doGet(e) {
  try {
    var action =
      e && e.parameter && e.parameter.action ? e.parameter.action : 'getSnapshot';
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (typeof setupDatabaseSheets === 'function') {
      setupDatabaseSheets();
    }

    if (action === 'ping') {
      return jsonResponse({
        ok: true,
        service: 'Belajar Khot Google Sheets Cloud Database',
        spreadsheetName: ss.getName(),
        timestamp: new Date().toISOString()
      });
    }

    var snapshotSheet = ss.getSheetByName(
      typeof SHEET_NAMES !== 'undefined' ? SHEET_NAMES.RAW_SNAPSHOT : 'DatabaseSnapshot'
    );
    if (!snapshotSheet) {
      return jsonResponse({
        ok: true,
        hasData: false,
        data: null,
        database: null
      });
    }

    var lastRow = snapshotSheet.getLastRow();
    var rawJson = '';
    var updatedAt = null;

    if (lastRow >= 2) {
      updatedAt = snapshotSheet.getRange(2, 1).getValue();
      rawJson = snapshotSheet.getRange(2, 3).getValue();
    }
    if (!rawJson && lastRow >= 1) {
      var cellA1 = snapshotSheet.getRange(1, 1).getValue();
      if (cellA1 && String(cellA1).trim().indexOf('{') === 0) {
        rawJson = cellA1;
      }
    }

    if (!rawJson) {
      return jsonResponse({
        ok: true,
        hasData: false,
        spreadsheetName: ss.getName(),
        updatedAt: null,
        data: null,
        database: null
      });
    }

    var parsed = JSON.parse(String(rawJson));
    return jsonResponse({
      ok: true,
      hasData: true,
      spreadsheetName: ss.getName(),
      updatedAt: updatedAt || new Date().toISOString(),
      data: parsed,
      database: parsed
    });
  } catch (err) {
    return jsonResponse({
      ok: false,
      error: String(err)
    });
  }
}

function doPost(e) {
  try {
    var rawBody =
      e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    var body = JSON.parse(rawBody);
    var action = body.action || 'saveSnapshot';
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (typeof setupDatabaseSheets === 'function') {
      setupDatabaseSheets();
    }

    var dbPayload = body.data || body.database || null;

    if ((action === 'saveSnapshot' || action === 'sync') && dbPayload) {
      var nowIso = new Date().toISOString();
      var names =
        typeof SHEET_NAMES !== 'undefined'
          ? SHEET_NAMES
          : {
              RAW_SNAPSHOT: 'DatabaseSnapshot',
              USERS: 'Users',
              MEMBERS: 'Members',
              ANNOUNCEMENTS: 'Announcements',
              INFORMATION: 'Information',
              DOCUMENTS: 'Documents',
              CLASSES: 'Classes',
              NOTIFICATIONS: 'Notifications',
              READ_RECEIPTS: 'ReadReceipts',
              ACTIVITY_LOGS: 'ActivityLogs',
              SETTINGS: 'Settings'
            };

      var cols =
        typeof SHEET_COLUMNS !== 'undefined' ? SHEET_COLUMNS : {};

      // 1. Simpan Snapshot JSON Utuh di sheet DatabaseSnapshot
      var snapshotSheet = ss.getSheetByName(names.RAW_SNAPSHOT);
      if (snapshotSheet) {
        snapshotSheet.clearContents();
        snapshotSheet
          .getRange(1, 1, 1, 3)
          .setValues([['UpdatedAt', 'Version', 'JsonPayload']]);
        snapshotSheet.getRange(1, 1, 1, 3).setFontWeight('bold');
        snapshotSheet
          .getRange(2, 1, 1, 3)
          .setValues([[nowIso, '2.0', JSON.stringify(dbPayload)]]);
      }

      // 2. Sinkronisasikan setiap tabel ke Sheet masing-masing agar rapi & terbaca di Google Sheets
      syncArrayToSheet(
        ss.getSheetByName(names.USERS),
        dbPayload.users || [],
        cols.Users
      );
      syncArrayToSheet(
        ss.getSheetByName(names.MEMBERS),
        dbPayload.members || [],
        cols.Members
      );
      syncArrayToSheet(
        ss.getSheetByName(names.ANNOUNCEMENTS),
        dbPayload.announcements || [],
        cols.Announcements
      );
      syncArrayToSheet(
        ss.getSheetByName(names.INFORMATION),
        dbPayload.information || [],
        cols.Information
      );
      syncArrayToSheet(
        ss.getSheetByName(names.DOCUMENTS),
        dbPayload.documents || [],
        cols.Documents
      );
      syncArrayToSheet(
        ss.getSheetByName(names.CLASSES),
        dbPayload.classes || [],
        cols.Classes
      );
      syncArrayToSheet(
        ss.getSheetByName(names.NOTIFICATIONS),
        dbPayload.notifications || [],
        cols.Notifications
      );
      syncArrayToSheet(
        ss.getSheetByName(names.READ_RECEIPTS),
        dbPayload.readReceipts || [],
        cols.ReadReceipts
      );
      syncArrayToSheet(
        ss.getSheetByName(names.ACTIVITY_LOGS),
        (dbPayload.activityLogs || []).slice(0, 200),
        cols.ActivityLogs
      );
      syncSettingsToSheet(
        ss.getSheetByName(names.SETTINGS),
        dbPayload.settings || {},
        nowIso
      );

      return jsonResponse({
        ok: true,
        syncedAt: nowIso,
        updatedAt: nowIso,
        message: 'Seluruh tabel database berhasil disinkronkan ke Google Sheets.'
      });
    }

    if (action === 'clearAll' && typeof clearAllSheetsData === 'function') {
      return jsonResponse(clearAllSheetsData());
    }

    return jsonResponse({
      ok: false,
      error: 'Action tidak dikenali: ' + action
    });
  } catch (err) {
    return jsonResponse({
      ok: false,
      error: String(err)
    });
  }
}

function syncArrayToSheet(sheet, records, predefinedColumns) {
  if (!sheet) return;
  sheet.clearContents();

  var headers =
    predefinedColumns && predefinedColumns.length > 0
      ? predefinedColumns
      : records && records.length > 0
      ? Object.keys(records[0])
      : ['Info'];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');

  if (!records || records.length === 0) {
    return;
  }

  var rows = [];
  for (var i = 0; i < records.length; i++) {
    var item = records[i];
    var row = [];
    for (var c = 0; c < headers.length; c++) {
      var key = headers[c];
      var val = item[key];
      if (val === null || val === undefined) {
        row.push('');
      } else if (typeof val === 'object') {
        row.push(JSON.stringify(val));
      } else {
        row.push(String(val));
      }
    }
    rows.push(row);
  }

  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
}

function syncSettingsToSheet(sheet, settingsObj, updatedAt) {
  if (!sheet || !settingsObj) return;
  sheet.clearContents();
  sheet.getRange(1, 1, 1, 3).setValues([['Key', 'Value', 'UpdatedAt']]);
  sheet.getRange(1, 1, 1, 3).setFontWeight('bold');

  var keys = Object.keys(settingsObj);
  if (keys.length === 0) return;

  var rows = [];
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    var v = settingsObj[k];
    rows.push([
      k,
      v === null || v === undefined
        ? ''
        : typeof v === 'object'
        ? JSON.stringify(v)
        : String(v),
      updatedAt
    ]);
  }
  sheet.getRange(2, 1, rows.length, 3).setValues(rows);
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}

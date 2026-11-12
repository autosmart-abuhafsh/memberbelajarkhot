/**
 * ============================================================================
 * FILE 1: Code.gs — SERVER API UTAMA (doGet & doPost) BELAJAR KHOT
 * ============================================================================
 * Cara Pemasangan di Google Apps Script:
 * 1. Buka Google Spreadsheet Anda -> klik menu Extensions (Ekstensi) -> Apps Script.
 * 2. Pada file `Code.gs`, hapus seluruh kode bawaan lalu tempelkan (Paste) kode ini.
 * 3. Buat file kedua bernama `Setup.gs` (klik tanda "+" -> Script) dan tempelkan kode Setup.gs.
 * 4. Klik Deploy -> New deployment -> Pilih jenis "Web app":
 *    - Execute as: Me (Email Anda)
 *    - Who has access: Anyone (Siapa saja)
 * 5. Salin Web App URL (berakhiran /exec) ke aplikasi Belajar Khot / Environment Variable Vercel.
 */

var DEFAULT_SHEET_NAMES = {
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

function getDatabaseSpreadsheet() {
  var ss = null;
  try {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  } catch (e) {
    ss = null;
  }
  if (ss) return ss;

  var props = PropertiesService.getScriptProperties();
  var savedId = props.getProperty('BELAJAR_KHOT_SPREADSHEET_ID');
  if (savedId) {
    try {
      ss = SpreadsheetApp.openById(savedId);
      if (ss) return ss;
    } catch (e2) {
      ss = null;
    }
  }

  ss = SpreadsheetApp.create('Database Resmi Belajar Khot');
  props.setProperty('BELAJAR_KHOT_SPREADSHEET_ID', ss.getId());
  return ss;
}

function getOrCreateSheet(ss, sheetName, defaultHeaders) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  if (defaultHeaders && defaultHeaders.length > 0 && sheet.getLastRow() === 0) {
    var headerRange = sheet.getRange(1, 1, 1, defaultHeaders.length);
    headerRange.setValues([defaultHeaders]);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#19432D');
    headerRange.setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function doGet(e) {
  try {
    var action =
      e && e.parameter && e.parameter.action ? e.parameter.action : 'getSnapshot';
    var ss = getDatabaseSpreadsheet();

    if (typeof setupDatabaseSheets === 'function') {
      setupDatabaseSheets();
    }

    var names =
      typeof SHEET_NAMES !== 'undefined' ? SHEET_NAMES : DEFAULT_SHEET_NAMES;

    var snapshotSheet = getOrCreateSheet(ss, names.RAW_SNAPSHOT, [
      'UpdatedAt',
      'Version',
      'JsonPayload'
    ]);

    if (action === 'ping') {
      return jsonResponse({
        ok: true,
        service: 'Belajar Khot Google Sheets Cloud Database',
        spreadsheetName: ss.getName(),
        spreadsheetUrl: ss.getUrl(),
        timestamp: new Date().toISOString()
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
        spreadsheetUrl: ss.getUrl(),
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
      spreadsheetUrl: ss.getUrl(),
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
    var ss = getDatabaseSpreadsheet();

    if (typeof setupDatabaseSheets === 'function') {
      setupDatabaseSheets();
    }

    var dbPayload = body.data || body.database || null;

    if ((action === 'saveSnapshot' || action === 'sync') && dbPayload) {
      var nowIso = new Date().toISOString();
      var names =
        typeof SHEET_NAMES !== 'undefined' ? SHEET_NAMES : DEFAULT_SHEET_NAMES;
      var cols =
        typeof SHEET_COLUMNS !== 'undefined' ? SHEET_COLUMNS : {};

      // 1. Simpan Snapshot JSON Utuh di sheet DatabaseSnapshot
      var snapshotSheet = getOrCreateSheet(ss, names.RAW_SNAPSHOT, [
        'UpdatedAt',
        'Version',
        'JsonPayload'
      ]);
      snapshotSheet.clearContents();
      snapshotSheet
        .getRange(1, 1, 1, 3)
        .setValues([['UpdatedAt', 'Version', 'JsonPayload']]);
      snapshotSheet.getRange(1, 1, 1, 3).setFontWeight('bold');
      snapshotSheet
        .getRange(2, 1, 1, 3)
        .setValues([[nowIso, '2.0', JSON.stringify(dbPayload)]]);

      // 2. Sinkronisasikan setiap tabel ke Sheet masing-masing (otomatis dibuat jika belum ada)
      syncArrayToSheet(
        getOrCreateSheet(ss, names.USERS, cols.Users),
        dbPayload.users || [],
        cols.Users
      );
      syncArrayToSheet(
        getOrCreateSheet(ss, names.MEMBERS, cols.Members),
        dbPayload.members || [],
        cols.Members
      );
      syncArrayToSheet(
        getOrCreateSheet(ss, names.ANNOUNCEMENTS, cols.Announcements),
        dbPayload.announcements || [],
        cols.Announcements
      );
      syncArrayToSheet(
        getOrCreateSheet(ss, names.INFORMATION, cols.Information),
        dbPayload.information || [],
        cols.Information
      );
      syncArrayToSheet(
        getOrCreateSheet(ss, names.DOCUMENTS, cols.Documents),
        dbPayload.documents || [],
        cols.Documents
      );
      syncArrayToSheet(
        getOrCreateSheet(ss, names.CLASSES, cols.Classes),
        dbPayload.classes || [],
        cols.Classes
      );
      syncArrayToSheet(
        getOrCreateSheet(ss, names.NOTIFICATIONS, cols.Notifications),
        dbPayload.notifications || [],
        cols.Notifications
      );
      syncArrayToSheet(
        getOrCreateSheet(ss, names.READ_RECEIPTS, cols.ReadReceipts),
        dbPayload.readReceipts || [],
        cols.ReadReceipts
      );
      syncArrayToSheet(
        getOrCreateSheet(ss, names.ACTIVITY_LOGS, cols.ActivityLogs),
        (dbPayload.activityLogs || []).slice(0, 200),
        cols.ActivityLogs
      );
      syncSettingsToSheet(
        getOrCreateSheet(ss, names.SETTINGS, ['Key', 'Value', 'UpdatedAt']),
        dbPayload.settings || {},
        nowIso
      );

      return jsonResponse({
        ok: true,
        syncedAt: nowIso,
        updatedAt: nowIso,
        spreadsheetName: ss.getName(),
        spreadsheetUrl: ss.getUrl(),
        message: 'Seluruh tabel database berhasil disinkronkan ke Google Sheets (' + ss.getName() + ').'
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

  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#19432D');
  headerRange.setFontColor('#FFFFFF');

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
  var headerRange = sheet.getRange(1, 1, 1, 3);
  headerRange.setValues([['Key', 'Value', 'UpdatedAt']]);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#19432D');
  headerRange.setFontColor('#FFFFFF');

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

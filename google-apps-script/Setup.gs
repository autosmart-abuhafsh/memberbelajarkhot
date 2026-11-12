/**
 * ============================================================================
 * FILE 2: Setup.gs — INISIALISASI TABEL, SKEMA KOLOM & MENU GOOGLE SHEETS
 * ============================================================================
 * Cara Pemasangan di Google Apps Script:
 * 1. Di editor Apps Script, klik tombol "+" (Tambah file) di sebelah "Files" -> Pilih "Script".
 * 2. Beri nama file: Setup  (otomatis menjadi Setup.gs).
 * 3. Hapus isi bawaannya, lalu tempelkan (Paste) seluruh kode Setup.gs ini.
 * 4. Pilih fungsi `setupDatabaseSheets` di toolbar atas, lalu klik "Run" (Jalankan)
 *    sekali untuk memberikan izin (Authorize) dan membuat seluruh Sheet otomatis.
 */

var SHEET_NAMES = {
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

var SHEET_COLUMNS = {
  DatabaseSnapshot: ['UpdatedAt', 'Version', 'JsonPayload'],
  Users: [
    'uid',
    'memberId',
    'username',
    'fullName',
    'gender',
    'phone',
    'email',
    'city',
    'role',
    'accountStatus',
    'createdAt',
    'updatedAt',
    'lastLoginAt',
    'isDemo'
  ],
  Members: [
    'id',
    'uid',
    'memberId',
    'program',
    'learningMethod',
    'bookPurchaseStatus',
    'membershipStatus',
    'agreedToRules',
    'joinDate',
    'verificationDate',
    'customCardColor',
    'adminNotes',
    'isDemo'
  ],
  Announcements: [
    'id',
    'title',
    'category',
    'targetAudience',
    'isPinned',
    'isImportant',
    'status',
    'publishAt',
    'createdBy',
    'content',
    'isDemo'
  ],
  Information: [
    'id',
    'title',
    'category',
    'targetAudience',
    'status',
    'orderIndex',
    'destinationURL',
    'publishAt',
    'description',
    'isDemo'
  ],
  Documents: [
    'id',
    'fileName',
    'fileType',
    'fileSize',
    'category',
    'accessLevel',
    'targetAudience',
    'status',
    'uploadedBy',
    'uploadedAt',
    'description',
    'isDemo'
  ],
  Classes: [
    'id',
    'className',
    'instructor',
    'program',
    'learningMethod',
    'schedule',
    'meetingLink',
    'offlineLocation',
    'status',
    'participantIds',
    'description',
    'isDemo'
  ],
  Notifications: [
    'id',
    'recipientUid',
    'title',
    'message',
    'type',
    'isRead',
    'createdAt',
    'linkTo',
    'isDemo'
  ],
  ReadReceipts: ['id', 'announcementId', 'uid', 'readAt'],
  ActivityLogs: [
    'id',
    'createdAt',
    'actorUid',
    'actorName',
    'activityType',
    'description',
    'targetId',
    'isDemo'
  ],
  Settings: ['Key', 'Value', 'UpdatedAt']
};

/**
 * Menambahkan menu khusus "Belajar Khot DB" saat file Google Spreadsheet dibuka.
 */
function onOpen() {
  try {
    var ui = SpreadsheetApp.getUi();
    ui.createMenu('Belajar Khot DB')
      .addItem('1. Inisialisasi / Buat Semua Sheet Database', 'setupDatabaseSheets')
      .addItem('2. Rapikan Format & Warna Header Tabel', 'formatAllSheetsStyle')
      .addSeparator()
      .addItem('3. Kosongkan Data (Reset ke Mode Kosongan)', 'clearAllSheetsData')
      .addToUi();
  } catch (err) {
    // Abaikan jika dijalankan dari luar konteks UI Spreadsheet
  }
}

/**
 * Fungsi utama untuk membuat seluruh tab Sheet beserta baris Header kolomnya.
 * Jalankan fungsi ini pertama kali dari editor Apps Script (klik tombol Run).
 */
function setupDatabaseSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var keys = Object.keys(SHEET_NAMES);

  for (var i = 0; i < keys.length; i++) {
    var sheetName = SHEET_NAMES[keys[i]];
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }

    var cols = SHEET_COLUMNS[sheetName];
    if (cols && cols.length > 0 && sheet.getLastRow() === 0) {
      var headerRange = sheet.getRange(1, 1, 1, cols.length);
      headerRange.setValues([cols]);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#19432D');
      headerRange.setFontColor('#FFFFFF');
      sheet.setFrozenRows(1);
    }
  }

  return {
    ok: true,
    spreadsheetName: ss.getName(),
    message: 'Seluruh 11 Sheet Database Belajar Khot berhasil dibuat dan disiapkan.'
  };
}

/**
 * Merapikan tampilan warna header (#19432D) dan membekukan baris pertama di semua Sheet.
 */
function formatAllSheetsStyle() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var keys = Object.keys(SHEET_NAMES);

  for (var i = 0; i < keys.length; i++) {
    var sheetName = SHEET_NAMES[keys[i]];
    var sheet = ss.getSheetByName(sheetName);
    var cols = SHEET_COLUMNS[sheetName];
    if (sheet && cols && cols.length > 0) {
      var headerRange = sheet.getRange(1, 1, 1, cols.length);
      headerRange.setValues([cols]);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#19432D');
      headerRange.setFontColor('#FFFFFF');
      sheet.setFrozenRows(1);
    }
  }
}

/**
 * Membersihkan seluruh isi baris data (menyisakan baris Header) untuk Mode Kosongan / Fresh.
 */
function clearAllSheetsData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var keys = Object.keys(SHEET_NAMES);

  for (var i = 0; i < keys.length; i++) {
    var sheetName = SHEET_NAMES[keys[i]];
    var sheet = ss.getSheetByName(sheetName);
    if (sheet) {
      sheet.clearContents();
      var cols = SHEET_COLUMNS[sheetName];
      if (cols && cols.length > 0) {
        sheet.getRange(1, 1, 1, cols.length).setValues([cols]);
      }
    }
  }

  return {
    ok: true,
    message: 'Seluruh tabel berhasil dikosongkan (Mode Fresh).'
  };
}

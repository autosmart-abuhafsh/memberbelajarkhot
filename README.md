# BELAJAR KHOT — Sistem Manajemen Keanggotaan & Portal Member Digital

Portal resmi administrasi peserta, verifikasi persyaratan buku Khot, kelas pembelajaran (**Khot Naskhi** & **Khot Riq'ah** — Online & Offline), pusat pengumuman, dokumen resmi, dan **Kartu Member Digital** berstandar QR verifikasi.

---

## Akun Demonstrasi Bawaan

- **Administrator**:
  - **ID / Username**: `admin`
  - **Password**: `AdminKhot2026!`
- **Member Aktif (Demo)**:
  - **ID Member**: `BK-00001`
  - **Password**: `MemberKhot123!`

---

## 1. Integrasi Server Database Google Sheets & Google Apps Script (`Code.gs`)

Aplikasi ini dilengkapi arsitektur **Hybrid JSON + Google Sheets Cloud Database** yang berkomunikasi dua arah (*Push* & *Pull*) dengan Google Spreadsheet melalui **Google Apps Script Web App**:

1. Buat **Google Spreadsheet** baru di akun Google Drive lembaga Anda.
2. Pada menu bagian atas Google Sheets, klik **Extensions (Ekstensi) -> Apps Script**.
3. Hapus kode fungsi kosong bawaan di `Code.gs`, lalu salin seluruh kode dari file [`/google-apps-script/Code.gs`](./google-apps-script/Code.gs) (atau klik tombol **"Salin Kode Apps Script (Code.gs)"** langsung di menu **Pengaturan Lembaga** pada Dashboard Admin).
4. Klik tombol **Deploy -> New deployment**:
   - Pilih jenis (**Select type**): **Web app**
   - **Execute as**: `Me` (Akun Google pemilik Spreadsheet)
   - **Who has access**: `Anyone` (Agar server backend / Vercel dapat melakukan sinkronisasi data)
5. Klik **Deploy**, berikan izin akses (*Authorize access*), lalu salin **Web App URL** (berakhiran `/exec`).
6. Tempelkan URL tersebut pada:
   - Menu **Pengaturan Lembaga (`/admin/settings`)** di dalam aplikasi, lalu klik **"Simpan URL & Push Data ke Google Sheets"**, **ATAU**
   - Variabel environment `GOOGLE_APPS_SCRIPT_URL` di `.env` / pengaturan project Vercel Anda.

Secara otomatis, script `Code.gs` akan membuat lembar kerja (*sheets*) terstruktur di Google Spreadsheet Anda:
- `Users`, `Members`, `Announcements`, `Information`, `Documents`, `Classes`, `Notifications`, `ReadReceipts`, `ActivityLogs`, `Settings`, dan `DatabaseSnapshot`.

---

## 2. Cara Push ke Repository GitHub

Project ini telah siap di-push langsung ke GitHub:

```bash
git init
git add .
git commit -m "feat: portal manajemen member belajar khot + google sheets & vercel"
git branch -M main
git remote add origin https://github.com/USERNAME_ANDA/belajar-khot-portal.git
git push -u origin main
```

---

## 3. Cara Deploy ke Vercel (`vercel.app`)

Project ini telah dilengkapi konfigurasi [`vercel.json`](./vercel.json) dan Serverless Function entry point [`/api/index.ts`](./api/index.ts) serta dukungan penyimpanan sementara `/tmp` dan sesi **Stateless HMAC-SHA256 Token** sehingga berjalan mulus di arsitektur Serverless Vercel:

1. Buka [https://vercel.com/new](https://vercel.com/new) dan **Import** repository GitHub Anda.
2. Pada bagian **Framework Preset**, pilih **Vite** (Build Command: `npm run build`, Output Directory: `dist`).
3. Pada bagian **Environment Variables**, tambahkan:
   - `GOOGLE_APPS_SCRIPT_URL`: URL Web App Google Apps Script Anda (`https://script.google.com/macros/s/.../exec`)
   - `SESSION_SECRET`: Kata sandi acak untuk penandatanganan sesi token (contoh: `rahasia-belajar-khot-2026-aman`)
4. Klik **Deploy**. Aplikasi Anda akan langsung aktif di domain `*.vercel.app` dengan koneksi penuh ke database Google Sheets.

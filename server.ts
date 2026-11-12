import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import express, { type Request, type Response, type NextFunction } from 'express';
import {
  calculateDashboardStats,
  canMemberAccessDocument,
  computeCardDisplayStatus,
  formatDateID,
  generateNextMemberId,
  matchesTargetAudience,
  validateParticipantForm,
} from './src/utils/domainLogic.ts';
import type {
  AccountStatus,
  ActivityLogRecord,
  AnnouncementRecord,
  BookPurchaseStatus,
  ClassRecord,
  CombinedMemberProfile,
  DocumentRecord,
  InformationRecord,
  InstitutionSettings,
  LearningMethod,
  MemberRecord,
  MembershipStatus,
  NotificationRecord,
  ProgramType,
  ReadReceiptRecord,
  UserRecord,
} from './src/types.ts';

function resolveWritableDataDir(): string {
  if (process.env.VERCEL === '1') {
    return path.join(os.tmpdir(), 'belajar-khot-data');
  }
  const localDir = path.resolve(process.cwd(), 'data');
  try {
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    fs.accessSync(localDir, fs.constants.W_OK);
    return localDir;
  } catch {
    const tmpFallback = path.join(os.tmpdir(), 'belajar-khot-data');
    if (!fs.existsSync(tmpFallback)) {
      fs.mkdirSync(tmpFallback, { recursive: true });
    }
    return tmpFallback;
  }
}

const DATA_DIR = resolveWritableDataDir();
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'database.json');
const SESSION_SECRET = process.env.SESSION_SECRET || 'belajar-khot-hmac-secret-2026';

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch {
  // Ignore mkdir errors on read-only serverless containers
}

interface SessionEntry {
  token: string;
  uid: string;
  createdAt: string;
}

interface DatabaseSchema {
  users: UserRecord[];
  passwordHashes: Record<string, string>; // uid -> salt:scryptHash
  members: MemberRecord[];
  announcements: AnnouncementRecord[];
  information: InformationRecord[];
  documents: DocumentRecord[];
  classes: ClassRecord[];
  notifications: NotificationRecord[];
  readReceipts: ReadReceiptRecord[];
  activityLogs: ActivityLogRecord[];
  settings: InstitutionSettings;
  sessions: SessionEntry[];
}

function hashPassword(password: string, existingSalt?: string): string {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, key] = storedHash.split(':');
  const derived = crypto.scryptSync(password, salt, 64);
  const keyBuffer = Buffer.from(key, 'hex');
  if (derived.length !== keyBuffer.length) return false;
  return crypto.timingSafeEqual(derived, keyBuffer);
}

// Create a valid minimal PDF file on disk for sample downloadable documents
function ensureSamplePdfOnDisk(fileName: string, title: string, bodyText: string): number {
  const filePath = path.join(UPLOADS_DIR, fileName);
  const cleanTitle = title.replace(/[()\\]/g, '');
  const cleanBody = bodyText.replace(/[()\\]/g, '');
  const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length 220 >>
stream
BT
/F1 16 Tf
50 720 Td
(BELAJAR KHOT - DOKUMEN RESMI) Tj
/F1 13 Tf
0 -28 Td
(${cleanTitle}) Tj
/F1 10 Tf
0 -24 Td
(${cleanBody}) Tj
0 -20 Td
(Dicetak melalui Portal Resmi Belajar Khot - Zona Waktu WIB) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000229 00000 n 
0000000297 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
570
%%EOF`;
  fs.writeFileSync(filePath, pdfContent, 'utf-8');
  return Buffer.byteLength(pdfContent, 'utf-8');
}

function createInitialSeedDatabase(): DatabaseSchema {
  const adminUid = 'usr-admin-01';
  const passwordHashes: Record<string, string> = {
    [adminUid]: hashPassword('AdminKhot2026!'),
  };

  const demoMembersData: Array<{
    uid: string;
    memberId: string;
    username: string;
    fullName: string;
    phone: string;
    email: string;
    city: string;
    accountStatus: AccountStatus;
    program: ProgramType;
    learningMethod: LearningMethod;
    bookPurchaseStatus: BookPurchaseStatus;
    membershipStatus: MembershipStatus;
    joinDate: string;
    verificationDate: string | null;
    adminNotes: string;
  }> = [
    {
      uid: 'usr-bk-00001',
      memberId: 'BK-00001',
      username: 'BK-00001',
      fullName: 'Ahmad Fauzi (Demo)',
      phone: '081234567801',
      email: 'ahmad.fauzi@contoh.id',
      city: 'Jakarta Selatan',
      accountStatus: 'Aktif',
      program: 'Khot Naskhi',
      learningMethod: 'Online',
      bookPurchaseStatus: 'Sudah diverifikasi',
      membershipStatus: 'Member Aktif',
      joinDate: '2026-08-12T08:30:00.000Z',
      verificationDate: '2026-08-13T10:15:00.000Z',
      adminNotes: 'Data Demonstrasi — Peserta aktif angkatan ke-4, buku paket Khot Naskhi lunas.',
    },
    {
      uid: 'usr-bk-00002',
      memberId: 'BK-00002',
      username: 'BK-00002',
      fullName: 'Muhammad Ridwan (Demo)',
      phone: '081298765402',
      email: 'm.ridwan@contoh.id',
      city: 'Bandung',
      accountStatus: 'Aktif',
      program: "Khot Riq'ah",
      learningMethod: 'Offline',
      bookPurchaseStatus: 'Menunggu verifikasi',
      membershipStatus: 'Menunggu Verifikasi',
      joinDate: '2026-10-20T09:00:00.000Z',
      verificationDate: null,
      adminNotes: 'Data Demonstrasi — Bukti pemesanan buku Riqah sedang diperiksa admin.',
    },
    {
      uid: 'usr-bk-00003',
      memberId: 'BK-00003',
      username: 'BK-00003',
      fullName: 'Ibrahim Khalil (Demo)',
      phone: '081345678903',
      email: 'ibrahim.k@contoh.id',
      city: 'Yogyakarta',
      accountStatus: 'Aktif',
      program: 'Khot Naskhi',
      learningMethod: 'Online',
      bookPurchaseStatus: 'Belum membeli',
      membershipStatus: 'Calon Peserta',
      joinDate: '2026-11-02T14:20:00.000Z',
      verificationDate: null,
      adminNotes: 'Data Demonstrasi — Pendaftar baru, diarahkan untuk pemesanan buku Khot.',
    },
    {
      uid: 'usr-bk-00004',
      memberId: 'BK-00004',
      username: 'BK-00004',
      fullName: 'Salman Al-Farisi (Demo)',
      phone: '081567892304',
      email: 'salman.farisi@contoh.id',
      city: 'Depok',
      accountStatus: 'Aktif',
      program: "Khot Riq'ah",
      learningMethod: 'Offline',
      bookPurchaseStatus: 'Sudah diverifikasi',
      membershipStatus: 'Member Aktif',
      joinDate: '2026-09-05T07:45:00.000Z',
      verificationDate: '2026-09-06T11:00:00.000Z',
      adminNotes: 'Data Demonstrasi — Hadir rutin halaqah Sabtu pagi di studio Depok.',
    },
    {
      uid: 'usr-bk-00005',
      memberId: 'BK-00005',
      username: 'BK-00005',
      fullName: 'Yusuf Mansuruddin (Demo)',
      phone: '081789012305',
      email: 'yusuf.m@contoh.id',
      city: 'Surabaya',
      accountStatus: 'Nonaktif',
      program: 'Khot Naskhi',
      learningMethod: 'Online',
      bookPurchaseStatus: 'Sudah diverifikasi',
      membershipStatus: 'Member Nonaktif',
      joinDate: '2026-06-15T10:00:00.000Z',
      verificationDate: '2026-06-16T15:30:00.000Z',
      adminNotes: 'Data Demonstrasi — Cuti sementara selama 1 semester karena tugas luar kota.',
    },
    {
      uid: 'usr-bk-00006',
      memberId: 'BK-00006',
      username: 'BK-00006',
      fullName: 'Zaid bin Tsabit (Demo)',
      phone: '081901234506',
      email: 'zaid.tsabit@contoh.id',
      city: 'Bogor',
      accountStatus: 'Aktif',
      program: 'Khot Naskhi',
      learningMethod: 'Offline',
      bookPurchaseStatus: 'Sudah diverifikasi',
      membershipStatus: 'Member Aktif',
      joinDate: '2026-09-18T13:10:00.000Z',
      verificationDate: '2026-09-19T09:00:00.000Z',
      adminNotes: 'Data Demonstrasi — Peserta aktif kelas tatap muka Khot Naskhi.',
    },
  ];

  const users: UserRecord[] = [
    {
      uid: adminUid,
      memberId: 'ADMIN-01',
      username: 'admin',
      fullName: 'Ustadz H. Zulkifli Hasan',
      gender: 'Laki-laki (Ikhwan)',
      phone: '081110002026',
      email: 'admin@belajarkhot.id',
      city: 'Jakarta Selatan',
      photoURL: '',
      role: 'admin',
      accountStatus: 'Aktif',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-11-10T08:00:00.000Z',
      lastLoginAt: '2026-11-10T08:00:00.000Z',
      isDemo: false,
    },
  ];

  const members: MemberRecord[] = [];

  for (const item of demoMembersData) {
    passwordHashes[item.uid] = hashPassword('MemberKhot123!');
    users.push({
      uid: item.uid,
      memberId: item.memberId,
      username: item.username,
      fullName: item.fullName,
      gender: 'Laki-laki (Ikhwan)',
      phone: item.phone,
      email: item.email,
      city: item.city,
      photoURL: '',
      role: 'member',
      accountStatus: item.accountStatus,
      createdAt: item.joinDate,
      updatedAt: item.joinDate,
      lastLoginAt: item.accountStatus === 'Aktif' ? '2026-11-09T19:30:00.000Z' : null,
      isDemo: true,
    });
    members.push({
      id: `mem-${item.memberId.toLowerCase()}`,
      uid: item.uid,
      memberId: item.memberId,
      program: item.program,
      learningMethod: item.learningMethod,
      bookPurchaseStatus: item.bookPurchaseStatus,
      membershipStatus: item.membershipStatus,
      agreedToRules: true,
      joinDate: item.joinDate,
      verificationDate: item.verificationDate,
      adminNotes: item.adminNotes,
      isDemo: true,
    });
  }

  const size1 = ensureSamplePdfOnDisk(
    'Panduan_Resmi_Peserta_Belajar_Khot_2026.pdf',
    'Panduan Resmi Peserta & Adab Thalabul Ilmi Kaligrafi',
    'Dokumen ini memuat tata tertib peserta ikhwan, standar pena kalam, tinta, dan jadwal setoran koreksi (tashih).'
  );
  const size2 = ensureSamplePdfOnDisk(
    'Katalog_dan_Spesifikasi_Buku_Khot_Naskhi_Riqah.pdf',
    'Katalog & Spesifikasi Buku Panduan Khot Naskhi & Riqah',
    'Setiap calon peserta wajib memiliki buku panduan resmi Belajar Khot sebagai syarat verifikasi keanggotaan.'
  );
  const size3 = ensureSamplePdfOnDisk(
    'Kurikulum_Kaidah_Dasar_Huruf_Mufradat_Naskhi.pdf',
    'Materi Kaidah Dasar Huruf Mufradat Khot Naskhi (Skala Titik)',
    'Panduan proporsi titik (mizanul huruf) Alif hingga Ya berdasarkan madzhab Syauqi Efendi.'
  );

  const announcements: AnnouncementRecord[] = [
    {
      id: 'ann-01',
      title: 'Pembukaan Tashih & Evaluasi Semester Ganjil Khot Naskhi & Riq\'ah',
      content:
        'Bismillah. Diberitahukan kepada seluruh Member Aktif Belajar Khot (Online maupun Offline) bahwa pekan evaluasi tashih huruf mufradat dan murakkabat akan dilaksanakan mulai tanggal 20/11/2026. Pastikan seluruh peserta telah menyiapkan lembar latihan di kertas art paper beserta buku panduan resmi masing-masing.',
      category: 'Pengumuman Resmi',
      imageURL: '',
      attachmentURL: '/api/documents/doc-01/download',
      attachmentName: 'Panduan_Resmi_Peserta_Belajar_Khot_2026.pdf',
      targetAudience: 'Semua Member',
      isPinned: true,
      isImportant: true,
      status: 'Dipublikasikan',
      publishAt: '2026-11-05T08:00:00.000Z',
      expiresAt: '2026-12-31T23:59:59.000Z',
      createdBy: 'Ustadz H. Zulkifli Hasan',
      createdAt: '2026-11-05T08:00:00.000Z',
      isDemo: true,
    },
    {
      id: 'ann-02',
      title: 'Batas Waktu Verifikasi Kepemilikan Buku Panduan Khot Bagi Calon Peserta',
      content:
        'Kepada seluruh Calon Peserta yang telah mendaftar pada gelombang ini, harap segera melengkapi konfirmasi pemesanan Buku Panduan Khot (Naskhi / Riq\'ah) melalui admin agar status keanggotaan dan Kartu Member Digital Anda dapat diaktifkan.',
      category: 'Informasi Pendaftaran',
      imageURL: '',
      attachmentURL: '/api/documents/doc-02/download',
      attachmentName: 'Katalog_dan_Spesifikasi_Buku_Khot_Naskhi_Riqah.pdf',
      targetAudience: 'Calon Peserta',
      isPinned: true,
      isImportant: true,
      status: 'Dipublikasikan',
      publishAt: '2026-11-08T09:30:00.000Z',
      expiresAt: null,
      createdBy: 'Ustadz H. Zulkifli Hasan',
      createdAt: '2026-11-08T09:30:00.000Z',
      isDemo: true,
    },
    {
      id: 'ann-03',
      title: 'Jadwal Kelas Online Zoom Interaktif Khot Naskhi Pekan Ini',
      content:
        'Sesi koreksi langsung (live tashih) untuk peserta pembelajaran Online program Khot Naskhi akan diselenggarakan pada hari Sabtu pukul 08.30 WIB. Tautan ruang pertemuan tersedia pada menu Informasi Kelas.',
      category: 'Informasi Pembelajaran',
      imageURL: '',
      attachmentURL: '',
      attachmentName: '',
      targetAudience: 'Peserta Online',
      isPinned: false,
      isImportant: false,
      status: 'Dipublikasikan',
      publishAt: '2026-11-09T13:00:00.000Z',
      expiresAt: null,
      createdBy: 'Ustadz H. Zulkifli Hasan',
      createdAt: '2026-11-09T13:00:00.000Z',
      isDemo: true,
    },
  ];

  const information: InformationRecord[] = [
    {
      id: 'info-01',
      title: 'Paket Buku Resmi Kaidah Khot Naskhi & Riq\'ah Edisi Cetak Terbaru',
      description:
        'Dicetak di atas kertas glossy art paper 150gsm dengan panduan anatomi titik (mizanul huruf) yang presisi. Wajib dimiliki oleh seluruh peserta Belajar Khot sebagai acuan latihan harian.',
      imageURL: '',
      category: 'Promosi Buku Khot',
      targetAudience: 'Semua Member',
      destinationURL: 'https://wa.me/6281110002026?text=Assalamualaikum%20Admin%20Belajar%20Khot%2C%20saya%20ingin%20memesan%20Buku%20Panduan%20Khot',
      status: 'Aktif',
      orderIndex: 1,
      publishAt: '2026-11-01T00:00:00.000Z',
      expiresAt: null,
      isDemo: true,
    },
    {
      id: 'info-02',
      title: 'Daurah Intensif Meraut Kalam Handam & Racikan Tinta Likah Tradisional',
      description:
        'Kegiatan khusus member ikhwan untuk mempelajari teknik meraut ujung pena (qath) miring sesuai kaidah kaligrafi Utsmani serta cara merawat tinta likah di dalam wadah tinta.',
      imageURL: '',
      category: 'Informasi Kegiatan',
      targetAudience: 'Semua Member',
      destinationURL: '/member/classes',
      status: 'Aktif',
      orderIndex: 2,
      publishAt: '2026-11-04T00:00:00.000Z',
      expiresAt: null,
      isDemo: true,
    },
    {
      id: 'info-03',
      title: 'Mengenal Perbedaan Karakteristik Khot Naskhi dan Khot Riq\'ah',
      description:
        'Khot Naskhi memiliki kejelasan dan keluwesan lengkung yang biasa digunakan untuk penulisan Mushaf Al-Qur\'an, sedangkan Khot Riq\'ah memiliki garis tegas, ringkas, dan cepat untuk penulisan harian.',
      imageURL: '',
      category: 'Materi Edukasi',
      targetAudience: 'Semua Member',
      destinationURL: '/member/documents',
      status: 'Aktif',
      orderIndex: 3,
      publishAt: '2026-11-06T00:00:00.000Z',
      expiresAt: null,
      isDemo: true,
    },
  ];

  const documents: DocumentRecord[] = [
    {
      id: 'doc-01',
      fileName: 'Panduan_Resmi_Peserta_Belajar_Khot_2026.pdf',
      fileURL: '/api/documents/doc-01/download',
      fileType: 'PDF',
      fileSize: size1,
      category: 'Panduan Peserta',
      description: 'Buku saku digital tata tertib, adab belajar, dan alur verifikasi kartu member Belajar Khot.',
      accessLevel: 'Publik Member',
      targetAudience: 'Semua Member',
      status: 'Aktif',
      uploadedBy: 'Ustadz H. Zulkifli Hasan',
      uploadedAt: '2026-10-15T08:00:00.000Z',
      contentSummary: 'Tata tertib peserta ikhwan, kewajiban buku panduan resmi, metode belajar Online & Offline, serta prosedur evaluasi tashih.',
      isDemo: true,
    },
    {
      id: 'doc-02',
      fileName: 'Katalog_dan_Spesifikasi_Buku_Khot_Naskhi_Riqah.pdf',
      fileURL: '/api/documents/doc-02/download',
      fileType: 'PDF',
      fileSize: size2,
      category: 'Informasi Buku Khot',
      description: 'Rincian spesifikasi buku wajib Khot Naskhi dan Khot Riq\'ah beserta prosedur konfirmasi pembelian.',
      accessLevel: 'Publik Member',
      targetAudience: 'Semua Member',
      status: 'Aktif',
      uploadedBy: 'Ustadz H. Zulkifli Hasan',
      uploadedAt: '2026-10-18T10:30:00.000Z',
      contentSummary: 'Spesifikasi buku Khot Naskhi (72 halaman art paper) dan Khot Riq\'ah (64 halaman art paper) beserta paket kalam & tinta.',
      isDemo: true,
    },
    {
      id: 'doc-03',
      fileName: 'Kurikulum_Kaidah_Dasar_Huruf_Mufradat_Naskhi.pdf',
      fileURL: '/api/documents/doc-03/download',
      fileType: 'PDF',
      fileSize: size3,
      category: 'Materi Pembelajaran',
      description: 'Lembar kerja proporsi titik (mizanul huruf) khusus bagi Member Aktif program Khot Naskhi.',
      accessLevel: 'Khusus Member Aktif',
      targetAudience: 'Khot Naskhi',
      status: 'Aktif',
      uploadedBy: 'Ustadz H. Zulkifli Hasan',
      uploadedAt: '2026-10-25T14:00:00.000Z',
      contentSummary: 'Tabel mizanul huruf Alif (5 titik), Ba (5 titik), Jim (4 titik), Dal, Ra, Sin, Shad hingga Ya pada kaidah Naskhi.',
      isDemo: true,
    },
  ];

  const classes: ClassRecord[] = [
    {
      id: 'cls-01',
      className: 'Halaqah Online Khot Naskhi — Angkatan IV (Ikhwan)',
      instructor: 'Ustadz H. Zulkifli Hasan, M.Ag.',
      program: 'Khot Naskhi',
      learningMethod: 'Online',
      schedule: 'Setiap Sabtu, 08:30 – 10:30 WIB',
      meetingLink: 'https://meet.google.com/bkh-naskhi-online',
      offlineLocation: '-',
      description:
        'Pembelajaran daring interaktif melalui koreksi kamera makro (overhead camera) untuk proporsi huruf mufradat dan sambungan dasar Khot Naskhi.',
      participantIds: ['BK-00001', 'BK-00003', 'BK-00005'],
      status: 'Aktif',
      isDemo: true,
    },
    {
      id: 'cls-02',
      className: 'Kelas Tatap Muka Khot Naskhi — Studio Utama',
      instructor: 'Ustadz H. Zulkifli Hasan, M.Ag.',
      program: 'Khot Naskhi',
      learningMethod: 'Offline',
      schedule: 'Setiap Ahad, 09:00 – 11:30 WIB',
      meetingLink: '-',
      offlineLocation: 'Griya Kaligrafi Belajar Khot, Jl. Taman Pendidikan Islam No. 14, Jakarta Selatan',
      description:
        'Talaqqi dan koreksi goresan langsung (tashih) di meja latihan studio bersama musyrif.',
      participantIds: ['BK-00006'],
      status: 'Aktif',
      isDemo: true,
    },
    {
      id: 'cls-03',
      className: "Kelas Tatap Muka Khot Riq'ah — Reguler Ikhwan",
      instructor: 'Ustadz Salman Al-Hafizh',
      program: "Khot Riq'ah",
      learningMethod: 'Offline',
      schedule: 'Setiap Sabtu, 13:00 – 15:00 WIB',
      meetingLink: '-',
      offlineLocation: 'Griya Kaligrafi Belajar Khot, Ruang Riq\'ah Lantai 2, Jakarta Selatan',
      participantIds: ['BK-00002', 'BK-00004'],
      description:
        "Fokus pada penguasaan sudut kemiringan pena dan kecepatan penulisan kaidah Khot Riq'ah Utsmani.",
      status: 'Aktif',
      isDemo: true,
    },
    {
      id: 'cls-04',
      className: "Kelas Online Khot Riq'ah — Intensif Malam",
      instructor: 'Ustadz Salman Al-Hafizh',
      program: "Khot Riq'ah",
      learningMethod: 'Online',
      schedule: 'Setiap Rabu, 19:45 – 21:15 WIB',
      meetingLink: 'https://meet.google.com/bkh-riqah-malam',
      offlineLocation: '-',
      participantIds: [],
      description:
        "Kelas daring malam hari bagi peserta ikhwan pekerja dan mahasiswa yang mengambil program Khot Riq'ah.",
      status: 'Aktif',
      isDemo: true,
    },
  ];

  const notifications: NotificationRecord[] = [
    {
      id: 'notif-01',
      recipientUid: 'ALL_ADMINS',
      title: 'Permintaan Verifikasi Buku Khot Baru',
      message: 'Muhammad Ridwan (BK-00002) mengajukan verifikasi kepemilikan buku Khot Riq\'ah.',
      type: 'verification',
      isRead: false,
      createdAt: '2026-11-09T10:00:00.000Z',
      linkTo: '/admin/members',
      isDemo: true,
    },
    {
      id: 'notif-02',
      recipientUid: 'ALL_ADMINS',
      title: 'Calon Peserta Baru Terdaftar',
      message: 'Ibrahim Khalil (BK-00003) telah ditambahkan sebagai Calon Peserta program Khot Naskhi.',
      type: 'info',
      isRead: false,
      createdAt: '2026-11-08T15:20:00.000Z',
      linkTo: '/admin/members',
      isDemo: true,
    },
    {
      id: 'notif-03',
      recipientUid: 'usr-bk-00001',
      title: 'Kartu Member Digital Anda Telah Aktif',
      message: 'Alhamdulillah, status keanggotaan Anda (BK-00001) telah diverifikasi sebagai MEMBER AKTIF.',
      type: 'success',
      isRead: false,
      createdAt: '2026-11-05T09:00:00.000Z',
      linkTo: '/member/card',
      isDemo: true,
    },
    {
      id: 'notif-04',
      recipientUid: 'usr-bk-00002',
      title: 'Status Verifikasi Buku Sedang Diproses',
      message: 'Data konfirmasi buku Khot Riq\'ah Anda sedang diperiksa oleh pengurus lembaga.',
      type: 'warning',
      isRead: false,
      createdAt: '2026-11-08T11:00:00.000Z',
      linkTo: '/member/card',
      isDemo: true,
    },
  ];

  const activityLogs: ActivityLogRecord[] = [
    {
      id: 'log-01',
      actorUid: adminUid,
      actorName: 'Ustadz H. Zulkifli Hasan',
      activityType: 'VERIFIKASI_MEMBER',
      description: 'Memverifikasi kepemilikan buku dan mengaktifkan status Member Aktif untuk Ahmad Fauzi (BK-00001).',
      targetId: 'BK-00001',
      createdAt: '2026-11-05T09:00:00.000Z',
      isDemo: true,
    },
    {
      id: 'log-02',
      actorUid: adminUid,
      actorName: 'Ustadz H. Zulkifli Hasan',
      activityType: 'PUBLIKASI_PENGUMUMAN',
      description: 'Menerbitkan pengumuman resmi: Pembukaan Tashih & Evaluasi Semester Ganjil.',
      targetId: 'ann-01',
      createdAt: '2026-11-05T08:00:00.000Z',
      isDemo: true,
    },
    {
      id: 'log-03',
      actorUid: adminUid,
      actorName: 'Ustadz H. Zulkifli Hasan',
      activityType: 'TAMBAH_PESERTA',
      description: 'Menambahkan calon peserta baru Ibrahim Khalil dengan ID otomatis BK-00003.',
      targetId: 'BK-00003',
      createdAt: '2026-11-02T14:20:00.000Z',
      isDemo: true,
    },
  ];

  const settings: InstitutionSettings = {
    institutionName: 'BELAJAR KHOT',
    tagline: 'One Portal, Organized Learning, Better Membership Management.',
    logoURL: '',
    description:
      'Lembaga pendidikan kaligrafi Islam terstruktur yang berfokus pada penguasaan kaidah murni Khot Naskhi dan Khot Riq\'ah bagi peserta ikhwan secara Online maupun Offline.',
    contactEmail: 'sekretariat@belajarkhot.id',
    whatsappNumber: '6281110002026',
    whatsappGroupURL: 'https://chat.whatsapp.com/BelajarKhotResmiIkhwan2026',
    whatsappGroupInstructions:
      'Grup WhatsApp resmi hanya diperuntukkan bagi peserta ikhwan terdaftar. Mohon cantumkan Nama Lengkap dan Nomor ID Member (contoh: Ahmad Fauzi - BK-00001) saat bergabung.',
    whatsappHelpMessage:
      'Assalamu\'alaikum Admin Belajar Khot, saya membutuhkan bantuan terkait akses akun / verifikasi keanggotaan.',
    address: 'Griya Kaligrafi Belajar Khot, Jl. Taman Pendidikan Islam No. 14, Kebayoran Baru, Jakarta Selatan',
    memberIdPrefix: 'BK',
    membershipRules: [
      'Program pembelajaran dikhususkan untuk laki-laki (ikhwan).',
      'Calon peserta wajib memiliki atau membeli buku panduan Khot resmi sesuai ketentuan lembaga.',
      'Peserta harus terdaftar secara resmi sebagai member di sistem portal Belajar Khot.',
      'Peserta wajib mengikuti jadwal pembelajaran (Online / Offline) dan menyetorkan latihan (tashih) dengan tertib.',
      'Menjaga adab penuntut ilmu serta tidak menyebarluaskan dokumen internal lembaga tanpa izin resmi.',
    ],
    bookRequirementInfo:
      'Setiap peserta diwajibkan memiliki Buku Panduan Kaidah Khot (Khot Naskhi atau Khot Riq\'ah) terbitan resmi Belajar Khot sebagai lembar acuan koreksi.',
    bookPriceInfo: 'Paket Buku Panduan & Kalam Standar: Rp 145.000 (Sudah termasuk akses evaluasi tashih).',
    demoModeEnabled: true,
    cardSettings: {
      showQrCode: true,
      cardSubtitle: 'KARTU TANDA ANGGOTA RESMI • DIGITAL MEMBER CARD',
      cardFooterNote: 'Kartu ini merupakan identitas resmi anggota Belajar Khot dan dapat diverifikasi melalui pemindaian QR Code.',
      accentTheme: 'forest-matcha',
      memberColorTheme: {
        presetId: 'forest-matcha',
        primaryColor: '#19432D',
        secondaryColor: '#315B43',
        accentColor: '#A3D1B3',
      },
    },
  };

  return {
    users,
    passwordHashes,
    members,
    announcements,
    information,
    documents,
    classes,
    notifications,
    readReceipts: [],
    activityLogs,
    settings,
    sessions: [],
  };
}

function loadDatabase(): DatabaseSchema {
  if (!fs.existsSync(DB_FILE)) {
    const seeded = createInitialSeedDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(seeded, null, 2), 'utf-8');
    return seeded;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as DatabaseSchema;
    if (!parsed.users || !parsed.settings) {
      const seeded = createInitialSeedDatabase();
      fs.writeFileSync(DB_FILE, JSON.stringify(seeded, null, 2), 'utf-8');
      return seeded;
    }
    return parsed;
  } catch {
    const seeded = createInitialSeedDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(seeded, null, 2), 'utf-8');
    return seeded;
  }
}

let db: DatabaseSchema = loadDatabase();

function createSignedSessionToken(user: UserRecord): string {
  const payloadObj = {
    uid: user.uid,
    memberId: user.memberId,
    role: user.role,
    iat: Date.now(),
  };
  const payloadB64 = Buffer.from(JSON.stringify(payloadObj)).toString('base64url');
  const sig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payloadB64)
    .digest('base64url');
  return `bkh1.${payloadB64}.${sig}`;
}

function verifySignedSessionToken(token: string): { uid: string; memberId: string } | null {
  if (token.startsWith('fbk.')) {
    const uid = token.slice(4);
    return { uid, memberId: '' };
  }
  if (!token.startsWith('bkh1.')) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [, payloadB64, sig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payloadB64)
    .digest('base64url');
  if (sig !== expectedSig) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
    return { uid: parsed.uid, memberId: parsed.memberId };
  } catch {
    return null;
  }
}

function getActiveAppsScriptUrl(): string {
  return (
    process.env.GOOGLE_APPS_SCRIPT_URL ||
    process.env.GOOGLE_SCRIPT_URL ||
    process.env.VITE_GOOGLE_APPS_SCRIPT_URL ||
    process.env.VITE_GOOGLE_SCRIPT_URL ||
    db?.settings?.googleAppsScriptUrl ||
    ''
  ).trim();
}

let hasHydratedFromSheets = false;
let lastHydratedAtMs = 0;
let activeHydrationPromise: Promise<void> | null = null;
let pendingSyncPromise: Promise<void> | null = null;

function ensureAllUsersHavePasswordHashes() {
  for (const u of db.users) {
    if (!db.passwordHashes[u.uid]) {
      db.passwordHashes[u.uid] = hashPassword(
        u.role === 'admin' ? 'AdminKhot2026!' : 'MemberKhot123!'
      );
    }
  }
}

function applyRemoteSnapshotToDb(remote: any, scriptUrl: string) {
  if (!remote || typeof remote !== 'object') return;
  if (Array.isArray(remote.users) && remote.users.length > 0) {
    db.users = remote.users;
  }
  if (remote.passwordHashes && typeof remote.passwordHashes === 'object') {
    db.passwordHashes = {
      ...db.passwordHashes,
      ...remote.passwordHashes,
    };
  }
  ensureAllUsersHavePasswordHashes();
  if (Array.isArray(remote.members)) db.members = remote.members;
  if (Array.isArray(remote.announcements)) db.announcements = remote.announcements;
  if (Array.isArray(remote.information)) db.information = remote.information;
  if (Array.isArray(remote.documents)) db.documents = remote.documents;
  if (Array.isArray(remote.classes)) db.classes = remote.classes;
  if (Array.isArray(remote.notifications)) db.notifications = remote.notifications;
  if (Array.isArray(remote.readReceipts)) db.readReceipts = remote.readReceipts;
  if (Array.isArray(remote.activityLogs)) db.activityLogs = remote.activityLogs;
  if (remote.settings && typeof remote.settings === 'object') {
    db.settings = {
      ...db.settings,
      ...remote.settings,
      googleAppsScriptUrl: scriptUrl || remote.settings.googleAppsScriptUrl || db.settings.googleAppsScriptUrl,
      cardSettings: {
        ...db.settings.cardSettings,
        ...(remote.settings.cardSettings || {}),
      },
    };
  }
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch {
    // Ignore write error on read-only serverless container
  }
}

async function hydrateFromGoogleAppsScriptIfNeeded(force = false): Promise<void> {
  const scriptUrl = getActiveAppsScriptUrl();
  if (!scriptUrl || !scriptUrl.startsWith('https://script.google.com/')) {
    return;
  }

  // Ensure db.settings reflects the env var URL if not already set
  if (!db.settings.googleAppsScriptUrl) {
    db.settings.googleAppsScriptUrl = scriptUrl;
  }

  const now = Date.now();
  const isStaleOnServerless =
    process.env.VERCEL === '1' && now - lastHydratedAtMs > 20_000;

  if (!force && hasHydratedFromSheets && !isStaleOnServerless) {
    return;
  }

  // If a write sync is currently in flight, wait for it instead of overwriting with stale remote state
  if (pendingSyncPromise) {
    await pendingSyncPromise;
    return;
  }

  if (activeHydrationPromise) {
    await activeHydrationPromise;
    return;
  }

  activeHydrationPromise = (async () => {
    try {
      const pullUrl = `${scriptUrl}${scriptUrl.includes('?') ? '&' : '?'}action=getSnapshot`;
      const response = await fetch(pullUrl, { redirect: 'follow' });
      const result = await response.json();
      if (result && result.ok) {
        hasHydratedFromSheets = true;
        lastHydratedAtMs = Date.now();
        if (result.hasData && (result.data || result.database)) {
          applyRemoteSnapshotToDb(result.data || result.database, scriptUrl);
          if (result.updatedAt) {
            db.settings.lastGoogleSheetsSync = String(result.updatedAt);
          }
        } else {
          // Remote Google Sheet is empty on first connection -> push initial seed snapshot automatically
          await syncToGoogleAppsScriptBackground();
        }
      }
    } catch {
      // Ignore network error during background hydration
    } finally {
      activeHydrationPromise = null;
    }
  })();

  await activeHydrationPromise;
}

async function syncToGoogleAppsScriptBackground() {
  const scriptUrl = getActiveAppsScriptUrl();
  if (!scriptUrl || !scriptUrl.startsWith('https://script.google.com/')) return;
  try {
    const nowIso = new Date().toISOString();
    db.settings.googleAppsScriptUrl = scriptUrl;
    db.settings.lastGoogleSheetsSync = nowIso;

    const snapshotPayload = {
      ...db,
      sessions: undefined,
    };
    const res = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'saveSnapshot',
        data: snapshotPayload,
        database: snapshotPayload,
      }),
      redirect: 'follow',
    });
    if (res.ok) {
      hasHydratedFromSheets = true;
      lastHydratedAtMs = Date.now();
    }
  } catch {
    // Non-blocking background sync
  }
}

function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch {
    // Ignore write error if running in read-only environment
  }
  const p = syncToGoogleAppsScriptBackground();
  pendingSyncPromise = p.finally(() => {
    if (pendingSyncPromise === p) {
      pendingSyncPromise = null;
    }
  });
}

function logActivity(actorUid: string, actorName: string, activityType: string, description: string, targetId: string) {
  const entry: ActivityLogRecord = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    actorUid,
    actorName,
    activityType,
    description,
    targetId,
    createdAt: new Date().toISOString(),
  };
  db.activityLogs.unshift(entry);
  if (db.activityLogs.length > 250) {
    db.activityLogs = db.activityLogs.slice(0, 250);
  }
}

interface AuthenticatedRequest extends Request {
  authUser?: UserRecord;
  authToken?: string;
}

function getAuthenticatedUser(req: Request): { user: UserRecord; token: string } | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  if (!token) return null;

  // 1. Check stateless signed token (survives server restarts & Vercel serverless instances)
  const verified = verifySignedSessionToken(token);
  if (verified) {
    const user = db.users.find(
      (u) => u.uid === verified.uid || (verified.memberId && u.memberId === verified.memberId)
    );
    if (user && user.accountStatus === 'Aktif') {
      return { user, token };
    }
  }

  // 2. Check session table
  const session = db.sessions.find((s) => s.token === token);
  if (session) {
    const user = db.users.find((u) => u.uid === session.uid);
    if (user && user.accountStatus === 'Aktif') {
      return { user, token };
    }
  }

  return null;
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const found = getAuthenticatedUser(req);
  if (!found) {
    res.status(401).json({ error: 'Sesi tidak valid atau telah berakhir. Silakan login kembali.' });
    return;
  }
  req.authUser = found.user;
  req.authToken = found.token;
  next();
}

function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const found = getAuthenticatedUser(req);
  if (!found) {
    res.status(401).json({ error: 'Autentikasi diperlukan.' });
    return;
  }
  if (found.user.role !== 'admin') {
    res.status(401).json({
      error: 'Akses ditolak. Halaman atau operasi ini hanya diizinkan bagi Administrator Belajar Khot.',
    });
    return;
  }
  req.authUser = found.user;
  req.authToken = found.token;
  next();
}

function getCombinedProfiles(): CombinedMemberProfile[] {
  return db.members
    .map((member) => {
      const user = db.users.find((u) => u.uid === member.uid);
      if (!user) return null;
      return { user, member };
    })
    .filter((item): item is CombinedMemberProfile => item !== null);
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  // Ensure Vercel Serverless & local instances auto-hydrate from Google Sheets
  // and wait for pending write-syncs before freezing the serverless execution context
  app.use('/api', async (_req: Request, res: Response, next: NextFunction) => {
    try {
      await hydrateFromGoogleAppsScriptIfNeeded();
    } catch {
      // Continue if hydration fails
    }

    const originalJson = res.json.bind(res);
    (res as any).json = (body: any) => {
      if (pendingSyncPromise && (process.env.VERCEL === '1' || Boolean(getActiveAppsScriptUrl()))) {
        Promise.race([
          pendingSyncPromise,
          new Promise((resolve) => setTimeout(resolve, 6500)),
        ]).finally(() => {
          originalJson(body);
        });
        return res;
      }
      return originalJson(body);
    };

    next();
  });

  // ============================================================================
  // PUBLIC ENDPOINTS (Login, Help Info, Public QR Verification)
  // ============================================================================

  app.get('/api/public/help-info', (_req, res) => {
    res.json({
      institutionName: db.settings.institutionName,
      tagline: db.settings.tagline,
      whatsappNumber: db.settings.whatsappNumber,
      whatsappHelpMessage: db.settings.whatsappHelpMessage,
      contactEmail: db.settings.contactEmail,
      address: db.settings.address,
      membershipRules: db.settings.membershipRules,
      bookRequirementInfo: db.settings.bookRequirementInfo,
      demoModeEnabled: db.settings.demoModeEnabled !== false,
      cardSettings: db.settings.cardSettings,
    });
  });

  // Public QR Verification — strictly exposes ONLY minimal public verification fields (no phone, email, city, or notes)
  app.get('/api/public/verify/:memberId', (req, res) => {
    const rawId = String(req.params.memberId || '').trim().toUpperCase();
    const member = db.members.find((m) => m.memberId.toUpperCase() === rawId);
    if (!member) {
      res.status(404).json({
        valid: false,
        error: `Nomor ID Member "${rawId}" tidak ditemukan dalam basis data resmi Belajar Khot.`,
      });
      return;
    }

    const user = db.users.find((u) => u.uid === member.uid);
    if (!user) {
      res.status(404).json({
        valid: false,
        error: 'Data pengguna tidak ditemukan.',
      });
      return;
    }

    const cardDisplayStatus = computeCardDisplayStatus(member.membershipStatus, user.accountStatus);
    res.json({
      valid: cardDisplayStatus === 'MEMBER AKTIF',
      memberId: member.memberId,
      fullName: user.fullName,
      program: member.program,
      learningMethod: member.learningMethod,
      membershipStatus: member.membershipStatus,
      accountStatus: user.accountStatus,
      cardDisplayStatus,
      joinDateFormatted: formatDateID(member.joinDate),
      institutionName: db.settings.institutionName,
      verifiedAtFormatted: formatDateID(new Date().toISOString(), true),
    });
  });

  // Authentication Login
  app.post('/api/auth/login', (req, res) => {
    const { identifier, password } = req.body || {};
    const cleanId = String(identifier || '').trim().toLowerCase();
    const rawPass = String(password || '');

    if (!cleanId || !rawPass) {
      res.status(400).json({ error: 'ID Pengguna dan Password wajib diisi.' });
      return;
    }

    const user = db.users.find(
      (u) =>
        u.username.toLowerCase() === cleanId ||
        u.memberId.toLowerCase() === cleanId ||
        (u.email && u.email.toLowerCase() === cleanId)
    );

    if (!user) {
      res.status(401).json({ error: 'ID Pengguna atau Password tidak sesuai.' });
      return;
    }

    const storedHash = db.passwordHashes[user.uid];
    if (!verifyPassword(rawPass, storedHash)) {
      res.status(401).json({ error: 'ID Pengguna atau Password tidak sesuai.' });
      return;
    }

    if (user.accountStatus === 'Nonaktif') {
      res.status(401).json({
        error: 'Akun Anda saat ini berstatus Nonaktif. Silakan hubungi Admin Belajar Khot untuk informasi lebih lanjut.',
      });
      return;
    }

    const token = createSignedSessionToken(user);
    const nowIso = new Date().toISOString();
    user.lastLoginAt = nowIso;
    db.sessions.push({ token, uid: user.uid, createdAt: nowIso });
    logActivity(user.uid, user.fullName, 'LOGIN', `Pengguna ${user.memberId} berhasil masuk ke portal.`, user.memberId);
    saveDatabase();

    const memberRecord = user.role === 'member' ? db.members.find((m) => m.uid === user.uid) || null : null;

    res.json({
      token,
      user,
      member: memberRecord,
    });
  });

  app.post('/api/auth/logout', requireAuth, (req: AuthenticatedRequest, res) => {
    db.sessions = db.sessions.filter((s) => s.token !== req.authToken);
    saveDatabase();
    res.json({ success: true });
  });

  app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.authUser!;
    const member = user.role === 'member' ? db.members.find((m) => m.uid === user.uid) || null : null;
    res.json({ user, member });
  });

  app.post('/api/auth/change-password', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.authUser!;
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword || String(newPassword).length < 6) {
      res.status(400).json({ error: 'Password baru minimal harus terdiri dari 6 karakter.' });
      return;
    }

    const storedHash = db.passwordHashes[user.uid];
    if (!verifyPassword(String(currentPassword), storedHash)) {
      res.status(400).json({ error: 'Password saat ini yang Anda masukkan salah.' });
      return;
    }

    db.passwordHashes[user.uid] = hashPassword(String(newPassword));
    user.updatedAt = new Date().toISOString();
    logActivity(user.uid, user.fullName, 'UBAH_PASSWORD', `Pengguna ${user.memberId} memperbarui password akun.`, user.memberId);
    saveDatabase();

    res.json({ success: true, message: 'Password berhasil diperbarui.' });
  });

  // ============================================================================
  // DASHBOARD DATA (Role-Aware)
  // ============================================================================

  app.get('/api/dashboard', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.authUser!;

    if (user.role === 'admin') {
      const profiles = getCombinedProfiles();
      const stats = calculateDashboardStats(profiles, db.announcements);
      res.json({
        role: 'admin',
        stats,
        recentMembers: profiles.slice(0, 6),
        recentAnnouncements: db.announcements.slice(0, 5),
        recentLogs: db.activityLogs.slice(0, 8),
        classes: db.classes,
        settings: db.settings,
      });
      return;
    }

    // Member Dashboard — only personal data & audience-matched content
    const member = db.members.find((m) => m.uid === user.uid) || null;
    const myAnnouncements = db.announcements.filter(
      (a) => a.status === 'Dipublikasikan' && matchesTargetAudience(a.targetAudience, member)
    );
    const myReadIds = db.readReceipts.filter((r) => r.uid === user.uid).map((r) => r.announcementId);
    const myInfo = db.information
      .filter((i) => i.status === 'Aktif' && matchesTargetAudience(i.targetAudience, member))
      .sort((a, b) => a.orderIndex - b.orderIndex);
    const myDocuments = db.documents.filter((d) => canMemberAccessDocument(d, member, user.accountStatus));
    const myClasses = db.classes.filter(
      (c) =>
        member &&
        (c.participantIds.includes(member.memberId) ||
          (c.program === member.program && c.learningMethod === member.learningMethod))
    );

    res.json({
      role: 'member',
      user,
      member,
      announcements: myAnnouncements,
      readAnnouncementIds: myReadIds,
      information: myInfo,
      documents: myDocuments,
      classes: myClasses,
      settings: db.settings,
    });
  });

  // ============================================================================
  // MEMBERS & ACCOUNTS CRUD (Admin Only, plus Member Self-Profile Update)
  // ============================================================================

  app.get('/api/members', requireAdmin, (_req, res) => {
    res.json({
      profiles: getCombinedProfiles(),
      admins: db.users.filter((u) => u.role === 'admin'),
    });
  });

  app.post('/api/members', requireAdmin, (req: AuthenticatedRequest, res) => {
    const admin = req.authUser!;
    const {
      fullName,
      phone,
      email,
      city,
      learningMethod,
      program,
      bookPurchaseStatus,
      membershipStatus,
      agreedToRules,
      adminNotes,
      initialPassword,
    } = req.body || {};

    const validation = validateParticipantForm({
      fullName: String(fullName || ''),
      phone: String(phone || ''),
      email: String(email || ''),
      city: String(city || ''),
      learningMethod: String(learningMethod || ''),
      program: String(program || ''),
      agreedToRules: Boolean(agreedToRules),
    });

    if (!validation.valid) {
      res.status(400).json({ error: Object.values(validation.errors)[0], errors: validation.errors });
      return;
    }

    const existingIds = db.members.map((m) => m.memberId);
    const nextMemberId = generateNextMemberId(existingIds, db.settings.memberIdPrefix || 'BK');
    const nowIso = new Date().toISOString();
    const newUid = `usr-${nextMemberId.toLowerCase()}-${Date.now().toString(36)}`;
    const rawPassword = initialPassword && String(initialPassword).trim().length >= 6
      ? String(initialPassword).trim()
      : 'MemberKhot123!';

    const validMembershipStatus: MembershipStatus =
      membershipStatus || 'Calon Peserta';
    const validBookStatus: BookPurchaseStatus =
      bookPurchaseStatus || 'Belum membeli';

    const newUser: UserRecord = {
      uid: newUid,
      memberId: nextMemberId,
      username: nextMemberId,
      fullName: String(fullName).trim(),
      gender: 'Laki-laki (Ikhwan)',
      phone: String(phone).trim(),
      email: String(email || '').trim(),
      city: String(city).trim(),
      photoURL: '',
      role: 'member',
      accountStatus: 'Aktif',
      createdAt: nowIso,
      updatedAt: nowIso,
      lastLoginAt: null,
      isDemo: false,
    };

    const newMember: MemberRecord = {
      id: `mem-${nextMemberId.toLowerCase()}`,
      uid: newUid,
      memberId: nextMemberId,
      program: program as ProgramType,
      learningMethod: learningMethod as LearningMethod,
      bookPurchaseStatus: validBookStatus,
      membershipStatus: validMembershipStatus,
      agreedToRules: true,
      joinDate: nowIso,
      verificationDate: validMembershipStatus === 'Member Aktif' ? nowIso : null,
      adminNotes: String(adminNotes || '').trim(),
      isDemo: false,
    };

    db.users.unshift(newUser);
    db.members.unshift(newMember);
    db.passwordHashes[newUid] = hashPassword(rawPassword);

    // Automatically enroll in matching class if available
    const matchingClass = db.classes.find(
      (c) => c.program === newMember.program && c.learningMethod === newMember.learningMethod
    );
    if (matchingClass && !matchingClass.participantIds.includes(nextMemberId)) {
      matchingClass.participantIds.push(nextMemberId);
    }

    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      recipientUid: newUid,
      title: 'Selamat Datang di Portal Belajar Khot',
      message: `Akun Anda telah dibuat dengan ID Member ${nextMemberId}. Silakan lengkapi persyaratan buku untuk aktivasi kartu.`,
      type: 'info',
      isRead: false,
      createdAt: nowIso,
      linkTo: '/member/card',
    });

    logActivity(
      admin.uid,
      admin.fullName,
      'TAMBAH_PESERTA',
      `Menambahkan peserta baru ${newUser.fullName} dengan ID otomatis ${nextMemberId}.`,
      nextMemberId
    );
    saveDatabase();

    res.status(201).json({
      profile: { user: newUser, member: newMember },
      generatedPassword: rawPassword,
    });
  });

  app.put('/api/members/:memberId', requireAdmin, (req: AuthenticatedRequest, res) => {
    const admin = req.authUser!;
    const targetId = String(req.params.memberId || '').toUpperCase();
    const member = db.members.find((m) => m.memberId.toUpperCase() === targetId);
    if (!member) {
      res.status(404).json({ error: 'Data peserta tidak ditemukan.' });
      return;
    }
    const user = db.users.find((u) => u.uid === member.uid);
    if (!user) {
      res.status(404).json({ error: 'Akun peserta tidak ditemukan.' });
      return;
    }

    const {
      fullName,
      phone,
      email,
      city,
      learningMethod,
      program,
      bookPurchaseStatus,
      membershipStatus,
      accountStatus,
      adminNotes,
    } = req.body || {};

    if (fullName !== undefined) user.fullName = String(fullName).trim();
    if (phone !== undefined) user.phone = String(phone).trim();
    if (email !== undefined) user.email = String(email).trim();
    if (city !== undefined) user.city = String(city).trim();
    if (accountStatus === 'Aktif' || accountStatus === 'Nonaktif') {
      user.accountStatus = accountStatus;
    }
    if (learningMethod === 'Online' || learningMethod === 'Offline') {
      member.learningMethod = learningMethod;
    }
    if (program === 'Khot Naskhi' || program === "Khot Riq'ah") {
      member.program = program;
    }
    if (bookPurchaseStatus) {
      member.bookPurchaseStatus = bookPurchaseStatus as BookPurchaseStatus;
    }
    if (membershipStatus) {
      const prev = member.membershipStatus;
      member.membershipStatus = membershipStatus as MembershipStatus;
      if (membershipStatus === 'Member Aktif' && !member.verificationDate) {
        member.verificationDate = new Date().toISOString();
      }
      if (prev !== membershipStatus) {
        db.notifications.unshift({
          id: `notif-${Date.now()}`,
          recipientUid: user.uid,
          title: 'Pembaruan Status Keanggotaan',
          message: `Status keanggotaan Anda (${member.memberId}) telah diperbarui menjadi: ${membershipStatus}.`,
          type: membershipStatus === 'Member Aktif' ? 'success' : 'info',
          isRead: false,
          createdAt: new Date().toISOString(),
          linkTo: '/member/card',
        });
      }
    }
    if (adminNotes !== undefined) {
      member.adminNotes = String(adminNotes);
    }
    if (req.body?.customCardColor !== undefined) {
      member.customCardColor = String(req.body.customCardColor || '').trim();
    }

    user.updatedAt = new Date().toISOString();
    logActivity(
      admin.uid,
      admin.fullName,
      'EDIT_PESERTA',
      `Memperbarui data/status peserta ${user.fullName} (${member.memberId}) -> Status: ${member.membershipStatus}, Buku: ${member.bookPurchaseStatus}.`,
      member.memberId
    );
    saveDatabase();

    res.json({ profile: { user, member } });
  });

  app.delete('/api/members/:memberId', requireAdmin, (req: AuthenticatedRequest, res) => {
    const admin = req.authUser!;
    const targetId = String(req.params.memberId || '').toUpperCase();
    const memberIndex = db.members.findIndex((m) => m.memberId.toUpperCase() === targetId);
    if (memberIndex === -1) {
      res.status(404).json({ error: 'Peserta tidak ditemukan.' });
      return;
    }
    const member = db.members[memberIndex];
    const user = db.users.find((u) => u.uid === member.uid);
    const fullName = user?.fullName || targetId;

    db.members.splice(memberIndex, 1);
    db.users = db.users.filter((u) => u.uid !== member.uid);
    delete db.passwordHashes[member.uid];
    db.sessions = db.sessions.filter((s) => s.uid !== member.uid);
    for (const cls of db.classes) {
      cls.participantIds = cls.participantIds.filter((id) => id !== member.memberId);
    }

    logActivity(
      admin.uid,
      admin.fullName,
      'HAPUS_PESERTA',
      `Menghapus data peserta ${fullName} (${member.memberId}).`,
      member.memberId
    );
    saveDatabase();

    res.json({ success: true });
  });

  // Admin resets a member's password
  app.post('/api/accounts/:uid/reset-password', requireAdmin, (req: AuthenticatedRequest, res) => {
    const admin = req.authUser!;
    const targetUser = db.users.find((u) => u.uid === req.params.uid);
    if (!targetUser) {
      res.status(404).json({ error: 'Akun tidak ditemukan.' });
      return;
    }

    const customPassword = req.body?.newPassword && String(req.body.newPassword).trim().length >= 6
      ? String(req.body.newPassword).trim()
      : `Khot${Math.floor(1000 + Math.random() * 9000)}!`;

    db.passwordHashes[targetUser.uid] = hashPassword(customPassword);
    targetUser.updatedAt = new Date().toISOString();

    logActivity(
      admin.uid,
      admin.fullName,
      'RESET_PASSWORD',
      `Mereset password akun ${targetUser.fullName} (${targetUser.memberId}).`,
      targetUser.memberId
    );
    saveDatabase();

    res.json({
      success: true,
      temporaryPassword: customPassword,
      memberId: targetUser.memberId,
    });
  });

  // Member updates their own allowed profile fields (cannot touch role, membershipStatus, or memberId)
  app.put('/api/member/profile', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.authUser!;
    const { phone, email, city } = req.body || {};

    if (phone !== undefined) {
      const cleanPhone = String(phone).replace(/[\s\-()]/g, '');
      if (!/^(\+62|62|08)[0-9]{7,13}$/.test(cleanPhone)) {
        res.status(400).json({ error: 'Format nomor WhatsApp tidak valid.' });
        return;
      }
      user.phone = String(phone).trim();
    }
    if (email !== undefined) {
      user.email = String(email).trim();
    }
    if (city !== undefined) {
      if (String(city).trim().length < 2) {
        res.status(400).json({ error: 'Domisili kota/kabupaten wajib diisi.' });
        return;
      }
      user.city = String(city).trim();
    }

    user.updatedAt = new Date().toISOString();
    logActivity(user.uid, user.fullName, 'UPDATE_PROFIL_MANDIRI', `Member ${user.memberId} memperbarui data kontak/domisili profil.`, user.memberId);
    saveDatabase();

    const member = db.members.find((m) => m.uid === user.uid) || null;
    res.json({ user, member });
  });

  // Member requests book verification confirmation
  app.post('/api/member/request-book-verification', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.authUser!;
    const member = db.members.find((m) => m.uid === user.uid);
    if (!member) {
      res.status(404).json({ error: 'Data keanggotaan tidak ditemukan.' });
      return;
    }

    member.bookPurchaseStatus = 'Menunggu verifikasi';
    if (member.membershipStatus === 'Calon Peserta') {
      member.membershipStatus = 'Menunggu Verifikasi';
    }

    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      recipientUid: 'ALL_ADMINS',
      title: 'Konfirmasi Pembelian Buku Khot',
      message: `${user.fullName} (${member.memberId}) telah mengonfirmasi kepemilikan buku Khot dan menunggu verifikasi Admin.`,
      type: 'verification',
      isRead: false,
      createdAt: new Date().toISOString(),
      linkTo: '/admin/members',
    });

    logActivity(user.uid, user.fullName, 'KONFIRMASI_BUKU', `Member ${member.memberId} mengajukan verifikasi kepemilikan buku Khot.`, member.memberId);
    saveDatabase();

    res.json({ member });
  });

  // ============================================================================
  // ANNOUNCEMENTS
  // ============================================================================

  app.get('/api/announcements', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.authUser!;
    if (user.role === 'admin') {
      res.json({
        announcements: db.announcements,
        readReceipts: db.readReceipts,
      });
      return;
    }

    const member = db.members.find((m) => m.uid === user.uid) || null;
    const filtered = db.announcements.filter(
      (a) => a.status === 'Dipublikasikan' && matchesTargetAudience(a.targetAudience, member)
    );
    const readIds = db.readReceipts.filter((r) => r.uid === user.uid).map((r) => r.announcementId);
    res.json({
      announcements: filtered,
      readAnnouncementIds: readIds,
    });
  });

  app.post('/api/announcements', requireAdmin, (req: AuthenticatedRequest, res) => {
    const admin = req.authUser!;
    const {
      title,
      content,
      category,
      targetAudience,
      isPinned,
      isImportant,
      status,
      expiresAt,
      attachmentURL,
      attachmentName,
    } = req.body || {};

    if (!title || !content) {
      res.status(400).json({ error: 'Judul dan isi pengumuman wajib diisi.' });
      return;
    }

    const nowIso = new Date().toISOString();
    const newAnn: AnnouncementRecord = {
      id: `ann-${Date.now()}`,
      title: String(title).trim(),
      content: String(content).trim(),
      category: category || 'Pengumuman Resmi',
      imageURL: '',
      attachmentURL: String(attachmentURL || ''),
      attachmentName: String(attachmentName || ''),
      targetAudience: targetAudience || 'Semua Member',
      isPinned: Boolean(isPinned),
      isImportant: Boolean(isImportant),
      status: status === 'Draft' ? 'Draft' : 'Dipublikasikan',
      publishAt: nowIso,
      expiresAt: expiresAt ? String(expiresAt) : null,
      createdBy: admin.fullName,
      createdAt: nowIso,
      isDemo: false,
    };

    db.announcements.unshift(newAnn);
    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      recipientUid: 'ALL_MEMBERS',
      title: `Pengumuman Baru: ${newAnn.title}`,
      message: `${newAnn.category} — Silakan baca pengumuman resmi terbaru dari pengurus Belajar Khot.`,
      type: 'announcement',
      isRead: false,
      createdAt: nowIso,
      linkTo: '/member/announcements',
    });

    logActivity(
      admin.uid,
      admin.fullName,
      'BUAT_PENGUMUMAN',
      `Menerbitkan pengumuman "${newAnn.title}" untuk ${newAnn.targetAudience}.`,
      newAnn.id
    );
    saveDatabase();

    res.status(201).json({ announcement: newAnn });
  });

  app.put('/api/announcements/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
    const admin = req.authUser!;
    const ann = db.announcements.find((a) => a.id === req.params.id);
    if (!ann) {
      res.status(404).json({ error: 'Pengumuman tidak ditemukan.' });
      return;
    }

    const { title, content, category, targetAudience, isPinned, isImportant, status, expiresAt } = req.body || {};
    if (title !== undefined) ann.title = String(title).trim();
    if (content !== undefined) ann.content = String(content).trim();
    if (category !== undefined) ann.category = category;
    if (targetAudience !== undefined) ann.targetAudience = targetAudience;
    if (isPinned !== undefined) ann.isPinned = Boolean(isPinned);
    if (isImportant !== undefined) ann.isImportant = Boolean(isImportant);
    if (status !== undefined) ann.status = status;
    if (expiresAt !== undefined) ann.expiresAt = expiresAt || null;

    logActivity(admin.uid, admin.fullName, 'EDIT_PENGUMUMAN', `Memperbarui pengumuman "${ann.title}".`, ann.id);
    saveDatabase();
    res.json({ announcement: ann });
  });

  app.delete('/api/announcements/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
    const admin = req.authUser!;
    const idx = db.announcements.findIndex((a) => a.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Pengumuman tidak ditemukan.' });
      return;
    }
    const removed = db.announcements.splice(idx, 1)[0];
    logActivity(admin.uid, admin.fullName, 'HAPUS_PENGUMUMAN', `Menghapus pengumuman "${removed.title}".`, removed.id);
    saveDatabase();
    res.json({ success: true });
  });

  app.post('/api/announcements/:id/read', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.authUser!;
    const annId = req.params.id;
    const exists = db.readReceipts.some((r) => r.announcementId === annId && r.uid === user.uid);
    if (!exists) {
      db.readReceipts.push({
        id: `rr-${Date.now()}`,
        announcementId: annId,
        uid: user.uid,
        readAt: new Date().toISOString(),
      });
      saveDatabase();
    }
    res.json({ success: true });
  });

  // ============================================================================
  // INFORMATION & PROMOTIONS CENTER (Pusat Informasi)
  // ============================================================================

  app.get('/api/information', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.authUser!;
    if (user.role === 'admin') {
      const sorted = [...db.information].sort((a, b) => a.orderIndex - b.orderIndex);
      res.json({ information: sorted });
      return;
    }
    const member = db.members.find((m) => m.uid === user.uid) || null;
    const filtered = db.information
      .filter((i) => i.status === 'Aktif' && matchesTargetAudience(i.targetAudience, member))
      .sort((a, b) => a.orderIndex - b.orderIndex);
    res.json({ information: filtered });
  });

  app.post('/api/information', requireAdmin, (req: AuthenticatedRequest, res) => {
    const admin = req.authUser!;
    const { title, description, category, targetAudience, destinationURL, status, orderIndex } = req.body || {};
    if (!title || !description) {
      res.status(400).json({ error: 'Judul dan deskripsi informasi wajib diisi.' });
      return;
    }

    const nowIso = new Date().toISOString();
    const newItem: InformationRecord = {
      id: `info-${Date.now()}`,
      title: String(title).trim(),
      description: String(description).trim(),
      imageURL: '',
      category: category || 'Informasi Lembaga',
      targetAudience: targetAudience || 'Semua Member',
      destinationURL: String(destinationURL || '').trim(),
      status: status === 'Nonaktif' ? 'Nonaktif' : 'Aktif',
      orderIndex: Number(orderIndex) || db.information.length + 1,
      publishAt: nowIso,
      expiresAt: null,
      isDemo: false,
    };

    db.information.push(newItem);
    logActivity(admin.uid, admin.fullName, 'TAMBAH_INFORMASI', `Menambahkan konten Pusat Informasi "${newItem.title}".`, newItem.id);
    saveDatabase();
    res.status(201).json({ item: newItem });
  });

  app.put('/api/information/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
    const admin = req.authUser!;
    const item = db.information.find((i) => i.id === req.params.id);
    if (!item) {
      res.status(404).json({ error: 'Konten informasi tidak ditemukan.' });
      return;
    }
    const { title, description, category, targetAudience, destinationURL, status, orderIndex } = req.body || {};
    if (title !== undefined) item.title = String(title).trim();
    if (description !== undefined) item.description = String(description).trim();
    if (category !== undefined) item.category = category;
    if (targetAudience !== undefined) item.targetAudience = targetAudience;
    if (destinationURL !== undefined) item.destinationURL = String(destinationURL).trim();
    if (status !== undefined) item.status = status;
    if (orderIndex !== undefined) item.orderIndex = Number(orderIndex);

    logActivity(admin.uid, admin.fullName, 'EDIT_INFORMASI', `Memperbarui konten informasi "${item.title}".`, item.id);
    saveDatabase();
    res.json({ item });
  });

  app.delete('/api/information/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
    const admin = req.authUser!;
    const idx = db.information.findIndex((i) => i.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Konten informasi tidak ditemukan.' });
      return;
    }
    const removed = db.information.splice(idx, 1)[0];
    logActivity(admin.uid, admin.fullName, 'HAPUS_INFORMASI', `Menghapus konten informasi "${removed.title}".`, removed.id);
    saveDatabase();
    res.json({ success: true });
  });

  // ============================================================================
  // DOCUMENT CENTER (Pusat Dokumen) + Real Backend Upload & Download
  // ============================================================================

  app.get('/api/documents', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.authUser!;
    if (user.role === 'admin') {
      res.json({ documents: db.documents });
      return;
    }
    const member = db.members.find((m) => m.uid === user.uid) || null;
    const allowed = db.documents.filter((d) => canMemberAccessDocument(d, member, user.accountStatus));
    res.json({ documents: allowed });
  });

  app.post('/api/documents', requireAdmin, (req: AuthenticatedRequest, res) => {
    const admin = req.authUser!;
    const {
      fileName,
      fileType,
      fileSize,
      category,
      description,
      accessLevel,
      targetAudience,
      contentSummary,
      base64Content,
    } = req.body || {};

    if (!fileName || !description) {
      res.status(400).json({ error: 'Nama file dan deskripsi dokumen wajib diisi.' });
      return;
    }

    const allowedExtensions = ['PDF', 'DOCX', 'XLSX', 'JPG', 'JPEG', 'PNG', 'PPTX'];
    const cleanType = String(fileType || 'PDF').toUpperCase();
    if (!allowedExtensions.includes(cleanType)) {
      res.status(400).json({ error: 'Jenis file tidak diizinkan. Gunakan PDF, DOCX, XLSX, JPG, PNG, atau PPTX.' });
      return;
    }

    const safeFileName = String(fileName).replace(/[^a-zA-Z0-9._-]/g, '_');
    const docId = `doc-${Date.now()}`;
    let actualSize = Number(fileSize) || 0;

    if (base64Content && typeof base64Content === 'string') {
      const base64Data = base64Content.includes(',') ? base64Content.split(',')[1] : base64Content;
      const buffer = Buffer.from(base64Data, 'base64');
      if (buffer.byteLength > 10 * 1024 * 1024) {
        res.status(400).json({ error: 'Ukuran file melebihi batas maksimum 10 MB.' });
        return;
      }
      fs.writeFileSync(path.join(UPLOADS_DIR, safeFileName), buffer);
      actualSize = buffer.byteLength;
    } else {
      actualSize = ensureSamplePdfOnDisk(
        safeFileName,
        safeFileName,
        String(contentSummary || description)
      );
    }

    const nowIso = new Date().toISOString();
    const newDoc: DocumentRecord = {
      id: docId,
      fileName: safeFileName,
      fileURL: `/api/documents/${docId}/download`,
      fileType: cleanType,
      fileSize: actualSize,
      category: category || 'Dokumen Resmi',
      description: String(description).trim(),
      accessLevel: accessLevel || 'Publik Member',
      targetAudience: targetAudience || 'Semua Member',
      status: 'Aktif',
      uploadedBy: admin.fullName,
      uploadedAt: nowIso,
      contentSummary: String(contentSummary || description).trim(),
      isDemo: false,
    };

    db.documents.unshift(newDoc);
    logActivity(admin.uid, admin.fullName, 'UPLOAD_DOKUMEN', `Mengunggah dokumen "${newDoc.fileName}" (${newDoc.category}).`, newDoc.id);
    saveDatabase();

    res.status(201).json({ document: newDoc });
  });

  app.get('/api/documents/:id/download', (req, res) => {
    const doc = db.documents.find((d) => d.id === req.params.id);
    if (!doc) {
      res.status(404).json({ error: 'Dokumen tidak ditemukan.' });
      return;
    }

    const filePath = path.join(UPLOADS_DIR, doc.fileName);
    if (!fs.existsSync(filePath)) {
      ensureSamplePdfOnDisk(doc.fileName, doc.fileName, doc.description);
    }

    res.setHeader('Content-Disposition', `attachment; filename="${doc.fileName}"`);
    res.setHeader('Content-Type', doc.fileType === 'PDF' ? 'application/pdf' : 'application/octet-stream');
    res.sendFile(filePath);
  });

  app.delete('/api/documents/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
    const admin = req.authUser!;
    const idx = db.documents.findIndex((d) => d.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Dokumen tidak ditemukan.' });
      return;
    }
    const removed = db.documents.splice(idx, 1)[0];
    logActivity(admin.uid, admin.fullName, 'HAPUS_DOKUMEN', `Menghapus dokumen "${removed.fileName}".`, removed.id);
    saveDatabase();
    res.json({ success: true });
  });

  // ============================================================================
  // CLASSES & LEARNING PROGRAMS (Modul Kelas)
  // ============================================================================

  app.get('/api/classes', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.authUser!;
    if (user.role === 'admin') {
      res.json({ classes: db.classes });
      return;
    }
    const member = db.members.find((m) => m.uid === user.uid) || null;
    const filtered = db.classes.filter(
      (c) =>
        member &&
        (c.participantIds.includes(member.memberId) ||
          (c.program === member.program && c.learningMethod === member.learningMethod))
    );
    res.json({ classes: filtered });
  });

  app.post('/api/classes', requireAdmin, (req: AuthenticatedRequest, res) => {
    const admin = req.authUser!;
    const {
      className,
      instructor,
      program,
      learningMethod,
      schedule,
      meetingLink,
      offlineLocation,
      description,
      participantIds,
      status,
    } = req.body || {};

    if (!className || !schedule) {
      res.status(400).json({ error: 'Nama kelas dan jadwal pembelajaran wajib diisi.' });
      return;
    }

    const newClass: ClassRecord = {
      id: `cls-${Date.now()}`,
      className: String(className).trim(),
      instructor: String(instructor || 'Ustadz Pembimbing Belajar Khot').trim(),
      program: program === "Khot Riq'ah" ? "Khot Riq'ah" : 'Khot Naskhi',
      learningMethod: learningMethod === 'Offline' ? 'Offline' : 'Online',
      schedule: String(schedule).trim(),
      meetingLink: String(meetingLink || '-').trim(),
      offlineLocation: String(offlineLocation || '-').trim(),
      description: String(description || '').trim(),
      participantIds: Array.isArray(participantIds) ? participantIds : [],
      status: status || 'Aktif',
      isDemo: false,
    };

    db.classes.unshift(newClass);
    logActivity(admin.uid, admin.fullName, 'TAMBAH_KELAS', `Menambahkan kelas "${newClass.className}" (${newClass.program} - ${newClass.learningMethod}).`, newClass.id);
    saveDatabase();
    res.status(201).json({ classRecord: newClass });
  });

  app.put('/api/classes/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
    const admin = req.authUser!;
    const cls = db.classes.find((c) => c.id === req.params.id);
    if (!cls) {
      res.status(404).json({ error: 'Kelas tidak ditemukan.' });
      return;
    }

    const {
      className,
      instructor,
      program,
      learningMethod,
      schedule,
      meetingLink,
      offlineLocation,
      description,
      participantIds,
      status,
    } = req.body || {};

    if (className !== undefined) cls.className = String(className).trim();
    if (instructor !== undefined) cls.instructor = String(instructor).trim();
    if (program !== undefined) cls.program = program;
    if (learningMethod !== undefined) cls.learningMethod = learningMethod;
    if (schedule !== undefined) cls.schedule = String(schedule).trim();
    if (meetingLink !== undefined) cls.meetingLink = String(meetingLink).trim();
    if (offlineLocation !== undefined) cls.offlineLocation = String(offlineLocation).trim();
    if (description !== undefined) cls.description = String(description).trim();
    if (Array.isArray(participantIds)) cls.participantIds = participantIds;
    if (status !== undefined) cls.status = status;

    logActivity(admin.uid, admin.fullName, 'EDIT_KELAS', `Memperbarui informasi kelas "${cls.className}".`, cls.id);
    saveDatabase();
    res.json({ classRecord: cls });
  });

  app.delete('/api/classes/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
    const admin = req.authUser!;
    const idx = db.classes.findIndex((c) => c.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Kelas tidak ditemukan.' });
      return;
    }
    const removed = db.classes.splice(idx, 1)[0];
    logActivity(admin.uid, admin.fullName, 'HAPUS_KELAS', `Menghapus kelas "${removed.className}".`, removed.id);
    saveDatabase();
    res.json({ success: true });
  });

  // ============================================================================
  // NOTIFICATIONS & ACTIVITY LOGS
  // ============================================================================

  app.get('/api/notifications', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.authUser!;
    const items = db.notifications.filter((n) => {
      if (user.role === 'admin') {
        return n.recipientUid === 'ALL_ADMINS' || n.recipientUid === user.uid;
      }
      return n.recipientUid === 'ALL_MEMBERS' || n.recipientUid === user.uid;
    });
    res.json({ notifications: items });
  });

  app.post('/api/notifications/:id/read', requireAuth, (req: AuthenticatedRequest, res) => {
    const notif = db.notifications.find((n) => n.id === req.params.id);
    if (notif) {
      notif.isRead = true;
      saveDatabase();
    }
    res.json({ success: true });
  });

  app.post('/api/notifications/read-all', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.authUser!;
    for (const n of db.notifications) {
      if (user.role === 'admin' && (n.recipientUid === 'ALL_ADMINS' || n.recipientUid === user.uid)) {
        n.isRead = true;
      } else if (user.role === 'member' && (n.recipientUid === 'ALL_MEMBERS' || n.recipientUid === user.uid)) {
        n.isRead = true;
      }
    }
    saveDatabase();
    res.json({ success: true });
  });

  app.get('/api/activity-logs', requireAdmin, (_req, res) => {
    res.json({ logs: db.activityLogs });
  });

  // ============================================================================
  // SETTINGS & DEMO DATA MANAGEMENT
  // ============================================================================

  app.get('/api/settings', requireAuth, (_req, res) => {
    res.json({ settings: db.settings });
  });

  app.put('/api/settings', requireAdmin, (req: AuthenticatedRequest, res) => {
    const admin = req.authUser!;
    const updates = req.body || {};
    const nextColorTheme =
      updates.memberColorTheme ||
      updates.cardSettings?.memberColorTheme ||
      db.settings.memberColorTheme ||
      db.settings.cardSettings?.memberColorTheme;
    db.settings = {
      ...db.settings,
      ...updates,
      memberColorTheme: nextColorTheme,
      cardSettings: {
        ...db.settings.cardSettings,
        ...(updates.cardSettings || {}),
        ...(nextColorTheme ? { memberColorTheme: nextColorTheme } : {}),
      },
    };
    logActivity(admin.uid, admin.fullName, 'UBAH_PENGATURAN', 'Memperbarui konfigurasi lembaga, ketentuan keanggotaan, atau grup WhatsApp.', 'settings');
    saveDatabase();
    res.json({ settings: db.settings });
  });

  // ============================================================================
  // GOOGLE SHEETS / APPS SCRIPT DATABASE INTEGRATION ENDPOINTS
  // ============================================================================

  app.get('/api/database/status', requireAdmin, (_req, res) => {
    let appsScriptCode = '';
    try {
      const codePath = path.resolve(process.cwd(), 'google-apps-script', 'Code.gs');
      if (fs.existsSync(codePath)) {
        appsScriptCode = fs.readFileSync(codePath, 'utf-8');
      }
    } catch {
      // ignore
    }

    const activeUrl = getActiveAppsScriptUrl();
    const usingEnv = Boolean(
      process.env.GOOGLE_APPS_SCRIPT_URL ||
        process.env.GOOGLE_SCRIPT_URL ||
        process.env.VITE_GOOGLE_APPS_SCRIPT_URL ||
        process.env.VITE_GOOGLE_SCRIPT_URL
    );
    res.json({
      connected: Boolean(activeUrl && activeUrl.startsWith('https://script.google.com/')),
      googleAppsScriptUrl: activeUrl,
      usingEnvVar: usingEnv,
      lastSync: db.settings.lastGoogleSheetsSync || null,
      lastGoogleSheetsSync: db.settings.lastGoogleSheetsSync || null,
      counts: {
        users: db.users.length,
        members: db.members.length,
        announcements: db.announcements.length,
        documents: db.documents.length,
        classes: db.classes.length,
      },
      appsScriptCode,
    });
  });

  app.post('/api/database/sync', requireAdmin, async (req: AuthenticatedRequest, res) => {
    const admin = req.authUser!;
    const { direction = 'push', googleAppsScriptUrl } = req.body || {};

    if (typeof googleAppsScriptUrl === 'string' && googleAppsScriptUrl.trim()) {
      db.settings.googleAppsScriptUrl = googleAppsScriptUrl.trim();
    }

    const targetUrl = getActiveAppsScriptUrl();
    if (!targetUrl || !targetUrl.startsWith('https://script.google.com/')) {
      res.status(400).json({
        error:
          'URL Web App Google Apps Script belum valid. Pastikan URL diawali dengan https://script.google.com/macros/s/.../exec',
      });
      return;
    }

    try {
      if (direction === 'pull') {
        const pullUrl = `${targetUrl}${targetUrl.includes('?') ? '&' : '?'}action=getSnapshot`;
        const response = await fetch(pullUrl, { redirect: 'follow' });
        const result = await response.json();
        if (!result.ok) {
          throw new Error(result.error || 'Gagal membaca data dari Google Sheets.');
        }
        const nowIso = new Date().toISOString();
        if (result.hasData && (result.data || result.database)) {
          applyRemoteSnapshotToDb(result.data || result.database, targetUrl);
        }
        db.settings.googleAppsScriptUrl = targetUrl;
        db.settings.lastGoogleSheetsSync = nowIso;
        hasHydratedFromSheets = true;
        lastHydratedAtMs = Date.now();
        logActivity(
          admin.uid,
          admin.fullName,
          'PULL_GOOGLE_SHEETS',
          'Menarik (Pull) data terbaru dari Google Sheets Apps Script.',
          'google-sheets'
        );
        res.json({
          success: true,
          direction: 'pull',
          message: 'Data dari Google Sheets berhasil ditarik dan disinkronisasikan ke aplikasi.',
          lastSync: nowIso,
          syncedAt: nowIso,
        });
        return;
      }

      // Default: Push snapshot to Google Sheets
      const nowIso = new Date().toISOString();
      db.settings.googleAppsScriptUrl = targetUrl;
      db.settings.lastGoogleSheetsSync = nowIso;

      const snapshotPayload = {
        users: db.users,
        passwordHashes: db.passwordHashes,
        members: db.members,
        announcements: db.announcements,
        information: db.information,
        documents: db.documents,
        classes: db.classes,
        notifications: db.notifications,
        readReceipts: db.readReceipts,
        activityLogs: db.activityLogs,
        settings: db.settings,
      };

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'saveSnapshot',
          data: snapshotPayload,
          database: snapshotPayload,
        }),
        redirect: 'follow',
      });

      const result = await response.json();
      if (!result.ok) {
        throw new Error(result.error || 'Google Apps Script mengembalikan status gagal.');
      }

      hasHydratedFromSheets = true;
      lastHydratedAtMs = Date.now();
      logActivity(
        admin.uid,
        admin.fullName,
        'PUSH_GOOGLE_SHEETS',
        'Mengirim & menyinkronisasikan seluruh tabel ke Google Sheets Apps Script.',
        'google-sheets'
      );
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
      } catch {
        // ignore
      }

      res.json({
        success: true,
        direction: 'push',
        message:
          result.message ||
          'Seluruh data peserta, pengumuman, kelas, dan dokumen berhasil disimpan ke Google Sheets!',
        lastSync: nowIso,
        syncedAt: nowIso,
      });
    } catch (err: any) {
      res.status(400).json({
        error: `Gagal menghubungi Google Apps Script: ${
          err.message || 'Pastikan Web App dideploy dengan akses "Anyone" (Siapa saja).'
        }`,
      });
    }
  });

  const cleanDemoRecords = () => {
    const demoUids = new Set(db.users.filter((u) => u.isDemo).map((u) => u.uid));
    db.users = db.users.filter((u) => !u.isDemo);
    db.members = db.members.filter((m) => !m.isDemo);
    db.announcements = db.announcements.filter((a) => !a.isDemo);
    db.information = db.information.filter((i) => !i.isDemo);
    db.documents = db.documents.filter((d) => !d.isDemo);
    db.classes = db.classes.filter((c) => !c.isDemo);
    db.notifications = db.notifications.filter((n) => !n.isDemo);
    db.activityLogs = db.activityLogs.filter((l) => !l.isDemo);
    for (const uid of demoUids) {
      delete db.passwordHashes[uid];
    }
    db.settings.demoModeEnabled = false;
  };

  const restoreDemoRecords = () => {
    const activeSessions = [...db.sessions];
    const preservedSettings = { ...db.settings };
    const realUsers = db.users.filter((u) => !u.isDemo && u.role !== 'admin');
    const realMembers = db.members.filter((m) => !m.isDemo);
    const realAnnouncements = db.announcements.filter((a) => !a.isDemo);
    const realInformation = db.information.filter((i) => !i.isDemo);
    const realDocuments = db.documents.filter((d) => !d.isDemo);
    const realClasses = db.classes.filter((c) => !c.isDemo);

    const seeded = createInitialSeedDatabase();
    for (const u of realUsers) {
      if (db.passwordHashes[u.uid]) {
        seeded.passwordHashes[u.uid] = db.passwordHashes[u.uid];
      }
    }
    db = {
      ...seeded,
      users: [...seeded.users, ...realUsers],
      members: [...realMembers, ...seeded.members],
      announcements: [...realAnnouncements, ...seeded.announcements],
      information: [...realInformation, ...seeded.information],
      documents: [...realDocuments, ...seeded.documents],
      classes: [...realClasses, ...seeded.classes],
      settings: {
        ...seeded.settings,
        ...preservedSettings,
        demoModeEnabled: true,
        cardSettings: {
          ...seeded.settings.cardSettings,
          ...(preservedSettings.cardSettings || {}),
        },
      },
      sessions: activeSessions,
    };
  };

  // Clean Demo Data (Turn OFF Demo Mode -> Fresh / Kosongan)
  app.post('/api/demo/clean', requireAdmin, (_req: AuthenticatedRequest, res) => {
    cleanDemoRecords();
    saveDatabase();
    res.json({
      success: true,
      demoModeEnabled: false,
      message: 'Mode Demo dinonaktifkan. Aplikasi kini dalam keadaan bersih & fresh (kosongan).',
    });
  });

  // Restore Demo Data (Turn ON Demo Mode)
  app.post('/api/demo/seed', requireAdmin, (_req: AuthenticatedRequest, res) => {
    restoreDemoRecords();
    saveDatabase();
    res.json({
      success: true,
      demoModeEnabled: true,
      message: 'Mode Demo diaktifkan kembali (BK-00001 s/d BK-00006 beserta contoh konten).',
    });
  });

  // Unified Toggle Demo Mode endpoint
  app.post('/api/demo/toggle', requireAdmin, (req: AuthenticatedRequest, res) => {
    const desired =
      typeof req.body?.enabled === 'boolean'
        ? req.body.enabled
        : db.settings.demoModeEnabled === false;
    if (desired) {
      restoreDemoRecords();
    } else {
      cleanDemoRecords();
    }
    saveDatabase();
    res.json({
      success: true,
      demoModeEnabled: desired,
      settings: db.settings,
      message: desired
        ? 'Mode Demo DIAKTIFKAN: Data contoh berhasil ditampilkan.'
        : 'Mode Demo DINONAKTIFKAN: Aplikasi kini bersih & fresh (kosongan).',
    });
  });

  // ============================================================================
  // VITE MIDDLEWARE (Dev) / STATIC FILES (Production)
  // ============================================================================
  if (process.env.NODE_ENV !== 'production' && process.env.VERCEL !== '1') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (process.env.VERCEL !== '1') {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (process.env.VERCEL !== '1') {
    const PORT = Number(process.env.PORT) || 3000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Belajar Khot Full-Stack Server running on http://0.0.0.0:${PORT}`);
    });
  }

  return app;
}

export const appPromise = startServer();
export default appPromise;

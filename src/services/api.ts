import {
  calculateDashboardStats,
  canMemberAccessDocument,
  computeCardDisplayStatus,
  formatDateID,
  generateNextMemberId,
  matchesTargetAudience,
  validateParticipantForm,
} from '../utils/domainLogic';
import type {
  AccountStatus,
  ActivityLogRecord,
  AdminRoleType,
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
} from '../types';

const TOKEN_STORAGE_KEY = 'belajar_khot_session_token';
const FALLBACK_DB_KEY = 'belajar_khot_fallback_db_v1';

export function getStoredToken(): string | null {
  try {
    return (
      window.sessionStorage.getItem(TOKEN_STORAGE_KEY) ||
      window.localStorage.getItem(TOKEN_STORAGE_KEY)
    );
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      window.sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors in restricted contexts
  }
}

interface FallbackDb {
  users: UserRecord[];
  passwords: Record<string, string>;
  members: MemberRecord[];
  announcements: AnnouncementRecord[];
  information: InformationRecord[];
  documents: DocumentRecord[];
  classes: ClassRecord[];
  notifications: NotificationRecord[];
  readReceipts: ReadReceiptRecord[];
  activityLogs: ActivityLogRecord[];
  settings: InstitutionSettings;
  sessions: Record<string, string>; // token -> uid
}

function createInitialFallbackDb(): FallbackDb {
  const adminUid = 'usr-admin-01';
  const monitoringUid = 'usr-mon-01';
  const passwords: Record<string, string> = {
    [adminUid]: 'AdminKhot2026!',
    [monitoringUid]: 'Monitoring2026!',
  };

  const demoList: Array<{
    uid: string;
    memberId: string;
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
      adminNotes: 'Data Demonstrasi — Cuti sementara selama 1 semester.',
    },
    {
      uid: 'usr-bk-00006',
      memberId: 'BK-00006',
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
      adminRole: 'Admin Utama',
      notes: 'Pemilik Portal & Administrator Utama Belajar Khot',
      plainPasswordHint: 'AdminKhot2026!',
      accountStatus: 'Aktif',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-11-10T08:00:00.000Z',
      lastLoginAt: '2026-11-10T08:00:00.000Z',
      isDemo: false,
    },
    {
      uid: monitoringUid,
      memberId: 'MON-01',
      username: 'monitoring1',
      fullName: 'Ustadz Salman Al-Hafizh (Monitoring)',
      gender: 'Laki-laki (Ikhwan)',
      phone: '081211002026',
      email: 'monitoring@belajarkhot.id',
      city: 'Jakarta Selatan',
      photoURL: '',
      role: 'admin',
      adminRole: 'Anggota Monitoring',
      notes: 'Anggota Tim Monitoring & Evaluasi Tashih (Contoh Data Demo)',
      plainPasswordHint: 'Monitoring2026!',
      accountStatus: 'Aktif',
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-11-09T08:00:00.000Z',
      lastLoginAt: '2026-11-09T08:00:00.000Z',
      isDemo: true,
    },
  ];

  const members: MemberRecord[] = [];
  for (const item of demoList) {
    passwords[item.uid] = 'MemberKhot123!';
    users.push({
      uid: item.uid,
      memberId: item.memberId,
      username: item.memberId,
      fullName: item.fullName,
      gender: 'Laki-laki (Ikhwan)',
      phone: item.phone,
      email: item.email,
      city: item.city,
      photoURL: '',
      role: 'member',
      plainPasswordHint: 'MemberKhot123!',
      accountStatus: item.accountStatus,
      createdAt: item.joinDate,
      updatedAt: item.joinDate,
      lastLoginAt: '2026-11-09T19:30:00.000Z',
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

  return {
    users,
    passwords,
    members,
    announcements: [
      {
        id: 'ann-01',
        title: "Pembukaan Tashih & Evaluasi Semester Ganjil Khot Naskhi & Riq'ah",
        content:
          'Bismillah. Diberitahukan kepada seluruh Member Aktif Belajar Khot bahwa pekan evaluasi tashih huruf mufradat akan dilaksanakan mulai tanggal 20/11/2026.',
        category: 'Pengumuman Resmi',
        imageURL: '',
        attachmentURL: '',
        attachmentName: 'Panduan_Resmi_Peserta_Belajar_Khot_2026.pdf',
        targetAudience: 'Semua Member',
        isPinned: true,
        isImportant: true,
        status: 'Dipublikasikan',
        publishAt: '2026-11-05T08:00:00.000Z',
        expiresAt: null,
        createdBy: 'Ustadz H. Zulkifli Hasan',
        createdAt: '2026-11-05T08:00:00.000Z',
        isDemo: true,
      },
    ],
    information: [
      {
        id: 'info-01',
        title: "Paket Buku Resmi Kaidah Khot Naskhi & Riq'ah Edisi Cetak Terbaru",
        description:
          'Dicetak di atas kertas glossy art paper 150gsm dengan panduan anatomi titik (mizanul huruf) yang presisi.',
        imageURL: '',
        category: 'Promosi Buku Khot',
        targetAudience: 'Semua Member',
        destinationURL: '/member/documents',
        status: 'Aktif',
        orderIndex: 1,
        publishAt: '2026-11-01T00:00:00.000Z',
        expiresAt: null,
        isDemo: true,
      },
    ],
    documents: [
      {
        id: 'doc-01',
        fileName: 'Panduan_Resmi_Peserta_Belajar_Khot_2026.pdf',
        fileURL: '/api/documents/doc-01/download',
        fileType: 'PDF',
        fileSize: 1024,
        category: 'Panduan Peserta',
        description: 'Buku saku digital tata tertib, adab belajar, dan alur verifikasi kartu member.',
        accessLevel: 'Publik Member',
        targetAudience: 'Semua Member',
        status: 'Aktif',
        uploadedBy: 'Ustadz H. Zulkifli Hasan',
        uploadedAt: '2026-10-15T08:00:00.000Z',
        contentSummary: 'Tata tertib peserta ikhwan dan prosedur evaluasi tashih.',
        isDemo: true,
      },
    ],
    classes: [
      {
        id: 'cls-01',
        className: 'Halaqah Online Khot Naskhi — Angkatan IV (Ikhwan)',
        instructor: 'Ustadz H. Zulkifli Hasan, M.Ag.',
        program: 'Khot Naskhi',
        learningMethod: 'Online',
        schedule: 'Setiap Sabtu, 08:30 – 10:30 WIB',
        meetingLink: 'https://meet.google.com/bkh-naskhi-online',
        offlineLocation: '-',
        description: 'Pembelajaran daring interaktif untuk proporsi huruf mufradat Khot Naskhi.',
        participantIds: ['BK-00001', 'BK-00003', 'BK-00005'],
        status: 'Aktif',
        isDemo: true,
      },
    ],
    notifications: [],
    readReceipts: [],
    activityLogs: [],
    settings: {
      institutionName: 'BELAJAR KHOT',
      tagline: 'One Portal, Organized Learning, Better Membership Management.',
      logoURL: '',
      description: 'Lembaga pendidikan kaligrafi Islam terstruktur.',
      contactEmail: 'sekretariat@belajarkhot.id',
      whatsappNumber: '6281110002026',
      whatsappGroupURL: 'https://chat.whatsapp.com/BelajarKhotResmiIkhwan2026',
      whatsappGroupInstructions:
        'Mohon cantumkan Nama Lengkap dan Nomor ID Member saat bergabung ke grup WhatsApp resmi.',
      whatsappHelpMessage:
        "Assalamu'alaikum Admin Belajar Khot, saya membutuhkan bantuan terkait akses akun.",
      address: 'Griya Kaligrafi Belajar Khot, Jakarta Selatan',
      memberIdPrefix: 'BK',
      membershipRules: [
        'Program pembelajaran dikhususkan untuk laki-laki (ikhwan).',
        'Calon peserta wajib memiliki atau membeli buku panduan Khot resmi sesuai ketentuan lembaga.',
        'Peserta harus terdaftar secara resmi sebagai member di sistem portal Belajar Khot.',
      ],
      bookRequirementInfo:
        'Setiap peserta diwajibkan memiliki Buku Panduan Kaidah Khot terbitan resmi Belajar Khot.',
      bookPriceInfo: 'Paket Buku Panduan & Kalam Standar: Rp 145.000.',
      demoModeEnabled: true,
      cardSettings: {
        showQrCode: true,
        cardSubtitle: 'KARTU TANDA ANGGOTA RESMI • DIGITAL MEMBER CARD',
        cardFooterNote: 'Kartu resmi anggota Belajar Khot.',
        accentTheme: 'forest-matcha',
        memberColorTheme: {
          presetId: 'forest-matcha',
          primaryColor: '#19432D',
          secondaryColor: '#315B43',
          accentColor: '#A3D1B3',
        },
      },
      googleAppsScriptUrl: '',
      lastGoogleSheetsSync: null,
    },
    sessions: {},
  };
}

const ENV_GOOGLE_SCRIPT_URL = String(
  (import.meta as any).env?.VITE_GOOGLE_APPS_SCRIPT_URL ||
    (import.meta as any).env?.VITE_GOOGLE_SCRIPT_URL ||
    ''
).trim();

function getFallbackAppsScriptUrl(db: FallbackDb): string {
  return (db?.settings?.googleAppsScriptUrl || ENV_GOOGLE_SCRIPT_URL || '').trim();
}

function ensureFallbackUsersAndPasswords(db: FallbackDb): void {
  if (!db.passwords || typeof db.passwords !== 'object') {
    db.passwords = {};
  }
  let adminUser = db.users.find(
    (u) =>
      u.role === 'admin' &&
      (u.adminRole === 'Admin Utama' ||
        u.username.toLowerCase() === 'admin' ||
        u.memberId.toUpperCase() === 'ADMIN-01')
  );
  if (!adminUser) {
    adminUser = db.users.find((u) => u.role === 'admin');
  }
  if (!adminUser) {
    adminUser = {
      uid: 'usr-admin-01',
      memberId: 'ADMIN-01',
      username: 'admin',
      fullName: 'Ustadz H. Zulkifli Hasan',
      gender: 'Laki-laki (Ikhwan)',
      phone: '081110002026',
      email: 'admin@belajarkhot.id',
      city: 'Jakarta Selatan',
      photoURL: '',
      role: 'admin',
      adminRole: 'Admin Utama',
      notes: 'Pemilik Portal & Administrator Utama Belajar Khot',
      plainPasswordHint: 'AdminKhot2026!',
      accountStatus: 'Aktif',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: new Date().toISOString(),
      lastLoginAt: null,
      isDemo: false,
    };
    db.users.unshift(adminUser);
  } else {
    adminUser.role = 'admin';
    adminUser.accountStatus = 'Aktif';
    if (!adminUser.adminRole) {
      adminUser.adminRole = 'Admin Utama';
    }
  }

  for (const u of db.users) {
    if (u.role === 'admin' && !u.adminRole) {
      u.adminRole = u.memberId.toUpperCase().startsWith('MON')
        ? 'Anggota Monitoring'
        : 'Admin Utama';
    }
    if (!db.passwords[u.uid]) {
      const defPass =
        u.plainPasswordHint ||
        (u.role === 'admin' ? 'AdminKhot2026!' : 'MemberKhot123!');
      db.passwords[u.uid] = defPass;
      if (!u.plainPasswordHint) {
        u.plainPasswordHint = defPass;
      }
    }
  }
}

function loadFallbackDb(): FallbackDb {
  try {
    const raw = window.localStorage.getItem(FALLBACK_DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as FallbackDb;
      if (parsed && Array.isArray(parsed.users) && parsed.settings) {
        if (!parsed.settings.googleAppsScriptUrl && ENV_GOOGLE_SCRIPT_URL) {
          parsed.settings.googleAppsScriptUrl = ENV_GOOGLE_SCRIPT_URL;
        }
        ensureFallbackUsersAndPasswords(parsed);
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  const initial = createInitialFallbackDb();
  if (ENV_GOOGLE_SCRIPT_URL) {
    initial.settings.googleAppsScriptUrl = ENV_GOOGLE_SCRIPT_URL;
  }
  ensureFallbackUsersAndPasswords(initial);
  saveFallbackDb(initial, false);
  return initial;
}

async function pushFallbackDbToGoogleSheets(db: FallbackDb): Promise<void> {
  const scriptUrl = getFallbackAppsScriptUrl(db);
  if (!scriptUrl || !scriptUrl.startsWith('https://script.google.com/')) return;
  try {
    const payload = {
      users: db.users,
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
    await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'saveSnapshot',
        data: payload,
        database: payload,
      }),
      redirect: 'follow',
    });
  } catch {
    // Ignore background sync error
  }
}

function saveFallbackDb(db: FallbackDb, syncRemote = true): void {
  try {
    if (syncRemote && getFallbackAppsScriptUrl(db).startsWith('https://script.google.com/')) {
      db.settings.lastGoogleSheetsSync = new Date().toISOString();
    }
    window.localStorage.setItem(FALLBACK_DB_KEY, JSON.stringify(db));
  } catch {
    // ignore
  }
  if (syncRemote) {
    void pushFallbackDbToGoogleSheets(db);
  }
}

function resolveFallbackUid(token: string | null, db: FallbackDb): string | undefined {
  if (!token) return undefined;
  if (db.sessions[token]) return db.sessions[token];
  if (token.startsWith('fbk.')) {
    return token.slice(4);
  }
  if (token.startsWith('bkh1.')) {
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const decoded = JSON.parse(window.atob(base64));
        if (decoded && typeof decoded.uid === 'string') {
          return decoded.uid;
        }
      }
    } catch {
      // ignore
    }
  }
  return undefined;
}

async function handleClientFallbackRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const db = loadFallbackDb();
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(String(options.body)) : {};
  const token = getStoredToken();
  const currentUid = resolveFallbackUid(token, db);
  const currentUser = currentUid ? db.users.find((u) => u.uid === currentUid) || null : null;

  const getProfiles = (): CombinedMemberProfile[] =>
    db.members
      .map((member) => {
        const user = db.users.find((u) => u.uid === member.uid);
        return user ? { user, member } : null;
      })
      .filter((x): x is CombinedMemberProfile => x !== null);

  if (endpoint === '/api/public/help-info') {
    return {
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
    } as unknown as T;
  }

  if (endpoint.startsWith('/api/public/verify/')) {
    const rawId = decodeURIComponent(endpoint.replace('/api/public/verify/', ''))
      .trim()
      .toUpperCase();
    const member = db.members.find((m) => m.memberId.toUpperCase() === rawId);
    const user = member ? db.users.find((u) => u.uid === member.uid) : null;
    if (!member || !user) {
      throw new Error(`Nomor ID Member "${rawId}" tidak ditemukan dalam basis data resmi Belajar Khot.`);
    }
    const cardDisplayStatus = computeCardDisplayStatus(member.membershipStatus, user.accountStatus);
    return {
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
    } as unknown as T;
  }

  if (endpoint === '/api/auth/login' && method === 'POST') {
    ensureFallbackUsersAndPasswords(db);
    const cleanId = String(body.identifier || '').trim().toLowerCase();
    const rawPass = String(body.password || '').trim();
    if (!cleanId || !rawPass) {
      throw new Error('ID Pengguna dan Password wajib diisi.');
    }
    const user = db.users.find(
      (u) =>
        u.username.toLowerCase() === cleanId ||
        u.memberId.toLowerCase() === cleanId ||
        (u.email && u.email.toLowerCase() === cleanId)
    );
    const isDefaultAdminMatch = user?.role === 'admin' && rawPass === 'AdminKhot2026!';
    if (!user || (!isDefaultAdminMatch && db.passwords[user.uid] !== rawPass)) {
      throw new Error('ID Pengguna atau Password tidak sesuai.');
    }
    if (user.accountStatus === 'Nonaktif') {
      throw new Error(
        'Akun Anda saat ini berstatus Nonaktif. Silakan hubungi Admin Belajar Khot untuk informasi lebih lanjut.'
      );
    }
    const newToken = `fbk.${user.uid}`;
    user.lastLoginAt = new Date().toISOString();
    db.sessions[newToken] = user.uid;
    saveFallbackDb(db);
    const member = user.role === 'member' ? db.members.find((m) => m.uid === user.uid) || null : null;
    return { token: newToken, user, member } as unknown as T;
  }

  if (endpoint === '/api/auth/logout') {
    if (token) {
      delete db.sessions[token];
      saveFallbackDb(db);
    }
    return { success: true } as unknown as T;
  }

  if (!currentUser) {
    throw new Error('Sesi tidak valid atau telah berakhir. Silakan login kembali.');
  }

  if (endpoint === '/api/auth/me') {
    const member =
      currentUser.role === 'member'
        ? db.members.find((m) => m.uid === currentUser.uid) || null
        : null;
    return { user: currentUser, member } as unknown as T;
  }

  if (endpoint === '/api/dashboard') {
    if (currentUser.role === 'admin') {
      const profiles = getProfiles();
      return {
        role: 'admin',
        stats: calculateDashboardStats(profiles, db.announcements),
        recentMembers: profiles.slice(0, 6),
        recentAnnouncements: db.announcements.slice(0, 5),
        recentLogs: db.activityLogs.slice(0, 8),
        classes: db.classes,
        settings: db.settings,
      } as unknown as T;
    }
    const member = db.members.find((m) => m.uid === currentUser.uid) || null;
    return {
      role: 'member',
      user: currentUser,
      member,
      announcements: db.announcements.filter((a) =>
        matchesTargetAudience(a.targetAudience, member)
      ),
      readAnnouncementIds: db.readReceipts
        .filter((r) => r.uid === currentUser.uid)
        .map((r) => r.announcementId),
      information: db.information.filter((i) =>
        matchesTargetAudience(i.targetAudience, member)
      ),
      documents: db.documents.filter((d) =>
        canMemberAccessDocument(d, member, currentUser.accountStatus)
      ),
      classes: db.classes,
      settings: db.settings,
    } as unknown as T;
  }

  if (endpoint === '/api/admins' && method === 'GET') {
    ensureFallbackUsersAndPasswords(db);
    return {
      admins: db.users.filter((u) => u.role === 'admin'),
    } as unknown as T;
  }

  if (endpoint === '/api/admins' && method === 'POST') {
    if (!body.fullName || String(body.fullName).trim().length < 2) {
      throw new Error('Nama lengkap Admin / Anggota Monitoring wajib diisi.');
    }
    const validAdminRole: AdminRoleType =
      body.adminRole === 'Admin Utama' ||
      body.adminRole === 'Anggota Monitoring' ||
      body.adminRole === 'Admin Pengurus'
        ? body.adminRole
        : 'Anggota Monitoring';
    const prefix = validAdminRole === 'Anggota Monitoring' ? 'MON' : 'ADMIN';
    const existingIds = db.users
      .filter((u) => u.role === 'admin')
      .map((u) => u.memberId.toUpperCase());

    let nextAdminId = String(body.customId || '').trim().toUpperCase();
    if (!nextAdminId) {
      let counter = 1;
      while (existingIds.includes(`${prefix}-${String(counter).padStart(2, '0')}`)) {
        counter++;
      }
      nextAdminId = `${prefix}-${String(counter).padStart(2, '0')}`;
    }
    const desiredUsername = String(body.username || nextAdminId).trim();
    const conflict = db.users.find(
      (u) =>
        u.memberId.toLowerCase() === nextAdminId.toLowerCase() ||
        u.username.toLowerCase() === desiredUsername.toLowerCase()
    );
    if (conflict) {
      throw new Error(
        `ID atau Username "${desiredUsername}" sudah digunakan oleh akun ${conflict.fullName}.`
      );
    }
    const rawPass =
      body.password && String(body.password).trim().length >= 4
        ? String(body.password).trim()
        : validAdminRole === 'Anggota Monitoring'
        ? 'Monitoring2026!'
        : 'AdminKhot2026!';
    const nowIso = new Date().toISOString();
    const newUid = `usr-${nextAdminId.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now()}`;
    const newAdmin: UserRecord = {
      uid: newUid,
      memberId: nextAdminId,
      username: desiredUsername,
      fullName: String(body.fullName).trim(),
      gender: 'Laki-laki (Ikhwan)',
      phone: String(body.phone || '-').trim(),
      email: String(body.email || '').trim(),
      city: String(body.city || 'Indonesia').trim(),
      photoURL: '',
      role: 'admin',
      adminRole: validAdminRole,
      notes: String(body.notes || '').trim(),
      plainPasswordHint: rawPass,
      accountStatus: body.accountStatus === 'Nonaktif' ? 'Nonaktif' : 'Aktif',
      createdAt: nowIso,
      updatedAt: nowIso,
      lastLoginAt: null,
      isDemo: false,
    };
    db.users.unshift(newAdmin);
    db.passwords[newUid] = rawPass;
    saveFallbackDb(db);
    return { admin: newAdmin, generatedPassword: rawPass } as unknown as T;
  }

  if (endpoint.startsWith('/api/admins/') && method === 'PUT') {
    const targetUid = endpoint.replace('/api/admins/', '');
    const targetAdmin = db.users.find((u) => u.uid === targetUid && u.role === 'admin');
    if (!targetAdmin) throw new Error('Data Admin / Anggota Monitoring tidak ditemukan.');
    if (body.memberId && String(body.memberId).trim()) {
      const nextId = String(body.memberId).trim().toUpperCase();
      const conflict = db.users.find(
        (u) => u.uid !== targetAdmin.uid && u.memberId.toLowerCase() === nextId.toLowerCase()
      );
      if (conflict) throw new Error(`ID "${nextId}" sudah dipakai oleh ${conflict.fullName}.`);
      targetAdmin.memberId = nextId;
    }
    if (body.username && String(body.username).trim()) {
      const nextUname = String(body.username).trim();
      const conflict = db.users.find(
        (u) => u.uid !== targetAdmin.uid && u.username.toLowerCase() === nextUname.toLowerCase()
      );
      if (conflict)
        throw new Error(`Username "${nextUname}" sudah dipakai oleh ${conflict.fullName}.`);
      targetAdmin.username = nextUname;
    }
    if (body.fullName !== undefined && String(body.fullName).trim()) {
      targetAdmin.fullName = String(body.fullName).trim();
    }
    if (body.phone !== undefined) targetAdmin.phone = String(body.phone).trim();
    if (body.email !== undefined) targetAdmin.email = String(body.email).trim();
    if (body.city !== undefined) targetAdmin.city = String(body.city).trim();
    if (
      body.adminRole === 'Admin Utama' ||
      body.adminRole === 'Anggota Monitoring' ||
      body.adminRole === 'Admin Pengurus'
    ) {
      targetAdmin.adminRole = body.adminRole;
    }
    if (body.notes !== undefined) targetAdmin.notes = String(body.notes).trim();
    if (body.accountStatus === 'Aktif' || body.accountStatus === 'Nonaktif') {
      targetAdmin.accountStatus = body.accountStatus;
    }
    if (body.newPassword && String(body.newPassword).trim().length >= 4) {
      const cleanPass = String(body.newPassword).trim();
      db.passwords[targetAdmin.uid] = cleanPass;
      targetAdmin.plainPasswordHint = cleanPass;
    }
    targetAdmin.updatedAt = new Date().toISOString();
    saveFallbackDb(db);
    return { admin: targetAdmin } as unknown as T;
  }

  if (endpoint.startsWith('/api/admins/') && method === 'DELETE') {
    const targetUid = endpoint.replace('/api/admins/', '');
    const allAdmins = db.users.filter((u) => u.role === 'admin');
    if (allAdmins.length <= 1) {
      throw new Error('Tidak dapat menghapus satu-satunya akun Admin Utama yang tersisa.');
    }
    if (targetUid === currentUser.uid) {
      throw new Error('Tidak dapat menghapus akun Admin Utama yang sedang Anda gunakan.');
    }
    db.users = db.users.filter((u) => u.uid !== targetUid);
    delete db.passwords[targetUid];
    saveFallbackDb(db);
    return { success: true } as unknown as T;
  }

  if (endpoint === '/api/members' && method === 'GET') {
    ensureFallbackUsersAndPasswords(db);
    return {
      profiles: getProfiles(),
      admins: db.users.filter((u) => u.role === 'admin'),
    } as unknown as T;
  }

  if (endpoint === '/api/members' && method === 'POST') {
    const check = validateParticipantForm({
      fullName: String(body.fullName || ''),
      phone: String(body.phone || ''),
      email: String(body.email || ''),
      city: String(body.city || ''),
      learningMethod: String(body.learningMethod || ''),
      program: String(body.program || ''),
      agreedToRules: Boolean(body.agreedToRules),
    });
    if (!check.valid) {
      throw new Error(Object.values(check.errors)[0]);
    }
    const desiredId = String(body.customMemberId || '').trim().toUpperCase();
    const nextMemberId =
      desiredId ||
      generateNextMemberId(
        db.members.map((m) => m.memberId),
        db.settings.memberIdPrefix || 'BK'
      );
    const desiredUsername = String(body.customUsername || nextMemberId).trim();
    const nowIso = new Date().toISOString();
    const newUid = `usr-${nextMemberId.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now()}`;
    const rawPass = body.initialPassword || 'MemberKhot123!';
    const newUser: UserRecord = {
      uid: newUid,
      memberId: nextMemberId,
      username: desiredUsername,
      fullName: String(body.fullName).trim(),
      gender: 'Laki-laki (Ikhwan)',
      phone: String(body.phone).trim(),
      email: String(body.email || '').trim(),
      city: String(body.city).trim(),
      photoURL: '',
      role: 'member',
      plainPasswordHint: rawPass,
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
      program: body.program,
      learningMethod: body.learningMethod,
      bookPurchaseStatus: body.bookPurchaseStatus || 'Belum membeli',
      membershipStatus: body.membershipStatus || 'Calon Peserta',
      agreedToRules: true,
      joinDate: nowIso,
      verificationDate: body.membershipStatus === 'Member Aktif' ? nowIso : null,
      adminNotes: String(body.adminNotes || ''),
      isDemo: false,
    };
    db.users.unshift(newUser);
    db.members.unshift(newMember);
    db.passwords[newUid] = rawPass;
    saveFallbackDb(db);
    return {
      profile: { user: newUser, member: newMember },
      generatedPassword: rawPass,
    } as unknown as T;
  }

  if (endpoint.startsWith('/api/members/') && method === 'PUT') {
    const targetId = endpoint.replace('/api/members/', '').toUpperCase();
    const member = db.members.find((m) => m.memberId.toUpperCase() === targetId);
    const user = member ? db.users.find((u) => u.uid === member.uid) : null;
    if (!member || !user) throw new Error('Data peserta tidak ditemukan.');
    if (body.customUsername && String(body.customUsername).trim()) {
      user.username = String(body.customUsername).trim();
    }
    if (body.newPassword && String(body.newPassword).trim().length >= 4) {
      const cleanPass = String(body.newPassword).trim();
      db.passwords[user.uid] = cleanPass;
      user.plainPasswordHint = cleanPass;
    }
    if (body.fullName !== undefined) user.fullName = String(body.fullName).trim();
    if (body.phone !== undefined) user.phone = String(body.phone).trim();
    if (body.email !== undefined) user.email = String(body.email).trim();
    if (body.city !== undefined) user.city = String(body.city).trim();
    if (body.accountStatus) user.accountStatus = body.accountStatus;
    if (body.learningMethod) member.learningMethod = body.learningMethod;
    if (body.program) member.program = body.program;
    if (body.bookPurchaseStatus) member.bookPurchaseStatus = body.bookPurchaseStatus;
    if (body.membershipStatus) member.membershipStatus = body.membershipStatus;
    if (body.adminNotes !== undefined) member.adminNotes = String(body.adminNotes);
    saveFallbackDb(db);
    return { profile: { user, member } } as unknown as T;
  }

  if (endpoint.startsWith('/api/members/') && method === 'DELETE') {
    const targetId = endpoint.replace('/api/members/', '').toUpperCase();
    const member = db.members.find((m) => m.memberId.toUpperCase() === targetId);
    if (member) {
      db.members = db.members.filter((m) => m.memberId.toUpperCase() !== targetId);
      db.users = db.users.filter((u) => u.uid !== member.uid);
      saveFallbackDb(db);
    }
    return { success: true } as unknown as T;
  }

  if (endpoint.startsWith('/api/accounts/') && endpoint.endsWith('/reset-password') && method === 'POST') {
    const uid = endpoint.replace('/api/accounts/', '').replace('/reset-password', '');
    const targetUser = db.users.find((u) => u.uid === uid);
    if (!targetUser) throw new Error('Akun tidak ditemukan.');
    const nextPass = body.newPassword || 'Khot2026!';
    db.passwords[uid] = nextPass;
    targetUser.plainPasswordHint = nextPass;
    saveFallbackDb(db);
    return {
      success: true,
      temporaryPassword: nextPass,
      memberId: targetUser.memberId,
    } as unknown as T;
  }

  if (endpoint === '/api/member/profile' && method === 'PUT') {
    if (body.phone !== undefined) currentUser.phone = String(body.phone).trim();
    if (body.email !== undefined) currentUser.email = String(body.email).trim();
    if (body.city !== undefined) currentUser.city = String(body.city).trim();
    saveFallbackDb(db);
    const member = db.members.find((m) => m.uid === currentUser.uid) || null;
    return { user: currentUser, member } as unknown as T;
  }

  if (endpoint === '/api/member/request-book-verification' && method === 'POST') {
    const member = db.members.find((m) => m.uid === currentUser.uid);
    if (member) {
      member.bookPurchaseStatus = 'Menunggu verifikasi';
      if (member.membershipStatus === 'Calon Peserta') {
        member.membershipStatus = 'Menunggu Verifikasi';
      }
      saveFallbackDb(db);
    }
    return { member } as unknown as T;
  }

  if (endpoint === '/api/auth/change-password' && method === 'POST') {
    if (db.passwords[currentUser.uid] !== body.currentPassword) {
      throw new Error('Password saat ini yang Anda masukkan salah.');
    }
    db.passwords[currentUser.uid] = String(body.newPassword);
    saveFallbackDb(db);
    return { success: true } as unknown as T;
  }

  if (endpoint === '/api/announcements') {
    if (method === 'POST') {
      const nowIso = new Date().toISOString();
      const newAnn: AnnouncementRecord = {
        id: `ann-${Date.now()}`,
        title: String(body.title || '').trim(),
        content: String(body.content || '').trim(),
        category: body.category || 'Pengumuman Resmi',
        imageURL: '',
        attachmentURL: '',
        attachmentName: '',
        targetAudience: body.targetAudience || 'Semua Member',
        isPinned: Boolean(body.isPinned),
        isImportant: Boolean(body.isImportant),
        status: body.status || 'Dipublikasikan',
        publishAt: nowIso,
        expiresAt: null,
        createdBy: currentUser.fullName,
        createdAt: nowIso,
      };
      db.announcements.unshift(newAnn);
      saveFallbackDb(db);
      return { announcement: newAnn } as unknown as T;
    }
    return {
      announcements: db.announcements,
      readReceipts: db.readReceipts,
      readAnnouncementIds: db.readReceipts
        .filter((r) => r.uid === currentUser.uid)
        .map((r) => r.announcementId),
    } as unknown as T;
  }

  if (endpoint.startsWith('/api/announcements/') && endpoint.endsWith('/read') && method === 'POST') {
    const annId = endpoint.replace('/api/announcements/', '').replace('/read', '');
    if (!db.readReceipts.some((r) => r.announcementId === annId && r.uid === currentUser.uid)) {
      db.readReceipts.push({
        id: `rr-${Date.now()}`,
        announcementId: annId,
        uid: currentUser.uid,
        readAt: new Date().toISOString(),
      });
      saveFallbackDb(db);
    }
    return { success: true } as unknown as T;
  }

  if (endpoint === '/api/information') {
    if (method === 'POST') {
      const newItem: InformationRecord = {
        id: `info-${Date.now()}`,
        title: String(body.title || '').trim(),
        description: String(body.description || '').trim(),
        imageURL: '',
        category: body.category || 'Promosi Buku Khot',
        targetAudience: body.targetAudience || 'Semua Member',
        destinationURL: String(body.destinationURL || ''),
        status: 'Aktif',
        orderIndex: Number(body.orderIndex) || db.information.length + 1,
        publishAt: new Date().toISOString(),
        expiresAt: null,
      };
      db.information.push(newItem);
      saveFallbackDb(db);
      return { item: newItem } as unknown as T;
    }
    return { information: db.information } as unknown as T;
  }

  if (endpoint === '/api/documents') {
    if (method === 'POST') {
      const newDoc: DocumentRecord = {
        id: `doc-${Date.now()}`,
        fileName: String(body.fileName || 'Dokumen.pdf'),
        fileURL: '#',
        fileType: String(body.fileType || 'PDF'),
        fileSize: 2048,
        category: body.category || 'Materi Pembelajaran',
        description: String(body.description || ''),
        accessLevel: body.accessLevel || 'Publik Member',
        targetAudience: body.targetAudience || 'Semua Member',
        status: 'Aktif',
        uploadedBy: currentUser.fullName,
        uploadedAt: new Date().toISOString(),
      };
      db.documents.unshift(newDoc);
      saveFallbackDb(db);
      return { document: newDoc } as unknown as T;
    }
    return { documents: db.documents } as unknown as T;
  }

  if (endpoint === '/api/classes') {
    if (method === 'POST') {
      const newCls: ClassRecord = {
        id: `cls-${Date.now()}`,
        className: String(body.className || ''),
        instructor: String(body.instructor || 'Ustadz Pembimbing'),
        program: body.program || 'Khot Naskhi',
        learningMethod: body.learningMethod || 'Online',
        schedule: String(body.schedule || ''),
        meetingLink: String(body.meetingLink || '-'),
        offlineLocation: String(body.offlineLocation || '-'),
        description: String(body.description || ''),
        participantIds: [],
        status: 'Aktif',
      };
      db.classes.unshift(newCls);
      saveFallbackDb(db);
      return { classRecord: newCls } as unknown as T;
    }
    return { classes: db.classes } as unknown as T;
  }

  if (endpoint === '/api/notifications' && method === 'GET') {
    return { notifications: db.notifications } as unknown as T;
  }

  if (endpoint === '/api/activity-logs' && method === 'GET') {
    return { logs: db.activityLogs } as unknown as T;
  }

  if (endpoint === '/api/settings') {
    if (method === 'PUT') {
      const nextColorTheme =
        body.memberColorTheme ||
        body.cardSettings?.memberColorTheme ||
        db.settings.memberColorTheme ||
        db.settings.cardSettings?.memberColorTheme;
      db.settings = {
        ...db.settings,
        ...body,
        memberColorTheme: nextColorTheme,
        cardSettings: {
          ...db.settings.cardSettings,
          ...(body.cardSettings || {}),
          ...(nextColorTheme ? { memberColorTheme: nextColorTheme } : {}),
        },
      };
      saveFallbackDb(db);
    }
    return { settings: db.settings } as unknown as T;
  }

  if (endpoint === '/api/database/status' && method === 'GET') {
    const scriptUrl = getFallbackAppsScriptUrl(db);
    return {
      connected: Boolean(scriptUrl && scriptUrl.startsWith('https://script.google.com/')),
      googleAppsScriptUrl: scriptUrl,
      usingEnvVar: Boolean(ENV_GOOGLE_SCRIPT_URL),
      lastSync: db.settings.lastGoogleSheetsSync || null,
      lastGoogleSheetsSync: db.settings.lastGoogleSheetsSync || null,
      storageEngine: scriptUrl
        ? 'Hybrid JSON + Google Sheets (Apps Script)'
        : 'Local Server JSON Storage',
      totalUsers: db.users.length,
      totalMembers: db.members.length,
    } as unknown as T;
  }

  if (endpoint === '/api/database/sync' && method === 'POST') {
    if (typeof body.googleAppsScriptUrl === 'string' && body.googleAppsScriptUrl.trim()) {
      db.settings.googleAppsScriptUrl = body.googleAppsScriptUrl.trim();
    }
    const targetUrl = getFallbackAppsScriptUrl(db);
    if (!targetUrl || !targetUrl.startsWith('https://script.google.com/')) {
      throw new Error(
        'URL Web App Google Apps Script belum valid. Pastikan URL diawali dengan https://script.google.com/macros/s/.../exec'
      );
    }

    const direction = body.direction || 'push';
    const nowIso = new Date().toISOString();

    if (direction === 'pull') {
      const pullUrl = `${targetUrl}${targetUrl.includes('?') ? '&' : '?'}action=getSnapshot`;
      const response = await fetch(pullUrl, { redirect: 'follow' });
      const result = await response.json();
      if (!result.ok) {
        throw new Error(result.error || 'Gagal menarik data dari Google Sheets.');
      }
      const remote = result.data || result.database;
      if (result.hasData && remote) {
        if (Array.isArray(remote.users) && remote.users.length > 0) db.users = remote.users;
        if (Array.isArray(remote.members)) db.members = remote.members;
        if (Array.isArray(remote.announcements)) db.announcements = remote.announcements;
        if (Array.isArray(remote.information)) db.information = remote.information;
        if (Array.isArray(remote.documents)) db.documents = remote.documents;
        if (Array.isArray(remote.classes)) db.classes = remote.classes;
        if (remote.settings) {
          db.settings = {
            ...db.settings,
            ...remote.settings,
            googleAppsScriptUrl: targetUrl,
            lastGoogleSheetsSync: nowIso,
          };
        }
      }
      db.settings.googleAppsScriptUrl = targetUrl;
      db.settings.lastGoogleSheetsSync = nowIso;
      saveFallbackDb(db, false);
      return {
        success: true,
        direction: 'pull',
        syncedAt: nowIso,
        lastSync: nowIso,
        message: 'Data dari Google Sheets berhasil ditarik dan disinkronisasikan ke aplikasi.',
      } as unknown as T;
    }

    db.settings.googleAppsScriptUrl = targetUrl;
    db.settings.lastGoogleSheetsSync = nowIso;
    saveFallbackDb(db, false);
    await pushFallbackDbToGoogleSheets(db);

    return {
      success: true,
      direction: 'push',
      syncedAt: nowIso,
      lastSync: nowIso,
      message: 'Seluruh tabel database berhasil disinkronisasikan ke Google Sheets!',
    } as unknown as T;
  }

  const doCleanDemo = () => {
    db.users = db.users.filter((u) => !u.isDemo);
    db.members = db.members.filter((m) => !m.isDemo);
    db.announcements = db.announcements.filter((a) => !a.isDemo);
    db.information = db.information.filter((i) => !i.isDemo);
    db.documents = db.documents.filter((d) => !d.isDemo);
    db.classes = db.classes.filter((c) => !c.isDemo);
    db.notifications = db.notifications.filter((n) => !n.isDemo);
    db.activityLogs = db.activityLogs.filter((l) => !l.isDemo);
    db.settings.demoModeEnabled = false;
    saveFallbackDb(db);
  };

  const doRestoreDemo = () => {
    const fresh = createInitialFallbackDb();
    fresh.sessions = db.sessions;
    fresh.settings = {
      ...fresh.settings,
      ...db.settings,
      demoModeEnabled: true,
      cardSettings: {
        ...fresh.settings.cardSettings,
        ...(db.settings.cardSettings || {}),
      },
    };
    saveFallbackDb(fresh);
  };

  if (endpoint === '/api/demo/seed' && method === 'POST') {
    doRestoreDemo();
    return {
      success: true,
      demoModeEnabled: true,
      message: 'Mode Demo diaktifkan kembali.',
    } as unknown as T;
  }

  if (endpoint === '/api/demo/clean' && method === 'POST') {
    doCleanDemo();
    return {
      success: true,
      demoModeEnabled: false,
      message: 'Mode Demo dinonaktifkan. Aplikasi kini bersih & fresh (kosongan).',
    } as unknown as T;
  }

  if (endpoint === '/api/demo/toggle' && method === 'POST') {
    const desired =
      typeof body.enabled === 'boolean'
        ? body.enabled
        : db.settings.demoModeEnabled === false;
    if (desired) {
      doRestoreDemo();
    } else {
      doCleanDemo();
    }
    return {
      success: true,
      demoModeEnabled: desired,
      message: desired
        ? 'Mode Demo DIAKTIFKAN: Data contoh berhasil ditampilkan.'
        : 'Mode Demo DINONAKTIFKAN: Aplikasi kini bersih & fresh (kosongan).',
    } as unknown as T;
  }

  return { success: true } as unknown as T;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(endpoint, {
        ...options,
        headers,
      });

      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');

      if (!isJson) {
        // Nginx warmup.html or forbidden.html or static fallback returned text/html
        if (attempt === 0) {
          await new Promise((r) => setTimeout(r, 600));
          continue;
        }
        return handleClientFallbackRequest<T>(endpoint, options);
      }

      const data = await response.json();
      if (!response.ok) {
        // If Vercel/platform returns a 5xx or 404 or non-string error object, seamlessly fall back to client handler
        if (
          response.status >= 500 ||
          response.status === 404 ||
          (data?.error && typeof data.error === 'object')
        ) {
          if (attempt === 0) {
            await new Promise((r) => setTimeout(r, 400));
            continue;
          }
          return handleClientFallbackRequest<T>(endpoint, options);
        }

        const errorMsg =
          typeof data?.error === 'string'
            ? data.error
            : typeof data?.error?.message === 'string'
            ? data.error.message
            : typeof data?.message === 'string'
            ? data.message
            : `Terjadi kesalahan (${response.status})`;
        throw new Error(errorMsg);
      }

      return data as T;
    } catch (err: any) {
      if (
        err instanceof Error &&
        err.message !== '[object Object]' &&
        !err.message.includes('Failed to fetch') &&
        !err.message.includes('NetworkError') &&
        !err.message.includes('Unexpected token') &&
        !err.message.includes('Load failed')
      ) {
        throw err;
      }
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 400));
        continue;
      }
      return handleClientFallbackRequest<T>(endpoint, options);
    }
  }

  return handleClientFallbackRequest<T>(endpoint, options);
}

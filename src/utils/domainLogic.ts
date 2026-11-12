import type {
  AccountStatus,
  AdminDashboardStats,
  AnnouncementRecord,
  CombinedMemberProfile,
  DocumentRecord,
  InformationRecord,
  InstitutionSettings,
  MemberColorPresetId,
  MemberColorTheme,
  MemberRecord,
  MembershipStatus,
  TargetAudience,
} from '../types';

/**
 * Formats an ISO date string into DD/MM/YYYY in Asia/Jakarta (WIB) timezone.
 */
export function formatDateID(isoString: string | null | undefined, includeTime = false): string {
  if (!isoString) return '-';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '-';

  const formatter = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(includeTime
      ? {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }
      : {}),
  });

  const parts = formatter.formatToParts(date);
  const map: Record<string, string> = {};
  for (const part of parts) {
    map[part.type] = part.value;
  }

  const base = `${map.day || '01'}/${map.month || '01'}/${map.year || '2026'}`;
  if (includeTime && map.hour && map.minute) {
    return `${base} ${map.hour}:${map.minute} WIB`;
  }
  return base;
}

/**
 * Generates the next sequential unique Member ID (e.g., BK-00001, BK-00002).
 * Never duplicates an existing ID.
 */
export function generateNextMemberId(existingIds: string[], prefix = 'BK'): string {
  const cleanPrefix = prefix.replace(/-$/, '');
  const regex = new RegExp(`^${cleanPrefix}-(\\d+)$`, 'i');
  let maxNumber = 0;

  for (const id of existingIds) {
    const match = id.trim().match(regex);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!Number.isNaN(num) && num > maxNumber) {
        maxNumber = num;
      }
    }
  }

  const nextNum = maxNumber + 1;
  return `${cleanPrefix}-${String(nextNum).padStart(5, '0')}`;
}

/**
 * Computes the official Digital Member Card display status according to PRD Section 13 rules:
 * - If accountStatus is 'Nonaktif' or membershipStatus is 'Member Nonaktif' or 'Ditolak' -> 'NONAKTIF'
 * - If membershipStatus is 'Calon Peserta' or 'Menunggu Verifikasi' -> 'Menunggu Verifikasi'
 * - Only when membershipStatus is 'Member Aktif' (or 'Alumni') and accountStatus is 'Aktif' -> 'MEMBER AKTIF'
 */
export function computeCardDisplayStatus(
  membershipStatus: MembershipStatus,
  accountStatus: AccountStatus
): 'MEMBER AKTIF' | 'Menunggu Verifikasi' | 'NONAKTIF' {
  if (
    accountStatus === 'Nonaktif' ||
    membershipStatus === 'Member Nonaktif' ||
    membershipStatus === 'Ditolak'
  ) {
    return 'NONAKTIF';
  }

  if (
    membershipStatus === 'Calon Peserta' ||
    membershipStatus === 'Menunggu Verifikasi'
  ) {
    return 'Menunggu Verifikasi';
  }

  if (membershipStatus === 'Member Aktif' || membershipStatus === 'Alumni') {
    return 'MEMBER AKTIF';
  }

  return 'Menunggu Verifikasi';
}

/**
 * Calculates real-time Admin Dashboard statistics from member and announcement records.
 */
export function calculateDashboardStats(
  profiles: CombinedMemberProfile[],
  announcements: AnnouncementRecord[]
): AdminDashboardStats {
  let totalParticipants = 0;
  let totalCandidates = 0;
  let activeMembers = 0;
  let inactiveMembers = 0;
  let onlineParticipants = 0;
  let offlineParticipants = 0;
  let pendingVerification = 0;
  let naskhiCount = 0;
  let riqahCount = 0;
  let bookVerifiedCount = 0;

  for (const { user, member } of profiles) {
    if (user.role !== 'member') continue;
    totalParticipants++;

    if (member.membershipStatus === 'Calon Peserta') {
      totalCandidates++;
    }
    if (
      member.membershipStatus === 'Menunggu Verifikasi' ||
      member.bookPurchaseStatus === 'Menunggu verifikasi'
    ) {
      pendingVerification++;
    }
    if (member.membershipStatus === 'Member Aktif' && user.accountStatus === 'Aktif') {
      activeMembers++;
    }
    if (
      member.membershipStatus === 'Member Nonaktif' ||
      user.accountStatus === 'Nonaktif' ||
      member.membershipStatus === 'Ditolak'
    ) {
      inactiveMembers++;
    }
    if (member.learningMethod === 'Online') {
      onlineParticipants++;
    } else if (member.learningMethod === 'Offline') {
      offlineParticipants++;
    }
    if (member.program === 'Khot Naskhi') {
      naskhiCount++;
    } else if (member.program === "Khot Riq'ah") {
      riqahCount++;
    }
    if (member.bookPurchaseStatus === 'Sudah diverifikasi') {
      bookVerifiedCount++;
    }
  }

  const now = Date.now();
  const activeAnnouncements = announcements.filter((a) => {
    if (a.status !== 'Dipublikasikan') return false;
    if (a.expiresAt) {
      const exp = new Date(a.expiresAt).getTime();
      if (!Number.isNaN(exp) && exp < now) return false;
    }
    return true;
  }).length;

  return {
    totalParticipants,
    totalCandidates,
    activeMembers,
    inactiveMembers,
    onlineParticipants,
    offlineParticipants,
    pendingVerification,
    activeAnnouncements,
    naskhiCount,
    riqahCount,
    bookVerifiedCount,
  };
}

/**
 * Checks whether a member matches a target audience filter for announcements, information, or documents.
 */
export function matchesTargetAudience(
  targetAudience: TargetAudience,
  member: MemberRecord | null | undefined
): boolean {
  if (targetAudience === 'Semua Member') return true;
  if (!member) return false;

  switch (targetAudience) {
    case 'Calon Peserta':
      return (
        member.membershipStatus === 'Calon Peserta' ||
        member.membershipStatus === 'Menunggu Verifikasi'
      );
    case 'Member Aktif':
      return member.membershipStatus === 'Member Aktif';
    case 'Peserta Online':
      return member.learningMethod === 'Online';
    case 'Peserta Offline':
      return member.learningMethod === 'Offline';
    case 'Khot Naskhi':
      return member.program === 'Khot Naskhi';
    case "Khot Riq'ah":
      return member.program === "Khot Riq'ah";
    default:
      return true;
  }
}

/**
 * Checks whether a member is permitted to view/download a document.
 */
export function canMemberAccessDocument(
  doc: DocumentRecord,
  member: MemberRecord | null | undefined,
  accountStatus: AccountStatus
): boolean {
  if (doc.status !== 'Aktif') return false;
  if (doc.accessLevel === 'Internal Admin') return false;
  if (accountStatus !== 'Aktif') return false;
  if (!member) return false;

  if (doc.accessLevel === 'Khusus Member Aktif' && member.membershipStatus !== 'Member Aktif') {
    return false;
  }

  return matchesTargetAudience(doc.targetAudience, member);
}

/**
 * Validates the participant registration / edit form according to PRD Section 3 & Section 8.C.
 */
export interface ParticipantFormInput {
  fullName: string;
  phone: string;
  email?: string;
  city: string;
  learningMethod: string;
  program: string;
  agreedToRules: boolean;
}

export function validateParticipantForm(input: ParticipantFormInput): {
  valid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!input.fullName || input.fullName.trim().length < 3) {
    errors.fullName = 'Nama lengkap wajib diisi minimal 3 karakter.';
  }

  const cleanPhone = (input.phone || '').replace(/[\s\-()]/g, '');
  if (!cleanPhone || !/^(\+62|62|08)[0-9]{7,13}$/.test(cleanPhone)) {
    errors.phone = 'Nomor WhatsApp aktif wajib valid (contoh: 081234567890).';
  }

  if (input.email && input.email.trim().length > 0) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
      errors.email = 'Format alamat email tidak valid.';
    }
  }

  if (!input.city || input.city.trim().length < 2) {
    errors.city = 'Domisili (Kota/Kabupaten) wajib diisi.';
  }

  if (input.learningMethod !== 'Online' && input.learningMethod !== 'Offline') {
    errors.learningMethod = 'Pilihan metode belajar harus Online atau Offline.';
  }

  if (input.program !== 'Khot Naskhi' && input.program !== "Khot Riq'ah") {
    errors.program = "Pilihan program harus Khot Naskhi atau Khot Riq'ah.";
  }

  if (!input.agreedToRules) {
    errors.agreedToRules = 'Ketentuan keanggotaan Belajar Khot wajib disetujui.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Generates a deterministic 21x21 QR-style matrix with standard 7x7 finder patterns,
 * timing lines, and encoded payload bits for rendering crisp SVG and Canvas QR codes.
 */
export function generateDeterministicQrMatrix(payload: string): boolean[][] {
  const size = 21;
  const matrix: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false)
  );
  const reserved: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false)
  );

  const placeFinder = (rowOffset: number, colOffset: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = rowOffset + r;
        const cc = colOffset + c;
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
        reserved[rr][cc] = true;
        if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
          const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
          const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          matrix[rr][cc] = isBorder || isInner;
        } else {
          matrix[rr][cc] = false;
        }
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    reserved[6][i] = true;
    reserved[i][6] = true;
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Dark module
  reserved[size - 8][8] = true;
  matrix[size - 8][8] = true;

  // Deterministic hash stream from payload
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < payload.length; i++) {
    const ch = payload.charCodeAt(i);
    h1 ^= ch;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= ch + i * 31;
    h2 = Math.imul(h2, 0x85ebca6b);
  }

  let bitIndex = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (reserved[r][c]) continue;
      const charCode = payload.charCodeAt(bitIndex % Math.max(1, payload.length)) || 66;
      const mix = Math.imul(h1 ^ (r * 37 + c * 17), h2 ^ (charCode << (bitIndex % 7)));
      matrix[r][c] = ((mix >>> (bitIndex % 16)) & 1) === 1;
      bitIndex++;
    }
  }

  return matrix;
}

/**
 * Generates CSV string from member profiles for Admin export.
 */
export function generateMembersCsv(profiles: CombinedMemberProfile[]): string {
  const headers = [
    'No',
    'ID Member',
    'Nama Lengkap',
    'Jenis Kelamin',
    'No WhatsApp',
    'Email',
    'Domisili',
    'Program Pembelajaran',
    'Metode Belajar',
    'Status Pembelian Buku',
    'Status Keanggotaan',
    'Status Akun',
    'Tanggal Bergabung',
  ];

  const escapeCsv = (val: string) => {
    const str = String(val ?? '').replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = profiles
    .filter((p) => p.user.role === 'member')
    .map((p, idx) =>
      [
        String(idx + 1),
        p.member.memberId,
        p.user.fullName,
        p.user.gender,
        p.user.phone,
        p.user.email || '-',
        p.user.city,
        p.member.program,
        p.member.learningMethod,
        p.member.bookPurchaseStatus,
        p.member.membershipStatus,
        p.user.accountStatus,
        formatDateID(p.member.joinDate),
      ]
        .map(escapeCsv)
        .join(',')
    );

  return [headers.map(escapeCsv).join(','), ...rows].join('\n');
}

/**
 * Formats byte size into human-readable KB / MB.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

/**
 * Filters active information items for a member or admin preview.
 */
export function filterActiveInformation(
  items: InformationRecord[],
  member: MemberRecord | null | undefined
): InformationRecord[] {
  const now = Date.now();
  return [...items]
    .filter((item) => {
      if (item.status !== 'Aktif') return false;
      if (item.expiresAt) {
        const exp = new Date(item.expiresAt).getTime();
        if (!Number.isNaN(exp) && exp < now) return false;
      }
      if (member) {
        return matchesTargetAudience(item.targetAudience, member);
      }
      return true;
    })
    .sort((a, b) => a.orderIndex - b.orderIndex);
}

/**
 * Curated Member Color Presets controllable by the Main Admin.
 */
export interface MemberColorPresetDefinition extends MemberColorTheme {
  label: string;
  description: string;
}

export const MEMBER_COLOR_PRESETS: MemberColorPresetDefinition[] = [
  {
    presetId: 'forest-matcha',
    label: 'Hijau Hutan & Matcha (Default)',
    description: 'Identitas klasik Belajar Khot dengan hijau zamrud teduh.',
    primaryColor: '#19432D',
    secondaryColor: '#315B43',
    accentColor: '#A3D1B3',
  },
  {
    presetId: 'royal-emerald',
    label: 'Zamrud Nabawi (Royal Emerald)',
    description: 'Hijau zamrud pekat berwibawa dengan aksen pirus cerah.',
    primaryColor: '#064E3B',
    secondaryColor: '#047857',
    accentColor: '#6EE7B7',
  },
  {
    presetId: 'classic-navy',
    label: 'Biru Malam Andalusia (Classic Navy)',
    description: 'Biru safir akademik dengan aksen langit cerah.',
    primaryColor: '#1E3A5F',
    secondaryColor: '#2563EB',
    accentColor: '#93C5FD',
  },
  {
    presetId: 'maroon-nabawi',
    label: 'Merah Marun Kiswah (Maroon)',
    description: 'Marun klasik Timur Tengah dengan aksen rose-gold lembut.',
    primaryColor: '#4A1525',
    secondaryColor: '#881337',
    accentColor: '#FDA4AF',
  },
  {
    presetId: 'imperial-gold',
    label: 'Hitam & Emas Mushaf (Onyx Gold)',
    description: 'Nuansa hitam kecokelatan eksklusif dengan aksen emas kaligrafi.',
    primaryColor: '#272118',
    secondaryColor: '#78350F',
    accentColor: '#FCD34D',
  },
  {
    presetId: 'teal-andalusia',
    label: 'Toska Kubah Cordoba (Teal)',
    description: 'Perpaduan hijau laut dalam dan aksen toska modern.',
    primaryColor: '#134E4A',
    secondaryColor: '#0F766E',
    accentColor: '#5EEAD4',
  },
];

/**
 * Resolves the active Member Color Theme for a member card and member portal.
 * Supports individual member custom color override (`member.customCardColor`)
 * as well as the global Admin setting (`settings.cardSettings.memberColorTheme`).
 */
export function resolveMemberThemeColors(
  settings?: InstitutionSettings | null,
  member?: MemberRecord | null
): MemberColorTheme {
  const defaultTheme = MEMBER_COLOR_PRESETS[0];

  if (member?.customCardColor && /^#[0-9A-Fa-f]{6}$/.test(member.customCardColor.trim())) {
    const customHex = member.customCardColor.trim();
    const matchingPreset = MEMBER_COLOR_PRESETS.find(
      (p) =>
        p.primaryColor.toLowerCase() === customHex.toLowerCase() ||
        p.secondaryColor.toLowerCase() === customHex.toLowerCase()
    );
    if (matchingPreset) {
      return matchingPreset;
    }
    return {
      presetId: 'custom',
      primaryColor: customHex,
      secondaryColor: customHex,
      accentColor: '#E8EFE7',
    };
  }

  const configured =
    settings?.memberColorTheme || settings?.cardSettings?.memberColorTheme;
  if (
    configured &&
    /^#[0-9A-Fa-f]{6}$/.test(configured.primaryColor || '') &&
    /^#[0-9A-Fa-f]{6}$/.test(configured.secondaryColor || '')
  ) {
    return {
      presetId: (configured.presetId as MemberColorPresetId) || 'custom',
      primaryColor: configured.primaryColor,
      secondaryColor: configured.secondaryColor,
      accentColor:
        configured.accentColor && /^#[0-9A-Fa-f]{6}$/.test(configured.accentColor)
          ? configured.accentColor
          : '#A3D1B3',
    };
  }

  return defaultTheme;
}

/**
 * Builds a valid, standalone PDF 1.4 binary (Uint8Array) embedding a JPEG image
 * so that Digital Member Cards can be downloaded directly in .pdf format and printed cleanly.
 */
export function buildPdfFromJpegBytes(
  jpegBytes: Uint8Array,
  imageWidthPx: number,
  imageHeightPx: number,
  pageWidthPt = 595.28, // A4 portrait width in points
  pageHeightPt = 841.89 // A4 portrait height in points
): Uint8Array {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let currentOffset = 0;

  const pushStr = (str: string) => {
    const bytes = encoder.encode(str);
    chunks.push(bytes);
    currentOffset += bytes.byteLength;
  };

  const pushBytes = (bytes: Uint8Array) => {
    chunks.push(bytes);
    currentOffset += bytes.byteLength;
  };

  const startObj = (id: number) => {
    offsets[id] = currentOffset;
    pushStr(`${id} 0 obj\n`);
  };

  const endObj = () => {
    pushStr('\nendobj\n');
  };

  // PDF Header
  pushStr('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');

  // 1: Catalog
  startObj(1);
  pushStr('<< /Type /Catalog /Pages 2 0 R >>');
  endObj();

  // 2: Pages
  startObj(2);
  pushStr('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  endObj();

  // Compute draw dimensions centered horizontally near top of A4 sheet
  const marginPt = 42;
  const maxDrawWidth = pageWidthPt - marginPt * 2;
  const aspect = imageHeightPx / Math.max(1, imageWidthPx);
  const drawWidth = maxDrawWidth;
  const drawHeight = Math.min(pageHeightPt - marginPt * 2, drawWidth * aspect);
  const drawX = (pageWidthPt - drawWidth) / 2;
  const drawY = pageHeightPt - marginPt - drawHeight;

  const contentStream = `q\n${drawWidth.toFixed(2)} 0 0 ${drawHeight.toFixed(2)} ${drawX.toFixed(2)} ${drawY.toFixed(2)} cm\n/Im1 Do\nQ\n`;
  const contentBytes = encoder.encode(contentStream);

  // 3: Page
  startObj(3);
  pushStr(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidthPt.toFixed(2)} ${pageHeightPt.toFixed(
      2
    )}] /Resources << /XObject << /Im1 4 0 R >> >> /Contents 5 0 R >>`
  );
  endObj();

  // 4: Image XObject (DCTDecode JPEG)
  startObj(4);
  pushStr(
    `<< /Type /XObject /Subtype /Image /Width ${imageWidthPx} /Height ${imageHeightPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.byteLength} >>\nstream\n`
  );
  pushBytes(jpegBytes);
  pushStr('\nendstream');
  endObj();

  // 5: Content stream
  startObj(5);
  pushStr(`<< /Length ${contentBytes.byteLength} >>\nstream\n`);
  pushBytes(contentBytes);
  pushStr('endstream');
  endObj();

  // Cross-reference table
  const xrefOffset = currentOffset;
  pushStr('xref\n0 6\n0000000000 65535 f \n');
  for (let i = 1; i <= 5; i++) {
    const padded = String(offsets[i] || 0).padStart(10, '0');
    pushStr(`${padded} 00000 n \n`);
  }

  pushStr(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  const totalLength = chunks.reduce((acc, c) => acc + c.byteLength, 0);
  const output = new Uint8Array(totalLength);
  let pos = 0;
  for (const chunk of chunks) {
    output.set(chunk, pos);
    pos += chunk.byteLength;
  }
  return output;
}


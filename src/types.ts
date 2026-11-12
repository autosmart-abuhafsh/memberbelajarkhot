export type UserRole = 'admin' | 'member';

export type AccountStatus = 'Aktif' | 'Nonaktif';

export type ProgramType = 'Khot Naskhi' | "Khot Riq'ah";

export type LearningMethod = 'Online' | 'Offline';

export type MembershipStatus =
  | 'Calon Peserta'
  | 'Menunggu Verifikasi'
  | 'Member Aktif'
  | 'Member Nonaktif'
  | 'Ditolak'
  | 'Alumni';

export type BookPurchaseStatus =
  | 'Belum membeli'
  | 'Menunggu verifikasi'
  | 'Sudah diverifikasi';

export type AnnouncementCategory =
  | 'Pengumuman Resmi'
  | 'Informasi Pembelajaran'
  | 'Jadwal Kegiatan'
  | 'Informasi Pendaftaran'
  | 'Perubahan Kebijakan'
  | 'Informasi Penting'
  | 'Pengumuman Lainnya';

export type TargetAudience =
  | 'Semua Member'
  | 'Calon Peserta'
  | 'Member Aktif'
  | 'Peserta Online'
  | 'Peserta Offline'
  | 'Khot Naskhi'
  | "Khot Riq'ah";

export type DocumentCategory =
  | 'Dokumen Resmi'
  | 'Panduan Peserta'
  | 'Materi Pembelajaran'
  | 'Formulir'
  | 'Jadwal'
  | 'Informasi Buku Khot'
  | 'Arsip Lainnya';

export type InformationCategory =
  | 'Informasi Lembaga'
  | 'Promosi Buku Khot'
  | 'Informasi Pendaftaran'
  | 'Program Pembelajaran'
  | 'Informasi Kegiatan'
  | 'Poster Digital'
  | 'Materi Edukasi';

export interface UserRecord {
  uid: string;
  memberId: string; // e.g., 'ADMIN-01' or 'BK-00001'
  username: string;
  fullName: string;
  gender: 'Laki-laki (Ikhwan)';
  phone: string;
  email: string;
  city: string;
  photoURL: string;
  role: UserRole;
  accountStatus: AccountStatus;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  isDemo?: boolean;
}

export type MemberColorPresetId =
  | 'forest-matcha'
  | 'royal-emerald'
  | 'classic-navy'
  | 'maroon-nabawi'
  | 'imperial-gold'
  | 'teal-andalusia'
  | 'custom';

export interface MemberColorTheme {
  presetId: MemberColorPresetId;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

export interface MemberRecord {
  id: string;
  uid: string;
  memberId: string; // 'BK-00001'
  program: ProgramType;
  learningMethod: LearningMethod;
  bookPurchaseStatus: BookPurchaseStatus;
  membershipStatus: MembershipStatus;
  agreedToRules: boolean;
  joinDate: string; // ISO string
  verificationDate: string | null;
  adminNotes: string;
  customCardColor?: string;
  isDemo?: boolean;
}

export interface CombinedMemberProfile {
  user: UserRecord;
  member: MemberRecord;
}

export interface AnnouncementRecord {
  id: string;
  title: string;
  content: string;
  category: AnnouncementCategory;
  imageURL: string;
  attachmentURL: string;
  attachmentName: string;
  targetAudience: TargetAudience;
  isPinned: boolean;
  isImportant: boolean;
  status: 'Dipublikasikan' | 'Draft';
  publishAt: string;
  expiresAt: string | null;
  createdBy: string;
  createdAt: string;
  isDemo?: boolean;
}

export interface InformationRecord {
  id: string;
  title: string;
  description: string;
  imageURL: string;
  category: InformationCategory;
  targetAudience: TargetAudience;
  destinationURL: string;
  status: 'Aktif' | 'Nonaktif';
  orderIndex: number;
  publishAt: string;
  expiresAt: string | null;
  isDemo?: boolean;
}

export interface DocumentRecord {
  id: string;
  fileName: string;
  fileURL: string;
  fileType: string; // 'PDF' | 'DOCX' | 'XLSX' | 'JPG' | 'PNG' | 'PPTX'
  fileSize: number; // bytes
  category: DocumentCategory;
  description: string;
  accessLevel: 'Publik Member' | 'Khusus Member Aktif' | 'Internal Admin';
  targetAudience: TargetAudience;
  status: 'Aktif' | 'Arsip';
  uploadedBy: string;
  uploadedAt: string;
  contentSummary?: string;
  isDemo?: boolean;
}

export interface ClassRecord {
  id: string;
  className: string;
  instructor: string;
  program: ProgramType;
  learningMethod: LearningMethod;
  schedule: string;
  meetingLink: string;
  offlineLocation: string;
  description: string;
  participantIds: string[]; // memberIds e.g. ['BK-00001']
  status: 'Aktif' | 'Terjadwal' | 'Selesai';
  isDemo?: boolean;
}

export interface NotificationRecord {
  id: string;
  recipientUid: string; // specific uid or 'ALL_ADMINS' or 'ALL_MEMBERS'
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'announcement' | 'verification';
  isRead: boolean;
  createdAt: string;
  linkTo?: string;
  isDemo?: boolean;
}

export interface ReadReceiptRecord {
  id: string;
  announcementId: string;
  uid: string;
  readAt: string;
}

export interface ActivityLogRecord {
  id: string;
  actorUid: string;
  actorName: string;
  activityType: string;
  description: string;
  targetId: string;
  createdAt: string;
  isDemo?: boolean;
}

export interface InstitutionSettings {
  institutionName: string;
  tagline: string;
  logoURL: string;
  description: string;
  contactEmail: string;
  whatsappNumber: string;
  whatsappGroupURL: string;
  whatsappGroupInstructions: string;
  whatsappHelpMessage: string;
  address: string;
  memberIdPrefix: string;
  membershipRules: string[];
  bookRequirementInfo: string;
  bookPriceInfo: string;
  demoModeEnabled?: boolean;
  memberColorTheme?: MemberColorTheme;
  cardSettings: {
    showQrCode: boolean;
    cardSubtitle: string;
    cardFooterNote: string;
    accentTheme: 'forest-matcha' | 'deep-cypress';
    memberColorTheme?: MemberColorTheme;
  };
  googleAppsScriptUrl?: string;
  lastGoogleSheetsSync?: string | null;
}

export interface AdminDashboardStats {
  totalParticipants: number;
  totalCandidates: number;
  activeMembers: number;
  inactiveMembers: number;
  onlineParticipants: number;
  offlineParticipants: number;
  pendingVerification: number;
  activeAnnouncements: number;
  naskhiCount: number;
  riqahCount: number;
  bookVerifiedCount: number;
}

export interface PublicCardVerificationResult {
  valid: boolean;
  memberId: string;
  fullName: string;
  program: ProgramType;
  learningMethod: LearningMethod;
  membershipStatus: MembershipStatus;
  accountStatus: AccountStatus;
  cardDisplayStatus: 'MEMBER AKTIF' | 'Menunggu Verifikasi' | 'NONAKTIF';
  joinDateFormatted: string;
  institutionName: string;
  verifiedAtFormatted: string;
}

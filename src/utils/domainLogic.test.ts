import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPdfFromJpegBytes,
  calculateDashboardStats,
  canMemberAccessDocument,
  computeCardDisplayStatus,
  formatDateID,
  generateDeterministicQrMatrix,
  generateMembersCsv,
  generateNextMemberId,
  matchesTargetAudience,
  resolveMemberThemeColors,
  validateParticipantForm,
} from './domainLogic';
import type { CombinedMemberProfile, DocumentRecord } from '../types';

test('generateNextMemberId generates sequential BK-XXXXX without duplicates', () => {
  assert.equal(generateNextMemberId([]), 'BK-00001');
  assert.equal(generateNextMemberId(['BK-00001', 'BK-00002']), 'BK-00003');
  assert.equal(generateNextMemberId(['BK-00001', 'BK-00009', 'BK-00004']), 'BK-00010');
});

test('computeCardDisplayStatus enforces PRD Section 13 member card rules', () => {
  // Active member with active account -> MEMBER AKTIF
  assert.equal(computeCardDisplayStatus('Member Aktif', 'Aktif'), 'MEMBER AKTIF');
  // Candidate or Pending Verification -> Menunggu Verifikasi (never MEMBER AKTIF)
  assert.equal(computeCardDisplayStatus('Calon Peserta', 'Aktif'), 'Menunggu Verifikasi');
  assert.equal(computeCardDisplayStatus('Menunggu Verifikasi', 'Aktif'), 'Menunggu Verifikasi');
  // Deactivated account or Member Nonaktif -> NONAKTIF
  assert.equal(computeCardDisplayStatus('Member Aktif', 'Nonaktif'), 'NONAKTIF');
  assert.equal(computeCardDisplayStatus('Member Nonaktif', 'Aktif'), 'NONAKTIF');
  assert.equal(computeCardDisplayStatus('Ditolak', 'Aktif'), 'NONAKTIF');
});

test('formatDateID formats dates in DD/MM/YYYY Asia/Jakarta format', () => {
  const formatted = formatDateID('2026-03-15T05:00:00.000Z');
  assert.equal(formatted, '15/03/2026');
  assert.equal(formatDateID(null), '-');
});

test('validateParticipantForm validates required fields and WhatsApp format', () => {
  const invalidRes = validateParticipantForm({
    fullName: 'Al',
    phone: '12345',
    email: 'bademail',
    city: '',
    learningMethod: 'Hybrid',
    program: 'Khot Kufi',
    agreedToRules: false,
  });
  assert.equal(invalidRes.valid, false);
  assert.ok(invalidRes.errors.fullName);
  assert.ok(invalidRes.errors.phone);
  assert.ok(invalidRes.errors.email);
  assert.ok(invalidRes.errors.city);
  assert.ok(invalidRes.errors.learningMethod);
  assert.ok(invalidRes.errors.program);
  assert.ok(invalidRes.errors.agreedToRules);

  const validRes = validateParticipantForm({
    fullName: 'Ahmad Fauzi',
    phone: '081234567890',
    email: 'ahmad@example.com',
    city: 'Bandung',
    learningMethod: 'Online',
    program: 'Khot Naskhi',
    agreedToRules: true,
  });
  assert.equal(validRes.valid, true);
  assert.equal(Object.keys(validRes.errors).length, 0);
});

test('matchesTargetAudience and canMemberAccessDocument enforce RBAC and audience filters', () => {
  const activeOnlineMember = {
    id: 'm1',
    uid: 'u1',
    memberId: 'BK-00001',
    program: 'Khot Naskhi' as const,
    learningMethod: 'Online' as const,
    bookPurchaseStatus: 'Sudah diverifikasi' as const,
    membershipStatus: 'Member Aktif' as const,
    agreedToRules: true,
    joinDate: '2026-01-10T00:00:00.000Z',
    verificationDate: '2026-01-12T00:00:00.000Z',
    adminNotes: '',
  };

  const candidateOfflineMember = {
    ...activeOnlineMember,
    id: 'm2',
    uid: 'u2',
    memberId: 'BK-00002',
    program: "Khot Riq'ah" as const,
    learningMethod: 'Offline' as const,
    membershipStatus: 'Menunggu Verifikasi' as const,
  };

  assert.equal(matchesTargetAudience('Semua Member', activeOnlineMember), true);
  assert.equal(matchesTargetAudience('Peserta Online', activeOnlineMember), true);
  assert.equal(matchesTargetAudience('Peserta Offline', activeOnlineMember), false);
  assert.equal(matchesTargetAudience('Calon Peserta', candidateOfflineMember), true);

  const activeOnlyDoc: DocumentRecord = {
    id: 'd1',
    fileName: 'Modul_Naskhi.pdf',
    fileURL: '/api/documents/d1/download',
    fileType: 'PDF',
    fileSize: 204800,
    category: 'Materi Pembelajaran',
    description: 'Modul resmi',
    accessLevel: 'Khusus Member Aktif',
    targetAudience: 'Semua Member',
    status: 'Aktif',
    uploadedBy: 'Admin',
    uploadedAt: '2026-02-01T00:00:00.000Z',
  };

  assert.equal(canMemberAccessDocument(activeOnlyDoc, activeOnlineMember, 'Aktif'), true);
  assert.equal(canMemberAccessDocument(activeOnlyDoc, candidateOfflineMember, 'Aktif'), false);
  assert.equal(canMemberAccessDocument(activeOnlyDoc, activeOnlineMember, 'Nonaktif'), false);
});

test('calculateDashboardStats and generateMembersCsv compute accurate aggregates', () => {
  const sampleProfiles: CombinedMemberProfile[] = [
    {
      user: {
        uid: 'u1',
        memberId: 'BK-00001',
        username: 'BK-00001',
        fullName: 'Ahmad Fauzi',
        gender: 'Laki-laki (Ikhwan)',
        phone: '081234567891',
        email: 'ahmad@example.com',
        city: 'Jakarta Selatan',
        photoURL: '',
        role: 'member',
        accountStatus: 'Aktif',
        createdAt: '2026-01-10T00:00:00.000Z',
        updatedAt: '2026-01-10T00:00:00.000Z',
        lastLoginAt: null,
      },
      member: {
        id: 'm1',
        uid: 'u1',
        memberId: 'BK-00001',
        program: 'Khot Naskhi',
        learningMethod: 'Online',
        bookPurchaseStatus: 'Sudah diverifikasi',
        membershipStatus: 'Member Aktif',
        agreedToRules: true,
        joinDate: '2026-01-10T00:00:00.000Z',
        verificationDate: '2026-01-11T00:00:00.000Z',
        adminNotes: '',
      },
    },
  ];

  const stats = calculateDashboardStats(sampleProfiles, []);
  assert.equal(stats.totalParticipants, 1);
  assert.equal(stats.activeMembers, 1);
  assert.equal(stats.onlineParticipants, 1);
  assert.equal(stats.naskhiCount, 1);

  const csv = generateMembersCsv(sampleProfiles);
  assert.ok(csv.includes('"BK-00001"'));
  assert.ok(csv.includes('"Ahmad Fauzi"'));
});

test('generateDeterministicQrMatrix produces a 21x21 matrix with finder patterns', () => {
  const matrix = generateDeterministicQrMatrix('https://belajarkhot.id/verify-member/BK-00001');
  assert.equal(matrix.length, 21);
  assert.equal(matrix[0].length, 21);
  // Top-left finder corner (0,0) and center (3,3) must be true
  assert.equal(matrix[0][0], true);
  assert.equal(matrix[3][3], true);
});

test('resolveMemberThemeColors resolves global preset, custom theme, and member override', () => {
  const defaultTheme = resolveMemberThemeColors(null, null);
  assert.equal(defaultTheme.primaryColor, '#19432D');

  const overrideTheme = resolveMemberThemeColors(null, {
    id: 'm1',
    uid: 'u1',
    memberId: 'BK-00001',
    program: 'Khot Naskhi',
    learningMethod: 'Online',
    bookPurchaseStatus: 'Sudah diverifikasi',
    membershipStatus: 'Member Aktif',
    agreedToRules: true,
    joinDate: '2026-01-01T00:00:00.000Z',
    verificationDate: null,
    adminNotes: '',
    customCardColor: '#1E3A5F',
  });
  assert.equal(overrideTheme.primaryColor, '#1E3A5F');
});

test('buildPdfFromJpegBytes generates a valid PDF 1.4 binary header and trailer', () => {
  const fakeJpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
  const pdfBytes = buildPdfFromJpegBytes(fakeJpeg, 800, 500);
  const text = new TextDecoder().decode(pdfBytes);
  assert.ok(text.startsWith('%PDF-1.4'));
  assert.ok(text.includes('/Subtype /Image'));
  assert.ok(text.trim().endsWith('%%EOF'));
});


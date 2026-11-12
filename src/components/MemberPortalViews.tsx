import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  ExternalLink,
  Eye,
  FileText,
  KeyRound,
  MapPin,
  Megaphone,
  MessageCircle,
  Pin,
  Search,
  ShieldCheck,
  Sparkles,
  User,
  Video,
  X,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import type {
  AnnouncementRecord,
  ClassRecord,
  DocumentRecord,
  InformationRecord,
  InstitutionSettings,
  MemberRecord,
  NotificationRecord,
  UserRecord,
} from '../types';
import {
  formatDateID,
  formatFileSize,
  resolveMemberThemeColors,
} from '../utils/domainLogic';
import { DigitalMemberCard } from './DigitalMemberCard';

interface MemberPortalViewsProps {
  activeSubPage:
    | 'dashboard'
    | 'profile'
    | 'card'
    | 'announcements'
    | 'information'
    | 'documents'
    | 'classes'
    | 'whatsapp'
    | 'notifications'
    | 'settings';
  user: UserRecord;
  member: MemberRecord;
  announcements: AnnouncementRecord[];
  readAnnouncementIds: string[];
  information: InformationRecord[];
  documents: DocumentRecord[];
  classes: ClassRecord[];
  notifications: NotificationRecord[];
  settings: InstitutionSettings | null;
  onRefresh: () => Promise<void>;
  onNavigate: (path: string) => void;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

export const MemberPortalViews: React.FC<MemberPortalViewsProps> = ({
  activeSubPage,
  user,
  member,
  announcements,
  readAnnouncementIds,
  information,
  documents,
  classes,
  notifications,
  settings,
  onRefresh,
  onNavigate,
  onShowToast,
}) => {
  // Profile edit states
  const [phone, setPhone] = useState(user.phone || '');
  const [email, setEmail] = useState(user.email || '');
  const [city, setCity] = useState(user.city || '');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    setPhone(user.phone || '');
    setEmail(user.email || '');
    setCity(user.city || '');
  }, [user.phone, user.email, user.city]);

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Document filter & preview
  const [docSearch, setDocSearch] = useState('');
  const [docCategory, setDocCategory] = useState('ALL');
  const [previewDoc, setPreviewDoc] = useState<DocumentRecord | null>(null);

  const combinedProfile = { user, member };
  const memberTheme = resolveMemberThemeColors(settings, member);
  const hasWhatsappLink = Boolean(
    settings?.whatsappGroupURL && settings.whatsappGroupURL.trim().length > 5
  );

  const handleMarkAnnouncementRead = async (annId: string) => {
    try {
      await apiRequest(`/api/announcements/${annId}/read`, { method: 'POST' });
      await onRefresh();
      onShowToast('Pengumuman ditandai sudah dibaca.', 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Gagal menandai pengumuman.', 'error');
    }
  };

  const handleRequestBookVerification = async () => {
    try {
      await apiRequest('/api/member/request-book-verification', { method: 'POST' });
      await onRefresh();
      onShowToast(
        'Permintaan verifikasi kepemilikan buku Khot telah dikirim ke Admin.',
        'success'
      );
    } catch (err: any) {
      onShowToast(err.message || 'Gagal mengirim konfirmasi buku.', 'error');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await apiRequest('/api/member/profile', {
        method: 'PUT',
        body: JSON.stringify({ phone, email, city }),
      });
      await onRefresh();
      onShowToast('Data kontak & domisili profil Anda berhasil diperbarui.', 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Gagal memperbarui profil.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      onShowToast('Password saat ini dan password baru wajib diisi.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      onShowToast('Password baru minimal harus terdiri dari 6 karakter.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      onShowToast('Konfirmasi password baru tidak cocok.', 'error');
      return;
    }
    setSavingPassword(true);
    try {
      await apiRequest('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onShowToast('Password akun Anda berhasil diperbarui.', 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Gagal mengubah password.', 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  // ==========================================================================
  // SUBPAGE 1: MEMBER DASHBOARD (PRD Section 16)
  // ==========================================================================
  if (activeSubPage === 'dashboard') {
    const unreadAnnouncements = announcements.filter(
      (a) => !readAnnouncementIds.includes(a.id)
    );

    return (
      <div className="space-y-6">
        {/* A. Welcome Section (PRD Section 16.A + Dynamic Member Theme Color) */}
        <div
          className="rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${memberTheme.primaryColor} 0%, ${memberTheme.secondaryColor} 100%)`,
          }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-12 -bottom-12 h-56 w-56 rounded-full border border-white/15"
          />
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: memberTheme.accentColor }}
              >
                PORTAL MEMBER DIGITAL BELAJAR KHOT
              </div>
              <h1 className="mt-1 text-xl sm:text-3xl font-bold tracking-tight">
                Assalamu&apos;alaikum, {user.fullName}.
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-white/90">
                Selamat datang di Portal Belajar Khot. Pantau jadwal talaqqi, pengumuman resmi, dokumen materi, dan Kartu Member Digital Anda.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('/member/card')}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold hover:bg-[#E8EFE7] transition-colors shrink-0 self-start sm:self-auto cursor-pointer"
              style={{ color: memberTheme.secondaryColor }}
            >
              <CreditCard className="h-4 w-4" style={{ color: memberTheme.primaryColor }} />
              Buka & Cetak Kartu Member (PDF)
            </button>
          </div>

          {/* B. Ringkasan Akun (PRD Section 16.B) */}
          <div className="relative z-10 mt-6 grid grid-cols-2 gap-3 border-t border-white/15 pt-5 sm:grid-cols-5">
            <div>
              <span
                className="text-[11px] uppercase tracking-wider block"
                style={{ color: memberTheme.accentColor }}
              >
                Nama Peserta
              </span>
              <span className="text-xs sm:text-sm font-bold text-white truncate block">
                {user.fullName}
              </span>
            </div>
            <div>
              <span
                className="text-[11px] uppercase tracking-wider block"
                style={{ color: memberTheme.accentColor }}
              >
                ID Member
              </span>
              <span className="font-mono text-xs sm:text-sm font-bold text-white tabular-nums">
                {member.memberId}
              </span>
            </div>
            <div>
              <span
                className="text-[11px] uppercase tracking-wider block"
                style={{ color: memberTheme.accentColor }}
              >
                Status Keanggotaan
              </span>
              <span
                className="text-xs sm:text-sm font-bold"
                style={{ color: memberTheme.accentColor }}
              >
                {member.membershipStatus}
              </span>
            </div>
            <div>
              <span
                className="text-[11px] uppercase tracking-wider block"
                style={{ color: memberTheme.accentColor }}
              >
                Program Pembelajaran
              </span>
              <span className="text-xs sm:text-sm font-bold text-white">
                {member.program}
              </span>
            </div>
            <div>
              <span
                className="text-[11px] uppercase tracking-wider block"
                style={{ color: memberTheme.accentColor }}
              >
                Metode Pembelajaran
              </span>
              <span className="text-xs sm:text-sm font-bold text-white">
                {member.learningMethod}
              </span>
            </div>
          </div>
        </div>

        {/* Book Requirement Action Callout if not verified yet */}
        {member.bookPurchaseStatus !== 'Sudah diverifikasi' && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[#A06A18]/30 bg-[#FCF5E8] p-5">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#A06A18]">
                PERSYARATAN KEANGGOTAAN BELAJAR KHOT
              </div>
              <h2 className="mt-0.5 text-sm font-bold text-[#26332A]">
                Status Buku Panduan Khot Anda: {member.bookPurchaseStatus}
              </h2>
              <p className="mt-1 text-xs text-[#6B776D]">
                Calon peserta wajib memiliki buku panduan resmi sesuai program ({member.program}) agar Kartu Member Digital diaktifkan menjadi MEMBER AKTIF.
              </p>
            </div>
            {member.bookPurchaseStatus === 'Belum membeli' && (
              <button
                type="button"
                onClick={handleRequestBookVerification}
                className="shrink-0 rounded-lg bg-[#315B43] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#264734] cursor-pointer"
              >
                Konfirmasi Sudah Memiliki Buku
              </button>
            )}
          </div>
        )}

        {/* D. Main Widgets Grid (PRD Section 16.D) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left 7 Cols: Digital Member Card Widget + Official WhatsApp Group Card */}
          <div className="space-y-6 lg:col-span-7">
            <div className="rounded-2xl border border-[#E3EAE3] bg-white p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="text-sm sm:text-base font-bold text-[#26332A] truncate">
                  Kartu Member Digital Anda
                </h2>
                <button
                  type="button"
                  onClick={() => onNavigate('/member/card')}
                  className="text-xs font-semibold text-[#315B43] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Unduh / Cetak →
                </button>
              </div>
              <DigitalMemberCard
                profile={combinedProfile}
                settings={settings}
                compact
              />
            </div>

            {/* Official WhatsApp Group Card (PRD Section 15) */}
            <div className="rounded-2xl border border-[#E3EAE3] bg-white p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EBF5EE] text-[#3B7551]">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#26332A]">
                      Grup WhatsApp Resmi Belajar Khot
                    </h2>
                    <p className="text-xs text-[#6B776D]">
                      Pusat koordinasi harian peserta ikhwan, arahan musyrif, dan informasi jadwal setoran.
                    </p>
                  </div>
                </div>
              </div>

              <p className="mt-3 rounded-xl bg-[#F3F7F2] p-3.5 text-xs text-[#26332A] leading-relaxed">
                {settings?.whatsappGroupInstructions ||
                  'Pastikan Anda mencantumkan Nama Lengkap dan Nomor ID Member saat bergabung ke dalam grup WhatsApp resmi.'}
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                {hasWhatsappLink ? (
                  <a
                    href={settings!.whatsappGroupURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-[#315B43] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#264734] transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" />
                    GABUNG GRUP WHATSAPP
                  </a>
                ) : (
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      disabled
                      className="inline-flex items-center gap-2 rounded-lg bg-[#E3EAE3] px-5 py-2.5 text-xs font-bold text-[#929B93] cursor-not-allowed"
                    >
                      GABUNG GRUP WHATSAPP
                    </button>
                    <p className="text-[11px] text-[#A06A18]">
                      Informasi: Tautan grup WhatsApp resmi saat ini belum diterbitkan oleh Admin.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right 5 Cols: Latest Announcements, Classes, & Documents */}
          <div className="space-y-6 lg:col-span-5">
            {/* Pengumuman Terbaru */}
            <div className="rounded-2xl border border-[#E3EAE3] bg-white p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[#26332A]">
                  Pengumuman Resmi ({unreadAnnouncements.length} Baru)
                </h2>
                <button
                  type="button"
                  onClick={() => onNavigate('/member/announcements')}
                  className="text-xs font-semibold text-[#315B43] hover:underline cursor-pointer"
                >
                  Semua
                </button>
              </div>
              <div className="mt-4 divide-y divide-[#E3EAE3]">
                {announcements.slice(0, 3).map((ann) => {
                  const isRead = readAnnouncementIds.includes(ann.id);
                  return (
                    <div key={ann.id} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between text-[11px] text-[#6B776D]">
                        <span className="font-semibold text-[#315B43]">
                          {!isRead ? 'BELUM DIBACA · ' : ''}
                          {ann.category}
                        </span>
                        <span className="font-mono tabular-nums">
                          {formatDateID(ann.publishAt)}
                        </span>
                      </div>
                      <h3 className="mt-0.5 text-xs font-bold text-[#26332A]">
                        {ann.title}
                      </h3>
                      <p className="mt-1 text-xs text-[#6B776D] line-clamp-2">
                        {ann.content}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Agenda & Informasi Kelas */}
            <div className="rounded-2xl border border-[#E3EAE3] bg-white p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[#26332A]">
                  Jadwal Kelas Anda ({member.program})
                </h2>
                <button
                  type="button"
                  onClick={() => onNavigate('/member/classes')}
                  className="text-xs font-semibold text-[#315B43] hover:underline cursor-pointer"
                >
                  Detail Kelas
                </button>
              </div>
              <div className="mt-4 space-y-3">
                {classes.map((cls) => (
                  <div key={cls.id} className="rounded-xl bg-[#F3F7F2] p-3.5 text-xs">
                    <div className="font-bold text-[#26332A]">{cls.className}</div>
                    <div className="mt-1 text-[#6B776D]">
                      Pengajar: {cls.instructor}
                    </div>
                    <div className="mt-1 font-semibold text-[#315B43]">
                      Jadwal: {cls.schedule}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dokumen Terbaru */}
            <div className="rounded-2xl border border-[#E3EAE3] bg-white p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[#26332A]">Dokumen & Materi</h2>
                <button
                  type="button"
                  onClick={() => onNavigate('/member/documents')}
                  className="text-xs font-semibold text-[#315B43] hover:underline cursor-pointer"
                >
                  Pusat Dokumen
                </button>
              </div>
              <div className="mt-3 divide-y divide-[#E3EAE3]">
                {documents.slice(0, 3).map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0 text-xs"
                  >
                    <div className="truncate pr-2">
                      <div className="font-semibold text-[#26332A] truncate">
                        {doc.fileName}
                      </div>
                      <div className="text-[11px] text-[#6B776D]">{doc.category}</div>
                    </div>
                    <a
                      href={doc.fileURL}
                      download={doc.fileName}
                      className="shrink-0 rounded-lg bg-[#E8EFE7] px-2.5 py-1 text-[11px] font-semibold text-[#315B43]"
                    >
                      Unduh
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // SUBPAGE 2: MEMBER PROFILE (/member/profile)
  // ==========================================================================
  if (activeSubPage === 'profile') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#26332A]">
            Profil Saya & Data Keanggotaan
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#6B776D]">
            Informasi resmi keanggotaan Anda di Belajar Khot. Anda dapat memperbarui nomor WhatsApp, email, atau domisili.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Read-only Official Academic Identity */}
          <div className="rounded-2xl border border-[#E3EAE3] bg-white p-6 lg:col-span-5 space-y-4">
            <h2 className="text-base font-bold text-[#26332A]">
              Identitas Akademik & Keanggotaan (Resmi)
            </h2>
            <div className="space-y-3 text-xs">
              <div className="rounded-xl bg-[#F3F7F2] p-3.5">
                <span className="text-[#6B776D] block">Nomor ID Member</span>
                <strong className="font-mono text-sm text-[#315B43] tabular-nums">
                  {member.memberId}
                </strong>
              </div>
              <div className="rounded-xl bg-[#F3F7F2] p-3.5">
                <span className="text-[#6B776D] block">Nama Lengkap Peserta</span>
                <strong className="text-sm text-[#26332A]">{user.fullName}</strong>
              </div>
              <div className="rounded-xl bg-[#F3F7F2] p-3.5">
                <span className="text-[#6B776D] block">Program & Metode Pembelajaran</span>
                <strong className="text-sm text-[#26332A]">
                  {member.program} · Metode {member.learningMethod}
                </strong>
              </div>
              <div className="rounded-xl bg-[#F3F7F2] p-3.5">
                <span className="text-[#6B776D] block">
                  Status Keanggotaan & Verifikasi Buku
                </span>
                <strong className="text-sm text-[#315B43]">
                  {member.membershipStatus} ({member.bookPurchaseStatus})
                </strong>
              </div>
              <div className="rounded-xl bg-[#F3F7F2] p-3.5">
                <span className="text-[#6B776D] block">Tanggal Bergabung</span>
                <strong className="font-mono text-sm text-[#26332A] tabular-nums">
                  {formatDateID(member.joinDate)}
                </strong>
              </div>
            </div>
            <p className="text-[11px] text-[#6B776D]">
              Catatan: Perubahan program belajar atau status keanggotaan hanya dapat dilakukan melalui verifikasi Administrator Belajar Khot.
            </p>
          </div>

          {/* Editable Personal Contact Form */}
          <form
            onSubmit={handleSaveProfile}
            className="rounded-2xl border border-[#E3EAE3] bg-white p-6 lg:col-span-7 space-y-4"
          >
            <h2 className="text-base font-bold text-[#26332A]">
              Perbarui Data Kontak & Domisili
            </h2>
            <div>
              <label className="block text-xs font-semibold text-[#26332A]">
                Nomor WhatsApp Aktif
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] px-3 font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#26332A]">
                Alamat Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] px-3 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#26332A]">
                Domisili (Kota / Kabupaten)
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] px-3 text-xs"
              />
            </div>

            <div className="flex justify-end border-t border-[#E3EAE3] pt-4">
              <button
                type="submit"
                disabled={savingProfile}
                className="rounded-lg bg-[#315B43] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#264734] cursor-pointer"
              >
                {savingProfile ? 'Menyimpan...' : 'Simpan Pembaruan Profil'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // SUBPAGE 3: DIGITAL MEMBER CARD (/member/card)
  // ==========================================================================
  if (activeSubPage === 'card') {
    return (
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#26332A]">
            Kartu Member Digital Resmi Belajar Khot
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#6B776D]">
            Gunakan kartu ini untuk registrasi ulang halaqah tatap muka, pengambilan buku panduan, maupun verifikasi keanggotaan.
          </p>
        </div>

        <DigitalMemberCard
          profile={combinedProfile}
          settings={settings}
          onOpenVerify={(id) => onNavigate(`/verify-member/${id}`)}
        />
      </div>
    );
  }

  // ==========================================================================
  // SUBPAGE 4: ANNOUNCEMENTS (/member/announcements)
  // ==========================================================================
  if (activeSubPage === 'announcements') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#26332A]">
            Pengumuman Resmi Lembaga
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#6B776D]">
            Daftar pengumuman resmi yang ditujukan untuk seluruh member serta program {member.program} ({member.learningMethod}).
          </p>
        </div>

        <div className="space-y-4">
          {announcements.map((ann) => {
            const isRead = readAnnouncementIds.includes(ann.id);
            return (
              <div
                key={ann.id}
                className={`rounded-2xl border p-5 sm:p-6 ${
                  isRead
                    ? 'border-[#E3EAE3] bg-white'
                    : 'border-[#315B43]/40 bg-white shadow-xs'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#6B776D]">
                  <div className="flex flex-wrap items-center gap-2">
                    {!isRead && (
                      <span className="font-bold text-[#315B43]">● BELUM DIBACA</span>
                    )}
                    {ann.isPinned && (
                      <span className="inline-flex items-center gap-1 font-semibold text-[#315B43]">
                        <Pin className="h-3.5 w-3.5" />
                        Disematkan
                      </span>
                    )}
                    <span>{ann.category}</span>
                    <span className="font-mono tabular-nums">
                      · Diterbitkan {formatDateID(ann.publishAt)}
                    </span>
                  </div>

                  {!isRead ? (
                    <button
                      type="button"
                      onClick={() => handleMarkAnnouncementRead(ann.id)}
                      className="rounded-lg bg-[#E8EFE7] px-3 py-1 text-xs font-semibold text-[#315B43] hover:bg-[#DCE6DA] cursor-pointer"
                    >
                      Tandai Sudah Dibaca
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#3B7551]">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Sudah Dibaca
                    </span>
                  )}
                </div>

                <h2 className="mt-2 text-base sm:text-lg font-bold text-[#26332A]">
                  {ann.title}
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-[#26332A] leading-relaxed whitespace-pre-line">
                  {ann.content}
                </p>

                {ann.attachmentURL && (
                  <div className="mt-4 border-t border-[#E3EAE3] pt-3">
                    <a
                      href={ann.attachmentURL}
                      download={ann.attachmentName || 'Lampiran_Pengumuman.pdf'}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#F3F7F2] px-3.5 py-2 text-xs font-semibold text-[#315B43] hover:bg-[#E8EFE7]"
                    >
                      <Download className="h-4 w-4" />
                      Unduh Lampiran: {ann.attachmentName || 'Dokumen PDF'}
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ==========================================================================
  // SUBPAGE 5: INFORMATION CENTER (/member/information)
  // ==========================================================================
  if (activeSubPage === 'information') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#26332A]">
            Pusat Informasi, Katalog Buku & Kegiatan
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#6B776D]">
            Informasi resmi program pembelajaran, pemesanan buku panduan Khot, serta materi edukasi kaligrafi Islam.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {information.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-2xl border border-[#E3EAE3] bg-white p-5 sm:p-6"
            >
              <div>
                <div className="text-xs font-semibold text-[#315B43]">
                  {item.category} · {formatDateID(item.publishAt)}
                </div>
                <h2 className="mt-2 text-base font-bold text-[#26332A]">{item.title}</h2>
                <p className="mt-2 text-xs text-[#6B776D] leading-relaxed">
                  {item.description}
                </p>
              </div>

              {item.destinationURL && (
                <div className="mt-5 border-t border-[#E3EAE3] pt-3">
                  {item.destinationURL.startsWith('http') ? (
                    <a
                      href={item.destinationURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#315B43] hover:underline"
                    >
                      Buka Tautan Resmi
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onNavigate(item.destinationURL)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#315B43] hover:underline cursor-pointer"
                    >
                      Lihat Selengkapnya →
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ==========================================================================
  // SUBPAGE 6: DOCUMENTS CENTER (/member/documents)
  // ==========================================================================
  if (activeSubPage === 'documents') {
    const filteredDocs = documents.filter((d) => {
      if (docCategory !== 'ALL' && d.category !== docCategory) return false;
      if (docSearch.trim()) {
        const q = docSearch.toLowerCase();
        return (
          d.fileName.toLowerCase().includes(q) || d.description.toLowerCase().includes(q)
        );
      }
      return true;
    });

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#26332A]">
            Pusat Dokumen & Modul Pembelajaran
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#6B776D]">
            Unduh panduan peserta, katalog buku Khot, dan lembar materi pembelajaran yang diizinkan untuk akun Anda.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center rounded-2xl border border-[#E3EAE3] bg-white p-4">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B776D]" />
            <input
              type="text"
              value={docSearch}
              onChange={(e) => setDocSearch(e.target.value)}
              placeholder="Cari dokumen atau materi..."
              className="h-10 w-full rounded-lg border border-[#E3EAE3] pl-9 pr-3 text-xs"
            />
          </div>
          <select
            value={docCategory}
            onChange={(e) => setDocCategory(e.target.value)}
            className="h-10 rounded-lg border border-[#E3EAE3] bg-white px-3 text-xs"
          >
            <option value="ALL">Semua Kategori</option>
            <option value="Panduan Peserta">Panduan Peserta</option>
            <option value="Materi Pembelajaran">Materi Pembelajaran</option>
            <option value="Informasi Buku Khot">Informasi Buku Khot</option>
            <option value="Dokumen Resmi">Dokumen Resmi</option>
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="flex flex-col justify-between rounded-2xl border border-[#E3EAE3] bg-white p-5"
            >
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E8EFE7] font-mono text-xs font-bold text-[#315B43]">
                    {doc.fileType}
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-[#26332A] break-all">
                      {doc.fileName}
                    </h2>
                    <div className="text-[11px] text-[#6B776D] tabular-nums">
                      {doc.category} · {formatFileSize(doc.fileSize)} · {formatDateID(doc.uploadedAt)}
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-xs text-[#6B776D] leading-relaxed">
                  {doc.description}
                </p>
              </div>

              <div className="mt-4 flex items-center gap-2 border-t border-[#E3EAE3] pt-3">
                <button
                  type="button"
                  onClick={() => setPreviewDoc(doc)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#F3F7F2] px-3.5 py-2 text-xs font-semibold text-[#26332A] hover:bg-[#E8EFE7] cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Preview Dokumen
                </button>
                <a
                  href={doc.fileURL}
                  download={doc.fileName}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#315B43] px-4 py-2 text-xs font-semibold text-white hover:bg-[#264734]"
                >
                  <Download className="h-3.5 w-3.5" />
                  Unduh File
                </a>
              </div>
            </div>
          ))}
        </div>

        {previewDoc && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
          >
            <div className="w-full max-w-xl rounded-2xl border border-[#E3EAE3] bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-[#E3EAE3] pb-3">
                <h3 className="text-base font-bold text-[#26332A]">
                  {previewDoc.fileName}
                </h3>
                <button type="button" onClick={() => setPreviewDoc(null)}>
                  <X className="h-5 w-5 text-[#6B776D]" />
                </button>
              </div>
              <div className="mt-4 rounded-xl bg-[#F3F7F2] p-5 space-y-2 text-xs">
                <div className="font-bold text-[#315B43]">{previewDoc.category}</div>
                <p className="text-[#26332A] leading-relaxed">
                  {previewDoc.contentSummary || previewDoc.description}
                </p>
              </div>
              <div className="mt-4 flex justify-end">
                <a
                  href={previewDoc.fileURL}
                  download={previewDoc.fileName}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#315B43] px-4 py-2 text-xs font-semibold text-white"
                >
                  <Download className="h-4 w-4" />
                  Unduh PDF Sekarang
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================================================
  // SUBPAGE 7: CLASSES (/member/classes) & WHATSAPP (/member/whatsapp)
  // ==========================================================================
  if (activeSubPage === 'classes' || activeSubPage === 'whatsapp') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#26332A]">
            Informasi Kelas & Grup WhatsApp Resmi
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#6B776D]">
            Jadwal pembelajaran sesuai program Anda ({member.program} — {member.learningMethod}) serta tautan koordinasi grup WhatsApp.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {classes.map((cls) => (
            <div
              key={cls.id}
              className="rounded-2xl border border-[#E3EAE3] bg-white p-6 space-y-4"
            >
              <div>
                <span className="text-xs font-semibold text-[#315B43]">
                  {cls.program} · Metode {cls.learningMethod}
                </span>
                <h2 className="mt-1 text-lg font-bold text-[#26332A]">{cls.className}</h2>
                <div className="mt-1 text-xs text-[#6B776D]">
                  Musyrif Pembimbing: <strong className="text-[#26332A]">{cls.instructor}</strong>
                </div>
              </div>
              <p className="text-xs text-[#6B776D] leading-relaxed">{cls.description}</p>
              <div className="rounded-xl bg-[#F3F7F2] p-4 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#315B43]" />
                  <span>
                    Jadwal Rutin: <strong>{cls.schedule}</strong>
                  </span>
                </div>
                {cls.learningMethod === 'Online' ? (
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-[#315B43]" />
                    <span>
                      Ruang Belajar Online:{' '}
                      <a
                        href={cls.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono font-bold text-[#315B43] underline"
                      >
                        {cls.meetingLink}
                      </a>
                    </span>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 shrink-0 text-[#315B43] mt-0.5" />
                    <span>Lokasi Studio: {cls.offlineLocation}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Official WhatsApp Group Card */}
        <div className="rounded-2xl border border-[#E3EAE3] bg-white p-6">
          <h2 className="text-base font-bold text-[#26332A]">
            Grup WhatsApp Resmi Belajar Khot
          </h2>
          <p className="mt-2 text-xs text-[#6B776D] leading-relaxed">
            {settings?.whatsappGroupInstructions}
          </p>
          <div className="mt-4">
            {hasWhatsappLink ? (
              <a
                href={settings!.whatsappGroupURL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-[#315B43] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#264734]"
              >
                <MessageCircle className="h-4 w-4" />
                GABUNG GRUP WHATSAPP
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="rounded-lg bg-[#E3EAE3] px-5 py-2.5 text-xs font-bold text-[#929B93]"
              >
                Link Grup WhatsApp Belum Diterbitkan
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // SUBPAGE 8: NOTIFICATIONS (/member/notifications)
  // ==========================================================================
  if (activeSubPage === 'notifications') {
    return (
      <div className="space-y-6">
        <h1 className="text-xl sm:text-2xl font-bold text-[#26332A]">
          Notifikasi Akun Saya
        </h1>
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className="rounded-2xl border border-[#E3EAE3] bg-white p-4 space-y-1"
            >
              <div className="text-[11px] text-[#6B776D] font-mono tabular-nums">
                {formatDateID(n.createdAt, true)}
              </div>
              <h3 className="text-sm font-bold text-[#26332A]">{n.title}</h3>
              <p className="text-xs text-[#6B776D]">{n.message}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ==========================================================================
  // SUBPAGE 9: ACCOUNT SETTINGS & CHANGE PASSWORD (/member/settings)
  // ==========================================================================
  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#26332A]">
          Pengaturan Keamanan Akun & Ubah Password
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-[#6B776D]">
          Ganti password akun Anda secara berkala untuk menjaga keamanan Kartu Member Digital.
        </p>
      </div>

      <form
        onSubmit={handleChangePassword}
        className="rounded-2xl border border-[#E3EAE3] bg-white p-6 space-y-4"
      >
        <div>
          <label className="block text-xs font-semibold text-[#26332A]">
            Password Saat Ini *
          </label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] px-3 text-xs"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#26332A]">
            Password Baru (Minimal 6 Karakter) *
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] px-3 text-xs"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#26332A]">
            Konfirmasi Password Baru *
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] px-3 text-xs"
          />
        </div>
        <div className="flex justify-end border-t border-[#E3EAE3] pt-4">
          <button
            type="submit"
            disabled={savingPassword}
            className="rounded-lg bg-[#315B43] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#264734] cursor-pointer"
          >
            {savingPassword ? 'Memperbarui...' : 'Simpan Password Baru'}
          </button>
        </div>
      </form>
    </div>
  );
};

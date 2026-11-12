import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Download,
  Edit3,
  Eye,
  KeyRound,
  Plus,
  Printer,
  Search,
  ShieldAlert,
  Trash2,
  UserCheck,
  UserPlus,
  UserX,
  X,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import type {
  AccountStatus,
  BookPurchaseStatus,
  CombinedMemberProfile,
  InstitutionSettings,
  LearningMethod,
  MembershipStatus,
  ProgramType,
} from '../types';
import {
  formatDateID,
  generateMembersCsv,
  validateParticipantForm,
} from '../utils/domainLogic';
import { DigitalMemberCard } from './DigitalMemberCard';

interface AdminMembersViewProps {
  profiles: CombinedMemberProfile[];
  settings: InstitutionSettings | null;
  mode: 'members' | 'accounts' | 'add';
  selectedMemberIdParam?: string | null;
  onRefresh: () => Promise<void>;
  onNavigate: (path: string) => void;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

export const AdminMembersView: React.FC<AdminMembersViewProps> = ({
  profiles,
  settings,
  mode,
  selectedMemberIdParam,
  onRefresh,
  onNavigate,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [programFilter, setProgramFilter] = useState<string>('ALL');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [bookFilter, setBookFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modals state
  const [showAddModal, setShowAddModal] = useState(mode === 'add');
  const [editingProfile, setEditingProfile] = useState<CombinedMemberProfile | null>(null);
  const [detailProfile, setDetailProfile] = useState<CombinedMemberProfile | null>(() => {
    if (selectedMemberIdParam) {
      return (
        profiles.find(
          (p) => p.member.memberId.toUpperCase() === selectedMemberIdParam.toUpperCase()
        ) || null
      );
    }
    return null;
  });

  useEffect(() => {
    if (mode === 'add') {
      setShowAddModal(true);
    }
  }, [mode]);

  useEffect(() => {
    if (selectedMemberIdParam) {
      const found =
        profiles.find(
          (p) => p.member.memberId.toUpperCase() === selectedMemberIdParam.toUpperCase()
        ) || null;
      setDetailProfile(found);
    }
  }, [selectedMemberIdParam, profiles]);
  const [confirmDeleteProfile, setConfirmDeleteProfile] = useState<CombinedMemberProfile | null>(
    null
  );
  const [resetPasswordModal, setResetPasswordModal] = useState<{
    profile: CombinedMemberProfile;
    newPass: string;
    resultPass?: string;
  } | null>(null);

  // Add Participant Form State (PRD Section 8.C)
  const [formFullName, setFormFullName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formMethod, setFormMethod] = useState<LearningMethod>('Online');
  const [formProgram, setFormProgram] = useState<ProgramType>('Khot Naskhi');
  const [formBookStatus, setFormBookStatus] = useState<BookPurchaseStatus>('Belum membeli');
  const [formMembershipStatus, setFormMembershipStatus] =
    useState<MembershipStatus>('Calon Peserta');
  const [formAgreedRules, setFormAgreedRules] = useState(true);
  const [formAdminNotes, setFormAdminNotes] = useState('');
  const [formInitialPassword, setFormInitialPassword] = useState('MemberKhot123!');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Edit Form State
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editMethod, setEditMethod] = useState<LearningMethod>('Online');
  const [editProgram, setEditProgram] = useState<ProgramType>('Khot Naskhi');
  const [editBookStatus, setEditBookStatus] = useState<BookPurchaseStatus>('Belum membeli');
  const [editMembershipStatus, setEditMembershipStatus] =
    useState<MembershipStatus>('Calon Peserta');
  const [editAccountStatus, setEditAccountStatus] = useState<AccountStatus>('Aktif');
  const [editAdminNotes, setEditAdminNotes] = useState('');

  const filteredProfiles = useMemo(() => {
    return profiles.filter(({ user, member }) => {
      if (user.role !== 'member') return false;
      const q = searchQuery.trim().toLowerCase();
      if (q) {
        const matchName = user.fullName.toLowerCase().includes(q);
        const matchId = member.memberId.toLowerCase().includes(q);
        const matchPhone = user.phone.toLowerCase().includes(q);
        const matchCity = user.city.toLowerCase().includes(q);
        if (!matchName && !matchId && !matchPhone && !matchCity) return false;
      }
      if (programFilter !== 'ALL' && member.program !== programFilter) return false;
      if (methodFilter !== 'ALL' && member.learningMethod !== methodFilter) return false;
      if (statusFilter !== 'ALL' && member.membershipStatus !== statusFilter) return false;
      if (bookFilter !== 'ALL' && member.bookPurchaseStatus !== bookFilter) return false;
      return true;
    });
  }, [profiles, searchQuery, programFilter, methodFilter, statusFilter, bookFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProfiles.length / pageSize));
  const paginatedProfiles = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProfiles.slice(start, start + pageSize);
  }, [filteredProfiles, currentPage]);

  const openEditModal = (p: CombinedMemberProfile) => {
    setEditingProfile(p);
    setEditFullName(p.user.fullName);
    setEditPhone(p.user.phone);
    setEditEmail(p.user.email);
    setEditCity(p.user.city);
    setEditMethod(p.member.learningMethod);
    setEditProgram(p.member.program);
    setEditBookStatus(p.member.bookPurchaseStatus);
    setEditMembershipStatus(p.member.membershipStatus);
    setEditAccountStatus(p.user.accountStatus);
    setEditAdminNotes(p.member.adminNotes);
  };

  const handleCreateParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateParticipantForm({
      fullName: formFullName,
      phone: formPhone,
      email: formEmail,
      city: formCity,
      learningMethod: formMethod,
      program: formProgram,
      agreedToRules: formAgreedRules,
    });

    if (!check.valid) {
      setFormErrors(check.errors);
      return;
    }

    setSubmitting(true);
    setFormErrors({});
    try {
      const res = await apiRequest<{
        profile: CombinedMemberProfile;
        generatedPassword: string;
      }>('/api/members', {
        method: 'POST',
        body: JSON.stringify({
          fullName: formFullName,
          phone: formPhone,
          email: formEmail,
          city: formCity,
          learningMethod: formMethod,
          program: formProgram,
          bookPurchaseStatus: formBookStatus,
          membershipStatus: formMembershipStatus,
          agreedToRules: formAgreedRules,
          adminNotes: formAdminNotes,
          initialPassword: formInitialPassword,
        }),
      });

      await onRefresh();
      setShowAddModal(false);
      setFormFullName('');
      setFormPhone('');
      setFormEmail('');
      setFormCity('');
      setFormAdminNotes('');
      onShowToast(
        `Peserta ${res.profile.user.fullName} berhasil didaftarkan dengan ID ${res.profile.member.memberId}.`,
        'success'
      );
      if (mode === 'add') {
        onNavigate('/admin/members');
      }
    } catch (err: any) {
      onShowToast(err.message || 'Gagal menambahkan peserta.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile) return;
    setSubmitting(true);
    try {
      await apiRequest(`/api/members/${editingProfile.member.memberId}`, {
        method: 'PUT',
        body: JSON.stringify({
          fullName: editFullName,
          phone: editPhone,
          email: editEmail,
          city: editCity,
          learningMethod: editMethod,
          program: editProgram,
          bookPurchaseStatus: editBookStatus,
          membershipStatus: editMembershipStatus,
          accountStatus: editAccountStatus,
          adminNotes: editAdminNotes,
        }),
      });
      await onRefresh();
      setEditingProfile(null);
      onShowToast(
        `Data peserta ${editingProfile.member.memberId} berhasil diperbarui.`,
        'success'
      );
    } catch (err: any) {
      onShowToast(err.message || 'Gagal memperbarui peserta.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickVerifyAndApprove = async (p: CombinedMemberProfile) => {
    setSubmitting(true);
    try {
      await apiRequest(`/api/members/${p.member.memberId}`, {
        method: 'PUT',
        body: JSON.stringify({
          bookPurchaseStatus: 'Sudah diverifikasi',
          membershipStatus: 'Member Aktif',
          accountStatus: 'Aktif',
        }),
      });
      await onRefresh();
      onShowToast(
        `Buku Khot & Status Member Aktif untuk ${p.user.fullName} (${p.member.memberId}) telah disetujui!`,
        'success'
      );
    } catch (err: any) {
      onShowToast(err.message || 'Gagal memverifikasi peserta.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleAccountStatus = async (p: CombinedMemberProfile) => {
    const nextAccountStatus: AccountStatus =
      p.user.accountStatus === 'Aktif' ? 'Nonaktif' : 'Aktif';
    try {
      await apiRequest(`/api/members/${p.member.memberId}`, {
        method: 'PUT',
        body: JSON.stringify({
          accountStatus: nextAccountStatus,
          membershipStatus:
            nextAccountStatus === 'Nonaktif' ? 'Member Nonaktif' : p.member.membershipStatus,
        }),
      });
      await onRefresh();
      onShowToast(
        `Status akun ${p.member.memberId} diubah menjadi ${nextAccountStatus}.`,
        'success'
      );
    } catch (err: any) {
      onShowToast(err.message || 'Gagal mengubah status akun.', 'error');
    }
  };

  const handleDeleteParticipant = async () => {
    if (!confirmDeleteProfile) return;
    setSubmitting(true);
    try {
      await apiRequest(`/api/members/${confirmDeleteProfile.member.memberId}`, {
        method: 'DELETE',
      });
      await onRefresh();
      onShowToast(
        `Peserta ${confirmDeleteProfile.user.fullName} (${confirmDeleteProfile.member.memberId}) telah dihapus.`,
        'success'
      );
      setConfirmDeleteProfile(null);
    } catch (err: any) {
      onShowToast(err.message || 'Gagal menghapus peserta.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordModal) return;
    setSubmitting(true);
    try {
      const res = await apiRequest<{
        success: boolean;
        temporaryPassword: string;
        memberId: string;
      }>(`/api/accounts/${resetPasswordModal.profile.user.uid}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ newPassword: resetPasswordModal.newPass }),
      });
      setResetPasswordModal({
        ...resetPasswordModal,
        resultPass: res.temporaryPassword,
      });
      onShowToast(`Password akun ${res.memberId} berhasil direset.`, 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Gagal mereset password.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCsv = () => {
    const csvContent = generateMembersCsv(filteredProfiles);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Data_Peserta_Belajar_Khot_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onShowToast('Data peserta berhasil diekspor ke file CSV.', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Page Header & Primary Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#26332A]">
            {mode === 'accounts'
              ? 'Manajemen Akun & Status Keanggotaan'
              : 'Manajemen Calon Peserta & Member'}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#6B776D]">
            {mode === 'accounts'
              ? 'Kelola kredensial login ID Member, pengaktifan akun, verifikasi buku Khot, dan reset password.'
              : 'Kelola pendaftaran peserta ikhwan, verifikasi persyaratan buku Khot, metode belajar, dan ekspor data.'}
          </p>
        </div>

        <div className="no-print flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#C7D7C8] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#315B43] hover:bg-[#F3F7F2] transition-colors cursor-pointer"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#E8EFE7] px-3.5 py-2.5 text-xs font-semibold text-[#315B43] hover:bg-[#DCE6DA] transition-colors cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            Cetak Data
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#315B43] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#264734] transition-colors cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            Tambah Peserta Baru
          </button>
        </div>
      </div>

      {/* Search & Multi-Filter Bar */}
      <div className="no-print rounded-2xl border border-[#E3EAE3] bg-white p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B776D]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari nama peserta, ID (BK-00001), WhatsApp, atau kota..."
              aria-label="Cari peserta"
              className="h-10 w-full rounded-lg border border-[#E3EAE3] bg-white pl-9 pr-3 text-xs text-[#26332A] placeholder:text-[#929B93] focus:border-[#315B43] focus:outline-none"
            />
          </div>

          <select
            aria-label="Filter Program"
            value={programFilter}
            onChange={(e) => {
              setProgramFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-10 rounded-lg border border-[#E3EAE3] bg-white px-3 text-xs font-medium text-[#26332A] focus:border-[#315B43] focus:outline-none"
          >
            <option value="ALL">Semua Program Khot</option>
            <option value="Khot Naskhi">Khot Naskhi</option>
            <option value="Khot Riq'ah">Khot Riq&apos;ah</option>
          </select>

          <select
            aria-label="Filter Metode Belajar"
            value={methodFilter}
            onChange={(e) => {
              setMethodFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-10 rounded-lg border border-[#E3EAE3] bg-white px-3 text-xs font-medium text-[#26332A] focus:border-[#315B43] focus:outline-none"
          >
            <option value="ALL">Semua Metode (Online/Offline)</option>
            <option value="Online">Pembelajaran Online</option>
            <option value="Offline">Pembelajaran Offline</option>
          </select>

          <select
            aria-label="Filter Status Keanggotaan"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-10 rounded-lg border border-[#E3EAE3] bg-white px-3 text-xs font-medium text-[#26332A] focus:border-[#315B43] focus:outline-none"
          >
            <option value="ALL">Semua Status Keanggotaan</option>
            <option value="Member Aktif">Member Aktif</option>
            <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
            <option value="Calon Peserta">Calon Peserta</option>
            <option value="Member Nonaktif">Member Nonaktif</option>
            <option value="Alumni">Alumni</option>
            <option value="Ditolak">Ditolak</option>
          </select>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#E3EAE3] pt-3 text-xs text-[#6B776D]">
          <div className="flex flex-wrap items-center gap-2">
            <span>Filter Persyaratan Buku:</span>
            {(['ALL', 'Sudah diverifikasi', 'Menunggu verifikasi', 'Belum membeli'] as const).map(
              (bStat) => (
                <button
                  key={bStat}
                  type="button"
                  onClick={() => {
                    setBookFilter(bStat);
                    setCurrentPage(1);
                  }}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                    bookFilter === bStat
                      ? 'bg-[#315B43] text-white'
                      : 'bg-[#F3F7F2] text-[#6B776D] hover:text-[#26332A]'
                  }`}
                >
                  {bStat === 'ALL' ? 'Semua' : bStat}
                </button>
              )
            )}
          </div>
          <div className="font-medium tabular-nums">
            Menampilkan <strong>{filteredProfiles.length}</strong> peserta terdaftar
          </div>
        </div>
      </div>

      {/* Desktop Data Table (PRD Section 8.A) */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-[#E3EAE3] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E3EAE3] bg-[#F3F7F2] text-[11px] font-semibold uppercase tracking-wider text-[#6B776D]">
                <th className="py-3.5 pl-5 pr-2">No</th>
                <th className="px-3 py-3.5">ID Member</th>
                <th className="px-3 py-3.5">Nama Lengkap & Domisili</th>
                <th className="px-3 py-3.5">WhatsApp & Email</th>
                <th className="px-3 py-3.5">Program & Metode</th>
                <th className="px-3 py-3.5">Persyaratan Buku</th>
                <th className="px-3 py-3.5">Status Keanggotaan</th>
                <th className="px-3 py-3.5">Bergabung</th>
                <th className="no-print py-3.5 pl-3 pr-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3EAE3] text-xs">
              {paginatedProfiles.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-sm text-[#6B776D]">
                    Tidak ada data peserta yang sesuai dengan kriteria pencarian/filter.
                  </td>
                </tr>
              ) : (
                paginatedProfiles.map((p, idx) => {
                  const rowNum = (currentPage - 1) * pageSize + idx + 1;
                  const { user, member } = p;
                  return (
                    <tr
                      key={member.memberId}
                      className="hover:bg-[#FAFCF9] transition-colors"
                    >
                      <td className="py-3.5 pl-5 pr-2 font-mono text-[#6B776D] tabular-nums">
                        {rowNum}
                      </td>
                      <td className="px-3 py-3.5">
                        <span className="font-mono font-bold text-[#315B43] tabular-nums">
                          {member.memberId}
                        </span>
                        <div className="text-[11px] text-[#6B776D]">
                          Akun: {user.accountStatus}
                        </div>
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="font-semibold text-[#26332A]">{user.fullName}</div>
                        <div className="text-[11px] text-[#6B776D]">
                          {user.gender} · {user.city}
                        </div>
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="font-mono text-[#26332A] tabular-nums">{user.phone}</div>
                        <div className="text-[11px] text-[#6B776D] truncate max-w-[160px]">
                          {user.email || '-'}
                        </div>
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="font-semibold text-[#26332A]">{member.program}</div>
                        <div className="text-[11px] text-[#6B776D]">
                          Metode {member.learningMethod}
                        </div>
                      </td>
                      <td className="px-3 py-3.5">
                        <span
                          className={`font-semibold ${
                            member.bookPurchaseStatus === 'Sudah diverifikasi'
                              ? 'text-[#3B7551]'
                              : member.bookPurchaseStatus === 'Menunggu verifikasi'
                              ? 'text-[#A06A18]'
                              : 'text-[#B44238]'
                          }`}
                        >
                          {member.bookPurchaseStatus}
                        </span>
                      </td>
                      <td className="px-3 py-3.5">
                        <span
                          className={`font-semibold ${
                            member.membershipStatus === 'Member Aktif'
                              ? 'text-[#3B7551]'
                              : member.membershipStatus === 'Menunggu Verifikasi' ||
                                member.membershipStatus === 'Calon Peserta'
                              ? 'text-[#A06A18]'
                              : 'text-[#B44238]'
                          }`}
                        >
                          {member.membershipStatus}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 font-mono text-[#6B776D] tabular-nums">
                        {formatDateID(member.joinDate)}
                      </td>
                      <td className="no-print py-3.5 pl-3 pr-5 text-right">
                        <div className="inline-flex items-center justify-end gap-1">
                          {(member.membershipStatus === 'Menunggu Verifikasi' ||
                            member.membershipStatus === 'Calon Peserta' ||
                            member.bookPurchaseStatus !== 'Sudah diverifikasi') && (
                            <button
                              type="button"
                              onClick={() => handleQuickVerifyAndApprove(p)}
                              title="Verifikasi Buku & Setujui Member Aktif"
                              aria-label={`Verifikasi ${user.fullName}`}
                              className="rounded-lg bg-[#EBF5EE] px-2.5 py-1.5 text-[11px] font-semibold text-[#3B7551] hover:bg-[#D5EBDD] transition-colors cursor-pointer"
                            >
                              Verifikasi
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setDetailProfile(p)}
                            title="Lihat Detail & Kartu Member"
                            aria-label={`Detail ${user.fullName}`}
                            className="rounded-lg p-1.5 text-[#6B776D] hover:bg-[#F3F7F2] hover:text-[#26332A] cursor-pointer"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(p)}
                            title="Edit Data Peserta"
                            aria-label={`Edit ${user.fullName}`}
                            className="rounded-lg p-1.5 text-[#6B776D] hover:bg-[#F3F7F2] hover:text-[#315B43] cursor-pointer"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setResetPasswordModal({
                                profile: p,
                                newPass: `Khot${Math.floor(1000 + Math.random() * 9000)}!`,
                              })
                            }
                            title="Reset Password Member"
                            aria-label={`Reset password ${user.fullName}`}
                            className="rounded-lg p-1.5 text-[#6B776D] hover:bg-[#F3F7F2] hover:text-[#A06A18] cursor-pointer"
                          >
                            <KeyRound className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleAccountStatus(p)}
                            title={
                              user.accountStatus === 'Aktif'
                                ? 'Nonaktifkan Akun'
                                : 'Aktifkan Akun'
                            }
                            aria-label={`Ubah status akun ${user.fullName}`}
                            className="rounded-lg p-1.5 text-[#6B776D] hover:bg-[#F3F7F2] hover:text-[#26332A] cursor-pointer"
                          >
                            {user.accountStatus === 'Aktif' ? (
                              <UserX className="h-4 w-4" />
                            ) : (
                              <UserCheck className="h-4 w-4 text-[#3B7551]" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteProfile(p)}
                            title="Hapus Data Peserta"
                            aria-label={`Hapus ${user.fullName}`}
                            className="rounded-lg p-1.5 text-[#6B776D] hover:bg-[#FCEEEF] hover:text-[#B44238] cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card List (<768px) — PRD Section 5 Layout Mobile */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {paginatedProfiles.map((p) => {
          const { user, member } = p;
          return (
            <div
              key={member.memberId}
              className="rounded-2xl border border-[#E3EAE3] bg-white p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-xs font-bold text-[#315B43] tabular-nums">
                    {member.memberId}
                  </span>
                  <h3 className="text-sm font-bold text-[#26332A]">{user.fullName}</h3>
                  <div className="text-xs text-[#6B776D]">
                    {member.program} · {member.learningMethod} · {user.city}
                  </div>
                </div>
                <span className="text-xs font-semibold text-[#315B43]">
                  {member.membershipStatus}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 border-t border-[#E3EAE3] pt-2.5 text-xs">
                <div>
                  <span className="text-[#6B776D] block">WhatsApp</span>
                  <span className="font-mono font-medium text-[#26332A] tabular-nums">
                    {user.phone}
                  </span>
                </div>
                <div>
                  <span className="text-[#6B776D] block">Status Buku</span>
                  <span className="font-medium text-[#26332A]">
                    {member.bookPurchaseStatus}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[#E3EAE3] pt-3">
                {(member.membershipStatus !== 'Member Aktif' ||
                  member.bookPurchaseStatus !== 'Sudah diverifikasi') && (
                  <button
                    type="button"
                    onClick={() => handleQuickVerifyAndApprove(p)}
                    className="rounded-lg bg-[#EBF5EE] px-3 py-1.5 text-xs font-semibold text-[#3B7551]"
                  >
                    Verifikasi Aktif
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setDetailProfile(p)}
                  className="rounded-lg bg-[#F3F7F2] px-3 py-1.5 text-xs font-semibold text-[#26332A]"
                >
                  Detail & Kartu
                </button>
                <button
                  type="button"
                  onClick={() => openEditModal(p)}
                  className="rounded-lg bg-[#E8EFE7] px-3 py-1.5 text-xs font-semibold text-[#315B43]"
                >
                  Edit
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="no-print flex items-center justify-between rounded-xl border border-[#E3EAE3] bg-white px-4 py-3 text-xs">
          <span className="text-[#6B776D] tabular-nums">
            Halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((c) => Math.max(1, c - 1))}
              className="rounded-lg border border-[#E3EAE3] px-3 py-1.5 font-semibold text-[#26332A] hover:bg-[#F3F7F2] disabled:opacity-40 cursor-pointer"
            >
              Sebelumnya
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((c) => Math.min(totalPages, c + 1))}
              className="rounded-lg border border-[#E3EAE3] px-3 py-1.5 font-semibold text-[#26332A] hover:bg-[#F3F7F2] disabled:opacity-40 cursor-pointer"
            >
               Berikutnya
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 1: TAMBAH PESERTA BARU (PRD Section 8.C) */}
      {/* ===================================================================== */}
      {showAddModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-add-member-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs overflow-y-auto"
        >
          <div className="my-8 w-full max-w-2xl rounded-2xl border border-[#E3EAE3] bg-white p-6 sm:p-8 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E3EAE3] pb-4">
              <div>
                <h2
                  id="modal-add-member-title"
                  className="text-lg font-bold text-[#26332A]"
                >
                  Formulir Pendaftaran Peserta & Pembuatan Akun Member
                </h2>
                <p className="text-xs text-[#6B776D]">
                  Nomor ID Member (format BK-XXXXX) akan dibuat secara otomatis dan unik oleh sistem.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  if (mode === 'add') onNavigate('/admin/members');
                }}
                aria-label="Tutup modal"
                className="rounded-lg p-1.5 text-[#6B776D] hover:bg-[#F3F7F2]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateParticipant} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#26332A]">
                    1. Nama Lengkap Peserta (Ikhwan) *
                  </label>
                  <input
                    type="text"
                    value={formFullName}
                    onChange={(e) => setFormFullName(e.target.value)}
                    placeholder="Contoh: Abdullah Azam"
                    className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] px-3 text-xs text-[#26332A] focus:border-[#315B43] focus:outline-none"
                  />
                  {formErrors.fullName && (
                    <p className="mt-1 text-[11px] text-[#B44238]">{formErrors.fullName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#26332A]">
                    2. Nomor WhatsApp Aktif *
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] px-3 text-xs font-mono text-[#26332A] focus:border-[#315B43] focus:outline-none"
                  />
                  {formErrors.phone && (
                    <p className="mt-1 text-[11px] text-[#B44238]">{formErrors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#26332A]">
                    3. Email (Opsional)
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] px-3 text-xs text-[#26332A] focus:border-[#315B43] focus:outline-none"
                  />
                  {formErrors.email && (
                    <p className="mt-1 text-[11px] text-[#B44238]">{formErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#26332A]">
                    4. Domisili (Kota / Kabupaten) *
                  </label>
                  <input
                    type="text"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    placeholder="Contoh: Bandung / Jakarta Selatan"
                    className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] px-3 text-xs text-[#26332A] focus:border-[#315B43] focus:outline-none"
                  />
                  {formErrors.city && (
                    <p className="mt-1 text-[11px] text-[#B44238]">{formErrors.city}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#26332A]">
                    5. Pilihan Metode Pembelajaran *
                  </label>
                  <select
                    value={formMethod}
                    onChange={(e) => setFormMethod(e.target.value as LearningMethod)}
                    className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] bg-white px-3 text-xs text-[#26332A] focus:border-[#315B43] focus:outline-none"
                  >
                    <option value="Online">Online (Daring Interaktif)</option>
                    <option value="Offline">Offline (Tatap Muka Studio)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#26332A]">
                    6. Pilihan Program Kaligrafi *
                  </label>
                  <select
                    value={formProgram}
                    onChange={(e) => setFormProgram(e.target.value as ProgramType)}
                    className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] bg-white px-3 text-xs text-[#26332A] focus:border-[#315B43] focus:outline-none"
                  >
                    <option value="Khot Naskhi">Khot Naskhi</option>
                    <option value="Khot Riq'ah">Khot Riq&apos;ah</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#26332A]">
                    7. Status Persyaratan Buku Khot
                  </label>
                  <select
                    value={formBookStatus}
                    onChange={(e) => setFormBookStatus(e.target.value as BookPurchaseStatus)}
                    className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] bg-white px-3 text-xs text-[#26332A] focus:border-[#315B43] focus:outline-none"
                  >
                    <option value="Belum membeli">Belum membeli</option>
                    <option value="Menunggu verifikasi">Menunggu verifikasi</option>
                    <option value="Sudah diverifikasi">Sudah diverifikasi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#26332A]">
                    Status Keanggotaan Awal
                  </label>
                  <select
                    value={formMembershipStatus}
                    onChange={(e) => setFormMembershipStatus(e.target.value as MembershipStatus)}
                    className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] bg-white px-3 text-xs text-[#26332A] focus:border-[#315B43] focus:outline-none"
                  >
                    <option value="Calon Peserta">Calon Peserta</option>
                    <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
                    <option value="Member Aktif">Member Aktif</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#26332A]">
                    Password Awal Akun Member
                  </label>
                  <input
                    type="text"
                    value={formInitialPassword}
                    onChange={(e) => setFormInitialPassword(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] px-3 text-xs font-mono text-[#26332A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#26332A]">
                    Catatan Internal Admin (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formAdminNotes}
                    onChange={(e) => setFormAdminNotes(e.target.value)}
                    placeholder="Catatan angkatan / bukti transfer buku..."
                    className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] px-3 text-xs text-[#26332A]"
                  />
                </div>
              </div>

              <label className="flex items-start gap-2.5 rounded-xl bg-[#F3F7F2] p-3.5 text-xs text-[#26332A] cursor-pointer">
                <input
                  type="checkbox"
                  checked={formAgreedRules}
                  onChange={(e) => setFormAgreedRules(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#315B43]"
                />
                <span>
                  8. Konfirmasi bahwa peserta adalah <strong>Laki-laki (Ikhwan)</strong> dan menyetujui ketentuan kepemilikan Buku Panduan Khot serta tata tertib lembaga Belajar Khot.
                </span>
              </label>
              {formErrors.agreedToRules && (
                <p className="text-[11px] text-[#B44238]">{formErrors.agreedToRules}</p>
              )}

              <div className="flex items-center justify-end gap-2 border-t border-[#E3EAE3] pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    if (mode === 'add') onNavigate('/admin/members');
                  }}
                  className="rounded-lg border border-[#E3EAE3] px-4 py-2 text-xs font-semibold text-[#6B776D] hover:bg-[#F3F7F2] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-[#315B43] px-5 py-2 text-xs font-semibold text-white hover:bg-[#264734] disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan & Buat Akun Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: EDIT PESERTA & UBAH STATUS KEANGGOTAAN */}
      {/* ===================================================================== */}
      {editingProfile && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs overflow-y-auto"
        >
          <div className="my-8 w-full max-w-2xl rounded-2xl border border-[#E3EAE3] bg-white p-6 sm:p-8 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E3EAE3] pb-4">
              <div>
                <h2 className="text-lg font-bold text-[#26332A]">
                  Edit Data & Verifikasi Status — {editingProfile.member.memberId}
                </h2>
                <p className="text-xs text-[#6B776D]">
                  Perubahan status keanggotaan akan langsung memperbarui tampilan Kartu Member Digital peserta.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingProfile(null)}
                className="rounded-lg p-1.5 text-[#6B776D] hover:bg-[#F3F7F2]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateParticipant} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#26332A]">
                    Nama Lengkap Peserta
                  </label>
                  <input
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] px-3 text-xs text-[#26332A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#26332A]">
                    Nomor WhatsApp
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] px-3 text-xs font-mono text-[#26332A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#26332A]">Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] px-3 text-xs text-[#26332A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#26332A]">Domisili</label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] px-3 text-xs text-[#26332A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#26332A]">
                    Program Pembelajaran
                  </label>
                  <select
                    value={editProgram}
                    onChange={(e) => setEditProgram(e.target.value as ProgramType)}
                    className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] bg-white px-3 text-xs"
                  >
                    <option value="Khot Naskhi">Khot Naskhi</option>
                    <option value="Khot Riq'ah">Khot Riq&apos;ah</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#26332A]">
                    Metode Belajar
                  </label>
                  <select
                    value={editMethod}
                    onChange={(e) => setEditMethod(e.target.value as LearningMethod)}
                    className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] bg-white px-3 text-xs"
                  >
                    <option value="Online">Online</option>
                    <option value="Offline">Offline</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#26332A]">
                    Status Pembelian Buku Khot
                  </label>
                  <select
                    value={editBookStatus}
                    onChange={(e) => setEditBookStatus(e.target.value as BookPurchaseStatus)}
                    className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] bg-white px-3 text-xs"
                  >
                    <option value="Belum membeli">Belum membeli</option>
                    <option value="Menunggu verifikasi">Menunggu verifikasi</option>
                    <option value="Sudah diverifikasi">Sudah diverifikasi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#26332A]">
                    Status Keanggotaan Resmi
                  </label>
                  <select
                    value={editMembershipStatus}
                    onChange={(e) => setEditMembershipStatus(e.target.value as MembershipStatus)}
                    className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] bg-white px-3 text-xs font-semibold"
                  >
                    <option value="Calon Peserta">Calon Peserta</option>
                    <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
                    <option value="Member Aktif">Member Aktif</option>
                    <option value="Member Nonaktif">Member Nonaktif</option>
                    <option value="Alumni">Alumni</option>
                    <option value="Ditolak">Ditolak</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#26332A]">
                    Status Akses Akun Login
                  </label>
                  <select
                    value={editAccountStatus}
                    onChange={(e) => setEditAccountStatus(e.target.value as AccountStatus)}
                    className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] bg-white px-3 text-xs"
                  >
                    <option value="Aktif">Aktif (Dapat Login)</option>
                    <option value="Nonaktif">Nonaktif (Akses Ditutup)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#26332A]">
                    Catatan Internal Admin
                  </label>
                  <input
                    type="text"
                    value={editAdminNotes}
                    onChange={(e) => setEditAdminNotes(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] px-3 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-[#E3EAE3] pt-4">
                <button
                  type="button"
                  onClick={() => setEditingProfile(null)}
                  className="rounded-lg border border-[#E3EAE3] px-4 py-2 text-xs font-semibold text-[#6B776D]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-[#315B43] px-5 py-2 text-xs font-semibold text-white hover:bg-[#264734]"
                >
                  {submitting ? 'Menyimpan...' : 'Konfirmasi & Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: DETAIL PESERTA & KARTU MEMBER DIGITAL */}
      {/* ===================================================================== */}
      {detailProfile && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs overflow-y-auto"
        >
          <div className="my-8 w-full max-w-3xl rounded-2xl border border-[#E3EAE3] bg-white p-6 sm:p-8 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E3EAE3] pb-4">
              <div>
                <h2 className="text-lg font-bold text-[#26332A]">
                  Detail Lengkap Peserta & Pratinjau Kartu Member
                </h2>
                <p className="text-xs text-[#6B776D]">
                  ID Member: <strong className="font-mono">{detailProfile.member.memberId}</strong> · Terdaftar pada {formatDateID(detailProfile.member.joinDate, true)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailProfile(null)}
                className="rounded-lg p-1.5 text-[#6B776D] hover:bg-[#F3F7F2]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-6">
              <DigitalMemberCard
                profile={detailProfile}
                settings={settings}
                onOpenVerify={(id) => {
                  setDetailProfile(null);
                  onNavigate(`/verify-member/${id}`);
                }}
              />

              <div className="grid grid-cols-1 gap-3 rounded-xl bg-[#F3F7F2] p-4 sm:grid-cols-3 text-xs">
                <div>
                  <span className="text-[#6B776D] block">Domisili & Kontak</span>
                  <strong className="text-[#26332A]">{detailProfile.user.city}</strong>
                  <div className="font-mono text-[#6B776D]">{detailProfile.user.phone}</div>
                </div>
                <div>
                  <span className="text-[#6B776D] block">Login Terakhir</span>
                  <strong className="font-mono text-[#26332A]">
                    {formatDateID(detailProfile.user.lastLoginAt, true)}
                  </strong>
                </div>
                <div>
                  <span className="text-[#6B776D] block">Catatan Internal Admin</span>
                  <strong className="text-[#26332A]">
                    {detailProfile.member.adminNotes || 'Tidak ada catatan khusus.'}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 4: RESET PASSWORD MEMBER */}
      {/* ===================================================================== */}
      {resetPasswordModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-2xl border border-[#E3EAE3] bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-[#26332A]">
              Reset Password Akun Member ({resetPasswordModal.profile.member.memberId})
            </h3>
            <p className="mt-1 text-xs text-[#6B776D]">
              Tetapkan password baru untuk <strong>{resetPasswordModal.profile.user.fullName}</strong>.
            </p>

            {resetPasswordModal.resultPass ? (
              <div className="mt-4 rounded-xl bg-[#EBF5EE] p-4 text-xs text-[#19432D]">
                <div className="font-bold">Password Baru Berhasil Ditetapkan:</div>
                <div className="mt-2 rounded-lg bg-white p-2.5 font-mono text-sm font-bold text-[#315B43]">
                  {resetPasswordModal.resultPass}
                </div>
                <p className="mt-2 text-[11px]">
                  Silakan salin dan kirimkan kredensial ini kepada peserta melalui WhatsApp resmi.
                </p>
                <button
                  type="button"
                  onClick={() => setResetPasswordModal(null)}
                  className="mt-3 w-full rounded-lg bg-[#315B43] py-2 text-xs font-semibold text-white"
                >
                  Selesai
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#26332A]">
                    Password Baru (Min. 6 Karakter)
                  </label>
                  <input
                    type="text"
                    value={resetPasswordModal.newPass}
                    onChange={(e) =>
                      setResetPasswordModal({
                        ...resetPasswordModal,
                        newPass: e.target.value,
                      })
                    }
                    className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] px-3 font-mono text-xs"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setResetPasswordModal(null)}
                    className="rounded-lg border border-[#E3EAE3] px-4 py-2 text-xs font-semibold text-[#6B776D]"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-lg bg-[#315B43] px-4 py-2 text-xs font-semibold text-white"
                  >
                    Reset Password Sekarang
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 5: KONFIRMASI HAPUS PESERTA */}
      {/* ===================================================================== */}
      {confirmDeleteProfile && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-2xl border border-[#B44238]/30 bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3 text-[#B44238]">
              <ShieldAlert className="h-6 w-6 shrink-0" />
              <h3 className="text-base font-bold">Konfirmasi Penghapusan Data Peserta</h3>
            </div>
            <p className="mt-2 text-xs text-[#6B776D] leading-relaxed">
              Apakah Anda yakin ingin menghapus secara permanen data peserta{' '}
              <strong className="text-[#26332A]">{confirmDeleteProfile.user.fullName}</strong> (
              <span className="font-mono font-bold">{confirmDeleteProfile.member.memberId}</span>)?
              Tindakan ini akan mencabut akses login dan kartu member peserta tersebut.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteProfile(null)}
                className="rounded-lg border border-[#E3EAE3] px-4 py-2 text-xs font-semibold text-[#6B776D]"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleDeleteParticipant}
                className="rounded-lg bg-[#B44238] px-4 py-2 text-xs font-semibold text-white hover:bg-[#96352C]"
              >
                {submitting ? 'Menghapus...' : 'Ya, Hapus Permanen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

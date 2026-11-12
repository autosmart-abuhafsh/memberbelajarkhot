import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Copy,
  Download,
  Edit3,
  Eye,
  KeyRound,
  Printer,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  UserX,
  X,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import type {
  AccountStatus,
  AdminRoleType,
  BookPurchaseStatus,
  CombinedMemberProfile,
  InstitutionSettings,
  LearningMethod,
  MembershipStatus,
  ProgramType,
  UserRecord,
} from '../types';
import {
  formatDateID,
  generateMembersCsv,
  validateParticipantForm,
} from '../utils/domainLogic';
import { DigitalMemberCard } from './DigitalMemberCard';

interface AdminMembersViewProps {
  profiles: CombinedMemberProfile[];
  admins?: UserRecord[];
  currentUser?: UserRecord | null;
  settings: InstitutionSettings | null;
  mode: 'members' | 'accounts' | 'add';
  selectedMemberIdParam?: string | null;
  onRefresh: () => Promise<void>;
  onNavigate: (path: string) => void;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

export const AdminMembersView: React.FC<AdminMembersViewProps> = ({
  profiles,
  admins = [],
  currentUser,
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

  // Modals state for regular Members
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

  // Modals state for Admin Utama & Anggota Monitoring
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<UserRecord | null>(null);
  const [confirmDeleteAdmin, setConfirmDeleteAdmin] = useState<UserRecord | null>(null);

  // Add Admin / Anggota Monitoring Form State
  const [admFullName, setAdmFullName] = useState('');
  const [admRoleType, setAdmRoleType] = useState<AdminRoleType>('Anggota Monitoring');
  const [admCustomId, setAdmCustomId] = useState('');
  const [admUsername, setAdmUsername] = useState('');
  const [admPassword, setAdmPassword] = useState('Monitoring2026!');
  const [admPhone, setAdmPhone] = useState('');
  const [admEmail, setAdmEmail] = useState('');
  const [admCity, setAdmCity] = useState('Jakarta Selatan');
  const [admNotes, setAdmNotes] = useState('');

  // Edit Admin Utama / Anggota Monitoring Form State
  const [editAdmFullName, setEditAdmFullName] = useState('');
  const [editAdmRoleType, setEditAdmRoleType] = useState<AdminRoleType>('Admin Utama');
  const [editAdmMemberId, setEditAdmMemberId] = useState('');
  const [editAdmUsername, setEditAdmUsername] = useState('');
  const [editAdmNewPassword, setEditAdmNewPassword] = useState('');
  const [editAdmPhone, setEditAdmPhone] = useState('');
  const [editAdmEmail, setEditAdmEmail] = useState('');
  const [editAdmCity, setEditAdmCity] = useState('');
  const [editAdmAccountStatus, setEditAdmAccountStatus] = useState<AccountStatus>('Aktif');
  const [editAdmNotes, setEditAdmNotes] = useState('');

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

  // Add Participant Form State
  const [formFullName, setFormFullName] = useState('');
  const [formCustomMemberId, setFormCustomMemberId] = useState('');
  const [formCustomUsername, setFormCustomUsername] = useState('');
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

  // Edit Member Form State
  const [editFullName, setEditFullName] = useState('');
  const [editCustomUsername, setEditCustomUsername] = useState('');
  const [editNewPassword, setEditNewPassword] = useState('');
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

  const effectiveAdmins = useMemo(() => {
    if (admins.length > 0) return admins;
    if (currentUser && currentUser.role === 'admin') return [currentUser];
    return [];
  }, [admins, currentUser]);

  const filteredProfiles = useMemo(() => {
    return profiles.filter(({ user, member }) => {
      if (user.role !== 'member') return false;
      const q = searchQuery.trim().toLowerCase();
      if (q) {
        const matchName = user.fullName.toLowerCase().includes(q);
        const matchId = member.memberId.toLowerCase().includes(q);
        const matchUname = user.username.toLowerCase().includes(q);
        const matchPhone = user.phone.toLowerCase().includes(q);
        const matchCity = user.city.toLowerCase().includes(q);
        if (!matchName && !matchId && !matchUname && !matchPhone && !matchCity) return false;
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

  const openEditAdminModal = (adm: UserRecord) => {
    setEditingAdmin(adm);
    setEditAdmFullName(adm.fullName);
    setEditAdmRoleType(
      adm.adminRole ||
        (adm.memberId.toUpperCase().startsWith('MON')
          ? 'Anggota Monitoring'
          : 'Admin Utama')
    );
    setEditAdmMemberId(adm.memberId);
    setEditAdmUsername(adm.username);
    setEditAdmNewPassword(adm.plainPasswordHint || '');
    setEditAdmPhone(adm.phone);
    setEditAdmEmail(adm.email);
    setEditAdmCity(adm.city);
    setEditAdmAccountStatus(adm.accountStatus);
    setEditAdmNotes(adm.notes || '');
  };

  const handleCreateAdminMonitoring = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admFullName.trim()) {
      onShowToast('Nama lengkap Admin / Anggota Monitoring wajib diisi.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiRequest<{
        admin: UserRecord;
        generatedPassword: string;
      }>('/api/admins', {
        method: 'POST',
        body: JSON.stringify({
          fullName: admFullName,
          adminRole: admRoleType,
          customId: admCustomId,
          username: admUsername || admCustomId,
          password: admPassword,
          phone: admPhone,
          email: admEmail,
          city: admCity,
          notes: admNotes,
        }),
      });
      await onRefresh();
      setShowAddAdminModal(false);
      setAdmFullName('');
      setAdmCustomId('');
      setAdmUsername('');
      setAdmPassword('Monitoring2026!');
      setAdmPhone('');
      setAdmEmail('');
      setAdmNotes('');
      onShowToast(
        `${res.admin.adminRole || 'Anggota Monitoring'} ${res.admin.fullName} berhasil didaftarkan (ID Login: ${res.admin.username} | Password: ${res.generatedPassword}).`,
        'success'
      );
    } catch (err: any) {
      onShowToast(err.message || 'Gagal mendaftarkan akun monitoring.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateAdminMonitoring = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin) return;
    setSubmitting(true);
    try {
      const res = await apiRequest<{ admin: UserRecord }>(`/api/admins/${editingAdmin.uid}`, {
        method: 'PUT',
        body: JSON.stringify({
          fullName: editAdmFullName,
          adminRole: editAdmRoleType,
          memberId: editAdmMemberId,
          username: editAdmUsername,
          newPassword: editAdmNewPassword,
          phone: editAdmPhone,
          email: editAdmEmail,
          city: editAdmCity,
          accountStatus: editAdmAccountStatus,
          notes: editAdmNotes,
        }),
      });
      await onRefresh();
      setEditingAdmin(null);
      onShowToast(
        `Profil & Kredensial ${res.admin.fullName} (${res.admin.memberId}) berhasil diperbarui!`,
        'success'
      );
    } catch (err: any) {
      onShowToast(err.message || 'Gagal memperbarui akun Admin / Monitoring.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAdminMonitoring = async () => {
    if (!confirmDeleteAdmin) return;
    setSubmitting(true);
    try {
      await apiRequest(`/api/admins/${confirmDeleteAdmin.uid}`, {
        method: 'DELETE',
      });
      await onRefresh();
      onShowToast(
        `Akun ${confirmDeleteAdmin.fullName} (${confirmDeleteAdmin.memberId}) berhasil dihapus.`,
        'success'
      );
      setConfirmDeleteAdmin(null);
    } catch (err: any) {
      onShowToast(err.message || 'Gagal menghapus akun.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCredentials = (idOrUsername: string, pass: string, labelName: string) => {
    const text = `Kredensial Login Portal Belajar Khot\nNama: ${labelName}\nID Pengguna / Username: ${idOrUsername}\nPassword: ${pass}`;
    try {
      navigator.clipboard.writeText(text);
      onShowToast(`ID & Password untuk ${labelName} berhasil disalin!`, 'success');
    } catch {
      onShowToast(`ID: ${idOrUsername} | Password: ${pass}`, 'success');
    }
  };

  const openEditModal = (p: CombinedMemberProfile) => {
    setEditingProfile(p);
    setEditFullName(p.user.fullName);
    setEditCustomUsername(p.user.username || p.member.memberId);
    setEditNewPassword(p.user.plainPasswordHint || '');
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
          customMemberId: formCustomMemberId,
          customUsername: formCustomUsername || formCustomMemberId,
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
      setFormCustomMemberId('');
      setFormCustomUsername('');
      setFormPhone('');
      setFormEmail('');
      setFormCity('');
      setFormAdminNotes('');
      onShowToast(
        `Peserta ${res.profile.user.fullName} berhasil didaftarkan dengan ID ${res.profile.member.memberId} & Password ${res.generatedPassword}.`,
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
          customUsername: editCustomUsername,
          newPassword: editNewPassword,
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
        `Data & kredensial peserta ${editingProfile.member.memberId} berhasil diperbarui.`,
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
      await onRefresh();
      setResetPasswordModal({
        ...resetPasswordModal,
        resultPass: res.temporaryPassword,
      });
      onShowToast(`Password akun ${res.memberId} berhasil ditetapkan.`, 'success');
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
    <div className="space-y-5 sm:space-y-6">
      {/* Page Header & Primary Actions */}
      <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-[#26332A]">
            {mode === 'accounts'
              ? 'Kelola Admin Utama, Anggota Monitoring & Akun Member'
              : 'Manajemen Calon Peserta, Member & Tim Monitoring'}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#6B776D]">
            Sebagai Pemilik Portal, Anda dapat mengelola profil <strong>Admin Utama</strong>, mendaftarkan <strong>Anggota Monitoring</strong>, serta memberikan <strong>ID Pengguna & Password</strong> untuk seluruh akun.
          </p>
        </div>

        <div className="no-print grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex justify-center items-center gap-1.5 rounded-lg border border-[#C7D7C8] bg-white px-3 py-2.5 text-xs font-semibold text-[#315B43] hover:bg-[#F3F7F2] transition-colors cursor-pointer"
          >
            <Download className="h-4 w-4 shrink-0" />
            <span className="truncate">Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex justify-center items-center gap-1.5 rounded-lg bg-[#E8EFE7] px-3 py-2.5 text-xs font-semibold text-[#315B43] hover:bg-[#DCE6DA] transition-colors cursor-pointer"
          >
            <Printer className="h-4 w-4 shrink-0" />
            <span className="truncate">Cetak Data</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAddAdminModal(true)}
            className="col-span-2 sm:col-span-1 inline-flex justify-center items-center gap-1.5 rounded-lg border border-[#315B43] bg-[#F3F7F2] px-3.5 py-2.5 text-xs font-semibold text-[#315B43] hover:bg-[#E8EFE7] transition-colors cursor-pointer"
          >
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>+ Daftarkan Anggota Monitoring</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="col-span-2 sm:col-span-1 inline-flex justify-center items-center gap-1.5 rounded-lg bg-[#315B43] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#264734] transition-colors cursor-pointer"
          >
            <UserPlus className="h-4 w-4 shrink-0" />
            <span>+ Tambah Peserta / Member</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* PANEL 1: PENGELOLAAN ADMIN UTAMA & ANGGOTA MONITORING */}
      {/* ===================================================================== */}
      <div className="rounded-2xl border border-[#315B43]/30 bg-white p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#E3EAE3] pb-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-[#315B43] text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-[#26332A]">
                  1. Pengelolaan Admin Utama (Pemilik Portal) & Anggota Monitoring
                </h2>
                <span className="rounded-md bg-[#EBF5EE] px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-[#315B43]">
                  {effectiveAdmins.length} Akun Terdaftar
                </span>
              </div>
              <p className="mt-1 text-xs text-[#6B776D] leading-relaxed">
                Kelola nama & kredensial <strong>Admin Utama</strong> Anda atau daftarkan <strong>Anggota Monitoring</strong> yang dapat masuk ke dashboard menggunakan ID & Password yang Anda tetapkan.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto shrink-0">
            {currentUser && (
              <button
                type="button"
                onClick={() => openEditAdminModal(currentUser)}
                className="inline-flex w-full sm:w-auto justify-center items-center gap-1.5 rounded-lg border border-[#315B43] bg-white px-3.5 py-2 text-xs font-semibold text-[#315B43] hover:bg-[#F3F7F2] transition-colors cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5 shrink-0" />
                <span>Edit Profil Admin Utama Saya</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowAddAdminModal(true)}
              className="inline-flex w-full sm:w-auto justify-center items-center gap-1.5 rounded-lg bg-[#315B43] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#264734] transition-colors cursor-pointer"
            >
              <UserPlus className="h-3.5 w-3.5 shrink-0" />
              <span>+ Daftarkan Anggota Monitoring (Beri ID & Pass)</span>
            </button>
          </div>
        </div>

        {/* Desktop Table of Admin Utama & Anggota Monitoring (md+) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E3EAE3] bg-[#F3F7F2] text-[11px] font-semibold uppercase tracking-wider text-[#6B776D]">
                <th className="py-3 pl-4 pr-2">ID Kode</th>
                <th className="px-3 py-3">Nama Lengkap & Peran</th>
                <th className="px-3 py-3">ID Login / Username</th>
                <th className="px-3 py-3">Password Login</th>
                <th className="px-3 py-3">WhatsApp & Domisili</th>
                <th className="px-3 py-3">Status</th>
                <th className="no-print py-3 pl-3 pr-4 text-right">Kelola ID & Password</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3EAE3] text-xs">
              {effectiveAdmins.map((adm) => {
                const roleLabel =
                  adm.adminRole ||
                  (adm.memberId.toUpperCase().startsWith('MON')
                    ? 'Anggota Monitoring'
                    : 'Admin Utama');
                const isMainOwner = roleLabel === 'Admin Utama';
                const displayPass = adm.plainPasswordHint || 'AdminKhot2026!';
                return (
                  <tr key={adm.uid} className="hover:bg-[#FAFCF9]">
                    <td className="py-3.5 pl-4 pr-2">
                      <span className="font-mono font-bold text-[#315B43]">
                        {adm.memberId}
                      </span>
                      {adm.uid === currentUser?.uid && (
                        <span className="ml-1.5 rounded bg-[#EBF5EE] px-1.5 py-0.5 text-[10px] font-bold text-[#315B43]">
                          Anda
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="font-bold text-[#26332A]">{adm.fullName}</div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                        <span
                          className={`inline-flex rounded px-2 py-0.5 text-[10px] font-bold ${
                            isMainOwner
                              ? 'bg-[#315B43] text-white'
                              : 'bg-[#FCF5E8] text-[#A06A18]'
                          }`}
                        >
                          {roleLabel}
                        </span>
                        {adm.notes && (
                          <span className="text-[11px] text-[#6B776D] truncate max-w-[220px]">
                            · {adm.notes}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="rounded bg-[#F3F7F2] px-2 py-1 font-mono font-bold text-[#26332A]">
                        {adm.username}
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="rounded bg-[#F3F7F2] px-2 py-1 font-mono font-semibold text-[#315B43]">
                        {displayPass}
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="font-mono text-[#26332A]">{adm.phone}</div>
                      <div className="text-[11px] text-[#6B776D]">{adm.city}</div>
                    </td>
                    <td className="px-3 py-3.5">
                      <span
                        className={`font-semibold ${
                          adm.accountStatus === 'Aktif'
                            ? 'text-[#3B7551]'
                            : 'text-[#B44238]'
                        }`}
                      >
                        {adm.accountStatus}
                      </span>
                    </td>
                    <td className="no-print py-3.5 pl-3 pr-4 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyCredentials(adm.username, displayPass, adm.fullName)
                          }
                          title="Salin ID & Password untuk dikirim ke WhatsApp"
                          className="inline-flex items-center gap-1 rounded-lg border border-[#E3EAE3] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#26332A] hover:bg-[#F3F7F2] cursor-pointer"
                        >
                          <Copy className="h-3.5 w-3.5 text-[#315B43]" />
                          Salin ID & Pass
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditAdminModal(adm)}
                          title="Ubah Nama, Jabatan, ID Login & Password"
                          className="inline-flex items-center gap-1 rounded-lg bg-[#E8EFE7] px-2.5 py-1.5 text-[11px] font-semibold text-[#315B43] hover:bg-[#DCE6DA] cursor-pointer"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          Edit / Password
                        </button>
                        {adm.uid !== currentUser?.uid && effectiveAdmins.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteAdmin(adm)}
                            title="Hapus Akun Monitoring / Admin"
                            className="rounded-lg p-1.5 text-[#6B776D] hover:bg-[#FCEEEF] hover:text-[#B44238] cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List of Admin Utama & Anggota Monitoring (< md) */}
        <div className="grid grid-cols-1 gap-3 md:hidden">
          {effectiveAdmins.map((adm) => {
            const roleLabel =
              adm.adminRole ||
              (adm.memberId.toUpperCase().startsWith('MON')
                ? 'Anggota Monitoring'
                : 'Admin Utama');
            const isMainOwner = roleLabel === 'Admin Utama';
            const displayPass = adm.plainPasswordHint || 'AdminKhot2026!';
            return (
              <div
                key={adm.uid}
                className={`rounded-xl border p-3.5 space-y-3 ${
                  isMainOwner
                    ? 'border-[#315B43]/40 bg-[#F3F7F2]'
                    : 'border-[#E3EAE3] bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`inline-flex rounded px-2 py-0.5 text-[10px] font-bold ${
                          isMainOwner
                            ? 'bg-[#315B43] text-white'
                            : 'bg-[#FCF5E8] text-[#A06A18]'
                        }`}
                      >
                        {roleLabel}
                      </span>
                      <span className="font-mono text-xs font-bold text-[#315B43]">
                        {adm.memberId}
                      </span>
                      {adm.uid === currentUser?.uid && (
                        <span className="rounded bg-[#EBF5EE] px-1.5 py-0.5 text-[10px] font-bold text-[#315B43]">
                          Anda
                        </span>
                      )}
                    </div>
                    <h3 className="mt-1.5 text-sm font-bold text-[#26332A] break-words">
                      {adm.fullName}
                    </h3>
                    {adm.notes && (
                      <p className="mt-0.5 text-[11px] text-[#6B776D] line-clamp-2">
                        {adm.notes}
                      </p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 text-[11px] font-semibold ${
                      adm.accountStatus === 'Aktif' ? 'text-[#3B7551]' : 'text-[#B44238]'
                    }`}
                  >
                    ● {adm.accountStatus}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 rounded-lg border border-[#E3EAE3] bg-white p-2.5 text-xs">
                  <div className="min-w-0">
                    <span className="text-[10px] text-[#6B776D] block">
                      ID Login / Username
                    </span>
                    <span className="font-mono font-bold text-[#26332A] break-all">
                      {adm.username}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-[#6B776D] block">
                      Password Login
                    </span>
                    <span className="font-mono font-bold text-[#315B43] break-all">
                      {displayPass}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#6B776D]">
                  <span className="font-mono">{adm.phone}</span>
                  <span>{adm.city}</span>
                </div>

                <div className="no-print flex flex-wrap items-center gap-2 border-t border-[#E3EAE3] pt-2.5">
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyCredentials(adm.username, displayPass, adm.fullName)
                    }
                    className="flex-1 inline-flex justify-center items-center gap-1 rounded-lg border border-[#E3EAE3] bg-white px-2.5 py-2 text-xs font-semibold text-[#26332A] hover:bg-[#F3F7F2]"
                  >
                    <Copy className="h-3.5 w-3.5 text-[#315B43]" />
                    <span>Salin ID & Pass</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditAdminModal(adm)}
                    className="flex-1 inline-flex justify-center items-center gap-1 rounded-lg bg-[#315B43] px-2.5 py-2 text-xs font-semibold text-white hover:bg-[#264734]"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Edit / Password</span>
                  </button>
                  {adm.uid !== currentUser?.uid && effectiveAdmins.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteAdmin(adm)}
                      aria-label={`Hapus ${adm.fullName}`}
                      className="rounded-lg border border-[#B44238]/30 bg-[#FCEEEF] p-2 text-[#B44238]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* PANEL 2: PENGELOLAAN PESERTA / MEMBER (BK-XXXXX) */}
      {/* ===================================================================== */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-[#26332A]">
            2. Daftar Akun & Keanggotaan Peserta / Member ({filteredProfiles.length} Peserta)
          </h2>
          <p className="text-xs text-[#6B776D]">
            Kelola data peserta belajar Khot, verifikasi kepemilikan buku, serta berikan/ubah ID Login & Password masing-masing member.
          </p>
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
                <th className="px-3 py-3.5">ID & Password Login</th>
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
                  const memberPass = user.plainPasswordHint || 'MemberKhot123!';
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
                          Pass: <strong className="font-mono text-[#26332A]">{memberPass}</strong>
                        </div>
                        <div className="text-[10px] text-[#6B776D]">
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
                            onClick={() =>
                              handleCopyCredentials(
                                user.username || member.memberId,
                                memberPass,
                                user.fullName
                              )
                            }
                            title="Salin ID & Password Member"
                            className="rounded-lg p-1.5 text-[#6B776D] hover:bg-[#F3F7F2] hover:text-[#315B43] cursor-pointer"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
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
                            title="Edit Data & ID/Password Peserta"
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
                                newPass: memberPass,
                              })
                            }
                            title="Berikan / Ubah Password Member"
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

      {/* Mobile Card List (<768px) */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {paginatedProfiles.map((p) => {
          const { user, member } = p;
          const memberPass = user.plainPasswordHint || 'MemberKhot123!';
          return (
            <div
              key={member.memberId}
              className="rounded-2xl border border-[#E3EAE3] bg-white p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="font-mono text-xs font-bold text-[#315B43] tabular-nums">
                    {member.memberId}
                  </span>
                  <h3 className="text-sm font-bold text-[#26332A] break-words">
                    {user.fullName}
                  </h3>
                  <div className="text-xs text-[#6B776D]">
                    {member.program} · {member.learningMethod} · {user.city}
                  </div>
                </div>
                <span className="shrink-0 text-xs font-semibold text-[#315B43]">
                  {member.membershipStatus}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 rounded-lg border border-[#E3EAE3] bg-[#FAFCF9] p-2.5 text-xs">
                <div className="min-w-0">
                  <span className="text-[10px] text-[#6B776D] block">
                    ID Login / Pass
                  </span>
                  <span className="font-mono font-semibold text-[#26332A] break-all">
                    {user.username || member.memberId} / {memberPass}
                  </span>
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-[#6B776D] block">Status Buku</span>
                  <span className="font-medium text-[#26332A]">
                    {member.bookPurchaseStatus}
                  </span>
                </div>
              </div>

              <div className="no-print grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 border-t border-[#E3EAE3] pt-2.5">
                {(member.membershipStatus !== 'Member Aktif' ||
                  member.bookPurchaseStatus !== 'Sudah diverifikasi') && (
                  <button
                    type="button"
                    onClick={() => handleQuickVerifyAndApprove(p)}
                    className="col-span-2 rounded-lg bg-[#EBF5EE] px-3 py-2 text-xs font-semibold text-[#3B7551] text-center"
                  >
                    ✓ Verifikasi Buku & Aktifkan Member
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    handleCopyCredentials(
                      user.username || member.memberId,
                      memberPass,
                      user.fullName
                    )
                  }
                  className="inline-flex justify-center items-center gap-1 rounded-lg border border-[#E3EAE3] bg-white px-2.5 py-2 text-xs font-semibold text-[#26332A]"
                >
                  <Copy className="h-3.5 w-3.5 text-[#315B43]" />
                  <span>Salin ID/Pass</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDetailProfile(p)}
                  className="inline-flex justify-center items-center gap-1 rounded-lg bg-[#F3F7F2] px-2.5 py-2 text-xs font-semibold text-[#26332A]"
                >
                  <Eye className="h-3.5 w-3.5 text-[#315B43]" />
                  <span>Detail & Kartu</span>
                </button>
                <button
                  type="button"
                  onClick={() => openEditModal(p)}
                  className="inline-flex justify-center items-center gap-1 rounded-lg bg-[#315B43] px-2.5 py-2 text-xs font-semibold text-white"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Edit / Pass</span>
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteProfile(p)}
                  className="inline-flex justify-center items-center gap-1 rounded-lg border border-[#B44238]/30 bg-[#FCEEEF] px-2.5 py-2 text-xs font-semibold text-[#B44238]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Hapus</span>
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
      {/* MODAL A: DAFTARKAN ANGGOTA MONITORING / ADMIN BARU */}
      {/* ===================================================================== */}
      {showAddAdminModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs overflow-y-auto"
        >
          <div className="my-8 w-full max-w-xl rounded-2xl border border-[#E3EAE3] bg-white p-6 sm:p-8 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E3EAE3] pb-4">
              <div>
                <h2 className="text-lg font-bold text-[#26332A]">
                  Daftarkan Anggota Monitoring / Admin & Beri ID Password
                </h2>
                <p className="text-xs text-[#6B776D]">
                  Akun yang didaftarkan dapat login ke portal menggunakan ID Pengguna & Password yang Anda tetapkan di bawah ini.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddAdminModal(false)}
                className="rounded-lg p-1.5 text-[#6B776D] hover:bg-[#F3F7F2]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdminMonitoring} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#26332A]">
                    1. Peran / Kategori Pengurus *
                  </label>
                  <select
                    value={admRoleType}
                    onChange={(e) => setAdmRoleType(e.target.value as AdminRoleType)}
                    className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] bg-white px-3 text-xs font-semibold text-[#26332A]"
                  >
                    <option value="Anggota Monitoring">
                      Anggota Monitoring (Tim Pemantau & Evaluasi Dashboard)
                    </option>
                    <option value="Admin Pengurus">
                      Admin Pengurus (Pengelola Operasional Harian)
                    </option>
                    <option value="Admin Utama">
                      Admin Utama (Pemilik Portal / Super Admin)
                    </option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#26332A]">
                    2. Nama Lengkap Anggota Monitoring / Admin *
                  </label>
                  <input
                    type="text"
                    value={admFullName}
                    onChange={(e) => setAdmFullName(e.target.value)}
                    placeholder="Contoh: Ustadz Ahmad Ridho"
                    className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] px-3 text-xs text-[#26332A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#26332A]">
                    3. Kode ID (Opsional, Otomatis MON-XX)
                  </label>
                  <input
                    type="text"
                    value={admCustomId}
                    onChange={(e) => setAdmCustomId(e.target.value.toUpperCase())}
                    placeholder="Contoh: MON-02 atau ADMIN-02"
                    className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] px-3 font-mono text-xs text-[#26332A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#26332A]">
                    4. ID Pengguna / Username Login *
                  </label>
                  <input
                    type="text"
                    value={admUsername}
                    onChange={(e) => setAdmUsername(e.target.value)}
                    placeholder="Contoh: monitoring2 / ridho"
                    className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] px-3 font-mono text-xs text-[#26332A]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#26332A]">
                    5. Password Login yang Diberikan *
                  </label>
                  <input
                    type="text"
                    value={admPassword}
                    onChange={(e) => setAdmPassword(e.target.value)}
                    placeholder="Minimal 4 karakter"
                    className="mt-1 h-10 w-full rounded-lg border border-[#315B43]/50 bg-[#F3F7F2] px-3 font-mono text-xs font-bold text-[#315B43]"
                  />
                  <span className="mt-1 block text-[11px] text-[#6B776D]">
                    Berikan ID Pengguna dan Password ini kepada Anggota Monitoring agar dapat masuk ke portal.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#26332A]">
                    6. Nomor WhatsApp
                  </label>
                  <input
                    type="text"
                    value={admPhone}
                    onChange={(e) => setAdmPhone(e.target.value)}
                    placeholder="0812xxxxxxxx"
                    className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] px-3 font-mono text-xs text-[#26332A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#26332A]">
                    7. Domisili / Kota
                  </label>
                  <input
                    type="text"
                    value={admCity}
                    onChange={(e) => setAdmCity(e.target.value)}
                    placeholder="Jakarta Selatan"
                    className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] px-3 text-xs text-[#26332A]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#26332A]">
                    8. Catatan Tugas / Keterangan Monitoring
                  </label>
                  <input
                    type="text"
                    value={admNotes}
                    onChange={(e) => setAdmNotes(e.target.value)}
                    placeholder="Contoh: Monitoring kelas Khot Naskhi & verifikasi buku"
                    className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] px-3 text-xs text-[#26332A]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-[#E3EAE3] pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddAdminModal(false)}
                  className="rounded-lg border border-[#E3EAE3] px-4 py-2 text-xs font-semibold text-[#6B776D]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-[#315B43] px-5 py-2 text-xs font-semibold text-white hover:bg-[#264734]"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan & Berikan Akses Login'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL B: EDIT PROFIL, ID & PASSWORD ADMIN UTAMA / ANGGOTA MONITORING */}
      {/* ===================================================================== */}
      {editingAdmin && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs overflow-y-auto"
        >
          <div className="my-8 w-full max-w-xl rounded-2xl border border-[#E3EAE3] bg-white p-6 sm:p-8 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E3EAE3] pb-4">
              <div>
                <h2 className="text-lg font-bold text-[#26332A]">
                  Kelola Profil, ID Login & Password — {editingAdmin.memberId}
                </h2>
                <p className="text-xs text-[#6B776D]">
                  Ubah nama tampilan (misal di pojok kiri bawah sidebar), ID Pengguna, peran, maupun password login.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingAdmin(null)}
                className="rounded-lg p-1.5 text-[#6B776D] hover:bg-[#F3F7F2]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateAdminMonitoring} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#26332A]">
                    Nama Lengkap (Tampil di Portal & Sidebar)
                  </label>
                  <input
                    type="text"
                    value={editAdmFullName}
                    onChange={(e) => setEditAdmFullName(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] px-3 text-xs font-semibold text-[#26332A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#26332A]">
                    Peran / Jabatan
                  </label>
                  <select
                    value={editAdmRoleType}
                    onChange={(e) => setEditAdmRoleType(e.target.value as AdminRoleType)}
                    className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] bg-white px-3 text-xs font-semibold text-[#26332A]"
                  >
                    <option value="Admin Utama">Admin Utama (Pemilik Portal)</option>
                    <option value="Anggota Monitoring">Anggota Monitoring</option>
                    <option value="Admin Pengurus">Admin Pengurus</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#26332A]">
                    Status Akses Akun
                  </label>
                  <select
                    value={editAdmAccountStatus}
                    onChange={(e) => setEditAdmAccountStatus(e.target.value as AccountStatus)}
                    className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] bg-white px-3 text-xs"
                  >
                    <option value="Aktif">Aktif (Dapat Login)</option>
                    <option value="Nonaktif">Nonaktif (Akses Ditutup)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#26332A]">
                    Kode ID (misal ADMIN-01 / MON-01)
                  </label>
                  <input
                    type="text"
                    value={editAdmMemberId}
                    onChange={(e) => setEditAdmMemberId(e.target.value.toUpperCase())}
                    className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] px-3 font-mono text-xs font-bold text-[#315B43]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#26332A]">
                    Username / ID Login
                  </label>
                  <input
                    type="text"
                    value={editAdmUsername}
                    onChange={(e) => setEditAdmUsername(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] px-3 font-mono text-xs font-bold text-[#26332A]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#26332A]">
                    Password Login (Ubah / Tetapkan Password Baru)
                  </label>
                  <input
                    type="text"
                    value={editAdmNewPassword}
                    onChange={(e) => setEditAdmNewPassword(e.target.value)}
                    placeholder="Masukkan password baru"
                    className="mt-1 h-10 w-full rounded-lg border border-[#315B43]/50 bg-[#F3F7F2] px-3 font-mono text-xs font-bold text-[#315B43]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#26332A]">
                    Nomor WhatsApp
                  </label>
                  <input
                    type="text"
                    value={editAdmPhone}
                    onChange={(e) => setEditAdmPhone(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] px-3 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#26332A]">
                    Domisili / Kota
                  </label>
                  <input
                    type="text"
                    value={editAdmCity}
                    onChange={(e) => setEditAdmCity(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] px-3 text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#26332A]">
                    Catatan Tugas / Keterangan
                  </label>
                  <input
                    type="text"
                    value={editAdmNotes}
                    onChange={(e) => setEditAdmNotes(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] px-3 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-[#E3EAE3] pt-4">
                <button
                  type="button"
                  onClick={() => setEditingAdmin(null)}
                  className="rounded-lg border border-[#E3EAE3] px-4 py-2 text-xs font-semibold text-[#6B776D]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-[#315B43] px-5 py-2 text-xs font-semibold text-white hover:bg-[#264734]"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Perubahan Admin / Monitoring'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL C: KONFIRMASI HAPUS AKUN MONITORING / ADMIN */}
      {/* ===================================================================== */}
      {confirmDeleteAdmin && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-2xl border border-[#B44238]/30 bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3 text-[#B44238]">
              <ShieldAlert className="h-6 w-6 shrink-0" />
              <h3 className="text-base font-bold">Hapus Akun Monitoring / Admin</h3>
            </div>
            <p className="mt-2 text-xs text-[#6B776D] leading-relaxed">
              Apakah Anda yakin ingin menghapus akun{' '}
              <strong className="text-[#26332A]">{confirmDeleteAdmin.fullName}</strong> (
              <span className="font-mono font-bold">{confirmDeleteAdmin.memberId}</span>)?
              Akun ini tidak akan bisa login lagi ke dashboard.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteAdmin(null)}
                className="rounded-lg border border-[#E3EAE3] px-4 py-2 text-xs font-semibold text-[#6B776D]"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleDeleteAdminMonitoring}
                className="rounded-lg bg-[#B44238] px-4 py-2 text-xs font-semibold text-white hover:bg-[#96352C]"
              >
                {submitting ? 'Menghapus...' : 'Ya, Hapus Akun'}
              </button>
            </div>
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
                  Formulir Pendaftaran Peserta & Pemberian ID Password Member
                </h2>
                <p className="text-xs text-[#6B776D]">
                  Anda dapat membiarkan Nomor ID dibuat otomatis (BK-XXXXX) atau menentukan ID & Password sendiri.
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

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 rounded-xl bg-[#F3F7F2] p-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#26332A]">
                    ID Member Khusus (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formCustomMemberId}
                    onChange={(e) => setFormCustomMemberId(e.target.value.toUpperCase())}
                    placeholder="Otomatis BK-XXXXX"
                    className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] bg-white px-3 font-mono text-xs text-[#26332A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#26332A]">
                    Username Login (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formCustomUsername}
                    onChange={(e) => setFormCustomUsername(e.target.value)}
                    placeholder="Sama dengan ID Member"
                    className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] bg-white px-3 font-mono text-xs text-[#26332A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#26332A]">
                    Password Login Member *
                  </label>
                  <input
                    type="text"
                    value={formInitialPassword}
                    onChange={(e) => setFormInitialPassword(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-[#315B43]/40 bg-white px-3 font-mono text-xs font-bold text-[#315B43]"
                  />
                </div>
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
      {/* MODAL 2: EDIT PESERTA, ID LOGIN & PASSWORD */}
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
                  Edit Data, Status & Password — {editingProfile.member.memberId}
                </h2>
                <p className="text-xs text-[#6B776D]">
                  Perubahan status keanggotaan maupun kredensial login akan langsung berlaku.
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
                  <label className="block text-xs font-semibold text-[#26332A]">
                    ID Pengguna / Username Login
                  </label>
                  <input
                    type="text"
                    value={editCustomUsername}
                    onChange={(e) => setEditCustomUsername(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] bg-[#F3F7F2] px-3 font-mono text-xs font-bold text-[#26332A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#26332A]">
                    Password Login Member
                  </label>
                  <input
                    type="text"
                    value={editNewPassword}
                    onChange={(e) => setEditNewPassword(e.target.value)}
                    placeholder="Tetapkan password baru"
                    className="mt-1 h-10 w-full rounded-lg border border-[#315B43]/50 bg-[#F3F7F2] px-3 font-mono text-xs font-bold text-[#315B43]"
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
              Tetapkan / Reset Password Member ({resetPasswordModal.profile.member.memberId})
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
                    Password Baru (Min. 4 Karakter)
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
                    Simpan Password Sekarang
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

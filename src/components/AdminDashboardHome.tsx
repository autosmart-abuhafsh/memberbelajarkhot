import React from 'react';
import {
  ArrowRight,
  Award,
  BookOpen,
  Clock,
  CreditCard,
  FileUp,
  Megaphone,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  Wifi,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';
import type {
  ActivityLogRecord,
  AdminDashboardStats,
  AnnouncementRecord,
  CombinedMemberProfile,
  UserRecord,
} from '../types';
import { formatDateID } from '../utils/domainLogic';

interface AdminDashboardHomeProps {
  stats: AdminDashboardStats;
  admins?: UserRecord[];
  currentUser?: UserRecord | null;
  recentMembers: CombinedMemberProfile[];
  recentAnnouncements: AnnouncementRecord[];
  recentLogs: ActivityLogRecord[];
  demoModeEnabled?: boolean;
  onToggleDemoMode?: (enabled: boolean) => void;
  onNavigate: (path: string) => void;
}

export const AdminDashboardHome: React.FC<AdminDashboardHomeProps> = ({
  stats,
  admins = [],
  currentUser,
  recentMembers,
  recentAnnouncements,
  recentLogs,
  demoModeEnabled = true,
  onToggleDemoMode,
  onNavigate,
}) => {
  const totalSafe = Math.max(1, stats.totalParticipants);
  const onlinePct = Math.round((stats.onlineParticipants / totalSafe) * 100);
  const offlinePct = Math.round((stats.offlineParticipants / totalSafe) * 100);
  const naskhiPct = Math.round((stats.naskhiCount / totalSafe) * 100);
  const riqahPct = Math.round((stats.riqahCount / totalSafe) * 100);
  const activePct = Math.round((stats.activeMembers / totalSafe) * 100);

  // 8 Dynamic Stat Cards (PRD Section 7.A)
  const statCards = [
    {
      label: '1. Total Seluruh Peserta',
      value: stats.totalParticipants,
      sub: 'Seluruh pendaftar & anggota ikhwan',
      icon: Users,
      path: '/admin/members',
    },
    {
      label: '2. Total Calon Peserta',
      value: stats.totalCandidates,
      sub: 'Tahap registrasi awal',
      icon: UserPlus,
      path: '/admin/members',
    },
    {
      label: '3. Member Aktif',
      value: stats.activeMembers,
      sub: 'Kartu aktif & terverifikasi',
      icon: UserCheck,
      path: '/admin/members',
    },
    {
      label: '4. Member Nonaktif',
      value: stats.inactiveMembers,
      sub: 'Cuti / akses dinonaktifkan',
      icon: UserX,
      path: '/admin/accounts',
    },
    {
      label: '5. Peserta Online',
      value: stats.onlineParticipants,
      sub: `${onlinePct}% dari total peserta`,
      icon: Wifi,
      path: '/admin/classes',
    },
    {
      label: '6. Peserta Offline',
      value: stats.offlineParticipants,
      sub: `${offlinePct}% tatap muka studio`,
      icon: BookOpen,
      path: '/admin/classes',
    },
    {
      label: '7. Menunggu Verifikasi',
      value: stats.pendingVerification,
      sub: 'Perlu pemeriksaan buku/akun',
      icon: Clock,
      path: '/admin/members',
    },
    {
      label: '8. Pengumuman Aktif',
      value: stats.activeAnnouncements,
      sub: 'Terbit di portal member',
      icon: Megaphone,
      path: '/admin/announcements',
    },
  ];

  // 6 Quick Actions (PRD Section 7.C)
  const quickActions = [
    {
      label: 'Tambah Peserta',
      desc: 'Input formulir peserta baru',
      path: '/admin/members/add',
      icon: UserPlus,
      primary: true,
    },
    {
      label: 'Buat Akun Member',
      desc: 'Kelola ID & password member',
      path: '/admin/accounts',
      icon: UserCheck,
    },
    {
      label: 'Buat Pengumuman',
      desc: 'Siarkan pengumuman resmi',
      path: '/admin/announcements',
      icon: Megaphone,
    },
    {
      label: 'Upload Dokumen',
      desc: 'Bagikan modul PDF & materi',
      path: '/admin/documents',
      icon: FileUp,
    },
    {
      label: 'Tambah Informasi',
      desc: 'Promosi buku & info kegiatan',
      path: '/admin/information',
      icon: Sparkles,
    },
    {
      label: 'Kelola Kartu & Warna',
      desc: 'Cetak PDF & atur warna member',
      path: '/admin/cards',
      icon: CreditCard,
    },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Top Welcome & Summary Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-[#26332A]">
            Pusat Kendali Administrasi Belajar Khot
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#6B776D]">
            Ringkasan statistik keanggotaan real-time, distribusi program Khot Naskhi & Riq&apos;ah, serta audit aktivitas terbaru.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
          {onToggleDemoMode && (
            <button
              type="button"
              onClick={() => onToggleDemoMode(!demoModeEnabled)}
              className={`inline-flex w-full sm:w-auto justify-center items-center gap-2 rounded-lg border px-3.5 py-2.5 text-xs font-semibold transition-colors cursor-pointer ${
                demoModeEnabled
                  ? 'border-[#A06A18]/40 bg-[#FCF5E8] text-[#A06A18] hover:bg-[#F7E8CC]'
                  : 'border-[#315B43]/40 bg-[#EBF5EE] text-[#3B7551] hover:bg-[#DCECE1]'
              }`}
            >
              <span className="truncate">
                {demoModeEnabled
                  ? '● Mode Demo: AKTIF (Klik untuk Kosongkan)'
                  : '○ Mode Fresh / Kosongan (Klik untuk Data Demo)'}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onNavigate('/admin/members/add')}
            className="inline-flex w-full sm:w-auto justify-center items-center gap-2 rounded-lg bg-[#315B43] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#264734] transition-colors cursor-pointer"
          >
            <UserPlus className="h-4 w-4 shrink-0" />
            <span>Tambah Peserta Baru</span>
          </button>
        </div>
      </div>

      {/* 8 Stat Cards Grid (2 columns on mobile for clean compact scanning, 4 on desktop) */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              type="button"
              onClick={() => onNavigate(card.path)}
              className="group flex flex-col justify-between rounded-2xl border border-[#E3EAE3] bg-white p-3.5 sm:p-5 text-left hover:border-[#C7D7C8] transition-all cursor-pointer min-w-0"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[11px] sm:text-xs font-semibold text-[#6B776D] group-hover:text-[#26332A] leading-snug">
                  {card.label}
                </span>
                <div className="flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-[#E8EFE7] text-[#315B43]">
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
              </div>
              <div className="mt-2.5 sm:mt-3">
                <div className="font-mono text-xl sm:text-3xl font-bold tracking-tight text-[#26332A] tabular-nums">
                  {card.value}
                </div>
                <div className="mt-0.5 text-[10px] sm:text-[11px] text-[#6B776D] line-clamp-1">
                  {card.sub}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick Actions Bar (PRD Section 7.C) */}
      <div className="rounded-2xl border border-[#E3EAE3] bg-white p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-1">
          <h2 className="text-sm sm:text-base font-bold text-[#26332A]">
            Pintasan Tindakan Cepat (Quick Actions)
          </h2>
          <span className="text-[11px] sm:text-xs text-[#6B776D]">
            Akses langsung modul utama
          </span>
        </div>
        <div className="mt-3.5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          {quickActions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.label}
                type="button"
                onClick={() => onNavigate(act.path)}
                className={`flex flex-col items-start justify-between rounded-xl p-3 sm:p-3.5 text-left transition-colors cursor-pointer min-w-0 ${
                  act.primary
                    ? 'bg-[#315B43] text-white hover:bg-[#264734]'
                    : 'bg-[#F3F7F2] text-[#26332A] hover:bg-[#E8EFE7]'
                }`}
              >
                <Icon
                  className={`h-4 w-4 sm:h-5 sm:w-5 ${
                    act.primary ? 'text-[#A3D1B3]' : 'text-[#315B43]'
                  }`}
                />
                <div className="mt-2.5 min-w-0 w-full">
                  <div className="text-xs font-bold truncate">{act.label}</div>
                  <div
                    className={`mt-0.5 text-[10px] sm:text-[11px] line-clamp-1 ${
                      act.primary ? 'text-white/80' : 'text-[#6B776D]'
                    }`}
                  >
                    {act.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Pengelolaan Admin Utama & Anggota Monitoring Section */}
      <div className="rounded-2xl border border-[#315B43]/30 bg-white p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#E3EAE3] pb-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-[#315B43] text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-[#26332A]">
                  Pengelolaan Admin Utama & Anggota Monitoring
                </h2>
                <span className="rounded-md bg-[#EBF5EE] px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-[#315B43]">
                  {admins.length || 1} Akun Pengurus & Monitoring
                </span>
              </div>
              <p className="mt-1 text-xs text-[#6B776D] leading-relaxed">
                Sebagai Pemilik Portal, Anda dapat mengubah profil/kredensial <strong>Admin Utama</strong> serta mendaftarkan <strong>Anggota Monitoring</strong> dan memberikan <strong>ID Pengguna & Password</strong> khusus.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('/admin/accounts')}
              className="inline-flex w-full sm:w-auto justify-center items-center gap-1.5 rounded-lg border border-[#315B43] bg-[#F3F7F2] px-3.5 py-2 text-xs font-semibold text-[#315B43] hover:bg-[#E8EFE7] transition-colors cursor-pointer"
            >
              <KeyRound className="h-3.5 w-3.5 shrink-0" />
              <span>Kelola Admin Utama & Beri ID Password</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/admin/accounts')}
              className="inline-flex w-full sm:w-auto justify-center items-center gap-1.5 rounded-lg bg-[#315B43] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#264734] transition-colors cursor-pointer"
            >
              <UserPlus className="h-3.5 w-3.5 shrink-0" />
              <span>+ Daftarkan Anggota Monitoring</span>
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(admins.length > 0 ? admins : currentUser ? [currentUser] : []).map((adm) => {
            const roleBadge =
              adm.adminRole ||
              (adm.memberId.toUpperCase().startsWith('MON')
                ? 'Anggota Monitoring'
                : 'Admin Utama');
            const isMainOwner = roleBadge === 'Admin Utama';
            return (
              <div
                key={adm.uid}
                className={`flex flex-col justify-between rounded-xl border p-3.5 sm:p-4 ${
                  isMainOwner
                    ? 'border-[#315B43]/40 bg-[#F3F7F2]'
                    : 'border-[#E3EAE3] bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] sm:text-[11px] font-bold ${
                        isMainOwner
                          ? 'bg-[#315B43] text-white'
                          : 'bg-[#FCF5E8] text-[#A06A18]'
                      }`}
                    >
                      {roleBadge}
                    </span>
                    <span
                      className={`text-[11px] font-semibold ${
                        adm.accountStatus === 'Aktif'
                          ? 'text-[#3B7551]'
                          : 'text-[#B44238]'
                      }`}
                    >
                      ● {adm.accountStatus}
                    </span>
                  </div>
                  <div className="mt-2 text-sm font-bold text-[#26332A] break-words">
                    {adm.fullName}
                  </div>
                  <div className="mt-1.5 space-y-1 text-[11px] text-[#6B776D]">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span>
                        ID:{' '}
                        <strong className="font-mono text-[#315B43]">
                          {adm.memberId}
                        </strong>
                      </span>
                      <span>·</span>
                      <span>
                        Login:{' '}
                        <strong className="font-mono text-[#26332A]">
                          {adm.username}
                        </strong>
                      </span>
                    </div>
                    <div>
                      Password:{' '}
                      <strong className="font-mono text-[#26332A] break-all">
                        {adm.plainPasswordHint || 'AdminKhot2026!'}
                      </strong>
                    </div>
                    {adm.notes && (
                      <div className="text-[11px] italic text-[#6B776D] line-clamp-1">
                        {adm.notes}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-[#E3EAE3] pt-2.5">
                  <span className="font-mono text-[11px] text-[#6B776D]">{adm.phone}</span>
                  <button
                    type="button"
                    onClick={() => onNavigate('/admin/accounts')}
                    className="text-xs font-semibold text-[#315B43] hover:underline cursor-pointer"
                  >
                    Ubah ID / Password →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts & Distribution Analytics (PRD Section 7.B) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Growth & Program Distribution */}
        <div className="rounded-2xl border border-[#E3EAE3] bg-white p-5 sm:p-6 lg:col-span-7 space-y-5">
          <div>
            <h2 className="text-base font-bold text-[#26332A]">
              Distribusi Program, Metode Belajar & Pertumbuhan Angkatan
            </h2>
            <p className="text-xs text-[#6B776D]">
              Perbandingan dinamis berdasarkan basis data peserta terdaftar saat ini.
            </p>
          </div>

          <div className="space-y-4">
            {/* Online vs Offline Bar */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-[#26332A]">
                <span>Metode Pembelajaran: Online ({stats.onlineParticipants}) vs Offline ({stats.offlineParticipants})</span>
                <span className="font-mono tabular-nums">
                  {onlinePct}% / {offlinePct}%
                </span>
              </div>
              <div className="mt-1.5 flex h-3 w-full overflow-hidden rounded-full bg-[#E8EFE7]">
                <div
                  className="bg-[#315B43] transition-all"
                  style={{ width: `${onlinePct}%` }}
                />
                <div
                  className="bg-[#6F8F72] transition-all"
                  style={{ width: `${offlinePct}%` }}
                />
              </div>
            </div>

            {/* Khot Naskhi vs Khot Riq'ah Bar */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-[#26332A]">
                <span>
                  Program Kaligrafi: Khot Naskhi ({stats.naskhiCount}) vs Khot Riq&apos;ah ({stats.riqahCount})
                </span>
                <span className="font-mono tabular-nums">
                  {naskhiPct}% / {riqahPct}%
                </span>
              </div>
              <div className="mt-1.5 flex h-3 w-full overflow-hidden rounded-full bg-[#E8EFE7]">
                <div
                  className="bg-[#315B43] transition-all"
                  style={{ width: `${naskhiPct}%` }}
                />
                <div
                  className="bg-[#A06A18] transition-all"
                  style={{ width: `${riqahPct}%` }}
                />
              </div>
            </div>

            {/* Active Membership Verification Rate */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-[#26332A]">
                <span>
                  Rasio Verifikasi Member Aktif ({stats.activeMembers} dari {stats.totalParticipants} peserta)
                </span>
                <span className="font-mono tabular-nums">{activePct}%</span>
              </div>
              <div className="mt-1.5 flex h-3 w-full overflow-hidden rounded-full bg-[#E8EFE7]">
                <div
                  className="bg-[#3B7551] transition-all"
                  style={{ width: `${activePct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Cohort Growth Bar Chart */}
          <div className="border-t border-[#E3EAE3] pt-4">
            <div className="text-xs font-semibold text-[#6B776D] mb-3">
              Tren Pendaftaran Peserta per Periode (2026)
            </div>
            <div className="grid grid-cols-5 gap-3 items-end h-28 pt-4">
              {[
                { month: 'Jul', count: 1 },
                { month: 'Agu', count: 2 },
                { month: 'Sep', count: 4 },
                { month: 'Okt', count: 5 },
                { month: 'Nov', count: stats.totalParticipants },
              ].map((bar) => {
                const maxVal = Math.max(6, stats.totalParticipants);
                const heightPct = Math.max(18, Math.round((bar.count / maxVal) * 100));
                return (
                  <div key={bar.month} className="flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="font-mono text-[11px] font-bold text-[#315B43] tabular-nums">
                      {bar.count}
                    </span>
                    <div
                      className="w-full max-w-[44px] rounded-t-lg bg-[#315B43]"
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[11px] font-medium text-[#6B776D]">
                      {bar.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Recent Activity Log */}
        <div className="rounded-2xl border border-[#E3EAE3] bg-white p-5 sm:p-6 lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#26332A]">
                Aktivitas Administratif Terbaru
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('/admin/activity-logs')}
                className="text-xs font-semibold text-[#315B43] hover:underline cursor-pointer"
              >
                Lihat Semua
              </button>
            </div>
            <div className="mt-4 divide-y divide-[#E3EAE3]">
              {recentLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between text-[11px] text-[#6B776D]">
                    <span className="font-mono font-semibold text-[#315B43]">
                      {log.activityType}
                    </span>
                    <span className="font-mono tabular-nums">
                      {formatDateID(log.createdAt, true)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-[#26332A] line-clamp-2">
                    {log.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-[#F3F7F2] p-3.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-[#26332A]">
              <Award className="h-4 w-4 text-[#315B43]" />
              <span>
                Buku Terverifikasi: <strong>{stats.bookVerifiedCount}</strong> peserta
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('/admin/members')}
              className="font-semibold text-[#315B43] hover:underline cursor-pointer"
            >
              Kelola →
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Split: Recent Participants & Recent Announcements */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Daftar Peserta Terbaru */}
        <div className="rounded-2xl border border-[#E3EAE3] bg-white p-5 sm:p-6 lg:col-span-7">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#26332A]">Daftar Peserta Terbaru</h2>
            <button
              type="button"
              onClick={() => onNavigate('/admin/members')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#315B43] hover:underline cursor-pointer"
            >
              Kelola Seluruh Peserta
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-4 divide-y divide-[#E3EAE3]">
            {recentMembers.map(({ user, member }) => (
              <div
                key={member.memberId}
                className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#315B43] tabular-nums">
                      {member.memberId}
                    </span>
                    <span className="text-xs font-bold text-[#26332A]">{user.fullName}</span>
                  </div>
                  <div className="text-[11px] text-[#6B776D]">
                    {member.program} · {member.learningMethod} · Buku: {member.bookPurchaseStatus}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-semibold ${
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
                  <button
                    type="button"
                    onClick={() => onNavigate(`/admin/members/${member.memberId}`)}
                    className="rounded-lg bg-[#F3F7F2] px-2.5 py-1 text-xs font-semibold text-[#315B43] hover:bg-[#E8EFE7] cursor-pointer"
                  >
                    Detail
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pengumuman Terbaru */}
        <div className="rounded-2xl border border-[#E3EAE3] bg-white p-5 sm:p-6 lg:col-span-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#26332A]">Pengumuman Resmi Terbaru</h2>
            <button
              type="button"
              onClick={() => onNavigate('/admin/announcements')}
              className="text-xs font-semibold text-[#315B43] hover:underline cursor-pointer"
            >
              Kelola
            </button>
          </div>

          <div className="mt-4 divide-y divide-[#E3EAE3]">
            {recentAnnouncements.map((ann) => (
              <div key={ann.id} className="py-3 first:pt-0 last:pb-0">
                <div className="text-[11px] text-[#6B776D] tabular-nums">
                  {ann.category} · {formatDateID(ann.publishAt)}
                </div>
                <div className="mt-0.5 text-xs font-bold text-[#26332A]">{ann.title}</div>
                <p className="mt-1 text-xs text-[#6B776D] line-clamp-2">{ann.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

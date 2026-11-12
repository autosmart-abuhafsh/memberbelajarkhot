import React, { useCallback, useEffect, useState } from 'react';
import {
  Bell,
  BookOpen,
  CheckCircle2,
  CreditCard,
  FileText,
  FolderOpen,
  History,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  MessageCircle,
  Moon,
  Palette,
  Settings,
  ShieldAlert,
  Sparkles,
  Sun,
  User,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import {
  AdminAnnouncementsView,
  AdminCardsStudioView,
  AdminClassesView,
  AdminDocumentsView,
  AdminInformationView,
  AdminLogsNotificationsSettingsView,
} from './components/AdminContentViews';
import { AdminDashboardHome } from './components/AdminDashboardHome';
import { AdminMembersView } from './components/AdminMembersView';
import { MemberPortalViews } from './components/MemberPortalViews';
import {
  HelpLoginPage,
  LoginPage,
  VerifyMemberPage,
} from './components/PublicViews';
import { BrandLogo } from './components/BrandLogo';
import { apiRequest, getStoredToken, setStoredToken } from './services/api';
import type {
  ActivityLogRecord,
  AdminDashboardStats,
  AnnouncementRecord,
  ClassRecord,
  CombinedMemberProfile,
  DocumentRecord,
  InformationRecord,
  InstitutionSettings,
  MemberRecord,
  NotificationRecord,
  ReadReceiptRecord,
  UserRecord,
} from './types';

import { resolveMemberThemeColors } from './utils/domainLogic';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(
    () => window.location.pathname || '/login'
  );
  const [authReady, setAuthReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserRecord | null>(null);
  const [currentMember, setCurrentMember] = useState<MemberRecord | null>(null);

  // Dark Mode / Light Mode state persisted in localStorage
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
    try {
      const saved = window.localStorage.getItem('belajar_khot_theme_mode');
      return saved === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (themeMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      window.localStorage.setItem('belajar_khot_theme_mode', themeMode);
    } catch {
      // ignore storage errors
    }
  }, [themeMode]);

  const toggleThemeMode = useCallback(() => {
    setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // Shared application state loaded from backend
  const [adminStats, setAdminStats] = useState<AdminDashboardStats>({
    totalParticipants: 0,
    totalCandidates: 0,
    activeMembers: 0,
    inactiveMembers: 0,
    onlineParticipants: 0,
    offlineParticipants: 0,
    pendingVerification: 0,
    activeAnnouncements: 0,
    naskhiCount: 0,
    riqahCount: 0,
    bookVerifiedCount: 0,
  });
  const [profiles, setProfiles] = useState<CombinedMemberProfile[]>([]);
  const [admins, setAdmins] = useState<UserRecord[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>([]);
  const [readReceipts, setReadReceipts] = useState<ReadReceiptRecord[]>([]);
  const [readAnnouncementIds, setReadAnnouncementIds] = useState<string[]>([]);
  const [information, setInformation] = useState<InformationRecord[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogRecord[]>([]);
  const [settings, setSettings] = useState<InstitutionSettings | null>(null);

  // Sync browser tab favicon & theme-color dynamically with institution settings
  useEffect(() => {
    const resolvedTheme = resolveMemberThemeColors(settings, currentMember);
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      themeMeta.setAttribute('content', resolvedTheme.primaryColor);
    }

    const iconHref =
      settings?.logoURL && settings.logoURL.trim().length > 4
        ? settings.logoURL.trim()
        : '/favicon.svg';
    const iconLinks = document.querySelectorAll<HTMLLinkElement>(
      'link[rel="icon"], link[rel="alternate icon"], link[rel="apple-touch-icon"]'
    );
    iconLinks.forEach((link) => {
      if (link.getAttribute('href') !== iconHref) {
        link.setAttribute('href', iconHref);
      }
    });
  }, [settings, currentMember]);

  // UI state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' = 'success') => {
      setToast({ message, type });
      setTimeout(() => {
        setToast((prev) => (prev?.message === message ? null : prev));
      }, 4000);
    },
    []
  );

  const navigate = useCallback((to: string) => {
    window.history.pushState({}, '', to);
    setCurrentPath(to);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setCurrentPath(window.location.pathname || '/login');
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const loadPortalData = useCallback(async (role: 'admin' | 'member') => {
    try {
      if (role === 'admin') {
        const [
          dashRes,
          membersRes,
          annRes,
          infoRes,
          docsRes,
          clsRes,
          notifRes,
          logsRes,
        ] = await Promise.all([
          apiRequest<any>('/api/dashboard'),
          apiRequest<{ profiles: CombinedMemberProfile[]; admins?: UserRecord[] }>('/api/members'),
          apiRequest<{
            announcements: AnnouncementRecord[];
            readReceipts: ReadReceiptRecord[];
          }>('/api/announcements'),
          apiRequest<{ information: InformationRecord[] }>('/api/information'),
          apiRequest<{ documents: DocumentRecord[] }>('/api/documents'),
          apiRequest<{ classes: ClassRecord[] }>('/api/classes'),
          apiRequest<{ notifications: NotificationRecord[] }>('/api/notifications'),
          apiRequest<{ logs: ActivityLogRecord[] }>('/api/activity-logs'),
        ]);

        if (dashRes?.stats) setAdminStats(dashRes.stats);
        if (dashRes?.settings) setSettings(dashRes.settings);
        setProfiles(Array.isArray(membersRes?.profiles) ? membersRes.profiles : []);
        if (Array.isArray(membersRes?.admins)) {
          setAdmins(membersRes.admins);
          setCurrentUser((prev) => {
            if (!prev) return prev;
            const updatedSelf = membersRes.admins?.find((a) => a.uid === prev.uid);
            return updatedSelf ? { ...prev, ...updatedSelf } : prev;
          });
        }
        setAnnouncements(Array.isArray(annRes?.announcements) ? annRes.announcements : []);
        setReadReceipts(Array.isArray(annRes?.readReceipts) ? annRes.readReceipts : []);
        setInformation(Array.isArray(infoRes?.information) ? infoRes.information : []);
        setDocuments(Array.isArray(docsRes?.documents) ? docsRes.documents : []);
        setClasses(Array.isArray(clsRes?.classes) ? clsRes.classes : []);
        setNotifications(Array.isArray(notifRes?.notifications) ? notifRes.notifications : []);
        setActivityLogs(Array.isArray(logsRes?.logs) ? logsRes.logs : []);
      } else {
        const [dashRes, notifRes] = await Promise.all([
          apiRequest<any>('/api/dashboard'),
          apiRequest<{ notifications: NotificationRecord[] }>('/api/notifications'),
        ]);
        if (dashRes?.user) setCurrentUser(dashRes.user);
        if (dashRes?.member !== undefined) setCurrentMember(dashRes.member);
        setAnnouncements(Array.isArray(dashRes?.announcements) ? dashRes.announcements : []);
        setReadAnnouncementIds(
          Array.isArray(dashRes?.readAnnouncementIds) ? dashRes.readAnnouncementIds : []
        );
        setInformation(Array.isArray(dashRes?.information) ? dashRes.information : []);
        setDocuments(Array.isArray(dashRes?.documents) ? dashRes.documents : []);
        setClasses(Array.isArray(dashRes?.classes) ? dashRes.classes : []);
        setSettings(dashRes?.settings || null);
        setNotifications(Array.isArray(notifRes?.notifications) ? notifRes.notifications : []);
      }
    } catch (err) {
      console.error('Error loading portal data:', err);
    }
  }, []);

  // Initial session check on boot
  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setAuthReady(true);
      return;
    }

    apiRequest<{ user: UserRecord; member: MemberRecord | null }>('/api/auth/me')
      .then(async (res) => {
        if (!res || !res.user || !res.user.role) {
          throw new Error('Invalid session user payload');
        }
        setCurrentUser(res.user);
        setCurrentMember(res.member || null);
        await loadPortalData(res.user.role);
        setAuthReady(true);
        if (
          window.location.pathname === '/' ||
          window.location.pathname === '/login'
        ) {
          navigate(
            res.user.role === 'admin' ? '/admin/dashboard' : '/member/dashboard'
          );
        }
      })
      .catch(() => {
        setStoredToken(null);
        setCurrentUser(null);
        setCurrentMember(null);
        setAuthReady(true);
      });
  }, [loadPortalData, navigate]);

  const handleLoginSuccess = async (payload: {
    token: string;
    user: UserRecord;
    member: MemberRecord | null;
  }) => {
    if (!payload || !payload.user || !payload.user.role) {
      showToast('Gagal memuat sesi pengguna. Silakan coba login kembali.', 'error');
      return;
    }
    setStoredToken(payload.token);
    setCurrentUser(payload.user);
    setCurrentMember(payload.member || null);
    await loadPortalData(payload.user.role);
    const targetRoute =
      payload.user.role === 'admin' ? '/admin/dashboard' : '/member/dashboard';
    navigate(targetRoute);
    showToast(`Selamat datang kembali, ${payload.user.fullName}.`, 'success');
  };

  const handleLogout = async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore logout error
    }
    setStoredToken(null);
    setCurrentUser(null);
    setCurrentMember(null);
    navigate('/login');
  };

  const handleRefresh = useCallback(async () => {
    if (currentUser) {
      await loadPortalData(currentUser.role);
    }
  }, [currentUser, loadPortalData]);

  const handleToggleDemoMode = useCallback(
    async (enableDemo: boolean) => {
      try {
        await apiRequest('/api/demo/toggle', {
          method: 'POST',
          body: JSON.stringify({ enabled: enableDemo }),
        });
        await handleRefresh();
        showToast(
          enableDemo
            ? 'Mode Demo DIHIDUPKAN: Data contoh ditampilkan kembali.'
            : 'Mode Demo DIMATIKAN: Aplikasi kini bersih & fresh (kosongan).',
          'success'
        );
      } catch (err: any) {
        showToast(err.message || 'Gagal mengubah Mode Demo.', 'error');
      }
    },
    [handleRefresh, showToast]
  );

  // ==========================================================================
  // PUBLIC ROUTES (/verify-member/:id, /help-login, /login)
  // ==========================================================================
  if (currentPath.startsWith('/verify-member/')) {
    const memberIdParam = decodeURIComponent(
      currentPath.replace('/verify-member/', '')
    );
    return (
      <VerifyMemberPage
        memberIdParam={memberIdParam}
        onNavigate={navigate}
        themeMode={themeMode}
        onToggleTheme={toggleThemeMode}
      />
    );
  }

  if (currentPath === '/help-login') {
    return (
      <HelpLoginPage
        onNavigate={navigate}
        themeMode={themeMode}
        onToggleTheme={toggleThemeMode}
      />
    );
  }

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFCF9] text-sm font-medium text-[#315B43]">
        Memuat Portal Resmi Belajar Khot...
      </div>
    );
  }

  if (!currentUser) {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onNavigate={navigate}
        themeMode={themeMode}
        onToggleTheme={toggleThemeMode}
      />
    );
  }

  // ==========================================================================
  // ROLE-BASED ACCESS CONTROL (RBAC) GUARD (PRD Section 4 & Section 24)
  // ==========================================================================
  if (currentUser.role === 'member' && currentPath.startsWith('/admin')) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAFCF9] p-6 text-center">
        <div className="max-w-md rounded-2xl border border-[#B44238]/30 bg-white p-8 shadow-sm">
          <ShieldAlert className="mx-auto h-12 w-12 text-[#B44238]" />
          <h1 className="mt-4 text-xl font-bold text-[#26332A]">
            Akses Ditolak (403 Forbidden)
          </h1>
          <p className="mt-2 text-xs text-[#6B776D] leading-relaxed">
            Maaf, akun Anda terdaftar sebagai <strong>Member / Peserta ({currentUser.memberId})</strong> dan tidak memiliki kewenangan untuk mengakses halaman Administrasi Lembaga.
          </p>
          <button
            type="button"
            onClick={() => navigate('/member/dashboard')}
            className="mt-6 w-full rounded-lg bg-[#315B43] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#264734] cursor-pointer"
          >
            Kembali ke Dashboard Member Saya
          </button>
        </div>
      </div>
    );
  }

  // Navigation items per role
  const adminNavItems = [
    { label: 'Dashboard Utama', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Data Peserta & Member', path: '/admin/members', icon: Users },
    { label: 'Manajemen Akun', path: '/admin/accounts', icon: UserCheck },
    { label: 'Kartu Member Digital', path: '/admin/cards', icon: CreditCard },
    { label: 'Pusat Pengumuman', path: '/admin/announcements', icon: Megaphone },
    { label: 'Pusat Informasi & Buku', path: '/admin/information', icon: Sparkles },
    { label: 'Pusat Dokumen', path: '/admin/documents', icon: FolderOpen },
    { label: 'Kelas & Program Khot', path: '/admin/classes', icon: BookOpen },
    { label: 'Notifikasi Sistem', path: '/admin/notifications', icon: Bell },
    { label: 'Riwayat Aktivitas', path: '/admin/activity-logs', icon: History },
    { label: 'Pengaturan Lembaga', path: '/admin/settings', icon: Settings },
  ];

  const memberNavItems = [
    { label: 'Dashboard Saya', path: '/member/dashboard', icon: LayoutDashboard },
    { label: 'Profil Saya', path: '/member/profile', icon: User },
    { label: 'Kartu Member', path: '/member/card', icon: CreditCard },
    { label: 'Pengumuman Resmi', path: '/member/announcements', icon: Megaphone },
    { label: 'Pusat Informasi', path: '/member/information', icon: Sparkles },
    { label: 'Pusat Dokumen', path: '/member/documents', icon: FileText },
    { label: 'Informasi Kelas', path: '/member/classes', icon: BookOpen },
    { label: 'Grup WhatsApp', path: '/member/whatsapp', icon: MessageCircle },
    { label: 'Notifikasi Saya', path: '/member/notifications', icon: Bell },
    { label: 'Pengaturan Akun', path: '/member/settings', icon: Settings },
  ];

  const navItems = currentUser.role === 'admin' ? adminNavItems : memberNavItems;
  const unreadNotifCount = notifications.filter((n) => !n.isRead).length;

  // Render active main content view
  const renderMainView = () => {
    if (currentUser.role === 'admin') {
      if (currentPath === '/admin/members/add') {
        return (
          <AdminMembersView
            profiles={profiles}
            admins={admins}
            currentUser={currentUser}
            settings={settings}
            mode="add"
            onRefresh={handleRefresh}
            onNavigate={navigate}
            onShowToast={showToast}
          />
        );
      }
      if (currentPath.startsWith('/admin/members/')) {
        const memId = currentPath.replace('/admin/members/', '');
        return (
          <AdminMembersView
            profiles={profiles}
            admins={admins}
            currentUser={currentUser}
            settings={settings}
            mode="members"
            selectedMemberIdParam={memId}
            onRefresh={handleRefresh}
            onNavigate={navigate}
            onShowToast={showToast}
          />
        );
      }
      if (currentPath === '/admin/members') {
        return (
          <AdminMembersView
            profiles={profiles}
            admins={admins}
            currentUser={currentUser}
            settings={settings}
            mode="members"
            onRefresh={handleRefresh}
            onNavigate={navigate}
            onShowToast={showToast}
          />
        );
      }
      if (currentPath === '/admin/accounts') {
        return (
          <AdminMembersView
            profiles={profiles}
            admins={admins}
            currentUser={currentUser}
            settings={settings}
            mode="accounts"
            onRefresh={handleRefresh}
            onNavigate={navigate}
            onShowToast={showToast}
          />
        );
      }
      if (currentPath === '/admin/announcements') {
        return (
          <AdminAnnouncementsView
            announcements={announcements}
            readReceipts={readReceipts}
            onRefresh={handleRefresh}
            onShowToast={showToast}
          />
        );
      }
      if (currentPath === '/admin/information') {
        return (
          <AdminInformationView
            information={information}
            onRefresh={handleRefresh}
            onShowToast={showToast}
          />
        );
      }
      if (currentPath === '/admin/documents') {
        return (
          <AdminDocumentsView
            documents={documents}
            onRefresh={handleRefresh}
            onShowToast={showToast}
          />
        );
      }
      if (currentPath === '/admin/classes') {
        return (
          <AdminClassesView
            classes={classes}
            onRefresh={handleRefresh}
            onShowToast={showToast}
          />
        );
      }
      if (currentPath === '/admin/cards') {
        return (
          <AdminCardsStudioView
            profiles={profiles}
            settings={settings}
            onNavigate={navigate}
            onRefresh={handleRefresh}
            onShowToast={showToast}
          />
        );
      }
      if (currentPath === '/admin/notifications') {
        return (
          <AdminLogsNotificationsSettingsView
            tab="notifications"
            notifications={notifications}
            logs={activityLogs}
            settings={settings}
            onRefresh={handleRefresh}
            onNavigate={navigate}
            onShowToast={showToast}
          />
        );
      }
      if (currentPath === '/admin/activity-logs') {
        return (
          <AdminLogsNotificationsSettingsView
            tab="logs"
            notifications={notifications}
            logs={activityLogs}
            settings={settings}
            onRefresh={handleRefresh}
            onNavigate={navigate}
            onShowToast={showToast}
          />
        );
      }
      if (currentPath === '/admin/settings') {
        return (
          <AdminLogsNotificationsSettingsView
            tab="settings"
            notifications={notifications}
            logs={activityLogs}
            settings={settings}
            onRefresh={handleRefresh}
            onNavigate={navigate}
            onShowToast={showToast}
          />
        );
      }

      return (
        <AdminDashboardHome
          stats={adminStats}
          admins={admins}
          currentUser={currentUser}
          recentMembers={profiles.slice(0, 5)}
          recentAnnouncements={announcements.slice(0, 4)}
          recentLogs={activityLogs.slice(0, 6)}
          demoModeEnabled={settings?.demoModeEnabled !== false}
          onToggleDemoMode={handleToggleDemoMode}
          onNavigate={navigate}
        />
      );
    }

    // Member Views
    const fallbackMember: MemberRecord = currentMember || {
      id: 'mem-default',
      uid: currentUser.uid,
      memberId: currentUser.memberId,
      program: 'Khot Naskhi',
      learningMethod: 'Online',
      bookPurchaseStatus: 'Sudah diverifikasi',
      membershipStatus: 'Member Aktif',
      agreedToRules: true,
      joinDate: currentUser.createdAt,
      verificationDate: currentUser.createdAt,
      adminNotes: '',
    };

    const subPageMap: Record<string, any> = {
      '/member/dashboard': 'dashboard',
      '/member/profile': 'profile',
      '/member/card': 'card',
      '/member/announcements': 'announcements',
      '/member/information': 'information',
      '/member/documents': 'documents',
      '/member/classes': 'classes',
      '/member/whatsapp': 'whatsapp',
      '/member/notifications': 'notifications',
      '/member/settings': 'settings',
    };

    const activeSubPage = subPageMap[currentPath] || 'dashboard';

    return (
      <MemberPortalViews
        activeSubPage={activeSubPage}
        user={currentUser}
        member={fallbackMember}
        announcements={announcements}
        readAnnouncementIds={readAnnouncementIds}
        information={information}
        documents={documents}
        classes={classes}
        notifications={notifications}
        settings={settings}
        onRefresh={handleRefresh}
        onNavigate={navigate}
        onShowToast={showToast}
      />
    );
  };

  return (
    <div className="min-h-screen bg-[#FAFCF9] text-[#26332A] flex overflow-x-hidden">
      {/* Toast Notification Feedback */}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-20 left-4 right-4 sm:left-auto sm:right-4 lg:bottom-6 lg:right-6 z-50 flex items-center gap-2.5 rounded-xl px-4 py-3 text-xs font-semibold text-white shadow-lg transition-all ${
            toast.type === 'error' ? 'bg-[#B44238]' : 'bg-[#315B43]'
          }`}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span className="break-words">{toast.message}</span>
        </div>
      )}

      {/* Desktop Persistent Sidebar (lg+) */}
      <aside className="no-print hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-[#E3EAE3] bg-white">
        <div className="flex items-center gap-3 border-b border-[#E3EAE3] px-6 py-5">
          <BrandLogo
            size="md"
            logoUrl={settings?.logoURL}
            primaryColor={resolveMemberThemeColors(settings, currentMember).primaryColor}
            secondaryColor={
              resolveMemberThemeColors(settings, currentMember).secondaryColor
            }
            accentColor={resolveMemberThemeColors(settings, currentMember).accentColor}
          />
          <div className="min-w-0">
            <div className="text-sm font-bold tracking-tight text-[#26332A] truncate">
              {settings?.institutionName || 'BELAJAR KHOT'}
            </div>
            <div className="text-[11px] font-medium text-[#6B776D] truncate">
              {currentUser.role === 'admin' ? 'Panel Administrator' : 'Portal Member Digital'}
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Menu Utama">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              currentPath === item.path ||
              (item.path === '/admin/members' &&
                currentPath.startsWith('/admin/members'));
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#315B43] text-white'
                    : 'text-[#6B776D] hover:bg-[#F3F7F2] hover:text-[#26332A]'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-[#E3EAE3] p-4 space-y-3">
          <div className="rounded-xl bg-[#F3F7F2] p-3">
            <div className="text-xs font-bold text-[#26332A] truncate">
              {currentUser.fullName}
            </div>
            <div className="font-mono text-[11px] text-[#315B43] font-semibold truncate">
              {currentUser.memberId} ·{' '}
              {currentUser.role === 'admin'
                ? currentUser.adminRole || 'Admin Utama'
                : 'Member'}
            </div>
            {currentUser.role === 'admin' && (
              <button
                type="button"
                onClick={() => navigate('/admin/accounts')}
                className="mt-2 w-full rounded-lg border border-[#315B43]/30 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#315B43] hover:bg-[#EBF5EE] transition-colors cursor-pointer"
              >
                Kelola Admin Utama & Monitoring
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#E3EAE3] px-3 py-2 text-xs font-semibold text-[#B44238] hover:bg-[#FCEEEF] transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Keluar (Logout)
          </button>
        </div>
      </aside>

      {/* Main Content Column */}
      <div className="flex flex-1 flex-col lg:pl-64 min-w-0 w-full">
        {/* Top Bar Contract */}
        <header className="no-print sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-[#E3EAE3] bg-white/95 px-3 py-2.5 sm:px-6 sm:py-3.5 backdrop-blur-xs">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Buka menu navigasi"
              className="lg:hidden rounded-lg p-2 text-[#26332A] hover:bg-[#F3F7F2] shrink-0"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <span className="block text-xs sm:text-sm font-bold text-[#26332A] truncate">
                {navItems.find((n) => currentPath.startsWith(n.path))?.label ||
                  'Belajar Khot Portal'}
              </span>
              <span className="block lg:hidden text-[10px] font-mono text-[#6B776D] truncate">
                {currentUser.fullName} ({currentUser.memberId})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {currentUser.role === 'admin' && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    handleToggleDemoMode(settings?.demoModeEnabled === false)
                  }
                  className={`hidden md:inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                    settings?.demoModeEnabled !== false
                      ? 'border-[#A06A18]/40 bg-[#FCF5E8] text-[#A06A18]'
                      : 'border-[#315B43]/40 bg-[#EBF5EE] text-[#3B7551]'
                  }`}
                  title="Hidupkan atau matikan data contoh (Mode Demo vs Aplikasi Bersih Kosongan)"
                >
                  <span>
                    {settings?.demoModeEnabled !== false
                      ? '● Mode Demo: ON'
                      : '○ Mode Fresh (Kosongan)'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/admin/cards')}
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-[#F3F7F2] px-3 py-2 text-xs font-semibold text-[#26332A] hover:bg-[#E8EFE7] transition-colors cursor-pointer"
                  title="Atur Warna Member & Cetak Kartu PDF"
                >
                  <Palette
                    className="h-4 w-4"
                    style={{
                      color: resolveMemberThemeColors(settings, null).primaryColor,
                    }}
                  />
                  <span>Warna Member</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={toggleThemeMode}
              aria-label={
                themeMode === 'dark' ? 'Aktifkan Mode Terang' : 'Aktifkan Mode Malam'
              }
              className="rounded-lg bg-[#F3F7F2] p-2 sm:px-3 sm:py-2 text-xs font-semibold text-[#26332A] hover:bg-[#E8EFE7] transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {themeMode === 'dark' ? (
                <>
                  <Sun className="h-4 w-4 text-[#F6C453]" />
                  <span className="hidden sm:inline">Mode Terang</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 text-[#315B43]" />
                  <span className="hidden sm:inline">Mode Malam</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(
                  currentUser.role === 'admin'
                    ? '/admin/notifications'
                    : '/member/notifications'
                )
              }
              aria-label="Notifikasi"
              className="relative rounded-lg bg-[#F3F7F2] p-2 sm:px-3 sm:py-2 text-xs font-semibold text-[#26332A] hover:bg-[#E8EFE7] transition-colors cursor-pointer flex items-center gap-1"
            >
              <Bell className="h-4 w-4 text-[#315B43]" />
              <span className="hidden sm:inline">Notifikasi</span>
              {unreadNotifCount > 0 && (
                <span className="font-mono text-[11px] font-bold text-[#315B43] tabular-nums">
                  ({unreadNotifCount})
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              aria-label="Keluar"
              title="Keluar (Logout)"
              className="lg:hidden rounded-lg border border-[#E3EAE3] p-2 sm:px-3 sm:py-2 text-xs font-semibold text-[#B44238] hover:bg-[#FCEEEF] flex items-center gap-1"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 px-3.5 py-4 pb-24 sm:px-6 sm:py-6 lg:px-8 lg:pb-10 max-w-7xl w-full mx-auto min-w-0">
          {renderMainView()}
        </main>
      </div>

      {/* Mobile Slide-Over Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 flex w-[84vw] max-w-xs flex-col bg-white p-4 shadow-xl h-full overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E3EAE3] pb-3.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <BrandLogo
                  size="sm"
                  logoUrl={settings?.logoURL}
                  primaryColor={
                    resolveMemberThemeColors(settings, currentMember).primaryColor
                  }
                  secondaryColor={
                    resolveMemberThemeColors(settings, currentMember).secondaryColor
                  }
                  accentColor={
                    resolveMemberThemeColors(settings, currentMember).accentColor
                  }
                />
                <div className="min-w-0">
                  <div className="text-sm font-bold text-[#26332A] truncate">
                    {settings?.institutionName || 'BELAJAR KHOT'}
                  </div>
                  <div className="text-[10px] font-medium text-[#6B776D] truncate">
                    {currentUser.role === 'admin'
                      ? 'Panel Administrator'
                      : 'Portal Member Digital'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Tutup menu"
                className="rounded-lg p-1.5 text-[#6B776D] hover:bg-[#F3F7F2]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mobile User Profile Summary Card */}
            <div className="mt-3.5 rounded-xl border border-[#E3EAE3] bg-[#F3F7F2] p-3">
              <div className="text-xs font-bold text-[#26332A] break-words">
                {currentUser.fullName}
              </div>
              <div className="mt-0.5 font-mono text-[11px] text-[#315B43] font-semibold">
                {currentUser.memberId} ·{' '}
                {currentUser.role === 'admin'
                  ? currentUser.adminRole || 'Admin Utama'
                  : 'Member'}
              </div>
              {currentUser.role === 'admin' && (
                <div className="mt-2.5 grid grid-cols-1 gap-1.5">
                  <button
                    type="button"
                    onClick={() => navigate('/admin/accounts')}
                    className="w-full rounded-lg border border-[#315B43]/30 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#315B43] hover:bg-[#EBF5EE] text-center"
                  >
                    Kelola Admin Utama & Monitoring
                  </button>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        handleToggleDemoMode(settings?.demoModeEnabled === false);
                        setMobileMenuOpen(false);
                      }}
                      className={`rounded-lg border px-2 py-1.5 text-[10px] font-semibold text-center ${
                        settings?.demoModeEnabled !== false
                          ? 'border-[#A06A18]/40 bg-[#FCF5E8] text-[#A06A18]'
                          : 'border-[#315B43]/40 bg-[#EBF5EE] text-[#3B7551]'
                      }`}
                    >
                      {settings?.demoModeEnabled !== false ? '● Demo: ON' : '○ Mode Fresh'}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/admin/cards')}
                      className="rounded-lg border border-[#E3EAE3] bg-white px-2 py-1.5 text-[10px] font-semibold text-[#26332A] text-center"
                    >
                      Warna Kartu
                    </button>
                  </div>
                </div>
              )}
            </div>

            <nav className="mt-3.5 flex-1 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  currentPath === item.path ||
                  (item.path === '/admin/members' &&
                    currentPath.startsWith('/admin/members'));
                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => navigate(item.path)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold ${
                      isActive
                        ? 'bg-[#315B43] text-white'
                        : 'text-[#6B776D] hover:bg-[#F3F7F2]'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-4 border-t border-[#E3EAE3] pt-3">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#E3EAE3] px-3 py-2.5 text-xs font-semibold text-[#B44238] hover:bg-[#FCEEEF]"
              >
                <LogOut className="h-4 w-4" />
                Keluar (Logout)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (< lg) */}
      <nav
        aria-label="Navigasi Mobile"
        className="no-print fixed bottom-0 left-0 right-0 z-30 grid grid-cols-5 h-16 items-center border-t border-[#E3EAE3] bg-white/95 px-1 backdrop-blur-md lg:hidden"
      >
        {(currentUser.role === 'admin'
          ? [
              { label: 'Beranda', path: '/admin/dashboard', icon: LayoutDashboard },
              { label: 'Peserta', path: '/admin/members', icon: Users },
              { label: 'Akun/Admin', path: '/admin/accounts', icon: UserCheck },
              { label: 'Kartu', path: '/admin/cards', icon: CreditCard },
            ]
          : [
              { label: 'Beranda', path: '/member/dashboard', icon: LayoutDashboard },
              { label: 'Kartu', path: '/member/card', icon: CreditCard },
              { label: 'Info', path: '/member/announcements', icon: Megaphone },
              { label: 'Profil', path: '/member/profile', icon: User },
            ]
        ).map((tab) => {
          const Icon = tab.icon;
          const active =
            currentPath === tab.path ||
            (tab.path === '/admin/members' &&
              currentPath.startsWith('/admin/members'));
          return (
            <button
              key={tab.path}
              type="button"
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center justify-center gap-1 py-1.5 text-[10px] font-semibold transition-colors ${
                active ? 'text-[#315B43]' : 'text-[#6B776D]'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate max-w-full px-0.5">{tab.label}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center gap-1 py-1.5 text-[10px] font-semibold text-[#6B776D] hover:text-[#315B43]"
        >
          <Menu className="h-4 w-4 shrink-0" />
          <span className="truncate">Menu</span>
        </button>
      </nav>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  HelpCircle,
  KeyRound,
  Lock,
  MessageCircle,
  Moon,
  QrCode,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sun,
  UserCheck,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import type { PublicCardVerificationResult } from '../types';
import { BrandLogo } from './BrandLogo';

interface LoginPageProps {
  onLoginSuccess: (payload: { token: string; user: any; member: any }) => void;
  onNavigate: (path: string) => void;
  themeMode?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onNavigate,
  themeMode = 'light',
  onToggleTheme,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifyLookupId, setVerifyLookupId] = useState('BK-00001');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!identifier.trim() || !password) {
      setError('Mohon masukkan ID Pengguna / Nomor Member beserta Password Anda.');
      return;
    }

    setLoading(true);
    try {
      const data = await apiRequest<{ token: string; user: any; member: any }>(
        '/api/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ identifier: identifier.trim(), password }),
        }
      );
      if (!data || !data.user || !data.user.role) {
        throw new Error(
          'Respons server tidak valid atau layanan sedang memulai ulang. Silakan coba klik tombol Masuk sekali lagi.'
        );
      }
      onLoginSuccess(data);
    } catch (err: any) {
      const rawMsg =
        typeof err?.message === 'string' && err.message !== '[object Object]'
          ? err.message
          : 'Gagal melakukan autentikasi. Periksa kembali ID Pengguna dan Password Anda.';
      setError(rawMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFCF9] text-[#26332A] flex flex-col justify-between">
      {/* Top Minimal Header */}
      <header className="border-b border-[#E3EAE3] bg-white/90 backdrop-blur-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <BrandLogo size="md" />
            <div>
              <span className="text-lg font-bold tracking-tight text-[#26332A] whitespace-nowrap block leading-tight">
                BELAJAR KHOT
              </span>
              <span className="text-[11px] font-medium text-[#6B776D] block">
                Portal Keanggotaan & Akademik Kaligrafi
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#6B776D]">
            <button
              type="button"
              onClick={() => onNavigate('/verify-member/BK-00001')}
              className="hover:text-[#26332A] transition-colors whitespace-nowrap cursor-pointer"
            >
              Verifikasi Kartu Member
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/help-login')}
              className="hover:text-[#26332A] transition-colors whitespace-nowrap cursor-pointer"
            >
              Panduan & Bantuan Login
            </button>
          </nav>

          <div className="flex items-center gap-2.5">
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                aria-label={
                  themeMode === 'dark' ? 'Aktifkan Mode Terang' : 'Aktifkan Mode Malam'
                }
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#E3EAE3] bg-[#F3F7F2] px-3 py-2 text-xs font-semibold text-[#26332A] hover:bg-[#E8EFE7] transition-colors cursor-pointer"
              >
                {themeMode === 'dark' ? (
                  <>
                    <Sun className="h-3.5 w-3.5 text-[#F6C453]" />
                    <span>Mode Terang</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-3.5 w-3.5 text-[#315B43]" />
                    <span>Mode Malam</span>
                  </>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigate('/help-login')}
              className="rounded-lg bg-[#E8EFE7] px-3.5 py-2 text-xs font-semibold text-[#315B43] hover:bg-[#DCE6DA] transition-colors whitespace-nowrap cursor-pointer"
            >
              Hubungi Admin
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Split */}
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 sm:py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-stretch">
          {/* Left Column: Brand Philosophy & Rules Overview */}
          <div className="flex flex-col justify-between rounded-2xl bg-[#315B43] p-6 sm:p-10 text-white lg:col-span-6 relative overflow-hidden">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-20 -bottom-20 h-72 w-72 rounded-full border border-[#A3D1B3]/15"
            />
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-[#A3D1B3]">
                PORTAL RESMI KEANGGOTAAN & AKADEMIK
              </div>
              <h1 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
                One Portal, Organized Learning, Better Membership Management.
              </h1>
              <p className="mt-3 text-sm text-[#E8EFE7]/90 leading-relaxed">
                Sistem informasi terpadu untuk pengelolaan peserta pembelajaran{' '}
                <strong className="font-semibold text-white">Khot Naskhi</strong> dan{' '}
                <strong className="font-semibold text-white">Khot Riq&apos;ah</strong>{' '}
                secara Online maupun Offline.
              </p>

              <div className="mt-8 space-y-3.5 border-t border-white/15 pt-6">
                <div className="text-xs font-semibold uppercase tracking-wider text-[#A3D1B3]">
                  Ketentuan Utama Lembaga Belajar Khot
                </div>
                <ul className="space-y-2.5 text-xs sm:text-sm text-[#E8EFE7]">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#A3D1B3] mt-0.5" />
                    <span>Program pembelajaran dikhususkan untuk peserta laki-laki (ikhwan).</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#A3D1B3] mt-0.5" />
                    <span>Calon peserta wajib memiliki buku panduan Khot resmi sesuai program.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#A3D1B3] mt-0.5" />
                    <span>
                      Akses kartu member digital, pengumuman resmi, jadwal kelas, dan dokumen materi dalam satu pintu.
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Public Card Verification Quick Bar */}
            <div className="mt-8 rounded-xl bg-white/10 p-4 border border-white/15">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#A3D1B3]">
                <QrCode className="h-4 w-4" />
                <span>Cek Keaslian Kartu Member Digital</span>
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <input
                  type="text"
                  value={verifyLookupId}
                  onChange={(e) => setVerifyLookupId(e.target.value)}
                  placeholder="Contoh: BK-00001"
                  aria-label="Nomor ID Member untuk verifikasi"
                  className="h-10 flex-1 rounded-lg bg-white/95 px-3 text-xs font-mono font-semibold text-[#26332A] placeholder:text-[#929B93] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() =>
                    onNavigate(`/verify-member/${encodeURIComponent(verifyLookupId.trim() || 'BK-00001')}`)
                  }
                  className="h-10 rounded-lg bg-[#6F8F72] px-4 text-xs font-semibold text-white hover:bg-[#5E7C61] transition-colors whitespace-nowrap cursor-pointer"
                >
                  Verifikasi ID
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Login Card */}
          <div className="flex flex-col justify-center rounded-2xl border border-[#E3EAE3] bg-white p-6 sm:p-10 shadow-xs lg:col-span-6">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#315B43]">
                <Lock className="h-3.5 w-3.5" />
                <span>AUTENTIKASI PORTAL TERPUSAT</span>
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#26332A]">
                Selamat Datang di Belajar Khot
              </h2>
              <p className="mt-1 text-sm text-[#6B776D]">
                Masukkan Nomor ID Member (contoh: <span className="font-mono font-semibold">BK-00001</span>) atau Username Admin Anda. Sistem otomatis mengenali hak akses akun.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="mt-5 flex items-start gap-2.5 rounded-xl border border-[#B44238]/30 bg-[#FCEEEF] p-3.5 text-xs font-medium text-[#B44238]"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="login-identifier"
                  className="block text-xs font-semibold text-[#26332A]"
                >
                  ID Pengguna / Nomor ID Member
                </label>
                <input
                  id="login-identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Contoh: BK-00001 atau admin"
                  autoComplete="username"
                  className="mt-1.5 h-11 w-full rounded-lg border border-[#E3EAE3] bg-white px-3.5 text-sm text-[#26332A] placeholder:text-[#929B93] focus:border-[#315B43] focus:outline-none focus:ring-2 focus:ring-[#315B43]/15"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-semibold text-[#26332A]"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => onNavigate('/help-login')}
                    className="text-xs font-semibold text-[#315B43] hover:underline cursor-pointer"
                  >
                    Lupa password?
                  </button>
                </div>
                <div className="relative mt-1.5">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password akun"
                    autoComplete="current-password"
                    className="h-11 w-full rounded-lg border border-[#E3EAE3] bg-white pl-3.5 pr-11 text-sm text-[#26332A] placeholder:text-[#929B93] focus:border-[#315B43] focus:outline-none focus:ring-2 focus:ring-[#315B43]/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[#6B776D] hover:bg-[#F3F7F2] hover:text-[#26332A] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 h-11 w-full rounded-lg bg-[#315B43] px-4 text-sm font-semibold text-white hover:bg-[#264734] transition-colors cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Memverifikasi Akun...' : 'Masuk ke Portal Belajar Khot'}
              </button>
            </form>

            {/* Help Footer */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-[#E3EAE3] pt-4 text-xs text-[#6B776D]">
              <span>Belum menerima ID Member dari pengurus?</span>
              <button
                type="button"
                onClick={() => onNavigate('/help-login')}
                className="inline-flex items-center gap-1 font-semibold text-[#315B43] hover:underline cursor-pointer"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                Pusat Bantuan Login
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-[#E3EAE3] bg-white py-4 text-center text-xs text-[#6B776D]">
        © 2026 BELAJAR KHOT — Sistem Manajemen Keanggotaan & Portal Member Digital (Zona Waktu WIB).
      </footer>
    </div>
  );
};

interface HelpLoginPageProps {
  onNavigate: (path: string) => void;
  themeMode?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const HelpLoginPage: React.FC<HelpLoginPageProps> = ({
  onNavigate,
  themeMode = 'light',
  onToggleTheme,
}) => {
  const [info, setInfo] = useState<any>(null);

  useEffect(() => {
    apiRequest('/api/public/help-info')
      .then((res) => setInfo(res))
      .catch(() => {});
  }, []);

  const waUrl = info?.whatsappNumber
    ? `https://wa.me/${info.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
        info.whatsappHelpMessage || 'Assalamualaikum Admin Belajar Khot, saya butuh bantuan login.'
      )}`
    : 'https://wa.me/6281110002026';

  return (
    <div className="min-h-screen bg-[#FAFCF9] text-[#26332A]">
      <header className="border-b border-[#E3EAE3] bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" />
            <button
              type="button"
              onClick={() => onNavigate('/login')}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#315B43] hover:underline cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Halaman Login
            </button>
          </div>
          <div className="flex items-center gap-3">
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#E3EAE3] bg-[#F3F7F2] px-3 py-1.5 text-xs font-semibold text-[#26332A] cursor-pointer"
              >
                {themeMode === 'dark' ? (
                  <>
                    <Sun className="h-3.5 w-3.5 text-[#F6C453]" />
                    <span>Mode Terang</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-3.5 w-3.5 text-[#315B43]" />
                    <span>Mode Malam</span>
                  </>
                )}
              </button>
            )}
            <span className="text-xs font-semibold text-[#6B776D]">PUSAT BANTUAN RESMI</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="rounded-2xl border border-[#E3EAE3] bg-white p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-[#26332A]">
            Bantuan Login & Informasi Keanggotaan Belajar Khot
          </h1>
          <p className="mt-2 text-sm text-[#6B776D]">
            Panduan resmi bagi calon peserta dan member aktif untuk mengakses akun portal serta prosedur pengaturan ulang kata sandi (reset password).
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[#E3EAE3] bg-[#F3F7F2] p-5">
              <div className="flex items-center gap-2 text-sm font-bold text-[#315B43]">
                <KeyRound className="h-4 w-4" />
                <span>1. Cara Mendapatkan ID & Password</span>
              </div>
              <p className="mt-2 text-xs text-[#26332A] leading-relaxed">
                Akun member dibuat secara terpusat oleh Administrator Belajar Khot setelah calon peserta mengisi data pendaftaran. Nomor ID Member memiliki format unik seperti{' '}
                <strong className="font-mono">BK-00001</strong>.
              </p>
            </div>

            <div className="rounded-xl border border-[#E3EAE3] bg-[#F3F7F2] p-5">
              <div className="flex items-center gap-2 text-sm font-bold text-[#315B43]">
                <BookOpen className="h-4 w-4" />
                <span>2. Verifikasi Persyaratan Buku Khot</span>
              </div>
              <p className="mt-2 text-xs text-[#26332A] leading-relaxed">
                {info?.bookRequirementInfo ||
                  'Setiap calon peserta wajib memiliki buku panduan Khot Naskhi atau Khot Riq\'ah sesuai ketentuan lembaga agar Kartu Member Digital berstatus MEMBER AKTIF.'}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-[#E3EAE3] p-5">
            <h2 className="text-base font-bold text-[#26332A]">
              Ketentuan Keanggotaan Lembaga Belajar Khot
            </h2>
            <ul className="mt-3 space-y-2 text-xs sm:text-sm text-[#6B776D]">
              {(
                info?.membershipRules || [
                  'Program pembelajaran dikhususkan untuk laki-laki (ikhwan).',
                  'Calon peserta wajib memiliki atau membeli buku Khot sesuai ketentuan lembaga.',
                  'Peserta terdaftar secara resmi sebagai member Belajar Khot.',
                ]
              ).map((rule: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="font-mono font-bold text-[#315B43]">{idx + 1}.</span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl bg-[#E8EFE7] p-5">
            <div>
              <div className="text-sm font-bold text-[#26332A]">
                Lupa Password atau Kendala Akses Akun?
              </div>
              <div className="mt-1 text-xs text-[#6B776D]">
                Hubungi Sekretariat / Admin Belajar Khot melalui WhatsApp resmi dengan menyertakan Nama Lengkap dan Nomor ID Member Anda.
              </div>
            </div>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#315B43] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#264734] transition-colors whitespace-nowrap"
            >
              <MessageCircle className="h-4 w-4" />
              Hubungi Admin via WhatsApp
            </a>
          </div>
        </div>
      </main>
    </div>
  );
};

interface VerifyMemberPageProps {
  memberIdParam: string;
  onNavigate: (path: string) => void;
  themeMode?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const VerifyMemberPage: React.FC<VerifyMemberPageProps> = ({
  memberIdParam,
  onNavigate,
  themeMode = 'light',
  onToggleTheme,
}) => {
  const [searchId, setSearchId] = useState(memberIdParam || 'BK-00001');
  const [result, setResult] = useState<PublicCardVerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchVerification = async (targetId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<PublicCardVerificationResult>(
        `/api/public/verify/${encodeURIComponent(targetId.trim())}`
      );
      setResult(data);
    } catch (err: any) {
      setResult(null);
      setError(err.message || 'Data kartu member tidak ditemukan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSearchId(memberIdParam || 'BK-00001');
    fetchVerification(memberIdParam || 'BK-00001');
  }, [memberIdParam]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;
    onNavigate(`/verify-member/${encodeURIComponent(searchId.trim().toUpperCase())}`);
  };

  return (
    <div className="min-h-screen bg-[#FAFCF9] text-[#26332A]">
      <header className="border-b border-[#E3EAE3] bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" />
            <button
              type="button"
              onClick={() => onNavigate('/login')}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#315B43] hover:underline cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              Ke Portal Login
            </button>
          </div>
          <div className="flex items-center gap-3">
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#E3EAE3] bg-[#F3F7F2] px-3 py-1.5 text-xs font-semibold text-[#26332A] cursor-pointer"
              >
                {themeMode === 'dark' ? (
                  <>
                    <Sun className="h-3.5 w-3.5 text-[#F6C453]" />
                    <span>Mode Terang</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-3.5 w-3.5 text-[#315B43]" />
                    <span>Mode Malam</span>
                  </>
                )}
              </button>
            )}
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6B776D]">
              VERIFIKASI KEASLIAN KARTU MEMBER
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {/* Lookup Bar */}
        <form
          onSubmit={handleSearch}
          className="mb-6 flex items-center gap-2 rounded-xl border border-[#E3EAE3] bg-white p-3 shadow-xs"
        >
          <Search className="ml-2 h-4 w-4 text-[#6B776D]" />
          <input
            type="text"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="Masukkan Nomor ID Member (contoh: BK-00001, BK-00002, BK-00005)"
            aria-label="Cari Nomor ID Member"
            className="h-10 flex-1 bg-transparent px-2 text-sm font-mono font-semibold text-[#26332A] focus:outline-none"
          />
          <button
            type="submit"
            className="h-10 rounded-lg bg-[#315B43] px-4 text-xs font-semibold text-white hover:bg-[#264734] transition-colors cursor-pointer"
          >
            Cek Kartu
          </button>
        </form>

        {loading ? (
          <div className="rounded-2xl border border-[#E3EAE3] bg-white p-10 text-center text-sm text-[#6B776D]">
            Memeriksa keaslian Nomor ID Member di basis data Belajar Khot...
          </div>
        ) : error || !result ? (
          <div className="rounded-2xl border border-[#B44238]/30 bg-[#FCEEEF] p-8 text-center">
            <ShieldAlert className="mx-auto h-12 w-12 text-[#B44238]" />
            <h1 className="mt-3 text-xl font-bold text-[#B44238]">
              Kartu Member Tidak Terdaftar
            </h1>
            <p className="mt-1 text-sm text-[#26332A]">{error}</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[#E3EAE3] bg-white shadow-xs">
            {/* Status Banner */}
            <div
              className={`p-6 text-white ${
                result.cardDisplayStatus === 'MEMBER AKTIF'
                  ? 'bg-[#315B43]'
                  : result.cardDisplayStatus === 'Menunggu Verifikasi'
                  ? 'bg-[#A06A18]'
                  : 'bg-[#B44238]'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {result.cardDisplayStatus === 'MEMBER AKTIF' ? (
                    <ShieldCheck className="h-10 w-10 text-[#A3D1B3]" />
                  ) : result.cardDisplayStatus === 'Menunggu Verifikasi' ? (
                    <Clock className="h-10 w-10 text-white" />
                  ) : (
                    <ShieldAlert className="h-10 w-10 text-white" />
                  )}
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-white/80">
                      HASIL VERIFIKASI QR RESMI • {result.institutionName}
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold">
                      {result.cardDisplayStatus === 'MEMBER AKTIF'
                        ? 'KARTU MEMBER AKTIF & TERVERIFIKASI'
                        : result.cardDisplayStatus === 'Menunggu Verifikasi'
                        ? 'MASIH MENUNGGU VERIFIKASI ADMIN'
                        : 'KARTU / AKUN TIDAK AKTIF'}
                    </h1>
                  </div>
                </div>
                <span className="rounded-full bg-white/20 px-3.5 py-1 font-mono text-sm font-bold text-white tabular-nums">
                  {result.memberId}
                </span>
              </div>
            </div>

            {/* Public Minimum Information (No PII leak) */}
            <div className="p-6 sm:p-8">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="rounded-xl bg-[#F3F7F2] p-4">
                  <div className="text-xs font-medium text-[#6B776D]">Nama Lengkap Peserta</div>
                  <div className="mt-1 text-base font-bold text-[#26332A]">{result.fullName}</div>
                </div>
                <div className="rounded-xl bg-[#F3F7F2] p-4">
                  <div className="text-xs font-medium text-[#6B776D]">Nomor ID Member</div>
                  <div className="mt-1 font-mono text-base font-bold text-[#315B43] tabular-nums">
                    {result.memberId}
                  </div>
                </div>
                <div className="rounded-xl bg-[#F3F7F2] p-4">
                  <div className="text-xs font-medium text-[#6B776D]">Program Pembelajaran</div>
                  <div className="mt-1 text-base font-semibold text-[#26332A]">
                    {result.program} ({result.learningMethod})
                  </div>
                </div>
                <div className="rounded-xl bg-[#F3F7F2] p-4">
                  <div className="text-xs font-medium text-[#6B776D]">Status Keanggotaan & Bergabung</div>
                  <div className="mt-1 text-base font-semibold text-[#26332A] tabular-nums">
                    {result.membershipStatus} · {result.joinDateFormatted}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-[#E3EAE3] bg-[#FAFCF9] p-4 text-xs text-[#6B776D]">
                <UserCheck className="h-4 w-4 shrink-0 text-[#315B43] mt-0.5" />
                <div>
                  <strong className="font-semibold text-[#26332A]">Perlindungan Privasi Member:</strong>{' '}
                  Sesuai standar keamanan Belajar Khot, halaman verifikasi publik ini hanya menampilkan status keabsahan kartu dan tidak menampilkan nomor WhatsApp, alamat email, maupun domisili pribadi anggota.
                  <div className="mt-1 font-mono text-[11px] text-[#929B93] tabular-nums">
                    Waktu pengecekan server: {result.verifiedAtFormatted}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

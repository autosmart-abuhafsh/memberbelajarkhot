import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FileDown,
  Printer,
  QrCode,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import type { CombinedMemberProfile, InstitutionSettings } from '../types';
import {
  buildPdfFromJpegBytes,
  computeCardDisplayStatus,
  formatDateID,
  generateDeterministicQrMatrix,
  resolveMemberThemeColors,
} from '../utils/domainLogic';
import { BrandLogo } from './BrandLogo';

interface DigitalMemberCardProps {
  profile: CombinedMemberProfile;
  settings?: InstitutionSettings | null;
  onOpenVerify?: (memberId: string) => void;
  compact?: boolean;
}

export const DigitalMemberCard: React.FC<DigitalMemberCardProps> = ({
  profile,
  settings,
  onOpenVerify,
  compact = false,
}) => {
  const [isDownloadingPng, setIsDownloadingPng] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const { user, member } = profile;

  const displayStatus = computeCardDisplayStatus(
    member.membershipStatus,
    user.accountStatus
  );

  const memberTheme = resolveMemberThemeColors(settings, member);
  const verifyUrl = `${window.location.origin}/verify-member/${member.memberId}`;
  const qrMatrix = generateDeterministicQrMatrix(verifyUrl);

  const initials = user.fullName
    .replace(/\(Demo\)/gi, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');

  // Helper to draw the front card onto any 2D context at (offsetX, offsetY) with size 1080x680
  const drawFrontCardToContext = (
    ctx: CanvasRenderingContext2D,
    offsetX: number,
    offsetY: number
  ) => {
    ctx.save();
    ctx.translate(offsetX, offsetY);

    const grad = ctx.createLinearGradient(0, 0, 1080, 680);
    if (displayStatus === 'MEMBER AKTIF') {
      grad.addColorStop(0, memberTheme.primaryColor);
      grad.addColorStop(0.58, memberTheme.secondaryColor);
      grad.addColorStop(1, memberTheme.primaryColor);
    } else if (displayStatus === 'Menunggu Verifikasi') {
      grad.addColorStop(0, '#2B3A30');
      grad.addColorStop(1, '#3D4D41');
    } else {
      grad.addColorStop(0, '#2E2E2E');
      grad.addColorStop(1, '#1F1F1F');
    }

    // Card rounded rectangle
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(0, 0, 1080, 680, 36);
    ctx.fill();

    // Inner subtle frame
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.24)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(24, 24, 1032, 632, 24);
    ctx.stroke();

    // Decorative geometric ornament circle
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(980, 100, 220, 0, Math.PI * 2);
    ctx.stroke();

    // Top Header
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 32px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(settings?.institutionName || 'BELAJAR KHOT', 64, 92);

    ctx.fillStyle = memberTheme.accentColor;
    ctx.font = '600 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(
      settings?.cardSettings?.cardSubtitle ||
        'LEMBAGA PENDIDIKAN KALIGRAFI ISLAM • IKHWAN',
      64,
      122
    );

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 22px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText('MEMBER CARD', 1016, 90);

    const statusLabel =
      displayStatus === 'MEMBER AKTIF'
        ? 'STATUS: MEMBER AKTIF'
        : displayStatus === 'Menunggu Verifikasi'
        ? 'STATUS: MENUNGGU VERIFIKASI'
        : 'STATUS: NONAKTIF';
    ctx.font = '600 15px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle =
      displayStatus === 'MEMBER AKTIF'
        ? memberTheme.accentColor
        : displayStatus === 'Menunggu Verifikasi'
        ? '#FCD34D'
        : '#FCA5A5';
    ctx.fillText(statusLabel, 1016, 122);
    ctx.textAlign = 'left';

    // Divider line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(64, 152);
    ctx.lineTo(1016, 152);
    ctx.stroke();

    // Avatar Box
    ctx.fillStyle = '#F4F7F4';
    ctx.beginPath();
    ctx.roundRect(64, 195, 130, 150, 20);
    ctx.fill();

    ctx.fillStyle = memberTheme.primaryColor;
    ctx.font = '700 48px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(initials || 'BK', 129, 286);
    ctx.textAlign = 'left';

    // Member Details
    ctx.fillStyle = memberTheme.accentColor;
    ctx.font = '600 15px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('NAMA LENGKAP PESERTA', 226, 214);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 34px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(user.fullName.replace(/\s*\(Demo\)/i, ''), 226, 256);

    ctx.fillStyle = memberTheme.accentColor;
    ctx.font = '600 15px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('NOMOR ID MEMBER', 226, 304);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 28px "JetBrains Mono", monospace';
    ctx.fillText(member.memberId, 226, 340);

    // Bottom Grid Metadata
    const metaY = 430;
    ctx.fillStyle = memberTheme.accentColor;
    ctx.font = '600 14px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('PROGRAM PEMBELAJARAN', 64, metaY);
    ctx.fillText('METODE BELAJAR', 340, metaY);
    ctx.fillText('TANGGAL BERGABUNG', 560, metaY);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(member.program, 64, metaY + 34);
    ctx.fillText(member.learningMethod, 340, metaY + 34);
    ctx.fillText(formatDateID(member.joinDate), 560, metaY + 34);

    // QR Code Box on Right
    const qrBoxSize = 210;
    const qrX = 796;
    const qrY = 360;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(qrX, qrY, qrBoxSize, qrBoxSize, 20);
    ctx.fill();

    const cellSize = (qrBoxSize - 32) / qrMatrix.length;
    ctx.fillStyle = memberTheme.primaryColor;
    for (let r = 0; r < qrMatrix.length; r++) {
      for (let c = 0; c < qrMatrix[r].length; c++) {
        if (qrMatrix[r][c]) {
          ctx.fillRect(
            qrX + 16 + c * cellSize,
            qrY + 16 + r * cellSize,
            Math.ceil(cellSize),
            Math.ceil(cellSize)
          );
        }
      }
    }

    // Footer note
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '400 14px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(
      settings?.cardSettings?.cardFooterNote ||
        'Verifikasi keaslian kartu melalui pemindaian QR Code atau portal resmi Belajar Khot.',
      64,
      615
    );

    ctx.restore();
  };

  // High-resolution HTML5 Canvas PNG export
  const handleDownloadPng = async () => {
    setIsDownloadingPng(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 680;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      drawFrontCardToContext(ctx, 0, 0);

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Kartu_Member_${member.memberId}_${user.fullName.replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsDownloadingPng(false);
    }
  };

  // Standalone A4 Printable PDF export (Front & Back Card on a crisp sheet)
  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      const sheetW = 1240;
      const sheetH = 1754;
      const canvas = document.createElement('canvas');
      canvas.width = sheetW;
      canvas.height = sheetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // White A4 background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, sheetW, sheetH);

      // Document Header Bar
      ctx.fillStyle = memberTheme.primaryColor;
      ctx.fillRect(80, 64, sheetW - 160, 6);

      ctx.fillStyle = '#26332A';
      ctx.font = '700 28px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(
        `${settings?.institutionName || 'BELAJAR KHOT'} — LEMBAR CETAK KARTU MEMBER RESMI`,
        80,
        115
      );

      ctx.fillStyle = '#6B776D';
      ctx.font = '500 16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(
        `ID Member: ${member.memberId}  •  Nama: ${user.fullName}  •  Dicetak: ${formatDateID(
          new Date().toISOString(),
          true
        )}`,
        80,
        146
      );

      // Section 1: TAMPAK DEPAN KARTU
      ctx.fillStyle = memberTheme.secondaryColor;
      ctx.font = '700 16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('1. TAMPAK DEPAN KARTU ANGGOTA (FRONT SIDE)', 80, 195);

      drawFrontCardToContext(ctx, 80, 215);

      // Dashed cut line
      ctx.save();
      ctx.setLineDash([10, 8]);
      ctx.strokeStyle = '#929B93';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(72, 207, 1096, 696);
      ctx.restore();

      // Section 2: TAMPAK BELAKANG KARTU (KETENTUAN & VERIFIKASI)
      ctx.fillStyle = memberTheme.secondaryColor;
      ctx.font = '700 16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('2. TAMPAK BELAKANG KARTU ANGGOTA (BACK SIDE)', 80, 965);

      const backX = 80;
      const backY = 985;
      ctx.fillStyle = '#F8FAF8';
      ctx.beginPath();
      ctx.roundRect(backX, backY, 1080, 620, 36);
      ctx.fill();

      ctx.strokeStyle = memberTheme.secondaryColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(backX, backY, 1080, 620, 36);
      ctx.stroke();

      // Top magnetic-style bar on back card
      ctx.fillStyle = memberTheme.primaryColor;
      ctx.fillRect(backX, backY + 42, 1080, 64);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '700 20px "JetBrains Mono", monospace';
      ctx.fillText(
        `VERIFIKASI RESMI: ${verifyUrl}`,
        backX + 56,
        backY + 82
      );

      ctx.fillStyle = '#26332A';
      ctx.font = '700 24px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('KETENTUAN PENGGUNAAN KARTU MEMBER BELAJAR KHOT', backX + 56, backY + 165);

      const rules = settings?.membershipRules?.length
        ? settings.membershipRules.slice(0, 4)
        : [
            'Kartu ini adalah tanda keanggotaan resmi peserta ikhwan Belajar Khot.',
            'Wajib dibawa/ditunjukkan saat menghadiri kelas tatap muka atau pengambilan buku.',
            'Keaslian kartu dan status keaktifan dapat dipindai langsung melalui QR Code.',
            'Apabila ditemukan kartu ini, mohon kembalikan ke Sekretariat Belajar Khot.',
          ];

      ctx.fillStyle = '#37473B';
      ctx.font = '500 19px "Plus Jakarta Sans", sans-serif';
      rules.forEach((rule, idx) => {
        const cleanRule = rule.length > 86 ? `${rule.slice(0, 86)}...` : rule;
        ctx.fillText(`${idx + 1}. ${cleanRule}`, backX + 56, backY + 215 + idx * 44);
      });

      ctx.fillStyle = '#6B776D';
      ctx.font = '600 17px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(
        `Sekretariat: ${settings?.address || 'Griya Kaligrafi Belajar Khot, Jakarta Selatan'}`,
        backX + 56,
        backY + 460
      );
      ctx.fillText(
        `Kontak WhatsApp Resmi: ${settings?.whatsappNumber || '6281110002026'}  •  Email: ${
          settings?.contactEmail || 'sekretariat@belajarkhot.id'
        }`,
        backX + 56,
        backY + 494
      );

      ctx.fillStyle = memberTheme.primaryColor;
      ctx.font = '700 18px "JetBrains Mono", monospace';
      ctx.fillText(
        `ID: ${member.memberId}  |  PROGRAM: ${member.program.toUpperCase()} (${member.learningMethod.toUpperCase()})`,
        backX + 56,
        backY + 555
      );

      // Convert canvas to JPEG binary bytes and wrap into PDF 1.4
      const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.94);
      const base64Part = jpegDataUrl.split(',')[1] || '';
      const binaryStr = window.atob(base64Part);
      const jpegBytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        jpegBytes[i] = binaryStr.charCodeAt(i);
      }

      const pdfBytes = buildPdfFromJpegBytes(jpegBytes, sheetW, sheetH);
      const blob = new Blob([pdfBytes as unknown as BlobPart], {
        type: 'application/pdf',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Kartu_Member_Belajar_Khot_${member.memberId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 3000);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Dedicated Printer invocation with clean print-sheet isolation
  const handlePrint = () => {
    document.body.classList.add('printing-member-card');
    const cleanup = () => {
      document.body.classList.remove('printing-member-card');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
    setTimeout(cleanup, 1200);
  };

  // Dynamic inline gradient style for active member card based on Admin's color settings
  const cardSurfaceStyle: React.CSSProperties =
    displayStatus === 'MEMBER AKTIF'
      ? {
          backgroundImage: `linear-gradient(135deg, ${memberTheme.primaryColor} 0%, ${memberTheme.secondaryColor} 58%, ${memberTheme.primaryColor} 100%)`,
          borderColor: `${memberTheme.accentColor}55`,
        }
      : {};

  return (
    <div className="w-full">
      <div className="printable-member-card-sheet space-y-6">
        {/* Exclusive Front Card Surface */}
        <div
          data-testid="digital-member-card"
          style={cardSurfaceStyle}
          className={`relative overflow-hidden rounded-2xl border transition-all ${
            displayStatus === 'MEMBER AKTIF'
              ? 'text-white shadow-lg'
              : displayStatus === 'Menunggu Verifikasi'
              ? 'bg-gradient-to-br from-[#2B3B31] via-[#3A4D40] to-[#26332A] border-[#C7D7C8]/40 text-white shadow-md'
              : 'bg-gradient-to-br from-[#2D312E] to-[#1E221F] border-neutral-600 text-neutral-200'
          } ${compact ? 'p-5' : 'p-6 sm:p-8'}`}
        >
          {/* Minimalist Geometric Calligraphy Ornaments */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full border border-white/15"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-6 -top-6 h-44 w-44 rounded-full border border-white/10"
          />
          <div
            aria-hidden="true"
            style={{
              backgroundImage: `linear-gradient(90deg, ${memberTheme.secondaryColor}, ${memberTheme.accentColor}, ${memberTheme.primaryColor})`,
            }}
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-1.5"
          />

          {/* Card Header */}
          <div className="relative z-10 flex flex-wrap items-start justify-between gap-4 border-b border-white/15 pb-4">
            <div className="flex items-center gap-3">
              <BrandLogo
                size="md"
                logoUrl={settings?.logoURL}
                primaryColor={memberTheme.primaryColor}
                secondaryColor={memberTheme.secondaryColor}
                accentColor={memberTheme.accentColor}
                glassOnDark
              />
              <div>
                <div className="text-base sm:text-lg font-bold tracking-tight text-white">
                  {settings?.institutionName || 'BELAJAR KHOT'}
                </div>
                <div
                  style={{ color: memberTheme.accentColor }}
                  className="text-[11px] font-medium tracking-wider uppercase"
                >
                  {settings?.cardSettings?.cardSubtitle ||
                    'MEMBER CARD • KARTU ANGGOTA RESMI'}
                </div>
              </div>
            </div>

            {/* Enforced Card Status Badge (PRD Section 13) */}
            <div className="flex items-center">
              {displayStatus === 'MEMBER AKTIF' ? (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-[#EBF5EE] px-3 py-1 text-xs font-bold text-[#19432D] shadow-xs">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#3B7551]" />
                  MEMBER AKTIF
                </span>
              ) : displayStatus === 'Menunggu Verifikasi' ? (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-[#FCF5E8] px-3 py-1 text-xs font-bold text-[#A06A18] shadow-xs">
                  <Clock className="h-3.5 w-3.5 text-[#A06A18]" />
                  Menunggu Verifikasi
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-[#FCEEEF] px-3 py-1 text-xs font-bold text-[#B44238] shadow-xs">
                  <ShieldAlert className="h-3.5 w-3.5 text-[#B44238]" />
                  NONAKTIF
                </span>
              )}
            </div>
          </div>

          {/* Card Body: Photo/Initials + Identity + QR Code */}
          <div className="relative z-10 mt-5 grid grid-cols-1 gap-6 sm:grid-cols-12 sm:items-center">
            {/* Avatar + Identity */}
            <div className="flex items-center gap-4 sm:col-span-8">
              <div
                style={{ color: memberTheme.primaryColor }}
                className="flex h-20 w-20 sm:h-24 sm:w-24 shrink-0 flex-col items-center justify-center rounded-2xl bg-[#F4F7F4] border-2 border-white/30 shadow-inner"
              >
                <span className="text-2xl sm:text-3xl font-bold tracking-tight">
                  {initials || 'BK'}
                </span>
                <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wider opacity-80">
                  IKHWAN
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div
                  style={{ color: memberTheme.accentColor }}
                  className="text-[11px] font-semibold uppercase tracking-wider"
                >
                  Nama Lengkap Peserta
                </div>
                <div className="mt-0.5 break-words text-base sm:text-2xl font-bold tracking-tight text-white">
                  {user.fullName}
                </div>

                <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <div>
                    <span
                      style={{ color: memberTheme.accentColor }}
                      className="text-[11px] uppercase tracking-wider block"
                    >
                      Nomor ID Member
                    </span>
                    <span className="font-mono text-base sm:text-lg font-bold tracking-wider text-white tabular-nums">
                      {member.memberId}
                    </span>
                  </div>
                  <div className="h-7 w-px bg-white/15 hidden sm:block" />
                  <div>
                    <span
                      style={{ color: memberTheme.accentColor }}
                      className="text-[11px] uppercase tracking-wider block"
                    >
                      Status Keanggotaan
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-white/95">
                      {member.membershipStatus}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* QR Code Verification Block */}
            <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 sm:col-span-4 border-t border-white/10 pt-4 sm:border-t-0 sm:pt-0">
              <div
                className="rounded-xl bg-white p-2.5 shadow-sm shrink-0"
                title={`QR Verifikasi Resmi: ${member.memberId}`}
              >
                <svg
                  viewBox={`0 0 ${qrMatrix.length} ${qrMatrix.length}`}
                  className="h-20 w-20 sm:h-24 sm:w-24"
                  role="img"
                  aria-label={`QR Code Verifikasi ${member.memberId}`}
                >
                  {qrMatrix.map((row, rIdx) =>
                    row.map((cell, cIdx) =>
                      cell ? (
                        <rect
                          key={`${rIdx}-${cIdx}`}
                          x={cIdx}
                          y={rIdx}
                          width={1}
                          height={1}
                          fill={memberTheme.primaryColor}
                        />
                      ) : null
                    )
                  )}
                </svg>
              </div>
              <div className="text-left sm:text-right">
                <div
                  style={{ color: memberTheme.accentColor }}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold"
                >
                  <QrCode className="h-3 w-3 shrink-0" />
                  QR VERIFIKASI RESMI
                </div>
                <div className="text-[11px] text-white/75 font-mono tabular-nums">
                  ID: {member.memberId}
                </div>
              </div>
            </div>
          </div>

          {/* Card Footer Metadata Bar */}
          <div className="relative z-10 mt-5 sm:mt-6 grid grid-cols-2 gap-3 border-t border-white/15 pt-4 sm:grid-cols-4">
            <div>
              <div
                style={{ color: memberTheme.accentColor }}
                className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider"
              >
                Program Khot
              </div>
              <div className="mt-0.5 text-xs sm:text-sm font-semibold text-white">
                {member.program}
              </div>
            </div>
            <div>
              <div
                style={{ color: memberTheme.accentColor }}
                className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider"
              >
                Metode Belajar
              </div>
              <div className="mt-0.5 text-xs sm:text-sm font-semibold text-white">
                {member.learningMethod}
              </div>
            </div>
            <div>
              <div
                style={{ color: memberTheme.accentColor }}
                className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider"
              >
                Tanggal Bergabung
              </div>
              <div className="mt-0.5 text-xs sm:text-sm font-semibold text-white tabular-nums">
                {formatDateID(member.joinDate)}
              </div>
            </div>
            <div>
              <div
                style={{ color: memberTheme.accentColor }}
                className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider"
              >
                Persyaratan Buku
              </div>
              <div className="mt-0.5 text-xs sm:text-sm font-semibold text-white">
                {member.bookPurchaseStatus}
              </div>
            </div>
          </div>

          {/* Status Warning Banner inside card if not active yet */}
          {displayStatus !== 'MEMBER AKTIF' && (
            <div className="relative z-10 mt-4 rounded-xl bg-black/25 px-3.5 py-2.5 text-xs text-[#E8EFE7] flex items-center gap-2 border border-white/10">
              <Sparkles className="h-4 w-4 shrink-0 text-[#FCD34D]" />
              <span>
                {displayStatus === 'Menunggu Verifikasi'
                  ? 'Kartu ini masih berstatus Sementara (Menunggu Verifikasi). Status MEMBER AKTIF akan tampil otomatis setelah persyaratan buku diverifikasi Admin.'
                  : 'Akun anggota ini sedang berstatus Nonaktif dan kartu tidak berlaku sebagai tanda anggota aktif.'}
              </span>
            </div>
          )}
        </div>

        {/* Printable Back Side of Card (Visible during Printer Print or when viewing full card) */}
        {!compact && (
          <div
            data-testid="digital-member-card-back"
            className="hidden print:block rounded-2xl border-2 border-[#315B43] bg-white p-6 text-[#26332A]"
          >
            <div className="flex items-center justify-between border-b border-[#E3EAE3] pb-3">
              <div>
                <div className="text-sm font-bold text-[#26332A]">
                  TAMPAK BELAKANG KARTU • KETENTUAN KEANGGOTAAN RESMI
                </div>
                <div className="text-xs text-[#6B776D]">
                  {settings?.institutionName || 'BELAJAR KHOT'} — {settings?.address}
                </div>
              </div>
              <span className="font-mono text-xs font-bold text-[#315B43] tabular-nums">
                {member.memberId}
              </span>
            </div>
            <ol className="mt-3 list-decimal pl-5 space-y-1 text-xs text-[#26332A]">
              {(
                settings?.membershipRules || [
                  'Program pembelajaran dikhususkan untuk laki-laki (ikhwan).',
                  'Calon peserta wajib memiliki buku panduan Khot resmi sesuai ketentuan lembaga.',
                  'Keaslian kartu dapat diverifikasi secara daring melalui QR Code.',
                ]
              )
                .slice(0, 4)
                .map((rule, idx) => (
                  <li key={idx}>{rule}</li>
                ))}
            </ol>
            <div className="mt-3 border-t border-[#E3EAE3] pt-2 flex items-center justify-between text-[11px] font-mono text-[#6B776D]">
              <span>Verifikasi Online: {verifyUrl}</span>
              <span>Kontak WA: {settings?.whatsappNumber || '6281110002026'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Card Action Controls: PDF, Printer, PNG, Verify */}
      {!compact && (
        <div className="no-print mt-4 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-3 rounded-xl border border-[#E3EAE3] bg-white p-3.5">
          <div className="flex items-center gap-2 text-xs text-[#6B776D]">
            <ShieldCheck className="h-4 w-4 shrink-0 text-[#315B43]" />
            <span>
              Siap dicetak dalam format <strong>PDF (Depan & Belakang)</strong>, gambar <strong>PNG</strong>, atau langsung ke <strong>Printer</strong>.
            </span>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="inline-flex justify-center items-center gap-1.5 rounded-lg bg-[#315B43] px-3 py-2 text-xs font-semibold text-white hover:bg-[#264734] transition-colors cursor-pointer disabled:opacity-50"
            >
              <FileDown className="h-4 w-4 shrink-0" />
              <span className="truncate">
                {isDownloadingPdf ? 'Menyiapkan PDF...' : 'Unduh Kartu (PDF)'}
              </span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex justify-center items-center gap-1.5 rounded-lg bg-[#E8EFE7] px-3 py-2 text-xs font-semibold text-[#315B43] hover:bg-[#DCE6DA] transition-colors cursor-pointer"
            >
              <Printer className="h-4 w-4 shrink-0" />
              <span className="truncate">Cetak Printer</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPng}
              disabled={isDownloadingPng}
              className="inline-flex justify-center items-center gap-1.5 rounded-lg border border-[#C7D7C8] bg-white px-3 py-2 text-xs font-semibold text-[#315B43] hover:bg-[#F3F7F2] transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="h-4 w-4 shrink-0" />
              <span className="truncate">
                {isDownloadingPng ? 'Menyiapkan PNG...' : 'Unduh PNG'}
              </span>
            </button>

            {onOpenVerify && (
              <button
                type="button"
                onClick={() => onOpenVerify(member.memberId)}
                className="inline-flex justify-center items-center gap-1.5 rounded-lg border border-[#E3EAE3] bg-white px-3 py-2 text-xs font-semibold text-[#6B776D] hover:bg-[#F3F7F2] hover:text-[#26332A] transition-colors cursor-pointer"
              >
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Uji QR</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import {
  Bell,
  BookOpen,
  Calendar,
  CheckCircle2,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  FileText,
  FolderOpen,
  History,
  MapPin,
  Megaphone,
  MessageCircle,
  Palette,
  Pin,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  Trash2,
  Upload,
  Video,
  X,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import type {
  ActivityLogRecord,
  AnnouncementCategory,
  AnnouncementRecord,
  ClassRecord,
  CombinedMemberProfile,
  DocumentCategory,
  DocumentRecord,
  InformationCategory,
  InformationRecord,
  InstitutionSettings,
  LearningMethod,
  MemberColorPresetId,
  MemberColorTheme,
  NotificationRecord,
  ProgramType,
  ReadReceiptRecord,
  TargetAudience,
} from '../types';
import {
  formatDateID,
  formatFileSize,
  MEMBER_COLOR_PRESETS,
  resolveMemberThemeColors,
} from '../utils/domainLogic';
import { BrandLogo } from './BrandLogo';
import { DigitalMemberCard } from './DigitalMemberCard';

// ============================================================================
// 1. ADMIN ANNOUNCEMENTS VIEW (PRD Section 10)
// ============================================================================
interface AdminAnnouncementsProps {
  announcements: AnnouncementRecord[];
  readReceipts: ReadReceiptRecord[];
  onRefresh: () => Promise<void>;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

export const AdminAnnouncementsView: React.FC<AdminAnnouncementsProps> = ({
  announcements,
  readReceipts,
  onRefresh,
  onShowToast,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingAnn, setEditingAnn] = useState<AnnouncementRecord | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<AnnouncementCategory>('Pengumuman Resmi');
  const [targetAudience, setTargetAudience] = useState<TargetAudience>('Semua Member');
  const [isPinned, setIsPinned] = useState(false);
  const [isImportant, setIsImportant] = useState(false);
  const [status, setStatus] = useState<'Dipublikasikan' | 'Draft'>('Dipublikasikan');
  const [submitting, setSubmitting] = useState(false);

  const openCreate = () => {
    setEditingAnn(null);
    setTitle('');
    setContent('');
    setCategory('Pengumuman Resmi');
    setTargetAudience('Semua Member');
    setIsPinned(false);
    setIsImportant(false);
    setStatus('Dipublikasikan');
    setShowModal(true);
  };

  const openEdit = (a: AnnouncementRecord) => {
    setEditingAnn(a);
    setTitle(a.title);
    setContent(a.content);
    setCategory(a.category);
    setTargetAudience(a.targetAudience);
    setIsPinned(a.isPinned);
    setIsImportant(a.isImportant);
    setStatus(a.status);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      onShowToast('Judul dan isi pengumuman wajib diisi.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      if (editingAnn) {
        await apiRequest(`/api/announcements/${editingAnn.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            title,
            content,
            category,
            targetAudience,
            isPinned,
            isImportant,
            status,
          }),
        });
        onShowToast('Pengumuman berhasil diperbarui.', 'success');
      } else {
        await apiRequest('/api/announcements', {
          method: 'POST',
          body: JSON.stringify({
            title,
            content,
            category,
            targetAudience,
            isPinned,
            isImportant,
            status,
          }),
        });
        onShowToast('Pengumuman resmi berhasil diterbitkan.', 'success');
      }
      await onRefresh();
      setShowModal(false);
    } catch (err: any) {
      onShowToast(err.message || 'Gagal menyimpan pengumuman.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiRequest(`/api/announcements/${id}`, { method: 'DELETE' });
      await onRefresh();
      onShowToast('Pengumuman berhasil dihapus.', 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Gagal menghapus pengumuman.', 'error');
    }
  };

  const sorted = [...announcements].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return new Date(b.publishAt).getTime() - new Date(a.publishAt).getTime();
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#26332A]">
            Pusat Pengumuman Resmi Lembaga
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#6B776D]">
            Terbitkan informasi resmi, jadwal evaluasi tashih, perubahan kebijakan, dan pantau jumlah member yang telah membaca.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-[#315B43] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#264734] cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Buat Pengumuman Resmi
        </button>
      </div>

      <div className="space-y-4">
        {sorted.map((ann) => {
          const readCount = readReceipts.filter((r) => r.announcementId === ann.id).length;
          return (
            <div
              key={ann.id}
              className="rounded-2xl border border-[#E3EAE3] bg-white p-5 sm:p-6 transition-all"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B776D]">
                    {ann.isPinned && (
                      <span className="inline-flex items-center gap-1 font-semibold text-[#315B43]">
                        <Pin className="h-3.5 w-3.5" />
                        Disematkan
                      </span>
                    )}
                    {ann.isImportant && (
                      <span className="font-semibold text-[#B44238]">· PENTING</span>
                    )}
                    <span>· {ann.category}</span>
                    <span>· Target: {ann.targetAudience}</span>
                    <span className="font-mono tabular-nums">
                      · {formatDateID(ann.publishAt)}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-[#26332A]">
                    {ann.title}
                  </h2>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEdit(ann)}
                    className="rounded-lg bg-[#F3F7F2] px-3 py-1.5 text-xs font-semibold text-[#315B43] hover:bg-[#E8EFE7] cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(ann.id)}
                    aria-label={`Hapus pengumuman ${ann.title}`}
                    className="rounded-lg p-1.5 text-[#6B776D] hover:bg-[#FCEEEF] hover:text-[#B44238] cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <p className="mt-3 text-xs sm:text-sm text-[#26332A] leading-relaxed whitespace-pre-line">
                {ann.content}
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#E3EAE3] pt-3 text-xs text-[#6B776D]">
                <div>
                  Oleh: <strong className="text-[#26332A]">{ann.createdBy}</strong> · Status:{' '}
                  <strong className="text-[#315B43]">{ann.status}</strong>
                </div>
                <div className="font-mono tabular-nums">
                  Telah dibaca oleh <strong>{readCount}</strong> akun member
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs overflow-y-auto"
        >
          <div className="my-8 w-full max-w-xl rounded-2xl border border-[#E3EAE3] bg-white p-6 sm:p-8 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E3EAE3] pb-4">
              <h2 className="text-lg font-bold text-[#26332A]">
                {editingAnn ? 'Edit Pengumuman Resmi' : 'Buat Pengumuman Resmi Baru'}
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1.5 text-[#6B776D]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#26332A]">
                  Judul Pengumuman *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Jadwal Evaluasi Tashih Akhir Semester"
                  className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] px-3 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#26332A]">
                    Kategori Pengumuman
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as AnnouncementCategory)}
                    className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] bg-white px-3 text-xs"
                  >
                    <option value="Pengumuman Resmi">Pengumuman Resmi</option>
                    <option value="Informasi Pembelajaran">Informasi Pembelajaran</option>
                    <option value="Jadwal Kegiatan">Jadwal Kegiatan</option>
                    <option value="Informasi Pendaftaran">Informasi Pendaftaran</option>
                    <option value="Perubahan Kebijakan">Perubahan Kebijakan</option>
                    <option value="Informasi Penting">Informasi Penting</option>
                    <option value="Pengumuman Lainnya">Pengumuman Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#26332A]">
                    Target Penerima
                  </label>
                  <select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value as TargetAudience)}
                    className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] bg-white px-3 text-xs"
                  >
                    <option value="Semua Member">Semua Member</option>
                    <option value="Calon Peserta">Calon Peserta</option>
                    <option value="Member Aktif">Member Aktif</option>
                    <option value="Peserta Online">Peserta Online</option>
                    <option value="Peserta Offline">Peserta Offline</option>
                    <option value="Khot Naskhi">Kelompok Khot Naskhi</option>
                    <option value="Khot Riq'ah">Kelompok Khot Riq&apos;ah</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#26332A]">
                  Isi Pengumuman Resmi *
                </label>
                <textarea
                  rows={5}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Tuliskan isi pengumuman secara lengkap dan jelas..."
                  className="mt-1 w-full rounded-lg border border-[#E3EAE3] p-3 text-xs"
                />
              </div>

              <div className="flex flex-wrap items-center gap-5 rounded-xl bg-[#F3F7F2] p-3.5 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="h-4 w-4 accent-[#315B43]"
                  />
                  <span>Sematkan di bagian paling atas</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isImportant}
                    onChange={(e) => setIsImportant(e.target.checked)}
                    className="h-4 w-4 accent-[#315B43]"
                  />
                  <span>Tandai sebagai Pengumuman Penting</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t border-[#E3EAE3] pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-[#E3EAE3] px-4 py-2 text-xs font-semibold text-[#6B776D]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-[#315B43] px-5 py-2 text-xs font-semibold text-white hover:bg-[#264734]"
                >
                  {submitting ? 'Menyimpan...' : 'Publikasikan Pengumuman'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 2. ADMIN INFORMATION & PROMOTION CENTER (PRD Section 11)
// ============================================================================
interface AdminInformationProps {
  information: InformationRecord[];
  onRefresh: () => Promise<void>;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

export const AdminInformationView: React.FC<AdminInformationProps> = ({
  information,
  onRefresh,
  onShowToast,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<InformationCategory>('Promosi Buku Khot');
  const [targetAudience, setTargetAudience] = useState<TargetAudience>('Semua Member');
  const [destinationURL, setDestinationURL] = useState('');
  const [orderIndex, setOrderIndex] = useState(information.length + 1);
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      onShowToast('Judul dan deskripsi wajib diisi.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await apiRequest('/api/information', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          category,
          targetAudience,
          destinationURL,
          orderIndex,
          status: 'Aktif',
        }),
      });
      await onRefresh();
      setShowModal(false);
      setTitle('');
      setDescription('');
      setDestinationURL('');
      onShowToast('Konten Pusat Informasi berhasil ditambahkan.', 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Gagal menyimpan informasi.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (item: InformationRecord) => {
    const next = item.status === 'Aktif' ? 'Nonaktif' : 'Aktif';
    await apiRequest(`/api/information/${item.id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: next }),
    });
    await onRefresh();
    onShowToast(`Status konten diubah menjadi ${next}.`, 'success');
  };

  const handleDelete = async (id: string) => {
    await apiRequest(`/api/information/${id}`, { method: 'DELETE' });
    await onRefresh();
    onShowToast('Konten informasi berhasil dihapus.', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#26332A]">
            Pusat Informasi, Promosi Buku & Edukasi
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#6B776D]">
            Kelola publikasi buku panduan Khot Naskhi & Riq&apos;ah, poster kegiatan daurah, serta artikel edukasi member.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[#315B43] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#264734] cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Tambah Informasi / Promosi
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {information.map((item) => (
          <div
            key={item.id}
            className="flex flex-col justify-between rounded-2xl border border-[#E3EAE3] bg-white p-5"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-[#6B776D]">
                <span className="font-semibold text-[#315B43]">{item.category}</span>
                <span className="font-mono tabular-nums">Urutan #{item.orderIndex}</span>
              </div>
              <h2 className="mt-2 text-base font-bold text-[#26332A]">{item.title}</h2>
              <p className="mt-2 text-xs text-[#6B776D] leading-relaxed">
                {item.description}
              </p>
            </div>

            <div className="mt-5 border-t border-[#E3EAE3] pt-3 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => handleToggleStatus(item)}
                className={`font-semibold cursor-pointer ${
                  item.status === 'Aktif' ? 'text-[#3B7551]' : 'text-[#929B93]'
                }`}
              >
                Status: {item.status}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                className="text-[#B44238] hover:underline font-medium cursor-pointer"
              >
                Hapus
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-lg rounded-2xl border border-[#E3EAE3] bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E3EAE3] pb-3">
              <h2 className="text-base font-bold text-[#26332A]">
                Tambah Informasi / Konten Promosi Resmi
              </h2>
              <button type="button" onClick={() => setShowModal(false)}>
                <X className="h-5 w-5 text-[#6B776D]" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#26332A]">Judul Konten *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Pemesanan Buku Panduan Khot Riq'ah Cetakan Ke-3"
                  className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] px-3 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#26332A]">Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as InformationCategory)}
                    className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] bg-white px-3 text-xs"
                  >
                    <option value="Promosi Buku Khot">Promosi Buku Khot</option>
                    <option value="Informasi Lembaga">Informasi Lembaga</option>
                    <option value="Informasi Pendaftaran">Informasi Pendaftaran</option>
                    <option value="Program Pembelajaran">Program Pembelajaran</option>
                    <option value="Informasi Kegiatan">Informasi Kegiatan</option>
                    <option value="Materi Edukasi">Materi Edukasi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#26332A]">Urutan Tampil</label>
                  <input
                    type="number"
                    min={1}
                    value={orderIndex}
                    onChange={(e) => setOrderIndex(Number(e.target.value))}
                    className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] px-3 text-xs font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#26332A]">Deskripsi *</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#E3EAE3] p-3 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#26332A]">
                  Link Tujuan (Opsional)
                </label>
                <input
                  type="text"
                  value={destinationURL}
                  onChange={(e) => setDestinationURL(e.target.value)}
                  placeholder="https://wa.me/... atau /member/documents"
                  className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] px-3 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-[#E3EAE3] px-4 py-2 text-xs font-semibold text-[#6B776D]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-[#315B43] px-4 py-2 text-xs font-semibold text-white"
                >
                  Terbitkan Informasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 3. ADMIN DOCUMENTS VIEW (PRD Section 12)
// ============================================================================
interface AdminDocumentsProps {
  documents: DocumentRecord[];
  onRefresh: () => Promise<void>;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

export const AdminDocumentsView: React.FC<AdminDocumentsProps> = ({
  documents,
  onRefresh,
  onShowToast,
}) => {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('ALL');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocumentRecord | null>(null);

  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('PDF');
  const [category, setCategory] = useState<DocumentCategory>('Materi Pembelajaran');
  const [accessLevel, setAccessLevel] = useState<
    'Publik Member' | 'Khusus Member Aktif' | 'Internal Admin'
  >('Publik Member');
  const [targetAudience, setTargetAudience] = useState<TargetAudience>('Semua Member');
  const [description, setDescription] = useState('');
  const [base64Content, setBase64Content] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const ext = file.name.split('.').pop()?.toUpperCase() || 'PDF';
    setFileType(ext);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setBase64Content(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim() || !description.trim()) {
      onShowToast('Nama file dan deskripsi dokumen wajib diisi.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await apiRequest('/api/documents', {
        method: 'POST',
        body: JSON.stringify({
          fileName: fileName.includes('.') ? fileName : `${fileName}.${fileType.toLowerCase()}`,
          fileType,
          category,
          accessLevel,
          targetAudience,
          description,
          base64Content,
        }),
      });
      await onRefresh();
      setShowUploadModal(false);
      setFileName('');
      setDescription('');
      setBase64Content(null);
      onShowToast('Dokumen berhasil diunggah ke penyimpanan server.', 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Gagal mengunggah dokumen.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    await apiRequest(`/api/documents/${id}`, { method: 'DELETE' });
    await onRefresh();
    onShowToast('Dokumen berhasil dihapus.', 'success');
  };

  const filtered = documents.filter((d) => {
    if (catFilter !== 'ALL' && d.category !== catFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        d.fileName.toLowerCase().includes(q) || d.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#26332A]">
            Pusat Dokumen & Materi Pembelajaran
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#6B776D]">
            Unggah panduan resmi PDF, lembar latihan kaidah huruf, katalog buku Khot, dan atur izin akses member.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[#315B43] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#264734] cursor-pointer"
        >
          <Upload className="h-4 w-4" />
          Unggah Dokumen Baru
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center rounded-2xl border border-[#E3EAE3] bg-white p-4">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B776D]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama file atau deskripsi dokumen..."
            className="h-10 w-full rounded-lg border border-[#E3EAE3] pl-9 pr-3 text-xs"
          />
        </div>
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="h-10 rounded-lg border border-[#E3EAE3] bg-white px-3 text-xs"
        >
          <option value="ALL">Semua Kategori Dokumen</option>
          <option value="Dokumen Resmi">Dokumen Resmi</option>
          <option value="Panduan Peserta">Panduan Peserta</option>
          <option value="Materi Pembelajaran">Materi Pembelajaran</option>
          <option value="Informasi Buku Khot">Informasi Buku Khot</option>
          <option value="Jadwal">Jadwal</option>
          <option value="Formulir">Formulir</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filtered.map((doc) => (
          <div
            key={doc.id}
            className="flex flex-col justify-between rounded-2xl border border-[#E3EAE3] bg-white p-5"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E8EFE7] text-[#315B43] font-mono text-xs font-bold">
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
              </div>
              <p className="mt-3 text-xs text-[#6B776D] leading-relaxed">{doc.description}</p>
              <div className="mt-2 text-[11px] text-[#315B43] font-medium">
                Izin Akses: {doc.accessLevel} · Target: {doc.targetAudience}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#E3EAE3] pt-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewDoc(doc)}
                  className="inline-flex items-center gap-1 rounded-lg bg-[#F3F7F2] px-3 py-1.5 text-xs font-semibold text-[#26332A] hover:bg-[#E8EFE7] cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Preview PDF
                </button>
                <a
                  href={doc.fileURL}
                  download={doc.fileName}
                  className="inline-flex items-center gap-1 rounded-lg bg-[#315B43] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#264734]"
                >
                  <Download className="h-3.5 w-3.5" />
                  Unduh
                </a>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(doc.id)}
                className="text-xs font-semibold text-[#B44238] hover:underline cursor-pointer"
              >
                Hapus
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Preview PDF */}
      {previewDoc && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-2xl rounded-2xl border border-[#E3EAE3] bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E3EAE3] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#26332A]">{previewDoc.fileName}</h3>
                <p className="text-xs text-[#6B776D]">
                  {previewDoc.category} · Diunggah oleh {previewDoc.uploadedBy}
                </p>
              </div>
              <button type="button" onClick={() => setPreviewDoc(null)}>
                <X className="h-5 w-5 text-[#6B776D]" />
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-[#E3EAE3] bg-[#FAFCF9] p-6 space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#315B43]">
                PRATINJAU DOKUMEN RESMI BELAJAR KHOT
              </div>
              <div className="text-sm font-bold text-[#26332A]">{previewDoc.description}</div>
              <p className="text-xs text-[#6B776D] leading-relaxed">
                {previewDoc.contentSummary || previewDoc.description}
              </p>
              <div className="pt-2 text-[11px] font-mono text-[#929B93]">
                Ukuran: {formatFileSize(previewDoc.fileSize)} · Format: {previewDoc.fileType}
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <a
                href={previewDoc.fileURL}
                download={previewDoc.fileName}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#315B43] px-4 py-2 text-xs font-semibold text-white"
              >
                <Download className="h-4 w-4" />
                Unduh File Asli ({previewDoc.fileType})
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Modal Upload */}
      {showUploadModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-lg rounded-2xl border border-[#E3EAE3] bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E3EAE3] pb-3">
              <h2 className="text-base font-bold text-[#26332A]">
                Unggah Dokumen ke Pusat Dokumen
              </h2>
              <button type="button" onClick={() => setShowUploadModal(false)}>
                <X className="h-5 w-5 text-[#6B776D]" />
              </button>
            </div>
            <form onSubmit={handleUpload} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#26332A]">
                  Pilih File dari Perangkat (Opsional)
                </label>
                <input
                  type="file"
                  accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png,.pptx"
                  onChange={handleFileInput}
                  className="mt-1 block w-full text-xs text-[#6B776D] file:mr-3 file:rounded-lg file:border-0 file:bg-[#E8EFE7] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[#315B43]"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-[#26332A]">
                    Nama Dokumen / File *
                  </label>
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="Contoh: Modul_Latihan_Riqah_Bab_1.pdf"
                    className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] px-3 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#26332A]">Format</label>
                  <select
                    value={fileType}
                    onChange={(e) => setFileType(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] bg-white px-3 text-xs"
                  >
                    <option value="PDF">PDF</option>
                    <option value="DOCX">DOCX</option>
                    <option value="XLSX">XLSX</option>
                    <option value="PNG">PNG</option>
                    <option value="JPG">JPG</option>
                    <option value="PPTX">PPTX</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#26332A]">Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                    className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] bg-white px-3 text-xs"
                  >
                    <option value="Materi Pembelajaran">Materi Pembelajaran</option>
                    <option value="Dokumen Resmi">Dokumen Resmi</option>
                    <option value="Panduan Peserta">Panduan Peserta</option>
                    <option value="Informasi Buku Khot">Informasi Buku Khot</option>
                    <option value="Jadwal">Jadwal</option>
                    <option value="Formulir">Formulir</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#26332A]">Hak Akses</label>
                  <select
                    value={accessLevel}
                    onChange={(e) => setAccessLevel(e.target.value as any)}
                    className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] bg-white px-3 text-xs"
                  >
                    <option value="Publik Member">Semua Member Terdaftar</option>
                    <option value="Khusus Member Aktif">Khusus Member Aktif</option>
                    <option value="Internal Admin">Internal Admin Saja</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#26332A]">
                  Deskripsi & Ringkasan Isi Dokumen *
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Jelaskan isi dokumen agar member memahami kegunaannya..."
                  className="mt-1 w-full rounded-lg border border-[#E3EAE3] p-3 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="rounded-lg border border-[#E3EAE3] px-4 py-2 text-xs font-semibold text-[#6B776D]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-[#315B43] px-4 py-2 text-xs font-semibold text-white"
                >
                  {submitting ? 'Mengunggah...' : 'Simpan & Publikasikan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 4. ADMIN CLASSES VIEW (PRD Section 14)
// ============================================================================
interface AdminClassesProps {
  classes: ClassRecord[];
  onRefresh: () => Promise<void>;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

export const AdminClassesView: React.FC<AdminClassesProps> = ({
  classes,
  onRefresh,
  onShowToast,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [className, setClassName] = useState('');
  const [instructor, setInstructor] = useState('Ustadz H. Zulkifli Hasan, M.Ag.');
  const [program, setProgram] = useState<ProgramType>('Khot Naskhi');
  const [learningMethod, setLearningMethod] = useState<LearningMethod>('Online');
  const [schedule, setSchedule] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [offlineLocation, setOfflineLocation] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim() || !schedule.trim()) {
      onShowToast('Nama kelas dan jadwal wajib diisi.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await apiRequest('/api/classes', {
        method: 'POST',
        body: JSON.stringify({
          className,
          instructor,
          program,
          learningMethod,
          schedule,
          meetingLink,
          offlineLocation,
          description,
        }),
      });
      await onRefresh();
      setShowModal(false);
      setClassName('');
      setSchedule('');
      setDescription('');
      onShowToast('Kelas pembelajaran berhasil ditambahkan.', 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Gagal menyimpan kelas.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    await apiRequest(`/api/classes/${id}`, { method: 'DELETE' });
    await onRefresh();
    onShowToast('Kelas berhasil dihapus.', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#26332A]">
            Manajemen Kelas & Program Pembelajaran Khot
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#6B776D]">
            Atur jadwal kelas Khot Naskhi & Khot Riq&apos;ah, tautan ruang belajar Online, serta lokasi studio Offline.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[#315B43] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#264734] cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Tambah Kelas Baru
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {classes.map((cls) => (
          <div
            key={cls.id}
            className="flex flex-col justify-between rounded-2xl border border-[#E3EAE3] bg-white p-5 sm:p-6"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-[#6B776D]">
                <span className="font-semibold text-[#315B43]">
                  {cls.program} · Metode {cls.learningMethod}
                </span>
                <span className="font-mono tabular-nums">
                  {cls.participantIds.length} Peserta Terdaftar
                </span>
              </div>
              <h2 className="mt-1.5 text-base font-bold text-[#26332A]">{cls.className}</h2>
              <div className="mt-1 text-xs font-medium text-[#6B776D]">
                Musyrif / Pengajar: <strong className="text-[#26332A]">{cls.instructor}</strong>
              </div>
              <p className="mt-2.5 text-xs text-[#6B776D] leading-relaxed">{cls.description}</p>

              <div className="mt-4 space-y-2 rounded-xl bg-[#F3F7F2] p-3.5 text-xs">
                <div className="flex items-center gap-2 text-[#26332A]">
                  <Calendar className="h-4 w-4 text-[#315B43]" />
                  <span>
                    Jadwal: <strong>{cls.schedule}</strong>
                  </span>
                </div>
                {cls.learningMethod === 'Online' ? (
                  <div className="flex items-center gap-2 text-[#26332A]">
                    <Video className="h-4 w-4 text-[#315B43]" />
                    <span className="truncate">
                      Link Online:{' '}
                      <a
                        href={cls.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[#315B43] underline"
                      >
                        {cls.meetingLink}
                      </a>
                    </span>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-[#26332A]">
                    <MapPin className="h-4 w-4 shrink-0 text-[#315B43] mt-0.5" />
                    <span>Lokasi Tatap Muka: {cls.offlineLocation}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-[#E3EAE3] pt-3 text-xs">
              <span className="text-[#6B776D]">
                ID Peserta: {cls.participantIds.join(', ') || 'Semua peserta program sesuai'}
              </span>
              <button
                type="button"
                onClick={() => handleDelete(cls.id)}
                className="font-semibold text-[#B44238] hover:underline cursor-pointer"
              >
                Hapus Kelas
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-lg rounded-2xl border border-[#E3EAE3] bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E3EAE3] pb-3">
              <h2 className="text-base font-bold text-[#26332A]">Tambah Kelas Pembelajaran</h2>
              <button type="button" onClick={() => setShowModal(false)}>
                <X className="h-5 w-5 text-[#6B776D]" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#26332A]">Nama Kelas *</label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="Contoh: Halaqah Khot Naskhi Angkatan V"
                  className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] px-3 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#26332A]">Program Khot</label>
                  <select
                    value={program}
                    onChange={(e) => setProgram(e.target.value as ProgramType)}
                    className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] bg-white px-3 text-xs"
                  >
                    <option value="Khot Naskhi">Khot Naskhi</option>
                    <option value="Khot Riq'ah">Khot Riq&apos;ah</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#26332A]">Metode Belajar</label>
                  <select
                    value={learningMethod}
                    onChange={(e) => setLearningMethod(e.target.value as LearningMethod)}
                    className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] bg-white px-3 text-xs"
                  >
                    <option value="Online">Online</option>
                    <option value="Offline">Offline</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#26332A]">Pengajar</label>
                  <input
                    type="text"
                    value={instructor}
                    onChange={(e) => setInstructor(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] px-3 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#26332A]">Jadwal *</label>
                  <input
                    type="text"
                    value={schedule}
                    onChange={(e) => setSchedule(e.target.value)}
                    placeholder="Sabtu, 08:30 - 10:30 WIB"
                    className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] px-3 text-xs"
                  />
                </div>
              </div>
              {learningMethod === 'Online' ? (
                <div>
                  <label className="block text-xs font-semibold text-[#26332A]">
                    Tautan Pertemuan Online (Zoom / Google Meet)
                  </label>
                  <input
                    type="text"
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    placeholder="https://meet.google.com/..."
                    className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] px-3 text-xs"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-[#26332A]">
                    Alamat / Lokasi Kelas Offline
                  </label>
                  <input
                    type="text"
                    value={offlineLocation}
                    onChange={(e) => setOfflineLocation(e.target.value)}
                    placeholder="Griya Kaligrafi Belajar Khot, Jakarta Selatan"
                    className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] px-3 text-xs"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-[#26332A]">Deskripsi Kelas</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#E3EAE3] p-3 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-[#E3EAE3] px-4 py-2 text-xs font-semibold text-[#6B776D]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-[#315B43] px-4 py-2 text-xs font-semibold text-white"
                >
                  Simpan Kelas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 5. ADMIN DIGITAL MEMBER CARDS STUDIO (PRD Section 13 + Member Color Customizer)
// ============================================================================
interface AdminCardsStudioProps {
  profiles: CombinedMemberProfile[];
  settings: InstitutionSettings | null;
  onNavigate: (path: string) => void;
  onRefresh?: () => Promise<void>;
  onShowToast?: (msg: string, type?: 'success' | 'error') => void;
}

export const AdminCardsStudioView: React.FC<AdminCardsStudioProps> = ({
  profiles,
  settings,
  onNavigate,
  onRefresh,
  onShowToast,
}) => {
  const memberProfiles = profiles.filter((p) => p.user.role === 'member');
  const [selectedId, setSelectedId] = useState<string>(
    memberProfiles[0]?.member.memberId || 'BK-00001'
  );

  const currentTheme = resolveMemberThemeColors(settings, null);
  const [presetId, setPresetId] = useState<MemberColorPresetId>(currentTheme.presetId);
  const [primaryColor, setPrimaryColor] = useState(currentTheme.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(currentTheme.secondaryColor);
  const [accentColor, setAccentColor] = useState(currentTheme.accentColor);
  const [memberCustomColor, setMemberCustomColor] = useState<string>('');
  const [savingTheme, setSavingTheme] = useState(false);

  const activeProfile =
    memberProfiles.find((p) => p.member.memberId === selectedId) || memberProfiles[0];

  useEffect(() => {
    const resolved = resolveMemberThemeColors(settings, null);
    setPresetId(resolved.presetId);
    setPrimaryColor(resolved.primaryColor);
    setSecondaryColor(resolved.secondaryColor);
    setAccentColor(resolved.accentColor);
  }, [settings]);

  useEffect(() => {
    setMemberCustomColor(activeProfile?.member.customCardColor || '');
  }, [activeProfile?.member.memberId, activeProfile?.member.customCardColor]);

  const handleSelectPreset = (preset: MemberColorTheme) => {
    setPresetId(preset.presetId);
    setPrimaryColor(preset.primaryColor);
    setSecondaryColor(preset.secondaryColor);
    setAccentColor(preset.accentColor);
  };

  const handleSaveThemeColors = async () => {
    setSavingTheme(true);
    try {
      const nextTheme: MemberColorTheme = {
        presetId,
        primaryColor,
        secondaryColor,
        accentColor,
      };
      await apiRequest('/api/settings', {
        method: 'PUT',
        body: JSON.stringify({ memberColorTheme: nextTheme }),
      });

      if (activeProfile && memberCustomColor !== (activeProfile.member.customCardColor || '')) {
        await apiRequest(`/api/members/${activeProfile.member.memberId}`, {
          method: 'PUT',
          body: JSON.stringify({ customCardColor: memberCustomColor }),
        });
      }

      if (onRefresh) await onRefresh();
      if (onShowToast) {
        onShowToast(
          'Tema warna Kartu Member & Portal Member berhasil diperbarui oleh Admin Utama.',
          'success'
        );
      }
    } catch (err: any) {
      if (onShowToast) {
        onShowToast(err.message || 'Gagal menyimpan tema warna member.', 'error');
      }
    } finally {
      setSavingTheme(false);
    }
  };

  const previewSettings: InstitutionSettings | null = settings
    ? {
        ...settings,
        memberColorTheme: {
          presetId,
          primaryColor,
          secondaryColor,
          accentColor,
        },
        cardSettings: {
          ...settings.cardSettings,
          memberColorTheme: {
            presetId,
            primaryColor,
            secondaryColor,
            accentColor,
          },
        },
      }
    : null;

  const previewProfile = activeProfile
    ? {
        ...activeProfile,
        member: {
          ...activeProfile.member,
          customCardColor: memberCustomColor,
        },
      }
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#26332A]">
            Studio Cetak Kartu (PDF / Printer) & Kustomisasi Warna Member
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#6B776D]">
            Unduh Kartu Member format PDF siap cetak, cetak langsung ke printer, atau ubah warna tema kartu & portal member (khusus Admin Utama).
          </p>
        </div>
      </div>

      {/* Admin Utama: Member Color Customizer Bar */}
      <div className="rounded-2xl border border-[#E3EAE3] bg-white p-5 space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[#E3EAE3] pb-3">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <Palette className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#26332A]">
                Pengaturan Warna Member & Kartu Anggota (Admin Utama)
              </h2>
              <p className="text-xs text-[#6B776D]">
                Pilih preset warna resmi atau sesuaikan kode warna Hex untuk seluruh Kartu Member Digital dan tampilan Portal Member.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={savingTheme}
            onClick={handleSaveThemeColors}
            className="inline-flex items-center gap-2 rounded-lg bg-[#315B43] px-4 py-2 text-xs font-semibold text-white hover:bg-[#264734] cursor-pointer disabled:opacity-50 self-start sm:self-auto"
          >
            <Palette className="h-3.5 w-3.5" />
            {savingTheme ? 'Menyimpan Warna...' : 'Simpan Tema Warna Member'}
          </button>
        </div>

        {/* Preset Swatches */}
        <div>
          <span className="block text-xs font-semibold text-[#26332A] mb-2">
            1. Pilih Preset Tema Warna Member Resmi:
          </span>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
            {MEMBER_COLOR_PRESETS.map((preset) => {
              const active = presetId === preset.presetId;
              return (
                <button
                  key={preset.presetId}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition-all cursor-pointer ${
                    active
                      ? 'border-[#315B43] ring-2 ring-[#315B43]/25 bg-[#F3F7F2]'
                      : 'border-[#E3EAE3] bg-white hover:border-[#C7D7C8]'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-5 w-5 rounded-full border border-black/10"
                      style={{ backgroundColor: preset.primaryColor }}
                    />
                    <span
                      className="h-4 w-4 rounded-full border border-black/10"
                      style={{ backgroundColor: preset.secondaryColor }}
                    />
                    <span
                      className="h-3.5 w-3.5 rounded-full border border-black/10"
                      style={{ backgroundColor: preset.accentColor }}
                    />
                  </div>
                  <div className="mt-2 text-xs font-bold text-[#26332A] line-clamp-1">
                    {preset.label}
                  </div>
                  <div className="text-[10px] text-[#6B776D] line-clamp-1">
                    {preset.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Hex Pickers + Per-Member Override */}
        <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-[#E3EAE3] bg-[#FAFCF9] p-3">
            <label className="block text-[11px] font-semibold text-[#6B776D]">
              Warna Utama Member (Primary)
            </label>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => {
                  setPresetId('custom');
                  setPrimaryColor(e.target.value);
                }}
                aria-label="Pilih warna utama member"
                className="h-8 w-10 cursor-pointer rounded border border-[#E3EAE3] bg-transparent p-0.5"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => {
                  setPresetId('custom');
                  setPrimaryColor(e.target.value);
                }}
                className="h-8 flex-1 rounded-lg border border-[#E3EAE3] bg-white px-2.5 font-mono text-xs uppercase"
              />
            </div>
          </div>

          <div className="rounded-xl border border-[#E3EAE3] bg-[#FAFCF9] p-3">
            <label className="block text-[11px] font-semibold text-[#6B776D]">
              Warna Gradasi Gelap (Secondary)
            </label>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => {
                  setPresetId('custom');
                  setSecondaryColor(e.target.value);
                }}
                aria-label="Pilih warna gradasi gelap"
                className="h-8 w-10 cursor-pointer rounded border border-[#E3EAE3] bg-transparent p-0.5"
              />
              <input
                type="text"
                value={secondaryColor}
                onChange={(e) => {
                  setPresetId('custom');
                  setSecondaryColor(e.target.value);
                }}
                className="h-8 flex-1 rounded-lg border border-[#E3EAE3] bg-white px-2.5 font-mono text-xs uppercase"
              />
            </div>
          </div>

          <div className="rounded-xl border border-[#E3EAE3] bg-[#FAFCF9] p-3">
            <label className="block text-[11px] font-semibold text-[#6B776D]">
              Warna Aksen / Lencana (Accent)
            </label>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                type="color"
                value={accentColor}
                onChange={(e) => {
                  setPresetId('custom');
                  setAccentColor(e.target.value);
                }}
                aria-label="Pilih warna aksen"
                className="h-8 w-10 cursor-pointer rounded border border-[#E3EAE3] bg-transparent p-0.5"
              />
              <input
                type="text"
                value={accentColor}
                onChange={(e) => {
                  setPresetId('custom');
                  setAccentColor(e.target.value);
                }}
                className="h-8 flex-1 rounded-lg border border-[#E3EAE3] bg-white px-2.5 font-mono text-xs uppercase"
              />
            </div>
          </div>

          <div className="rounded-xl border border-[#E3EAE3] bg-[#FAFCF9] p-3">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-semibold text-[#6B776D]">
                Warna Khusus Member Ini ({activeProfile?.member.memberId || '-'})
              </label>
              {memberCustomColor && (
                <button
                  type="button"
                  onClick={() => setMemberCustomColor('')}
                  className="text-[10px] font-semibold text-[#B44238] hover:underline cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                type="color"
                value={memberCustomColor || primaryColor}
                onChange={(e) => setMemberCustomColor(e.target.value)}
                aria-label="Pilih warna khusus member terpilih"
                className="h-8 w-10 cursor-pointer rounded border border-[#E3EAE3] bg-transparent p-0.5"
              />
              <input
                type="text"
                value={memberCustomColor}
                onChange={(e) => setMemberCustomColor(e.target.value)}
                placeholder="Ikuti Tema Global"
                className="h-8 flex-1 rounded-lg border border-[#E3EAE3] bg-white px-2.5 font-mono text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Member Selector List */}
        <div className="rounded-2xl border border-[#E3EAE3] bg-white p-4 lg:col-span-4 space-y-2 max-h-[540px] overflow-y-auto">
          <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-[#6B776D]">
            Pilih Anggota ({memberProfiles.length})
          </div>
          {memberProfiles.length === 0 && (
            <div className="rounded-xl bg-[#FAFCF9] p-4 text-xs text-[#6B776D] text-center">
              Belum ada data peserta (Mode Kosongan / Fresh aktif). Silakan tambah peserta baru atau hidupkan Mode Demo.
            </div>
          )}
          {memberProfiles.map((p) => {
            const isSelected = p.member.memberId === activeProfile?.member.memberId;
            return (
              <button
                key={p.member.memberId}
                type="button"
                onClick={() => setSelectedId(p.member.memberId)}
                className={`w-full rounded-xl p-3 text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#315B43] text-white'
                    : 'bg-[#FAFCF9] text-[#26332A] hover:bg-[#E8EFE7]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold tabular-nums flex items-center gap-1.5">
                    {p.member.customCardColor && (
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full border border-white/50"
                        style={{ backgroundColor: p.member.customCardColor }}
                      />
                    )}
                    {p.member.memberId}
                  </span>
                  <span
                    className={`text-[11px] font-semibold ${
                      isSelected ? 'text-[#A3D1B3]' : 'text-[#6B776D]'
                    }`}
                  >
                    {p.member.membershipStatus}
                  </span>
                </div>
                <div className="mt-0.5 text-sm font-bold truncate">{p.user.fullName}</div>
                <div
                  className={`text-[11px] ${
                    isSelected ? 'text-white/80' : 'text-[#6B776D]'
                  }`}
                >
                  {p.member.program} · {p.member.learningMethod}
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Card Preview */}
        <div className="lg:col-span-8">
          {previewProfile ? (
            <DigitalMemberCard
              profile={previewProfile}
              settings={previewSettings}
              onOpenVerify={(id) => onNavigate(`/verify-member/${id}`)}
            />
          ) : (
            <div className="rounded-2xl border border-[#E3EAE3] bg-white p-10 text-center space-y-3">
              <div className="text-sm font-bold text-[#26332A]">
                Belum Ada Peserta Terdaftar (Aplikasi Bersih / Mode Kosongan)
              </div>
              <p className="text-xs text-[#6B776D] max-w-md mx-auto">
                Tambahkan peserta baru melalui menu Data Peserta atau aktifkan kembali Mode Demo di Pengaturan Lembaga untuk melihat contoh kartu.
              </p>
              <div className="pt-2 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate('/admin/members/add')}
                  className="rounded-lg bg-[#315B43] px-4 py-2 text-xs font-semibold text-white cursor-pointer"
                >
                  + Tambah Peserta Pertama
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 6. ADMIN NOTIFICATIONS, ACTIVITY LOGS & SETTINGS (PRD Sections 15, 17, 18, 23)
// ============================================================================
interface AdminLogsNotificationsSettingsProps {
  tab: 'notifications' | 'logs' | 'settings';
  notifications: NotificationRecord[];
  logs: ActivityLogRecord[];
  settings: InstitutionSettings | null;
  onRefresh: () => Promise<void>;
  onNavigate: (path: string) => void;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

const GOOGLE_APPS_SCRIPT_CODE_GS = `/**
 * ============================================================================
 * FILE 1: Code.gs — SERVER API UTAMA (doGet & doPost) BELAJAR KHOT
 * ============================================================================
 * Cara Pemasangan di Google Apps Script:
 * 1. Buka Google Spreadsheet Anda -> klik menu Extensions (Ekstensi) -> Apps Script.
 * 2. Pada file \`Code.gs\`, hapus seluruh kode bawaan lalu tempelkan (Paste) kode ini.
 * 3. Buat file kedua bernama \`Setup.gs\` (klik tanda "+" -> Script) dan tempelkan kode Setup.gs.
 * 4. Klik Deploy -> New deployment -> Pilih jenis "Web app":
 *    - Execute as: Me (Email Anda)
 *    - Who has access: Anyone (Siapa saja)
 * 5. Salin Web App URL (berakhiran /exec) ke Pengaturan Lembaga Belajar Khot / Vercel.
 */

var DEFAULT_SHEET_NAMES = {
  RAW_SNAPSHOT: 'DatabaseSnapshot',
  USERS: 'Users',
  MEMBERS: 'Members',
  ANNOUNCEMENTS: 'Announcements',
  INFORMATION: 'Information',
  DOCUMENTS: 'Documents',
  CLASSES: 'Classes',
  NOTIFICATIONS: 'Notifications',
  READ_RECEIPTS: 'ReadReceipts',
  ACTIVITY_LOGS: 'ActivityLogs',
  SETTINGS: 'Settings'
};

function getDatabaseSpreadsheet() {
  var ss = null;
  try {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  } catch (e) {
    ss = null;
  }
  if (ss) return ss;

  var props = PropertiesService.getScriptProperties();
  var savedId = props.getProperty('BELAJAR_KHOT_SPREADSHEET_ID');
  if (savedId) {
    try {
      ss = SpreadsheetApp.openById(savedId);
      if (ss) return ss;
    } catch (e2) {
      ss = null;
    }
  }

  ss = SpreadsheetApp.create('Database Resmi Belajar Khot');
  props.setProperty('BELAJAR_KHOT_SPREADSHEET_ID', ss.getId());
  return ss;
}

function getOrCreateSheet(ss, sheetName, defaultHeaders) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  if (defaultHeaders && defaultHeaders.length > 0 && sheet.getLastRow() === 0) {
    var headerRange = sheet.getRange(1, 1, 1, defaultHeaders.length);
    headerRange.setValues([defaultHeaders]);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#19432D');
    headerRange.setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function doGet(e) {
  try {
    var action =
      e && e.parameter && e.parameter.action ? e.parameter.action : 'getSnapshot';
    var ss = getDatabaseSpreadsheet();

    if (typeof setupDatabaseSheets === 'function') {
      setupDatabaseSheets();
    }

    var names =
      typeof SHEET_NAMES !== 'undefined' ? SHEET_NAMES : DEFAULT_SHEET_NAMES;

    var snapshotSheet = getOrCreateSheet(ss, names.RAW_SNAPSHOT, [
      'UpdatedAt',
      'Version',
      'JsonPayload'
    ]);

    if (action === 'ping') {
      return jsonResponse({
        ok: true,
        service: 'Belajar Khot Google Sheets Cloud Database',
        spreadsheetName: ss.getName(),
        spreadsheetUrl: ss.getUrl(),
        timestamp: new Date().toISOString()
      });
    }

    var lastRow = snapshotSheet.getLastRow();
    var rawJson = '';
    var updatedAt = null;

    if (lastRow >= 2) {
      updatedAt = snapshotSheet.getRange(2, 1).getValue();
      rawJson = snapshotSheet.getRange(2, 3).getValue();
    }
    if (!rawJson && lastRow >= 1) {
      var cellA1 = snapshotSheet.getRange(1, 1).getValue();
      if (cellA1 && String(cellA1).trim().indexOf('{') === 0) {
        rawJson = cellA1;
      }
    }

    if (!rawJson) {
      return jsonResponse({
        ok: true,
        hasData: false,
        spreadsheetName: ss.getName(),
        spreadsheetUrl: ss.getUrl(),
        updatedAt: null,
        data: null,
        database: null
      });
    }

    var parsed = JSON.parse(String(rawJson));
    return jsonResponse({
      ok: true,
      hasData: true,
      spreadsheetName: ss.getName(),
      spreadsheetUrl: ss.getUrl(),
      updatedAt: updatedAt || new Date().toISOString(),
      data: parsed,
      database: parsed
    });
  } catch (err) {
    return jsonResponse({
      ok: false,
      error: String(err)
    });
  }
}

function doPost(e) {
  try {
    var rawBody =
      e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    var body = JSON.parse(rawBody);
    var action = body.action || 'saveSnapshot';
    var ss = getDatabaseSpreadsheet();

    if (typeof setupDatabaseSheets === 'function') {
      setupDatabaseSheets();
    }

    var dbPayload = body.data || body.database || null;

    if ((action === 'saveSnapshot' || action === 'sync') && dbPayload) {
      var nowIso = new Date().toISOString();
      var names =
        typeof SHEET_NAMES !== 'undefined' ? SHEET_NAMES : DEFAULT_SHEET_NAMES;
      var cols =
        typeof SHEET_COLUMNS !== 'undefined' ? SHEET_COLUMNS : {};

      // 1. Simpan Snapshot JSON Utuh di sheet DatabaseSnapshot
      var snapshotSheet = getOrCreateSheet(ss, names.RAW_SNAPSHOT, [
        'UpdatedAt',
        'Version',
        'JsonPayload'
      ]);
      snapshotSheet.clearContents();
      snapshotSheet
        .getRange(1, 1, 1, 3)
        .setValues([['UpdatedAt', 'Version', 'JsonPayload']]);
      snapshotSheet.getRange(1, 1, 1, 3).setFontWeight('bold');
      snapshotSheet
        .getRange(2, 1, 1, 3)
        .setValues([[nowIso, '2.0', JSON.stringify(dbPayload)]]);

      // 2. Sinkronisasikan setiap tabel ke Sheet masing-masing (otomatis dibuat jika belum ada)
      syncArrayToSheet(getOrCreateSheet(ss, names.USERS, cols.Users), dbPayload.users || [], cols.Users);
      syncArrayToSheet(getOrCreateSheet(ss, names.MEMBERS, cols.Members), dbPayload.members || [], cols.Members);
      syncArrayToSheet(getOrCreateSheet(ss, names.ANNOUNCEMENTS, cols.Announcements), dbPayload.announcements || [], cols.Announcements);
      syncArrayToSheet(getOrCreateSheet(ss, names.INFORMATION, cols.Information), dbPayload.information || [], cols.Information);
      syncArrayToSheet(getOrCreateSheet(ss, names.DOCUMENTS, cols.Documents), dbPayload.documents || [], cols.Documents);
      syncArrayToSheet(getOrCreateSheet(ss, names.CLASSES, cols.Classes), dbPayload.classes || [], cols.Classes);
      syncArrayToSheet(getOrCreateSheet(ss, names.NOTIFICATIONS, cols.Notifications), dbPayload.notifications || [], cols.Notifications);
      syncArrayToSheet(getOrCreateSheet(ss, names.READ_RECEIPTS, cols.ReadReceipts), dbPayload.readReceipts || [], cols.ReadReceipts);
      syncArrayToSheet(getOrCreateSheet(ss, names.ACTIVITY_LOGS, cols.ActivityLogs), (dbPayload.activityLogs || []).slice(0, 200), cols.ActivityLogs);
      syncSettingsToSheet(getOrCreateSheet(ss, names.SETTINGS, ['Key', 'Value', 'UpdatedAt']), dbPayload.settings || {}, nowIso);

      return jsonResponse({
        ok: true,
        syncedAt: nowIso,
        updatedAt: nowIso,
        spreadsheetName: ss.getName(),
        spreadsheetUrl: ss.getUrl(),
        message: 'Seluruh tabel database berhasil disinkronkan ke Google Sheets (' + ss.getName() + ').'
      });
    }

    if (action === 'clearAll' && typeof clearAllSheetsData === 'function') {
      return jsonResponse(clearAllSheetsData());
    }

    return jsonResponse({
      ok: false,
      error: 'Action tidak dikenali: ' + action
    });
  } catch (err) {
    return jsonResponse({
      ok: false,
      error: String(err)
    });
  }
}

function syncArrayToSheet(sheet, records, predefinedColumns) {
  if (!sheet) return;
  sheet.clearContents();

  var headers =
    predefinedColumns && predefinedColumns.length > 0
      ? predefinedColumns
      : records && records.length > 0
      ? Object.keys(records[0])
      : ['Info'];

  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#19432D');
  headerRange.setFontColor('#FFFFFF');

  if (!records || records.length === 0) return;

  var rows = [];
  for (var i = 0; i < records.length; i++) {
    var item = records[i];
    var row = [];
    for (var c = 0; c < headers.length; c++) {
      var key = headers[c];
      var val = item[key];
      if (val === null || val === undefined) {
        row.push('');
      } else if (typeof val === 'object') {
        row.push(JSON.stringify(val));
      } else {
        row.push(String(val));
      }
    }
    rows.push(row);
  }
  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
}

function syncSettingsToSheet(sheet, settingsObj, updatedAt) {
  if (!sheet || !settingsObj) return;
  sheet.clearContents();
  var headerRange = sheet.getRange(1, 1, 1, 3);
  headerRange.setValues([['Key', 'Value', 'UpdatedAt']]);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#19432D');
  headerRange.setFontColor('#FFFFFF');

  var keys = Object.keys(settingsObj);
  if (keys.length === 0) return;

  var rows = [];
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    var v = settingsObj[k];
    rows.push([
      k,
      v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v),
      updatedAt
    ]);
  }
  sheet.getRange(2, 1, rows.length, 3).setValues(rows);
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}`;

const GOOGLE_APPS_SCRIPT_SETUP_GS = `/**
 * ============================================================================
 * FILE 2: Setup.gs — INISIALISASI TABEL, SKEMA KOLOM & MENU GOOGLE SHEETS
 * ============================================================================
 * Cara Pemasangan di Google Apps Script:
 * 1. Di editor Apps Script, klik tombol "+" (Tambah file) di sebelah "Files" -> Pilih "Script".
 * 2. Beri nama file: Setup  (otomatis menjadi Setup.gs).
 * 3. Hapus isi bawaannya, lalu tempelkan (Paste) seluruh kode Setup.gs ini.
 * 4. Pilih fungsi \`setupDatabaseSheets\` di toolbar atas, lalu klik "Run" (Jalankan)
 *    sekali untuk memberikan izin (Authorize) dan membuat seluruh Sheet otomatis.
 */

var SHEET_NAMES = {
  RAW_SNAPSHOT: 'DatabaseSnapshot',
  USERS: 'Users',
  MEMBERS: 'Members',
  ANNOUNCEMENTS: 'Announcements',
  INFORMATION: 'Information',
  DOCUMENTS: 'Documents',
  CLASSES: 'Classes',
  NOTIFICATIONS: 'Notifications',
  READ_RECEIPTS: 'ReadReceipts',
  ACTIVITY_LOGS: 'ActivityLogs',
  SETTINGS: 'Settings'
};

var SHEET_COLUMNS = {
  DatabaseSnapshot: ['UpdatedAt', 'Version', 'JsonPayload'],
  Users: [
    'uid', 'memberId', 'username', 'fullName', 'gender', 'phone', 'email',
    'city', 'role', 'accountStatus', 'createdAt', 'updatedAt', 'lastLoginAt', 'isDemo'
  ],
  Members: [
    'id', 'uid', 'memberId', 'program', 'learningMethod', 'bookPurchaseStatus',
    'membershipStatus', 'agreedToRules', 'joinDate', 'verificationDate',
    'customCardColor', 'adminNotes', 'isDemo'
  ],
  Announcements: [
    'id', 'title', 'category', 'targetAudience', 'isPinned', 'isImportant',
    'status', 'publishAt', 'createdBy', 'content', 'isDemo'
  ],
  Information: [
    'id', 'title', 'category', 'targetAudience', 'status', 'orderIndex',
    'destinationURL', 'publishAt', 'description', 'isDemo'
  ],
  Documents: [
    'id', 'fileName', 'fileType', 'fileSize', 'category', 'accessLevel',
    'targetAudience', 'status', 'uploadedBy', 'uploadedAt', 'description', 'isDemo'
  ],
  Classes: [
    'id', 'className', 'instructor', 'program', 'learningMethod', 'schedule',
    'meetingLink', 'offlineLocation', 'status', 'participantIds', 'description', 'isDemo'
  ],
  Notifications: [
    'id', 'recipientUid', 'title', 'message', 'type', 'isRead', 'createdAt', 'linkTo', 'isDemo'
  ],
  ReadReceipts: ['id', 'announcementId', 'uid', 'readAt'],
  ActivityLogs: [
    'id', 'createdAt', 'actorUid', 'actorName', 'activityType', 'description', 'targetId', 'isDemo'
  ],
  Settings: ['Key', 'Value', 'UpdatedAt']
};

function resolveSetupSpreadsheet() {
  if (typeof getDatabaseSpreadsheet === 'function') {
    return getDatabaseSpreadsheet();
  }
  var ss = null;
  try {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  } catch (e) {
    ss = null;
  }
  if (ss) return ss;
  var props = PropertiesService.getScriptProperties();
  var savedId = props.getProperty('BELAJAR_KHOT_SPREADSHEET_ID');
  if (savedId) {
    try {
      ss = SpreadsheetApp.openById(savedId);
      if (ss) return ss;
    } catch (e2) {
      ss = null;
    }
  }
  ss = SpreadsheetApp.create('Database Resmi Belajar Khot');
  props.setProperty('BELAJAR_KHOT_SPREADSHEET_ID', ss.getId());
  return ss;
}

function onOpen() {
  try {
    var ui = SpreadsheetApp.getUi();
    ui.createMenu('Belajar Khot DB')
      .addItem('1. Inisialisasi / Buat Semua Sheet Database', 'setupDatabaseSheets')
      .addItem('2. Rapikan Format & Warna Header Tabel', 'formatAllSheetsStyle')
      .addSeparator()
      .addItem('3. Kosongkan Data (Reset ke Mode Kosongan)', 'clearAllSheetsData')
      .addToUi();
  } catch (err) {}
}

function setupDatabaseSheets() {
  var ss = resolveSetupSpreadsheet();
  var keys = Object.keys(SHEET_NAMES);

  for (var i = 0; i < keys.length; i++) {
    var sheetName = SHEET_NAMES[keys[i]];
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }

    var cols = SHEET_COLUMNS[sheetName];
    if (cols && cols.length > 0 && sheet.getLastRow() === 0) {
      var headerRange = sheet.getRange(1, 1, 1, cols.length);
      headerRange.setValues([cols]);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#19432D');
      headerRange.setFontColor('#FFFFFF');
      sheet.setFrozenRows(1);
    }
  }

  return {
    ok: true,
    spreadsheetName: ss.getName(),
    spreadsheetUrl: ss.getUrl(),
    message: 'Seluruh 11 Sheet Database Belajar Khot berhasil dibuat dan disiapkan.'
  };
}

function formatAllSheetsStyle() {
  var ss = resolveSetupSpreadsheet();
  var keys = Object.keys(SHEET_NAMES);

  for (var i = 0; i < keys.length; i++) {
    var sheetName = SHEET_NAMES[keys[i]];
    var sheet = ss.getSheetByName(sheetName);
    var cols = SHEET_COLUMNS[sheetName];
    if (sheet && cols && cols.length > 0) {
      var headerRange = sheet.getRange(1, 1, 1, cols.length);
      headerRange.setValues([cols]);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#19432D');
      headerRange.setFontColor('#FFFFFF');
      sheet.setFrozenRows(1);
    }
  }
}

function clearAllSheetsData() {
  var ss = resolveSetupSpreadsheet();
  var keys = Object.keys(SHEET_NAMES);

  for (var i = 0; i < keys.length; i++) {
    var sheetName = SHEET_NAMES[keys[i]];
    var sheet = ss.getSheetByName(sheetName);
    if (sheet) {
      sheet.clearContents();
      var cols = SHEET_COLUMNS[sheetName];
      if (cols && cols.length > 0) {
        sheet.getRange(1, 1, 1, cols.length).setValues([cols]);
      }
    }
  }

  return { ok: true, message: 'Seluruh tabel berhasil dikosongkan (Mode Fresh).' };
}`;

export const AdminLogsNotificationsSettingsView: React.FC<
  AdminLogsNotificationsSettingsProps
> = ({ tab, notifications, logs, settings, onRefresh, onNavigate, onShowToast }) => {
  const [instName, setInstName] = useState(settings?.institutionName || 'BELAJAR KHOT');
  const [logoURL, setLogoURL] = useState(settings?.logoURL || '');
  const [waNumber, setWaNumber] = useState(settings?.whatsappNumber || '6281110002026');
  const [waGroupURL, setWaGroupURL] = useState(settings?.whatsappGroupURL || '');
  const [waInstructions, setWaInstructions] = useState(
    settings?.whatsappGroupInstructions || ''
  );
  const [address, setAddress] = useState(settings?.address || '');
  const [bookInfo, setBookInfo] = useState(settings?.bookRequirementInfo || '');
  const [googleAppsScriptUrl, setGoogleAppsScriptUrl] = useState(
    settings?.googleAppsScriptUrl || ''
  );
  const [lastGoogleSheetsSync, setLastGoogleSheetsSync] = useState<string | null>(
    settings?.lastGoogleSheetsSync || null
  );
  const [syncingSheets, setSyncingSheets] = useState(false);
  const [showAppsScriptCode, setShowAppsScriptCode] = useState(false);
  const [activeScriptTab, setActiveScriptTab] = useState<'code' | 'setup'>('code');
  const [saving, setSaving] = useState(false);

  const initialTheme = resolveMemberThemeColors(settings, null);
  const [colorPresetId, setColorPresetId] = useState<MemberColorPresetId>(
    initialTheme.presetId
  );
  const [primaryColor, setPrimaryColor] = useState(initialTheme.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(initialTheme.secondaryColor);
  const [accentColor, setAccentColor] = useState(initialTheme.accentColor);
  const isDemoEnabled = settings?.demoModeEnabled !== false;

  useEffect(() => {
    if (settings) {
      setInstName(settings.institutionName || 'BELAJAR KHOT');
      setLogoURL(settings.logoURL || '');
      setWaNumber(settings.whatsappNumber || '6281110002026');
      setWaGroupURL(settings.whatsappGroupURL || '');
      setWaInstructions(settings.whatsappGroupInstructions || '');
      setAddress(settings.address || '');
      setBookInfo(settings.bookRequirementInfo || '');
      if (settings.googleAppsScriptUrl !== undefined) {
        setGoogleAppsScriptUrl(settings.googleAppsScriptUrl || '');
      }
      if (settings.lastGoogleSheetsSync !== undefined) {
        setLastGoogleSheetsSync(settings.lastGoogleSheetsSync || null);
      }
      const resolved = resolveMemberThemeColors(settings, null);
      setColorPresetId(resolved.presetId);
      setPrimaryColor(resolved.primaryColor);
      setSecondaryColor(resolved.secondaryColor);
      setAccentColor(resolved.accentColor);
    }
  }, [settings]);

  useEffect(() => {
    if (tab === 'settings') {
      apiRequest<{
        connected: boolean;
        googleAppsScriptUrl: string;
        lastGoogleSheetsSync: string | null;
      }>('/api/database/status')
        .then((res) => {
          if (res?.googleAppsScriptUrl) {
            setGoogleAppsScriptUrl(res.googleAppsScriptUrl);
          }
          if (res?.lastGoogleSheetsSync) {
            setLastGoogleSheetsSync(res.lastGoogleSheetsSync);
          }
        })
        .catch(() => {
          // ignore status check error
        });
    }
  }, [tab]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiRequest('/api/settings', {
        method: 'PUT',
        body: JSON.stringify({
          institutionName: instName,
          logoURL: logoURL.trim(),
          whatsappNumber: waNumber,
          whatsappGroupURL: waGroupURL,
          whatsappGroupInstructions: waInstructions,
          address,
          bookRequirementInfo: bookInfo,
          googleAppsScriptUrl: googleAppsScriptUrl.trim(),
          memberColorTheme: {
            presetId: colorPresetId,
            primaryColor,
            secondaryColor,
            accentColor,
          },
        }),
      });
      await onRefresh();
      onShowToast(
        'Pengaturan lembaga, ikon aplikasi, tema warna member & database berhasil disimpan.',
        'success'
      );
    } catch (err: any) {
      onShowToast(err.message || 'Gagal menyimpan pengaturan.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSyncGoogleSheets = async (direction: 'push' | 'pull') => {
    setSyncingSheets(true);
    try {
      const res = await apiRequest<{
        success: boolean;
        syncedAt?: string;
        message?: string;
      }>('/api/database/sync', {
        method: 'POST',
        body: JSON.stringify({
          direction,
          googleAppsScriptUrl: googleAppsScriptUrl.trim(),
        }),
      });
      if (res?.syncedAt) {
        setLastGoogleSheetsSync(res.syncedAt);
      }
      await onRefresh();
      onShowToast(
        res?.message ||
          (direction === 'pull'
            ? 'Data berhasil ditarik dari Google Sheets.'
            : 'Database berhasil disinkronkan ke Google Sheets.'),
        'success'
      );
    } catch (err: any) {
      onShowToast(
        err.message || 'Gagal melakukan sinkronisasi dengan Google Apps Script.',
        'error'
      );
    } finally {
      setSyncingSheets(false);
    }
  };

  const handleCopyAppsScriptCode = async (targetFile: 'code' | 'setup' = 'code') => {
    const content =
      targetFile === 'setup' ? GOOGLE_APPS_SCRIPT_SETUP_GS : GOOGLE_APPS_SCRIPT_CODE_GS;
    const label = targetFile === 'setup' ? 'Setup.gs' : 'Code.gs';
    try {
      await navigator.clipboard.writeText(content);
      onShowToast(
        `Kode Google Apps Script (${label}) berhasil disalin ke clipboard!`,
        'success'
      );
    } catch {
      setActiveScriptTab(targetFile);
      setShowAppsScriptCode(true);
      onShowToast(
        `Silakan salin kode Google Apps Script (${label}) dari kotak di bawah.`,
        'success'
      );
    }
  };

  const handleToggleDemoMode = async (enableDemo: boolean) => {
    setSaving(true);
    try {
      await apiRequest('/api/demo/toggle', {
        method: 'POST',
        body: JSON.stringify({ enabled: enableDemo }),
      });
      await onRefresh();
      onShowToast(
        enableDemo
          ? 'Mode Demo DIHIDUPKAN: Data contoh (BK-00001 s/d BK-00006) telah ditampilkan kembali.'
          : 'Mode Demo DIMATIKAN: Aplikasi kini bersih & fresh (kosongan) siap produksi.',
        'success'
      );
    } catch (err: any) {
      onShowToast(err.message || 'Gagal mengubah status Mode Demo.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkAllRead = async () => {
    await apiRequest('/api/notifications/read-all', { method: 'POST' });
    await onRefresh();
    onShowToast('Semua notifikasi ditandai sudah dibaca.', 'success');
  };

  if (tab === 'notifications') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#26332A]">
              Pusat Notifikasi Administrator
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#6B776D]">
              Pemberitahuan pendaftar baru, permintaan verifikasi buku Khot, dan aktivitas sistem.
            </p>
          </div>
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="rounded-lg bg-[#E8EFE7] px-3.5 py-2 text-xs font-semibold text-[#315B43] hover:bg-[#DCE6DA] cursor-pointer"
          >
            Tandai Semua Dibaca
          </button>
        </div>

        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`rounded-2xl border p-4 flex items-start justify-between gap-4 ${
                n.isRead
                  ? 'border-[#E3EAE3] bg-white'
                  : 'border-[#315B43]/40 bg-[#F3F7F2]'
              }`}
            >
              <div>
                <div className="flex items-center gap-2 text-xs text-[#6B776D]">
                  <span className="font-semibold text-[#315B43]">
                    {n.isRead ? 'Sudah Dibaca' : 'BARU'}
                  </span>
                  <span className="font-mono tabular-nums">· {formatDateID(n.createdAt, true)}</span>
                </div>
                <h3 className="mt-1 text-sm font-bold text-[#26332A]">{n.title}</h3>
                <p className="mt-0.5 text-xs text-[#6B776D]">{n.message}</p>
              </div>
              {n.linkTo && (
                <button
                  type="button"
                  onClick={() => onNavigate(n.linkTo!)}
                  className="shrink-0 rounded-lg bg-[#315B43] px-3 py-1.5 text-xs font-semibold text-white cursor-pointer"
                >
                  Tinjau
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (tab === 'logs') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#26332A]">
            Riwayat Aktivitas & Audit Log Sistem
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#6B776D]">
            Catatan kronologis seluruh tindakan administratif, verifikasi kartu, login pengguna, dan perubahan data.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#E3EAE3] bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E3EAE3] bg-[#F3F7F2] text-[11px] font-semibold uppercase tracking-wider text-[#6B776D]">
                <th className="py-3.5 pl-5 pr-3">Waktu (WIB)</th>
                <th className="px-3 py-3.5">Pelaku (Actor)</th>
                <th className="px-3 py-3.5">Jenis Aktivitas</th>
                <th className="px-3 py-3.5">Rincian Aktivitas</th>
                <th className="py-3.5 pl-3 pr-5">Target ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3EAE3] text-xs">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-[#FAFCF9]">
                  <td className="py-3 pl-5 pr-3 font-mono text-[#6B776D] tabular-nums whitespace-nowrap">
                    {formatDateID(log.createdAt, true)}
                  </td>
                  <td className="px-3 py-3 font-semibold text-[#26332A]">{log.actorName}</td>
                  <td className="px-3 py-3">
                    <span className="font-mono text-[11px] font-semibold text-[#315B43]">
                      {log.activityType}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-[#26332A]">{log.description}</td>
                  <td className="py-3 pl-3 pr-5 font-mono text-[#6B776D] tabular-nums">
                    {log.targetId}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const isSheetsConnected = Boolean(
    googleAppsScriptUrl && googleAppsScriptUrl.trim().startsWith('https://script.google.com/')
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#26332A]">
          Pengaturan Aplikasi, Database Google Sheets & Deployment
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-[#6B776D]">
          Konfigurasi identitas lembaga Belajar Khot, koneksi database Google Sheets (Apps Script), integrasi GitHub & Vercel, serta manajemen data demo.
        </p>
      </div>

      {/* =================================================================== */}
      {/* PANEL 1: INTEGRASI SERVER DATABASE GOOGLE SHEETS / APPS SCRIPT */}
      {/* =================================================================== */}
      <div className="rounded-2xl border border-[#315B43]/30 bg-white p-6 space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[#E3EAE3] pb-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#315B43]">
              CLOUD DATABASE ENGINE • GOOGLE SHEETS & APPS SCRIPT
            </div>
            <h2 className="mt-0.5 text-base sm:text-lg font-bold text-[#26332A]">
              Koneksi Server Database ke Google Sheets (2 File: Code.gs & Setup.gs)
            </h2>
            <p className="mt-1 text-xs text-[#6B776D]">
              Setiap perubahan data peserta, status verifikasi buku, pengumuman, dan kelas otomatis tersinkronisasi ke Google Spreadsheet resmi Anda sehingga aman saat dideploy di Vercel (<span className="font-mono">vercel.app</span>).
            </p>
          </div>
          <div className="shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold ${
                isSheetsConnected
                  ? 'bg-[#EBF5EE] text-[#3B7551]'
                  : 'bg-[#FCF5E8] text-[#A06A18]'
              }`}
            >
              ● {isSheetsConnected ? 'Tersambung ke Google Sheets' : 'Mode Server Lokal (Siap Dihubungkan)'}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-semibold text-[#26332A]">
            Google Apps Script Web App URL (Berakhiran <span className="font-mono">/exec</span>)
          </label>
          <input
            type="url"
            value={googleAppsScriptUrl}
            onChange={(e) => setGoogleAppsScriptUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/AKfycb.../exec"
            className="h-10 w-full rounded-lg border border-[#E3EAE3] bg-[#FAFCF9] px-3 font-mono text-xs text-[#26332A] focus:border-[#315B43] focus:outline-none"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#6B776D]">
            <span>
              Tips: Anda juga dapat menyimpan URL ini pada variabel environment{' '}
              <code className="font-mono font-bold text-[#315B43]">GOOGLE_APPS_SCRIPT_URL</code> di pengaturan project Vercel.
            </span>
            {lastGoogleSheetsSync && (
              <span className="font-mono tabular-nums text-[#315B43] font-semibold">
                Sinkronisasi Terakhir: {formatDateID(lastGoogleSheetsSync, true)}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <button
            type="button"
            disabled={syncingSheets}
            onClick={() => handleSyncGoogleSheets('push')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#315B43] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#264734] disabled:opacity-50 cursor-pointer"
          >
            <Upload className="h-4 w-4" />
            {syncingSheets ? 'Menyinkronkan...' : 'Simpan URL & Push Data ke Google Sheets'}
          </button>

          <button
            type="button"
            disabled={syncingSheets || !isSheetsConnected}
            onClick={() => handleSyncGoogleSheets('pull')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#315B43] bg-[#F3F7F2] px-4 py-2.5 text-xs font-semibold text-[#315B43] hover:bg-[#E8EFE7] disabled:opacity-40 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            Tarik Data (Pull) dari Google Sheets
          </button>

          <button
            type="button"
            onClick={() => handleCopyAppsScriptCode('code')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E3EAE3] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#26332A] hover:bg-[#F3F7F2] cursor-pointer"
          >
            <FileText className="h-4 w-4 text-[#315B43]" />
            Salin 1. Code.gs
          </button>

          <button
            type="button"
            onClick={() => handleCopyAppsScriptCode('setup')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E3EAE3] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#26332A] hover:bg-[#F3F7F2] cursor-pointer"
          >
            <FileText className="h-4 w-4 text-[#315B43]" />
            Salin 2. Setup.gs
          </button>

          <button
            type="button"
            onClick={async () => {
              const sampleUrl =
                googleAppsScriptUrl.trim() ||
                'https://script.google.com/macros/s/ISI_ID_DEPLOYMENT_ANDA/exec';
              const envBlock = `GOOGLE_APPS_SCRIPT_URL=${sampleUrl}`;
              try {
                await navigator.clipboard.writeText(envBlock);
                onShowToast(
                  'Berhasil disalin! Saat Deploy di Vercel, cukup Paste 1 baris ini di kolom Environment Variables.',
                  'success'
                );
              } catch {
                setShowAppsScriptCode(true);
                onShowToast('Silakan salin Environment Variable dari kotak di bawah.', 'success');
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#315B43]/30 bg-[#F3F7F2] px-3.5 py-2.5 text-xs font-semibold text-[#315B43] hover:bg-[#E8EFE7] cursor-pointer"
          >
            <FileText className="h-4 w-4 text-[#315B43]" />
            Salin 1 Env Vercel (GOOGLE_APPS_SCRIPT_URL)
          </button>

          <button
            type="button"
            onClick={() => setShowAppsScriptCode((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-[#315B43] hover:underline cursor-pointer"
          >
            {showAppsScriptCode
              ? 'Sembunyikan Panduan Vercel & Kode Apps Script'
              : 'Lihat Tutorial Vercel Env & Kode Apps Script'}
          </button>
        </div>

        {/* Ringkasan Cepat 1 Environment Variable saat Deploy di Vercel */}
        <div className="rounded-xl border border-[#E3EAE3] bg-[#FAFCF9] p-4 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-bold text-[#26332A]">
              Saat Deploy / Publish di Vercel (<span className="font-mono text-[#315B43]">vercel.app</span>) — Cukup Isi <span className="underline">1 Name &amp; 1 Value</span> Saja:
            </div>
            <span className="text-[11px] font-medium text-[#315B43]">
              Otomatis terbaca oleh Server &amp; Browser
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-xs">
            <div className="rounded-lg border border-[#E3EAE3] bg-white p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[#6B776D]">
                Name (Key)
              </div>
              <div className="mt-1 font-mono font-bold text-[#315B43] select-all">
                GOOGLE_APPS_SCRIPT_URL
              </div>
              <div className="mt-1 text-[10px] text-[#929B93]">
                (Atau boleh juga menggunakan <code className="font-mono">VITE_GOOGLE_SCRIPT_URL</code>)
              </div>
            </div>
            <div className="rounded-lg border border-[#E3EAE3] bg-white p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[#6B776D]">
                Value (URL Web App /exec Anda)
              </div>
              <div className="mt-1 font-mono font-bold text-[#26332A] truncate select-all">
                {googleAppsScriptUrl.trim() || 'https://script.google.com/macros/s/.../exec'}
              </div>
              <div className="mt-1 text-[10px] text-[#929B93]">
                URL dari Deploy &rarr; New deployment &rarr; Web app di Google Apps Script
              </div>
            </div>
          </div>
        </div>

        {showAppsScriptCode && (
          <div className="mt-4 space-y-4 rounded-xl border border-[#E3EAE3] bg-[#FAFCF9] p-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 text-xs">
              <div className="rounded-xl bg-white p-4 border border-[#E3EAE3] space-y-1.5">
                <div className="font-bold text-[#315B43]">
                  1. Buat 2 File di Google Apps Script
                </div>
                <p className="text-[#6B776D] leading-relaxed">
                  Buka Google Sheet → klik <strong>Extensions &gt; Apps Script</strong>. Tempelkan <strong>File 1 (<code className="font-mono">Code.gs</code>)</strong> dan buat file baru <strong>File 2 (<code className="font-mono">Setup.gs</code>)</strong> lalu jalankan fungsi <code className="font-mono">setupDatabaseSheets</code>.
                </p>
              </div>
              <div className="rounded-xl bg-white p-4 border border-[#E3EAE3] space-y-1.5">
                <div className="font-bold text-[#315B43]">
                  2. Deploy sebagai Web App (/exec)
                </div>
                <p className="text-[#6B776D] leading-relaxed">
                  Klik <strong>Deploy &gt; New deployment &gt; Web app</strong>. Pilih <em>Execute as: Me</em> dan <em>Who has access: Anyone</em>. Salin URL Web App yang berakhiran <code className="font-mono">/exec</code>.
                </p>
              </div>
              <div className="rounded-xl bg-white p-4 border border-[#E3EAE3] space-y-1.5">
                <div className="font-bold text-[#315B43]">
                  3. Pasang Environment di Vercel
                </div>
                <p className="text-[#6B776D] leading-relaxed">
                  Buka dashboard <strong>Vercel → Project → Settings → Environment Variables</strong>. Klik tombol <strong>&ldquo;Salin Format .env Vercel&rdquo;</strong> di atas lalu <em>Paste</em> di Vercel dan klik <strong>Redeploy</strong>.
                </p>
              </div>
            </div>

            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveScriptTab('code')}
                    className={`rounded-lg px-3 py-1.5 font-mono text-xs font-bold cursor-pointer ${
                      activeScriptTab === 'code'
                        ? 'bg-[#315B43] text-white'
                        : 'bg-white text-[#26332A] border border-[#E3EAE3]'
                    }`}
                  >
                    1. Code.gs (API Server doGet & doPost)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveScriptTab('setup')}
                    className={`rounded-lg px-3 py-1.5 font-mono text-xs font-bold cursor-pointer ${
                      activeScriptTab === 'setup'
                        ? 'bg-[#315B43] text-white'
                        : 'bg-white text-[#26332A] border border-[#E3EAE3]'
                    }`}
                  >
                    2. Setup.gs (Inisialisasi 11 Sheet & Kolom)
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyAppsScriptCode(activeScriptTab)}
                  className="font-semibold text-[#315B43] hover:underline cursor-pointer"
                >
                  Salin Seluruh Kode {activeScriptTab === 'setup' ? 'Setup.gs' : 'Code.gs'}
                </button>
              </div>
              <pre className="max-h-72 overflow-y-auto rounded-lg border border-[#E3EAE3] bg-[#26332A] p-3 font-mono text-[11px] text-[#E8EFE7]">
                {activeScriptTab === 'setup'
                  ? GOOGLE_APPS_SCRIPT_SETUP_GS
                  : GOOGLE_APPS_SCRIPT_CODE_GS}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* PANEL 2: PENGATURAN IDENTITAS LEMBAGA & GRUP WHATSAPP RESMI */}
      {/* =================================================================== */}
      <form
        onSubmit={handleSaveSettings}
        className="rounded-2xl border border-[#E3EAE3] bg-white p-6 space-y-5"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#E3EAE3] pb-4">
          <div className="flex items-center gap-3.5">
            <BrandLogo
              size="lg"
              logoUrl={logoURL}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              accentColor={accentColor}
            />
            <div>
              <h2 className="text-base font-bold text-[#26332A]">
                Identitas Lembaga, Ikon Resmi (Favicon), Grup WhatsApp & Ketentuan Buku
              </h2>
              <p className="text-xs text-[#6B776D]">
                Ikon lambang Qalam & Kaligrafi <span className="font-mono">خ</span> otomatis tampil pada tab browser (<span className="font-mono">/favicon.svg</span>), Sidebar, dan Kartu Member Digital.
              </p>
            </div>
          </div>

          {/* Browser Tab Favicon Preview Pill */}
          <div className="inline-flex items-center gap-2 rounded-t-xl border border-[#E3EAE3] bg-[#F3F7F2] px-3.5 py-2 text-xs shadow-2xs self-start sm:self-auto">
            <BrandLogo
              size="sm"
              logoUrl={logoURL}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              accentColor={accentColor}
              className="!h-5 !w-5 !rounded-md"
            />
            <span className="font-semibold text-[#26332A] truncate max-w-[180px]">
              {instName || 'Belajar Khot'} — Portal
            </span>
            <span className="text-[#929B93] font-mono text-[10px]">×</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-[#26332A]">
              Nama Lembaga Resmi
            </label>
            <input
              type="text"
              value={instName}
              onChange={(e) => setInstName(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] px-3 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#26332A]">
              Nomor WhatsApp Admin (Format 628...)
            </label>
            <input
              type="text"
              value={waNumber}
              onChange={(e) => setWaNumber(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] px-3 font-mono text-xs"
            />
          </div>
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-[#26332A]">
                URL Logo / Ikon Kustom (Kosongkan untuk menggunakan Lambang Resmi Qalam & Kaligrafi Belajar Khot)
              </label>
              {logoURL && (
                <button
                  type="button"
                  onClick={() => setLogoURL('')}
                  className="text-[11px] font-semibold text-[#315B43] hover:underline cursor-pointer"
                >
                  Gunakan Ikon Kaligrafi Default (/favicon.svg)
                </button>
              )}
            </div>
            <input
              type="text"
              value={logoURL}
              onChange={(e) => setLogoURL(e.target.value)}
              placeholder="Default: Lambang Qalam & Kaligrafi Resmi (/favicon.svg)"
              className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] px-3 font-mono text-xs"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[#26332A]">
              Link Grup WhatsApp Resmi Belajar Khot (Kosongkan jika belum diterbitkan)
            </label>
            <input
              type="text"
              value={waGroupURL}
              onChange={(e) => setWaGroupURL(e.target.value)}
              placeholder="https://chat.whatsapp.com/..."
              className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] px-3 text-xs"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[#26332A]">
              Tata Cara Bergabung ke Grup WhatsApp
            </label>
            <textarea
              rows={2}
              value={waInstructions}
              onChange={(e) => setWaInstructions(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#E3EAE3] p-3 text-xs"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[#26332A]">
              Ketentuan Persyaratan Pembelian Buku Khot
            </label>
            <textarea
              rows={2}
              value={bookInfo}
              onChange={(e) => setBookInfo(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#E3EAE3] p-3 text-xs"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[#26332A]">
              Alamat Sekretariat & Studio Offline
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-[#E3EAE3] px-3 text-xs"
            />
          </div>
        </div>

        <div className="flex justify-end border-t border-[#E3EAE3] pt-4">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[#315B43] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#264734] cursor-pointer"
          >
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan Lembaga'}
          </button>
        </div>
      </form>

      {/* =================================================================== */}
      {/* PANEL 3: SAKELAR MODE DEMO (ON/OFF) & KUSTOMISASI WARNA MEMBER */}
      {/* =================================================================== */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Sakelar Mode Demo vs Mode Kosongan/Fresh */}
        <div className="rounded-2xl border border-[#E3EAE3] bg-white p-6 lg:col-span-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#315B43]">
                MODE DATA APLIKASI
              </span>
              <span
                className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                  isDemoEnabled
                    ? 'bg-[#FCF5E8] text-[#A06A18]'
                    : 'bg-[#EBF5EE] text-[#3B7551]'
                }`}
              >
                {isDemoEnabled ? '● Mode Demo Aktif' : '● Mode Kosongan / Fresh'}
              </span>
            </div>
            <h2 className="mt-2 text-base font-bold text-[#26332A]">
              Sakelar Mode Demo (Hidupkan / Matikan Data Contoh)
            </h2>
            <p className="mt-1 text-xs text-[#6B776D] leading-relaxed">
              Matikan <strong>Mode Demo</strong> agar aplikasi terlihat <strong>100% bersih, fresh, dan kosongan</strong> (tanpa peserta contoh <span className="font-mono">BK-00001</span> s/d <span className="font-mono">BK-00006</span>, pengumuman, kelas, atau log contoh). Hidupkan kembali kapan saja untuk simulasi.
            </p>
          </div>

          <div className="space-y-3 border-t border-[#E3EAE3] pt-4">
            <div className="flex items-center justify-between rounded-xl bg-[#F3F7F2] p-3.5">
              <div>
                <div className="text-xs font-bold text-[#26332A]">
                  Status Data Demonstrasi
                </div>
                <div className="text-[11px] text-[#6B776D]">
                  {isDemoEnabled
                    ? 'Menampilkan 6 peserta contoh & konten simulasi'
                    : 'Aplikasi bersih / kosongan (siap input data asli)'}
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isDemoEnabled}
                disabled={saving}
                onClick={() => handleToggleDemoMode(!isDemoEnabled)}
                className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  isDemoEnabled ? 'bg-[#315B43]' : 'bg-[#929B93]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                    isDemoEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={saving || !isDemoEnabled}
                onClick={() => handleToggleDemoMode(false)}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#B44238]/40 bg-[#FCEEEF] px-3.5 py-2 text-xs font-semibold text-[#B44238] hover:bg-[#F9DCDD] disabled:opacity-40 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Matikan Demo (Aplikasi Kosongan)
              </button>
              <button
                type="button"
                disabled={saving || isDemoEnabled}
                onClick={() => handleToggleDemoMode(true)}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#E8EFE7] px-3.5 py-2 text-xs font-semibold text-[#315B43] hover:bg-[#DCE6DA] disabled:opacity-40 cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Hidupkan Data Demo
              </button>
            </div>
          </div>
        </div>

        {/* Pengaturan Warna Member oleh Admin Utama */}
        <div className="rounded-2xl border border-[#E3EAE3] bg-white p-6 lg:col-span-7 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#315B43]">
                KUSTOMISASI TEMA MEMBER (ADMIN UTAMA)
              </span>
              <h2 className="mt-1 text-base font-bold text-[#26332A]">
                Pengaturan Warna Kartu Member & Tampilan Portal Member
              </h2>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="h-6 w-6 rounded-full border border-black/15"
                style={{ backgroundColor: primaryColor }}
                title={`Primary: ${primaryColor}`}
              />
              <span
                className="h-6 w-6 rounded-full border border-black/15"
                style={{ backgroundColor: secondaryColor }}
                title={`Secondary: ${secondaryColor}`}
              />
              <span
                className="h-6 w-6 rounded-full border border-black/15"
                style={{ backgroundColor: accentColor }}
                title={`Accent: ${accentColor}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {MEMBER_COLOR_PRESETS.map((preset) => {
              const active = colorPresetId === preset.presetId;
              return (
                <button
                  key={preset.presetId}
                  type="button"
                  onClick={() => {
                    setColorPresetId(preset.presetId);
                    setPrimaryColor(preset.primaryColor);
                    setSecondaryColor(preset.secondaryColor);
                    setAccentColor(preset.accentColor);
                  }}
                  className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition-all cursor-pointer ${
                    active
                      ? 'border-[#315B43] bg-[#F3F7F2] ring-2 ring-[#315B43]/20'
                      : 'border-[#E3EAE3] bg-white hover:border-[#C7D7C8]'
                  }`}
                >
                  <span
                    className="h-6 w-6 shrink-0 rounded-lg border border-black/10"
                    style={{
                      background: `linear-gradient(135deg, ${preset.primaryColor}, ${preset.secondaryColor})`,
                    }}
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#26332A] truncate">
                      {preset.label}
                    </div>
                    <div className="text-[10px] font-mono text-[#6B776D]">
                      {preset.primaryColor}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#6B776D]">
                Warna Utama (Primary)
              </label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => {
                    setColorPresetId('custom');
                    setPrimaryColor(e.target.value);
                  }}
                  className="h-9 w-10 cursor-pointer rounded border border-[#E3EAE3]"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => {
                    setColorPresetId('custom');
                    setPrimaryColor(e.target.value);
                  }}
                  className="h-9 flex-1 rounded-lg border border-[#E3EAE3] px-2.5 font-mono text-xs uppercase"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#6B776D]">
                Warna Gradasi (Secondary)
              </label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => {
                    setColorPresetId('custom');
                    setSecondaryColor(e.target.value);
                  }}
                  className="h-9 w-10 cursor-pointer rounded border border-[#E3EAE3]"
                />
                <input
                  type="text"
                  value={secondaryColor}
                  onChange={(e) => {
                    setColorPresetId('custom');
                    setSecondaryColor(e.target.value);
                  }}
                  className="h-9 flex-1 rounded-lg border border-[#E3EAE3] px-2.5 font-mono text-xs uppercase"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#6B776D]">
                Warna Aksen / Lencana
              </label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => {
                    setColorPresetId('custom');
                    setAccentColor(e.target.value);
                  }}
                  className="h-9 w-10 cursor-pointer rounded border border-[#E3EAE3]"
                />
                <input
                  type="text"
                  value={accentColor}
                  onChange={(e) => {
                    setColorPresetId('custom');
                    setAccentColor(e.target.value);
                  }}
                  className="h-9 flex-1 rounded-lg border border-[#E3EAE3] px-2.5 font-mono text-xs uppercase"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-[#E3EAE3] pt-3">
            <span className="text-[11px] text-[#6B776D]">
              Klik tombol simpan untuk menerapkan warna ke seluruh Kartu Member & Portal Member.
            </span>
            <button
              type="button"
              disabled={saving}
              onClick={handleSaveSettings}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#315B43] px-4 py-2 text-xs font-semibold text-white hover:bg-[#264734] cursor-pointer"
            >
              <Palette className="h-3.5 w-3.5" />
              Terapkan Warna Member
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


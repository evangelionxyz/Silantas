import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { SUANGGI_BRAND } from '../../constants/brand';
import {
  uploadWhatsappAttachments,
  deleteWhatsappAttachment,
  getWhatsappAttachmentUrl,
  fetchWhatsappRecaps,
  createWhatsappRecap,
  updateWhatsappRecap,
  deleteWhatsappRecap,
  type WhatsappAttachment,
} from '../../services/api';

export interface WhatsappRecapItem {
  id: string;
  ticketId?: string;
  reporterName: string;
  reporterPhone?: string;
  address: string;
  serviceType: 'INFORMASI' | 'BANTUAN';
  description: string;
  status: 'BARU' | 'DIPROSES' | 'SELESAI';
  date: string;
  recordedBy?: string;
  notes?: string;
  attachmentId?: string;
  attachmentFilePath?: string;
  screenshotUrl?: string;
  screenshotName?: string;
}

const STORAGE_KEY = 'suanggi_whatsapp_recaps_v1';

const INITIAL_RECAP_DATA: WhatsappRecapItem[] = [
  {
    id: 'wa-rec-001',
    ticketId: 'ADU-REC001',
    reporterName: 'Yohanes Maturbongs',
    reporterPhone: '081248901234',
    address: 'Jl. Hasanuddin, Distrik Mimika Baru, Timika',
    serviceType: 'INFORMASI',
    description: 'Menanyakan persyaratan dan berkas rekomendasi pemasukan 25 ekor sapi potong dari Surabaya via Pelabuhan Pomako.',
    screenshotUrl: 'https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&w=600&q=80',
    screenshotName: 'chat_konsultasi_sapi_surabaya.jpg',
    attachmentFilePath: 'uploads/whatsapp_attachments/sample_001.jpg',
    status: 'SELESAI',
    date: '2026-11-12 09:30',
    recordedBy: 'Admin SUANGGI',
    notes: 'Sudah dijelaskan kewajiban Sertifikat Veteriner (SV) dari Jatim dan rekomendasi dinas. Pelapor memahami alur.',
  },
  {
    id: 'wa-rec-002',
    ticketId: 'ADU-REC002',
    reporterName: 'Mama Maria Omaleng',
    reporterPhone: '082199887766',
    address: 'Kampung Naena Muktipura (SP 6), Distrik Kuala Kencana',
    serviceType: 'BANTUAN',
    description: 'Laporan keluhan beberapa ekor ternak babi milik kelompok tani setempat mengalami demam dan nafsu makan berkurang, memohon pemeriksaan dokter hewan.',
    screenshotUrl: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=600&q=80',
    screenshotName: 'laporan_gejala_ternak_sp6.jpg',
    attachmentFilePath: 'uploads/whatsapp_attachments/sample_002.jpg',
    status: 'DIPROSES',
    date: '2026-11-13 14:15',
    recordedBy: 'drh. Sarah Wonda',
    notes: 'Tim dokter hewan posko Kuala Kencana dijadwalkan turun ke lokasi pada hari Sabtu pagi untuk surveilans klinis.',
  },
  {
    id: 'wa-rec-003',
    ticketId: 'ADU-REC003',
    reporterName: 'H. Syamsul Bahri (Toko Hasil Laut & Daging)',
    reporterPhone: '081344556677',
    address: 'Kawasan Pelabuhan Rakyat Pomako, Distrik Mimika Timur',
    serviceType: 'INFORMASI',
    description: 'Konsultasi mengenai jadwal pengapalan daging ayam beku dan persyaratan Surat Keterangan Kesehatan Produk Hewan (SKKHP) untuk dibawa ke Agats (Kab. Asmat).',
    screenshotName: 'tanya_skkhp_asmat.png',
    status: 'BARU',
    date: '2026-11-13 18:40',
    recordedBy: 'Admin SUANGGI',
    notes: 'Menunggu konfirmasi manifest kapal perintis.',
  },
];

export const WhatsappRecapPage: React.FC = () => {
  const { user } = useAuth();
  const [recaps, setRecaps] = useState<WhatsappRecapItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Gagal membaca rekapan WhatsApp dari localStorage:', e);
    }
    return INITIAL_RECAP_DATA;
  });

  const [search, setSearch] = useState('');
  const [serviceFilter, setServiceFilter] = useState<'ALL' | 'INFORMASI' | 'BANTUAN'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'BARU' | 'DIPROSES' | 'SELESAI'>('ALL');
  const [isSyncing, setIsSyncing] = useState(false);

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WhatsappRecapItem | null>(null);
  const [viewingItem, setViewingItem] = useState<WhatsappRecapItem | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // Form input states
  const [formData, setFormData] = useState({
    reporterName: '',
    reporterPhone: '',
    address: '',
    serviceType: 'INFORMASI' as 'INFORMASI' | 'BANTUAN',
    description: '',
    status: 'BARU' as 'BARU' | 'DIPROSES' | 'SELESAI',
    notes: '',
  });

  // Attachment upload states
  const [selectedScreenshotFile, setSelectedScreenshotFile] = useState<File | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string>('');
  const [existingAttachment, setExistingAttachment] = useState<WhatsappAttachment | null>(null);
  const [screenshotFileName, setScreenshotFileName] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Load from backend API if reachable, else use local data
  const loadData = async () => {
    setIsSyncing(true);
    try {
      const backendData = await fetchWhatsappRecaps({
        search: search || undefined,
        serviceType: serviceFilter !== 'ALL' ? serviceFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      });

      if (backendData && backendData.length > 0) {
        const mapped: WhatsappRecapItem[] = backendData.map((r) => {
          const firstAtt = r.attachments && r.attachments.length > 0 ? r.attachments[0] : undefined;
          return {
            id: r.id,
            ticketId: r.ticketId,
            reporterName: r.reporterName,
            reporterPhone: r.reporterPhone,
            address: r.address,
            serviceType: r.serviceType as 'INFORMASI' | 'BANTUAN',
            description: r.description,
            status: r.status as 'BARU' | 'DIPROSES' | 'SELESAI',
            date: r.createdAt ? r.createdAt.replace('T', ' ').substring(0, 16) : new Date().toISOString().substring(0, 16),
            recordedBy: r.recordedBy,
            notes: r.notes,
            attachmentId: firstAtt?.id,
            attachmentFilePath: firstAtt?.filePath,
            screenshotUrl: firstAtt ? getWhatsappAttachmentUrl(firstAtt.id) : undefined,
            screenshotName: firstAtt?.fileName,
          };
        });
        setRecaps(mapped);
      }
    } catch {
      // Backend not running or offline: keep using localStorage
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync to localStorage as persistent client backup
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recaps));
    } catch (e) {
      console.error('Failed to save whatsapp recaps to localStorage:', e);
    }
  }, [recaps]);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      reporterName: '',
      reporterPhone: '',
      address: '',
      serviceType: 'INFORMASI',
      description: '',
      status: 'BARU',
      notes: '',
    });
    setSelectedScreenshotFile(null);
    setPreviewDataUrl('');
    setExistingAttachment(null);
    setScreenshotFileName('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: WhatsappRecapItem) => {
    setEditingItem(item);
    setFormData({
      reporterName: item.reporterName,
      reporterPhone: item.reporterPhone || '',
      address: item.address,
      serviceType: item.serviceType,
      description: item.description,
      status: item.status,
      notes: item.notes || '',
    });
    setSelectedScreenshotFile(null);
    setPreviewDataUrl(item.screenshotUrl || '');
    setExistingAttachment(
      item.attachmentId
        ? {
            id: item.attachmentId,
            fileName: item.screenshotName || 'screenshot.png',
            filePath: item.attachmentFilePath || `uploads/whatsapp_attachments/${item.screenshotName}`,
            mimeType: 'image/jpeg',
            fileSize: 0,
            createdAt: '',
          }
        : null
    );
    setScreenshotFileName(item.screenshotName || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleScreenshotFileSelection = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    const lower = file.name.toLowerCase();
    const isImage =
      validTypes.includes(file.type) ||
      lower.endsWith('.jpg') ||
      lower.endsWith('.jpeg') ||
      lower.endsWith('.png') ||
      lower.endsWith('.webp') ||
      lower.endsWith('.pdf');

    if (!isImage) {
      alert('Format berkas tidak didukung. Harap pilih gambar (JPG, PNG, WEBP) atau PDF tangkapan layar chat WhatsApp.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert(`Ukuran berkas melebihi batas 10MB (${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
      return;
    }

    setSelectedScreenshotFile(file);
    setScreenshotFileName(file.name);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewDataUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewDataUrl('');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.reporterName.trim()) {
      setFormError('Nama pelapor wajib diisi.');
      return;
    }
    if (!formData.address.trim()) {
      setFormError('Alamat pelapor wajib diisi.');
      return;
    }
    if (!formData.description.trim()) {
      setFormError('Keterangan laporan/keluhan wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    let uploadedAttachment: WhatsappAttachment | null = null;

    // 1. Upload file to backend server (saved in backend/uploads/whatsapp_attachments)
    if (selectedScreenshotFile) {
      try {
        const uploadRes = await uploadWhatsappAttachments([selectedScreenshotFile]);
        if (uploadRes && uploadRes.length > 0) {
          uploadedAttachment = uploadRes[0];
        }
      } catch (err: unknown) {
        console.warn('Upload ke backend uploads/whatsapp_attachments gagal, beralih ke penyimpanan lokal:', err);
      }
    }

    const nowStr = new Date()
      .toISOString()
      .replace('T', ' ')
      .substring(0, 16);

    const attachmentId = uploadedAttachment?.id || existingAttachment?.id;
    const attachmentFilePath = uploadedAttachment?.filePath || existingAttachment?.filePath;
    const screenshotUrl = uploadedAttachment
      ? getWhatsappAttachmentUrl(uploadedAttachment.id)
      : previewDataUrl || editingItem?.screenshotUrl;
    const screenshotName = uploadedAttachment?.fileName || screenshotFileName || editingItem?.screenshotName;

    // 2. Persist to backend database if online
    try {
      if (editingItem) {
        await updateWhatsappRecap(editingItem.id, {
          reporterName: formData.reporterName.trim(),
          reporterPhone: formData.reporterPhone.trim() || undefined,
          address: formData.address.trim(),
          serviceType: formData.serviceType,
          description: formData.description.trim(),
          status: formData.status,
          notes: formData.notes.trim() || undefined,
        });
      } else {
        await createWhatsappRecap(
          {
            reporterName: formData.reporterName.trim(),
            reporterPhone: formData.reporterPhone.trim() || undefined,
            address: formData.address.trim(),
            serviceType: formData.serviceType,
            description: formData.description.trim(),
            status: formData.status,
            recordedBy: user?.fullName || user?.username || 'Petugas SUANGGI',
            notes: formData.notes.trim() || undefined,
          },
          attachmentId ? [attachmentId] : undefined
        );
      }
    } catch (apiErr) {
      console.warn('Gagal simpan ke database backend, menyimpan ke penyimpanan browser:', apiErr);
    }

    // 3. Update client state & localStorage
    if (editingItem) {
      setRecaps((prev) =>
        prev.map((it) =>
          it.id === editingItem.id
            ? {
                ...it,
                ...formData,
                attachmentId,
                attachmentFilePath,
                screenshotUrl,
                screenshotName,
              }
            : it
        )
      );
    } else {
      const randomTicket = `ADU-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      const newItem: WhatsappRecapItem = {
        id: `wa-rec-${Date.now().toString(36)}`,
        ticketId: randomTicket,
        reporterName: formData.reporterName.trim(),
        reporterPhone: formData.reporterPhone.trim() || undefined,
        address: formData.address.trim(),
        serviceType: formData.serviceType,
        description: formData.description.trim(),
        attachmentId,
        attachmentFilePath,
        screenshotUrl,
        screenshotName,
        status: formData.status,
        date: nowStr,
        recordedBy: user?.fullName || user?.username || 'Petugas SUANGGI',
        notes: formData.notes.trim() || undefined,
      };
      setRecaps((prev) => [newItem, ...prev]);
    }

    setIsSubmitting(false);
    setIsModalOpen(false);
  };

  const handleDeleteItem = async (id: string, name: string) => {
    if (window.confirm(`Hapus rekapan WhatsApp dari "${name}"? Dokumen dan lampiran di server akan ikut terhapus.`)) {
      try {
        await deleteWhatsappRecap(id);
      } catch (e) {
        console.warn('Gagal hapus di backend:', e);
      }

      setRecaps((prev) => prev.filter((it) => it.id !== id));
      if (viewingItem?.id === id) {
        setViewingItem(null);
      }
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'BARU' | 'DIPROSES' | 'SELESAI') => {
    try {
      await updateWhatsappRecap(id, { status: newStatus });
    } catch (e) {
      console.warn('Gagal update status di backend:', e);
    }

    setRecaps((prev) =>
      prev.map((it) => (it.id === id ? { ...it, status: newStatus } : it))
    );
    if (viewingItem && viewingItem.id === id) {
      setViewingItem({ ...viewingItem, status: newStatus });
    }
  };

  const getItemViewUrl = (item: WhatsappRecapItem): string => {
    if (item.attachmentId) {
      return getWhatsappAttachmentUrl(item.attachmentId);
    }
    return item.screenshotUrl || '';
  };

  // Filtered dataset
  const filteredRecaps = recaps.filter((item) => {
    const matchSearch =
      search === '' ||
      (item.ticketId && item.ticketId.toLowerCase().includes(search.toLowerCase())) ||
      item.id.toLowerCase().includes(search.toLowerCase()) ||
      item.reporterName.toLowerCase().includes(search.toLowerCase()) ||
      item.address.toLowerCase().includes(search.toLowerCase()) ||
      (item.reporterPhone && item.reporterPhone.includes(search)) ||
      item.description.toLowerCase().includes(search.toLowerCase());

    const matchService =
      serviceFilter === 'ALL' || item.serviceType === serviceFilter;

    const matchStatus =
      statusFilter === 'ALL' || item.status === statusFilter;

    return matchSearch && matchService && matchStatus;
  });

  // Summary counts
  const totalCount = recaps.length;
  const infoCount = recaps.filter((r) => r.serviceType === 'INFORMASI').length;
  const helpCount = recaps.filter((r) => r.serviceType === 'BANTUAN').length;
  const pendingCount = recaps.filter((r) => r.status !== 'SELESAI').length;

  const exportCsv = () => {
    const headers = ['ID', 'Nomor Tiket', 'Tanggal', 'Nama Pelapor', 'Nomor Kontak', 'Alamat', 'Jenis Layanan', 'Laporan / Aduan', 'Status', 'Petugas Pencatat', 'Lokasi Berkas Server', 'Catatan'];
    const rows = filteredRecaps.map((r) => [
      r.id,
      r.ticketId || '',
      r.date,
      `"${r.reporterName.replace(/"/g, '""')}"`,
      r.reporterPhone || '',
      `"${r.address.replace(/"/g, '""')}"`,
      r.serviceType,
      `"${r.description.replace(/"/g, '""')}"`,
      r.status,
      r.recordedBy || '',
      r.attachmentFilePath || '',
      `"${(r.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rekapan_whatsapp_suanggi_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6"
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#d0d7de] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#25d366]/20 text-[#128c7e] rounded-xs">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2zm5.82 14.07c-.24.68-1.39 1.3-1.92 1.38-.49.07-1.12.1-3.23-.77-2.69-1.11-4.41-3.86-4.55-4.04-.13-.19-1.08-1.44-1.08-2.75 0-1.31.69-1.95.93-2.21.24-.26.54-.33.72-.33.18 0 .36 0 .52.01.17.01.39-.06.61.47.23.55.77 1.88.84 2.02.07.14.12.31.02.49-.09.18-.14.29-.27.45-.14.16-.29.35-.41.47-.14.14-.29.29-.12.57.17.28.75 1.24 1.61 2 1.11.98 2.04 1.29 2.33 1.43.29.14.46.12.63-.07.17-.19.74-.86.94-1.16.2-.29.4-.24.67-.14.28.1 1.76.83 2.06.98.3.15.5.22.57.35.07.12.07.72-.17 1.4z" />
              </svg>
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#1f2328]">
              Rekapan WhatsApp Layanan
            </h1>
            {isSyncing && (
              <span className="text-[11px] text-[#57606a] flex items-center gap-1 font-normal">
                <span className="w-2.5 h-2.5 border-2 border-[#1a7f37] border-t-transparent rounded-full animate-spin" />
                Sinkronisasi server...
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[#57606a] mt-1">
            Pencatatan aduan dan permohonan layanan via WhatsApp resmi {SUANGGI_BRAND.agencyShort}.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={exportCsv}
            className="px-3.5 py-2 text-xs font-semibold bg-white border border-[#d0d7de] hover:bg-[#f6f8fa] text-[#1f2328] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <svg className="w-4 h-4 text-[#57606a]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Ekspor CSV</span>
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2 text-xs font-bold bg-[#1a7f37] hover:bg-[#15803d] text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Catat Aduan / Rekapan Baru</span>
          </button>
        </div>
      </div>

      {/* Quick Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white border border-[#d0d7de] shadow-2xs">
          <div className="text-xs font-bold uppercase tracking-wider text-[#57606a]">Total Rekapan</div>
          <div className="text-2xl font-black text-[#1f2328] mt-1">{totalCount}</div>
          <div className="text-[11px] text-[#57606a] mt-0.5">Semua aduan &amp; pesan tercatat</div>
        </div>

        <div className="p-4 bg-white border border-[#d0d7de] shadow-2xs">
          <div className="text-xs font-bold uppercase tracking-wider text-[#0969da]">Layanan Informasi</div>
          <div className="text-2xl font-black text-[#0969da] mt-1">{infoCount}</div>
          <div className="text-[11px] text-[#57606a] mt-0.5">Konsultasi syarat &amp; perizinan</div>
        </div>

        <div className="p-4 bg-white border border-[#d0d7de] shadow-2xs">
          <div className="text-xs font-bold uppercase tracking-wider text-[#b45309]">Layanan Bantuan</div>
          <div className="text-2xl font-black text-[#b45309] mt-1">{helpCount}</div>
          <div className="text-[11px] text-[#57606a] mt-0.5">Aduan ternak sakit / permohonan</div>
        </div>

        <div className="p-4 bg-white border border-[#d0d7de] shadow-2xs">
          <div className="text-xs font-bold uppercase tracking-wider text-[#cf222e]">Menunggu Tindak Lanjut</div>
          <div className="text-2xl font-black text-[#cf222e] mt-1">{pendingCount}</div>
          <div className="text-[11px] text-[#57606a] mt-0.5">Status Baru atau Diproses</div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white border border-[#d0d7de] p-3.5 sm:p-4 space-y-3 shadow-2xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nomor tiket (contoh: ADU-7AFC7026), nama, telepon, atau keluhan..."
              className="w-full px-3 py-2 text-sm border border-[#d0d7de] focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-2.5 text-xs text-[#57606a] hover:text-[#1f2328]"
              >
                &times; Bersihkan
              </button>
            )}
          </div>

          <div className="md:col-span-3">
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value as 'ALL' | 'INFORMASI' | 'BANTUAN')}
              className="w-full px-3 py-2 text-sm border border-[#d0d7de] bg-white text-[#1f2328] focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
            >
              <option value="ALL">Semua Jenis Layanan</option>
              <option value="INFORMASI">Layanan Informasi (Konsultasi/Syarat)</option>
              <option value="BANTUAN">Layanan Bantuan (Aduan/Surveilans)</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'BARU' | 'DIPROSES' | 'SELESAI')}
              className="w-full px-3 py-2 text-sm border border-[#d0d7de] bg-white text-[#1f2328] focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
            >
              <option value="ALL">Semua Status Penanganan</option>
              <option value="BARU">Baru (Belum Ditanggapi)</option>
              <option value="DIPROSES">Diproses (Sedang Ditindaklanjuti)</option>
              <option value="SELESAI">Selesai (Sudah Tuntas)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Recaps Table */}
      <div className="border border-[#d0d7de] overflow-hidden bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left text-sm text-[#1f2328]">
            <thead className="bg-[#f6f8fa] border-b border-[#d0d7de] font-semibold text-[#57606a] text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3.5 w-44">Waktu / Tiket / ID</th>
                <th className="py-3 px-3.5 w-56">Pelapor &amp; Kontak</th>
                <th className="py-3 px-3.5 w-48">Alamat</th>
                <th className="py-3 px-3.5 w-32">Jenis Layanan</th>
                <th className="py-3 px-3.5">Keterangan / Laporan Aduan</th>
                <th className="py-3 px-3.5 w-36 text-center">Tangkapan Layar Server</th>
                <th className="py-3 px-3.5 w-28">Status</th>
                <th className="py-3 px-3.5 text-right w-32">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d0d7de]">
              {filteredRecaps.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-[#57606a]">
                    Belum ada data rekapan WhatsApp yang sesuai dengan kriteria.
                  </td>
                </tr>
              ) : (
                filteredRecaps.map((item) => {
                  const fileUrl = getItemViewUrl(item);
                  return (
                    <tr key={item.id} className="hover:bg-[#f6f8fa]/70 transition-colors">
                      {/* Waktu / Tiket / ID */}
                      <td className="py-3 px-3.5 font-mono text-xs">
                        <div className="font-semibold text-[#1f2328]">{item.date}</div>
                        {item.ticketId && (
                          <div className="inline-flex items-center gap-1 my-1 px-1.5 py-0.5 bg-[#ddf4ff] text-[#0969da] border border-[#54aeff]/40 rounded text-[11px] font-bold tracking-wide">
                            <span>{item.ticketId}</span>
                          </div>
                        )}
                        <div className="text-[10px] text-[#57606a] truncate max-w-[150px]" title={item.id}>{item.id}</div>
                      </td>

                      {/* Pelapor & Kontak */}
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-[#1f2328]">{item.reporterName}</div>
                        {item.reporterPhone && (
                          <div className="text-xs text-[#0969da] font-mono mt-0.5 flex items-center gap-1">
                            <span>&#128222;</span>
                            <span>{item.reporterPhone}</span>
                          </div>
                        )}
                      </td>

                      {/* Alamat */}
                      <td className="py-3 px-3.5 text-xs text-[#4b5563] leading-snug">
                        {item.address}
                      </td>

                      {/* Jenis Layanan */}
                      <td className="py-3 px-3.5">
                        {item.serviceType === 'INFORMASI' ? (
                          <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-[#ddf4ff] text-[#0969da] border border-[#54aeff]/40">
                            Informasi
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-[#fff8c5] text-[#9a6700] border border-[#d4a72c]/40">
                            Bantuan
                          </span>
                        )}
                      </td>

                      {/* Keterangan */}
                      <td className="py-3 px-3.5">
                        <p className="text-xs text-[#1f2328] line-clamp-2 m-0 leading-relaxed">
                          {item.description}
                        </p>
                        {item.notes && (
                          <div className="text-[11px] text-[#15803d] font-medium mt-1">
                            &bull; Tindak lanjut: {item.notes}
                          </div>
                        )}
                      </td>

                      {/* Tangkapan Layar Chat (backend/uploads/whatsapp_attachments) */}
                      <td className="py-3 px-3.5 text-center">
                        {fileUrl ? (
                          <div className="flex flex-col items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewImage({
                                  url: fileUrl,
                                  title: `Tangkapan Layar Chat: ${item.reporterName} (${item.screenshotName || 'screenshot.png'})`,
                                })
                              }
                              className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold bg-[#f6f8fa] hover:bg-[#ddf4ff] text-[#0969da] border border-[#d0d7de] cursor-pointer transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>Lihat Berkas</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-[#8c959f] italic">Tidak ada</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold ${
                            item.status === 'SELESAI'
                              ? 'bg-[#dafbe1] text-[#1a7f37] border border-[#4ac26b]/40'
                              : item.status === 'DIPROSES'
                              ? 'bg-[#ddf4ff] text-[#0969da] border border-[#54aeff]/40'
                              : 'bg-[#ffebe9] text-[#cf222e] border border-[#ff8182]/40'
                          }`}
                        >
                          {item.status === 'SELESAI'
                            ? 'Selesai'
                            : item.status === 'DIPROSES'
                            ? 'Diproses'
                            : 'Baru'}
                        </span>
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-3.5 text-right space-x-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setViewingItem(item)}
                          className="text-xs text-[#57606a] hover:text-[#1f2328] font-semibold hover:underline cursor-pointer"
                        >
                          Detail
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="text-xs text-[#0969da] hover:underline font-semibold cursor-pointer"
                        >
                          Ubah
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id, item.reporterName)}
                          className="text-xs text-[#cf222e] hover:underline font-semibold cursor-pointer"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal Form */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white border border-[#d0d7de] shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-3.5 border-b border-[#d0d7de] flex items-center justify-between bg-[#f6f8fa]">
                <h3 className="font-semibold text-base text-[#1f2328]">
                  {editingItem ? 'Ubah Rekapan WhatsApp' : 'Catat Rekapan WhatsApp Baru'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-[#57606a] hover:text-[#1f2328] text-xl leading-none cursor-pointer"
                  aria-label="Tutup"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-sm">
                {formError && (
                  <div className="p-3 bg-[#ffebe9] border border-[#ff8182]/40 text-xs sm:text-sm text-[#cf222e]">
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nama Pelapor */}
                  <div>
                    <label className="block font-semibold text-[#1f2328] mb-1 text-xs uppercase tracking-wide">
                      Nama Pelapor <span className="text-[#cf222e]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="misal: Bapak Simon Dogopia"
                      value={formData.reporterName}
                      onChange={(e) => setFormData({ ...formData, reporterName: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-[#d0d7de] focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
                    />
                  </div>

                  {/* Nomor Kontak */}
                  <div>
                    <label className="block font-semibold text-[#1f2328] mb-1 text-xs uppercase tracking-wide">
                      Nomor WhatsApp / HP
                    </label>
                    <input
                      type="tel"
                      placeholder="misal: 08124800xxxx"
                      value={formData.reporterPhone}
                      onChange={(e) => setFormData({ ...formData, reporterPhone: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-[#d0d7de] focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
                    />
                  </div>

                  {/* Alamat */}
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-[#1f2328] mb-1 text-xs uppercase tracking-wide">
                      Alamat Pelapor <span className="text-[#cf222e]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="misal: Jl. Cenderawasih SP 2, Distrik Mimika Baru, Timika"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-[#d0d7de] focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
                    />
                  </div>

                  {/* Jenis Layanan */}
                  <div>
                    <label className="block font-semibold text-[#1f2328] mb-1 text-xs uppercase tracking-wide">
                      Jenis Layanan <span className="text-[#cf222e]">*</span>
                    </label>
                    <select
                      value={formData.serviceType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          serviceType: e.target.value as 'INFORMASI' | 'BANTUAN',
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-[#d0d7de] bg-white text-[#1f2328] focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
                    >
                      <option value="INFORMASI">Informasi (Konsultasi Dokumen &amp; Syarat)</option>
                      <option value="BANTUAN">Bantuan (Aduan Ternak Sakit / Bantuan Lapangan)</option>
                    </select>
                  </div>

                  {/* Status Penanganan */}
                  <div>
                    <label className="block font-semibold text-[#1f2328] mb-1 text-xs uppercase tracking-wide">
                      Status Penanganan
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as 'BARU' | 'DIPROSES' | 'SELESAI',
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-[#d0d7de] bg-white text-[#1f2328] focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
                    >
                      <option value="BARU">Baru (Belum Ditindaklanjuti)</option>
                      <option value="DIPROSES">Diproses (Sedang Ditangani)</option>
                      <option value="SELESAI">Selesai (Sudah Tuntas)</option>
                    </select>
                  </div>

                  {/* Deskripsi / Isi Keluhan */}
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-[#1f2328] mb-1 text-xs uppercase tracking-wide">
                      Ringkasan Laporan / Isi Chat WhatsApp <span className="text-[#cf222e]">*</span>
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Tuliskan pokok pertanyaan, aduan, atau kronologi yang disampaikan warga melalui chat WhatsApp..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-[#d0d7de] focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
                    />
                  </div>

                  {/* Catatan Tindak Lanjut Petugas */}
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-[#1f2328] mb-1 text-xs uppercase tracking-wide">
                      Catatan Tindak Lanjut Petugas
                    </label>
                    <input
                      type="text"
                      placeholder="misal: Sudah dikirimkan panduan PDF persyaratan atau dijadwalkan kunjungan lapangan"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-[#d0d7de] focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
                    />
                  </div>

                  {/* Upload Tangkapan Layar Chat (backend/uploads/whatsapp_attachments) */}
                  <div className="sm:col-span-2 space-y-2 pt-2 border-t border-[#d0d7de]">
                    <div className="flex items-center justify-between">
                      <label className="block font-semibold text-[#1f2328] text-xs uppercase tracking-wide">
                        Unggah Tangkapan Layar Chat WhatsApp (Screenshot)
                      </label>
                    </div>

                    {(previewDataUrl || selectedScreenshotFile || existingAttachment) ? (
                      <div className="p-3 border border-[#4ac26b]/50 bg-[#dafbe1]/30 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {previewDataUrl ? (
                            <img
                              src={previewDataUrl}
                              alt="Screenshot Preview"
                              className="w-14 h-14 object-cover border border-[#4ac26b] shrink-0"
                            />
                          ) : (
                            <div className="w-14 h-14 bg-[#14532d] text-white flex items-center justify-center font-bold text-xs shrink-0">
                              DOC
                            </div>
                          )}
                          <div className="truncate">
                            <div className="text-xs font-bold text-[#1f2328] truncate">
                              {screenshotFileName || existingAttachment?.fileName || 'tangkapan_layar_chat.png'}
                            </div>
                            <div className="text-[10px] text-[#15803d] font-mono mt-0.5">
                              {existingAttachment?.filePath || 'uploads/whatsapp_attachments/' + (screenshotFileName || 'berkas_baru')}
                            </div>
                            {previewDataUrl && (
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewImage({
                                    url: previewDataUrl,
                                    title: screenshotFileName || 'Tangkapan Layar Chat',
                                  })
                                }
                                className="text-[11px] text-[#0969da] hover:underline cursor-pointer"
                              >
                                Perbesar Gambar
                              </button>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            if (existingAttachment?.id) {
                              try {
                                await deleteWhatsappAttachment(existingAttachment.id);
                              } catch (e) {
                                console.warn('Gagal hapus berkas server:', e);
                              }
                            }
                            setSelectedScreenshotFile(null);
                            setPreviewDataUrl('');
                            setExistingAttachment(null);
                            setScreenshotFileName('');
                          }}
                          className="text-xs font-semibold text-[#cf222e] hover:underline px-2 py-1 cursor-pointer"
                        >
                          Hapus Gambar
                        </button>
                      </div>
                    ) : (
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                            handleScreenshotFileSelection(e.dataTransfer.files[0]);
                          }
                        }}
                        className="border-2 border-dashed border-[#d0d7de] hover:border-[#25d366] bg-[#f6f8fa] hover:bg-[#ddf4ff]/10 transition-colors p-4 text-center relative cursor-pointer"
                      >
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleScreenshotFileSelection(e.target.files[0]);
                              e.target.value = '';
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="pointer-events-none flex flex-col items-center justify-center gap-1">
                          <div className="text-2xl">&#128247;</div>
                          <div className="text-xs font-semibold text-[#1f2328]">
                            Pilih atau Tarik Berkas Tangkapan Layar Chat WhatsApp ke Sini
                          </div>
                          <div className="text-[11px] text-[#57606a]">
                            Format JPG, PNG, WEBP, atau PDF. Berkas akan diunggah ke server pada direktori uploads.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#d0d7de] flex justify-end gap-3">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-[#d0d7de] text-xs sm:text-sm font-semibold text-[#1f2328] hover:bg-[#f6f8fa] cursor-pointer disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 font-bold text-xs sm:text-sm text-white bg-[#1a7f37] hover:bg-[#15803d] shadow-2xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Mengunggah &amp; Menyimpan...</span>
                      </>
                    ) : (
                      <span>Simpan Rekapan</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {viewingItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-[#d0d7de] shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-3.5 border-b border-[#d0d7de] flex items-center justify-between bg-[#f6f8fa]">
                <h3 className="font-bold text-sm sm:text-base text-[#1f2328]">
                  Detail Rekapan WhatsApp {viewingItem.ticketId ? `[Tiket: ${viewingItem.ticketId}]` : `#${viewingItem.id}`}
                </h3>
                <button
                  type="button"
                  onClick={() => setViewingItem(null)}
                  className="text-[#57606a] hover:text-[#1f2328] text-xl leading-none cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pb-3 border-b border-[#d0d7de]">
                  <div>
                    <div className="text-[11px] font-bold text-[#57606a] uppercase">Nomor Tiket:</div>
                    <div className="font-mono font-bold text-[#0969da] mt-0.5">
                      {viewingItem.ticketId || '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-[#57606a] uppercase">Tanggal &amp; Waktu:</div>
                    <div className="font-semibold text-[#1f2328] mt-0.5">{viewingItem.date}</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-[#57606a] uppercase">Jenis Layanan:</div>
                    <div className="mt-0.5">
                      {viewingItem.serviceType === 'INFORMASI' ? (
                        <span className="px-2 py-0.5 text-xs font-semibold bg-[#ddf4ff] text-[#0969da]">
                          Informasi
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs font-semibold bg-[#fff8c5] text-[#9a6700]">
                          Bantuan
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-bold text-[#57606a] uppercase">Pelapor:</div>
                  <div className="font-extrabold text-base text-[#1f2328] mt-0.5">{viewingItem.reporterName}</div>
                  {viewingItem.reporterPhone && (
                    <div className="text-sm text-[#0969da] font-mono mt-0.5">
                      No. WhatsApp: {viewingItem.reporterPhone}
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-[11px] font-bold text-[#57606a] uppercase">Alamat:</div>
                  <div className="text-xs sm:text-sm text-[#1f2328] mt-0.5 bg-[#f6f8fa] p-2.5 border border-[#d0d7de]">
                    {viewingItem.address}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-bold text-[#57606a] uppercase">Isi Pesan / Keluhan:</div>
                  <div className="text-xs sm:text-sm text-[#1f2328] mt-0.5 p-3 bg-white border border-[#d0d7de] leading-relaxed">
                    {viewingItem.description}
                  </div>
                </div>

                {viewingItem.notes && (
                  <div>
                    <div className="text-[11px] font-bold text-[#15803d] uppercase">Tindak Lanjut Petugas:</div>
                    <div className="text-xs sm:text-sm text-[#14532d] mt-0.5 p-2.5 bg-[#f0fdf4] border border-[#86efac]">
                      {viewingItem.notes}
                    </div>
                  </div>
                )}

                {(viewingItem.attachmentId || viewingItem.screenshotUrl) && (
                  <div>
                    <div className="text-[11px] font-bold text-[#57606a] uppercase mb-1 flex items-center justify-between">
                      <span>Bukti Tangkapan Layar Chat:</span>
                      {viewingItem.attachmentFilePath && (
                        <span className="font-mono text-[10px] text-[#1a7f37]">
                          {viewingItem.attachmentFilePath}
                        </span>
                      )}
                    </div>
                    <div
                      onClick={() =>
                        setPreviewImage({
                          url: getItemViewUrl(viewingItem),
                          title: `Chat WhatsApp: ${viewingItem.reporterName} (${viewingItem.screenshotName || 'screenshot.png'})`,
                        })
                      }
                      className="border border-[#d0d7de] bg-[#f6f8fa] p-2 cursor-pointer hover:opacity-95 transition-opacity text-center"
                    >
                      <img
                        src={getItemViewUrl(viewingItem)}
                        alt="Screenshot"
                        className="max-h-60 mx-auto object-contain"
                      />
                      <div className="text-center text-[11px] text-[#0969da] underline mt-1.5 font-semibold">
                        Klik untuk perbesar tangkapan layar
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-[#d0d7de] flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-[#57606a]">Ubah Status:</span>
                    {(['BARU', 'DIPROSES', 'SELESAI'] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleUpdateStatus(viewingItem.id, st)}
                        className={`px-2 py-0.5 text-xs font-semibold cursor-pointer ${
                          viewingItem.status === st
                            ? 'bg-[#1f2328] text-white'
                            : 'bg-[#f6f8fa] text-[#57606a] hover:bg-[#d0d7de]'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setViewingItem(null)}
                    className="px-4 py-1.5 bg-white border border-[#d0d7de] text-xs font-bold text-[#1f2328] hover:bg-[#f6f8fa] cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox Preview */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewImage(null)}
            className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-4 cursor-zoom-out"
          >
            <div
              className="relative max-w-4xl max-h-[90vh] bg-white p-2 shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-2 border-b border-[#d0d7de] text-xs font-bold text-[#1f2328]">
                <span>{previewImage.title}</span>
                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="text-base font-bold text-[#57606a] hover:text-[#1f2328] px-2 cursor-pointer"
                >
                  &times;
                </button>
              </div>
              <div className="overflow-auto p-2 flex items-center justify-center">
                <img
                  src={previewImage.url}
                  alt={previewImage.title}
                  className="max-h-[75vh] w-auto object-contain"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

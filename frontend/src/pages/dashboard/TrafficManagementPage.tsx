import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import {
    createTrafficRecord,
    deleteTrafficAttachment,
    deleteTrafficRecord,
    fetchTrafficRecords,
    fetchTrafficSummary,
    getAttachmentFileUrl,
    updateTrafficRecord,
    uploadTrafficAttachments,
    type TrafficAttachment,
    type TrafficRecord,
} from '../../services/api';

interface CommodityOption {
    itemName: string;
    category: 'HEWAN_HIDUP' | 'PRODUK_HEWAN' | 'OLAHAN_PRODUK_HEWAN';
    unit: string;
}

const DEFAULT_COMMODITIES: CommodityOption[] = [
    { itemName: 'Sapi Bali Bakalan', category: 'HEWAN_HIDUP', unit: 'ekor' },
    { itemName: 'Sapi Bali Bibit', category: 'HEWAN_HIDUP', unit: 'ekor' },
    { itemName: 'Kambing Kacang Betina', category: 'HEWAN_HIDUP', unit: 'ekor' },
    { itemName: 'Babi Ternak', category: 'HEWAN_HIDUP', unit: 'ekor' },
    { itemName: 'DOC Ayam Ras Pedaging', category: 'HEWAN_HIDUP', unit: 'ekor' },
    { itemName: 'Telur Ayam Ras', category: 'PRODUK_HEWAN', unit: 'rak' },
    { itemName: 'Daging Sapi Beku', category: 'PRODUK_HEWAN', unit: 'kg' },
    { itemName: 'Daging Ayam Beku', category: 'PRODUK_HEWAN', unit: 'kg' },
    { itemName: 'Sosis Daging Sapi & Ayam', category: 'OLAHAN_PRODUK_HEWAN', unit: 'karton' },
];

export const TrafficManagementPage: React.FC = () => {
    const { user } = useAuth();
    const [records, setRecords] = useState<TrafficRecord[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [search, setSearch] = useState<string>('');
    const [category, setCategory] = useState<string>('ALL');
    const [trafficType, setTrafficType] = useState<string>('ALL');
    const [inspectionStatus, setInspectionStatus] = useState<string>('ALL');
    const [page, setPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalCount, setTotalCount] = useState<number>(0);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [editingRecord, setEditingRecord] = useState<TrafficRecord | null>(null);
    const [viewingRecord, setViewingRecord] = useState<TrafficRecord | null>(null);
    const [modalError, setModalError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [knownCommodities, setKnownCommodities] = useState<CommodityOption[]>(DEFAULT_COMMODITIES);

    // Attachment State
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [existingAttachments, setExistingAttachments] = useState<TrafficAttachment[]>([]);
    const [attachmentIdsToDelete, setAttachmentIdsToDelete] = useState<string[]>([]);
    const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

    // Delete Confirmation Modal State
    const [recordToDelete, setRecordToDelete] = useState<TrafficRecord | null>(null);
    const [deletingRecord, setDeletingRecord] = useState<boolean>(false);

    // Lock background scroll when any modal is open
    useBodyScrollLock(isModalOpen || !!viewingRecord || !!previewImage || !!recordToDelete);

    // Form State
    const [quantityInput, setQuantityInput] = useState<string>('1');
    const [formData, setFormData] = useState({
        recordNumber: '',
        trafficType: 'IMPORT' as 'IMPORT' | 'EXPORT',
        category: 'HEWAN_HIDUP' as 'HEWAN_HIDUP' | 'PRODUK_HEWAN' | 'OLAHAN_PRODUK_HEWAN',
        itemName: '',
        quantity: 1,
        unit: 'ekor',
        origin: '',
        destination: '',
        transportType: 'LAUT' as 'UDARA' | 'LAUT' | 'DARAT',
        applicantName: '',
        healthCertificateNo: '',
        inspectionStatus: 'PENDING' as 'PENDING' | 'INSPECTED_PASS' | 'INSPECTED_REJECT',
        notes: '',
        trafficDate: new Date().toISOString().split('T')[0],
    });

    const loadData = async () => {
        setLoading(true);
        try {
            const [res, summaryRes] = await Promise.all([
                fetchTrafficRecords({
                    search,
                    category,
                    trafficType,
                    inspectionStatus,
                    page,
                }),
                fetchTrafficSummary().catch(() => null),
            ]);
            setRecords(res.data);
            setTotalPages(res.meta.totalPages || 1);
            setTotalCount(res.meta.total || 0);

            const mergedMap = new Map<string, CommodityOption>();
            for (const preset of DEFAULT_COMMODITIES) {
                mergedMap.set(preset.itemName.toLowerCase(), preset);
            }
            if (summaryRes?.items) {
                for (const item of summaryRes.items) {
                    const cat = (
                        item.category === 'HEWAN_HIDUP' ||
                            item.category === 'PRODUK_HEWAN' ||
                            item.category === 'OLAHAN_PRODUK_HEWAN'
                            ? item.category
                            : 'HEWAN_HIDUP'
                    ) as CommodityOption['category'];
                    mergedMap.set(item.itemName.toLowerCase(), {
                        itemName: item.itemName,
                        category: cat,
                        unit: item.unit,
                    });
                }
            }
            for (const rec of res.data) {
                mergedMap.set(rec.itemName.toLowerCase(), {
                    itemName: rec.itemName,
                    category: rec.category,
                    unit: rec.unit,
                });
            }
            setKnownCommodities(Array.from(mergedMap.values()));
        } catch {
            setRecords([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [search, category, trafficType, inspectionStatus, page]);

    const openCreateModal = () => {
        setEditingRecord(null);
        setQuantityInput('');
        setFormData({
            recordNumber: `SV/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
            trafficType: 'IMPORT',
            category: 'HEWAN_HIDUP',
            itemName: '',
            quantity: 1,
            unit: 'ekor',
            origin: '',
            destination: 'Distrik Mimika Baru, Timika',
            transportType: 'LAUT',
            applicantName: '',
            healthCertificateNo: '',
            inspectionStatus: 'PENDING',
            notes: '',
            trafficDate: new Date().toISOString().split('T')[0],
        });
        setSelectedFiles([]);
        setExistingAttachments([]);
        setAttachmentIdsToDelete([]);
        setModalError(null);
        setIsModalOpen(true);
    };

    const openEditModal = (rec: TrafficRecord) => {
        setEditingRecord(rec);
        setSelectedFiles([]);
        setExistingAttachments(rec.attachments || []);
        setAttachmentIdsToDelete([]);
        setQuantityInput(String(rec.quantity));
        setFormData({
            recordNumber: rec.recordNumber,
            trafficType: rec.trafficType,
            category: rec.category,
            itemName: rec.itemName,
            quantity: rec.quantity,
            unit: rec.unit,
            origin: rec.origin,
            destination: rec.destination,
            transportType: rec.transportType,
            applicantName: rec.applicantName,
            healthCertificateNo: rec.healthCertificateNo || '',
            inspectionStatus: rec.inspectionStatus,
            notes: rec.notes || '',
            trafficDate: rec.trafficDate,
        });
        setModalError(null);
        setIsModalOpen(true);
    };

    const handleFileSelection = (files: File[]) => {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
        const maxSizeBytes = 10 * 1024 * 1024;
        const valid: File[] = [];

        for (const file of files) {
            const lower = file.name.toLowerCase();
            const isAllowedExt =
                lower.endsWith('.pdf') ||
                lower.endsWith('.jpg') ||
                lower.endsWith('.jpeg') ||
                lower.endsWith('.png') ||
                lower.endsWith('.webp');

            if (!allowedTypes.includes(file.type) && !isAllowedExt) {
                alert(`Berkas "${file.name}" tidak didukung. Harap pilih berkas PDF atau Gambar (JPG, PNG, WEBP).`);
                continue;
            }
            if (file.size > maxSizeBytes) {
                alert(`Berkas "${file.name}" melebihi batas 10MB (${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
                continue;
            }
            valid.push(file);
        }

        if (valid.length > 0) {
            setSelectedFiles((prev) => [...prev, ...valid]);
        }
    };

    const handleToggleDeleteAttachment = (attachmentId: string) => {
        // Jika sudah ditandai untuk dihapus, batalkan penandaan (Undo)
        if (attachmentIdsToDelete.includes(attachmentId)) {
            setAttachmentIdsToDelete((prev) => prev.filter((id) => id !== attachmentId));
            setModalError(null);
            return;
        }

        // Untuk pengeluaran (EXPORT), wajib ada minimal 1 dokumen yang terlampir
        if (formData.trafficType === 'EXPORT') {
            const activeExisting = existingAttachments.filter(
                (a) => a.id !== attachmentId && !attachmentIdsToDelete.includes(a.id)
            );
            const totalRemaining = activeExisting.length + selectedFiles.length;

            if (totalRemaining < 1) {
                setModalError(
                    'Untuk lalu lintas Keluar (EXPORT), dokumen SKKH/SKKHP wajib terlampir (minimal 1 dokumen). Harap unggah berkas baru terlebih dahulu sebelum menghapus dokumen ini.'
                );
                return;
            }
        }

        setModalError(null);
        setAttachmentIdsToDelete((prev) => [...prev, attachmentId]);
    };

    const confirmDeleteRecord = async () => {
        if (!recordToDelete || deletingRecord) return;
        setDeletingRecord(true);
        try {
            await deleteTrafficRecord(recordToDelete.id);
            setRecordToDelete(null);
            loadData();
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : 'Gagal menghapus catatan lalu lintas');
        } finally {
            setDeletingRecord(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setModalError(null);

        const parsedQuantity = parseFloat(quantityInput);
        if (Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
            setModalError('Jumlah (Kuantitas) harus lebih besar dari 0');
            return;
        }

        // Untuk komoditas Keluar (EXPORT), dokumen SKKH/SKKHP wajib dilampirkan (minimal 1 berkas aktif)
        const activeExistingDocs = existingAttachments.filter(
            (a) => !attachmentIdsToDelete.includes(a.id)
        );
        const totalActiveDocs = activeExistingDocs.length + selectedFiles.length;

        if (formData.trafficType === 'EXPORT' && totalActiveDocs < 1) {
            setModalError(
                'Untuk pengeluaran (EXPORT), berkas dokumen SKKH/SKKHP wajib dilampirkan (minimal 1 berkas).'
            );
            return;
        }

        setSubmitting(true);
        const payload = { ...formData, quantity: parsedQuantity };

        try {
            let recordId = editingRecord?.id;
            if (editingRecord) {
                await updateTrafficRecord(editingRecord.id, payload);
            } else {
                const created = await createTrafficRecord(payload);
                recordId = created.id;
            }

            // Hapus berkas dari server HANYA setelah tombol Simpan ditekan
            if (attachmentIdsToDelete.length > 0) {
                for (const attId of attachmentIdsToDelete) {
                    try {
                        await deleteTrafficAttachment(attId);
                    } catch (delErr) {
                        console.error('Gagal menghapus lampiran saat simpan:', delErr);
                    }
                }
            }

            if (recordId && selectedFiles.length > 0) {
                await uploadTrafficAttachments(recordId, selectedFiles);
            }

            setIsModalOpen(false);
            loadData();
        } catch (err: unknown) {
            setModalError(err instanceof Error ? err.message : 'Gagal menyimpan');
        } finally {
            setSubmitting(false);
        }
    };

    const canCreate = user?.role === 'admin' || user?.role === 'petugas';
    const isDoctor = user?.role === 'dokter_hewan';

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="space-y-6"
        >
            {/* Title & Top Action Bar */}
            <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#d0d7de] pb-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-[#1f2328] tracking-tight">
                        Pemasukan, Pengeluaran &amp; Pemuktahiran Lalu Lintas Hewan
                    </h1>
                    <p className="text-sm text-[#57606a] mt-1">
                        SUANGGI &bull; Pengelolaan data terkini untuk hewan hidup, produk hewan, dan olahan peternakan (Data Terpadu - Akurat - Terkini).
                    </p>
                </div>

                {canCreate && (
                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-white bg-[#15803d] hover:bg-[#14532d] transition-colors shadow-2xs self-start sm:self-auto shrink-0 cursor-pointer"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Pemuktahiran / Catat Data Baru</span>
                    </button>
                )}
            </div>

            {/* Quick Pillar Filter Tabs (Pemasukan / Pengeluaran / Semua) */}
            <div className="no-print flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={() => {
                        setTrafficType('ALL');
                        setPage(1);
                    }}
                    className={`px-3.5 py-1.5 text-xs font-semibold border transition-colors ${trafficType === 'ALL'
                            ? 'bg-[#1f2328] text-white border-[#1f2328]'
                            : 'bg-white text-[#57606a] border-[#d0d7de] hover:bg-[#f6f8fa]'
                        }`}
                >
                    Semua Data Terpadu ({totalCount})
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setTrafficType('IMPORT');
                        setPage(1);
                    }}
                    className={`px-3.5 py-1.5 text-xs font-semibold border transition-colors ${trafficType === 'IMPORT'
                            ? 'bg-[#15803d] text-white border-[#15803d]'
                            : 'bg-white text-[#15803d] border-[#86efac] hover:bg-[#f0fdf4]'
                        }`}
                >
                    Pemasukan: Data Hewan &amp; Produk Masuk
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setTrafficType('EXPORT');
                        setPage(1);
                    }}
                    className={`px-3.5 py-1.5 text-xs font-semibold border transition-colors ${trafficType === 'EXPORT'
                            ? 'bg-[#0969da] text-white border-[#0969da]'
                            : 'bg-white text-[#0969da] border-[#54aeff]/60 hover:bg-[#ddf4ff]/40'
                        }`}
                >
                    Pengeluaran: Data Hewan &amp; Produk Keluar
                </button>
            </div>

            {/* Search & Filter Bar */}
            <div className="no-print grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-[#f6f8fa] p-3.5 border border-[#d0d7de]">
                <div>
                    <label className="block text-xs font-semibold text-[#57606a] mb-1.5 uppercase tracking-wide">Cari Data</label>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        placeholder="Cari komoditas / pemohon / dokumen..."
                        className="w-full px-3 py-2 text-sm bg-white text-[#1f2328] border border-[#d0d7de] focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-[#57606a] mb-1.5 uppercase tracking-wide">Arah Lalu Lintas</label>
                    <select
                        value={trafficType}
                        onChange={(e) => {
                            setTrafficType(e.target.value);
                            setPage(1);
                        }}
                        className="w-full px-3 py-2 text-sm bg-white text-[#1f2328] border border-[#d0d7de] focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
                    >
                        <option value="ALL">Semua (Pemasukan &amp; Pengeluaran)</option>
                        <option value="IMPORT">Pemasukan (Masuk / IMPORT)</option>
                        <option value="EXPORT">Pengeluaran (Keluar / EXPORT)</option>
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-[#57606a] mb-1.5 uppercase tracking-wide">Kategori Komoditas</label>
                    <select
                        value={category}
                        onChange={(e) => {
                            setCategory(e.target.value);
                            setPage(1);
                        }}
                        className="w-full px-3 py-2 text-sm bg-white text-[#1f2328] border border-[#d0d7de] focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
                    >
                        <option value="ALL">Semua Kategori</option>
                        <option value="HEWAN_HIDUP">Hewan Hidup</option>
                        <option value="PRODUK_HEWAN">Produk Hewan Segar/Beku</option>
                        <option value="OLAHAN_PRODUK_HEWAN">Produk Olahan</option>
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-[#57606a] mb-1.5 uppercase tracking-wide">Status Kesehatan</label>
                    <select
                        value={inspectionStatus}
                        onChange={(e) => {
                            setInspectionStatus(e.target.value);
                            setPage(1);
                        }}
                        className="w-full px-3 py-2 text-sm bg-white text-[#1f2328] border border-[#d0d7de] focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
                    >
                        <option value="ALL">Semua Status</option>
                        <option value="INSPECTED_PASS">Lulus (PASS)</option>
                        <option value="PENDING">Menunggu (PENDING)</option>
                        <option value="INSPECTED_REJECT">Ditolak (REJECT)</option>
                    </select>
                </div>
            </div>

            {/* Main Table with Responsive Horizontal Scroll */}
            <div className="no-print border border-[#d0d7de] overflow-hidden bg-white shadow-2xs">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[850px] text-left text-sm text-[#1f2328]">
                        <thead className="bg-[#f6f8fa] border-b border-[#d0d7de] font-semibold text-[#57606a] text-xs uppercase tracking-wider">
                            <tr>
                                <th className="py-3 px-3.5">Tanggal / Dokumen</th>
                                <th className="py-3 px-3.5">Tipe</th>
                                <th className="py-3 px-3.5">Komoditas & Kategori</th>
                                <th className="py-3 px-3.5">Jumlah (Satuan Kustom)</th>
                                <th className="py-3 px-3.5">Rute & Angkutan</th>
                                <th className="py-3 px-3.5">Pemohon</th>
                                <th className="py-3 px-3.5">Status Inspeksi</th>
                                <th className="py-3 px-3.5 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#d0d7de]">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="py-12 text-center text-sm text-[#57606a]">
                                        <div className="inline-flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-[#1a7f37] rounded rounded-full  border-t-transparent animate-spin"></div>
                                            <span>Memuat data lalu lintas hewan...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : records.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-12 text-center text-sm text-[#57606a]">
                                        Belum ada data lalu lintas yang sesuai kriteria pencarian.
                                    </td>
                                </tr>
                            ) : (
                                records.map((r) => {
                                    const isImport = r.trafficType === 'IMPORT';
                                    return (
                                        <tr key={r.id} className="hover:bg-[#f6f8fa]/70 transition-colors">
                                            <td className="py-3 px-3.5 font-mono text-xs">
                                                <div className="font-semibold text-[#1f2328]">{r.trafficDate}</div>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="text-[#57606a] font-medium truncate max-w-[130px]">{r.recordNumber}</span>
                                                    {r.attachments && r.attachments.length > 0 && (
                                                        <span
                                                            title={`${r.attachments.length} berkas lampiran terlampir`}
                                                            className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#ddf4ff] text-[#0969da] border border-[#54aeff]/40 shrink-0"
                                                        >
                                                            &#128206; {r.attachments.length}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="py-3 px-3.5">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold ${isImport
                                                            ? 'bg-[#dafbe1] text-[#1a7f37] border border-[#4ac26b]/40'
                                                            : 'bg-[#ddf4ff] text-[#0969da] border border-[#54aeff]/40'
                                                        }`}
                                                >
                                                    {isImport ? 'MASUK' : 'KELUAR'}
                                                </span>
                                            </td>

                                            <td className="py-3 px-3.5">
                                                <div className="font-semibold text-[#1f2328]">{r.itemName}</div>
                                                <div className="text-xs text-[#57606a]">
                                                    {r.category === 'HEWAN_HIDUP'
                                                        ? 'Hewan Hidup'
                                                        : r.category === 'PRODUK_HEWAN'
                                                            ? 'Produk Hewan'
                                                            : 'Produk Olahan'}
                                                </div>
                                            </td>

                                            <td className="py-3 px-3.5">
                                                <span className="font-bold text-[#1f2328]">{r.quantity.toLocaleString('id-ID')}</span>{' '}
                                                <span className="text-[#57606a] text-xs font-medium">{r.unit}</span>
                                            </td>

                                            <td className="py-3 px-3.5 text-xs">
                                                <div className="truncate max-w-[170px] text-[#1f2328] font-medium">{r.origin} &rarr; {r.destination}</div>
                                                <div className="text-[11px] text-[#57606a] uppercase font-medium">Jalur {r.transportType}</div>
                                            </td>

                                            <td className="py-3 px-3.5 text-xs truncate max-w-[140px] text-[#1f2328]">
                                                {r.applicantName}
                                            </td>

                                            <td className="py-3 px-3.5">
                                                {r.inspectionStatus === 'INSPECTED_PASS' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold text-[#1a7f37] bg-[#dafbe1]">
                                                        <span>&#10003; Lulus</span>
                                                    </span>
                                                ) : r.inspectionStatus === 'INSPECTED_REJECT' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold text-[#cf222e] bg-[#ffebe9]">
                                                        <span>&#10005; Ditolak</span>
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium text-[#9a6700] bg-[#fff8c5]">
                                                        <span>&bull; Menunggu</span>
                                                    </span>
                                                )}
                                            </td>

                                            <td className="py-3 px-3.5 text-right space-x-2.5 whitespace-nowrap">
                                                <button
                                                    type="button"
                                                    onClick={() => setViewingRecord(r)}
                                                    className="text-xs text-[#57606a] hover:text-[#1f2328] font-semibold hover:underline cursor-pointer"
                                                >
                                                    Detail
                                                </button>
                                                {user?.role !== 'pimpinan' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditModal(r)}
                                                        className="text-xs text-[#0969da] hover:underline font-semibold cursor-pointer"
                                                    >
                                                        {isDoctor ? 'Verifikasi' : user?.role === 'admin' ? 'Ubah / Validasi' : 'Ubah'}
                                                    </button>
                                                )}
                                                {canCreate && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setRecordToDelete(r)}
                                                        className="text-xs text-[#cf222e] hover:underline font-semibold cursor-pointer"
                                                    >
                                                        Hapus
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="px-4 py-3 bg-[#f6f8fa] border-t border-[#d0d7de] flex items-center justify-between text-xs sm:text-sm text-[#57606a]">
                    <div>
                        Total <span className="font-semibold text-[#1f2328]">{totalCount}</span> data tercatat
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={page <= 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="px-3 py-1.5 bg-white border border-[#d0d7de] font-medium text-[#1f2328] hover:bg-[#f6f8fa] disabled:opacity-40 transition-colors cursor-pointer"
                        >
                            Sebelumnya
                        </button>
                        <span className="font-medium">
                            Halaman {page} dari {totalPages}
                        </span>
                        <button
                            type="button"
                            disabled={page >= totalPages}
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            className="px-3 py-1.5 bg-white border border-[#d0d7de] font-medium text-[#1f2328] hover:bg-[#f6f8fa] disabled:opacity-40 transition-colors cursor-pointer"
                        >
                            Berikutnya
                        </button>
                    </div>
                </div>
            </div>

            {/* Record Detail Modal with Fast Framer Motion (< 250ms) */}
            <AnimatePresence>
                {viewingRecord && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="print-modal-backdrop fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
                        role="dialog"
                        aria-modal="true"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 10 }}
                            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                            className="print-modal-window bg-white border border-[#d0d7de] shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="no-print px-5 py-3.5 border-b border-[#d0d7de] flex items-center justify-between bg-[#f6f8fa]">
                                <h3 className="font-semibold text-sm sm:text-base text-[#1f2328]">
                                    Rincian Surat Keterangan / Catatan Lalu Lintas
                                </h3>
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => window.print()}
                                        className="px-3 py-1.5 text-xs sm:text-sm font-semibold text-[#1f2328] bg-white border border-[#d0d7de] hover:bg-[#f6f8fa] shadow-2xs cursor-pointer"
                                    >
                                        Cetak / Print (A4)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setViewingRecord(null)}
                                        className="text-[#57606a] hover:text-[#1f2328] text-xl leading-none cursor-pointer"
                                        aria-label="Tutup"
                                    >
                                        &times;
                                    </button>
                                </div>
                            </div>

                            <div id="printable-surat-keterangan" className="flex-1 overflow-y-auto p-5 sm:p-6 text-sm text-[#1f2328] space-y-4">
                                {/* Kop Dinas Official Header */}
                                <div className="text-center border-b-2 border-black pb-3">
                                    <div className="font-bold text-xs sm:text-sm uppercase tracking-wide">
                                        Pemerintah Kabupaten Mimika
                                    </div>
                                    <div className="font-bold text-sm sm:text-base uppercase tracking-wide">
                                        Dinas Peternakan dan Kesehatan Hewan
                                    </div>
                                    <div className="text-xs text-[#57606a] mt-0.5">
                                        Kompleks Kantor Pemda Mimika, Jl. Cenderawasih SP 3, Timika - Papua Tengah 99910
                                    </div>
                                </div>

                                <div className="text-center font-bold text-sm underline uppercase pt-2">
                                    {viewingRecord.trafficType === 'IMPORT'
                                        ? 'Surat Verifikasi Pemasukan Komoditas & Sertifikat Veteriner (SV)'
                                        : 'Surat Keterangan Pengawasan Lalu Lintas (SKKH / SKKHP)'}
                                </div>
                                <div className="text-center font-mono text-xs sm:text-sm text-[#57606a]">
                                    {viewingRecord.trafficType === 'IMPORT' ? 'Nomor Dokumen SV Asal' : 'Nomor Dokumen SKKH/SKKHP'}: {viewingRecord.recordNumber}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-4 pt-3 border-t border-[#d0d7de]">
                                    <div>
                                        <div className="text-[#57606a] text-xs uppercase font-bold">Jenis Lalu Lintas:</div>
                                        <div className="font-semibold text-sm sm:text-base mt-0.5">
                                            {viewingRecord.trafficType === 'IMPORT' ? 'PEMASUKAN (IMPORT)' : 'PENGELUARAN (EXPORT)'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[#57606a] text-xs uppercase font-bold">Tanggal Kegiatan:</div>
                                        <div className="font-mono text-sm mt-0.5">{viewingRecord.trafficDate}</div>
                                    </div>

                                    <div>
                                        <div className="text-[#57606a] text-xs uppercase font-bold">Nama Komoditas:</div>
                                        <div className="font-bold text-base text-[#1f2328] mt-0.5">{viewingRecord.itemName}</div>
                                        <div className="text-xs text-[#57606a] font-medium">{viewingRecord.category}</div>
                                    </div>

                                    <div>
                                        <div className="text-[#57606a] text-xs uppercase font-bold">Volume / Kuantitas:</div>
                                        <div className="font-bold text-base text-[#1a7f37] mt-0.5">
                                            {viewingRecord.quantity.toLocaleString('id-ID')} {viewingRecord.unit}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-[#57606a] text-xs uppercase font-bold">Daerah Asal:</div>
                                        <div className="text-sm mt-0.5">{viewingRecord.origin}</div>
                                    </div>

                                    <div>
                                        <div className="text-[#57606a] text-xs uppercase font-bold">Daerah Tujuan:</div>
                                        <div className="text-sm mt-0.5">{viewingRecord.destination}</div>
                                    </div>

                                    <div>
                                        <div className="text-[#57606a] text-xs uppercase font-bold">Moda Transportasi:</div>
                                        <div className="uppercase text-sm mt-0.5">Jalur {viewingRecord.transportType}</div>
                                    </div>

                                    <div>
                                        <div className="text-[#57606a] text-xs uppercase font-bold">Pemilik / Pelaku Usaha:</div>
                                        <div className="font-semibold text-sm mt-0.5">{viewingRecord.applicantName}</div>
                                    </div>
                                </div>

                                <div className="p-3.5 bg-[#f6f8fa] border border-[#d0d7de] space-y-2 mt-4">
                                    <div className="font-semibold text-sm text-[#1f2328]">
                                        Hasil Pemeriksaan Kesehatan Veteriner:
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-xs uppercase text-[#57606a]">Status:</span>
                                        <span
                                            className={`font-semibold px-2.5 py-0.5 text-xs ${viewingRecord.inspectionStatus === 'INSPECTED_PASS'
                                                    ? 'bg-[#dafbe1] text-[#1a7f37]'
                                                    : viewingRecord.inspectionStatus === 'INSPECTED_REJECT'
                                                        ? 'bg-[#ffebe9] text-[#cf222e]'
                                                        : 'bg-[#fff8c5] text-[#9a6700]'
                                                }`}
                                        >
                                            {viewingRecord.inspectionStatus === 'INSPECTED_PASS'
                                                ? 'Lulus (INSPECTED_PASS)'
                                                : viewingRecord.inspectionStatus === 'INSPECTED_REJECT'
                                                    ? 'Ditolak (INSPECTED_REJECT)'
                                                    : 'Menunggu (PENDING)'}
                                        </span>
                                    </div>
                                    {viewingRecord.healthCertificateNo && (
                                        <div className="text-xs sm:text-sm">
                                            <span className="text-[#57606a]">No. Dokumen Karantina: </span>
                                            <span className="font-mono font-semibold">{viewingRecord.healthCertificateNo}</span>
                                        </div>
                                    )}
                                    {viewingRecord.notes && (
                                        <div className="text-xs sm:text-sm text-[#57606a] italic mt-1 bg-white p-2.5 border border-[#d0d7de]/60">
                                            "{viewingRecord.notes}"
                                        </div>
                                    )}
                                </div>

                                {/* Dokumen & Lampiran Bukti Pendukung (Screen View with Action Buttons) */}
                                <div className="print:hidden p-3.5 bg-white border border-[#d0d7de] space-y-2 mt-4">
                                    <div className="flex items-center justify-between">
                                        <div className="font-semibold text-sm text-[#1f2328] flex items-center gap-1.5">
                                            <span>Dokumen &amp; Lampiran Pendukung</span>
                                            {viewingRecord.attachments && viewingRecord.attachments.length > 0 && (
                                                <span className="px-2 py-0.5 text-xs bg-[#ddf4ff] text-[#0969da] rounded-full font-semibold">
                                                    {viewingRecord.attachments.length} berkas
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {(!viewingRecord.attachments || viewingRecord.attachments.length === 0) ? (
                                        <div className="text-xs text-[#57606a] italic py-2">
                                            Tidak ada dokumen atau foto yang dilampirkan pada catatan ini.
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                                            {viewingRecord.attachments.map((att) => {
                                                const isPdf = att.mimeType === 'application/pdf' || att.fileName.toLowerCase().endsWith('.pdf');
                                                const fileUrl = getAttachmentFileUrl(att.id, false);
                                                const downloadUrl = getAttachmentFileUrl(att.id, true);
                                                const sizeStr = (att.fileSize / 1024).toFixed(1) + ' KB';

                                                return (
                                                    <div
                                                        key={att.id}
                                                        className="flex items-center justify-between p-2.5 border border-[#d0d7de] bg-[#f6f8fa] hover:bg-[#f3f4f6] transition-colors"
                                                    >
                                                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                            {isPdf ? (
                                                                <div className="w-8 h-8 rounded bg-[#ffebe9] text-[#cf222e] flex items-center justify-center font-bold text-[11px] shrink-0 border border-[#ff8182]/40">
                                                                    PDF
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setPreviewImage({ url: fileUrl, title: att.fileName })}
                                                                    className="w-8 h-8 rounded bg-white border border-[#d0d7de] overflow-hidden shrink-0 cursor-pointer hover:opacity-80"
                                                                >
                                                                    <img
                                                                        src={fileUrl}
                                                                        alt={att.fileName}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                </button>
                                                            )}
                                                            <div className="min-w-0 flex-1">
                                                                <div className="text-xs font-semibold text-[#1f2328] truncate" title={att.fileName}>
                                                                    {att.fileName}
                                                                </div>
                                                                <div className="text-[11px] text-[#57606a]">{sizeStr}</div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-1.5 ml-2 shrink-0">
                                                            {isPdf ? (
                                                                <a
                                                                    href={fileUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="px-2 py-1 text-xs bg-white border border-[#d0d7de] hover:border-[#0969da] hover:text-[#0969da] font-medium transition-colors cursor-pointer"
                                                                >
                                                                    Lihat
                                                                </a>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setPreviewImage({ url: fileUrl, title: att.fileName })}
                                                                    className="px-2 py-1 text-xs bg-white border border-[#d0d7de] hover:border-[#0969da] hover:text-[#0969da] font-medium transition-colors cursor-pointer"
                                                                >
                                                                    Lihat
                                                                </button>
                                                            )}
                                                            <a
                                                                href={downloadUrl}
                                                                download={att.fileName}
                                                                className="px-2 py-1 text-xs bg-white border border-[#d0d7de] hover:border-[#1a7f37] hover:text-[#1a7f37] font-medium transition-colors cursor-pointer"
                                                                title="Unduh berkas"
                                                            >
                                                                Unduh
                                                            </a>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Dokumen & Lampiran Bukti Pendukung (A4 Official Print View: Nama Berkas Saja) */}
                                {viewingRecord.attachments && viewingRecord.attachments.length > 0 && (
                                    <div className="hidden print:block p-3 border border-black mt-3 text-xs text-black">
                                        <div className="font-bold uppercase mb-1">
                                            Lampiran Dokumen Pendukung ({viewingRecord.attachments.length} berkas):
                                        </div>
                                        <ol className="list-decimal list-inside space-y-0.5 font-medium">
                                            {viewingRecord.attachments.map((a) => (
                                                <li key={a.id} className="font-mono text-[11px]">
                                                    {a.fileName}
                                                </li>
                                            ))}
                                        </ol>
                                    </div>
                                )}

                                {/* Official Signature Footer (shown when printing A4) */}
                                <div className="hidden print:flex justify-end pt-10">
                                    <div className="text-center w-64 space-y-16 text-xs text-black">
                                        <div>
                                            <div>Timika, {viewingRecord.trafficDate}</div>
                                            <div className="font-bold mt-0.5">Pejabat Dokter Hewan Berwenang / Petugas</div>
                                            <div>Dinas Peternakan dan Kesehatan Hewan Kab. Mimika</div>
                                        </div>
                                        <div className="border-t border-black pt-1 font-semibold">
                                            Tanda Tangan &amp; Stempel Resmi
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="no-print p-4 border-t border-[#d0d7de] bg-[#f6f8fa] flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setViewingRecord(null)}
                                    className="px-4 py-2 bg-white border border-[#d0d7de] text-sm font-semibold text-[#1f2328] hover:bg-[#f6f8fa] cursor-pointer"
                                >
                                    Tutup
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Create / Edit Record Modal with Fast Framer Motion (< 250ms) */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="no-print fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
                        role="dialog"
                        aria-modal="true"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 10 }}
                            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                            className="bg-white border border-[#d0d7de] shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="px-5 py-3.5 border-b border-[#d0d7de] flex items-center justify-between bg-[#f6f8fa]">
                                <h3 className="font-semibold text-base text-[#1f2328]">
                                    {editingRecord
                                        ? user?.role === 'admin'
                                            ? 'Ubah & Validasi Data Lalu Lintas'
                                            : isDoctor
                                                ? 'Verifikasi Pemeriksaan Kesehatan Veteriner'
                                                : 'Ubah Data Lalu Lintas'
                                        : formData.trafficType === 'IMPORT'
                                            ? 'Catat Pemasukan Hewan / Produk (SV Asal)'
                                            : 'Catat Pengeluaran Hewan / Produk (SKKH/SKKHP)'}
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

                            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-sm">
                                {modalError && (
                                    <div className="p-3.5 bg-[#ffebe9] border border-[#ff8182]/40 text-sm text-[#cf222e]">
                                        {modalError}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block font-semibold text-[#1f2328] mb-1.5 text-xs uppercase tracking-wide">
                                            {formData.trafficType === 'IMPORT' ? (
                                                <span>
                                                    Nomor Sertifikat Veteriner (SV) Asal
                                                </span>
                                            ) : (
                                                <span>
                                                    Nomor Dokumen SKKH / SKKHP
                                                </span>
                                            )}
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.recordNumber}
                                            onChange={(e) => setFormData({ ...formData, recordNumber: e.target.value })}
                                            placeholder={
                                                formData.trafficType === 'IMPORT'
                                                    ? 'misal: SV/04/DISNAK-JATIM/2026 atau No. SV Asal'
                                                    : 'misal: SKKH/MMK/2026/0129 atau SKKHP/MMK/2026/0045'
                                            }
                                            className="w-full px-3 py-2 text-sm border border-[#d0d7de] focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
                                        />
                                        <div className="text-[11px] text-[#57606a] mt-1">
                                            {formData.trafficType === 'IMPORT'
                                                ? 'Pemasukan: cantumkan nomor SV resmi dari dinas peternakan daerah asal.'
                                                : 'Pengeluaran: cantumkan nomor SKKH/SKKHP resmi yang diterbitkan oleh Dinas Kab. Mimika.'}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block font-semibold text-[#1f2328] mb-1.5 text-xs uppercase tracking-wide">
                                            Tanggal Lalu Lintas
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.trafficDate}
                                            onChange={(e) => setFormData({ ...formData, trafficDate: e.target.value })}
                                            className="w-full px-3 py-2 text-sm border border-[#d0d7de] focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-semibold text-[#1f2328] mb-1.5 text-xs uppercase tracking-wide">
                                            Tipe Lalu Lintas
                                        </label>
                                        <select
                                            value={formData.trafficType}
                                            onChange={(e) => {
                                                const newType = e.target.value as 'IMPORT' | 'EXPORT';
                                                let newRecNum = formData.recordNumber;
                                                if (!editingRecord) {
                                                    if (newType === 'IMPORT' && newRecNum.startsWith('SKKH/')) {
                                                        newRecNum = `SV/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;
                                                    } else if (newType === 'EXPORT' && newRecNum.startsWith('SV/')) {
                                                        newRecNum = `SKKH/MMK/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;
                                                    }
                                                }
                                                setFormData({
                                                    ...formData,
                                                    trafficType: newType,
                                                    recordNumber: newRecNum,
                                                });
                                            }}
                                            className="w-full px-3 py-2 text-sm border border-[#d0d7de] focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
                                        >
                                            <option value="IMPORT">Masuk (IMPORT ke Mimika) &bull; SV Asal</option>
                                            <option value="EXPORT">Keluar (EXPORT dari Mimika) &bull; Wajib SKKH/SKKHP</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block font-semibold text-[#1f2328] mb-1.5 text-xs uppercase tracking-wide">
                                            Kategori Komoditas
                                        </label>
                                        <select
                                            value={formData.category}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    category: e.target.value as 'HEWAN_HIDUP' | 'PRODUK_HEWAN' | 'OLAHAN_PRODUK_HEWAN',
                                                })
                                            }
                                            className="w-full px-3 py-2 text-sm border border-[#d0d7de] focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
                                        >
                                            <option value="HEWAN_HIDUP">Hewan Hidup (Sapi, Kambing, Babi, dll)</option>
                                            <option value="PRODUK_HEWAN">Produk Hewan (Daging Segar/Beku, Telur, dll)</option>
                                            <option value="OLAHAN_PRODUK_HEWAN">Produk Olahan (Sosis, Bakso, Kornet, dll)</option>
                                        </select>
                                    </div>

                                    <div className="sm:col-span-2 space-y-2">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                            <label htmlFor="commodity-name-input" className="block font-semibold text-[#1f2328] text-xs uppercase tracking-wide">
                                                Nama Komoditas
                                            </label>
                                            <span className="text-[11px] text-[#57606a]">
                                                Pilih nama komoditas terdaftar agar seragam atau ketik nama baru
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            <select
                                                aria-label="Pilih dari daftar komoditas terdaftar"
                                                value={
                                                    knownCommodities.some((c) => c.itemName === formData.itemName)
                                                        ? formData.itemName
                                                        : '__CUSTOM__'
                                                }
                                                onChange={(e) => {
                                                    const selectedName = e.target.value;
                                                    if (selectedName === '__CUSTOM__') {
                                                        return;
                                                    }
                                                    const matched = knownCommodities.find((c) => c.itemName === selectedName);
                                                    if (matched) {
                                                        setFormData({
                                                            ...formData,
                                                            itemName: matched.itemName,
                                                            category: matched.category,
                                                            unit: matched.unit,
                                                        });
                                                    }
                                                }}
                                                className="w-full px-3 py-2 text-sm border border-[#d0d7de] bg-[#f6f8fa] text-[#1f2328] focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
                                            >
                                                <option value="__CUSTOM__">-- Pilih Komoditas Terdaftar / Ketik Baru --</option>
                                                {knownCommodities.map((c) => (
                                                    <option key={c.itemName} value={c.itemName}>
                                                        {c.itemName} ({c.unit})
                                                    </option>
                                                ))}
                                            </select>

                                            <input
                                                id="commodity-name-input"
                                                type="text"
                                                list="commodity-name-datalist"
                                                required
                                                value={formData.itemName}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    const matched = knownCommodities.find(
                                                        (c) => c.itemName.toLowerCase() === val.trim().toLowerCase()
                                                    );
                                                    if (matched) {
                                                        setFormData({
                                                            ...formData,
                                                            itemName: matched.itemName,
                                                            category: matched.category,
                                                            unit: matched.unit,
                                                        });
                                                    } else {
                                                        setFormData({ ...formData, itemName: val });
                                                    }
                                                }}
                                                placeholder="Ketik nama komoditas baru atau pilih..."
                                                className="w-full px-3 py-2 text-sm border border-[#d0d7de] focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
                                            />
                                        </div>

                                        <datalist id="commodity-name-datalist">
                                            {knownCommodities.map((c) => (
                                                <option key={c.itemName} value={c.itemName} />
                                            ))}
                                        </datalist>

                                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-xs text-[#57606a]">
                                            <span className="font-medium">Komoditas ({formData.category === 'HEWAN_HIDUP' ? 'Hewan Hidup' : formData.category === 'PRODUK_HEWAN' ? 'Produk Hewan' : 'Produk Olahan'}):</span>
                                            {knownCommodities
                                                .filter((c) => c.category === formData.category)
                                                .map((c) => (
                                                    <button
                                                        key={c.itemName}
                                                        type="button"
                                                        onClick={() =>
                                                            setFormData({
                                                                ...formData,
                                                                itemName: c.itemName,
                                                                category: c.category,
                                                                unit: c.unit,
                                                            })
                                                        }
                                                        className={`px-2 py-0.5 border text-xs transition-colors cursor-pointer ${formData.itemName === c.itemName
                                                                ? 'bg-[#dafbe1] text-[#1a7f37] border-[#4ac26b] font-semibold'
                                                                : 'bg-white text-[#57606a] border-[#d0d7de] hover:bg-[#f6f8fa] hover:text-[#0969da]'
                                                            }`}
                                                    >
                                                        {c.itemName}
                                                    </button>
                                                ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block font-semibold text-[#1f2328] mb-1.5 text-xs uppercase tracking-wide">
                                            Jumlah (Kuantitas)
                                        </label>
                                        <input
                                            type="number"
                                            step="any"
                                            min="0.01"
                                            required
                                            placeholder="Masukkan jumlah (misal: 25)"
                                            value={quantityInput}
                                            onChange={(e) => {
                                                const raw = e.target.value.replace(/^0+(?=\d)/, '');
                                                setQuantityInput(raw);
                                                const num = parseFloat(raw);
                                                if (!Number.isNaN(num)) {
                                                    setFormData({ ...formData, quantity: num });
                                                }
                                            }}
                                            className="w-full px-3 py-2 text-sm border border-[#d0d7de] focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-semibold text-[#1f2328] mb-1.5 text-xs uppercase tracking-wide">
                                            Satuan Kustom (Custom Unit)
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.unit}
                                            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                            placeholder="misal: ekor, kg, rak, ton, karton, butir"
                                            className="w-full px-3 py-2 text-sm border border-[#d0d7de] focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
                                        />
                                        <div className="flex gap-2 mt-1.5 text-xs text-[#57606a]">
                                            <span>Saran:</span>
                                            {['ekor', 'kg', 'rak', 'ton', 'karton'].map((u) => (
                                                <button
                                                    key={u}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, unit: u })}
                                                    className="underline hover:text-[#0969da] cursor-pointer"
                                                >
                                                    {u}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block font-semibold text-[#1f2328] mb-1.5 text-xs uppercase tracking-wide">
                                            Asal Pengiriman
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.origin}
                                            onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                                            placeholder="misal: Surabaya, Jawa Timur"
                                            className="w-full px-3 py-2 text-sm border border-[#d0d7de] focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-semibold text-[#1f2328] mb-1.5 text-xs uppercase tracking-wide">
                                            Tujuan Penerimaan
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.destination}
                                            onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                                            placeholder="misal: Distrik Mimika Baru, Timika"
                                            className="w-full px-3 py-2 text-sm border border-[#d0d7de] focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-semibold text-[#1f2328] mb-1.5 text-xs uppercase tracking-wide">
                                            Jalur Angkutan
                                        </label>
                                        <select
                                            value={formData.transportType}
                                            onChange={(e) => setFormData({ ...formData, transportType: e.target.value as 'UDARA' | 'LAUT' | 'DARAT' })}
                                            className="w-full px-3 py-2 text-sm border border-[#d0d7de] focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
                                        >
                                            <option value="LAUT">Laut (Pelabuhan Pomako)</option>
                                            <option value="UDARA">Udara (Bandara Mozes Kilangin)</option>
                                            <option value="DARAT">Darat (Antar Distrik)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block font-semibold text-[#1f2328] mb-1.5 text-xs uppercase tracking-wide">
                                            Nama Pemilik / Pelaku Usaha
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.applicantName}
                                            onChange={(e) => setFormData({ ...formData, applicantName: e.target.value })}
                                            placeholder="misal: CV Papua Mandiri Ternak"
                                            className="w-full px-3 py-2 text-sm border border-[#d0d7de] focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-semibold text-[#1f2328] mb-1.5 text-xs uppercase tracking-wide">
                                            Status Pemeriksaan Kesehatan
                                        </label>
                                        <select
                                            value={formData.inspectionStatus}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    inspectionStatus: e.target.value as 'PENDING' | 'INSPECTED_PASS' | 'INSPECTED_REJECT',
                                                })
                                            }
                                            className="w-full px-3 py-2 text-sm border border-[#d0d7de] bg-white text-[#1f2328] focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
                                        >
                                            <option value="PENDING">Menunggu Pemeriksaan (PENDING)</option>
                                            <option value="INSPECTED_PASS">Lulus Inspeksi (PASS)</option>
                                            <option value="INSPECTED_REJECT">Ditolak / Karantina (REJECT)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block font-semibold text-[#1f2328] mb-1.5 text-xs uppercase tracking-wide">
                                            {formData.trafficType === 'IMPORT'
                                                ? 'Nomor Sertifikat Pelepasan Karantina Asal'
                                                : 'Nomor Register Rekomendasi Pengeluaran'}
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.healthCertificateNo}
                                            onChange={(e) => setFormData({ ...formData, healthCertificateNo: e.target.value })}
                                            placeholder={
                                                formData.trafficType === 'IMPORT'
                                                    ? 'misal: KH-11/2026/08912 atau No. Karantina Masuk'
                                                    : 'misal: REG/SKKH-EXP/MMK/2026/001'
                                            }
                                            className="w-full px-3 py-2 text-sm border border-[#d0d7de] bg-white text-[#1f2328] focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
                                        />
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label className="block font-semibold text-[#1f2328] mb-1.5 text-xs uppercase tracking-wide">
                                            {formData.trafficType === 'IMPORT'
                                                ? 'Catatan Verifikasi Dokumen SV / Karantina Masuk'
                                                : 'Catatan Klinis Dokter Hewan / Hasil Pemeriksaan Fisik'}
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            placeholder={
                                                formData.trafficType === 'IMPORT'
                                                    ? 'Sertifikat Veteriner (SV) asal terverifikasi lengkap dan sesuai. Ternak/produk aman masuk.'
                                                    : 'Pemeriksaan fisik hewan ternak normal, suhu tubuh aman, tidak ada gejala PMK/ASF. Layak diberangkatkan.'
                                            }
                                            className="w-full px-3 py-2 text-sm border border-[#d0d7de] bg-white text-[#1f2328] focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
                                        />
                                    </div>

                                    {/* File Attachments Section */}
                                    <div className="sm:col-span-2 space-y-3 pt-3 border-t border-[#d0d7de]">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                            <label className="block font-semibold text-[#1f2328] text-xs uppercase tracking-wide">
                                                {formData.trafficType === 'IMPORT' ? (
                                                    <div className="flex flex-col">
                                                        <label>Lampiran Sertifikat Veteriner (SV) Asal</label>
                                                        <label className="text-[#1a7f37] font-semibold text-[11px] normal-case">(SKKH Tidak Diperlukan, Cukup Lampirkan SV Asal)</label>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col">
                                                        <label>Lampiran Dokumen SKKH / SKKHP Resmi</label>
                                                        <label className="text-[#cf222e] font-bold text-[11px] normal-case">* Wajib Diunggah (Mandatory)</label>
                                                    </div>
                                                )}
                                            </label>
                                            <span className="text-[11px] text-[#57606a]">
                                                Maks. 10MB per berkas (PDF, JPG, PNG, WEBP)
                                            </span>
                                        </div>

                                        {formData.trafficType === 'IMPORT' ? (
                                            <div className="p-3 bg-[#f0fdf4] border border-[#86efac] text-xs text-[#14532d] flex items-start gap-2">
                                                <span className="font-bold text-sm leading-none mt-0.5">&#10003;</span>
                                                <div>
                                                    <div className="font-bold">Ketentuan Pemasukan (IMPORT):</div>
                                                    <div>
                                                        Komoditas yang masuk ke wilayah Kabupaten Mimika hanya memerlukan lampiran berkas <strong>Sertifikat Veteriner (SV)</strong> dari dinas daerah asal dan dokumen pelepasan karantina. SKKH tidak diperlukan untuk komoditas masuk.
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-3 bg-[#ffebe9] border border-[#ff8182]/50 text-xs text-[#cf222e] flex items-start gap-2">
                                                <span className="font-bold text-sm leading-none mt-0.5">&#9888;</span>
                                                <div>
                                                    <div className="font-bold">Ketentuan Pengeluaran (EXPORT):</div>
                                                    <div>
                                                        Komoditas yang keluar dari Kabupaten Mimika <strong>wajib melampirkan berkas fisik/pindaian SKKH / SKKHP resmi</strong>. Berkas wajib diunggah sebelum data dapat disimpan.
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Existing Attachments when Editing */}
                                        {editingRecord && existingAttachments.length > 0 && (
                                            <div className="space-y-1.5 mb-2">
                                                <div className="flex items-center justify-between text-xs font-semibold text-[#57606a]">
                                                    <span>Berkas terunggah:</span>
                                                    {attachmentIdsToDelete.length > 0 && (
                                                        <span className="text-[#cf222e] text-[11px] font-medium">
                                                            ({attachmentIdsToDelete.length} berkas ditandai hapus &bull; dihapus saat simpan)
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    {existingAttachments.map((att) => {
                                                        const isMarkedForDelete = attachmentIdsToDelete.includes(att.id);
                                                        const isPdf = att.mimeType === 'application/pdf' || att.fileName.toLowerCase().endsWith('.pdf');
                                                        const fileUrl = getAttachmentFileUrl(att.id, false);

                                                        const activeExistingCount = existingAttachments.filter(
                                                            (a) => !attachmentIdsToDelete.includes(a.id)
                                                        ).length;
                                                        const isOnlyExportDoc =
                                                            formData.trafficType === 'EXPORT' &&
                                                            !isMarkedForDelete &&
                                                            activeExistingCount + selectedFiles.length <= 1;

                                                        return (
                                                            <div
                                                                key={att.id}
                                                                className={`flex items-center justify-between p-2 border text-xs transition-colors ${
                                                                    isMarkedForDelete
                                                                        ? 'border-[#cf222e]/40 bg-[#ffebe9]/60'
                                                                        : 'border-[#d0d7de] bg-[#f6f8fa]'
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-2 truncate flex-1 min-w-0 mr-2">
                                                                    <span
                                                                        className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                                                                            isMarkedForDelete
                                                                                ? 'bg-[#d0d7de] text-[#57606a]'
                                                                                : isPdf
                                                                                ? 'bg-[#ffebe9] text-[#cf222e]'
                                                                                : 'bg-[#ddf4ff] text-[#0969da]'
                                                                        }`}
                                                                    >
                                                                        {isPdf ? 'PDF' : 'IMG'}
                                                                    </span>
                                                                    <div className="truncate">
                                                                        <span
                                                                            className={`truncate font-medium block ${
                                                                                isMarkedForDelete
                                                                                    ? 'line-through text-[#57606a]'
                                                                                    : 'text-[#1f2328]'
                                                                            }`}
                                                                            title={att.fileName}
                                                                        >
                                                                            {att.fileName}
                                                                        </span>
                                                                        {isMarkedForDelete && (
                                                                            <span className="text-[10px] text-[#cf222e] font-semibold block">
                                                                                (Akan dihapus saat disimpan)
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2 shrink-0">
                                                                    {!isMarkedForDelete && (
                                                                        isPdf ? (
                                                                            <a
                                                                                href={fileUrl}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="text-[#0969da] hover:underline"
                                                                            >
                                                                                Buka
                                                                            </a>
                                                                        ) : (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setPreviewImage({ url: fileUrl, title: att.fileName })}
                                                                                className="text-[#0969da] hover:underline cursor-pointer"
                                                                            >
                                                                                Lihat
                                                                            </button>
                                                                        )
                                                                    )}
                                                                    {isMarkedForDelete ? (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleToggleDeleteAttachment(att.id)}
                                                                            className="text-[#0969da] hover:underline font-semibold cursor-pointer"
                                                                            title="Batalkan penghapusan berkas ini"
                                                                        >
                                                                            Batal Hapus
                                                                        </button>
                                                                    ) : (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleToggleDeleteAttachment(att.id)}
                                                                            className={`cursor-pointer ${
                                                                                isOnlyExportDoc
                                                                                    ? 'text-[#8c959f] hover:text-[#cf222e]'
                                                                                    : 'text-[#cf222e] hover:underline'
                                                                            }`}
                                                                            title={
                                                                                isOnlyExportDoc
                                                                                    ? 'Wajib minimal 1 dokumen untuk EXPORT. Unggah berkas pengganti terlebih dahulu sebelum menghapus.'
                                                                                    : 'Tandai berkas untuk dihapus saat disimpan'
                                                                            }
                                                                        >
                                                                            Hapus
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* New Selected Files List */}
                                        {selectedFiles.length > 0 && (
                                            <div className="space-y-1.5 pt-1">
                                                <div className="text-xs font-semibold text-[#1a7f37] flex items-center justify-between">
                                                    <span>{selectedFiles.length} berkas baru akan diunggah:</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedFiles([])}
                                                        className="text-[11px] text-[#cf222e] hover:underline cursor-pointer"
                                                    >
                                                        Hapus Semua
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    {selectedFiles.map((file, idx) => {
                                                        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
                                                        const sizeStr = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
                                                        return (
                                                            <div
                                                                key={idx}
                                                                className="flex items-center justify-between p-2 border border-[#4ac26b]/50 bg-[#dafbe1]/30 text-xs"
                                                            >
                                                                <div className="flex items-center gap-2 truncate flex-1 min-w-0 mr-2">
                                                                    <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${isPdf ? 'bg-[#ffebe9] text-[#cf222e]' : 'bg-[#ddf4ff] text-[#0969da]'}`}>
                                                                        {isPdf ? 'PDF' : 'IMG'}
                                                                    </span>
                                                                    <div className="truncate">
                                                                        <div className="font-semibold text-[#1f2328] truncate" title={file.name}>
                                                                            {file.name}
                                                                        </div>
                                                                        <div className="text-[10px] text-[#57606a]">{sizeStr}</div>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setSelectedFiles((prev) => prev.filter((_, i) => i !== idx))}
                                                                    className="text-[#cf222e] hover:text-[#a40e26] font-bold text-sm px-1.5 cursor-pointer"
                                                                    title="Batalkan berkas ini"
                                                                >
                                                                    &times;
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Drag and Drop / File Input Zone */}
                                        <div
                                            onDragOver={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                            }}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                                    handleFileSelection(Array.from(e.dataTransfer.files));
                                                }
                                            }}
                                            className="border-2 border-dashed border-[#d0d7de] hover:border-[#0969da] bg-[#f6f8fa] hover:bg-[#ddf4ff]/10 transition-colors p-4 text-center cursor-pointer relative"
                                        >
                                            <input
                                                type="file"
                                                multiple
                                                accept=".pdf,image/jpeg,image/png,image/webp"
                                                id="traffic-attachments-input"
                                                onChange={(e) => {
                                                    if (e.target.files && e.target.files.length > 0) {
                                                        handleFileSelection(Array.from(e.target.files));
                                                        e.target.value = '';
                                                    }
                                                }}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                            <div className="flex flex-col items-center justify-center gap-1 pointer-events-none">
                                                <div className="text-xl text-[#57606a]">&#128196;</div>
                                                <div className="text-xs font-semibold text-[#1f2328]">
                                                    {formData.trafficType === 'IMPORT'
                                                        ? 'Lampirkan Berkas Sertifikat Veteriner (SV) Asal'
                                                        : 'Unggah Berkas Dokumen SKKH / SKKHP Resmi (Wajib)'}
                                                </div>
                                                <div className="text-[11px] text-[#57606a]">
                                                    {formData.trafficType === 'IMPORT'
                                                        ? 'Tarik & lepas berkas SV asal atau pilih dari perangkat (PDF/JPG/PNG/WEBP)'
                                                        : 'Tarik & lepas berkas SKKH/SKKHP atau pilih dari perangkat (PDF/JPG/PNG/WEBP)'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-[#d0d7de] flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 border border-[#d0d7de] text-sm font-semibold text-[#1f2328] hover:bg-[#f6f8fa] transition-colors cursor-pointer"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-5 py-2 font-semibold text-sm text-white bg-[#1a7f37] hover:bg-[#1a7f37]/90 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
                                    >
                                        {submitting ? 'Menyimpan...' : 'Simpan Data'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Image Lightbox Modal */}
            <AnimatePresence>
                {previewImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="no-print fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs"
                        onClick={() => setPreviewImage(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative max-w-4xl max-h-[90vh] bg-white shadow-2xl flex flex-col overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="px-4 py-2.5 bg-[#f6f8fa] border-b border-[#d0d7de] flex items-center justify-between">
                                <span className="font-semibold text-xs text-[#1f2328] truncate max-w-[80%]">
                                    {previewImage.title}
                                </span>
                                <div className="flex items-center gap-3">
                                    <a
                                        href={previewImage.url + (previewImage.url.includes('?') ? '&' : '?') + 'download=true'}
                                        download={previewImage.title}
                                        className="text-xs text-[#0969da] hover:underline font-medium"
                                    >
                                        Unduh
                                    </a>
                                    <button
                                        type="button"
                                        onClick={() => setPreviewImage(null)}
                                        className="text-[#57606a] hover:text-[#1f2328] text-lg leading-none cursor-pointer"
                                        aria-label="Tutup Pratinjau Gambar"
                                    >
                                        &times;
                                    </button>
                                </div>
                            </div>
                            <div className="p-3 flex items-center justify-center bg-black/5 overflow-auto max-h-[80vh]">
                                <img
                                    src={previewImage.url}
                                    alt={previewImage.title}
                                    className="max-h-[75vh] w-auto object-contain mx-auto border border-[#d0d7de]"
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Record Confirmation Modal */}
            <AnimatePresence>
                {recordToDelete && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="no-print fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
                        role="dialog"
                        aria-modal="true"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 8 }}
                            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            className="bg-white border border-[#d0d7de] shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-start gap-3.5">
                                <div className="p-2.5 bg-[#ffebe9] border border-[#ff8182]/40 rounded-full shrink-0 text-[#cf222e]">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-bold text-base text-[#1f2328]">Hapus Catatan Lalu Lintas?</h3>
                                    <p className="text-xs text-[#57606a] mt-0.5">
                                        Tindakan ini permanen dan akan dicatat secara otomatis dalam log audit sistem.
                                    </p>
                                </div>
                            </div>

                            <div className="p-3 bg-[#f6f8fa] border border-[#d0d7de] space-y-1.5 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-[#57606a]">Nomor Dokumen:</span>
                                    <span className="font-mono font-bold text-[#1f2328]">{recordToDelete.recordNumber}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#57606a]">Komoditas:</span>
                                    <span className="font-semibold text-[#1f2328]">
                                        {recordToDelete.itemName} ({recordToDelete.quantity.toLocaleString('id-ID')} {recordToDelete.unit})
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#57606a]">Rute &amp; Moda:</span>
                                    <span className="text-[#1f2328]">
                                        {recordToDelete.origin} &rarr; {recordToDelete.destination} ({recordToDelete.transportType})
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#57606a]">Tanggal:</span>
                                    <span className="text-[#1f2328]">{recordToDelete.trafficDate}</span>
                                </div>
                                {recordToDelete.attachments && recordToDelete.attachments.length > 0 && (
                                    <div className="pt-1.5 border-t border-[#d0d7de] text-[11px] text-[#cf222e] flex items-center gap-1 font-medium">
                                        <span>&#9888;</span>
                                        <span>{recordToDelete.attachments.length} berkas fisik lampiran di server akan ikut terhapus.</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-2">
                                <button
                                    type="button"
                                    disabled={deletingRecord}
                                    onClick={() => setRecordToDelete(null)}
                                    className="px-4 py-2 border border-[#d0d7de] text-xs font-semibold text-[#1f2328] hover:bg-[#f6f8fa] transition-colors cursor-pointer disabled:opacity-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    disabled={deletingRecord}
                                    onClick={confirmDeleteRecord}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#cf222e] hover:bg-[#a40e26] transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                                >
                                    {deletingRecord ? (
                                        <>
                                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            <span>Menghapus...</span>
                                        </>
                                    ) : (
                                        <span>Ya, Hapus Catatan</span>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

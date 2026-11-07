import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import {
  createTrafficRecord,
  deleteTrafficRecord,
  fetchTrafficRecords,
  updateTrafficRecord,
  type TrafficRecord,
} from '../../services/api';

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

  // Lock background scroll when any modal is open
  useBodyScrollLock(isModalOpen || !!viewingRecord);

  // Form State
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
      const res = await fetchTrafficRecords({
        search,
        category,
        trafficType,
        inspectionStatus,
        page,
      });
      setRecords(res.data);
      setTotalPages(res.meta.totalPages || 1);
      setTotalCount(res.meta.total || 0);
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
    setFormData({
      recordNumber: `SKKH/MMK/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
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
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (rec: TrafficRecord) => {
    setEditingRecord(rec);
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

  const handleDelete = async (id: string, recordNum: string) => {
    if (!window.confirm(`Yakin ingin menghapus catatan lalu lintas ${recordNum}? Tindakan ini akan tercatat di log audit.`)) {
      return;
    }
    try {
      await deleteTrafficRecord(id);
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setSubmitting(true);

    try {
      if (editingRecord) {
        await updateTrafficRecord(editingRecord.id, formData);
      } else {
        await createTrafficRecord(formData);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#d0d7de] pb-4">
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
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setTrafficType('ALL');
            setPage(1);
          }}
          className={`px-3.5 py-1.5 text-xs font-semibold border transition-colors ${
            trafficType === 'ALL'
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
          className={`px-3.5 py-1.5 text-xs font-semibold border transition-colors ${
            trafficType === 'IMPORT'
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
          className={`px-3.5 py-1.5 text-xs font-semibold border transition-colors ${
            trafficType === 'EXPORT'
              ? 'bg-[#0969da] text-white border-[#0969da]'
              : 'bg-white text-[#0969da] border-[#54aeff]/60 hover:bg-[#ddf4ff]/40'
          }`}
        >
          Pengeluaran: Data Hewan &amp; Produk Keluar
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-[#f6f8fa] p-3.5 border border-[#d0d7de]">
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
      <div className="border border-[#d0d7de] overflow-hidden bg-white shadow-2xs">
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
                      <div className="w-4 h-4 border-2 border-[#1a7f37] border-t-transparent animate-spin"></div>
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
                        <div className="text-[#57606a] font-medium truncate max-w-[150px]">{r.recordNumber}</div>
                      </td>

                      <td className="py-3 px-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold ${
                            isImport
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
                            {isDoctor ? 'Verifikasi' : 'Ubah'}
                          </button>
                        )}
                        {canCreate && (
                          <button
                            type="button"
                            onClick={() => handleDelete(r.id, r.recordNumber)}
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
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
            onClick={() => setViewingRecord(null)}
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white border border-[#d0d7de] shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-3.5 border-b border-[#d0d7de] flex items-center justify-between bg-[#f6f8fa]">
                <h3 className="font-semibold text-sm sm:text-base text-[#1f2328]">
                  Rincian Surat Keterangan / Catatan Lalu Lintas
                </h3>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-1.5 text-xs sm:text-sm font-semibold text-[#1f2328] bg-white border border-[#d0d7de] hover:bg-[#f6f8fa] shadow-2xs cursor-pointer"
                  >
                    Cetak / Print
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

              <div className="flex-1 overflow-y-auto p-5 sm:p-6 text-sm text-[#1f2328] space-y-4">
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
                  Surat Keterangan Pengawasan Lalu Lintas Peternakan
                </div>
                <div className="text-center font-mono text-xs sm:text-sm text-[#57606a]">
                  Nomor: {viewingRecord.recordNumber}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#d0d7de]">
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
                      className={`font-semibold px-2.5 py-0.5 text-xs ${
                        viewingRecord.inspectionStatus === 'INSPECTED_PASS'
                          ? 'bg-[#dafbe1] text-[#1a7f37]'
                          : viewingRecord.inspectionStatus === 'INSPECTED_REJECT'
                          ? 'bg-[#ffebe9] text-[#cf222e]'
                          : 'bg-[#fff8c5] text-[#9a6700]'
                      }`}
                    >
                      {viewingRecord.inspectionStatus}
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
              </div>

              <div className="p-4 border-t border-[#d0d7de] bg-[#f6f8fa] flex justify-end">
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
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
            onClick={() => setIsModalOpen(false)}
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white border border-[#d0d7de] shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-3.5 border-b border-[#d0d7de] flex items-center justify-between bg-[#f6f8fa]">
                <h3 className="font-semibold text-base text-[#1f2328]">
                  {editingRecord
                    ? isDoctor
                      ? 'Verifikasi Pemeriksaan Kesehatan Veteriner'
                      : 'Ubah Data Lalu Lintas'
                    : 'Catat Data Lalu Lintas Baru'}
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

                {isDoctor && (
                  <div className="p-3.5 bg-[#ddf4ff] border border-[#54aeff]/40 text-sm text-[#0969da]">
                    Sebagai Dokter Hewan Berwenang, Anda berwenang memvalidasi status inspeksi, nomor sertifikat kesehatan, dan catatan rekomendasi teknis.
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-[#1f2328] mb-1.5 text-xs uppercase tracking-wide">Nomor Dokumen / SKKH</label>
                    <input
                      type="text"
                      required
                      disabled={isDoctor}
                      value={formData.recordNumber}
                      onChange={(e) => setFormData({ ...formData, recordNumber: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-[#d0d7de] disabled:bg-[#f6f8fa] focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#1f2328] mb-1.5 text-xs uppercase tracking-wide">Tanggal Lalu Lintas</label>
                    <input
                      type="date"
                      required
                      disabled={isDoctor}
                      value={formData.trafficDate}
                      onChange={(e) => setFormData({ ...formData, trafficDate: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-[#d0d7de] disabled:bg-[#f6f8fa] focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#1f2328] mb-1.5 text-xs uppercase tracking-wide">Tipe Lalu Lintas</label>
                    <select
                      disabled={isDoctor}
                      value={formData.trafficType}
                      onChange={(e) => setFormData({ ...formData, trafficType: e.target.value as 'IMPORT' | 'EXPORT' })}
                      className="w-full px-3 py-2 text-sm border border-[#d0d7de] disabled:bg-[#f6f8fa] focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
                    >
                      <option value="IMPORT">Masuk (IMPORT ke Mimika)</option>
                      <option value="EXPORT">Keluar (EXPORT dari Mimika)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#1f2328] mb-1.5 text-xs uppercase tracking-wide">Kategori Komoditas</label>
                    <select
                      disabled={isDoctor}
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          category: e.target.value as 'HEWAN_HIDUP' | 'PRODUK_HEWAN' | 'OLAHAN_PRODUK_HEWAN',
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-[#d0d7de] disabled:bg-[#f6f8fa] focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
                    >
                      <option value="HEWAN_HIDUP">Hewan Hidup (Sapi, Kambing, Babi, dll)</option>
                      <option value="PRODUK_HEWAN">Produk Hewan (Daging Segar/Beku, Telur, dll)</option>
                      <option value="OLAHAN_PRODUK_HEWAN">Produk Olahan (Sosis, Bakso, Kornet, dll)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-[#1f2328] mb-1.5 text-xs uppercase tracking-wide">Nama Komoditas</label>
                    <input
                      type="text"
                      required
                      disabled={isDoctor}
                      value={formData.itemName}
                      onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                      placeholder="misal: Sapi Bali Bakalan, Telur Ayam Ras, Daging Sapi Beku"
                      className="w-full px-3 py-2 text-sm border border-[#d0d7de] disabled:bg-[#f6f8fa] focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#1f2328] mb-1.5 text-xs uppercase tracking-wide">Jumlah (Kuantitas)</label>
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      required
                      disabled={isDoctor}
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 text-sm border border-[#d0d7de] disabled:bg-[#f6f8fa] focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#1f2328] mb-1.5 text-xs uppercase tracking-wide">
                      Satuan Kustom (Custom Unit)
                    </label>
                    <input
                      type="text"
                      required
                      disabled={isDoctor}
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      placeholder="misal: ekor, kg, rak, ton, karton, butir"
                      className="w-full px-3 py-2 text-sm border border-[#d0d7de] disabled:bg-[#f6f8fa] focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
                    />
                    <div className="flex gap-2 mt-1.5 text-xs text-[#57606a]">
                      <span>Saran:</span>
                      {['ekor', 'kg', 'rak', 'ton', 'karton'].map((u) => (
                        <button
                          key={u}
                          type="button"
                          disabled={isDoctor}
                          onClick={() => setFormData({ ...formData, unit: u })}
                          className="underline hover:text-[#0969da] cursor-pointer"
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#1f2328] mb-1.5 text-xs uppercase tracking-wide">Asal Pengiriman</label>
                    <input
                      type="text"
                      required
                      disabled={isDoctor}
                      value={formData.origin}
                      onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                      placeholder="misal: Surabaya, Jawa Timur"
                      className="w-full px-3 py-2 text-sm border border-[#d0d7de] disabled:bg-[#f6f8fa] focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#1f2328] mb-1.5 text-xs uppercase tracking-wide">Tujuan Penerimaan</label>
                    <input
                      type="text"
                      required
                      disabled={isDoctor}
                      value={formData.destination}
                      onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                      placeholder="misal: Distrik Mimika Baru, Timika"
                      className="w-full px-3 py-2 text-sm border border-[#d0d7de] disabled:bg-[#f6f8fa] focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#1f2328] mb-1.5 text-xs uppercase tracking-wide">Jalur Angkutan</label>
                    <select
                      disabled={isDoctor}
                      value={formData.transportType}
                      onChange={(e) => setFormData({ ...formData, transportType: e.target.value as 'UDARA' | 'LAUT' | 'DARAT' })}
                      className="w-full px-3 py-2 text-sm border border-[#d0d7de] disabled:bg-[#f6f8fa] focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
                    >
                      <option value="LAUT">Laut (Pelabuhan Pomako)</option>
                      <option value="UDARA">Udara (Bandara Mozes Kilangin)</option>
                      <option value="DARAT">Darat (Antar Distrik)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#1f2328] mb-1.5 text-xs uppercase tracking-wide">Nama Pemilik / Pelaku Usaha</label>
                    <input
                      type="text"
                      required
                      disabled={isDoctor}
                      value={formData.applicantName}
                      onChange={(e) => setFormData({ ...formData, applicantName: e.target.value })}
                      placeholder="misal: CV Papua Mandiri Ternak"
                      className="w-full px-3 py-2 text-sm border border-[#d0d7de] disabled:bg-[#f6f8fa] focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#1f2328] mb-1.5 text-xs uppercase tracking-wide">Status Pemeriksaan Kesehatan</label>
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
                    <label className="block font-semibold text-[#1f2328] mb-1.5 text-xs uppercase tracking-wide">Nomor Sertifikat Pelepasan Karantina</label>
                    <input
                      type="text"
                      value={formData.healthCertificateNo}
                      onChange={(e) => setFormData({ ...formData, healthCertificateNo: e.target.value })}
                      placeholder="misal: KH-11/2026/08912"
                      className="w-full px-3 py-2 text-sm border border-[#d0d7de] bg-white text-[#1f2328] focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-[#1f2328] mb-1.5 text-xs uppercase tracking-wide">
                      Catatan Klinis Dokter Hewan / Hasil Pemeriksaan
                    </label>
                    <textarea
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Pemeriksaan fisik normal, suhu tubuh dalam batas aman, tidak ada gejala PMK/ASF."
                      className="w-full px-3 py-2 text-sm border border-[#d0d7de] bg-white text-[#1f2328] focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
                    />
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
    </motion.div>
  );
};

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
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
    <div className="space-y-6">
      {/* Title & Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#d0d7de] pb-4">
        <div>
          <h1 className="text-xl font-semibold text-[#1f2328] tracking-tight">
            Data Lalu Lintas Hewan & Produk Peternakan
          </h1>
          <p className="text-xs text-[#656d76] mt-0.5">
            Pencatatan dan verifikasi pemasukan (impor) serta pengeluaran (ekspor) komoditas di Kabupaten Mimika.
          </p>
        </div>

        {canCreate && (
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#1a7f37] hover:bg-[#1a7f37]/90 rounded-md transition-colors shadow-2xs self-start sm:self-auto"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Catat Lintas Baru</span>
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-[#f6f8fa] p-3 rounded-md border border-[#d0d7de]">
        <div>
          <label className="block text-[11px] font-semibold text-[#656d76] mb-1">Cari Data</label>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari komoditas / pemohon / no dokumen..."
            className="w-full px-2.5 py-1.5 text-xs bg-white text-[#1f2328] border border-[#d0d7de] rounded-md focus:outline-none focus:ring-1 focus:ring-[#0969da]"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-[#656d76] mb-1">Tipe Lalu Lintas</label>
          <select
            value={trafficType}
            onChange={(e) => {
              setTrafficType(e.target.value);
              setPage(1);
            }}
            className="w-full px-2.5 py-1.5 text-xs bg-white text-[#1f2328] border border-[#d0d7de] rounded-md focus:outline-none focus:ring-1 focus:ring-[#0969da]"
          >
            <option value="ALL">Semua (Masuk & Keluar)</option>
            <option value="IMPORT">Masuk (IMPORT)</option>
            <option value="EXPORT">Keluar (EXPORT)</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-[#656d76] mb-1">Kategori Komoditas</label>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="w-full px-2.5 py-1.5 text-xs bg-white text-[#1f2328] border border-[#d0d7de] rounded-md focus:outline-none focus:ring-1 focus:ring-[#0969da]"
          >
            <option value="ALL">Semua Kategori</option>
            <option value="HEWAN_HIDUP">Hewan Hidup</option>
            <option value="PRODUK_HEWAN">Produk Hewan Segar/Beku</option>
            <option value="OLAHAN_PRODUK_HEWAN">Produk Olahan</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-[#656d76] mb-1">Status Kesehatan</label>
          <select
            value={inspectionStatus}
            onChange={(e) => {
              setInspectionStatus(e.target.value);
              setPage(1);
            }}
            className="w-full px-2.5 py-1.5 text-xs bg-white text-[#1f2328] border border-[#d0d7de] rounded-md focus:outline-none focus:ring-1 focus:ring-[#0969da]"
          >
            <option value="ALL">Semua Status</option>
            <option value="INSPECTED_PASS">Lulus (PASS)</option>
            <option value="PENDING">Menunggu (PENDING)</option>
            <option value="INSPECTED_REJECT">Ditolak (REJECT)</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="border border-[#d0d7de] rounded-md overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#1f2328]">
            <thead className="bg-[#f6f8fa] border-b border-[#d0d7de] font-semibold text-[#1f2328]">
              <tr>
                <th className="py-2.5 px-3">Tanggal / Dokumen</th>
                <th className="py-2.5 px-3">Tipe</th>
                <th className="py-2.5 px-3">Komoditas & Kategori</th>
                <th className="py-2.5 px-3">Jumlah (Unit Kustom)</th>
                <th className="py-2.5 px-3">Rute & Angkutan</th>
                <th className="py-2.5 px-3">Pemohon</th>
                <th className="py-2.5 px-3">Status Inspeksi</th>
                <th className="py-2.5 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d0d7de]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-[#656d76]">
                    Memuat data lalu lintas hewan...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-[#656d76]">
                    Belum ada data lalu lintas yang sesuai kriteria pencarian.
                  </td>
                </tr>
              ) : (
                records.map((r) => {
                  const isImport = r.trafficType === 'IMPORT';
                  return (
                    <tr key={r.id} className="hover:bg-[#f6f8fa]/60 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-[11px]">
                        <div>{r.trafficDate}</div>
                        <div className="text-[#656d76] font-medium truncate max-w-[140px]">{r.recordNumber}</div>
                      </td>

                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                            isImport
                              ? 'bg-[#dafbe1] text-[#1a7f37] border border-[#4ac26b]/30'
                              : 'bg-[#ddf4ff] text-[#0969da] border border-[#54aeff]/30'
                          }`}
                        >
                          {isImport ? 'MASUK' : 'KELUAR'}
                        </span>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-[#1f2328]">{r.itemName}</div>
                        <div className="text-[10px] text-[#656d76]">
                          {r.category === 'HEWAN_HIDUP'
                            ? 'Hewan Hidup'
                            : r.category === 'PRODUK_HEWAN'
                            ? 'Produk Hewan'
                            : 'Produk Olahan'}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 font-medium">
                        <span className="font-bold text-[#1f2328]">{r.quantity.toLocaleString('id-ID')}</span>{' '}
                        <span className="text-[#656d76] text-[11px]">{r.unit}</span>
                      </td>

                      <td className="py-2.5 px-3 text-[11px]">
                        <div className="truncate max-w-[160px] text-[#1f2328]">{r.origin} &rarr; {r.destination}</div>
                        <div className="text-[10px] text-[#656d76] uppercase">Jalur {r.transportType}</div>
                      </td>

                      <td className="py-2.5 px-3 text-[11px] truncate max-w-[130px]">
                        {r.applicantName}
                      </td>

                      <td className="py-2.5 px-3">
                        {r.inspectionStatus === 'INSPECTED_PASS' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1a7f37]">
                            <span>&#10003; Lulus</span>
                          </span>
                        ) : r.inspectionStatus === 'INSPECTED_REJECT' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#d1242f]">
                            <span>&#10005; Ditolak</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#9a6700]">
                            <span>&bull; Menunggu</span>
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => setViewingRecord(r)}
                          className="text-xs text-[#656d76] hover:text-[#1f2328] font-medium hover:underline"
                        >
                          Detail
                        </button>
                        {user?.role !== 'pimpinan' && (
                          <button
                            type="button"
                            onClick={() => openEditModal(r)}
                            className="text-xs text-[#0969da] hover:underline font-medium"
                          >
                            {isDoctor ? 'Verifikasi' : 'Ubah'}
                          </button>
                        )}
                        {canCreate && (
                          <button
                            type="button"
                            onClick={() => handleDelete(r.id, r.recordNumber)}
                            className="text-xs text-[#d1242f] hover:underline font-medium"
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
        <div className="px-4 py-3 bg-[#f6f8fa] border-t border-[#d0d7de] flex items-center justify-between text-xs text-[#656d76]">
          <div>
            Total <span className="font-semibold text-[#1f2328]">{totalCount}</span> data tercatat
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 bg-white border border-[#d0d7de] rounded hover:bg-[#f6f8fa] disabled:opacity-40"
            >
              Sebelumnya
            </button>
            <span>
              Halaman {page} dari {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 bg-white border border-[#d0d7de] rounded hover:bg-[#f6f8fa] disabled:opacity-40"
            >
              Berikutnya
            </button>
          </div>
        </div>
      </div>

      {/* Record Detail Modal (Printable Official Document) */}
      {viewingRecord && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-md border border-[#d0d7de] shadow-xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#d0d7de] flex items-center justify-between bg-[#f6f8fa]">
              <h3 className="font-semibold text-xs text-[#1f2328]">
                Rincian Surat Keterangan / Catatan Lalu Lintas
              </h3>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-2.5 py-1 text-xs font-medium text-[#1f2328] bg-white border border-[#d0d7de] rounded hover:bg-[#f6f8fa]"
                >
                  Cetak / Print
                </button>
                <button
                  type="button"
                  onClick={() => setViewingRecord(null)}
                  className="text-[#656d76] hover:text-[#1f2328] text-base leading-none"
                >
                  &times;
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 text-xs text-[#1f2328] space-y-4">
              {/* Kop Dinas Official Header */}
              <div className="text-center border-b-2 border-black pb-3">
                <div className="font-bold text-xs uppercase tracking-wide">
                  Pemerintah Kabupaten Mimika
                </div>
                <div className="font-bold text-sm uppercase tracking-wide">
                  Dinas Peternakan dan Kesehatan Hewan
                </div>
                <div className="text-[10px] text-[#656d76]">
                  Kompleks Kantor Pemda Mimika, Jl. Cenderawasih SP 3, Timika - Papua Tengah 99910
                </div>
              </div>

              <div className="text-center font-bold text-xs underline uppercase pt-2">
                Surat Keterangan Pengawasan Lalu Lintas Peternakan
              </div>
              <div className="text-center font-mono text-[11px] text-[#656d76]">
                Nomor: {viewingRecord.recordNumber}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[#d0d7de]">
                <div>
                  <div className="text-[#656d76] text-[10px] uppercase font-bold">Jenis Lalu Lintas:</div>
                  <div className="font-semibold text-sm">
                    {viewingRecord.trafficType === 'IMPORT' ? 'PEMASUKAN (IMPORT)' : 'PENGELUARAN (EXPORT)'}
                  </div>
                </div>
                <div>
                  <div className="text-[#656d76] text-[10px] uppercase font-bold">Tanggal Kegiatan:</div>
                  <div className="font-mono">{viewingRecord.trafficDate}</div>
                </div>

                <div>
                  <div className="text-[#656d76] text-[10px] uppercase font-bold">Nama Komoditas:</div>
                  <div className="font-bold text-[#1f2328]">{viewingRecord.itemName}</div>
                  <div className="text-[10px] text-[#656d76]">{viewingRecord.category}</div>
                </div>

                <div>
                  <div className="text-[#656d76] text-[10px] uppercase font-bold">Volume / Kuantitas:</div>
                  <div className="font-bold text-sm text-[#1a7f37]">
                    {viewingRecord.quantity.toLocaleString('id-ID')} {viewingRecord.unit}
                  </div>
                </div>

                <div>
                  <div className="text-[#656d76] text-[10px] uppercase font-bold">Daerah Asal:</div>
                  <div>{viewingRecord.origin}</div>
                </div>

                <div>
                  <div className="text-[#656d76] text-[10px] uppercase font-bold">Daerah Tujuan:</div>
                  <div>{viewingRecord.destination}</div>
                </div>

                <div>
                  <div className="text-[#656d76] text-[10px] uppercase font-bold">Moda Transportasi:</div>
                  <div className="uppercase">Jalur {viewingRecord.transportType}</div>
                </div>

                <div>
                  <div className="text-[#656d76] text-[10px] uppercase font-bold">Pemilik / Pelaku Usaha:</div>
                  <div className="font-semibold">{viewingRecord.applicantName}</div>
                </div>
              </div>

              <div className="p-3 rounded bg-[#f6f8fa] border border-[#d0d7de] space-y-1.5 mt-4">
                <div className="font-semibold text-xs text-[#1f2328]">
                  Hasil Pemeriksaan Kesehatan Veteriner:
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">Status:</span>
                  <span
                    className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                      viewingRecord.inspectionStatus === 'INSPECTED_PASS'
                        ? 'bg-[#dafbe1] text-[#1a7f37]'
                        : viewingRecord.inspectionStatus === 'INSPECTED_REJECT'
                        ? 'bg-[#ffebe9] text-[#d1242f]'
                        : 'bg-[#fff8c5] text-[#9a6700]'
                    }`}
                  >
                    {viewingRecord.inspectionStatus}
                  </span>
                </div>
                {viewingRecord.healthCertificateNo && (
                  <div>
                    <span className="text-[#656d76]">No. Dokumen Karantina: </span>
                    <span className="font-mono">{viewingRecord.healthCertificateNo}</span>
                  </div>
                )}
                {viewingRecord.notes && (
                  <div className="text-[#656d76] italic mt-1">
                    "{viewingRecord.notes}"
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-[#d0d7de] bg-[#f6f8fa] flex justify-end">
              <button
                type="button"
                onClick={() => setViewingRecord(null)}
                className="px-4 py-1.5 bg-white border border-[#d0d7de] rounded text-xs hover:bg-[#f6f8fa]"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Record Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-md border border-[#d0d7de] shadow-lg max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#d0d7de] flex items-center justify-between bg-[#f6f8fa]">
              <h3 className="font-semibold text-sm text-[#1f2328]">
                {editingRecord
                  ? isDoctor
                    ? 'Verifikasi Pemeriksaan Kesehatan Veteriner'
                    : 'Ubah Data Lalu Lintas'
                  : 'Catat Data Lalu Lintas Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[#656d76] hover:text-[#1f2328] text-base leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {modalError && (
                <div className="p-3 rounded bg-[#ffebe9] border border-[#ff8182]/40 text-[#d1242f]">
                  {modalError}
                </div>
              )}

              {isDoctor && (
                <div className="p-3 rounded bg-[#ddf4ff] border border-[#54aeff]/40 text-[#0969da]">
                  Sebagai Dokter Hewan Berwenang, Anda berwenang memvalidasi status inspeksi, nomor sertifikat kesehatan, dan catatan rekomendasi teknis.
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#1f2328] mb-1">Nomor Dokumen / SKKH</label>
                  <input
                    type="text"
                    required
                    disabled={isDoctor}
                    value={formData.recordNumber}
                    onChange={(e) => setFormData({ ...formData, recordNumber: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-[#d0d7de] rounded disabled:bg-[#f6f8fa]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1f2328] mb-1">Tanggal Lalu Lintas</label>
                  <input
                    type="date"
                    required
                    disabled={isDoctor}
                    value={formData.trafficDate}
                    onChange={(e) => setFormData({ ...formData, trafficDate: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-[#d0d7de] rounded disabled:bg-[#f6f8fa]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1f2328] mb-1">Tipe Lalu Lintas</label>
                  <select
                    disabled={isDoctor}
                    value={formData.trafficType}
                    onChange={(e) => setFormData({ ...formData, trafficType: e.target.value as 'IMPORT' | 'EXPORT' })}
                    className="w-full px-2.5 py-1.5 border border-[#d0d7de] rounded disabled:bg-[#f6f8fa]"
                  >
                    <option value="IMPORT">Masuk (IMPORT ke Mimika)</option>
                    <option value="EXPORT">Keluar (EXPORT dari Mimika)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#1f2328] mb-1">Kategori Komoditas</label>
                  <select
                    disabled={isDoctor}
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value as 'HEWAN_HIDUP' | 'PRODUK_HEWAN' | 'OLAHAN_PRODUK_HEWAN',
                      })
                    }
                    className="w-full px-2.5 py-1.5 border border-[#d0d7de] rounded disabled:bg-[#f6f8fa]"
                  >
                    <option value="HEWAN_HIDUP">Hewan Hidup (Sapi, Kambing, Babi, dll)</option>
                    <option value="PRODUK_HEWAN">Produk Hewan (Daging Segar/Beku, Telur, dll)</option>
                    <option value="OLAHAN_PRODUK_HEWAN">Produk Olahan (Sosis, Bakso, Kornet, dll)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-[#1f2328] mb-1">Nama Komoditas</label>
                  <input
                    type="text"
                    required
                    disabled={isDoctor}
                    value={formData.itemName}
                    onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                    placeholder="misal: Sapi Bali Bakalan, Telur Ayam Ras, Daging Sapi Beku"
                    className="w-full px-2.5 py-1.5 border border-[#d0d7de] rounded disabled:bg-[#f6f8fa]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1f2328] mb-1">Jumlah (Kuantitas)</label>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    required
                    disabled={isDoctor}
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 border border-[#d0d7de] rounded disabled:bg-[#f6f8fa]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1f2328] mb-1">
                    Satuan Kustom (Custom Unit)
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isDoctor}
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="misal: ekor, kg, rak, ton, karton, butir"
                    className="w-full px-2.5 py-1.5 border border-[#d0d7de] rounded disabled:bg-[#f6f8fa]"
                  />
                  <div className="flex gap-1.5 mt-1 text-[10px] text-[#656d76]">
                    <span>Saran:</span>
                    {['ekor', 'kg', 'rak', 'ton', 'karton'].map((u) => (
                      <button
                        key={u}
                        type="button"
                        disabled={isDoctor}
                        onClick={() => setFormData({ ...formData, unit: u })}
                        className="underline hover:text-[#0969da]"
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#1f2328] mb-1">Asal Pengiriman</label>
                  <input
                    type="text"
                    required
                    disabled={isDoctor}
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    placeholder="misal: Surabaya, Jawa Timur"
                    className="w-full px-2.5 py-1.5 border border-[#d0d7de] rounded disabled:bg-[#f6f8fa]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1f2328] mb-1">Tujuan Penerimaan</label>
                  <input
                    type="text"
                    required
                    disabled={isDoctor}
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    placeholder="misal: Distrik Mimika Baru, Timika"
                    className="w-full px-2.5 py-1.5 border border-[#d0d7de] rounded disabled:bg-[#f6f8fa]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1f2328] mb-1">Jalur Angkutan</label>
                  <select
                    disabled={isDoctor}
                    value={formData.transportType}
                    onChange={(e) => setFormData({ ...formData, transportType: e.target.value as 'UDARA' | 'LAUT' | 'DARAT' })}
                    className="w-full px-2.5 py-1.5 border border-[#d0d7de] rounded disabled:bg-[#f6f8fa]"
                  >
                    <option value="LAUT">Laut (Pelabuhan Pomako)</option>
                    <option value="UDARA">Udara (Bandara Mozes Kilangin)</option>
                    <option value="DARAT">Darat (Antar Distrik)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#1f2328] mb-1">Nama Pemilik / Pelaku Usaha</label>
                  <input
                    type="text"
                    required
                    disabled={isDoctor}
                    value={formData.applicantName}
                    onChange={(e) => setFormData({ ...formData, applicantName: e.target.value })}
                    placeholder="misal: CV Papua Mandiri Ternak"
                    className="w-full px-2.5 py-1.5 border border-[#d0d7de] rounded disabled:bg-[#f6f8fa]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1f2328] mb-1">Status Pemeriksaan Kesehatan</label>
                  <select
                    value={formData.inspectionStatus}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        inspectionStatus: e.target.value as 'PENDING' | 'INSPECTED_PASS' | 'INSPECTED_REJECT',
                      })
                    }
                    className="w-full px-2.5 py-1.5 border border-[#d0d7de] rounded bg-white text-[#1f2328]"
                  >
                    <option value="PENDING">Menunggu Pemeriksaan (PENDING)</option>
                    <option value="INSPECTED_PASS">Lulus Inspeksi (PASS)</option>
                    <option value="INSPECTED_REJECT">Ditolak / Karantina (REJECT)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#1f2328] mb-1">Nomor Sertifikat Pelepasan Karantina</label>
                  <input
                    type="text"
                    value={formData.healthCertificateNo}
                    onChange={(e) => setFormData({ ...formData, healthCertificateNo: e.target.value })}
                    placeholder="misal: KH-11/2026/08912"
                    className="w-full px-2.5 py-1.5 border border-[#d0d7de] rounded bg-white text-[#1f2328]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-[#1f2328] mb-1">
                    Catatan Klinis Dokter Hewan / Hasil Pemeriksaan
                  </label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Pemeriksaan fisik normal, suhu tubuh dalam batas aman, tidak ada gejala PMK/ASF."
                    className="w-full px-2.5 py-1.5 border border-[#d0d7de] rounded bg-white text-[#1f2328]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#d0d7de] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 border border-[#d0d7de] rounded text-[#1f2328] hover:bg-[#f6f8fa]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 font-semibold text-white bg-[#1a7f37] hover:bg-[#1a7f37]/90 rounded disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

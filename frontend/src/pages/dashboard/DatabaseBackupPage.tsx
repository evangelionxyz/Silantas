import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import {
  fetchBackupStatus,
  fetchBackupList,
  createManualBackup,
  updateBackupConfig,
  deleteBackupFile,
  downloadBackupFile,
  type DatabaseStatusResponse,
  type BackupFileItem,
} from '../../services/api';

export const DatabaseBackupPage: React.FC = () => {
  const { user } = useAuth();

  const [statusData, setStatusData] = useState<DatabaseStatusResponse | null>(null);
  const [backupFiles, setBackupFiles] = useState<BackupFileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);

  // Form states for backup config
  const [intervalDays, setIntervalDays] = useState<number>(7);
  const [autoEnabled, setAutoEnabled] = useState<boolean>(true);
  const [retentionCount, setRetentionCount] = useState<number>(10);

  // Status message & delete modal
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [statusRes, filesRes] = await Promise.all([
        fetchBackupStatus(),
        fetchBackupList(),
      ]);
      setStatusData(statusRes);
      setBackupFiles(filesRes);
      setIntervalDays(statusRes.config.intervalDays);
      setAutoEnabled(statusRes.config.autoEnabled);
      setRetentionCount(statusRes.config.retentionCount);
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Gagal memuat informasi cadangan basis data',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleManualBackup = async () => {
    if (backingUp) return;
    setBackingUp(true);
    setFeedback(null);

    try {
      const res = await createManualBackup();
      setFeedback({
        type: 'success',
        text: `Cadangan manual berhasil dibuat: ${res.file.filename} (${res.file.sizeDisplay})`,
      });
      await loadData();
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Gagal membuat cadangan manual basis data',
      });
    } finally {
      setBackingUp(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingConfig) return;
    setSavingConfig(true);
    setFeedback(null);

    try {
      const res = await updateBackupConfig({
        intervalDays: Number(intervalDays),
        autoEnabled,
        retentionCount: Number(retentionCount),
      });
      setFeedback({
        type: 'success',
        text: `Konfigurasi berhasil disimpan: Cadangan otomatis ${res.config.autoEnabled ? 'Aktif' : 'Nonaktif'}, setiap ${res.config.intervalDays} hari, retensi ${res.config.retentionCount} berkas.`,
      });
      await loadData();
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Gagal menyimpan konfigurasi cadangan',
      });
    } finally {
      setSavingConfig(false);
    }
  };

  const handleDownload = async (filename: string) => {
    try {
      setDownloadingFile(filename);
      await downloadBackupFile(filename);
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Gagal mengunduh berkas cadangan',
      });
    } finally {
      setDownloadingFile(null);
    }
  };

  const confirmDelete = async () => {
    if (!fileToDelete || deleting) return;
    setDeleting(true);

    try {
      await deleteBackupFile(fileToDelete);
      setFeedback({
        type: 'success',
        text: `Berkas cadangan ${fileToDelete} berhasil dihapus dari server.`,
      });
      setFileToDelete(null);
      await loadData();
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Gagal menghapus berkas cadangan',
      });
    } finally {
      setDeleting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2500);
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '-';
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'medium',
      }).format(date);
    } catch {
      return isoString;
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="p-8 text-center bg-white border border-[#d0d7de]">
        <h2 className="text-base font-semibold text-[#cf222e] mb-1">Akses Terbatas</h2>
        <p className="text-sm text-[#57606a]">
          Halaman manajemen cadangan &amp; basis data hanya dapat diakses oleh Administrator Sistem.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#174b2b] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium text-[#57606a]">
            Memeriksa telemetri basis data dan arsip cadangan...
          </span>
        </div>
      </div>
    );
  }

  const intervalPresets = [1, 3, 7, 14, 30];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#d0d7de]">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-[#57606a] mb-1.5" aria-label="Breadcrumb">
            <span>Dashboard</span>
            <span>/</span>
            <span>Administrasi Sistem</span>
            <span>/</span>
            <span className="font-semibold text-[#1f2920]">Cadangan &amp; Basis Data</span>
          </nav>
          <h1 className="text-2xl font-bold text-[#1f2920] tracking-tight">
            Cadangan &amp; Pemantauan Basis Data
          </h1>
          <p className="text-sm text-[#57606a] mt-0.5">
            Kelola jadwal otomatis (setiap 7 hari), buat cadangan manual, unduh SQL universal, dan pantau kesehatan basis data internal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setRefreshing(true);
              loadData();
            }}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#1f2920] bg-white border border-[#d0d7de] hover:bg-[#f6f8fa] active:bg-[#eef1e8] transition-colors disabled:opacity-50"
            title="Muat ulang telemetri dan daftar cadangan"
          >
            <svg
              className={`w-3.5 h-3.5 text-[#57606a] ${refreshing ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{refreshing ? 'Memperbarui...' : 'Segarkan Data'}</span>
          </button>
        </div>
      </div>

      {/* Alert / Feedback Notification */}
      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3.5 border text-sm flex items-start justify-between gap-3 ${
            feedback.type === 'success'
              ? 'bg-[#dafbe1] border-[#4ac26b] text-[#1a7f37]'
              : 'bg-[#ffebe9] border-[#ff8182] text-[#cf222e]'
          }`}
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {feedback.type === 'success' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              )}
            </svg>
            <span className="font-medium">{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-semibold opacity-70 hover:opacity-100"
          >
            Tutup
          </button>
        </motion.div>
      )}

      {/* Telemetry Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Status Basis Data */}
        <div className="bg-white border border-[#d0d7de] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#57606a] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Status Basis Data</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold bg-[#dafbe1] text-[#1a7f37] border border-[#aceebb] rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1a7f37] animate-pulse" />
              Online
            </span>
          </div>
          <div>
            <div className="text-lg font-bold text-[#1f2920] truncate" title={statusData?.databaseName}>
              {statusData?.databaseName || 'postgres'}
            </div>
            <div className="text-xs text-[#57606a] mt-1 truncate" title={statusData?.databaseVersion}>
              {statusData?.databaseVersion.split('on')[0] || 'PostgreSQL Engine'}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#d0d7de]/60 flex items-center justify-between text-xs text-[#57606a]">
            <span>Koneksi Aktif</span>
            <span className="font-semibold text-[#1f2920]">{statusData?.activeConnections || 1} sesi</span>
          </div>
        </div>

        {/* Card 2: Kapasitas Basis Data */}
        <div className="bg-white border border-[#d0d7de] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#57606a] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Ukuran Basis Data</span>
            <svg className="w-4 h-4 text-[#0969da]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#1f2920]">
              {statusData?.databaseSize || '0 B'}
            </div>
            <div className="text-xs text-[#57606a] mt-1">
              Skema internal <code className="font-semibold text-[#174b2b]">silantas</code>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#d0d7de]/60 flex items-center justify-between text-xs text-[#57606a]">
            <span>Total Relasi Tabel</span>
            <span className="font-semibold text-[#1f2920]">{statusData?.tables.length || 0} tabel utama</span>
          </div>
        </div>

        {/* Card 3: Arsip Cadangan di Server */}
        <div className="bg-white border border-[#d0d7de] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#57606a] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Arsip Cadangan</span>
            <svg className="w-4 h-4 text-[#8250df]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#1f2920]">
              {statusData?.totalBackups || 0} Berkas
            </div>
            <div className="text-xs text-[#57606a] mt-1">
              Penggunaan disk: <span className="font-semibold text-[#1f2920]">{statusData?.totalBackupSizeDisplay || '0 B'}</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#d0d7de]/60 flex items-center justify-between text-xs text-[#57606a]">
            <span>Status Terakhir</span>
            <span className="font-semibold text-[#1a7f37]">
              {statusData?.config.lastStatus || 'Belum Ada'}
            </span>
          </div>
        </div>

        {/* Card 4: Jadwal Otomatis */}
        <div className="bg-white border border-[#d0d7de] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#57606a] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Jadwal Cadangan</span>
            <svg className="w-4 h-4 text-[#bf8700]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="text-lg font-bold text-[#1f2920]">
              {statusData?.config.autoEnabled
                ? `Setiap ${statusData.config.intervalDays} Hari`
                : 'Otomatis Nonaktif'}
            </div>
            <div className="text-xs text-[#57606a] mt-1 truncate" title={statusData?.config.nextRun ? formatDate(statusData.config.nextRun) : 'Menunggu pemicu'}>
              Berikutnya: {statusData?.config.nextRun ? formatDate(statusData.config.nextRun) : '-'}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#d0d7de]/60 flex items-center justify-between text-xs text-[#57606a]">
            <span>Terakhir Dijalankan</span>
            <span className="font-semibold text-[#1f2920]">
              {statusData?.config.lastRun ? formatDate(statusData.config.lastRun) : 'Belum Pernah'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Controls Section: Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column 1: Admin Configuration Controls */}
        <div className="bg-white border border-[#d0d7de] p-5">
          <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#d0d7de]">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#1f2920]">
                Pengaturan Siklus Cadangan Otomatis
              </h2>
              <p className="text-xs text-[#57606a] mt-0.5">
                Atur frekuensi interval berkala dan kuota retensi penyimpanan berkas.
              </p>
            </div>
            <span className="px-2 py-0.5 text-xs font-semibold bg-[#eef1e8] text-[#174b2b] border border-[#c6cbc0]">
              Admin Control
            </span>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4">
            {/* Auto-backup Toggle */}
            <div className="flex items-center justify-between p-3 bg-[#f6f8fa] border border-[#d0d7de]">
              <div>
                <label htmlFor="auto-enabled-toggle" className="text-sm font-semibold text-[#1f2920] block">
                  Pencadangan Otomatis Latar Belakang
                </label>
                <span className="text-xs text-[#57606a]">
                  Sistem worker internal akan mengeksekusi cadangan secara mandiri saat interval tercapai.
                </span>
              </div>
              <button
                type="button"
                id="auto-enabled-toggle"
                role="switch"
                aria-checked={autoEnabled}
                onClick={() => setAutoEnabled(!autoEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#174b2b] ${
                  autoEnabled ? 'bg-[#174b2b]' : 'bg-[#afb8c1]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    autoEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Interval Configuration */}
            <div>
              <label htmlFor="interval-input" className="block text-xs font-semibold uppercase tracking-wider text-[#57606a] mb-1.5">
                Interval Pengulangan (Hari)
              </label>
              <div className="flex items-center gap-2 mb-2">
                <input
                  id="interval-input"
                  type="number"
                  min="1"
                  max="365"
                  value={intervalDays}
                  onChange={(e) => setIntervalDays(Math.max(1, Math.min(365, parseInt(e.target.value) || 1)))}
                  className="w-24 px-3 py-2 text-sm border border-[#d0d7de] focus:outline-none focus:border-[#174b2b] font-semibold text-center"
                />
                <span className="text-xs text-[#57606a]">hari sekali (Default: 7 hari)</span>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-[#57606a] mr-1">Pilihan Cepat:</span>
                {intervalPresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setIntervalDays(preset)}
                    className={`px-2.5 py-1 text-xs font-semibold border transition-colors ${
                      intervalDays === preset
                        ? 'bg-[#174b2b] text-white border-[#174b2b]'
                        : 'bg-white text-[#57606a] border-[#d0d7de] hover:bg-[#f6f8fa]'
                    }`}
                  >
                    {preset} Hari {preset === 7 && '(Standar)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Retention Limit */}
            <div className="pt-2 border-t border-[#d0d7de]/60">
              <label htmlFor="retention-input" className="block text-xs font-semibold uppercase tracking-wider text-[#57606a] mb-1.5">
                Batas Retensi Berkas Cadangan (Pruning Limit)
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="retention-input"
                  type="number"
                  min="1"
                  max="100"
                  value={retentionCount}
                  onChange={(e) => setRetentionCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                  className="w-24 px-3 py-2 text-sm border border-[#d0d7de] focus:outline-none focus:border-[#174b2b] font-semibold text-center"
                />
                <span className="text-xs text-[#57606a]">
                  berkas cadangan terbaru tersimpan (berkas terlama akan dipangkas otomatis).
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={savingConfig}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#174b2b] hover:bg-[#123820] active:bg-[#0c2616] transition-colors disabled:opacity-50"
              >
                {savingConfig ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Simpan Pengaturan</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Column 2: Manual Backup Action & Universal Compatibility Assurance */}
        <div className="bg-white border border-[#d0d7de] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#d0d7de]">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#1f2920]">
                  Pencadangan Terpadu Instan
                </h2>
                <p className="text-xs text-[#57606a] mt-0.5">
                  Buat arsip cadangan terpadu (Database SQL + Seluruh Berkas Lampiran Uploads) secara langsung.
                </p>
              </div>
              <span className="px-2 py-0.5 text-xs font-semibold bg-[#ddf4ff] text-[#0969da] border border-[#a5d6ff]">
                ZIP Archive (DB + Uploads)
              </span>
            </div>

            <div className="p-4 bg-[#eef1e8]/50 border border-[#c6cbc0] text-xs text-[#4b574d] space-y-2 mb-4">
              <div className="font-bold text-[#1f2920] flex items-center gap-1.5">
                <svg className="w-4 h-4 text-[#15803d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Jaminan Kompatibilitas Portabel &amp; Keutuhan Berkas (Zero Path Drift):
              </div>
              <ul className="list-disc list-inside space-y-1.5 text-[#57606a]">
                <li>
                  <strong className="text-[#1f2920]">Bundel Terpadu (.zip):</strong> Mengemas <code className="text-[#174b2b] font-semibold">database.sql</code> bersama seluruh folder berkas fisik <code className="text-[#174b2b] font-semibold">uploads/traffic_attachments/</code> (SV, SKKH/SKKHP) dan <code className="text-[#174b2b] font-semibold">uploads/whatsapp_attachments/</code> (bukti chat pengaduan).
                </li>
                <li>
                  <strong className="text-[#1f2920]">Struktur Jalur Presisi (Path Preserved):</strong> Struktur direktori di dalam ZIP persis sama dengan referensi path di PostgreSQL, sehingga saat diekstrak ke server baru, database dapat langsung mengakses semua berkas tanpa perlu mengubah path.
                </li>
                <li>
                  <strong className="text-[#1f2920]">Universal PostgreSQL Format:</strong> Berkas SQL bebas kepemilikan host (<code className="text-[#174b2b] font-semibold">tanpa klausul OWNER TO</code>) dan dapat langsung diimpor ke <em>psql, pgAdmin, DBeaver, mau pun Cloud PostgreSQL</em>.
                </li>
                <li>
                  <strong className="text-[#1f2920]">Integritas &amp; Panduan:</strong> Dilengkapi <code className="text-[#174b2b] font-semibold">manifest.json</code> (hash SHA-256) serta petunjuk pemulihan langkah-demi-langkah (<code className="text-[#174b2b] font-semibold">MIGRATION_GUIDE.txt</code>).
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-4 border-t border-[#d0d7de] flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-[#57606a]">
              Proses cadangan mengompresi SQL dan berkas lampiran secara otomatis.
            </span>
            <button
              type="button"
              onClick={handleManualBackup}
              disabled={backingUp}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#0969da] hover:bg-[#0854ad] active:bg-[#07448c] transition-colors shadow-sm disabled:opacity-50"
            >
              {backingUp ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Mengemas Database &amp; Berkas Lampiran...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  <span>Cadangkan Sekarang (DB + Uploads)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Backup Archive Table */}
      <div className="bg-white border border-[#d0d7de]">
        <div className="p-4 border-b border-[#d0d7de] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#1f2920]">
              Daftar Berkas Cadangan Tersimpan
            </h2>
            <p className="text-xs text-[#57606a] mt-0.5">
              Berkas cadangan (.zip / .sql) disimpan di direktori server dan siap diunduh langsung untuk arsip lokal atau migrasi.
            </p>
          </div>
          <span className="text-xs font-semibold text-[#57606a]">
            Total: {backupFiles.length} Berkas Cadangan
          </span>
        </div>

        {backupFiles.length === 0 ? (
          <div className="p-12 text-center text-[#57606a]">
            <svg className="w-12 h-12 mx-auto text-[#afb8c1] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            <p className="text-sm font-semibold text-[#1f2920]">Belum ada berkas cadangan tersimpan</p>
            <p className="text-xs text-[#57606a] mt-1">
              Klik tombol &quot;Cadangkan Sekarang&quot; di atas untuk membuat berkas cadangan pertama Anda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#f6f8fa] border-b border-[#d0d7de] text-[#57606a] uppercase tracking-wider font-semibold">
                  <th className="py-2.5 px-4">Nama Berkas</th>
                  <th className="py-2.5 px-4">Format</th>
                  <th className="py-2.5 px-4">Tanggal &amp; Waktu</th>
                  <th className="py-2.5 px-4">Ukuran</th>
                  <th className="py-2.5 px-4">Tipe Pemicu</th>
                  <th className="py-2.5 px-4">Hash Integritas (SHA-256)</th>
                  <th className="py-2.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d0d7de]">
                {backupFiles.map((file) => {
                  const isZip = file.filename.toLowerCase().endsWith('.zip');
                  return (
                    <tr key={file.filename} className="hover:bg-[#f6f8fa]/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-[#1f2920]">
                        <div className="flex items-center gap-2">
                          {isZip ? (
                            <svg className="w-4 h-4 text-[#8250df] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-[#0969da] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          )}
                          <span className="truncate max-w-[260px]" title={file.filename}>
                            {file.filename}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isZip ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold bg-[#fbefff] text-[#8250df] border border-[#d8b4fe]">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            ZIP (DB + Uploads)
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold bg-[#f6f8fa] text-[#57606a] border border-[#d0d7de]">
                            SQL DUMP
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[#57606a] whitespace-nowrap">
                        {formatDate(file.createdAt)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#1f2920] whitespace-nowrap">
                        {file.sizeDisplay}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold border ${
                            file.triggerType === 'AUTO'
                              ? 'bg-[#ddf4ff] text-[#0969da] border-[#a5d6ff]'
                              : 'bg-[#dafbe1] text-[#1a7f37] border-[#aceebb]'
                          }`}
                        >
                          {file.triggerType === 'AUTO' ? 'Otomatis' : 'Manual'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-[#57606a] whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span title={file.checksumSha256}>
                            {file.checksumSha256 ? `${file.checksumSha256.substring(0, 12)}...` : '-'}
                          </span>
                          {file.checksumSha256 && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(file.checksumSha256)}
                              className="p-1 text-[#57606a] hover:text-[#1f2920] hover:bg-[#eaeef2] transition-colors"
                              title="Salin Hash SHA-256 lengkap"
                            >
                              {copiedHash === file.checksumSha256 ? (
                                <span className="text-[10px] text-[#1a7f37] font-sans font-semibold">Tersalin!</span>
                              ) : (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleDownload(file.filename)}
                            disabled={downloadingFile === file.filename}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#0969da] bg-white border border-[#0969da]/30 hover:bg-[#ddf4ff] active:bg-[#b6e3ff] transition-colors disabled:opacity-50"
                            title={isZip ? "Unduh paket arsip cadangan terpadu (.zip)" : "Unduh berkas .sql cadangan"}
                          >
                            {downloadingFile === file.filename ? (
                              <>
                                <div className="w-3 h-3 border-2 border-[#0969da] border-t-transparent rounded-full animate-spin" />
                                <span>Mengunduh...</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                <span>Unduh</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => setFileToDelete(file.filename)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-[#cf222e] bg-white border border-[#cf222e]/30 hover:bg-[#ffebe9] active:bg-[#ffcecb] transition-colors"
                            title="Hapus berkas cadangan"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Hapus</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Database Tables Storage Breakdown */}
      {statusData && statusData.tables.length > 0 && (
        <div className="bg-white border border-[#d0d7de]">
          <div className="p-4 border-b border-[#d0d7de] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#1f2920]">
                Rincian Kapasitas Penyimpanan Tabel (Skema silantas)
              </h2>
              <p className="text-xs text-[#57606a] mt-0.5">
                Penggunaan disk fisik per tabel termasuk indeks basis data internal.
              </p>
            </div>
            <span className="text-xs font-semibold text-[#174b2b] bg-[#eef1e8] px-2 py-0.5 border border-[#c6cbc0]">
              PostgreSQL Telemetry
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#f6f8fa] border-b border-[#d0d7de] text-[#57606a] uppercase tracking-wider font-semibold">
                  <th className="py-2.5 px-4">Nama Tabel</th>
                  <th className="py-2.5 px-4">Perkiraan Baris Data</th>
                  <th className="py-2.5 px-4">Ukuran Data Tabel</th>
                  <th className="py-2.5 px-4">Ukuran Indeks</th>
                  <th className="py-2.5 px-4 font-bold text-[#1f2920]">Total Kapasitas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d0d7de]">
                {statusData.tables.map((t) => (
                  <tr key={t.tableName} className="hover:bg-[#f6f8fa]/60 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-medium text-[#1f2920]">
                      silantas.{t.tableName}
                    </td>
                    <td className="py-2.5 px-4 text-[#57606a]">
                      {t.estimatedRows.toLocaleString('id-ID')} baris
                    </td>
                    <td className="py-2.5 px-4 text-[#57606a]">{t.tableSize}</td>
                    <td className="py-2.5 px-4 text-[#57606a]">{t.indexSize}</td>
                    <td className="py-2.5 px-4 font-bold text-[#1f2920]">{t.totalSize}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {fileToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white border border-[#d0d7de] max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-[#cf222e]">
              <div className="p-2 bg-[#ffebe9] rounded-full">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1f2920]">Hapus Berkas Cadangan?</h3>
                <p className="text-xs text-[#57606a]">Tindakan ini permanen dan tidak dapat dibatalkan.</p>
              </div>
            </div>

            <div className="p-3 bg-[#f6f8fa] border border-[#d0d7de] text-xs font-mono text-[#1f2920] break-all">
              {fileToDelete}
            </div>

            <p className="text-xs text-[#57606a]">
              Pastikan Anda telah mengunduh berkas ini jika masih diperlukan untuk arsip eksternal.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFileToDelete(null)}
                disabled={deleting}
                className="px-4 py-2 text-xs font-semibold text-[#1f2920] bg-white border border-[#d0d7de] hover:bg-[#f6f8fa] transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#cf222e] hover:bg-[#a40e26] transition-colors disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <span>Ya, Hapus Berkas</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

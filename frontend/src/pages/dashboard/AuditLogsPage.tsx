import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { fetchAuditLogs, type AuditLogRecord } from '../../services/api';

export const AuditLogsPage: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [action, setAction] = useState<string>('ALL');
  const [entityType, setEntityType] = useState<string>('ALL');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const isAuthorized = user?.role === 'admin' || user?.role === 'pimpinan';

  const loadLogs = async () => {
    if (!isAuthorized) return;
    setLoading(true);
    try {
      const res = await fetchAuditLogs({ search, action, entityType, page });
      setLogs(res.data);
      setTotalPages(res.meta.totalPages || 1);
      setTotalCount(res.meta.total || 0);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [search, action, entityType, page]);

  if (!isAuthorized) {
    return (
      <div className="p-8 text-center bg-white border border-[#d0d7de] rounded-lg">
        <h2 className="text-base font-semibold text-[#cf222e] mb-1">Akses Terbatas</h2>
        <p className="text-sm text-[#57606a]">
          Halaman Log Audit hanya dapat diakses oleh Administrator dan Pimpinan.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="space-y-6"
    >
      <div className="border-b border-[#d0d7de] pb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-[#1f2328] tracking-tight">
          Log Audit Perubahan Sistem (Audit Trail)
        </h1>
        <p className="text-sm text-[#57606a] mt-1">
          Rekaman jejak aktivitas pengguna untuk transparansi dan kepatuhan pengawasan internal lalu lintas hewan.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#f6f8fa] p-3.5 rounded-lg border border-[#d0d7de]">
        <div>
          <label className="block text-xs font-semibold text-[#57606a] mb-1.5 uppercase tracking-wide">Cari Deskripsi / Pengguna</label>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari uraian atau nama pengguna..."
            className="w-full px-3 py-2 text-sm bg-white text-[#1f2328] border border-[#d0d7de] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#57606a] mb-1.5 uppercase tracking-wide">Tipe Aksi</label>
          <select
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 text-sm bg-white text-[#1f2328] border border-[#d0d7de] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
          >
            <option value="ALL">Semua Aksi</option>
            <option value="CREATE">CREATE (Tambah Data)</option>
            <option value="UPDATE">UPDATE (Perubahan Data)</option>
            <option value="DELETE">DELETE (Penghapusan)</option>
            <option value="LOGIN">LOGIN (Masuk Sistem)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#57606a] mb-1.5 uppercase tracking-wide">Entitas Objek</label>
          <select
            value={entityType}
            onChange={(e) => {
              setEntityType(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 text-sm bg-white text-[#1f2328] border border-[#d0d7de] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
          >
            <option value="ALL">Semua Entitas</option>
            <option value="TRAFFIC_RECORD">Data Lalu Lintas Hewan</option>
            <option value="USER">Akun Pengguna</option>
            <option value="SETTINGS">Pengaturan Sistem</option>
            <option value="AUTH">Autentikasi</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table with Responsive Horizontal Scroll */}
      <div className="border border-[#d0d7de] rounded-lg overflow-hidden bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm text-[#1f2328]">
            <thead className="bg-[#f6f8fa] border-b border-[#d0d7de] font-semibold text-[#57606a] text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3.5">Waktu Kegiatan</th>
                <th className="py-3 px-3.5">Pengguna & Peran</th>
                <th className="py-3 px-3.5">Aksi</th>
                <th className="py-3 px-3.5">Entitas</th>
                <th className="py-3 px-3.5">Uraian Aktivitas</th>
                <th className="py-3 px-3.5 text-right">Rincian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d0d7de]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-[#57606a]">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-[#1a7f37] border-t-transparent rounded-full animate-spin"></div>
                      <span>Memuat log audit...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-[#57606a]">
                    Belum ada riwayat aktivitas yang tercatat.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const dateStr = new Date(log.createdAt).toLocaleString('id-ID', {
                    dateStyle: 'medium',
                    timeStyle: 'medium',
                  });
                  const isExpanded = expandedLogId === log.id;

                  return (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-[#f6f8fa]/70 transition-colors">
                        <td className="py-3 px-3.5 font-mono text-xs text-[#57606a] whitespace-nowrap">
                          {dateStr}
                        </td>

                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <span className="font-semibold text-[#1f2328]">{log.username}</span>
                          <span className="ml-2 text-xs uppercase font-mono px-2 py-0.5 rounded-full bg-[#f6f8fa] border border-[#d0d7de] text-[#57606a]">
                            {log.userRole}
                          </span>
                        </td>

                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              log.action === 'CREATE'
                                ? 'bg-[#dafbe1] text-[#1a7f37]'
                                : log.action === 'UPDATE'
                                ? 'bg-[#ddf4ff] text-[#0969da]'
                                : log.action === 'DELETE'
                                ? 'bg-[#ffebe9] text-[#cf222e]'
                                : 'bg-[#f6f8fa] text-[#57606a]'
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>

                        <td className="py-3 px-3.5 font-mono text-xs text-[#57606a] whitespace-nowrap">
                          {log.entityType}
                        </td>

                        <td className="py-3 px-3.5 text-xs sm:text-sm text-[#1f2328]">
                          {log.description}
                        </td>

                        <td className="py-3 px-3.5 text-right whitespace-nowrap">
                          {log.metadata ? (
                            <button
                              type="button"
                              onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                              className="text-xs font-semibold text-[#0969da] hover:underline cursor-pointer"
                            >
                              {isExpanded ? 'Tutup' : 'Lihat Payload'}
                            </button>
                          ) : (
                            <span className="text-xs text-[#8c959f]">-</span>
                          )}
                        </td>
                      </tr>

                      {isExpanded && log.metadata && (
                        <tr className="bg-[#f6f8fa]">
                          <td colSpan={6} className="p-4">
                            <div className="text-xs font-bold text-[#57606a] uppercase tracking-wider mb-1.5">
                              Data Payload / Metadata Perubahan:
                            </div>
                            <pre className="p-3 bg-white border border-[#d0d7de] rounded-md text-xs font-mono overflow-x-auto text-[#1f2328] max-h-60 leading-relaxed">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-3 bg-[#f6f8fa] border-t border-[#d0d7de] flex items-center justify-between text-xs sm:text-sm text-[#57606a]">
          <div>
            Total <span className="font-semibold text-[#1f2328]">{totalCount}</span> jejak audit
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 bg-white border border-[#d0d7de] rounded-md font-medium text-[#1f2328] hover:bg-[#f6f8fa] disabled:opacity-40 transition-colors cursor-pointer"
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
              className="px-3 py-1.5 bg-white border border-[#d0d7de] rounded-md font-medium text-[#1f2328] hover:bg-[#f6f8fa] disabled:opacity-40 transition-colors cursor-pointer"
            >
              Berikutnya
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

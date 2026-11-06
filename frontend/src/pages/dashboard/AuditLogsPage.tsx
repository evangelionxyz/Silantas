import React, { useEffect, useState } from 'react';
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
      <div className="p-8 text-center bg-white border border-[#d0d7de] rounded-md">
        <h2 className="text-base font-semibold text-[#d1242f] mb-1">Akses Terbatas</h2>
        <p className="text-xs text-[#656d76]">
          Halaman Log Audit hanya dapat diakses oleh Administrator dan Pimpinan.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-[#d0d7de] pb-4">
        <h1 className="text-xl font-semibold text-[#1f2328] tracking-tight">
          Log Audit Perubahan Sistem (Audit Trail)
        </h1>
        <p className="text-xs text-[#656d76] mt-0.5">
          Rekaman jejak aktivitas pengguna untuk transparansi dan kepatuhan pengawasan internal lalu lintas hewan.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#f6f8fa] p-3 rounded-md border border-[#d0d7de]">
        <div>
          <label className="block text-[11px] font-semibold text-[#656d76] mb-1">Cari Deskripsi / Pengguna</label>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari uraian atau nama pengguna..."
            className="w-full px-2.5 py-1.5 text-xs bg-white text-[#1f2328] border border-[#d0d7de] rounded-md focus:outline-none focus:ring-1 focus:ring-[#0969da]"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-[#656d76] mb-1">Tipe Aksi</label>
          <select
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
            className="w-full px-2.5 py-1.5 text-xs bg-white text-[#1f2328] border border-[#d0d7de] rounded-md focus:outline-none focus:ring-1 focus:ring-[#0969da]"
          >
            <option value="ALL">Semua Aksi</option>
            <option value="CREATE">CREATE (Tambah Data)</option>
            <option value="UPDATE">UPDATE (Perubahan Data)</option>
            <option value="DELETE">DELETE (Penghapusan)</option>
            <option value="LOGIN">LOGIN (Masuk Sistem)</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-[#656d76] mb-1">Entitas Objek</label>
          <select
            value={entityType}
            onChange={(e) => {
              setEntityType(e.target.value);
              setPage(1);
            }}
            className="w-full px-2.5 py-1.5 text-xs bg-white text-[#1f2328] border border-[#d0d7de] rounded-md focus:outline-none focus:ring-1 focus:ring-[#0969da]"
          >
            <option value="ALL">Semua Entitas</option>
            <option value="TRAFFIC_RECORD">Data Lalu Lintas Hewan</option>
            <option value="USER">Akun Pengguna</option>
            <option value="SETTINGS">Pengaturan Sistem</option>
            <option value="AUTH">Autentikasi</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="border border-[#d0d7de] rounded-md overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#1f2328]">
            <thead className="bg-[#f6f8fa] border-b border-[#d0d7de] font-semibold text-[#1f2328]">
              <tr>
                <th className="py-2.5 px-3">Waktu (WIB / WIT)</th>
                <th className="py-2.5 px-3">Pengguna & Peran</th>
                <th className="py-2.5 px-3">Aksi</th>
                <th className="py-2.5 px-3">Entitas</th>
                <th className="py-2.5 px-3">Uraian Aktivitas</th>
                <th className="py-2.5 px-3 text-right">Rincian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d0d7de]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-[#656d76]">
                    Memuat log audit...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-[#656d76]">
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
                      <tr className="hover:bg-[#f6f8fa]/60 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-[11px] text-[#656d76] whitespace-nowrap">
                          {dateStr}
                        </td>

                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="font-semibold text-[#1f2328]">{log.username}</span>
                          <span className="ml-1.5 text-[10px] uppercase font-mono px-1 py-0.5 rounded bg-[#f6f8fa] border border-[#d0d7de] text-[#656d76]">
                            {log.userRole}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                              log.action === 'CREATE'
                                ? 'bg-[#dafbe1] text-[#1a7f37]'
                                : log.action === 'UPDATE'
                                ? 'bg-[#ddf4ff] text-[#0969da]'
                                : log.action === 'DELETE'
                                ? 'bg-[#ffebe9] text-[#d1242f]'
                                : 'bg-[#f6f8fa] text-[#656d76]'
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 font-mono text-[11px] text-[#656d76] whitespace-nowrap">
                          {log.entityType}
                        </td>

                        <td className="py-2.5 px-3 text-xs text-[#1f2328]">
                          {log.description}
                        </td>

                        <td className="py-2.5 px-3 text-right">
                          {log.metadata ? (
                            <button
                              type="button"
                              onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                              className="text-xs text-[#0969da] hover:underline"
                            >
                              {isExpanded ? 'Tutup' : 'Lihat'}
                            </button>
                          ) : (
                            <span className="text-[#8c959f] text-[11px]">-</span>
                          )}
                        </td>
                      </tr>

                      {isExpanded && log.metadata && (
                        <tr className="bg-[#f6f8fa]">
                          <td colSpan={6} className="p-3 pl-8">
                            <div className="text-[11px] font-mono bg-white p-3 border border-[#d0d7de] rounded overflow-x-auto text-[#1f2328]">
                              <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
                            </div>
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

        <div className="px-4 py-3 bg-[#f6f8fa] border-t border-[#d0d7de] flex items-center justify-between text-xs text-[#656d76]">
          <div>Total {totalCount} log tercatat</div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 bg-white border border-[#d0d7de] rounded hover:bg-[#f6f8fa] disabled:opacity-40"
            >
              Sebelumnya
            </button>
            <span>Halaman {page} dari {totalPages}</span>
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
    </div>
  );
};

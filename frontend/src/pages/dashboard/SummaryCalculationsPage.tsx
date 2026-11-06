import React, { useEffect, useState } from 'react';
import { fetchTrafficSummary, type TrafficSummaryItem, type TrafficSummaryResponse } from '../../services/api';

export const SummaryCalculationsPage: React.FC = () => {
  const [summary, setSummary] = useState<TrafficSummaryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const data = await fetchTrafficSummary();
      setSummary(data);
    } catch {
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems: TrafficSummaryItem[] = (summary?.items || []).filter((item) => {
    const matchesSearch = item.itemName.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const exportCSV = () => {
    if (!filteredItems.length) return;
    const headers = [
      'Nama Komoditas',
      'Kategori',
      'Satuan',
      'Total Masuk (Import)',
      'Total Keluar (Export)',
      'Total Volume (Import + Export)',
      'Kuantitas Penyimpanan (Import - Export)',
      'Jumlah Catatan',
    ];
    const rows = filteredItems.map((i) => [
      `"${i.itemName}"`,
      `"${i.category}"`,
      `"${i.unit}"`,
      i.totalImport,
      i.totalExport,
      i.totalVolume,
      i.currentStorage ?? (i.totalImport - i.totalExport),
      i.recordCount,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `rekapitulasi_lalu_lintas_mimika_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const netStorageTotal = summary?.overall.totalStorageQty ?? ((summary?.overall.totalImportQty ?? 0) - (summary?.overall.totalExportQty ?? 0));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#d0d7de] pb-4">
        <div>
          <h1 className="text-xl font-semibold text-[#1f2328] tracking-tight">
            Kalkulasi & Rekapitulasi Otomatis Lalu Lintas
          </h1>
          <p className="text-xs text-[#656d76] mt-0.5">
            Akumulasi kuantitas otomatis: <span className="font-mono text-[#1a7f37]">Total Volume = Masuk + Keluar</span> dan <span className="font-mono text-[#0969da]">Kuantitas Penyimpanan = Import - Export</span> dikelompokkan per komoditas dan satuan kustom.
          </p>
        </div>

        <button
          type="button"
          onClick={exportCSV}
          disabled={!filteredItems.length}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1f2328] bg-[#f6f8fa] hover:bg-[#eaeef2] border border-[#d0d7de] rounded-md transition-colors disabled:opacity-40 self-start sm:self-auto"
        >
          <svg className="w-3.5 h-3.5 text-[#656d76]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Ekspor CSV</span>
        </button>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-md border border-[#d0d7de] bg-white">
          <div className="text-[11px] font-semibold text-[#656d76] uppercase tracking-wide">
            Total Dokumen Lintas
          </div>
          <div className="text-xl font-bold text-[#1f2328] mt-1">
            {summary?.overall.totalRecords ?? 0}
          </div>
          <div className="text-[10px] text-[#656d76] mt-0.5">Surat / SKKH Tercatat</div>
        </div>

        <div className="p-3.5 rounded-md border border-[#d0d7de] bg-white">
          <div className="text-[11px] font-semibold text-[#1a7f37] uppercase tracking-wide">
            Total Volume Masuk
          </div>
          <div className="text-xl font-bold text-[#1a7f37] mt-1">
            {(summary?.overall.totalImportQty ?? 0).toLocaleString('id-ID')}
          </div>
          <div className="text-[10px] text-[#656d76] mt-0.5">Akumulasi Masuk (Import)</div>
        </div>

        <div className="p-3.5 rounded-md border border-[#d0d7de] bg-white">
          <div className="text-[11px] font-semibold text-[#0969da] uppercase tracking-wide">
            Total Volume Keluar
          </div>
          <div className="text-xl font-bold text-[#0969da] mt-1">
            {(summary?.overall.totalExportQty ?? 0).toLocaleString('id-ID')}
          </div>
          <div className="text-[10px] text-[#656d76] mt-0.5">Akumulasi Keluar (Export)</div>
        </div>

        <div className="p-3.5 rounded-md border border-[#dafbe1] bg-[#dafbe1]/20">
          <div className="text-[11px] font-semibold text-[#1a7f37] uppercase tracking-wide">
            Total Volume Lintas
          </div>
          <div className="text-xl font-bold text-[#1a7f37] mt-1">
            {(summary?.overall.totalCombinedQty ?? 0).toLocaleString('id-ID')}
          </div>
          <div className="text-[10px] text-[#1a7f37]/80 mt-0.5">Total Volume (Masuk + Keluar)</div>
        </div>

        <div className="p-3.5 rounded-md border border-[#ddf4ff] bg-[#ddf4ff]/20 col-span-1 sm:col-span-1">
          <div className="text-[11px] font-semibold text-[#0969da] uppercase tracking-wide">
            Kuantitas Penyimpanan
          </div>
          <div className={`text-xl font-bold mt-1 ${netStorageTotal < 0 ? 'text-[#cf222e]' : 'text-[#0969da]'}`}>
            {netStorageTotal.toLocaleString('id-ID')}
          </div>
          <div className="text-[10px] text-[#0969da]/80 mt-0.5">Sisa Stok (Import - Export)</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-[#f6f8fa] p-3 rounded-md border border-[#d0d7de]">
        <div className="flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama komoditas..."
            className="w-full px-2.5 py-1.5 text-xs bg-white text-[#1f2328] border border-[#d0d7de] rounded-md focus:outline-none focus:ring-1 focus:ring-[#0969da]"
          />
        </div>
        <div className="w-full sm:w-64">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-white text-[#1f2328] border border-[#d0d7de] rounded-md focus:outline-none focus:ring-1 focus:ring-[#0969da]"
          >
            <option value="ALL">Semua Kategori</option>
            <option value="HEWAN_HIDUP">Hewan Hidup</option>
            <option value="PRODUK_HEWAN">Produk Hewan Segar/Beku</option>
            <option value="OLAHAN_PRODUK_HEWAN">Produk Olahan Peternakan</option>
          </select>
        </div>
      </div>

      {/* Grouped Commodities Calculation Table */}
      <div className="border border-[#d0d7de] rounded-md overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#1f2328]">
            <thead className="bg-[#f6f8fa] border-b border-[#d0d7de] font-semibold text-[#1f2328]">
              <tr>
                <th className="py-2.5 px-3">Nama Komoditas</th>
                <th className="py-2.5 px-3">Kategori</th>
                <th className="py-2.5 px-3">Satuan Kustom</th>
                <th className="py-2.5 px-3 text-right">Volume Masuk (Import)</th>
                <th className="py-2.5 px-3 text-right">Volume Keluar (Export)</th>
                <th className="py-2.5 px-3 text-right bg-[#dafbe1]/40 text-[#1a7f37]">
                  Total Volume (Masuk + Keluar)
                </th>
                <th className="py-2.5 px-3 text-right bg-[#ddf4ff]/50 text-[#0969da]">
                  Kuantitas Penyimpanan (Import - Export)
                </th>
                <th className="py-2.5 px-3 text-center">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d0d7de]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-[#656d76]">
                    Menghitung rekapitulasi data...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-[#656d76]">
                    Tidak ada data rekapitulasi untuk filter yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => {
                  const storageQty = item.currentStorage ?? (item.totalImport - item.totalExport);
                  return (
                    <tr key={idx} className="hover:bg-[#f6f8fa]/60 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-[#1f2328]">
                        {item.itemName}
                      </td>

                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-[#f6f8fa] text-[#656d76] border border-[#d0d7de]">
                          {item.category === 'HEWAN_HIDUP'
                            ? 'Hewan Hidup'
                            : item.category === 'PRODUK_HEWAN'
                            ? 'Produk Hewan'
                            : 'Produk Olahan'}
                        </span>
                      </td>

                      <td className="py-2.5 px-3">
                        <span className="font-mono text-[11px] font-semibold text-[#1f2328] px-1.5 py-0.5 rounded bg-[#f6f8fa] border border-[#d0d7de]">
                          {item.unit}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-right font-medium text-[#1a7f37]">
                        {item.totalImport.toLocaleString('id-ID')} {item.unit}
                      </td>

                      <td className="py-2.5 px-3 text-right font-medium text-[#0969da]">
                        {item.totalExport.toLocaleString('id-ID')} {item.unit}
                      </td>

                      <td className="py-2.5 px-3 text-right font-bold text-xs bg-[#dafbe1]/30 text-[#1a7f37]">
                        {item.totalVolume.toLocaleString('id-ID')} {item.unit}
                      </td>

                      <td className={`py-2.5 px-3 text-right font-bold text-xs bg-[#ddf4ff]/30 ${storageQty < 0 ? 'text-[#cf222e]' : 'text-[#0969da]'}`}>
                        {storageQty.toLocaleString('id-ID')} {item.unit}
                      </td>

                      <td className="py-2.5 px-3 text-center text-[11px] text-[#656d76]">
                        {item.recordCount} transaksi
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
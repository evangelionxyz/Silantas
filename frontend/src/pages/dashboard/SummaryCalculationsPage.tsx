import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';
import {
  fetchTrafficSummary,
  type TrafficRouteSummaryItem,
  type TrafficSummaryItem,
  type TrafficSummaryResponse,
} from '../../services/api';

type ChartTab = 'volume' | 'transport' | 'compliance';
type RouteTab = 'ALL' | 'IMPORT' | 'EXPORT';

export const SummaryCalculationsPage: React.FC = () => {
  const [summary, setSummary] = useState<TrafficSummaryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Interactive Chart & Route State
  const [activeChartTab, setActiveChartTab] = useState<ChartTab>('volume');
  const [routeTypeFilter, setRouteTypeFilter] = useState<RouteTab>('ALL');
  const [routeSearch, setRouteSearch] = useState<string>('');
  const [exporting, setExporting] = useState<boolean>(false);

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

  const routesList: TrafficRouteSummaryItem[] = summary?.routes || [];

  const filteredRoutes = routesList.filter((r) => {
    const matchesType = routeTypeFilter === 'ALL' || r.trafficType === routeTypeFilter;
    const term = routeSearch.toLowerCase().trim();
    const matchesSearch =
      !term ||
      r.origin.toLowerCase().includes(term) ||
      r.destination.toLowerCase().includes(term) ||
      r.itemName.toLowerCase().includes(term) ||
      r.transportType.toLowerCase().includes(term);
    return matchesType && matchesSearch;
  });

  // Multi-Sheet Excel Export (.xlsx)
  const exportExcel = () => {
    if (!summary) return;
    setExporting(true);

    try {
      const wb = XLSX.utils.book_new();
      const dateStr = new Date().toISOString().split('T')[0];

      // Sheet 1: Rekapitulasi Komoditas
      const commodityHeaders = [
        'Nama Komoditas',
        'Kategori',
        'Satuan',
        'Volume Masuk (Import)',
        'Volume Keluar (Export)',
        'Total Volume (Masuk + Keluar)',
        'Kuantitas Penyimpanan (Stok)',
        'Jumlah Catatan / Surat',
      ];
      const commodityData = (summary.items || []).map((i) => [
        i.itemName,
        i.category === 'HEWAN_HIDUP'
          ? 'Hewan Hidup'
          : i.category === 'PRODUK_HEWAN'
          ? 'Produk Hewan'
          : 'Produk Olahan',
        i.unit,
        i.totalImport,
        i.totalExport,
        i.totalVolume,
        i.currentStorage ?? i.totalImport - i.totalExport,
        i.recordCount,
      ]);
      const wsCommodities = XLSX.utils.aoa_to_sheet([commodityHeaders, ...commodityData]);
      wsCommodities['!cols'] = [
        { wch: 30 },
        { wch: 18 },
        { wch: 12 },
        { wch: 22 },
        { wch: 22 },
        { wch: 26 },
        { wch: 26 },
        { wch: 20 },
      ];
      XLSX.utils.book_append_sheet(wb, wsCommodities, 'Rekap_Komoditas');

      // Sheet 2: Rute Asal & Tujuan
      const routeHeaders = [
        'Arah Lalu Lintas',
        'Daerah Asal',
        'Daerah Tujuan',
        'Nama Komoditas',
        'Kategori',
        'Moda Transportasi',
        'Total Kuantitas',
        'Satuan',
        'Jumlah Catatan / Surat',
      ];
      const routeData = routesList.map((r) => [
        r.trafficType === 'IMPORT' ? 'PEMASUKAN (MASUK)' : 'PENGELUARAN (KELUAR)',
        r.origin,
        r.destination,
        r.itemName,
        r.category === 'HEWAN_HIDUP'
          ? 'Hewan Hidup'
          : r.category === 'PRODUK_HEWAN'
          ? 'Produk Hewan'
          : 'Produk Olahan',
        r.transportType,
        r.totalQuantity,
        r.unit,
        r.recordCount,
      ]);
      const wsRoutes = XLSX.utils.aoa_to_sheet([routeHeaders, ...routeData]);
      wsRoutes['!cols'] = [
        { wch: 22 },
        { wch: 32 },
        { wch: 32 },
        { wch: 28 },
        { wch: 18 },
        { wch: 18 },
        { wch: 16 },
        { wch: 10 },
        { wch: 20 },
      ];
      XLSX.utils.book_append_sheet(wb, wsRoutes, 'Rute_Asal_Tujuan');

      // Sheet 3: Ringkasan KPI Sistem
      const kpiRows = [
        ['Parameter Pengawasan', 'Nilai / Jumlah', 'Keterangan'],
        [
          'Total Dokumen Lulus Inspeksi',
          summary.overall.totalRecords,
          'Dokumen SKKH dengan status INSPECTED_PASS',
        ],
        [
          'Total Kuantitas Pemasukan (Masuk)',
          summary.overall.totalImportQty,
          'Total volume hewan/produk masuk ke Kab. Mimika',
        ],
        [
          'Total Kuantitas Pengeluaran (Keluar)',
          summary.overall.totalExportQty,
          'Total volume hewan/produk keluar dari Kab. Mimika',
        ],
        [
          'Total Volume Terpadu',
          summary.overall.totalCombinedQty,
          'Akumulasi Pemasukan + Pengeluaran',
        ],
        [
          'Estimasi Stok Tersimpan',
          summary.overall.totalStorageQty ?? summary.overall.totalImportQty - summary.overall.totalExportQty,
          'Selisih Pemasukan dikurangi Pengeluaran',
        ],
        [
          'Dokumen Menunggu Pemeriksaan',
          summary.overall.pendingRecords ?? 0,
          'Dokumen dengan status PENDING',
        ],
        [
          'Dokumen Ditolak Karantina',
          summary.overall.rejectedRecords ?? 0,
          'Dokumen dengan status INSPECTED_REJECT',
        ],
        ['Instansi Pelaksana', 'Dinas Peternakan dan Kesehatan Hewan', 'Pemerintah Kabupaten Mimika'],
        ['Tanggal Penarikan Data', dateStr, 'Diunduh dari SI-LANTAS SUANGGI'],
      ];
      const wsKPI = XLSX.utils.aoa_to_sheet(kpiRows);
      wsKPI['!cols'] = [{ wch: 34 }, { wch: 20 }, { wch: 42 }];
      XLSX.utils.book_append_sheet(wb, wsKPI, 'Ringkasan_KPI_Sistem');

      XLSX.writeFile(wb, `rekapitulasi_lalu_lintas_mimika_${dateStr}.xlsx`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal mengekspor file Excel');
    } finally {
      setExporting(false);
    }
  };

  const netStorageTotal =
    summary?.overall.totalStorageQty ??
    (summary?.overall.totalImportQty ?? 0) - (summary?.overall.totalExportQty ?? 0);

  // Analytics Helpers
  const totalVolumeAll = summary?.overall.totalCombinedQty || 1;
  const importPercent = Math.min(
    100,
    Math.round(((summary?.overall.totalImportQty || 0) / totalVolumeAll) * 100)
  );
  const exportPercent = Math.min(
    100,
    Math.round(((summary?.overall.totalExportQty || 0) / totalVolumeAll) * 100)
  );

  // Group Volume by Transport Mode from routes
  const transportSummary = routesList.reduce<Record<string, { qty: number; count: number }>>(
    (acc, r) => {
      const mode = r.transportType || 'LAUT';
      if (!acc[mode]) acc[mode] = { qty: 0, count: 0 };
      acc[mode].qty += r.totalQuantity;
      acc[mode].count += r.recordCount;
      return acc;
    },
    {}
  );
  const totalTransportQty = Object.values(transportSummary).reduce((a, b) => a + b.qty, 0) || 1;

  // Group Volume by Commodity Category from summary items
  const categorySummary = (summary?.items || []).reduce<
    Record<string, { volume: number; count: number; items: number }>
  >((acc, item) => {
    if (!acc[item.category]) acc[item.category] = { volume: 0, count: 0, items: 0 };
    acc[item.category].volume += item.totalVolume;
    acc[item.category].count += item.recordCount;
    acc[item.category].items += 1;
    return acc;
  }, {});

  // Top Commodities by Volume (up to 6)
  const topCommodities = [...(summary?.items || [])]
    .sort((a, b) => b.totalVolume - a.totalVolume)
    .slice(0, 6);

  const maxTopCommodityVolume = Math.max(...topCommodities.map((c) => c.totalVolume), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="space-y-6"
    >
      {/* Header & Export Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#d0d7de] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1f2328] tracking-tight">
            Monitoring: Statistik &amp; Laporan Lalu Lintas (SUANGGI)
          </h1>
          <p className="text-sm text-[#57606a] mt-1">
            Data Terpadu - Akurat - Terkini (Khusus Status Inspeksi:{' '}
            <span className="font-semibold text-[#1a7f37]">Lulus</span>):{' '}
            <span className="font-mono font-semibold text-[#1a7f37]">Total Volume = Pemasukan + Pengeluaran</span>{' '}
            dan{' '}
            <span className="font-mono font-semibold text-[#0969da]">Kuantitas Penyimpanan = Pemasukan - Pengeluaran</span>.
          </p>
        </div>

        <button
          type="button"
          onClick={exportExcel}
          disabled={loading || !summary?.items?.length || exporting}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-[#1f2328] bg-white hover:bg-[#f6f8fa] border border-[#d0d7de] transition-colors shadow-2xs disabled:opacity-40 self-start sm:self-auto shrink-0 cursor-pointer"
          title="Unduh seluruh rekapitulasi data komoditas, rute, dan KPI dalam file Excel multi-sheet"
        >
          <svg className="w-4 h-4 text-[#1a7f37]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>{exporting ? 'Mengekspor Excel...' : 'Ekspor Laporan (.xlsx)'}</span>
        </button>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 border border-[#d0d7de] bg-white shadow-2xs">
          <div className="text-xs font-semibold text-[#57606a] uppercase tracking-wider">
            Pemuktahiran Data
          </div>
          <div className="text-2xl font-bold text-[#1f2328] mt-1.5">
            {summary?.overall.totalRecords ?? 0}
          </div>
          <div className="text-xs text-[#57606a] mt-1">Dokumen / SKKH Lulus Inspeksi</div>
        </div>

        <div className="p-4 border border-[#d0d7de] bg-white shadow-2xs">
          <div className="text-xs font-semibold text-[#1a7f37] uppercase tracking-wider">
            Pemasukan (Masuk)
          </div>
          <div className="text-2xl font-bold text-[#1a7f37] mt-1.5">
            {(summary?.overall.totalImportQty ?? 0).toLocaleString('id-ID')}
          </div>
          <div className="text-xs text-[#57606a] mt-1">Kuantitas Masuk (Lulus Inspeksi)</div>
        </div>

        <div className="p-4 border border-[#d0d7de] bg-white shadow-2xs">
          <div className="text-xs font-semibold text-[#0969da] uppercase tracking-wider">
            Pengeluaran (Keluar)
          </div>
          <div className="text-2xl font-bold text-[#0969da] mt-1.5">
            {(summary?.overall.totalExportQty ?? 0).toLocaleString('id-ID')}
          </div>
          <div className="text-xs text-[#57606a] mt-1">Kuantitas Keluar (Lulus Inspeksi)</div>
        </div>

        <div className="p-4 border border-[#dafbe1] bg-[#dafbe1]/30 shadow-2xs">
          <div className="text-xs font-semibold text-[#1a7f37] uppercase tracking-wider">
            Monitoring Volume
          </div>
          <div className="text-2xl font-bold text-[#1a7f37] mt-1.5">
            {(summary?.overall.totalCombinedQty ?? 0).toLocaleString('id-ID')}
          </div>
          <div className="text-xs text-[#1a7f37] font-medium mt-1">Total (Pemasukan + Pengeluaran)</div>
        </div>

        <div className="p-4 border border-[#ddf4ff] bg-[#ddf4ff]/30 shadow-2xs">
          <div className="text-xs font-semibold text-[#0969da] uppercase tracking-wider">
            Kuantitas Penyimpanan
          </div>
          <div className={`text-2xl font-bold mt-1.5 ${netStorageTotal < 0 ? 'text-[#cf222e]' : 'text-[#0969da]'}`}>
            {netStorageTotal.toLocaleString('id-ID')}
          </div>
          <div className="text-xs text-[#0969da] font-medium mt-1">Stok (Pemasukan - Pengeluaran)</div>
        </div>
      </div>

      {/* Visual Charts & Statistical Diagnostics Section */}
      <div className="border border-[#d0d7de] bg-white shadow-2xs overflow-hidden">
        <div className="p-4 bg-[#f6f8fa] border-b border-[#d0d7de] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-[#1f2328] uppercase tracking-wide">
              Grafik &amp; Analisis Visual Lalu Lintas Komoditas
            </h2>
            <p className="text-xs text-[#57606a] mt-0.5">
              Visualisasi proporsi volume, rute pengiriman, perbandingan masuk vs keluar, dan kepatuhan karantina.
            </p>
          </div>

          <div className="inline-flex p-0.5 bg-white border border-[#d0d7de]">
            <button
              type="button"
              onClick={() => setActiveChartTab('volume')}
              className={`px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                activeChartTab === 'volume'
                  ? 'bg-[#173d22] text-white'
                  : 'text-[#57606a] hover:text-[#1f2328]'
              }`}
            >
              Komoditas &amp; Volume
            </button>
            <button
              type="button"
              onClick={() => setActiveChartTab('transport')}
              className={`px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                activeChartTab === 'transport'
                  ? 'bg-[#173d22] text-white'
                  : 'text-[#57606a] hover:text-[#1f2328]'
              }`}
            >
              Kategori &amp; Jalur
            </button>
            <button
              type="button"
              onClick={() => setActiveChartTab('compliance')}
              className={`px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                activeChartTab === 'compliance'
                  ? 'bg-[#173d22] text-white'
                  : 'text-[#57606a] hover:text-[#1f2328]'
              }`}
            >
              Kepatuhan Inspeksi
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          {/* TAB 1: Volume & Perbandingan Masuk vs Keluar */}
          {activeChartTab === 'volume' && (
            <div className="space-y-6">
              {/* Macro Volume Share Bar */}
              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-[#57606a] mb-1.5">
                  <span className="flex items-center gap-1.5 text-[#1a7f37]">
                    <span className="w-2.5 h-2.5 bg-[#1a7f37] inline-block"></span>
                    Pemasukan: {(summary?.overall.totalImportQty || 0).toLocaleString('id-ID')} ({importPercent}%)
                  </span>
                  <span className="flex items-center gap-1.5 text-[#0969da]">
                    Pengeluaran: {(summary?.overall.totalExportQty || 0).toLocaleString('id-ID')} ({exportPercent}%)
                    <span className="w-2.5 h-2.5 bg-[#0969da] inline-block"></span>
                  </span>
                </div>
                <div className="w-full h-4 bg-[#ddf4ff] overflow-hidden flex">
                  <div
                    style={{ width: `${importPercent}%` }}
                    className="bg-[#1a7f37] h-full transition-all duration-500"
                    title={`Pemasukan: ${importPercent}%`}
                  />
                  <div
                    style={{ width: `${exportPercent}%` }}
                    className="bg-[#0969da] h-full transition-all duration-500"
                    title={`Pengeluaran: ${exportPercent}%`}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-[#57606a] mt-1">
                  <span>Rasio Arus Barang: Masuk {importPercent}% vs Keluar {exportPercent}%</span>
                  <span>Total Terakumulasi: {(summary?.overall.totalCombinedQty || 0).toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Top Commodities Horizontal Bar Chart */}
              <div className="pt-2">
                <div className="text-xs font-bold text-[#1f2328] uppercase tracking-wider mb-3">
                  Komoditas Terbesar Berdasarkan Volume (Top Commodities)
                </div>
                <div className="space-y-3.5">
                  {topCommodities.map((c, idx) => {
                    const importRatio = Math.round((c.totalImport / maxTopCommodityVolume) * 100);
                    const exportRatio = Math.round((c.totalExport / maxTopCommodityVolume) * 100);

                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                          <span className="font-semibold text-[#1f2328] flex items-center gap-2">
                            <span className="w-5 text-center font-mono text-[11px] text-[#57606a]">
                              #{idx + 1}
                            </span>
                            {c.itemName}
                            <span className="text-[11px] font-normal text-[#57606a] px-1.5 py-0.2 bg-[#f6f8fa] border border-[#d0d7de]">
                              {c.unit}
                            </span>
                          </span>
                          <span className="text-[11px] text-[#57606a]">
                            Total: <strong className="text-[#1f2328]">{c.totalVolume.toLocaleString('id-ID')} {c.unit}</strong>{' '}
                            (Masuk: {c.totalImport.toLocaleString('id-ID')} | Keluar: {c.totalExport.toLocaleString('id-ID')})
                          </span>
                        </div>

                        {/* Comparative Dual Bar */}
                        <div className="grid grid-cols-2 gap-1.5 h-3 bg-[#f6f8fa] p-0.5 border border-[#d0d7de]">
                          <div className="w-full flex justify-end">
                            <div
                              style={{ width: `${importRatio}%` }}
                              className="bg-[#1a7f37] h-full"
                              title={`Masuk: ${c.totalImport.toLocaleString('id-ID')} ${c.unit}`}
                            />
                          </div>
                          <div className="w-full flex justify-start">
                            <div
                              style={{ width: `${exportRatio}%` }}
                              className="bg-[#0969da] h-full"
                              title={`Keluar: ${c.totalExport.toLocaleString('id-ID')} ${c.unit}`}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Kategori & Jalur Transportasi */}
          {activeChartTab === 'transport' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Transport Mode Distribution */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-[#1f2328] uppercase tracking-wider">
                  Distribusi Moda Angkutan (Jalur Transportasi)
                </div>
                <div className="space-y-2.5">
                  {(['LAUT', 'UDARA', 'DARAT'] as const).map((mode) => {
                    const data = transportSummary[mode] || { qty: 0, count: 0 };
                    const share = Math.round((data.qty / totalTransportQty) * 100);

                    return (
                      <div key={mode} className="p-3 bg-[#f6f8fa] border border-[#d0d7de] space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-[#1f2328]">
                            Jalur {mode === 'LAUT' ? 'Laut (Pelabuhan Pomako)' : mode === 'UDARA' ? 'Udara (Bandara Mozes Kilangin)' : 'Darat (Antar Distrik)'}
                          </span>
                          <span className="font-mono font-bold text-[#1f2328]">{share}%</span>
                        </div>
                        <div className="w-full h-2 bg-white border border-[#d0d7de]">
                          <div
                            style={{ width: `${share}%` }}
                            className={`h-full ${
                              mode === 'LAUT' ? 'bg-[#0969da]' : mode === 'UDARA' ? 'bg-[#8250df]' : 'bg-[#bf8700]'
                            }`}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] text-[#57606a]">
                          <span>{data.count} dokumen pengawasan</span>
                          <span>{data.qty.toLocaleString('id-ID')} total muatan</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Commodity Category Breakdown */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-[#1f2328] uppercase tracking-wider">
                  Distribusi Kategori Komoditas
                </div>
                <div className="space-y-2.5">
                  {[
                    { key: 'HEWAN_HIDUP', label: 'Hewan Hidup (Sapi, Kambing, Babi, dll)', color: 'bg-[#15803d]' },
                    { key: 'PRODUK_HEWAN', label: 'Produk Hewan (Daging Segar/Beku, Telur, dll)', color: 'bg-[#0969da]' },
                    { key: 'OLAHAN_PRODUK_HEWAN', label: 'Produk Olahan Peternakan (Sosis, Bakso, Kornet)', color: 'bg-[#bf8700]' },
                  ].map((cat) => {
                    const data = categorySummary[cat.key] || { volume: 0, count: 0, items: 0 };
                    return (
                      <div key={cat.key} className="p-3 bg-[#f6f8fa] border border-[#d0d7de] space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold text-[#1f2328]">
                          <span className="flex items-center gap-1.5">
                            <span className={`w-2.5 h-2.5 ${cat.color} inline-block`}></span>
                            {cat.label}
                          </span>
                          <span className="font-mono">{data.items} jenis</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-[#57606a] pt-1 border-t border-[#d0d7de]/50">
                          <span>Total Volume: <strong className="text-[#1f2328]">{data.volume.toLocaleString('id-ID')}</strong></span>
                          <span>Frekuensi: {data.count} surat</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Kepatuhan & Status Kesehatan */}
          {activeChartTab === 'compliance' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border border-[#4ac26b]/50 bg-[#dafbe1]/20">
                <div className="text-xs font-semibold text-[#1a7f37] uppercase tracking-wider">
                  Inspeksi Lulus (PASS)
                </div>
                <div className="text-3xl font-extrabold text-[#1a7f37] mt-2">
                  {summary?.overall.totalRecords ?? 0}
                </div>
                <div className="text-xs text-[#57606a] mt-1.5">
                  Telah melalui verifikasi klinis dokter hewan berwenang dan masuk dalam rekapitulasi data aktif.
                </div>
              </div>

              <div className="p-4 border border-[#d4a72c]/50 bg-[#fff8c5]/30">
                <div className="text-xs font-semibold text-[#9a6700] uppercase tracking-wider">
                  Menunggu Verifikasi (PENDING)
                </div>
                <div className="text-3xl font-extrabold text-[#9a6700] mt-2">
                  {summary?.overall.pendingRecords ?? 0}
                </div>
                <div className="text-xs text-[#57606a] mt-1.5">
                  Sedang dalam proses uji sampel laboratorium atau karantina pos Pomako / Bandara Mozes Kilangin.
                </div>
              </div>

              <div className="p-4 border border-[#ff8182]/50 bg-[#ffebe9]/30">
                <div className="text-xs font-semibold text-[#cf222e] uppercase tracking-wider">
                  Ditolak / Karantina (REJECT)
                </div>
                <div className="text-3xl font-extrabold text-[#cf222e] mt-2">
                  {summary?.overall.rejectedRecords ?? 0}
                </div>
                <div className="text-xs text-[#57606a] mt-1.5">
                  Tidak memenuhi persyaratan kesehatan hewan / dokumen karantina dan tidak dihitung dalam kuantitas masuk.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Origin & Destination Route Analytics Section */}
      <div className="border border-[#d0d7de] bg-white shadow-2xs overflow-hidden">
        <div className="p-4 bg-[#f6f8fa] border-b border-[#d0d7de]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-[#1f2328] uppercase tracking-wide">
                Pemetaan Rute Asal &amp; Tujuan (Export &amp; Import Corridors)
              </h2>
              <p className="text-xs text-[#57606a] mt-0.5">
                Monitoring komprehensif daerah asal pasokan komoditas masuk ke Mimika serta daerah tujuan distribusi keluar.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setRouteTypeFilter('ALL')}
                className={`px-3 py-1.5 text-xs font-semibold border transition-colors cursor-pointer ${
                  routeTypeFilter === 'ALL'
                    ? 'bg-[#1f2328] text-white border-[#1f2328]'
                    : 'bg-white text-[#57606a] border-[#d0d7de] hover:bg-[#f6f8fa]'
                }`}
              >
                Semua Rute ({routesList.length})
              </button>
              <button
                type="button"
                onClick={() => setRouteTypeFilter('IMPORT')}
                className={`px-3 py-1.5 text-xs font-semibold border transition-colors cursor-pointer ${
                  routeTypeFilter === 'IMPORT'
                    ? 'bg-[#15803d] text-white border-[#15803d]'
                    : 'bg-white text-[#15803d] border-[#86efac] hover:bg-[#f0fdf4]'
                }`}
              >
                Pemasukan (Asal Luar &rarr; Mimika)
              </button>
              <button
                type="button"
                onClick={() => setRouteTypeFilter('EXPORT')}
                className={`px-3 py-1.5 text-xs font-semibold border transition-colors cursor-pointer ${
                  routeTypeFilter === 'EXPORT'
                    ? 'bg-[#0969da] text-white border-[#0969da]'
                    : 'bg-white text-[#0969da] border-[#54aeff]/60 hover:bg-[#ddf4ff]/40'
                }`}
              >
                Pengeluaran (Mimika &rarr; Tujuan Luar)
              </button>
            </div>
          </div>

          <div className="mt-3">
            <input
              type="text"
              value={routeSearch}
              onChange={(e) => setRouteSearch(e.target.value)}
              placeholder="Cari rute, kota asal, kota tujuan, atau komoditas..."
              className="w-full px-3 py-2 text-sm bg-white text-[#1f2328] border border-[#d0d7de] focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm text-[#1f2328]">
            <thead className="bg-[#f6f8fa] border-b border-[#d0d7de] font-semibold text-[#57606a] text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3.5">Arah</th>
                <th className="py-3 px-3.5">Koridor Rute (Asal &rarr; Tujuan)</th>
                <th className="py-3 px-3.5">Komoditas &amp; Kategori</th>
                <th className="py-3 px-3.5">Moda Angkutan</th>
                <th className="py-3 px-3.5 text-right">Total Kuantitas</th>
                <th className="py-3 px-3.5 text-center">Frekuensi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d0d7de]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-[#57606a]">
                    Memuat data rute pengawasan...
                  </td>
                </tr>
              ) : filteredRoutes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-[#57606a]">
                    Belum ada data koridor rute yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredRoutes.map((r, idx) => {
                  const isImport = r.trafficType === 'IMPORT';
                  return (
                    <tr key={idx} className="hover:bg-[#f6f8fa]/70 transition-colors">
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold ${
                            isImport
                              ? 'bg-[#dafbe1] text-[#1a7f37] border border-[#4ac26b]/40'
                              : 'bg-[#ddf4ff] text-[#0969da] border border-[#54aeff]/40'
                          }`}
                        >
                          {isImport ? 'MASUK' : 'KELUAR'}
                        </span>
                      </td>

                      <td className="py-3 px-3.5">
                        <div className="font-semibold text-[#1f2328]">
                          {r.origin} <span className="text-[#57606a] font-normal">&rarr;</span> {r.destination}
                        </div>
                        <div className="text-[11px] text-[#57606a]">
                          {isImport ? 'Pasokan Masuk ke Mimika' : 'Distribusi Keluar Mimika'}
                        </div>
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

                      <td className="py-3 px-3.5 text-xs">
                        <span className="font-semibold text-[#1f2328]">Jalur {r.transportType}</span>
                        <div className="text-[11px] text-[#57606a]">
                          {r.transportType === 'LAUT'
                            ? 'Pelabuhan Pomako'
                            : r.transportType === 'UDARA'
                            ? 'Bandara Mozes Kilangin'
                            : 'Antar Distrik'}
                        </div>
                      </td>

                      <td className="py-3 px-3.5 text-right font-bold text-[#1f2328] whitespace-nowrap">
                        {r.totalQuantity.toLocaleString('id-ID')} <span className="text-xs font-normal text-[#57606a]">{r.unit}</span>
                      </td>

                      <td className="py-3 px-3.5 text-center text-xs text-[#57606a] whitespace-nowrap">
                        {r.recordCount} surat
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Filter and Search Bar for Commodity Table */}
      <div className="flex flex-col sm:flex-row gap-3 bg-[#f6f8fa] p-3.5 border border-[#d0d7de]">
        <div className="flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama komoditas dalam tabel..."
            className="w-full px-3 py-2 text-sm bg-white text-[#1f2328] border border-[#d0d7de] focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
          />
        </div>
        <div className="w-full sm:w-64">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white text-[#1f2328] border border-[#d0d7de] focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
          >
            <option value="ALL">Semua Kategori</option>
            <option value="HEWAN_HIDUP">Hewan Hidup</option>
            <option value="PRODUK_HEWAN">Produk Hewan Segar/Beku</option>
            <option value="OLAHAN_PRODUK_HEWAN">Produk Olahan Peternakan</option>
          </select>
        </div>
      </div>

      {/* Grouped Commodities Calculation Table with Responsive Horizontal Scroll */}
      <div className="border border-[#d0d7de] overflow-hidden bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm text-[#1f2328]">
            <thead className="bg-[#f6f8fa] border-b border-[#d0d7de] font-semibold text-[#57606a] text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3.5">Nama Komoditas</th>
                <th className="py-3 px-3.5">Kategori</th>
                <th className="py-3 px-3.5">Satuan Kustom</th>
                <th className="py-3 px-3.5 text-right">Volume Masuk (Import)</th>
                <th className="py-3 px-3.5 text-right">Volume Keluar (Export)</th>
                <th className="py-3 px-3.5 text-right bg-[#dafbe1]/40 text-[#1a7f37]">
                  Total Volume (Masuk + Keluar)
                </th>
                <th className="py-3 px-3.5 text-right bg-[#ddf4ff]/50 text-[#0969da]">
                  Kuantitas Penyimpanan (Import - Export)
                </th>
                <th className="py-3 px-3.5 text-center">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d0d7de]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-[#57606a]">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-[#1a7f37] rounded rounded-full border-t-transparent animate-spin"></div>
                      <span>Menghitung rekapitulasi data...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-[#57606a]">
                    Tidak ada data rekapitulasi untuk filter yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => {
                  const storageQty = item.currentStorage ?? (item.totalImport - item.totalExport);
                  return (
                    <tr key={idx} className="hover:bg-[#f6f8fa]/70 transition-colors">
                      <td className="py-3 px-3.5 font-semibold text-[#1f2328]">
                        {item.itemName}
                      </td>

                      <td className="py-3 px-3.5">
                        <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-[#f6f8fa] text-[#57606a] border border-[#d0d7de]">
                          {item.category === 'HEWAN_HIDUP'
                            ? 'Hewan Hidup'
                            : item.category === 'PRODUK_HEWAN'
                            ? 'Produk Hewan'
                            : 'Produk Olahan'}
                        </span>
                      </td>

                      <td className="py-3 px-3.5 font-mono text-xs font-semibold text-[#57606a]">
                        {item.unit}
                      </td>

                      <td className="py-3 px-3.5 text-right font-medium text-[#1a7f37]">
                        {item.totalImport.toLocaleString('id-ID')} {item.unit}
                      </td>

                      <td className="py-3 px-3.5 text-right font-medium text-[#0969da]">
                        {item.totalExport.toLocaleString('id-ID')} {item.unit}
                      </td>

                      <td className="py-3 px-3.5 text-right font-bold bg-[#dafbe1]/30 text-[#1a7f37]">
                        {item.totalVolume.toLocaleString('id-ID')} {item.unit}
                      </td>

                      <td
                        className={`py-3 px-3.5 text-right font-bold bg-[#ddf4ff]/30 ${
                          storageQty < 0 ? 'text-[#cf222e]' : 'text-[#0969da]'
                        }`}
                      >
                        {storageQty.toLocaleString('id-ID')} {item.unit}
                      </td>

                      <td className="py-3 px-3.5 text-center text-xs text-[#57606a]">
                        {item.recordCount} surat
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

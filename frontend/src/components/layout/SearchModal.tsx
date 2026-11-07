import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { SUANGGI_BRAND } from '../../constants/brand';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

interface SearchItem {
  title: string;
  category: string;
  path: string;
  keywords: string;
}

const SEARCH_INDEX: SearchItem[] = [
  {
    title: 'Fitur Utama SUANGGI: Pemasukan, Pengeluaran, Pemuktahiran, Monitoring',
    category: 'Beranda SUANGGI',
    path: '/#fitur-utama',
    keywords: 'suanggi sistem informasi lalu lintas hewan data terpadu akurat terkini pemasukan pengeluaran pemuktahiran monitoring',
  },
  {
    title: 'Persyaratan Ternak Sapi, Kambing, & Hewan Hidup',
    category: 'Layanan Publik / Persyaratan',
    path: '/persyaratan#hewan-hidup',
    keywords: 'sapi kambing babi unggas hidup skkh kh-11 rekomendasi pmk antraks pemasukan pengeluaran',
  },
  {
    title: 'Persyaratan Daging Sapi Beku & Cold Chain',
    category: 'Layanan Publik / Persyaratan',
    path: '/persyaratan#produk-hewan',
    keywords: 'daging beku kontainer reefer suhu -18 nkv kh-12 halal produk hewan',
  },
  {
    title: 'Persyaratan Telur Ayam Ras & Bahan Asal Hewan',
    category: 'Layanan Publik / Persyaratan',
    path: '/persyaratan#produk-hewan',
    keywords: 'telur ayam ras rak butir sanitasi cangkang',
  },
  {
    title: 'Persyaratan Produk Olahan (Sosis, Bakso, Kornet)',
    category: 'Layanan Publik / Persyaratan',
    path: '/persyaratan#produk-olahan',
    keywords: 'olahan sosis bakso kornet nugget bpom izin edar kemasan kaleng',
  },
  {
    title: 'Matriks Kelengkapan Dokumen Karantina',
    category: 'Layanan Publik / Persyaratan',
    path: '/persyaratan#tabel-perbandingan',
    keywords: 'tabel matriks skkh rekomendasi kh-11 kh-12 uji lab bpom',
  },
  {
    title: 'SOP Pemeriksaan Klinis & Suhu Rektal Ternak',
    category: 'Layanan Publik / Pemeriksaan',
    path: '/pemeriksaan#tahapan-hewan',
    keywords: 'pemeriksaan klinis dokter hewan suhu rektal fisik antemortem kuku mulut',
  },
  {
    title: 'Pos Pengawasan Pelabuhan Pomako & Bandara Mozes Kilangin',
    category: 'Layanan Publik / Pemeriksaan',
    path: '/pemeriksaan#pos-pemeriksaan',
    keywords: 'pos pomako pelabuhan laut bandara mozes kilangin kargo pintu masuk',
  },
  {
    title: 'Penerbitan Surat Keterangan Kesehatan Hewan (SKKH)',
    category: 'Layanan Publik / Pemeriksaan',
    path: '/pemeriksaan#skkh',
    keywords: 'skkh surat keterangan kesehatan dokter hewan berwenang registrasi',
  },
  {
    title: 'Pemberitahuan Status Web lalin.isikhnas.co.id',
    category: 'Layanan Publik / Status Sistem',
    path: '/isikhnas',
    keywords: 'isikhnas offline gangguan server nasional sop interim manual suanggi',
  },
  {
    title: 'Konsultasi WhatsApp Business Petugas Pelayanan SUANGGI',
    category: 'Layanan Publik / Kontak',
    path: '/konsultasi',
    keywords: 'whatsapp chat wa admin suanggi bantuan tanya nomor telepon kontak',
  },
  {
    title: 'Pemasukan, Pengeluaran & Pemuktahiran Lalu Lintas Hewan (Internal)',
    category: 'Internal Petugas SUANGGI',
    path: '/dashboard',
    keywords: 'dashboard data lalu lintas input tambah import export pemasukan pengeluaran pemuktahiran',
  },
  {
    title: 'Monitoring Statistik & Laporan Lalu Lintas (Kalkulasi Otomatis)',
    category: 'Internal Petugas SUANGGI',
    path: '/dashboard/kalkulasi',
    keywords: 'monitoring statistik laporan kalkulasi hitung otomatis rekapitulasi total volume satuan kustom ekspor csv',
  },
];

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Lock body scroll while modal is active
  useBodyScrollLock(isOpen);

  const filtered = query.trim()
    ? SEARCH_INDEX.filter((item) => {
        const text = `${item.title} ${item.category} ${item.keywords}`.toLowerCase();
        return text.includes(query.toLowerCase());
      })
    : SEARCH_INDEX.slice(0, 6);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = (item: SearchItem) => {
    onClose();
    if (item.path.includes('#')) {
      const [route, hash] = item.path.split('#');
      navigate(route || '/');
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      navigate(item.path);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filtered.length > 0) {
        setSelectedIndex((idx) => (idx + 1) % filtered.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filtered.length > 0) {
        setSelectedIndex((idx) => (idx - 1 + filtered.length) % filtered.length);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        handleSelect(filtered[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-24 px-3 sm:px-4"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="search-modal-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white border border-[#86efac] shadow-2xl max-w-xl w-full overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative border-b border-[#d0d7de] flex items-center">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#15803d]">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                id="search-modal-title"
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Cari layanan SUANGGI, dokumen SKKH, pos, komoditas..."
                className="w-full pl-10 sm:pl-11 pr-14 py-3 sm:py-3.5 text-sm sm:text-base text-[#1f2328] placeholder-[#656d76] focus:outline-none bg-white"
              />
              <button
                type="button"
                onClick={onClose}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-mono font-medium text-[#656d76] hover:text-[#1f2328]"
              >
                <span className="hidden sm:inline bg-[#f6f8fa] border border-[#d0d7de] px-1.5 py-0.5 text-[11px]">ESC</span>
                <span className="sm:hidden text-base">&times;</span>
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-[#d0d7de]/40 p-1.5">
              {filtered.length === 0 ? (
                <div className="py-8 text-center text-sm text-[#656d76]">
                  Tidak ada hasil pencarian untuk &ldquo;{query}&rdquo;
                </div>
              ) : (
                filtered.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full text-left p-3 transition-colors flex flex-col gap-0.5 ${
                        isSelected ? 'bg-[#f0fdf4] text-[#15803d]' : 'text-[#1f2328] hover:bg-[#f6f8fa]/60'
                      }`}
                    >
                      <div className="font-semibold text-sm leading-snug">{item.title}</div>
                      <div className="text-xs text-[#656d76] font-medium">{item.category}</div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="p-3 bg-[#f0fdf4] border-t border-[#bbf7d0] flex items-center justify-between text-xs text-[#14532d]">
              <div className="hidden sm:flex items-center gap-3">
                <span>
                  <kbd className="px-1.5 py-0.5 bg-white border border-[#bbf7d0] text-[11px]">&uarr;</kbd>{' '}
                  <kbd className="px-1.5 py-0.5 bg-white border border-[#bbf7d0] text-[11px]">&darr;</kbd> Navigasi
                </span>
                <span>
                  <kbd className="px-1.5 py-0.5 bg-white border border-[#bbf7d0] text-[11px]">ENTER</kbd> Buka
                </span>
              </div>
              <span className="text-[11px] sm:text-xs font-semibold text-[#14532d]">
                {SUANGGI_BRAND.name} &bull; {SUANGGI_BRAND.region}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="sm:hidden text-xs font-semibold text-[#15803d]"
              >
                Tutup
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

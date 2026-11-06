import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface SearchItem {
  title: string;
  category: string;
  path: string;
  keywords: string;
}

const SEARCH_INDEX: SearchItem[] = [
  {
    title: 'Persyaratan Ternak Sapi, Kambing, & Hewan Hidup',
    category: 'Layanan Publik / Persyaratan',
    path: '/persyaratan#hewan-hidup',
    keywords: 'sapi kambing babi unggas hidup skkh kh-11 rekomendasi pmk antraks',
  },
  {
    title: 'Persyaratan Daging Sapi Beku & Cold Chain',
    category: 'Layanan Publik / Persyaratan',
    path: '/persyaratan#produk-hewan',
    keywords: 'daging beku kontainer reefer suhu -18 nkv kh-12 halal',
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
    keywords: 'isikhnas offline gangguan server nasional sop interim manual',
  },
  {
    title: 'Konsultasi WhatsApp Business Petugas Pelayanan',
    category: 'Layanan Publik / Kontak',
    path: '/konsultasi',
    keywords: 'whatsapp chat wa admin bantuan tanya nomor telepon kontak',
  },
  {
    title: 'Pencatatan Lalu Lintas Hewan (Internal)',
    category: 'Internal Petugas',
    path: '/dashboard',
    keywords: 'dashboard data lalu lintas input tambah import export',
  },
  {
    title: 'Kalkulasi Otomatis (Qty = Masuk + Keluar)',
    category: 'Internal Petugas',
    path: '/dashboard/kalkulasi',
    keywords: 'kalkulasi hitung otomatis rekapitulasi total volume satuan kustom ekspor csv',
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
      navigate(route);
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
      setSelectedIndex((idx) => (idx + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((idx) => (idx - 1 + filtered.length) % filtered.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        handleSelect(filtered[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-20 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-md border border-[#d0d7de] shadow-xl max-w-xl w-full overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative border-b border-[#d0d7de]">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#656d76]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Cari artikel, dokumen, pos, komoditas..."
            className="w-full pl-10 pr-12 py-3 text-sm text-[#1f2328] placeholder-[#656d76] focus:outline-none bg-white"
          />
          <button
            type="button"
            onClick={onClose}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-mono text-[#656d76] hover:text-[#1f2328]"
          >
            ESC
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto divide-y divide-[#d0d7de]/40 p-1 text-xs">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-[#656d76]">
              Tidak ada hasil pencarian untuk "{query}"
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
                  className={`w-full text-left p-2.5 rounded transition-colors flex flex-col ${
                    isSelected ? 'bg-[#f6f8fa] text-[#0969da]' : 'text-[#1f2328] hover:bg-[#f6f8fa]/60'
                  }`}
                >
                  <div className="font-semibold text-xs leading-snug">{item.title}</div>
                  <div className="text-[10px] text-[#656d76] mt-0.5">{item.category}</div>
                </button>
              );
            })
          )}
        </div>

        <div className="p-2.5 bg-[#f6f8fa] border-t border-[#d0d7de] flex items-center justify-between text-[11px] text-[#656d76]">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1 py-0.5 bg-white border border-[#d0d7de] rounded text-[10px]">&uarr;</kbd>{' '}
              <kbd className="px-1 py-0.5 bg-white border border-[#d0d7de] rounded text-[10px]">&darr;</kbd> Navigasi
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-white border border-[#d0d7de] rounded text-[10px]">ENTER</kbd> Buka
            </span>
          </div>
          <span>SI-LANTAS Mimika</span>
        </div>
      </div>
    </div>
  );
};
